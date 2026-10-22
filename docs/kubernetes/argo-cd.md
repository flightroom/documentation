---
sidebar_position: 3
title: Argo CD
sidebar_label: Argo CD
description: "Hand the GitOps repositories of a project to the Argo CD you already run: prepare its account and token, initialize, and re-align after environment changes."
keywords: [argo cd, applicationset, appproject, gitops, argocd token, sync policy]
---

# Argo CD

**Initialize Argo CD** hands the GitOps repositories of a project to an Argo CD you already run, so
that what each deploy commits is what the cluster runs. Argo CD stays on its own cluster: the console
talks to its API over HTTPS, holds no credentials for your cluster, and every environment is deployed
to the cluster Argo CD runs in.

The section is under **Settings → Delivery → Argo CD**, and appears once [GitOps](./gitops.md) is on
and its configuration repository is saved. Only an owner of the project or an administrator of its
organization can initialize it; the other members see its status.

## Requirements

- **Argo CD 2.8 or later.**
- **Its API reachable from the Flightroom backend over HTTPS**, through an Ingress, a load balancer
  or a private link between the clusters. Argo CD itself never calls Flightroom: it reads the
  repositories from your Git provider.
- **A certificate Node.js trusts.** For a private CA, set `NODE_EXTRA_CA_CERTS` on the Flightroom
  backend.
- **The URL Argo CD answers at**, without `/api/v1` and without redirects: for example
  `https://argocd.example.com`.

Plain `http` is refused, since the token and the repository credentials would cross the network in
the clear. For a local cluster only, the installation can allow it with
`ARGOCD_ALLOW_INSECURE_HTTP=true` on the backend.

## Preparing Argo CD

The console acts in Argo CD as a local account named `orchestrator`, with an API key and no
password. The **Argo CD account permissions** panel in the section shows the same steps. If these
ConfigMaps already hold other keys, add the lines rather than replacing them.

**1. The account**, in `argocd-cm`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  accounts.orchestrator: apiKey
```

**2. Its permissions**, in `argocd-rbac-cm`. Everything the console creates is named `mfe-…`, so the
account can touch only its own objects:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  policy.csv: |
    p, role:orchestrator, projects, *, mfe-*, allow
    p, role:orchestrator, applications, *, mfe-*/*, allow
    p, role:orchestrator, applicationsets, *, mfe-*/*, allow
    p, role:orchestrator, repositories, *, *, allow
    g, orchestrator, role:orchestrator
```

The repositories rule cannot be narrowed the same way: the applications repository is registered
globally, and the rule applies to its URL.

**3. The policy per ApplicationSet**, in `argocd-cmd-params-cm`, then restart
`argocd-applicationset-controller`:

```yaml
data:
  applicationsetcontroller.enable.policy.override: "true"
```

Without it, Argo CD ignores the policy that keeps an application from being deleted when its values
file disappears from a branch by mistake.

**4. The token**, to paste in the settings:

```bash
argocd account generate-token --account orchestrator
```

## Initializing

| Field | What to enter |
| --- | --- |
| **Argo CD URL** | The URL of the Argo CD server, e.g. `https://argocd.example.com` |
| **Argo CD API token** | The token of the `orchestrator` account. Checked against Argo CD before anything is written, stored encrypted when `SECRETS_ENCRYPTION_KEY` is set, and never sent back to the browser |
| **Read-only repository token** | For GitHub and Azure DevOps repositories, a token Argo CD can clone with. Not needed for GitLab |

Argo CD reads the repositories with read-only credentials of its own, never with the token of the
project's connection, which can write:

| Provider | Read-only credentials |
| --- | --- |
| GitLab | Nothing to do. The console creates a deploy token with `read_repository` on each repository and replaces it on every initialization. The connection's token needs the **Maintainer** role on the repositories and the `api` scope |
| GitHub | A fine-grained personal access token with **Contents: Read-only** on the two repositories |
| Azure DevOps | A personal access token with **Code: Read** |

The repository token is required on the first initialization and whenever the URL changes; leave it
empty otherwise to keep the stored one.

Press **Initialize Argo CD**. Once it has gone through, the button becomes **Re-align Argo CD** and
the section shows the date of the last initialization.

Before writing anything, the console checks that every name it is about to take in Argo CD is free
or already its own, and that no repository it registers was registered by someone else. Anything
taken stops the initialization with nothing changed.

## What gets created

