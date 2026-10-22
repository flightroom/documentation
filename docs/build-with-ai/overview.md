---
sidebar_position: 1
title: Build with AI overview
sidebar_label: Overview
description: "Describe an app or an AI agent in plain language: Flightroom's AI writes it on a branch of your own repositories, from Flightroom templates, for engineers to review and ship."
keywords: [ai, ai agent, code generation, plain language, templates, pull request, functional domain]
---

# Build with AI overview

Anyone in a project can describe the app or the AI agent they need in their own words. Flightroom's
AI writes the code in **your own Git repositories** (GitHub, GitLab or Azure DevOps), starting from
Flightroom templates, and pushes it to a branch of its own. Engineers review the change where they
already review code, and from there it ships like anything else in the project.

The AI never writes to your base branch by itself. It proposes, and a person applies, opens a pull
request or discards.

## Apps and agents in console terms

The console has no entity called "app" or "agent". What you describe maps to the building blocks
Flightroom already manages:

| What you ask for | What it is in the console |
| --- | --- |
| The web interface of an app | A **frontend**. Its **Kind** is *Bundle* (served by Flightroom) or *Docker* (served by its Docker container) |
| The backend or API of an app | A **service**, listed under **Backend services** |
| An app as a whole | A **functional domain** (**Domains** in the sidebar), which groups the frontends and services of one business capability |
| An AI agent | A **service** whose code the AI writes to call an AI model and your systems |

An agent has no separate runtime. It is a service like any other: it lives in its repository, goes
through your CI, gets versioned and is deployed the same way.

The rest of this section uses the console terms when it describes what to click.

## What the AI does, and what it leaves to you

- It works on a **clone** of the repository, never on the repository itself.
- It commits its proposal on a new branch, `ai/<slug>-<timestamp>`, and pushes it. The branch it
  started from is not touched.
- It does **not** install, build or test anything. Your CI checks the code, as it does for any other
  branch.
- It cannot read files that usually hold credentials, and cannot change CI configuration or
  lockfiles. See [Guardrails](./guardrails.md).

Once the proposal is ready you choose: **Apply** it to the base branch, **Open a pull request**, or
**Discard** it. See [Change code with AI](./ai-changes.md).

## Ways to build

| Starting point | Where | Page |
| --- | --- | --- |
| A new app from nothing | An empty functional domain, **Edit with AI** tab | [Generate a domain](./generate-a-domain.md) |
| A change to a frontend, a service or a whole domain | Its **Edit with AI** tab | [Change code with AI](./ai-changes.md) |
| Questions and actions on the project, in a chat | **Maestro**, ⌘J / Ctrl+J or **AI agent** in the sidebar | [Console assistant](./console-assistant.md) |
| Your own AI client (Claude, ChatGPT, Gemini, Cursor…) | The Flightroom MCP server, on installations that turn it on | [MCP server](./mcp-server.md) |

## Set it up once

An administrator prepares the ground; after that, project members build.

1. **Add an AI to the organization.** An owner or an admin of the organization opens
   **Organization settings**, tab **AI**, and adds one with **Add AI**: Claude (Anthropic, Azure AI
   Foundry or AWS Bedrock), Gemini or GPT on Azure OpenAI. Every project of the organization can use
   it unless restricted. See [AI models](./ai-models.md).
2. **Connect a code repository provider to the project.** The AI works in repositories reached
   through a code repository connection:
   [GitHub](../repositories/connect/github.md), [GitLab](../repositories/connect/gitlab.md) or
   [Azure DevOps](../repositories/connect/azure.dev-ops.md).
3. **Optionally, write AI context.** Free markdown notes for AI agents (business domain,
   conventions, rules), up to 20,000 characters each:
   - for the whole project, in **Settings → General → Project AI context**;
   - for a functional domain, in the **AI context** field of the domain form;
   - for a frontend or a service, in its **AI context** tab.

   The agent always receives the context of what it works on, of its domain and of the project.

When a project has no AI available, the AI features are hidden or report that they are not enabled,
and nothing is sent to any provider.

## Who can do what

| Action | Who |
| --- | --- |
| Add, edit or delete the AIs of the organization, and choose which AIs each project can use | Organization **Owner** or **Admin** |
| See the AI change requests of a project | Every member of the project |
| Ask for a change, apply it, open its pull request, discard it | Project **Admin** and **Editor**, and organization Owners and Admins. Not **Viewer** |
| Use Maestro | Every member; it acts with the member's own permissions, so a Viewer cannot change anything through it |
| Connect an AI client over MCP with changes allowed | Members who can write on the projects they share; on a project where they are Viewer the client stays read-only |

:::info[The Viewer role is enforced here]
The AI features check the project role: a **Viewer** can read AI change requests but not start,
apply or discard one. Elsewhere in the console the project role is still a label; see
[Project members and roles](../project-settings/users-and-roles.md).
:::

## From the branch to production

The AI's work ends in your repository. From there the usual path applies: CI builds the branch you
merged or applied to, and you deploy the result to an environment. To run your frontends and
services on your own cluster, see [Deploy to Kubernetes](../kubernetes/overview.md).

## Where to go next

- [Generate a domain](./generate-a-domain.md): from an empty domain to a first version
- [Change code with AI](./ai-changes.md): proposals, chat, apply, pull request, discard
- [Guardrails](./guardrails.md): limits and protections, for IT and security reviewers
- [AI models](./ai-models.md): connecting your AI providers
- [Console assistant](./console-assistant.md): Maestro
- [MCP server](./mcp-server.md): using Flightroom from your own AI client
