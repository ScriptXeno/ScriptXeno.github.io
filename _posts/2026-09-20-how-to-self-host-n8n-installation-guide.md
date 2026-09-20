---
title: "How to Self-Host n8n: A Real Installation Guide (Docker, 2026)"
description: "A real 2026 Docker Compose guide to self-hosting n8n: hardware sizing, HTTPS setup, the new runner container, encryption key pitfalls, and true cost vs n8n Cloud."
author: oceanofanything
date: 2026-09-20
categories: [Self-Hosting, automation]
tags: [n8n, self-hosted, docker, docker-compose, workflow automation, automation tools, linux server, ai infrastructure tools]
image:
  path: https://cdn.jsdelivr.net/gh/ScriptXeno/2026-09-20-how-to-self-host-n8n-installation-guide-images@main/2026-09-20-how-to-self-host-n8n-installation-guide.webp
  path_sm: https://cdn.jsdelivr.net/gh/ScriptXeno/2026-09-20-how-to-self-host-n8n-installation-guide-images@main/thumb-800w.webp
  alt: "Hand-drawn illustration of a personified self-hosted server box holding n8n's node-chain logo, next to a sad cloud labeled n8n Cloud"
  lqip: data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
---
If you've followed an n8n self-hosting tutorial from 2024 and hit a dead link or a config that silently doesn't work, you're not doing anything wrong — n8n's docs and Docker Compose setup have both changed enough that older guides are actively stale. This is a from-scratch walkthrough based on n8n's current official docs and hosting repo, plus the pitfalls that actually show up in n8n's GitHub issues and community forum, not a fictional dry-run.

## TL;DR

