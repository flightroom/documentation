---
sidebar_position: 5
title: Deploy with GitLab CI
sidebar_label: GitLab CI
description: The .gitlab-ci.yml Flightroom commits when it scaffolds a GitLab repository, the group-level CI/CD variable it creates, and how to add a pipeline by hand.
keywords: [gitlab ci, pipeline, ci cd, ci variables, deploy]
---

# Deploy with GitLab CI

When Flightroom creates a repository from a template in GitLab, it commits a `.gitlab-ci.yml`
and creates a group-level CI/CD variable holding the deploy key.

## The generated pipeline

The scaffolded `.gitlab-ci.yml` covers install, test and build:

```yaml
stages:
  - install
  - lint
  - test
  - build

variables:
  PNPM_VERSION: "9.15.0"
  NODE_VERSION: "20"

.pnpm_cache:
  cache:
    key:
      files:
        - pnpm-lock.yaml
    paths:
      - .pnpm-store
  before_script:
    - corepack enable
    - corepack prepare pnpm@${PNPM_VERSION} --activate
    - pnpm config set store-dir .pnpm-store
    - pnpm install --frozen-lockfile

install:
  stage: install
  image: node:${NODE_VERSION}
  extends: .pnpm_cache
  script:
    - echo "Dependencies installed"
  artifacts:
    paths:
      - node_modules/
      - .pnpm-store
    expire_in: 1 hour

test:
  stage: test
  image: node:${NODE_VERSION}
  extends: .pnpm_cache
  dependencies:
    - install
  script:
    - pnpm run test
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    when: always
    reports:
      junit:
        - coverage/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
  allow_failure: false

build:
  stage: build
  image: node:${NODE_VERSION}
  extends: .pnpm_cache
  dependencies:
    - install
  script:
    - pnpm run build
  artifacts:
    paths:
      - dist/
    expire_in: 7 days
  only:
    - main
    - develop
    - tags
```

:::caution[Host repositories stop at build]
Frontend repositories get the `deploy` stage below already committed. Host repositories do not
— like their GitHub and Azure DevOps counterparts they build and containerise, but do not publish
themselves to Flightroom. Add the job below if you want a host published as a remote too.
:::

## The publish job

A `deploy` stage uploads the built `dist/` on tags:

```yaml
stages:
  - install
  - lint
  - test
  - build
  - deploy

deploy:
  stage: deploy
  image: alpine:latest
  dependencies:
    - build
  variables:
    FRONTEND_SLUG: "catalog"
    MICROFRONTEND_ORCHESTRATOR_DOMAIN: "https://console.flightroom.dev"
  before_script:
    - apk add --no-cache curl zip
  script:
    - cd dist && zip -qr ../dist.zip . && cd ..
    - |
      curl --fail --show-error --silent -X POST \
        -H "api-key: ${FLIGHTROOM_API_KEY}" \
        -F "file=@dist.zip" \
        "${MICROFRONTEND_ORCHESTRATOR_DOMAIN%/}/api/frontends/by-slug/${FRONTEND_SLUG}/upload/${CI_COMMIT_TAG}"
    - echo "published ${FRONTEND_SLUG} ${CI_COMMIT_TAG}"
  only:
    - tags
```

