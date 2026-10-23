---
sidebar_position: 4
title: Self-host on Kubernetes with Helm
sidebar_label: Helm (Kubernetes)
description: "Install Flightroom on Kubernetes with the official Helm chart: configuration, secrets, persistence of uploaded frontends, ingress and probes."
keywords: [helm, kubernetes, self-hosting, installation, chart, oci, argo cd, ingress, persistent volume]
---

# Self-host on Kubernetes with Helm

Every release publishes the chart to the GitHub Container Registry, as
`oci://ghcr.io/flightroom/charts/flightroom`; its source is
[`helm/flightroom`](https://github.com/flightroom/flightroom/tree/main/helm/flightroom) in the
repository. It installs the standard Flightroom image, which serves the frontend and the API behind
nginx on port `80`.

:::info[MongoDB and Redis are not part of the chart]
The chart deploys the application only. Point it at instances you already run, or install them with
their own charts — there is an example [below](#mongodb-and-redis).
:::

## Prerequisites

- A Kubernetes cluster and [`kubectl`](https://kubernetes.io/docs/tasks/tools/) configured against it
- [Helm](https://helm.sh/) 3.8 or later, for OCI registries
- A MongoDB and a Redis the cluster can reach

## Install

```bash
helm install flightroom oci://ghcr.io/flightroom/charts/flightroom \
  --namespace flightroom --create-namespace \
  --set env.NOSQL_DATABASE_URL="mongodb://root:example@mongodb:27017" \
  --set env.REDIS_URL="redis://redis:6379" \
  --set envSecrets.JWT_SECRET="$(openssl rand -hex 32)"
```

Without `--version` Helm installs the latest chart; pin one with `--version 0.3.0` to keep upgrades
deliberate. `helm show values oci://ghcr.io/flightroom/charts/flightroom` prints the default values.

Reach the console once the pod is ready, and it will answer with the **Initial Setup** screen —
an installation with no users has no login form:

```bash
kubectl port-forward -n flightroom svc/flightroom 8080:80
```

:::caution[Do the first startup before the ingress is open]
That screen is public and ungated, so whoever fills it in first owns the installation. Read
[The first startup](./first-startup.md) before you type a project name into it — the name becomes a
permanent slug, and it mishandles anything longer than two words. Configure the
[ingress](#ingress) after the first account exists, not before.
:::

Useful while you iterate on your values:

```bash
helm template flightroom oci://ghcr.io/flightroom/charts/flightroom -f my-values.yaml
helm test flightroom      # hits /api/echo from inside the cluster
helm upgrade flightroom oci://ghcr.io/flightroom/charts/flightroom -f my-values.yaml
```

### With Argo CD

Register the registry as a Helm repository with OCI enabled, then point the `Application` at it —
`repoURL` takes the registry without the `oci://` scheme and without the chart name:

```bash
argocd repo add ghcr.io/flightroom/charts --type helm --name flightroom --enable-oci
```

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: flightroom
  namespace: argocd
spec:
  project: default
  source:
    repoURL: ghcr.io/flightroom/charts
    chart: flightroom
    targetRevision: 0.3.0
    helm:
      valuesObject:
        env:
          NOSQL_DATABASE_URL: mongodb://root:example@mongodb:27017
          REDIS_URL: redis://redis:6379
  destination:
    server: https://kubernetes.default.svc
    namespace: flightroom
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

Keep the secrets out of the `Application`: create a Secret with `JWT_SECRET` and the other keys and
list it under `existingSecret` (see [Configuration](#configuration)).

### Upgrading from the `mfe-orchestrator` chart

Chart `0.3.0` renamed the chart from `mfe-orchestrator` to `flightroom`. The name is part of the
Deployment selector and of every resource name, so an upgrade of an existing release creates new
resources and deletes the old ones — **including the PersistentVolumeClaim of the uploaded
frontends**. Keep the claim and mount it from the new chart:

```bash
kubectl annotate pvc <release>-mfe-orchestrator-microfrontends helm.sh/resource-policy=keep
helm upgrade <release> oci://ghcr.io/flightroom/charts/flightroom -f my-values.yaml \
  --set persistence.existingClaim=<release>-mfe-orchestrator-microfrontends
```

If the release itself was called `mfe-orchestrator`, the claim is `mfe-orchestrator-microfrontends`.
The Service changes name too, so update whatever addressed it: ingress backends, port-forwards,
network policies.

## Configuration

`values.yaml` lists most of the [environment variables](./environment-variables.md) the application
understands, but not all of them — the AI, repository and Argo CD variables, for example, are not
there. That does not matter: `env` and `envSecrets` are plain maps, so any variable can be added to
them and reaches the container as is.

| Values key | Rendered as | Use for |
| --- | --- | --- |
| `env` | ConfigMap `<release>-env` | Plain configuration |
| `envSecrets` | Secret `<release>-env` | Passwords, client secrets, the JWT key |
| `existingSecret` | `envFrom.secretRef` list | Secrets managed outside the chart (sealed secrets, ESO …) |
| `existingConfigMap` | `envFrom.configMapRef` list | Configuration managed outside the chart |
| `extraEnv` | Container `env` entries | `valueFrom` references (secret keys, field refs) |

```yaml
env:
  FRONTEND_URL: https://console.example.com
  REGISTRATION_ALLOWED: false
  NOSQL_DATABASE_URL: mongodb://root:example@mongodb:27017
  REDIS_URL: redis://redis:6379

envSecrets:
  JWT_SECRET: a-32-bytes-random-string
  SECRETS_ENCRYPTION_KEY: a-base64-or-hex-32-byte-key
  NOSQL_DATABASE_PASSWORD: example

extraEnv:
  - name: GOOGLE_CLIENT_SECRET
    valueFrom:
      secretKeyRef:
        name: google-oauth
        key: client-secret
```

Both maps accept native YAML scalars — values are quoted when rendered, so
`EMAIL_SMTP_PORT: 587` and `REGISTRATION_ALLOWED: true` are fine.

Precedence, from lowest to highest: `env` → `envSecrets` → `existingConfigMap` → `existingSecret`
→ `extraEnv`.

:::caution[An empty value is skipped, not set]
Leaving a value empty or null means the variable is not injected at all and the application keeps
its own default. That is what you want for most of `values.yaml` — with one exception:
`RATE_LIMIT_MAX` is validated as a number, so an empty value fails validation and keeps the
container from starting. It ships commented out for that reason; uncomment it only to set a real
number.
:::

With `restartOnConfigChange: true` (the default) the pods roll automatically when the rendered
ConfigMap or Secret changes, so a `helm upgrade` that only touches configuration still takes
effect.

## Image version

`image.repository` defaults to `lory1990/flightroom` and `image.tag` to the chart's `appVersion`,
which is always the Flightroom release the chart was published with: a plain install runs that
release. Set `image.tag` only to pin a different one:

```yaml
image:
  tag: "5.1.0"
```

Use the standard image here, not the `-all-in-one` tag: the chart expects MongoDB and Redis outside
the pod.

## Storage of the uploaded frontends

Uploaded bundles are stored on a PersistentVolumeClaim mounted at `MICROFRONTEND_HOST_FOLDER`
(default `/upload-microfrontends`); setting `persistence.mountPath` overrides the mount point and
keeps the variable in sync.

```yaml
persistence:
  enabled: true
  size: 20Gi
  storageClass: fast-rwo
  # existingClaim: my-claim
```

With `persistence.enabled: false` the frontends live in the container filesystem and are lost
at every restart.

### More than one replica needs ReadWriteMany

The default claim is `ReadWriteOnce`: it attaches to a single node, and a pod scheduled on another
node never mounts it. So the chart:

- **refuses to render** `replicaCount` above `1`, or `autoscaling.enabled`, when
  `persistence.accessModes` does not include `ReadWriteMany`;
- deploys with the **`Recreate` strategy** on such a volume: a rolling update starts the new pod
  before stopping the old one, and a new pod on another node would wait for the volume forever.

To run several replicas, use a StorageClass that provides `ReadWriteMany` — NFS, Azure Files,
Amazon EFS, CephFS — and the strategy becomes a rolling update with `maxUnavailable: 0`:

```yaml
replicaCount: 2
persistence:
  storageClass: azurefile-csi
  accessModes:
    - ReadWriteMany
```

With `persistence.existingClaim`, set `persistence.accessModes` to the modes of that claim: the
chart cannot read them.

## Repository clones

The repositories edited with AI are cloned inside the pod, under `repositories.mountPath`
(default `/repositories`). The chart always sets `REPOSITORIES_FOLDER` to that path, so do not set
the variable under `env` yourself.

```yaml
repositories:
  mountPath: /repositories
  sizeLimit: 10Gi       # upper bound of the emptyDir
  # existingClaim: my-repositories-claim
```

The folder is a cache — a missing clone is simply cloned again — so it is an `emptyDir` by default,
lost at every restart and never shared between replicas. Point `repositories.existingClaim` at a PVC
to keep the clones across restarts. `sizeLimit` caps the whole folder; the cap per repository is
`env.REPOSITORIES_MAX_SIZE_MB` (see [Environment variables](./environment-variables.md#repositories)).

## Ingress

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: 50m
  hosts:
    - host: console.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: flightroom-tls
      hosts:
        - console.example.com
```

Align `env.FRONTEND_URL` — and `env.BACKEND_URL`, which defaults to `<FRONTEND_URL>/api` — with the
public hostname. The uploads go through this ingress, so raise the body size limit if your bundles
are large.

:::caution[Trust the ingress hop with `TRUST_PROXY`]
The image trusts only its own nginx (`TRUST_PROXY=127.0.0.1`). Behind an ingress controller the
request reaches that nginx from the controller's pod IP, so unless that hop is trusted too every
client shares one rate-limit bucket. List exactly the proxies you run — for example the loopback
plus your pod CIDR — and never `true` on a pod reachable from outside:

```yaml
env:
  TRUST_PROXY: "loopback,10.0.0.0/8"
```

A hop count such as `"2"` stops the boot. The chart's install notes warn when the ingress is enabled
and `env.TRUST_PROXY` is not set.
:::

## MCP server

The `env` block of `values.yaml` has a section for the remote [MCP server](../build-with-ai/mcp-server.md),
off by default. To turn it on, set the public URL and a real signing key — the boot stops with
`MCP_ENABLED` on and `FRONTEND_URL` missing, or with a `JWT_SECRET` shorter than 32 bytes:

```yaml
env:
  FRONTEND_URL: https://console.example.com
  MCP_ENABLED: true
  # MCP_DCR_ENABLED, MCP_CIMD_ENABLED, MCP_API_KEY_ENABLED: default true
  # CIMD_ALLOWED_HOSTS, OAUTH_ISSUER_URL, MCP_RESOURCE_URL: leave empty unless needed
  # MCP_RATE_LIMIT_MAX: 120   # leave commented out: an empty value fails validation

envSecrets:
  JWT_SECRET: <output of openssl rand -hex 32>
```

Every variable of the section is described under
[MCP server and OAuth](./environment-variables.md#mcp-server-and-oauth).

## MongoDB and Redis

Installed alongside, with the Bitnami charts:

```bash
helm install mongodb oci://registry-1.docker.io/bitnamicharts/mongodb \
  --set auth.rootPassword=example
helm install redis oci://registry-1.docker.io/bitnamicharts/redis \
  --set auth.enabled=false

helm install flightroom oci://ghcr.io/flightroom/charts/flightroom \
  --set env.NOSQL_DATABASE_URL="mongodb://root:example@mongodb:27017" \
  --set env.REDIS_URL="redis://redis-master:6379"
```

MongoDB offers transactions only on a replica set. Against a standalone instance the backend
detects it and runs the multi-document operations — creating a deployment among them — without one.

## Health and scaling

- **Probes** hit `/api/echo`, the public health endpoint of the backend. Liveness and readiness are
  on by default; a startup probe is available for slow clusters (`startupProbe.enabled`).
- **Autoscaling** is off by default (`autoscaling.enabled`) and needs a `ReadWriteMany` volume —
  see [More than one replica](#more-than-one-replica-needs-readwritemany).
- **Strategy** follows the volume: `Recreate` on `ReadWriteOnce`, a rolling update with
  `maxUnavailable: 0` on `ReadWriteMany`. Setting `strategy.type` overrides it.

The full values reference is in the
[chart README](https://github.com/flightroom/flightroom/blob/main/helm/flightroom/README.md).
