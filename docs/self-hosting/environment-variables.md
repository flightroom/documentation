---
sidebar_position: 5
title: Container environment variables
sidebar_label: Environment variables
description: "Every environment variable that configures the Flightroom container: database connections, authentication providers, email services and more."
keywords: [environment variables, container configuration, self-hosting, reference]
---

# Container environment variables

Environment variables allow you to configure the Flightroom container according to your specific needs. These variables control various aspects of the application, from database connections to authentication providers and email services.

## How to Configure

You can set environment variables in different ways depending on your deployment method:

- **Docker**: Use the `-e` flag: `docker run -e VARIABLE_NAME=value`
- **Docker Compose**: Add them to the `environment` section in your `docker-compose.yml`
- **Terraform**: `frontend_url`, `jwt_secret`, `mcp_enabled` and `anthropic_api_key` are input
  variables; add any other one to the container's `env` list — see [Terraform](./terraform.md#3-set-the-input-variables)
- **Helm**: Put the plain ones under `env` and the sensitive ones under `envSecrets` in
  `values.yaml` — see [Helm](./helm.md#configuration)

:::tip
For security-sensitive values like passwords and secrets, consider using Docker secrets or environment variable files (`.env`) that are not committed to version control.
:::

## Available Variables

:::note["Default Value" means what the schema declares]
The container validates its environment against a fixed schema, and most variables have no default
in it. Where the column below reads *(no default)* the variable is genuinely unset unless you set
it — the platform logs a warning and does not connect, it does not fall back to `localhost`. The
`root` / `example` credentials you see elsewhere in these pages are the
[Docker Compose](./docker-compose.md) fixture, not a fallback the application applies.
:::

### General Configuration
| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `FRONTEND_URL` | *(no default)* | Public URL of the console, for example `https://console.example.com`. **Set it**: it is the base of every link in the invitation, activation and password-reset emails, the fallback `BACKEND_URL` is built from, and the address of the MCP consent page — with `MCP_ENABLED=true` and no `FRONTEND_URL` the boot stops. |
| `BACKEND_URL` | *(empty, falls back to `FRONTEND_URL` + `/api`)* | Public URL of the API, written into the generated configuration. |
| `PORT` | `3000` | Port the backend listens on, behind the in-container nginx. |
| `NODE_ENV` | `prod` *(development/prod/test/local)* | Node.js environment mode. Any other value stops the boot. |
| `REGISTRATION_ALLOWED` | `true` | **Hides the *Register* link; it does not close the route.** The backend reads it in one place only, to build the `canRegister` flag the console uses to decide what to render. With it set to `false` both `POST /users/registration` and `POST /startup/registration` still create usable accounts. See [The first startup](./first-startup.md#the-endpoint-stays-open). |
| `ALLOW_EMBEDDED_LOGIN` | `true` | If `true`, enables the login system within the application. |
| `MICROFRONTEND_HOST_FOLDER`| `/upload-microfrontends` | Folder containing the uploaded frontend bundles. |
| `ALLOWED_ORIGINS` | *(empty)* | List of allowed URLs for cross-origin requests comma separated. |
| `ALLOWED_SERVE_ORIGINS` | *(falls back to `ALLOWED_ORIGINS`)* | The same list, applied only to the `/serve/*` endpoints your host applications call. |
| `RATE_LIMIT_MAX` | `100` | Requests per IP per minute. An empty value fails validation — leave it unset to keep the default. |
| `MARKETING_OPT_IN_ENABLED` | `false` | If `true`, the registration form collects a marketing consent, which the [profile page](../account/profile.md#marketing-communications) can then change. The platform records the consent and never sends a commercial email of its own. |
| `MARKETING_OPT_IN_VERSION` | `1` | Version of the consent text, stored together with the consent, so an old consent stays attributable to the wording it was given for. |
| `NPM_REGISTRY_URL` | `https://registry.npmjs.org` | Registry queried by the dependency analysis for published versions. |

### Database Configuration

#### MongoDB
| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `NOSQL_DATABASE_URL` | *(no default)* | MongoDB connection URL, for example `mongodb://root:example@mongodb:27017`. Unset, the backend logs *"Cannot see MongoDB database URL, will not connect"* and starts with no database at all. |
| `NOSQL_DATABASE_NAME` | *(no default)* | MongoDB database name, for example `microfrontend-orchestrator`. |
| `NOSQL_DATABASE_USERNAME` | *(no default)* | MongoDB username. `root` is the Compose fixture, not a default. |
| `NOSQL_DATABASE_PASSWORD` | *(no default)* | MongoDB password. `example` is the Compose fixture, not a default. |

#### Redis
| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `REDIS_URL` | *(no default)* | Redis connection URL, scheme included — `redis://host:6379` or `rediss://host:6379` for TLS. Unset, the backend logs *"Cannot see redis URL, will not connect"* and runs without Redis. |
| `REDIS_PASSWORD` | *(empty)* | Password for Redis access. The username is always `default`; a Redis fronted by another ACL user cannot be configured. |

### Email Configuration (SMTP)
| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `EMAIL_SMTP_HOST` | *(no default)* | SMTP server host. It is the switch for the whole feature: unset, the platform sends no email — no invitations, no password resets. |
| `EMAIL_SMTP_PORT` | `587` | SMTP server port (e.g., 587 for TLS). |
| `EMAIL_SMTP_SECURE` | `false` | If `true`, uses secure connection (SSL/TLS). |
| `EMAIL_SMTP_USER` | *(empty)* | Username for SMTP authentication. |
| `EMAIL_SMTP_PASSWORD` | *(empty)* | Password for SMTP authentication. |
| `EMAIL_SMTP_FROM` | *(no default)* | Sender email address, for example `no-reply@example.com`. |

:::danger[Five console screens exist only because these are set]
Account activation, password recovery, password reset and both invitation acceptance screens are all
reached through a token delivered by email, and by no other means. With `EMAIL_SMTP_HOST` unset an
installation cannot activate an account, cannot reset a password and cannot confirm an invitation —
and the password reset reports success while sending nothing.

[Activation, password reset and invitations](../account/email-flows.md) sets out what each flow does
in that state.
:::

### Security & Authentication

#### JWT
| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `JWT_SECRET` | `your-secret-key` | Secret key for JWT generation and validation. Read directly from the process environment, not through the schema. |

:::caution[The JWT default is a published constant]
`your-secret-key` is in the source, so an installation that leaves `JWT_SECRET` unset signs its
tokens with a key anybody can read. Set one — `openssl rand -hex 32` — everywhere except the
all-in-one image, which generates one into its volume on the first start.

With `MCP_ENABLED=true` this stops being advice: the boot refuses to start when `JWT_SECRET` is
unset, is a placeholder (`change-me`, `changeme`, `your-secret-key`, `secret`) or is shorter than
32 bytes.
:::

#### Secrets encryption

| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `SECRETS_ENCRYPTION_KEY` | *(empty)* | 32 bytes, base64 or hex. Encrypts the credentials the console stores for a project — bucket keys, storage connection strings, service account files, repository tokens — and stops the API from returning them. |

Generate one with `openssl rand -base64 32`. Two things to know before you set it:

- **Unset, those credentials are stored in the clear** and the backend says so in a warning at boot.
  Anybody who reads the database — a dump, a backup, a hosted MongoDB you do not own — reads usable
  credentials.
- **A value of the wrong length stops the boot.** The key is validated at startup and a key that
  does not decode to exactly 32 bytes fails the container rather than silently doing nothing. The
  same applies to changing a key once values have been written with it: the old key is what reads
  them back.

The full treatment — the threat model, the exact list of encrypted fields, why global variables stay
in the clear on purpose, and what losing the key costs — is on
[Encryption at rest](./encryption-at-rest.md).

#### Auth0
| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `AUTH0_DOMAIN` | *(empty)* | Auth0 tenant domain. |
| `AUTH0_CLIENT_ID` | *(empty)* | Client ID of the Auth0 application. |
| `AUTH0_AUDIENCE` | *(empty)* | API Audience configured in Auth0. |
| `AUTH0_SCOPE` | `openid profile email` | OAuth scopes requested at login. Served to the frontend but not applied by it — see [Auth0](./enable-sso/Auth0.md). |

#### Azure Entra ID
| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `AZURE_ENTRAID_TENANT_ID` | *(empty)* | Azure Entra ID tenant ID. |
| `AZURE_ENTRAID_CLIENT_ID` | *(empty)* | Client ID of the registered Azure application. |
| `AZURE_ENTRAID_REDIRECT_URI` | *(empty)* | No effect: the console always uses its own origin as redirect URI. |
| `AZURE_ENTRAID_AUTHORITY` | `https://login.microsoftonline.com` | No effect: the console builds the authority as `https://login.microsoftonline.com/<tenant id>`. |
| `AZURE_ENTRAID_SCOPES` | `openid profile email` | No effect: served to the frontend, which does not apply it. |
| `AZURE_ENTRAID_API_AUDIENCE` | *(empty)* | Optional extra audience the backend accepts on an Entra ID token, next to the client ID. See [Azure](./enable-sso/Azure.md#variables-that-are-read-but-have-no-effect). |

#### Google OAuth
| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `GOOGLE_CLIENT_ID` | *(empty)* | Client ID for Google OAuth authentication. |
| `GOOGLE_CLIENT_SECRET` | *(empty)* | Client secret for Google OAuth authentication. |
| `GOOGLE_REDIRECT_URI` | *(empty)* | Redirect URI sent with the code-for-token exchange; it must be the value Google expects for the popup code — see [Google](./enable-sso/Google.md). |
| `GOOGLE_AUTH_SCOPE` | `https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile` | Served to the frontend but not applied: the login button requests `openid profile email`. |
| `GOOGLE_AUTH_HOSTED_DOMAIN` | *(empty)* | Served to the frontend, which does not apply it: it does **not** restrict the login to a Workspace domain. See [Google](./enable-sso/Google.md#variables-that-are-read-but-have-no-effect). |
| `GOOGLE_API_AUDIENCE` | *(empty)* | Served to the frontend and not used. No effect. |

#### GitHub (code repositories)
| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `CODE_REPOSITORY_GITHUB_CLIENT_ID` | *(empty)* | Client ID for the GitHub OAuth application used to connect repositories. |
| `CODE_REPOSITORY_GITHUB_CLIENT_SECRET` | *(empty)* | Client secret of the same application. |

### Proxy

| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `TRUST_PROXY` | *(empty in the schema; `127.0.0.1` in both images)* | Which proxies the backend trusts for the client IP it rate-limits on. `true` trusts every hop; anything else is a comma-separated list of addresses or CIDRs, for example `loopback,10.0.0.0/8`. |

Both published images set `TRUST_PROXY=127.0.0.1`, which trusts the nginx inside the container and
nothing else. That is right when clients reach the container directly. Behind an ingress controller
or a load balancer, the extra hop must be trusted too — add its address or CIDR to the list —
otherwise every request appears to come from the proxy and all clients share one rate-limit bucket.

:::caution[A hop count stops the boot]
A plain number such as `TRUST_PROXY=1` is refused at startup. List the proxies instead.
:::

### MCP server and OAuth

The remote [MCP server](../build-with-ai/mcp-server.md) and the OAuth authorization server in front
of it. Everything below except `MCP_ENABLED` only matters once it is on.

| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `MCP_ENABLED` | `false` | Turns on `/api/mcp` and the OAuth endpoints. Requires `FRONTEND_URL` and a `JWT_SECRET` of at least 32 bytes, or the boot stops. |
| `MCP_DCR_ENABLED` | `true` | Dynamic client registration (RFC 7591). |
| `MCP_CIMD_ENABLED` | `true` | Client ID metadata documents. |
| `CIMD_ALLOWED_HOSTS` | *(empty: any host)* | Comma-separated hosts allowed to publish a client metadata document. |
| `MCP_API_KEY_ENABLED` | `true` | Lets a client that cannot do OAuth use a project [API key](../ci-cd/api-keys.md) on `/api/mcp`. |
| `MCP_RATE_LIMIT_MAX` | `120` | MCP requests per minute for each grant or API key, on top of `RATE_LIMIT_MAX` per IP. |
| `OAUTH_ISSUER_URL` | *(falls back to `BACKEND_URL`, then `FRONTEND_URL` + `/api`)* | The issuer of the MCP tokens and the base of every OAuth endpoint. Set it only when it cannot be derived. |
| `MCP_RESOURCE_URL` | *(falls back to the issuer + `/mcp`)* | The resource the access tokens are minted for. |

### AI

The system AI, offered to every organization next to the AIs it defines itself. Which provider
needs which variables, and what the organizations see, is on [AI models](../build-with-ai/ai-models.md).

| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `AI_PROVIDER` | *(empty)* | `anthropic`, `azure-foundry`, `gemini`, `azure-openai` or `aws-bedrock`. Unset, an `ANTHROPIC_API_KEY` alone turns Claude on; with neither there is no system AI. |
| `ANTHROPIC_API_KEY` | *(empty)* | API key for `anthropic`. |
| `ANTHROPIC_MODEL` | `claude-opus-5-5` | Model for `anthropic`. |
| `AZURE_FOUNDRY_RESOURCE` | *(empty)* | Resource name of Claude on Microsoft Foundry (`https://<resource>.services.ai.azure.com`). Required with `azure-foundry`. |
| `AZURE_FOUNDRY_API_KEY` | *(empty)* | API key, required with `azure-foundry`. |
| `AZURE_FOUNDRY_MODEL` | `claude-opus-5-5` | Deployment name of the Claude model on Foundry. |
| `GEMINI_API_KEY` | *(empty)* | API key, required with `gemini`. |
| `GEMINI_MODEL` | *(no default)* | Required with `gemini`: no model is assumed. |
| `AZURE_OPENAI_ENDPOINT` | *(empty)* | `https://<resource>.openai.azure.com/`. Required with `azure-openai`. |
| `AZURE_OPENAI_API_KEY` | *(empty)* | API key, required with `azure-openai`. |
| `AZURE_OPENAI_DEPLOYMENT` | *(empty)* | Deployment of the GPT model, required with `azure-openai`. |
| `AZURE_OPENAI_REASONING` | `false` | `true` for reasoning deployments (o-series, GPT-5 and later). |
| `AZURE_OPENAI_ENDPOINT_SUFFIXES` | *(empty)* | Extra host suffixes an Azure OpenAI endpoint may use besides the public cloud's, comma separated — for sovereign clouds. |
| `AWS_BEDROCK_REGION` | *(empty)* | Required with `aws-bedrock`. |
| `AWS_BEDROCK_ACCESS_KEY_ID` | *(empty)* | Required with `aws-bedrock`. |
| `AWS_BEDROCK_SECRET_ACCESS_KEY` | *(empty)* | Required with `aws-bedrock`. |
| `AWS_BEDROCK_MODEL` | *(no default)* | Model id or inference profile, required with `aws-bedrock`. |
| `AI_MAX_EFFORT` | *(empty: every level)* | Highest reasoning effort users may pick with the system AI: `low`, `medium`, `high`, `xhigh` or `max`. Any other value fails validation. |
| `ASSISTANT_RATE_LIMIT_MAX` | `20` | Assistant questions per IP per minute. |

:::caution[A provider without its credentials stops the boot]
An `AI_PROVIDER` that is not one of the five values, or that is missing one of the variables it
requires, fails the container at startup rather than at the first question.
:::

### Repositories

Where the repositories behind the frontends are cloned to be edited with AI. The folder is a
cache: deleting it only costs a new clone.

| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `REPOSITORIES_FOLDER` | `/repositories` (`/data/repositories` in the all-in-one image) | Root of the clones, laid out as `<org>/<project>/<frontend>`. |
| `REPOSITORIES_MAX_SIZE_MB` | `500` | A repository bigger than this on disk is refused, and removed, after the clone. |
| `REPOSITORIES_EVICT_AFTER_DAYS` | `14` | Working copies not used for this many days are deleted. |

### Argo CD

| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `ARGOCD_ALLOW_INSECURE_HTTP` | `false` | Lets a project use an Argo CD served over plain `http`. For a local cluster only: the Argo CD token and the repository credentials cross the network in the clear. See [Argo CD](../kubernetes/argo-cd.md). |

### Observability and telemetry

Self-hosted installations send one anonymous ping per day — aggregate counters only, no names, no
URLs, no personal data — and it can be turned off with any of the three switches below. The exact
payload, the full precedence of the switches and the endpoint that shows what your own installation
would send are on [Telemetry](./telemetry.md).

| Variable | Default Value | Description |
|-----------|---------------|-------------|
| `TELEMETRY_DISABLED` | *(empty)* | If `true`, turns off the anonymous telemetry ping. |
| `DO_NOT_TRACK` | *(empty)* | If `1`, turns off the anonymous telemetry ping. |
| `TELEMETRY_ENABLED` | *(empty)* | Explicit switch for the telemetry ping. |
| `TELEMETRY_ENDPOINT` | `https://telemetry.mfe-orchestrator.dev/api/telemetry/self-hosted` | Where the anonymous ping is sent. |
| `TELEMETRY_INTERVAL_HOURS` | `24` | Hours between two pings. |
| `SENTRY_DSN` | *(empty)* | Sentry DSN of the backend. Leave empty to disable error reporting. Read directly from the process environment. |

:::note[Variables outside this list are ignored]
The container validates its configuration against a fixed schema and drops anything it does not
know, so a misspelled name fails silently rather than being picked up. `LOG_LEVEL` and
`AZURE_ENTRAID_CLIENT_SECRET`, which earlier versions of this page listed, are read by nothing.

Three variables in the tables above are the exception: `JWT_SECRET`, `SENTRY_DSN` and
`NPM_REGISTRY_URL` are not in the schema and are read directly from the process environment, so
they work even though validation never sees them.

Worse than a name that is dropped is a name that is accepted. `HOST`, `NOSQL_DB_URL`,
`NOSQL_DB_DATABASE` and `NOSQL_DB_PASSWORD` are declared in the schema, so they pass validation and
the container starts without a complaint — and nothing reads them. Setting `NOSQL_DB_URL` instead of
`NOSQL_DATABASE_URL` gets you an installation that looks configured and has no database. Use the
names in the tables above.
:::
