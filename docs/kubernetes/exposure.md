---
sidebar_position: 5
title: Exposure
sidebar_label: Exposure
description: "Give each environment a host and each service a path: every deploy commits a Gateway API Gateway per environment and an HTTPRoute per app, with TLS from cert-manager."
keywords: [gateway api, httproute, traefik, cert-manager, tls, subdomain, exposure path]
---

# Exposure

Exposure puts each environment of a project on a host of its own and each service under a path of
that host, through the Kubernetes Gateway API as Traefik implements it. Every deploy commits the
Gateway and the routes, and Argo CD applies them with the rest of the environment.

```
https://<subdomain>.<domain><exposure path>

https://dev.example.com/api/orders   → orders-api in dev
https://example.com/api/orders       → orders-api in production
```

## The three settings

| Where | Field | Example | Effect |
| --- | --- | --- | --- |
| **Settings → Delivery → Exposure** | **Domain** | `example.com` | The domain every environment is exposed under |
| The environment | **Subdomain** | `dev` | The host of the environment: `dev.example.com` |
| The service or Docker frontend | **Exposure path** | `/api/orders` | Where the app answers on the host of every environment |

The **Exposure** section lives on **Settings → Delivery**, below the GitOps section. It appears once
[GitOps](./gitops.md) is on **and** its configuration repository is saved: turning the switch on is
not enough until you press **Save**. Changes apply from the next deploy of each environment.

### Domain and certificate issuer

| Field | Notes |
| --- | --- |
| **Domain** | A lowercase domain of at least two labels. Left empty, the environments are not exposed, and the next deploy removes their Gateway |
| **Certificate issuer** | The cert-manager ClusterIssuer each environment's certificate is asked of: **None (HTTP only)**, `letsencrypt`, `letsencrypt-staging`, or **Other…** to type the **ClusterIssuer name** |
| **Traefik ports** | **HTTP port** and **HTTPS port**: the ports Traefik's `web` and `websecure` entry points listen on inside the pod. `80` and `443` by default |

A Traefik Helm chart left at its defaults listens on `8000` and `8443`: write those under **Traefik
ports** rather than changing Traefik.

### Subdomain of an environment

Set it in the environment form, next to **Kubernetes namespace**. Both fields appear only while GitOps
is on. Left empty, a **Production**
environment takes the domain itself, and any other environment takes its slug in lowercase, so `UAT`
lands on `uat.example.com`. Two environments of the project cannot share a host: the deploy is
refused.

### Exposure path of a service

Set it in the **Runtime** tab of the settings of the service, or of a Docker frontend. The path is the same
in every environment, and the prefix is stripped before the request reaches the container, so the app
answers at its root: a request to `/api/orders/items` reaches the container as `/items`.

A service without an exposure path gets no route: it is reachable only inside the cluster, through
its Kubernetes Service. Two applications of the project at the same path, `/api` and `/api/`
included, refuse the deploy.

## What each deploy commits

| Repository | File | Content |
| --- | --- | --- |
| Configuration | `<environment>/gateway.yaml` | The Gateway of the environment on its host, with an `http` listener and, with an issuer, an `https` one, the cert-manager Certificate it serves, and a route redirecting HTTP to HTTPS |
| Applications, branch of the environment | `<application>.yaml` | The route of the app: the Gateway, the listener and the path |
| Applications, branch of the environment | `microservice-chart/templates/httproute.yaml` | The HTTPRoute template, written once with the rest of the chart |

With an issuer, HTTPS answers carry `Strict-Transport-Security: max-age=31536000`, without
`includeSubDomains`, since an environment on the bare domain would otherwise force HTTPS on every host
under it. Without an issuer, the environments answer in plain HTTP.

## What the cluster needs

1. **The Gateway API CRDs** (`gateway.networking.k8s.io/v1`).
2. **Traefik v3 with its Gateway provider on**, which registers the `traefik` GatewayClass:

   ```yaml
   providers:
     kubernetesGateway:
       enabled: true
   ```

   The Traefik version must support the `URLRewrite` and `ResponseHeaderModifier` filters of
   HTTPRoute: check the Gateway provider page of the Traefik documentation for your version.
3. **For TLS, cert-manager** and the ClusterIssuer set on the project. An issuer that solves HTTP-01
   through an Ingress class (`http01.ingress.class: traefik`) keeps working as long as Traefik's
   Ingress provider stays on. For an issuer that would solve it through the Gateway API, prefer
   DNS-01: it would otherwise have to name the Gateway of each project.

On a cluster still without the Gateway API or cert-manager CRDs, the config maps and secrets of the
environment keep syncing: the Gateway manifests are skipped in Argo CD's dry run rather than failing
the whole Application.

## Where to go next

- [Config maps and secrets](./config-maps-and-secrets.md): configuration for the apps you just exposed
- [Environments](../environments/overview.md): the environment form
