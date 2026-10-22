---
sidebar_position: 4
title: Self-host on Kubernetes with Helm
sidebar_label: Helm (Kubernetes)
description: "Install Flightroom on Kubernetes with the official Helm chart: configuration, secrets, persistence of uploaded microfrontends, ingress and probes."
keywords: [helm, kubernetes, self-hosting, installation, chart, ingress, persistent volume]
---

# Self-host on Kubernetes with Helm

The chart lives in the repository, under
[`helm/mfe-orchestrator`](https://github.com/flightroom/flightroom/tree/main/helm/mfe-orchestrator).
It installs the standard Flightroom image, which serves the frontend and the API behind nginx on
port `80`.

:::caution[Set the image explicitly]
The chart in the repository still defaults to `lory1990/mfe-orchestrator` at tag `4.0.0`, its
`appVersion`. Releases are now published as `lory1990/flightroom`, so pass the current image on
every install and upgrade — see [Image version](#image-version):

```bash
--set image.repository=lory1990/flightroom --set image.tag=5.1.0
```
:::

:::info[MongoDB and Redis are not part of the chart]
The chart deploys the application only. Point it at instances you already run, or install them with
their own charts — there is an example [below](#mongodb-and-redis).
:::

## Prerequisites

- A Kubernetes cluster and [`kubectl`](https://kubernetes.io/docs/tasks/tools/) configured against it
- [Helm](https://helm.sh/) 3
- A MongoDB and a Redis the cluster can reach
- The repository cloned locally, or a packaged copy of the chart

## Install

```bash
git clone https://github.com/flightroom/flightroom.git
cd flightroom

helm install mfe-orchestrator ./helm/mfe-orchestrator \
  --namespace mfe-orchestrator --create-namespace \
  --set image.repository=lory1990/flightroom \
  --set image.tag=5.1.0 \
  --set env.NOSQL_DATABASE_URL="mongodb://root:example@mongodb:27017" \
  --set env.REDIS_URL="redis://redis:6379" \
  --set envSecrets.JWT_SECRET="$(openssl rand -hex 32)"
```

Reach the console once the pod is ready, and it will answer with the **Initial Setup** screen —
an installation with no users has no login form:

```bash
kubectl port-forward -n mfe-orchestrator svc/mfe-orchestrator 8080:80
```

:::caution[Do the first startup before the ingress is open]
That screen is public and ungated, so whoever fills it in first owns the installation. Read
[The first startup](./first-startup.md) before you type a project name into it — the name becomes a
permanent slug, and it mishandles anything longer than two words. Configure the
[ingress](#ingress) after the first account exists, not before.
:::

To distribute the chart instead of cloning it on every cluster:

```bash
helm package helm/mfe-orchestrator            # -> mfe-orchestrator-<version>.tgz
helm install mfe-orchestrator mfe-orchestrator-<version>.tgz -f my-values.yaml
```

Useful while you iterate on your values:

```bash
helm lint helm/mfe-orchestrator
helm template mfe-orchestrator helm/mfe-orchestrator -f my-values.yaml
helm test mfe-orchestrator      # hits /api/echo from inside the cluster
helm upgrade mfe-orchestrator ./helm/mfe-orchestrator -f my-values.yaml
```

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

`image.tag` defaults to the chart's `appVersion`, and `image.repository` to
`lory1990/mfe-orchestrator`: chart `0.2.0` still ships `appVersion` `4.0.0` under the old image name.
The image is published today as `lory1990/flightroom`, with the release tag (`5.1.0`) as its tag, so
set both:

```yaml
image:
  repository: lory1990/flightroom
  tag: "5.1.0"
```

Use the standard image here, not the `-all-in-one` tag: the chart expects MongoDB and Redis outside
the pod.

## Storage of the uploaded microfrontends

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

With `persistence.enabled: false` the microfrontends live in the container filesystem and are lost
at every restart. If you scale beyond one replica, use a `ReadWriteMany` volume — otherwise keep
`replicaCount: 1`.

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
    - secretName: mfe-orchestrator-tls
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

helm install mfe-orchestrator ./helm/mfe-orchestrator \
  --set env.NOSQL_DATABASE_URL="mongodb://root:example@mongodb:27017" \
  --set env.REDIS_URL="redis://redis-master:6379"
```

MongoDB offers transactions only on a replica set. Against a standalone instance the backend
detects it and runs the multi-document operations — creating a deployment among them — without one.

## Health and scaling

- **Probes** hit `/api/echo`, the public health endpoint of the backend. Liveness and readiness are
  on by default; a startup probe is available for slow clusters (`startupProbe.enabled`).
- **Autoscaling** is off by default (`autoscaling.enabled`). Enable it only with a `ReadWriteMany`
  volume, or the second pod cannot mount the same claim.
- **Strategy** is a rolling update with `maxUnavailable: 0`. On a `ReadWriteOnce` volume, switch
  `strategy.type` to `Recreate` so two pods never fight over the same PVC.

The full values reference is in the
[chart README](https://github.com/flightroom/flightroom/blob/main/helm/mfe-orchestrator/README.md).
