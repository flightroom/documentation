---
sidebar_position: 6
title: Maestro, the console assistant
sidebar_label: Console assistant
description: "Maestro answers questions about the project and acts on it with your permissions, asking for confirmation before anything destructive or that grants access."
keywords: [maestro, assistant, ai agent, chat, confirmation, audit]
---

# Maestro, the console assistant

**Maestro** is the AI assistant of the console. It looks up and changes the microfrontends, services,
builds, deployments, environments and variables of the project you have open, and searches the
Flightroom documentation. It acts **as you**: with your permissions, on the current project only.

Maestro is available when the project can use at least one [AI](./ai-models.md). Otherwise it is
hidden.

## Opening it

- As a side panel, from anywhere in the project: **⌘J** on macOS, **Ctrl+J** elsewhere, or the Maestro
  button in the header.
- As a full page: **AI agent**, the first entry of the sidebar.

Type in **Ask something about the project…** and press **Send**. Suggestions such as *Give me an
overview of the project* or *Are there failed builds? Why?* get you started. Some pages also offer a
button that asks Maestro for you: **Explain the failure** on a failed build, **Analyze the latest
deployment**, **Analyze the conflicts** on shared dependencies, **Check the variables** across
environments.

Next to the message box you can pick the **AI** and the **Reasoning effort**. Every answer shows the
tokens it used. Conversations are saved per project: **Recent conversations** reopens them, **New
conversation** starts a fresh one.

## Confirming actions

Reads and ordinary writes run directly. Actions that are destructive or that hand out access **stop
and wait for you**. The panel shows a **Confirm this action** card, and nothing happens until you
press **Confirm**; **Cancel** drops it.

Actions that need confirmation include:

- deleting anything, deploying, rolling back (a redeploy of a previous snapshot, which does not
  touch Kubernetes: see [Rolling back a Kubernetes deploy](../kubernetes/rollback.md)), committing
  to a repository;
- changing a member's role, removing a member, revoking an API key or an AI client connection;
- inviting to a project or an organization, resending an invitation, creating an API key;
- discarding an AI change, setting canary users.

The card names what the action acts on (users, environments, microfrontends with version and host,
services, domains, the AI change with its request and files) instead of raw ids. A deploy card shows,
for each environment, which versions, hosts and variables change compared with the active deployment.
**Input sent by Maestro** shows exactly what the model asked for.

A card can be answered **once** and **expires after 15 minutes**. After that, ask again.

## Starting AI code changes

The **New AI job** button in the panel starts an agent on microfrontends and services you pick,
across domains. Jobs open as tabs in Maestro, where you follow them, chat with the agent and apply
the proposals. See [Change code with AI](./ai-changes.md#change-several-components-outside-a-domain).

## What Maestro does not do

Some things stay in the console pages on purpose, because their input or output is a secret that
would travel to the AI provider:

- storages;
- code repository connections;
- your user profile;
- bundle upload.

When Maestro creates an API key, the new key is shown in the panel only and never sent to the model.
Build logs it reads are redacted first: known token formats, credentials in URLs, variables named like
secrets, private keys and similar values are blanked.

## Permissions

Maestro runs every tool through the same checks as the console. On a project where you are a
**Viewer** it cannot change anything. Member management (inviting, changing roles, removing) takes a
project owner or an administrator of the organization, as in the console pages.

## Audit

Every answer and every write is logged by the server:

| Audit tag | Logged for | Contains |
| --- | --- | --- |
| `assistant_usage` | Every answer | The user, the project, the AI, the effort and the token counts |
| `assistant_tool_call` | Every write, confirmed or refused | The tool, the project or organization, the user, the outcome, and the arguments reduced to ids and short identifying values. Never free text or secrets |

Questions count against `ASSISTANT_RATE_LIMIT_MAX` per user per minute (default 20). Past it,
Maestro answers *Too many questions in a short time. Wait a minute and try again.*
