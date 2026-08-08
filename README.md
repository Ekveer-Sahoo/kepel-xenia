# Kepel Xenia

Kepel Xenia is a self-hosted AI gateway. It gives you one local endpoint that talks to every LLM provider you've connected, so your apps and CLI tools don't need separate integrations for Anthropic, OpenAI, Gemini, and the 290-odd others it supports.

It's a customized fork of [OmniRoute](https://github.com/diegosouzapw/OmniRoute), rebranded and reworked with a monochrome, flat design and a few UX changes on top of the original.

## What it does

Point any OpenAI-SDK-compatible client, or a CLI tool like Claude Code, at Xenia instead of the provider directly. From there it handles the rest:

- **Compression.** Prompts and tool output get shrunk before they hit the provider, cutting token spend without changing how you write prompts.
- **Usage tracking.** Every request is logged with tokens, cost, and provider, and shows up in the dashboard.
- **Automatic failover.** If you've connected multiple accounts for the same provider, Xenia rotates to the next one the moment one hits a rate limit or quota, using cooldowns and per-model lockouts under the hood. Set up a combo with multiple providers as ordered targets and it'll fail over across providers too.
- **CLI integration.** It can auto-detect and configure local tools like Claude Code or Codex to route through it.

## Setup

```bash
npm install
cp .env.example .env
```

Open `.env` and set two secrets:

```bash
JWT_SECRET=$(openssl rand -base64 48)
API_KEY_SECRET=$(openssl rand -hex 32)
```

Then start it:

```bash
npm run dev
```

The dashboard comes up at `http://localhost:20128`. Log in with the password from `INITIAL_PASSWORD` in your `.env` (it defaults to `CHANGEME` in `.env.example`, so change it before you go live, and rotate it again from Settings after your first login).

From there, connect a provider account under Providers, and you're routing traffic.

## A note on how this is architected

Right now this is a single-admin instance: one login, one shared pool of connected provider accounts. There's no per-user signup or account isolation, so it's meant to run locally or on infrastructure only you control, not as something you'd hand out to strangers to self-serve on. Multi-tenant support (separate users, each with their own isolated connections and quotas) isn't built yet.
