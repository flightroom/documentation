---
sidebar_position: 3
title: Change code with AI
sidebar_label: Change code with AI
description: "Ask for a change to a frontend, a service or a whole domain: the agent proposes it on a branch, you refine it in a chat, then apply it, open a pull request or discard it."
keywords: [edit with ai, ai change, proposal, pull request, merge request, apply, discard, feature branch]
---

# Change code with AI

Every frontend, service and functional domain opens on its **Edit with AI** tab. There you
describe a change, an agent proposes it on a branch of the repository, and you decide what to do
with it. The other tabs are:

| Opened on | Tabs |
| --- | --- |
| A frontend | **Edit with AI**, **Details & settings** |
| A service | **Edit with AI**, **Overview**, **Details & settings** |
| A [functional domain](../domains/overview.md) | **Edit with AI**, **Structure** |

It is available when the project can use an [AI](./ai-models.md) and what you are changing has a
code repository linked. Otherwise, on a frontend or a service the **Edit with AI** tab is
hidden and the page opens on **Details & settings** (on **Overview** for a service). A domain always
shows the tab: without an AI it reads *AI editing is not available in this project: the organization
has no AI it can use.*

## Ask for a change

The composer reads **What do you want to change in *name*?**

1. Describe the change in **What should change?**, for example *Add a 404 page with a link back to
   the home page*. Up to 8,000 characters.
2. Check the repository and the branch the agent starts from, shown under the prompt. It is the
   repository's default branch unless you pick another one.
3. Optionally pick another **AI** and **Reasoning effort** (*Low*, *Medium*, *High*, *Extra high*,
   *Max*). Code changes default to *High*; more effort means deeper reasoning, slower answers and
   more tokens.
4. Press **Generate proposal**, or ⌘/Ctrl + Enter.

The request is queued and the agent starts. While it works the console shows where it is (*Preparing
the repository*, *The agent is working*, *Pushing the proposal on its branch*…), and **Show the
agent's progress log** opens the details. Two events only show up when the agent has to wait:

- *Waiting for the repository to be free*: another request is working on the same repository, and
  this one starts when it is done.
- *The model hit its rate limit: retrying shortly*: the AI provider asked to slow down, and the agent
  tries again on its own.

The agent reads the repository together with the AI context of the project, of the domain and of
what it is changing. In a service repository it also follows an `AGENTS.md` or `CLAUDE.md` at the
root, if there is one. Files it reads are cut at 100 KB: past that size a file is usually generated
or vendored, rarely something to edit by hand.

## Read the proposal

When the agent is done the request reads **Proposal ready**. It shows:

- a **Summary** of what the agent did;
- the **Proposed changes**: every file marked *New*, *Modified* or *Deleted*, each with its diff;
- the branch it was **pushed on**, `ai/<slug>-<timestamp>`;
- the **Tokens used**.

The proposal is already pushed on its own branch, so you can also check it out or look at it on your
Git provider. The base branch has not changed.

If the agent finished without changing any file, the request reads **Nothing to change**.

## Refine it in a chat

Each request is a conversation. Below the proposal, write in **Ask the agent for a change, or ask it a
question…** and press **Send** (Enter; Shift+Enter for a new line).

- A follow-up starts from the files of the previous proposal and knows what was asked before. Its
  proposal **replaces** the previous one, which is marked *Refined by the next message*.
- Every follow-up force-pushes the same branch, so a pull request already open on it shows the latest
  proposal.
- A question that changes no file pushes nothing.
- If a follow-up fails, the previous proposal stays open to apply or refine again.
- Only the **latest** proposal can be applied.

You can pick a different AI or effort for each message.

## Apply, open a pull request, or discard

| Action | What it does |
| --- | --- |
| **Apply to *branch*** | Pushes the proposal straight onto the base branch, with no review. All the proposed files go together. The base branch's CI starts right away |
| **Open a pull request** | Opens a pull request (a merge request on GitLab) from the proposal's branch onto the base branch, to review it in the repository. The proposal stays open: you can still refine, apply or discard it |
| **Discard** | Deletes the proposal's branch, unless a pull request is open on it |

Details worth knowing:

- **Apply is never forced.** A protected base branch refuses the push, and the console tells you to
  open a pull request instead.
- **Apply checks for conflicts.** Every file must still be what the agent saw. If someone changed one
  of them on the base branch in the meantime, Apply stops and names the files: ask for the change
  again.
- When the base branch has not moved since the proposal, Apply moves it to the very commit of the
  proposal's branch, so a pull request opened on it shows as merged. After Apply, the proposal's
  branch is deleted unless a pull request is open on it.
- The commit and the pull request are named after the first message, and the pull request
  description quotes every message of the conversation. The commit author is the person who asked.
- If the provider refuses to open the pull request (for example a token without that permission),
  the console shows why, and the branch stays pushed.
- If pushing the proposal on its branch failed, applying it or opening its pull request tries again.

Once a proposal is applied or discarded, the conversation is closed. Press **New change** to start a
fresh one from the base branch.

## Change a whole domain

**Edit with AI** on a functional domain starts **one agent on every frontend and service of the
domain that has a code repository**, at most 10. It sees them all at once, so a single request can
span a backend endpoint and the screens that call it.

- The agent still proposes **one change per repository**, each on its own branch, and each one is
  applied or opened as a pull request on its own. One pull request per repository.
- **Apply all (*N*)** pushes every pending proposal of the request onto the base branch of its
  repository in one go, after a confirmation. A repository that cannot be applied goes back to its
  proposal, with the error on it.
- Each message of the conversation shows one tab per repository, with its files and diff.
- Each repository starts from its default branch, or from a branch you pick. One choice can set them
  all: each repository's default branch, or a branch that every one of them has.
- Members without a repository are left out and listed under the request.
- A domain with more than 10 repositories cannot be changed in one go from here: start the job from
  Maestro and pick the ones to change (below).

An empty domain, or one whose members have no repository yet, is handled first by
[Generate a domain](./generate-a-domain.md).

## Change several components outside a domain

In [Maestro](./console-assistant.md), the **New AI job** button starts one agent on the
frontends and services you pick, in any domain: choose them (or **All frontends and
services**, every one with a linked repository, at most 10), describe the change and press **Start
job**. The job opens as a tab in Maestro, where you follow it, chat with the agent and apply its
proposals.

## Requests and their status

The **AI change requests** list groups requests by where they stand:

| Group | Contains |
| --- | --- |
| **Awaiting approval** | Proposals ready for you to act on |
| **In progress** | Requests queued, being worked on, or being applied |
| **Applied** | Proposals pushed onto their base branch |
| **Discarded** | Proposals you threw away |
| **Failed** | Requests that did not complete. **Try again**, or start a new change |

Proposals nobody acts on are **removed after 7 days**; their branch stays in the repository. Once a
proposal is applied, the whole conversation is kept.

At most 3 AI jobs run at the same time in a project: a fourth is refused with *Too many jobs are
running in this project: wait for one to finish.* Other limits are listed in
[Guardrails](./guardrails.md).

## Tips for good requests

- Write the rules the agent should always follow (conventions, vocabulary, what not to touch) in the
  **AI context** of the project, domain, frontend or service, rather than repeating them in
  every request.
- One change per request. Refine it in the chat rather than starting over.
- Read the diff before **Apply**: the agent cannot run your tests, and Apply skips review.
