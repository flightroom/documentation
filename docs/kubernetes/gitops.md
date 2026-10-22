---
sidebar_position: 2
title: GitOps repositories
sidebar_label: GitOps
description: "Turn on GitOps and every Deploy commits the namespace, config maps, secrets and Helm values of an environment to your repositories before anything is recorded as deployed."
keywords: [gitops, configuration repository, applications repository, helm values, audit trail]
---

# GitOps repositories

With GitOps on, every **Deploy** commits what it ships to Git first. The repositories, not the
console, say what each environment runs, and Argo CD applies them to the cluster.

GitOps lives under **Settings → Delivery**, in the section **GitOps for environments, config maps
and secrets**.

## Turning it on

1. Turn on **Commit to a repository on every Deploy**.
2. Under **Configuration repository**, pick a **Connection** of the project and a **Repository**, or
   choose **+ Create a new repository** and type the **Name of the new repository**. A new repository
   is created private, when you save, with a first commit holding a README.
3. To deploy services to Kubernetes, turn on **Also commit the applications** and pick, or create,
   the **Applications repository** the same way.
4. Press **Save**.

The connections are the [code repository connections](../repositories/connect/github.md) of the
project. Without one, the section asks you to add one in **Code Repositories** first.

Saving commits nothing. Each **Deploy** commits what it ships, and the repositories fill up one
environment at a time as you deploy them.

Only an owner of the project (**Admin** in the console) or an administrator of its organization can
change these settings: they decide where the secrets of the project are pushed. Anyone else gets
*Only an owner of the project can change the GitOps settings*.

## What a deploy commits

### Configuration repository

On its default branch, one folder per environment, named as the environment slug:

| File | Content |
| --- | --- |
| `<environment>/namespace.yaml` | The Namespace of the environment |
| `<environment>/gateway.yaml` | The Gateway, Certificate and HTTPS redirect of the environment, when the project has an [exposure](./exposure.md) domain |
| `<environment>/configMaps/<name>.yaml` | A ConfigMap per config map of the project, with the values of that environment |
| `<environment>/secrets/<name>.yaml` | A Secret per secret of the project, with the values of that environment, base64 encoded |

A key left empty in an environment is left out of its manifest, so the container does not get it
there.

### Applications repository

One branch per environment, named as its slug. A branch that does not exist yet is created from the
default branch on the first deploy of that environment.

| Path | Content |
| --- | --- |
| `<application>.yaml` | The Helm values of each service and Docker frontend: image, version, port, probes, the config maps and secrets it attaches and, when exposed, its route |
| `microservice-chart/` | The Helm chart every application is installed with |

The chart is written only when the branch does not have it yet. After that it is yours: change its
resources or templates as your cluster needs, and deploys leave it alone. The values files, on the
other hand, are rewritten by every deploy.

:::warning[Do not edit the generated files]
The manifests in the configuration repository and the values files in the applications repository
are overwritten by the next deploy of the environment. Change the configuration in the console
instead, and deploy.
:::

### What is cleaned up

A deploy also removes the files the console wrote that no longer correspond to anything: the
manifest of a deleted config map or secret, the folder of a deleted environment, the values file of
a deleted service. A file without the console's `app.kubernetes.io/managed-by: mfe-orchestrator`
marker is someone else's and is never touched.

## When it fails

The commits come before the deployment is recorded, so the console and Git cannot disagree:

- **A commit fails:** the deploy does not start, with *The commit to &lt;repository&gt; did not go
  through (…): nothing was deployed or saved*.
- **The deployment cannot be recorded after the push:** the console commits the files back to what
  the branches held before, so Git does not claim a deploy that did not happen.
- **Another deploy of the project is being committed:** the second one waits up to 30 seconds, then
  stops with *Another deploy is being committed to the GitOps repository: try again in a moment*.

Some deploys are refused before anything is pushed, because the cluster would not accept them:

| Refusal | Fix |
| --- | --- |
| The environment slug cannot be a Kubernetes namespace | Set a valid **Kubernetes namespace** on the environment: up to 63 lowercase letters, digits and dashes |
| The subdomain of an environment is not valid | Fix its **Subdomain**. See [Exposure](./exposure.md) |
| Two environments are exposed on the same host | Give each one a subdomain of its own |
| Two services are exposed at the same path | Give each one an exposure path of its own |

## Who can deploy

With GitOps on, a deploy pushes to your Git provider with the token of the connection. A **Viewer**
of the project is refused with *A viewer cannot deploy what is committed to the GitOps
repositories*. Every other member can deploy.

A member scoped to a functional domain writes the values of their own domain's applications only,
and a **Deploy &lt;domain&gt;** writes the values of that domain only. In both cases the config maps
and secrets of the environment are still committed as they are now.

## Git as the audit trail

Every deploy is a commit named `Deploy <environment>`, authored by the person who pressed
**Deploy**; a deploy made with an API key is signed by the console itself. Only the files that
changed are committed, so the history of a repository reads as the history of its environments:
who changed which value, and when.

## Keep the configuration repository private

:::danger[Secrets are committed base64 encoded, not encrypted]
Base64 is an encoding: anyone who can read the configuration repository, or its history, can decode
the values of the secrets. Use a private repository and restrict who can read it. The console
creates new repositories private for this reason.
:::

Never put a secret in a service's Helm values either: the applications repository is readable by
every project of the Argo CD instance. Secrets belong in the [secrets](./config-maps-and-secrets.md)
of the project.

## Where to go next

- [Argo CD](./argo-cd.md): hand these repositories to Argo CD
- [Config maps and secrets](./config-maps-and-secrets.md): what ends up in `configMaps/` and `secrets/`