The template in
[`template-pipelines`](https://github.com/mfe-orchestrator/template-pipelines) carries two
placeholders, which the scaffolder replaces before the initial commit, as it does on GitHub:

| Placeholder | Replaced with |
| --- | --- |
| `%microfrontendSlug%` | The slug of the frontend, as it appears in the console |
| `%domain%` | The value of the installation's `BACKEND_URL`, inserted verbatim; `https://console.flightroom.dev` when `BACKEND_URL` is not set |

If you add this job to a repository by hand, write those two values in yourself.

:::caution[`%domain%` is the API URL, and the job appends `/api` to it]
`BACKEND_URL` is the public URL of the **API** — usually the console URL followed by `/api` — and
the scaffolder copies it into `%domain%` as it is, without removing anything. The job above then
appends `/api/frontends/…`, so an installation whose `BACKEND_URL` ends in `/api` produces
uploads to `…/api/api/frontends/…`, which fail. Two more cases to check:

- With `BACKEND_URL` unset, `%domain%` is `https://console.flightroom.dev` — not your installation,
  even if `FRONTEND_URL` is set.
- Either way, the fix is the same: make `MICROFRONTEND_ORCHESTRATOR_DOMAIN` the console URL
  **without** `/api` (e.g. `https://console.example.com`), in the file or as a project CI/CD
  variable.
:::

Both are plain job variables, so a **project** CI/CD variable of the same name wins over them: once
the YAML is correct you can set `MICROFRONTEND_ORCHESTRATOR_DOMAIN` in the project settings to publish
somewhere else without touching the file again.

Points worth noting:

- `only: tags` keeps publishing tied to tags, which is what makes the console's **Build** action work
  — see [Versions and builds](../frontends/versions-and-builds.md).
- `CI_COMMIT_TAG` is the version. It is only set on tag pipelines, which is another reason for
  `only: tags`.
- `--fail` on `curl` is essential: without it the job passes even when the upload is rejected.
- The `zip` is created from **inside** `dist`, so the archive has no directory prefix. See
  [Uploading a build](./manual-upload.md) for why this matters.

## The CI/CD variable

The job reads `FLIGHTROOM_API_KEY`. It is created as a **group-level** CI/CD variable
when you connect the GitLab repository to a project — or edit that connection — not when a
frontend is scaffolded, and it is skipped if a variable of that name already exists in the group.

Group scope means every frontend repository in that GitLab group can publish without further
setup. It also means the connection must have a group selected: without a group id the injector
returns without creating anything.

:::note[The key is dated 15 days out, and keeps working anyway]
The generated key expires after a year, and an expired key is refused with *API key expired*.
Keys generated by older versions of the platform expired after 365 *hours*, about fifteen days: if a
publish fails that way, create a new key and update the pipeline secret. See
[Expiry](./api-keys.md#expiry).
:::

:::caution[Protected variables and tags]
If you mark the variable as **Protected**, it is only exposed to pipelines on protected branches and
tags. Since publishing happens on tags, protect your release tag pattern
(**Settings → Repository → Protected tags**) or the variable will be empty in the deploy job.
:::

## Publishing a version

```bash
git tag 1.4.0
git push origin 1.4.0
```

Or use the **Build** action on the frontend card in the console, which creates the tag for you.

## Adding this to an existing repository

1. Create an [API key](./api-keys.md).
2. Add it as a CI/CD variable named `FLIGHTROOM_API_KEY`, at group or project level
   (**Settings → CI/CD → Variables**). Mark it **Masked**.
3. Add the `deploy` job above to your `.gitlab-ci.yml`, with your slug and API base URL.
4. If the variable is protected, protect your tag pattern too.

Base pipelines for other compilers and host types are in
[`template-pipelines`](https://github.com/mfe-orchestrator/template-pipelines) under
`<type>/<compiler>/gitlab/`.

## Troubleshooting

**Deploy job does not run**

`only: tags` means branch pushes skip it. Confirm you pushed a tag.

**The upload URL contains `%domain%`, or the slug is `%microfrontendSlug%`**

The repository was scaffolded by a console older than the one that replaces the placeholders on
GitLab, or the job was copied by hand from `template-pipelines`. Replace them as described
[above](#the-publish-job).

**The upload URL contains `/api/api/`, or points at the wrong installation**

`%domain%` was filled from `BACKEND_URL`, which already ends in `/api`, or from the default used
when `BACKEND_URL` is unset. Set `MICROFRONTEND_ORCHESTRATOR_DOMAIN` to the console URL without
`/api` — see [the caution above](#the-publish-job).

**`api-key` empty / authentication failure**

Either the variable is not defined at a scope the project can see, or it is **Protected** and the tag
is not. Check both, and confirm the key still exists in **Settings → Access → API Keys** and is not
**Expired**: an expired or revoked key is refused, with *API key expired on …* or *API key revoked*.

**`dist/` missing in the deploy job**

The `dependencies: [build]` declaration is what carries the artifact across stages. Also check the
`build` job's `expire_in` has not lapsed for a re-run of an old pipeline.

**Upload succeeds, app 404s**

The **Entry Point** on the frontend does not match the build output. Vite Module Federation
emits `assets/remoteEntry.js`.

**Upload succeeds, users see the old version**

Publishing is not deploying — [deploy the environment](../deployments/overview.md).
