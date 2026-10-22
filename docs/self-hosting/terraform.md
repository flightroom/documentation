---
sidebar_position: 3
title: Self-host with Terraform
sidebar_label: Terraform
description: Install Flightroom with Terraform against Docker infrastructure as code, including the prerequisites and the variables the configuration expects.
keywords: [terraform, infrastructure as code, self-hosting, docker, installation]
---

# Self-host with Terraform

This page provides instructions to install Flightroom using Terraform with Docker infrastructure as code.

## Prerequisites

Before you begin, ensure you have the following installed:

- **[Terraform](https://www.terraform.io/)** (v1.0 or higher) or **[OpenTofu](https://opentofu.org/)** —
  the project's own deployment pipeline runs `tofu`, and every `terraform` command below works the
  same as `tofu`
- **[Docker](https://www.docker.com/)** running on your machine
- **Git** to clone the repository

## Installation Steps

### 1. Clone the Repository

First, clone the Flightroom repository and navigate to the Terraform directory:

```bash
git clone https://github.com/flightroom/flightroom.git
cd flightroom/terraform
```

### 2. Initialize Terraform

Initialize Terraform to download the required providers:

```bash
terraform init
```

This will download the Docker provider (kreuzwerker/docker v3.6.1) and initialize the backend.

### 3. Set the input variables

The root module declares four variables, in `terraform/variables.tf`. Two have no default, so
`plan` and `apply` stop and ask for them until you set them:

| Variable | Default | Description |
| --- | --- | --- |
| `frontend_url` | *(required)* | Public URL the console is reached at, without trailing slash. Passed as `FRONTEND_URL`; the MCP and OAuth URLs are derived from it. |
| `jwt_secret` | *(required, sensitive)* | Signing secret for the console and MCP tokens, at least 32 bytes. Generate it with `openssl rand -hex 32`. Passed as `JWT_SECRET`. |
| `mcp_enabled` | `true` | Exposes the MCP server at `<frontend_url>/api/mcp`. Passed as `MCP_ENABLED`. |
| `anthropic_api_key` | `""` *(sensitive)* | Enables the console assistant when set. Passed as `ANTHROPIC_API_KEY` only when not empty. |

Keep them out of the repository: put them in a `terraform.tfvars` next to `main.tf`, or export them
as `TF_VAR_<name>` in the shell that runs the apply.

```hcl title="terraform/terraform.tfvars"
frontend_url = "http://localhost:8080"
jwt_secret   = "<output of openssl rand -hex 32>"
```

```bash
export TF_VAR_frontend_url="http://localhost:8080"
export TF_VAR_jwt_secret="$(openssl rand -hex 32)"
```

:::caution[`mcp_enabled` is on by default here]
Unlike the container, where `MCP_ENABLED` defaults to `false`, this module turns the MCP server on.
With it on the backend refuses to boot on a `jwt_secret` shorter than 32 bytes or on a placeholder,
so a throwaway value does not get you a running stack. Set `mcp_enabled = false` if you do not want
the MCP server.
:::

### 4. Review the Planned Changes And Apply

Before applying, review what Terraform will create:

```bash
terraform plan
```

This shows all resources that will be created, including:
- Docker networks
- Docker containers
- Docker images

There are no `docker_volume` resources: each container gets a **host bind mount** under
`${path.root}/volumes/` — `volumes/mongodb`, `volumes/redis` and `volumes/mfe-orchestrator` for the
uploaded frontends, mounted at `/var/microfrontends` in the container (the module sets
`MICROFRONTEND_HOST_FOLDER` to match). The directories are created next to the root module, so the state of the
installation lives in your working copy and is deleted with it.

Apply the Terraform configuration to deploy the infrastructure:

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

:::tip
The apply process will create all necessary Docker resources to run Flightroom locally.
:::

### 5. Verify the Deployment

After successful deployment, verify that containers are running:

```bash
docker ps
```

You should see the Flightroom containers up and running.

## Accessing the Application

Once deployed, you can access the application at `http://localhost:8080`.

An installation with no users answers with the **Initial Setup** screen rather than a login form.
Read [The first startup](./first-startup.md) before you fill it in: it is public and ungated, so
whoever reaches it first owns the installation, and the project name you type becomes a permanent
slug.


## Images

| Container | Image |
| --- | --- |
| Flightroom | `lory1990/mfe-orchestrator:development` |
| MongoDB | `mongo:8-noble` |
| Redis | `redis:8.0.2-alpine` |

:::caution[The Flightroom image is not a release]
The module follows the `development` branch: it reads the registry digest of
`lory1990/mfe-orchestrator:development` and pulls again, recreating the container, whenever that
digest changes. Two applies a few weeks apart can therefore bring up different code, and the image
name is not the one releases are published under.

To run a release, change the `name` of the `docker_registry_image` data source in
`terraform/modules/microfronted-orchestrator-hub.tf` to the published image and tag:

```hcl
data "docker_registry_image" "microfrontend_orchestrator_hub" {
  name = "lory1990/flightroom:5.1.0"
}
```

Upgrading is then deliberate: change the tag and apply again.
:::

## Before you call it production

The module is a local development stack, and two of its defaults are unsafe anywhere else:

- **MongoDB credentials are hardcoded.** `terraform/modules/mongo.tf` sets `root` / `example`, and
  the orchestrator's `NOSQL_DATABASE_URL` names the same pair. Change both, together.
- **No `SECRETS_ENCRYPTION_KEY` is set.** The module passes none, so the credentials the console
  stores for a project are written in the clear. Add `SECRETS_ENCRYPTION_KEY=<32 bytes, base64 or
  hex>` to the `env` list in `terraform/modules/microfronted-orchestrator-hub.tf` if the installation
  will hold storage credentials or repository tokens — see
  [Encryption at rest](./encryption-at-rest.md).

`JWT_SECRET` is no longer one of them: it comes from the required `jwt_secret` variable, so keep
that value secret and never reuse an example.

Any other [environment variable](./environment-variables.md) is added the same way, as a
`NAME=value` entry of that `env` list: the module exposes only the four input variables above.

[Docker Compose](./docker-compose.md) warns about the same defaults; the reasoning is there.

## Container Variables

For a complete list of environment variables you can configure, please refer to the [Environment Variables](./environment-variables.md) page.