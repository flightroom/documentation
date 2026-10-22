---
sidebar_position: 5
title: AI models
sidebar_label: AI models
description: "Connect your own AI providers to the organization, choose which AIs each project can use, and, when self-hosting, offer a system AI from the environment."
keywords: [ai models, ai providers, claude, anthropic, azure ai foundry, aws bedrock, gemini, azure openai, gpt]
---

# AI models

Every AI feature (editing code with AI, generating a domain, Maestro, the AI draft of the new project
wizard) runs on the **AIs of the organization**. Each AI is a provider, a model and the credentials to
reach it. You bring your own: requests go to your account at the provider.

An organization can define several AIs, for example Claude on the Anthropic API and GPT on Azure
OpenAI. Users pick one per request in the **AI** selector, preselected on the default.

## Adding an AI

Open **Organization settings** from the organization menu, tab **AI**. The **Artificial intelligences** list is visible to every
member of the organization; only an **Owner** or an **Admin** can add, edit or delete an AI.

Click **Add AI** and fill in:

| Field | Notes |
| --- | --- |
| **Name** | Unique in the organization, for example *Claude for the teams* |
| **Provider** | See the table below |
| Provider settings | The credentials and location the provider needs |
| **Model** / **Deployment** | Which model the requests go to |
| **Maximum effort** | Optional. The highest reasoning effort users can pick with this AI (*Low*, *Medium*, *High*, *Extra high*, *Max*). *No limit* by default |
| **Default AI** | Preselected in every project that can use it. Only one AI of the organization is the default |

### Providers

| Provider | Settings | Model |
| --- | --- | --- |
| **Claude (Anthropic)** | **API key** | **Model**, optional: `claude-opus-5-5` when left empty |
| **Claude (Azure AI Foundry)** | **Resource** (the resource name, not a URL) and **API key** | **Model**: the name of the Claude deployment, optional: `claude-opus-5-5` when left empty |
| **Claude (AWS Bedrock)** | **Region**, **Access key ID** and **Secret access key** | **Model**, required: the Bedrock model id or an inference profile. The key needs permission to invoke it |
| **Gemini (Google)** | **API key** | **Model**, required: use a model with function calling |
| **GPT (Azure OpenAI)** | **Endpoint**, **API key** and **Reasoning model** | **Deployment**, required: the name of the GPT deployment |

Notes:

- The Azure OpenAI **Endpoint** must be an Azure HTTPS endpoint, like
  `https://my-resource.openai.azure.com/`. Turn on **Reasoning model** when the deployment is a
  reasoning model (for example GPT-5 or the o-series): it then accepts an effort level.
- Reasoning effort is offered on Claude with all five levels, and on GPT with **Reasoning model** on
  with *Low*, *Medium* and *High*. Without reasoning, and on Gemini, the choice is hidden.
- On Claude, the effort levels need Claude Opus 4.7 / Sonnet 5 or later. The default model is one.
- The prompts and tools of the agent were written and tested with Claude: the quality of the code
  agent depends on the model.

### Credentials

The credentials are never shown again after saving: the form keeps a hidden value, and leaving it as
it is keeps the stored key. A stored key is kept only while the provider, the resource, the endpoint
and the access key stay the same; point the AI elsewhere and you type the key again. The stored keys
are never sent to another provider.

On a self-hosted installation, set `SECRETS_ENCRYPTION_KEY` to have them encrypted at rest with
AES-256-GCM. See [Encryption at rest](../self-hosting/encryption-at-rest.md).

### Deleting an AI

Deleting an AI also removes it from every project that uses it. A project left with no AI has the AI
features turned off.

## Which AIs a project can use

Below the list, the **Project access** table shows, for each project of the organization, the AIs it
can use. Owners and admins edit a row and choose:

- **All the AIs of the organization (default)**, including those added later; shown as **All
  (default)**;
- **Only the selected AIs**: an AI added later is not included.

Selecting none turns the AI features off for that project, shown as **AI turned off**: Maestro is
hidden, the AI endpoints answer that AI is not enabled, and nothing is sent to any provider.

The AI preselected in a project is the organization's default when the project may use it, otherwise
the first one available.

## The system AI (self-hosting)

A self-hosted installation can offer one more AI to every organization from its environment
variables. It is listed as **System AI**, is read-only in the console (*Configured in the
installation's environment: it cannot be edited here.*), and can be excluded from a project like any
other.

| `AI_PROVIDER` | Required variables | Optional |
| --- | --- | --- |
| `anthropic` | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL` (`claude-opus-5-5`) |
| `azure-foundry` | `AZURE_FOUNDRY_RESOURCE`, `AZURE_FOUNDRY_API_KEY` | `AZURE_FOUNDRY_MODEL` (`claude-opus-5-5`) |
| `aws-bedrock` | `AWS_BEDROCK_REGION`, `AWS_BEDROCK_ACCESS_KEY_ID`, `AWS_BEDROCK_SECRET_ACCESS_KEY`, `AWS_BEDROCK_MODEL` | |
| `gemini` | `GEMINI_API_KEY`, `GEMINI_MODEL` | |
| `azure-openai` | `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT` | `AZURE_OPENAI_REASONING` (`false`) |

- `AI_MAX_EFFORT` (`low`, `medium`, `high`, `xhigh` or `max`) caps the effort of the system AI. On an
  installation open to sign-ups it bounds the cost of a single question.
- `AI_PROVIDER` left empty with `ANTHROPIC_API_KEY` set means Claude through the Anthropic API.
- A provider named without one of its required variables stops the backend at boot, with the missing
  variables in the error.
- For Azure sovereign clouds, add the endpoint suffixes the installation accepts with
  `AZURE_OPENAI_ENDPOINT_SUFFIXES`, comma separated (for example `.openai.azure.us,.openai.azure.cn`).

With none of these variables set there is no system AI. See also
[Environment variables](../self-hosting/environment-variables.md).
