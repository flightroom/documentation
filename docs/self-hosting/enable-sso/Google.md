---
title: Enable SSO with Google
sidebar_label: Google
description: Create a Google OAuth 2.0 client and point a self-hosted Flightroom at it, so users sign in with their Google account.
keywords: [google oauth, sso, authentication, self-hosting]
---

# Enable SSO with Google

This guide will walk you through the process of enabling Google OAuth authentication for your Flightroom instance.

## Prerequisites
- A Google Cloud Platform (GCP) account
- A project in the Google Cloud Console
- Docker environment for Flightroom

## Step 1: Create a New OAuth 2.0 Client ID

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Set the **Application type** to **Web application**
6. Under **Authorized JavaScript origins**, add the origin the console is served from — scheme, host
   and port, no path: `http://localhost:3000` for a local installation, `https://console.example.com`
   for a public one
7. Click **Create**
8. Note down the **Client ID** and **Client Secret**

### How the console signs in with Google

There is no callback route on the Flightroom side. The *Google* button on the login page opens a
Google popup using the authorization-code flow; when the user consents, Google hands a one-time code
back to the console page itself, and the console sends it to `GET /api/auth/google?code=…`. The
backend exchanges that code at `https://oauth2.googleapis.com/token` with `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET` and `GOOGLE_REDIRECT_URI`, and returns the tokens to the console.

Because the code is delivered to the page and not to a URL, what Google checks is the page's origin —
hence the **Authorized JavaScript origin** above. For a code obtained through a popup, Google expects
the token exchange to state the special value `postmessage` as the redirect URI.

:::caution[`GOOGLE_REDIRECT_URI` must match what Google expects for the code]
The backend sends `GOOGLE_REDIRECT_URI` to Google exactly as you set it, and the console passes the
same value when it opens the popup. Google refuses the exchange with `redirect_uri_mismatch` whenever
that value is not the one the code was issued for. With the popup flow the console uses, start with
`GOOGLE_REDIRECT_URI=postmessage`. If you set a URL instead, it must also be listed, character for
character, under **Authorized redirect URIs** of the same OAuth client.
:::

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type and click **Create**
3. Fill in the required app information:
   - App name: "Flightroom"
   - User support email: Your email
   - Developer contact information: Your email
4. Click **Save and Continue**
5. In the **Scopes** section, add the following scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
6. Click **Save and Continue**
7. Add test users (optional) and complete the setup

## Step 3: Configure Environment Variables

Add the following environment variables to your Docker container configuration:

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `GOOGLE_CLIENT_ID` | Client ID from Google Cloud Console | `1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Client secret from the same OAuth client. **Required** | `GOCSPX-…` |
| `GOOGLE_REDIRECT_URI` | Redirect URI sent with the code-for-token exchange — see the caution above | `postmessage` |

:::caution[`GOOGLE_CLIENT_SECRET` is not optional]
The console signs in with the authorization-code flow: the browser gets a code, the backend exchanges
it for tokens at `https://oauth2.googleapis.com/token`, and that exchange sends the client secret.
With the secret missing, the Google consent screen appears and succeeds, and the login then fails at
the token step — which reads as a broken installation rather than a missing variable.
:::

### Variables that are read but have no effect

These three are accepted by the configuration schema and served to the frontend in its
configuration, and nothing acts on them. They are listed here so you do not spend time tuning them:

| Variable Name | Why it does nothing |
|---------------|---------------------|
| `GOOGLE_AUTH_SCOPE` | The login button requests `openid profile email`, hardcoded in the frontend |
| `GOOGLE_AUTH_HOSTED_DOMAIN` | Served to the frontend, which never applies it: it does **not** restrict the login to a Workspace domain. To keep outside accounts out, make the OAuth consent screen **Internal** to your Workspace organization instead |
| `GOOGLE_API_AUDIENCE` | Served to the frontend and never used. The backend accepts a Google token only if it was issued to `GOOGLE_CLIENT_ID` |

## Step 4: Update Docker Configuration

If you are using Docker Compose, add these variables to your `docker-compose.yml` file:

```yaml
services:
  flightroom:
    environment:
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI}
```

## Step 5: Restart Your Application

After updating the configuration, restart your Docker containers:

```bash
docker-compose down
docker-compose up -d
```

## Troubleshooting

- **400: redirect_uri_mismatch**: the value of `GOOGLE_REDIRECT_URI` is not the one Google expects
  for the code — use `postmessage`, or list the exact URL under **Authorized redirect URIs**. If the
  popup itself is refused, the console origin is missing from **Authorized JavaScript origins**
- **403: access_denied**: Verify that the Google OAuth consent screen is properly configured and published
- **Login succeeds at Google, then fails in the console**: almost always `GOOGLE_CLIENT_SECRET`
  missing or wrong — the code-for-token exchange is the step that needs it
- **Invalid client secret**: Ensure the client secret is correct and hasn't expired
- **Check Docker logs** for any authentication-related errors
