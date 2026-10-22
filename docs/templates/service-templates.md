---
sidebar_position: 0
title: Service and agent templates
sidebar_label: Service templates
description: "The four backend templates every new service or agent starts from: Node.js & Fastify, Python & FastAPI, Spring Boot and Quarkus, each a Docker image with health checks, an OpenAPI description and CI."
keywords: [templates, backend service, ai agent, fastify, fastapi, spring boot, quarkus, docker]
---

# Service and agent templates

Every new **service** starts from a template, whether you create it yourself or the AI proposes it
while [generating a domain](../build-with-ai/generate-a-domain.md). The AI never starts from a blank
page: it writes on top of a repository your engineers can read, that already builds, packages and
reports its health.

An agent is a service too. It is usually built on the Python & FastAPI or the Node.js & Fastify
template, and reviewed and deployed exactly like any other service.

## The catalogue

| Template | Language | Liveness | Readiness | OpenAPI | API docs |
| --- | --- | --- | --- | --- | --- |
| **Node.js & Fastify** | TypeScript | `/health/live` | `/health/ready` | `/openapi.json` | `/docs` |
| **Python & FastAPI** | Python | `/health/live` | `/health/ready` | `/openapi.json` | `/docs` |
| **Spring Boot** | Java | `/actuator/health/liveness` | `/actuator/health/readiness` | `/v3/api-docs` | `/swagger-ui/index.html` |
| **Quarkus** | Java | `/q/health/live` | `/q/health/ready` | `/q/openapi.json` | `/q/swagger-ui/` |

All four listen on port `8080` and are packaged as a Docker image. When the service is
[deployed to Kubernetes](../kubernetes/overview.md), its liveness and readiness probes point at the
paths above, so the cluster knows when it is up from the first deploy.

## What a template gives you

- **A Dockerfile**, so the CI pipeline produces the image Kubernetes runs.
- **CI pipeline definitions** for GitHub Actions, GitLab CI and Azure Pipelines.
- **Health checks and an OpenAPI description** at the paths in the table.
- **An `AGENTS.md` and a `CLAUDE.md`**, so any coding agent — Flightroom's or your own — knows the
  conventions of the repository from its first commit.
- **Tests**, which your CI runs on every branch the AI pushes. The AI itself cannot change CI
  configuration or lockfiles: see [Guardrails](../build-with-ai/guardrails.md).

The templates are MIT licensed and live on GitHub as `flightroom/template-service-node-fastify`,
`template-service-python-fastapi`, `template-service-spring-boot` and `template-service-quarkus`.

## Web interfaces

Web interfaces start from the [microfrontend templates library](./templates-library.md): React,
Angular and Vue with Vite or Webpack, plus Web Component, single-spa and micro-lc. When the AI
generates a domain, it proposes a template for each component, and you can change it before
anything is created.
