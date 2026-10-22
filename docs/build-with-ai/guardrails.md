---
sidebar_position: 4
title: AI guardrails
sidebar_label: Guardrails
description: "What the AI agent can and cannot touch, the limits on every request, branch protection, CI, roles and audit logs: the reference for IT and security reviewers."
keywords: [guardrails, security, protected paths, branch protection, ci, audit, limits, rate limit]
---

# AI guardrails

This page is for the people who have to approve the AI features: IT, security, platform owners. It
lists what the agent is allowed to do, what it is not, and where a human stays in the loop.

## A person decides what reaches the base branch

- The agent works on a **clone** of the repository and never pushes by itself. The console pushes its
  proposal on a new branch, `ai/<slug>-<timestamp>`, and only there.
- The base branch is written only when a user presses **Apply**. That push is **never forced**: a
  protected branch refuses it, and the console suggests a pull request instead.
- **Apply** first checks that every file is still what the agent saw. A file changed on the base
  branch in the meantime stops the apply with a conflict, so nothing is silently overwritten.
- **Open a pull request** hands the change to your normal review process on GitHub, GitLab (merge
  request) or Azure DevOps.

To force review on every AI change, protect the base branch at your Git provider: Apply is then
refused and a pull request is the only way in.

## CI is the judge

The agent **cannot run anything**: no install, no build, no test. Your repository's CI checks the
branch and the pull request, exactly as it does for a person's work.

:::warning[Pushed branches run CI with the repository secrets]
Every proposal is pushed on its branch as soon as the agent is done, before anyone has reviewed it. A
pipeline that runs on every branch therefore runs the agent's code with whatever secrets that
pipeline can reach. Keep deployment secrets, and the pipelines that use them, limited to protected
branches.
:::

The protected paths below keep the agent away from what CI executes directly. Build configuration,
tests and `package.json` scripts also run in CI, and only the human review of the diff covers those.

## What the agent cannot read

Files that usually hold credentials:

`.env*`, `.npmrc`, `.netrc`, `id_rsa*`, `id_ed25519*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`,
`*.keystore`, `*.jks`

## What the agent cannot write

| Category | Paths |
| --- | --- |
| Git internals | `.git` |
| CI configuration | `.github/workflows/`, `.github/actions/`, `.gitlab-ci.yml`, `.gitlab/`, `azure-pipelines*.yml`, `azure-pipelines*.yaml`, `.azure-pipelines/`, `.circleci/`, `bitbucket-pipelines.yml`, `Jenkinsfile*`, `.husky/` |
| Lockfiles | `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `npm-shrinkwrap.json`, `bun.lock`, `bun.lockb` |
| Registry configuration | `.npmrc`, `.yarnrc`, `.yarnrc.yml`, `.pnpmfile.cjs` |
| Ignored files | Anything the repository's `.gitignore` excludes |

## Confined to the working copy

- The agent can list, search, read, write and delete files **inside the working copy only**. Every
  path is resolved after following symlinks: `..`, absolute paths, `.git` and symlinks pointing out of
  the repository are refused.
- Repository credentials are never written to disk: the clone URL holds no token, and the provider
  token is handed to each network call.
- No `git` binary runs and no repository hook is ever executed.

## Limits

| Limit | Value |
| --- | --- |
| Request length | 8,000 characters |
| Files changed | 20 per repository |
| Content written | 500 KB per repository, 2 MB per job |
| Model rounds | 40 for one repository, plus 20 for each additional repository, 120 at most |
| Repositories in one job | 10 |
| Jobs running at once | 3 per project |
| Requests per user | `ASSISTANT_RATE_LIMIT_MAX` per minute (default 20), the same ceiling as Maestro questions |
| Unanswered proposals | Removed after 7 days; the branch stays |

## Who can do what

| Action | Who |
| --- | --- |
| See AI change requests | Every member of the project |
| Ask for a change, apply, open a pull request, discard | Project **Admin** and **Editor**, plus organization **Owner** and **Admin**. A **Viewer** cannot |
| Manage the organization's AIs and which projects use them | Organization **Owner** and **Admin** |

A member whose access is limited to **Specific domains** (see
[Changing a role](../project-settings/users-and-roles.md#changing-a-role)) sees and starts only the jobs
whose frontends and services all belong to their domains. Jobs on the whole project are hidden
from them.

Maestro and MCP clients act with the user's own permissions: on a project where the user is a Viewer,
every change is refused. See [Console assistant](./console-assistant.md) and
[MCP server](./mcp-server.md).

## What leaves your installation

The agent sends the files it reads, and your request, to the **AI provider** of the AI picked for the
request. Which providers a project may use is decided by the organization's administrators; a project
restricted to no AI has the AI features off, and nothing is sent anywhere. See
[AI models](./ai-models.md).

A provider's own error message is never shown to users or stored on a job: users see a generic error,
and the provider's message goes to the server log.

## Audit and cost

- The commit author of an AI change is the user who asked; the committer is Flightroom.
- The token usage of each request is stored and shown in the console, next to the effort used.
- The server log carries an `ai_job_usage` line per AI job, with the user, the project, the effort,
  the AI and the token counts.
- Maestro logs every answer (`assistant_usage`) and every write it runs, confirmed or refused
  (`assistant_tool_call`). See [Console assistant](./console-assistant.md#audit).

## Self-hosting: where the clones live

The agent works on clones kept on the backend's disk.

| Variable | Default | What it does |
| --- | --- | --- |
| `REPOSITORIES_FOLDER` | `/repositories` (`/data/repositories` in the all-in-one image) | Root of the clones |
| `REPOSITORIES_MAX_SIZE_MB` | `500` | A clone bigger than this is refused and deleted |
| `REPOSITORIES_EVICT_AFTER_DAYS` | `14` | Clones not used for this long are deleted |

The folder is a **cache**: deleting it only costs a new clone. Clones are also removed when their
frontend or project is deleted. On Kubernetes the Helm chart mounts an `emptyDir` there
(`repositories.sizeLimit`, 10Gi by default); set `repositories.existingClaim` to keep the clones
across restarts. See also [Environment variables](../self-hosting/environment-variables.md).
