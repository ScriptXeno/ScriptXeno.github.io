---
title: "n8n vs Zapier vs Make (Integromat): Which Should You Actually Use in 2026"
description: n8n, Zapier, and Make compared on 2026 pricing, billing units, self-hosting, AI agent features, and real G2/Capterra ratings — with the cost math that decides which one to actually run.
author: oceanofanything
date: 2026-09-20
categories: [automation, AI, Self-Hosting]
tags: [n8n, Zapier, Make, workflow automation, automation tools, self-hosted, pricing]
image:
  path: https://cdn.jsdelivr.net/gh/ScriptXeno/2026-09-20-n8n-vs-zapier-vs-make-comparison-images@main/2026-09-20-n8n-vs-zapier-vs-make-comparison.webp
  path_sm: https://cdn.jsdelivr.net/gh/ScriptXeno/2026-09-20-n8n-vs-zapier-vs-make-comparison-images@main/thumb-800w.webp
  alt: "Hand-drawn illustration of n8n, Zapier, and Make personified on a winner's podium, with an unclaimed trophy in front"
  lqip: data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
---
## TL;DR

- **The billing unit matters more than the sticker price.** n8n charges per **workflow execution**, Zapier charges per **task (each action step)**, and Make charges per **credit (each module call)** — so the same multi-step workflow run thousands of times a month can cost wildly different amounts on each platform, independent of list price ([n8n.io/pricing](https://n8n.io/pricing/), [zapier.com/pricing](https://zapier.com/pricing), [make.com/en/pricing](https://www.make.com/en/pricing)).
- **n8n is the only one of the three you can self-host for free**, with no execution cap on its open-source Community edition. That control comes with a real maintenance burden: [The Hacker News](https://thehackernews.com/search/label/n8n) documented a CVSS 10.0 unauthenticated RCE and a separate CVSS 9.9 authenticated command-execution flaw, both disclosed in [January 2026](https://thehackernews.com/2026/01/critical-n8n-vulnerability-cvss-100-lets.html), plus [4,576 leaked API tokens exposing live self-hosted instances](https://thehackernews.com/2026/08/leaked-n8n-api-tokens-exposed-live.html) found by GitGuardian in August 2026.
- **Zapier still wins decisively on raw integration count** — [9,000+ apps](https://zapier.com/developer-platform) versus Make's [3,000+](https://www.make.com/en/ai-agents) and n8n's 400 to 1,200+ built-in nodes, a range that depends entirely on counting method (see below).
- **Make cut its paid plans roughly 25% in September 2026** — Core $12→$9, Pro $21→$16, Teams $38→$29 — in what reads as a direct response to n8n's growing cost advantage at scale ([neomanex.com](https://neomanex.com/news/make-cuts-paid-plan-pricing-september-2026)).
- **All three shipped real agentic-AI products in 2026**: n8n's LangChain-native AI nodes, Zapier Agents, and Make's Maia copilot with Make AI Agents. Only n8n gives you full, self-hosted, code-level control over how that agent actually runs.

If you've spent any time evaluating workflow automation tools, you already know the marketing pages all sound the same: thousands of integrations, drag-and-drop simplicity, "AI-powered" everything. What actually differentiates n8n, Zapier, and Make in September 2026 is less glamorous than that — it's how each one counts your usage and bills you for it, how much of the stack you're allowed to own, and how far each one has actually gotten with agentic AI versus just slapping the word on a feature page. This is the same territory we covered when comparing [n8n against OpenClaw and a custom-built agent](https://scriptxeno.github.io/posts/n8n-vs-openclaw-vs-custom-agent/) — but here the fight is specifically among the three tools most small businesses actually shortlist for "connect app A to app B."

## Pricing: what each platform actually charges right now

### n8n

n8n's [pricing page](https://n8n.io/pricing/) lists four cloud tiers, billed annually:

- **Starter**: €20/month — 2,500 executions/month, 5 concurrent executions, 1 shared project, 2,300 AI credits/month.
- **Pro**: €50/month — 10,000 executions/month, 20 concurrent executions, 3 shared projects.
- **Business**: €667/month — 40,000 executions/month, 6 shared projects, SSO/SAML/LDAP, Git-based version control.
- **Enterprise**: custom, unlimited shared projects, 200+ concurrent executions.

Every cloud tier includes unlimited users, unlimited workflows, and every integration — no premium-app gating, which is a real differentiator from the other two. The bigger story is the **self-hosted Community Edition**: free, open-source under n8n's fair-code license, with no cap on executions. You pay only for the server, commonly cited around $4–7/month on a small VPS ([nocode.mba](https://www.nocode.mba/articles/n8n-pricing), [goodspeed.studio](https://goodspeed.studio/blog/n8n-pricing)). A self-hosted Business tier also exists at $800/month billed annually, with a 50% startup discount for companies under 20 employees ([n8n pricing](https://n8n.io/pricing/)).

### Zapier

Zapier's [pricing page](https://zapier.com/pricing) starts with a Free plan (100 tasks/month, two-step Zaps only, 15-minute polling), then scales through a task slider from 100 up to 2,000,000 tasks/month:

- **Professional**: from $19.99/month (annual) for 750 tasks — multi-step Zaps, unlimited premium apps, 2-minute polling, AI by Zapier included.
- **Team**: from $69/month (annual, 2,000 tasks) — up to 25 members, SAML SSO, 1-minute polling.
- **Enterprise**: custom — SCIM, domain capture, audit logs.

At the top of the volume slider, Pro annual reaches roughly $3,389/month and Team roughly $3,999/month for 2 million tasks ([nocode.mba](https://www.nocode.mba/articles/zapier-pricing-2026), [activepieces.com](https://www.activepieces.com/blog/zapier-pricing)). Trigger steps are free; only action steps count. Exceed your monthly allotment and you're billed at 1.25x your per-task rate on annual plans (2.5x on monthly), capped at 3x your plan's included tasks.

### Make (formerly Integromat)

Make's [pricing page](https://www.make.com/en/pricing) runs Free (1,000 credits/month, max 2 active scenarios, 15-minute minimum interval) through:

- **Core**: $9/month (annual) — 10,000 credits, unlimited active scenarios, 1-minute interval.
- **Pro**: $16/month (annual) — priority execution, custom variables, full-text log search.
- **Teams**: $29/month (annual) — team-level roles and features.
- **Enterprise**: custom.

Those Core/Pro/Teams numbers reflect a **roughly 25% price cut in September 2026** — Core was $12, Pro was $21, Teams was $38 — corroborated by a dedicated write-up ([neomanex.com](https://neomanex.com/news/make-cuts-paid-plan-pricing-september-2026)) alongside Make's own current pricing page. Unused credits on paid plans now roll over for one month, a real relief feature for seasonal usage. Make also renamed its billing unit from "operations" to "credits" around the 2025/2026 boundary — a straight 1:1 rename for classic module actions, but AI-model actions now bill fractionally by token, which is the actual mechanical reason for the rename ([alltomate.com](https://alltomate.com/blogs/make-com-pricing-plans-explained/)).

Here's what that September price cut looked like across Make's three paid tiers:

![Make monthly price by tier, before and after the September 2026 cut](https://cdn.jsdelivr.net/gh/ScriptXeno/2026-09-20-n8n-vs-zapier-vs-make-comparison-images@main/comparison-chart.webp){:.shadow}

## Why "which is cheaper" doesn't have one answer

This is the part vendor comparison pages tend to flatten, and it's the single most important thing to understand before you commit: **n8n, Zapier, and Make don't charge for the same unit of work.**

- n8n bills per **workflow execution** — a 50-node workflow that runs once still costs one execution.
- Zapier bills per **task**, meaning per action step — a 10-step Zap running once burns roughly nine billable tasks (the trigger is free).
- Make bills per **credit**, roughly one per module call, with the trigger step capped at 1 credit regardless of how many records it returns.

Because of this, the exact same complex automation — say, a 10-step process that runs 10,000 times a month — can cost radically different amounts on each platform. Multiple independent sources converge on n8n coming out 80–90% cheaper than Zapier at meaningful step-count and volume combinations, precisely because n8n doesn't multiply cost by step count the way Zapier does ([futurepicker.com](https://futurepicker.com/en/n8n-vs-zapier-2026-en/), [medium.com/@automation.labs](https://medium.com/@automation.labs/zapier-vs-make-vs-n8n-in-2026-where-ai-agents-actually-fit-1edbbeff85f3)). That's a structural fact about how billing works, not a cherry-picked stat — the actual multiplier depends entirely on how many steps your workflow has and how often it runs. A simple two-step Zap running a few hundred times a month might genuinely be cheapest on Zapier's Free or Professional plan. A branchy, 15-node process running tens of thousands of times a month is a different conversation entirely, and it's exactly the kind of cost blind spot we walked through in our [runaway AI agent cost controls checklist](https://scriptxeno.github.io/posts/ai-agent-runaway-cost-controls-checklist/) — the platform's billing unit is often the actual root cause of a surprise invoice, not the AI usage itself.

Make's model sits in between: users hitting scale describe credits adding up faster than expected once error-handling and data-storage modules get added, with limits feeling tight well before a team consciously decided to scale.

## Architecture: cloud-only vs. fully self-hosted

This is the deepest structural difference between the three, and it doesn't show up on a pricing page at all.

**Zapier and Make are both cloud-only SaaS.** There's no self-hosted version of either, no way to run the execution engine on your own infrastructure, and no way to keep your workflow data from transiting the vendor's cloud. For businesses with data-residency requirements, HIPAA/GDPR obligations, or a flat "nothing leaves our VPC" policy, this alone rules both out regardless of price ([dev.to/softpyramid1122](https://dev.to/softpyramid1122/moving-from-make-or-zapier-to-n8n-when-its-worth-it-and-what-to-watch-3kh7)).

**n8n can be fully self-hosted** — Docker, a VPS, Kubernetes — with the Community edition free and unlimited on executions. It's the only one of the three where you own the runtime, the data plane, and (on self-hosted Business/Enterprise) the compliance controls: SSO/SAML/LDAP, external secrets stores, audit logging.

That control isn't free, though, and this is where a fair comparison has to be honest instead of just repeating n8n's marketing. Self-hosting moves patching, uptime, worker scaling, and backups onto you — and n8n has had a genuinely rough 2026 on the security-disclosure front. The Hacker News' [n8n coverage](https://thehackernews.com/search/label/n8n) alone includes: a **CVSS 10.0 unauthenticated RCE** in [January 2026](https://thehackernews.com/2026/01/critical-n8n-vulnerability-cvss-100-lets.html); a separate **CVSS 9.9 authenticated command-execution flaw**, also [January 2026](https://thehackernews.com/2026/01/new-n8n-vulnerability-99-cvss-lets.html); a **sandbox-escape RCE** in [July 2026](https://thehackernews.com/2026/07/n8n-sandbox-escape-lets-workflow.html); **4,576 leaked API tokens** exposing live self-hosted instances across 1,255 hostnames, per GitGuardian research reported in [August 2026](https://thehackernews.com/2026/08/leaked-n8n-api-tokens-exposed-live.html); and n8n webhook URLs being abused for malware delivery, with webhook-URL volume in phishing emails up roughly 686% year-over-year by [March 2026](https://thehackernews.com/2026/04/n8n-webhooks-abused-since-october-2025.html). None of that means n8n is unsafe to run — it means self-hosting n8n is patch-management work, the same way running any exposed web app is, and you should budget for it the same way you'd budget for keeping a mail server current, a topic we've gone deep on with [docker-mailserver](https://scriptxeno.github.io/posts/docker-mailserver-self-hosted-mail-server/) and [BillionMail](https://scriptxeno.github.io/posts/self-host-billionmail-bulk-email-guide/).

## Integration breadth: 9,000+ vs. 3,000+ vs. "it depends how you count"

Zapier is the clear ecosystem leader by raw count: its [developer-platform page](https://zapier.com/developer-platform) cites 9,000+ app integrations, and [Zapier's own help docs](https://help.zapier.com/hc/en-us/articles/21996626006541-Introduction-to-apps-on-Zapier) land in the same range. If you need a native integration for some niche SaaS tool your business actually uses, Zapier is the best bet by a wide margin.

Make sits in the middle, commonly cited at [3,000+ apps](https://www.make.com/en/ai-agents) on its own marketing pages, up sharply from "1,000+" in older sources.

n8n officially ships 400 to 1,200+ built-in nodes depending on how you count ([vps.us](https://vps.us/blog/how-many-n8n-integrations/), [docs.n8n.io/integrations](https://docs.n8n.io/integrations)) — n8n counts one node per app regardless of how many operations it supports, while Zapier and Make effectively count every trigger-and-action combination separately, inflating their totals against a strict app-count comparison. Beyond the built-ins, the npm registry hosts 500+ community node packages, and because n8n exposes a raw HTTP Request node and a Code node for custom JS/Python, it can talk to virtually anything with an API even without a dedicated node — something Zapier and Make can only partially replicate through their own generic webhook modules.

Worth noting for anyone weighing n8n's long-term staying power: it's not a scrappy side project anymore. It raised a [$180M Series C in October 2025](https://blog.n8n.io/series-c/) at a $2.5B valuation, and a follow-on [strategic investment from SAP](https://www.bloomberg.com/news/articles/2026-05-12/sap-invests-in-ai-automation-startup-n8n-at-5-2-billion-value) pushed that to $5.2B by May 2026.

## AI-agent workflows vs. simple two-app automations

All three platforms made a real, dated push into agentic AI in 2026:

**n8n** shipped a LangChain-native wave of 70+ dedicated AI nodes — LLM connectors, memory backends (Redis, Postgres, in-process buffer), and the ability to expose any sub-workflow as an agent-callable tool ([finbyz.tech](https://finbyz.tech/n8n/insights/n8n-2-0-langchain-agentic-workflows), [strapi.io](https://strapi.io/blog/build-ai-agents-n8n)). We covered this rebuild in detail in our piece on [n8n's August AI Agent update](https://scriptxeno.github.io/posts/n8n-ai-agent-node-rebuild-august-2026/): checking n8n's actual [GitHub releases](https://github.com/n8n-io/n8n/releases/tag/n8n@2.26.0) confirms this isn't just framing — recent versions add AWS Assume Role support for Bedrock, MCP registry connections, and sub-agent execution. For genuinely agentic work — multi-step reasoning, tool selection, long-running state, RAG — n8n is the most technically capable of the three, at the cost of a real learning curve; one Capterra review summarized it as "incredibly complicated to use compared to Zapier and really only approachable if you are an incredibly technical user" ([capterra.com](https://www.capterra.com/p/198028/n8n-io/reviews/)).

**Zapier Agents** act autonomously across Zapier's full app catalog rather than following rigid if/then logic, restructured around automation-first behavior in mid-2025 with 2026 additions of AI Guardrails, "Bring Your Own Model," and Memory ([help.zapier.com](https://help.zapier.com/hc/en-us/articles/36713413544845-Big-changes-to-Zapier-Agents-and-planned-maintenance)). One thing worth flagging directly: **AI by Zapier moved to model-tiered pricing on June 15, 2026** — Standard (1x), Advanced (3x, the default), and Premium (5x) cost multipliers plus a 75-task-per-run cap, confirmed on [Zapier's own help center](https://help.zapier.com/hc/en-us/articles/46597632373389-AI-by-Zapier-new-model-based-pricing-starting-June-15-2026). Agentic workflows on Zapier can get noticeably more expensive per run than a plain two-step Zap, stacked on top of per-task billing that already penalizes complexity.

**Make** ships Maia, a conversational copilot that builds and fixes scenarios from natural-language prompts, plus a dedicated Make AI Agents product for orchestrating decisions across its app catalog within the existing visual canvas ([make.com/en/ai-agents](https://www.make.com/en/ai-agents)). It's positioned as the transparent middle ground between n8n's code-level control and Zapier's more black-box agent behavior.

The pattern holds across independent sources: Zapier is fastest and safest for non-technical users building simple automations; n8n is the strongest platform for genuinely agentic, multi-step, self-hosted work; Make sits deliberately in between on both axes. This is the same tradeoff we've mapped for [agentic AI running SMB workflows](https://scriptxeno.github.io/posts/silicon-workforce-agentic-ai-running-smb-workflows/) more broadly — the tool that's easiest to start with isn't always the one that scales with your ambitions.

## What actual users say

On [G2](https://www.g2.com/compare/zapier-vs-n8n), n8n scores 4.7–4.8/5 depending on the comparison page (238–283 reviews), Zapier scores 4.5/5 from 2,079 reviews, and Make scores lower on one specific comparison listing (3.8/5, though that page shows only a handful of reviews, likely because Make's G2 presence is split across "Make" and legacy "Integromat by Celonis" listings). The attribute-level breakdown is the most useful part: **n8n edges out Zapier on "meets requirements" (9.1 vs 9.0)**, while **Zapier leads decisively on usability (8.6 vs 8.4), ease of setup (8.6 vs 8.1), and ease of administration (8.8 vs 8.4)**. That's a clean summary of the whole comparison in two numbers: users rate n8n's actual capability higher, and Zapier's approachability higher.

Zapier's [Capterra](https://www.capterra.com/p/130182/Zapier/reviews/) rating runs 4.5–4.7/5 across different snapshots. Notably, Zapier's [Trustpilot score](https://www.trustpilot.com/review/zapier.com) is reported as a sharp outlier at 1.4/5, attributed specifically to surprise task-overage billing and cancellation friction — a real, distinct pain point from its much more favorable G2/Capterra numbers.

On migration patterns: the dominant direction is Zapier-to-n8n, driven mostly by cost at scale. There's no native import path — n8n doesn't ingest Zaps or Make scenarios directly. The documented route is exporting Zaps as JSON via Zapier's "Export My Data" and manually rebuilding the logic as n8n nodes, which several migration guides frame as a chance to refactor rather than a straight lift-and-shift ([dev.to/elestio](https://dev.to/elestio/how-to-migrate-from-zapier-make-to-n8n-4e8j), [dev.to/alifar](https://dev.to/alifar/migrating-to-n8n-a-developers-guide-to-scalable-workflow-automation-765)).

## So which one should you actually use

If you're non-technical, need a native integration for some obscure tool, and your automations are simple two-app triggers, start with Zapier's Free or Professional plan. The 9,000-app catalog and the fastest setup of the three make it the lowest-friction choice, and you should just budget for the fact that costs climb fast once you add steps or scale volume.

If you want a real visual builder with better cost-per-operation than Zapier and you're not ready to manage your own server, Make is the sensible middle ground — especially now that its paid tiers are 25% cheaper than they were in August 2026.

If your workflows are complex, high-volume, or need to touch an LLM in a genuinely agentic way — and especially if data residency or "nothing leaves our infrastructure" matters — self-hosted n8n is the strongest technical choice, provided you or someone on your team treats it like any other exposed service that needs patching. That's the same call-out we made comparing n8n against [OpenClaw and a custom agent build](https://scriptxeno.github.io/posts/n8n-vs-openclaw-vs-custom-agent/): the platform with the most control also carries the most operational responsibility, and pretending otherwise is how a "free" self-hosted tool ends up costing more in incident response than a SaaS subscription ever would. If reducing operating cost is the actual goal here rather than automation for its own sake, it's worth reading that goal against our broader piece on [smart technology and operational cost reduction](https://scriptxeno.github.io/posts/smart-technology-operational-cost-reduction/) before you commit to a platform.

## FAQ

**Is n8n actually free, or is that just for a trial?**
The self-hosted Community edition is genuinely free and open-source, with no cap on workflow executions — you only pay for the server it runs on, commonly $4–7/month on a small VPS. n8n's cloud plans and self-hosted Business/Enterprise tiers are paid, but the free self-hosted option isn't a time-limited trial.

**Which platform is cheapest at real business volume?**
It depends entirely on your step count and run volume, because each platform bills a different unit. For simple, low-step automations at modest volume, Zapier's Free or Professional tier can be cheapest. For complex, multi-step workflows run thousands of times a month, self-hosted n8n is generally far cheaper because it bills per execution, not per step or per module call — multiple sources put the gap versus Zapier at 80–90% at meaningful scale.

**Can I self-host Zapier or Make like I can with n8n?**
No. Both are cloud-only SaaS with no self-hosted version and no way to run their execution engine on your own infrastructure. If data residency or "nothing leaves our network" is a hard requirement, n8n is the only one of the three that satisfies it.

**Can I import my Zaps or Make scenarios directly into n8n?**
Not automatically. n8n has no native import for Zapier or Make workflows. The documented path is exporting your Zaps as JSON via Zapier's "Export My Data" and manually rebuilding the logic as n8n nodes — which several migration guides note is a good opportunity to refactor rather than a true lift-and-shift.

**Which one is best for AI agent workflows, not just simple automations?**
n8n, by a clear margin, because of its LangChain-native AI nodes, memory backends, and code-level extensibility, plus the option to self-host the whole thing. Zapier Agents and Make's Maia/AI Agents are both real, shipped products, but neither gives you n8n's level of low-level control over how the agent actually executes.

**Is self-hosting n8n actually safe?**
It can be run safely, but it isn't a "set it and forget it" decision. n8n has had a real string of 2026 CVEs, including a CVSS 10.0 unauthenticated RCE and leaked API tokens exposing thousands of live instances. Self-hosting n8n means accepting the same patch-management responsibility you'd take on for any other exposed service — keep it updated, don't expose the editor UI publicly without authentication, and treat webhook URLs like credentials.