`<project>` below stands for `mfe-<project slug>-<hash>`: the hash keeps two projects with the same
slug, in two organizations, apart.

| Object | Name | What it does |
| --- | --- | --- |
| AppProject | `<project>` | Lets the applications of the project read its two repositories only, and deploy only to the namespaces of its environments |
| Repository credentials | One per repository | Read-only, over HTTPS |
| ApplicationSet | `<project>.environments` | One Application per environment, `<project>.<environment>`, syncing the environment's folder of the configuration repository into its namespace |
| ApplicationSet | `<project>.<application>` | With an applications repository, one per service and Docker frontend that has an image and a version. One Application per environment, `<project>.<application>-<environment>`, installing `microservice-chart/` with `<application>.yaml` from the environment's branch |

Every Application syncs automatically, with **prune** and **self-heal**: Argo CD applies each commit
and puts back anything changed by hand in the cluster. The Applications of the services create their
namespace if it does not exist yet.

### What is never deleted

- **Namespaces are never pruned or deleted** by Argo CD, so an emptied repository or a deleted
  Application cannot take running apps down with it.
- **The ApplicationSet of a service never deletes its Applications**, with the policy override
  above. An application whose values file is gone for good is deleted by hand in Argo CD.

### Names and lengths

Argo CD names fit 63 characters; a longer part is cut and ends with a hash. The Helm release of an
application is its slug, and Helm refuses a release name over **53 characters**: an application with a
longer slug fails to sync, with that error in Argo CD. Keep service and frontend slugs shorter.

Two objects of the project that would get the same name stop the initialization: a service
`orders-api` in environment `dev` and a service `orders` in environment `api-dev` would both be
`<project>.orders-api-dev`. Rename one of them.

:::warning[Keep secrets out of the Helm values]
The applications repository is registered globally, so every AppProject of the Argo CD instance can
read it. Secrets belong in the [secrets](./config-maps-and-secrets.md) of the project, which go to the
configuration repository.
:::

## Re-aligning

**After adding or deleting an environment, or changing the GitOps repositories, press Re-align Argo
CD.** A new environment's namespace joins the AppProject only then, and until then deploys leave it
out of the ApplicationSets.

New services and frontends need nothing: every deploy updates the ApplicationSet of each one, so a
service deployed for the first time gets its Applications on its own. A deploy that cannot update
Argo CD still goes through, and the reason shows in the section as *The last deploy did not update
the applications in Argo CD*, until a deploy that does clears it.

When you re-align:

- New environments join the ApplicationSets, once their branch exists.
- Deleted environments leave them. Argo CD deletes the environment's Application, but what it
  deployed stays in the cluster until you remove it; the Applications of the services in that
  environment are left for you to delete by hand.
- The ApplicationSet of a deleted service or frontend is deleted with its Applications; its
  workloads stay in the cluster.
- The credentials of a repository no longer linked are removed from Argo CD, and a GitLab deploy
  token is revoked.

One initialization of a project runs at a time.

## Moving to another Argo CD

Pointing the project at another URL asks for the Argo CD token and the repository token again: the
stored ones are never sent to another server. What the console created on the old instance stays
there: remove its AppProject, ApplicationSets, Applications and repository credentials by hand. GitLab
deploy tokens are revoked for you; a GitHub or Azure DevOps token you pasted is yours to revoke.

## When it fails

The error shows in the section, under *The last initialization failed*, until an initialization goes
through.

| Error | What to check |
| --- | --- |
| Argo CD cannot be reached | The URL, its DNS name, and that the Flightroom backend can reach the Argo CD API |
| The certificate is not trusted | The certificate of Argo CD, or `NODE_EXTRA_CA_CERTS` |
| The token is not accepted | That it is a token of the `orchestrator` account, not expired or revoked |
| The account lacks permissions | The policy in `argocd-rbac-cm` above |
| Argo CD already has an object with that name | An AppProject, Application or ApplicationSet not created by this project: rename or delete it |
| The repository is already registered | A registration made by hand or by another project: remove it from Argo CD |
| The GitLab deploy token was not created | The role and scopes of the GitLab connection |
| Argo CD is already being initialized | Another initialization of the project: wait for it to end |
| Argo CD was initialized with other repositories, or by an earlier version | Initialize again |

## Where to go next

- [Exposure](./exposure.md): give each environment a host and each app a path
- [Rollback](./rollback.md): what a rollback means once Argo CD is in charge
