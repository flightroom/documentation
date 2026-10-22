---
sidebar_position: 8
title: Rolling back a Kubernetes deploy
sidebar_label: Rollback
description: "Why Redeploy does not move what runs in Kubernetes, and how to bring a service back to a known-good state through a new commit that Argo CD applies."
keywords: [rollback, kubernetes rollback, gitops rollback, argo cd, redeploy]
---

# Rolling back a Kubernetes deploy

With GitOps, the cluster runs what the repositories say, and the repositories change only when
someone presses **Deploy**. A rollback of a service is therefore a new deploy that commits the earlier
state, which Argo CD then applies.

## Redeploy does not touch the cluster

**Redeploy**, on a deployment in **History**, re-activates that snapshot in Flightroom. It commits
nothing to Git, so Argo CD has nothing to apply and the containers in Kubernetes keep running what the
last **Deploy** committed. The deployments page then shows the older snapshot as active, while the
cluster still runs the newer one.

That makes **Redeploy** the right tool for microfrontends served by Flightroom, as described in
[Rollback and redeploy](../deployments/rollback-and-redeploy.md), and the wrong one for services and
Docker frontends.

## Rolling back a service

A deploy commits the version each service has in the console, which is the latest version its CI
pipeline registered. Rolling a service back means bringing that version back to good code, then
deploying:

1. In the repository of the service, put the last known-good code back on the branch the pipeline
   builds, for example by reverting the faulty change.
2. On the **Overview** tab of the service, press **Create version** to tag a new version. The button
   is there only when the service has a linked code repository. The dialog asks for the **Branch**,
   offered as a choice only when the repository has more than one, and the **Version**: letters,
   digits, `.`, `-` and `_`, at most 128 characters. The version becomes a Git tag, the tag starts the
   pipeline, and the pipeline builds the image and registers it, so the service moves to it. See
   [Services](./services.md#image-versions).
3. Open **Deployments**, select the environment and press **Deploy**.

The deploy commits the new version to the environment's values file, and Argo CD rolls the workload
over to it.

:::info[The version moves forward only]
A service follows the newest version its pipeline registers. A service with no version yet takes the
first one registered, whatever its tag. After that, a version is taken only when it is a newer semantic
version than the current one, and a tag that is not a semantic version, such as `latest` or a commit
SHA, never moves the service. Registering an older version again therefore does
not roll the service back. Ship the good code as a newer version instead.
:::

## Rolling back configuration

Config maps and secrets roll back the same way: set the previous values again in the console, then
press **Deploy** on the environment. The deployments page shows, for each past deployment, which
**Config maps** and **Secrets** it shipped, which helps you find what changed. Secret values are not
kept in the deployment, so you need to type them again.

## Do not roll back in Git or in the cluster

- **A revert made directly in a GitOps repository** is applied by Argo CD, but the next deploy of the
  environment overwrites it with what the console holds. Make the change in the console, so the next
  deploy keeps it.
- **A change made by hand in the cluster** is undone by Argo CD, which syncs every Application with
  self-heal.

The Git history of both repositories still tells you what each environment ran and when: every deploy
is a commit, authored by the person who pressed **Deploy**. See [GitOps repositories](./gitops.md).

## Where to go next

- [Deploy to Kubernetes](./overview.md): the whole deploy path
- [Argo CD](./argo-cd.md): what syncs the cluster