- n8n's own docs now recommend Docker Compose with **three services** — `postgres`, `n8n`, and a separate `n8n-runner` container — not the two-container setup most 2024-era tutorials still show ([n8n-hosting repo](https://github.com/n8n-io/n8n-hosting)).
- Budget **2–4 vCPU / 4–8 GB RAM / 40–80 GB SSD** for a real production instance; a 1 vCPU / 2 GB box is fine for testing only ([Cherry Servers](https://www.cherryservers.com/blog/n8n-self-hosting-requirements), [Latenode](https://latenode.com/blog/low-code-no-code-platforms/n8n-setup-workflows-self-hosting-templates/n8n-system-requirements-2025-complete-hardware-specs-real-world-resource-analysis)).
- Set `N8N_ENCRYPTION_KEY` explicitly **before** first boot and back it up somewhere durable — losing it (or letting n8n auto-generate one inside a volume you later discard) permanently breaks every saved credential ([n8nlogic](https://n8nlogic.com/blog/n8n-environment-variables-the-complete-reference)).
- Skip **queue mode** unless you're genuinely past tens of thousands of executions a month — it requires Postgres, Redis, and S3-compatible storage for binary data, and adds real operational complexity most small-business workflows don't need yet ([Enable queue mode](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/enable-queue-mode)).
- A **$10–20/month VPS runs n8n with no execution cap**, versus n8n Cloud's €20–667/month plans (roughly $20–730) that hard-stop every workflow the instant you exceed your monthly execution limit ([n8n pricing](https://n8n.io/pricing/)).

## Why self-host n8n instead of using n8n Cloud

n8n Cloud is genuinely fine for a lot of people — no server to patch, no Docker Compose to babysit. But its plans are execution-capped, and it does not do graceful overage: hit your cap and everything stops until the next billing cycle, no pay-as-you-go option ([n8nautomation.cloud](https://n8nautomation.cloud/blog/n8n-cloud-execution-limits-explained-cost-2026)). Self-hosted n8n Community Edition is free software with no execution ceiling at all — you're only paying for the server.

![n8n Cloud vs self-hosted monthly cost by execution volume](https://cdn.jsdelivr.net/gh/ScriptXeno/2026-09-20-how-to-self-host-n8n-installation-guide-images@main/comparison-chart.webp){:.shadow}
If you're already comfortable running Docker for anything else on a small VPS, and you're deciding between n8n and other automation backbones in the first place, it's worth reading through the tradeoffs in [n8n vs OpenClaw vs a Custom Agent](https://scriptxeno.github.io/posts/n8n-vs-openclaw-vs-custom-agent/) before you commit to a hosting strategy — the "should I even use n8n" question and the "how do I host it" question are separate decisions.

## What you actually need (hardware and VPS sizing)

Don't oversize this on day one, but don't undersize it either — RAM, not CPU, is n8n's real bottleneck, because every active execution holds its full payload in memory, and a single large webhook body can eat 150–300 MB on its own ([Latenode](https://latenode.com/blog/low-code-no-code-platforms/n8n-setup-workflows-self-hosting-templates/n8n-system-requirements-2025-complete-hardware-specs-real-world-resource-analysis)).

- **To try n8n**: 1 vCPU, 2 GB RAM, ~20 GB SSD — workable for light testing ([Cherry Servers](https://www.cherryservers.com/blog/n8n-self-hosting-requirements), [Hostinger](https://www.hostinger.com/tutorials/n8n-vps-requirements)).
- **To run real workflows**: 2–4 vCPU, 4–8 GB RAM, 40–80 GB NVMe, so n8n and Postgres both have headroom ([ScalaHosting](https://www.scalahosting.com/blog/n8n-system-requirements-do-i-need-a-separate-server/), [vps.us](https://vps.us/blog/n8n-self-hosting/)).
- n8n's own Docker Compose page states a minimum of **4 GB RAM and 2 vCPUs** for the current sandbox/runner setup ([Install using Docker Compose](https://docs.n8n.io/deploy/host-n8n/install-options/install-using-docker-compose)).

In practice: a $5–7/month 1-2 vCPU / 2 GB box is enough to kick the tires; a box you'd actually run a small business on is closer to $10–20/month for 2-4 vCPU / 4-8 GB. If you've set up other self-hosted infrastructure on a cheap VPS before — like the setups in [docker-mailserver: Self-Hosted, Full-Featured Mail Solution with Docker](https://scriptxeno.github.io/posts/docker-mailserver-self-hosted-mail-server/) or [How to Self-Host an Open-Source Bulk Email Sender With BillionMail](https://scriptxeno.github.io/posts/self-host-billionmail-bulk-email-guide/) — this will feel familiar: same class of box, same Docker Compose muscle memory.

## The official Docker Compose setup

A quick heads-up before you search for a guide: n8n's docs moved. Anything linking to `docs.n8n.io/hosting/installation/docker/` is pointing at a dead/redirected path. The current docs live under `docs.n8n.io/deploy/host-n8n/...` — specifically [Install using Docker Compose](https://docs.n8n.io/deploy/host-n8n/install-options/install-using-docker-compose), which is what n8n itself recommends over the bare `docker run` one-liner.

The canonical production compose file is in the official [n8n-hosting GitHub repo](https://github.com/n8n-io/n8n-hosting), under `docker-compose/withPostgres/docker-compose.yml`. The part worth calling out explicitly: it's **three services now**, not two.

```yaml
volumes:
  db_storage:
  n8n_storage:

services:
  postgres:
    image: postgres:18
    restart: always
    environment:
      - POSTGRES_USER
      - POSTGRES_PASSWORD
      - POSTGRES_DB
      - POSTGRES_NON_ROOT_USER
      - POSTGRES_NON_ROOT_PASSWORD
      - PGDATA=/var/lib/postgresql/data
    volumes:
      - db_storage:/var/lib/postgresql/data
      - ./init-data.sh:/docker-entrypoint-initdb.d/init-data.sh
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -h localhost -U ${POSTGRES_USER} -d ${POSTGRES_DB}']
      interval: 5s
      timeout: 5s
      retries: 10

  n8n:
    image: docker.n8n.io/n8nio/n8n:${N8N_VERSION}
    restart: always
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=${POSTGRES_DB}
      - DB_POSTGRESDB_USER=${POSTGRES_NON_ROOT_USER}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_NON_ROOT_PASSWORD}
      - N8N_RUNNERS_MODE=external
      - N8N_RUNNERS_AUTH_TOKEN=${RUNNERS_AUTH_TOKEN}
      - N8N_RUNNERS_BROKER_LISTEN_ADDRESS=0.0.0.0
    ports:
      - 5678:5678
    links:
      - postgres
    volumes:
      - n8n_storage:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy

  n8n-runner:
    image: n8nio/runners:${N8N_VERSION}
    restart: always
    environment:
      - N8N_RUNNERS_AUTH_TOKEN=${RUNNERS_AUTH_TOKEN}
      - N8N_RUNNERS_TASK_BROKER_URI=http://n8n:5679
    depends_on:
      - n8n
```

That `n8n-runner` container is the real 2026 change: code execution (Code nodes, expressions) now runs in a **separate task-runner container** over a broker on port 5679, authenticated with a shared `N8N_RUNNERS_AUTH_TOKEN`, instead of in-process inside the main n8n container. If you've been following n8n's node-level changes too, it's worth pairing this with [n8n's August AI Agent Update: What's Actually Worth Turning On](https://scriptxeno.github.io/posts/n8n-ai-agent-node-rebuild-august-2026/) — separately-scoped changes, but both are examples of n8n's architecture moving faster than the tutorials written about it.

If you don't want to hand-write compose files at all, n8n also documents a [one-line setup](https://docs.n8n.io/deploy/host-n8n/install-options/one-line-setup). And if you just want to kick the tires with SQLite and no Postgres, there's the minimal path from [Install with Docker](https://docs.n8n.io/deploy/host-n8n/install-options/install-with-docker):

```bash
docker volume create n8n_data

docker run -it --rm \
 --name n8n \
 -p 5678:5678 \
 -e GENERIC_TIMEZONE="<YOUR_TIMEZONE>" \
 -e TZ="<YOUR_TIMEZONE>" \
 -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true \
 -e N8N_RUNNERS_ENABLED=true \
 -v n8n_data:/home/node/.n8n \
 n8nio/n8n
```

n8n itself flags this as fine for testing, not production — it defaults to SQLite and has no Postgres/runner separation.

## HTTPS and the reverse proxy

n8n doesn't terminate TLS itself. You need a reverse proxy in front doing Let's Encrypt HTTPS — this is universal advice, not optional. The [n8n-hosting repo](https://github.com/n8n-io/n8n-hosting) ships an official `docker-caddy` example and a `subfolderWithSSL` example; there's no official Traefik example, so Traefik/Nginx setups are community-standard rather than n8n-blessed (see [this Traefik walkthrough](https://jortdevreeze.com/blog/ai-agents-6/how-to-install-n8n-with-docker-and-traefik-32) or [this one](https://dev.to/hubschrauber/self-hosting-n8n-with-docker-and-traefikletsencrypt-for-https-4ae8), and [LumaDock's Nginx guide](https://lumadock.com/tutorials/n8n-nginx-reverse-proxy)).

Whichever proxy you pick, it must forward `X-Forwarded-Proto`, `X-Forwarded-Host`, and `X-Forwarded-For` — n8n's own doc page is explicit about this ([Configure webhook URLs with reverse proxy](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/configuration-examples/configure-webhook-urls-with-reverse-proxy)). Caddy sends all three by default with zero extra config, which is a real reason to reach for it if you don't already have opinions about your proxy.

Two environment variables actually matter here:

- **`N8N_WEBHOOK_URL`** — set to your public HTTPS URL, e.g. `https://n8n.example.com/` (trailing slash matters), so n8n registers the correct externally-reachable address with third parties instead of the internal `:5678` port. This **replaced the older `WEBHOOK_URL`**, deprecated as of n8n 2.35.0 ([Configure webhook URLs with reverse proxy](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/configuration-examples/configure-webhook-urls-with-reverse-proxy)) — if you're following an older guide that sets `WEBHOOK_URL` and nothing works, that's why.
- **`N8N_PROXY_HOPS=1`** — tells n8n to trust one hop of forwarded-proxy headers. Skip this and webhook/OAuth redirect URLs frequently come out wrong even when the headers are set correctly.

## Environment variables that actually matter

| Variable | What it does | Gotcha |
|---|---|---|
| `N8N_ENCRYPTION_KEY` | Encrypts all stored credentials | Generate with `openssl rand -hex 32` before first boot; losing it makes every credential permanently unreadable |
| `N8N_WEBHOOK_URL` | Public HTTPS URL n8n advertises | Replaces the deprecated `WEBHOOK_URL` (n8n 2.35.0+) |
| `N8N_PROXY_HOPS` | Trusted reverse-proxy hop count | Set to `1` behind a single proxy or webhook URLs break |
| `DB_TYPE` / `DB_POSTGRESDB_*` | Switches from SQLite to Postgres | Required once you want queue mode |
| `GENERIC_TIMEZONE` / `TZ` | Affects Cron/Schedule trigger timing | Left at UTC, schedule nodes fire at the "wrong" local time |
| `N8N_RUNNERS_MODE` / `N8N_RUNNERS_AUTH_TOKEN` | Enables the external runner container | Must match between `n8n` and `n8n-runner` services |

(Sourced from the official compose file above, [Configure webhook URLs with reverse proxy](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/configuration-examples/configure-webhook-urls-with-reverse-proxy), and [Osher Digital's config guide](https://osher.com.au/blog/guide-to-n8n-configuration-settings/).)

## Real pitfalls (not hypothetical ones)

**"Credentials could not be decrypted."** This is the single most common self-hosted complaint, and it's always the same root cause across multiple GitHub issues ([#17986](https://github.com/n8n-io/n8n/issues/17986), [#17816](https://github.com/n8n-io/n8n/issues/17816), [#12949](https://github.com/n8n-io/n8n/issues/12949)) and [community forum threads](https://community.n8n.io/t/credentials-could-not-be-decrypted-the-likely-reason-is-that-a-different-encryptionkey-was-used-to-encrypt-the-data-docker/158793): the encryption key and the database drift apart. A container recreated without its data volume, a Postgres dump restored into a fresh instance without its original key, a second instance auto-generating its own key against a shared database — all break it. Pin `N8N_ENCRYPTION_KEY` explicitly on day one and back it up next to your database backups.

**Webhook URLs still showing `:5678` in production.** A real GitHub issue ([#16933](https://github.com/n8n-io/n8n/issues/16933)) documents this happening even with webhook variables and a working proxy set up, and it was closed as "not planned" rather than fixed — meaning it's sensitive to exact proxy-header configuration, not a guaranteed bug fix waiting to land. If it happens to you, re-check `N8N_PROXY_HOPS` and that every hop in your proxy chain actually forwards `X-Forwarded-Proto`.

**SQLite disk bloat that pruning doesn't fix.** SQLite's `DELETE` doesn't return freed pages to the OS — only `VACUUM` does. A GitHub issue ([#37926](https://github.com/n8n-io/n8n/issues/37926)) and a [community "nuclear solution" thread](https://community.n8n.io/t/nuclear-solution-to-self-hosted-n8n-disk-space-growing-and-creating-disk-full-problem/226479) both document execution-pruning running correctly while `database.sqlite` itself never shrinks. One reported fix: stopping n8n and running `sqlite3 database.sqlite "VACUUM;"` manually took disk usage from 116 GB (75% full) down to 16 GB (10%). n8n exposes `DB_SQLITE_VACUUM_ON_STARTUP` as a mitigation ([execution-data docs](https://docs.n8n.io/hosting/scaling/execution-data/), [Nordflux's pruning guide](https://nordflux.de/en/guides/why-the-n8n-database-growing-cleaning-up-execution-data)). This alone is a good argument for Postgres over SQLite the moment your execution volume is non-trivial — Postgres doesn't have this failure mode.

**Queue-mode webhooks stuck in "Queued."** Multiple community threads ([main thread](https://community.n8n.io/t/n8n-self-hosted-queue-mode-chat-webhook-not-working/63609), [a Railway-specific variant](https://community.n8n.io/t/self-hosted-n8n-cluster-on-railway-worker-not-dequeuing-jobs-webhook-triggers-stuck-in-queue/209719), [another variant](https://community.n8n.io/t/dont-receive-webhook-on-instance-as-queue-mode/158993)) describe executions enqueued but never picked up by a worker — usually a Redis connectivity or `EXECUTIONS_MODE` mismatch between the main process and workers. It's a real signal that queue mode is meaningfully more operationally complex than a single instance, and shouldn't be your default.

## Should you bother with queue mode?

Probably not yet. n8n's own [scaling reference](https://docs.n8n.io/reference/scaling-n8n.html) claims a single instance handles roughly **220 workflow executions/second** — most small-business automation setups are nowhere near that ceiling on one VPS. Queue mode ([Enable queue mode](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/enable-queue-mode)) requires Postgres (SQLite isn't supported), Redis, the same `N8N_ENCRYPTION_KEY` on every worker, and — a detail that's easy to miss until it bites you — it **doesn't support filesystem binary-data storage at all**, so any workflow processing files needs S3-compatible storage once you add a worker. Reach for it only once you're genuinely scaling horizontally, not preemptively.

## What it actually costs: self-hosted vs n8n Cloud

n8n Cloud's [pricing page](https://n8n.io/pricing/) prices plans in EUR (annual billing) and breaks down like this:

| Plan | Price/month | Executions/month |
|---|---|---|
| Starter | €20 (~$20–22) | 2,500 |
| Pro | €50 (~$54–55) | 10,000 |
| Business | €667 (~$720–730) | 40,000 |

And the cap behavior matters as much as the price: **exceed your limit and n8n Cloud stops all workflows until the next billing cycle** — no pay-as-you-go overage ([n8nautomation.cloud](https://n8nautomation.cloud/blog/n8n-cloud-execution-limits-explained-cost-2026)). A self-hosted instance on a $10–20/month VPS (Hetzner CX22 runs ~$4.50/mo for 2 vCPU/4 GB; a realistic production box is $10–20/mo — [Sliplane's provider comparison](https://sliplane.io/blog/what-cloud-provider-should-you-use-for-self-hosted-n8n)) has no execution cap at all. Under roughly 10,000 executions/month, Cloud can genuinely be cheaper once you value your own maintenance time; past that, self-hosting wins decisively, since you'd otherwise be paying hundreds of dollars a month for volume a $15 server handles without blinking ([Moore IQ](https://mooreiq.ai/blog/n8n-self-hosted-vs-cloud-cost-breakdown), [n8nlab](https://n8nlab.io/blog/n8n-cloud-vs-self-hosted-comparison)).

If you're the type of reader thinking about execution volume and cost caps here, it's worth also reading [The Runaway AI Agent Bill: Cost Controls to Set Before You Turn On Agent Mode](https://scriptxeno.github.io/posts/ai-agent-runaway-cost-controls-checklist/) — the "capped subscription vs uncapped infrastructure you own" tradeoff shows up in AI agent billing the same way it does here.

## FAQ

**Do I need Postgres, or is SQLite fine?**
SQLite is fine for a single low-volume instance — it's the zero-config default and needs no network hop. But it has a real failure mode (disk bloat that pruning alone doesn't fix, see above), and it's mandatory to switch to Postgres the moment you want queue mode or multiple workers.

**What happens if I lose my `N8N_ENCRYPTION_KEY`?**
Every stored credential becomes permanently unreadable — this is the most common self-hosted support complaint on n8n's GitHub and forum. Generate it explicitly with `openssl rand -hex 32` before first boot and back it up outside the container, never let n8n auto-generate one you might lose.

**Why do my webhook URLs show port 5678 instead of my domain?**
Almost always a missing or misconfigured `N8N_PROXY_HOPS` or a proxy hop that isn't forwarding `X-Forwarded-Proto`. Double-check both before assuming it's a bug — n8n's own GitHub tracker has an open issue on this exact symptom that was closed as "not planned" rather than fixed.

**Is the old `WEBHOOK_URL` variable still valid?**
No — it was deprecated as of n8n 2.35.0 in favor of `N8N_WEBHOOK_URL`. If you copied a guide predating that and webhooks aren't registering correctly, this is usually why.

**Do I need queue mode for a small business workflow setup?**
Almost certainly not. A single instance handles roughly 220 executions/second per n8n's own scaling docs, and queue mode adds Redis, mandatory Postgres, and S3-compatible storage for binaries as real new dependencies. Save it for when you're actually scaling horizontally.

**Is self-hosting actually cheaper than n8n Cloud?**
It depends on volume. Under about 10,000 executions/month, Cloud's Starter/Pro tiers can beat a self-hosted setup once you count your own time. Past that, a $10–20/month VPS with no execution cap wins clearly against Cloud's €667/month (~$720–730) Business tier for the same volume.

## Where this leaves you

None of this is exotic — it's a Docker Compose file, a reverse proxy, and a handful of environment variables you set once and don't touch again. The failure modes that actually bite people (a lost encryption key, a bloated SQLite file, a proxy header nobody forwarded) are all avoidable if you get them right on day one rather than after something breaks in production. If this is part of a broader self-hosted automation stack, it's worth reading how the pieces fit together across [n8n vs OpenClaw vs a Custom Agent](https://scriptxeno.github.io/posts/n8n-vs-openclaw-vs-custom-agent/) and the mail-server posts linked above — the pattern of "cheap VPS, Docker Compose, own your uptime" repeats across all of them.