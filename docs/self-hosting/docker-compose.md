---
sidebar_position: 2
title: Self-host with Docker Compose
sidebar_label: Docker Compose
description: Install Flightroom with Docker Compose, bringing up MongoDB, Redis and the application together from the official image on Docker Hub.
keywords: [docker compose, self-hosting, installation, mongodb, redis]
---

# Self-host with Docker Compose

This page provides instructions to install Flightroom using Docker Compose.

You can find the official docker repo on [dockerhub](https://hub.docker.com/r/lory1990/flightroom)

## Prerequisites

Before you begin, ensure you have the following prerequisites:

- [Docker](https://docs.docker.com/get-started/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/)

## Start the configuration container

1. Create a `docker-compose.yaml` file with the following content:

```yaml
services:
  mongodb:
    image: mongo:8.0
    container_name: mongodb
    restart: always
    ports:
      - '27017:27017'
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: example
      MONGO_INITDB_DATABASE: microfrontend-orchestrator
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "'db.runCommand({ ping: 1 })'"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:8-alpine
    container_name: redis
    restart: always
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  flightroom:
    image: lory1990/flightroom:5.1.0
    container_name: flightroom
    restart: always
    ports:
      - '8080:80'
    environment:
      NOSQL_DATABASE_URL: mongodb://root:example@mongodb:27017
      REDIS_URL: redis://redis:6379
      MICROFRONTEND_HOST_FOLDER: /upload-microfrontends
      # Once a day this installation sends an anonymous ping with aggregate
      # counters only (version, number of projects/frontends/environments/
      # users, deployments of the last week). No names, no URLs, no personal
      # data. Uncomment the line below to turn it off.
      # TELEMETRY_DISABLED: "true"
      # Remote MCP server for AI clients (Claude, Cursor, VS Code). Needs
      # FRONTEND_URL (the public URL of the console) and a JWT_SECRET of your
      # own: at least 32 bytes, generate it with `openssl rand -hex 32` (the
      # backend refuses to start on a placeholder or a short one).
      # MCP_ENABLED: "true"
      # FRONTEND_URL: https://console.example.com
      # JWT_SECRET: <output of openssl rand -hex 32>
    volumes:
      - upload_microfrontends:/upload-microfrontends
    depends_on:
      - mongodb
      - redis

volumes:
  mongodb_data:
  redis_data:
  upload_microfrontends:
```

:::note[This is not a copy of the repository's file]
The [`docker-compose.yaml`](https://github.com/flightroom/flightroom/blob/main/docker-compose.yaml)
in the repository has the same services but names `lory1990/flightroom:all-in-one`, a tag rebuilt
from the branches that also starts its own MongoDB and Redis inside the container. Use the content
above, which pins the standard `5.1.0` image, rather than downloading that file as is.
:::

The commented block at the end of `environment` turns on the remote
[MCP server](../build-with-ai/mcp-server.md). Uncomment all three lines together: with
`MCP_ENABLED` on, the backend refuses to start without `FRONTEND_URL` or with a `JWT_SECRET`
shorter than 32 bytes.

2. Run the following command to start the container:
```bash
docker compose up -d
```

3.  Open `http://localhost:8080` and wait for the server to come up. This can take up to 2 minutes. Once the server is up and running, you can access Flightroom at `http://localhost:8080`.

4. Once the page loads, an installation with no users shows the **Initial Setup** screen: enter your
    `email`, `password` and first project name to start using the Hub.

:::caution[Do the first startup before the address is reachable by anybody else]
That screen is public and ungated, so whoever fills it in first owns the installation. Read
[The first startup](./first-startup.md) before you type a project name into it — the name becomes a
permanent slug, and it mishandles anything longer than two words.
:::

## Before you call it production

- **Pin the version.** The file above names `lory1990/flightroom:5.1.0` on purpose: the
  `latest` tag is rebuilt from the development branches on every push, so it is not a release
  channel. Bump the tag deliberately, when you decide to upgrade. The same goes for `mongo:8.0` and
  `redis:8-alpine`.
- **Set your own `JWT_SECRET`.** Without it the tokens are signed with the built-in default. Use
  `openssl rand -hex 32`: with the MCP server on, anything shorter than 32 bytes stops the boot.
- **Set `FRONTEND_URL`** to the public URL of the console. It is the base of the links in the
  invitation and password-reset emails, and it has no default.
- **Set a `SECRETS_ENCRYPTION_KEY`.** 32 bytes, base64 or hex — `openssl rand -base64 32`. Without
  it the credentials a project stores (bucket keys, storage connection strings, repository tokens)
  are written to MongoDB in the clear, and the backend logs a warning at boot saying so. Keep the
  value: it is what reads those records back. See
  [environment variables](./environment-variables.md#secrets-encryption).
- **Change the MongoDB credentials.** `root` / `example` is a getting-started convenience, and the
  database port is published on the host in this file.
- **Consider a replica set.** MongoDB offers transactions only on a replica set; on the standalone
  `mongod` above the backend detects it and runs the multi-document operations — creating a
  deployment among them — without one.
- **Keep the volumes.** `upload_microfrontends` holds the uploaded bundles: losing it means the
  builds served from the internal storage are gone.

Every variable you can set is listed on the
[Environment variables](./environment-variables.md) page.


