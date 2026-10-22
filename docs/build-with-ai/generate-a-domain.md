---
sidebar_position: 2
title: Generate a domain with AI
sidebar_label: Generate a domain
description: "From an empty functional domain to a first version: the AI proposes the microfrontends and services, creates their repositories from templates and writes the code."
keywords: [generate, functional domain, scaffold, templates, repositories, ai agent]
---

# Generate a domain with AI

A **functional domain** groups the microfrontends and services of one business capability. When a
domain is still empty, one request is enough to get a first version: the AI proposes the components
the request needs, you review the list, and on confirmation the console creates each one with its own
repository, scaffolded from a Flightroom template, and the agent writes the code on top.

## Before you start

- The project can use at least one AI. See [AI models](./ai-models.md).
- The project has a code repository connection to GitHub, GitLab or Azure DevOps, which the new
  repositories are created through. See [GitHub](../repositories/connect/github.md),
  [GitLab](../repositories/connect/gitlab.md) or [Azure DevOps](../repositories/connect/azure.dev-ops.md).
- Your project role is not **Viewer**.

## 1. Create the domain

Open **Domains** in the sidebar and click **New domain**. Give it a **Name** (for example
*Payments*) and, optionally, a **Description** and an **AI context**: notes for the agent about this
domain only, such as its rules and vocabulary. See [Functional domains](../domains/overview.md) for
everything else a domain page offers.

## 2. Describe what you need

Open the domain. It opens on the **Edit with AI** tab, which tells you that the domain has no
microfrontend or service yet and that **Generate** will first ask the AI which ones your request
needs.

Write the request in **What should change?**, the way you would explain it to a colleague. For
example:

- *A page where warehouse leads log late deliveries, with a weekly count per carrier.*
- *An agent that checks each expense claim against the travel policy and flags the ones over the
  limit before approval.*

Pick the **AI** and the **Reasoning effort** if you want something other than the preselected ones,
then press **Generate proposal** (or ⌘/Ctrl + Enter).

## 3. Review the components

The console shows *The AI is proposing the components…* while a single model call drafts the list:
usually a frontend and a backend, **at most 3 microfrontends and 3 services**.

The dialog **Create these components for *domain*?** lists them under **Frontends
(microfrontends)** and **Backends (services)**. Nothing exists yet: edit freely.

| Field | Notes |
| --- | --- |
| Checkbox | Untick a component to leave it out |
| **Name** | Display name |
| **Slug** | 2 to 50 lowercase letters, digits or dashes, starting with a letter or a digit. Unique in the project |
| **Repository name** | Letters, digits, `.`, `_` and `-`, up to 100, starting with a letter or a digit, not ending with `.`, `.git` or `.atom`. By convention it ends with `-fe` for a frontend and `-be` for a backend |
| **Template** | The Flightroom template the repository is scaffolded from |

Below the list choose the **Code repository connection** to create the repositories with, and
whether they are **Private repositories** (on by default). Then confirm with **Create *N* components and generate**.

### Templates

| Kind | Default | Also available |
| --- | --- | --- |
| Microfrontend | React with Vite, as a remote (`vite-remote-react`) | React, Angular and Vue with Vite or Webpack, plus Web Component, single-spa and micro-lc. See the [templates library](../templates/templates-library.md) |
| Service | Node.js & Fastify (`service-node-fastify`) | Python & FastAPI, Spring Boot, Quarkus |

## 4. What happens on confirmation

1. Each component is created in the domain, each with a **new repository** scaffolded from its
   template, CI pipeline included. The dialog shows *Creating…*, *Created* or *Not created* per
   component.
2. The agent job starts on the new repositories. One agent sees all of them at once, so it can write
   an API and the screens that call it together.
3. It pushes its work on a branch of its own in each repository, `ai/<slug>-<timestamp>`, and
   proposes **one change per repository**.

From here the domain behaves like any other: review each proposal, refine it by chatting with the
agent, then apply it, open a pull request or discard it. See
[Change code with AI](./ai-changes.md).

## Members without repositories

If the domain already has microfrontends or services but none of them has a code repository, the
console asks **Can I create the repositories?** instead. Each selected member gets a new repository
named `<slug>-fe` or `<slug>-be`, scaffolded from the member's template or from the default of its
kind. Confirm with **Create *N* repositories and generate**, and the job starts as above.

## When something is in the way

| Message | What to do |
| --- | --- |
| **No code repository connected** | The project has no GitHub, GitLab or Azure DevOps connection. Follow **Connect a code repository**, then try again |
| *The AI did not propose anything to create* | Describe in the request what the domain should do and try again |
| *The repository already exists at the provider…* | Possibly left there by an attempt that failed. Pick another name, or delete it at the provider and try again |
| *A microfrontend (or service) with this slug already exists in the project* | Pick another slug |
| *You do not have permission to create code repositories in this project.* | Your project role is **Viewer**. Ask an Admin or an Editor of the project to run it |
| *The template no longer exists* | Pick another template for the component |
| *The pipeline templates of the project could not be read: nothing was created* | The project uses [its own pipeline templates](../templates/templates-library.md#your-own-pipeline-templates) and their repository or branch cannot be read. Fix them in **Settings**, or go back to the official templates, and try again |
| *…one agent works on at most 10 repositories* | Select fewer components; you can start a job on the others later |
| *AI editing is not available in this project* | The organization has no AI the project can use. See [AI models](./ai-models.md) |
