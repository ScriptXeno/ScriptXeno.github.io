---
title: "GitHub Copilot's Promo Credits Drop September 1: What It Actually Costs Your Team"
description: GitHub Copilot's boosted AI Credit allowance drops from 3,000 to 1,900 per Business seat (7,000 to 3,900 for Enterprise) on September 1, 2026. Real team-size scenarios, what actually consumes credits, and the budget controls to set before the deadline hits.
author: oceanofanything
date: 2026-08-19
categories: [AI Agents, AI, Developer Platforms]
tags: [GitHub Copilot, AI Credits, usage-based billing, pricing, developer productivity, AI Coding Agent, budget management, ai coding tools]
image:
  path: https://scriptxeno.github.io/2026-08-19-github-copilot-promo-credits-drop-september-1-images/2026-08-19-github-copilot-promo-credits-drop-september-1.webp
  alt: Bar chart showing GitHub Copilot's Business tier credits dropping from 3,000 to 1,900 on September 1
  lqip: data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
---
## GitHub Copilot's Promo Credits Drop September 1: What It Actually Costs Your Team

GitHub moved Copilot to usage-based billing on June 1, 2026, replacing the old premium-request counter with a shared pool of "AI Credits" that gets spent per token instead of per request. To soften the landing, GitHub gave existing Copilot Business and Enterprise customers a bigger monthly credit allowance for the first three months of the new system. That boosted allowance ends on September 1, 2026, twelve days from when this is being written.

Most of the coverage of this change has repeated the two headline numbers (3,000 credits down to 1,900 for Business, 7,000 down to 3,900 for Enterprise) without showing what that actually means for a specific team's bill. That's the gap this post fills: real scenario math for a 3-person, 8-person, and 15-person team at light, medium, and heavy usage, plus the admin settings worth changing before the drop hits.

### Quick answer

On September 1, 2026, GitHub's temporary boosted AI Credit allowance for Copilot Business and Enterprise customers ends. Business seats fall from 3,000 credits a month back to the standard 1,900 (a 37 percent cut), and Enterprise seats fall from 7,000 to 3,900 (a 44 percent cut), while the seat price stays the same at $19 and $39. Nothing changes for autocomplete, since inline completions and Next Edit Suggestions remain free and unmetered; the squeeze lands on chat, agent mode, the Copilot coding agent, code review, and the CLI. The single most useful thing a team lead can do in the next twelve days is pull up the Copilot usage dashboard, compare current monthly credit burn against the smaller September number instead of the one the team has been living with since June, and decide now whether to allow metered overage or cap it, rather than finding out by surprise invoice.

### What actually changes on September 1

Nothing about seat pricing moves. Copilot Business still costs $19 a user a month and Copilot Enterprise still costs $39. What shrinks is the included AI Credit allowance bundled into that seat price, and only for organizations that were already on Business or Enterprise before the usage-based system launched. GitHub gave those existing customers a temporary bump, roughly $30 worth of credits a month for Business and $70 worth for Enterprise, running from June 1 through September 1, 2026. After that, the allowance reverts to the standard rate that actually matches the seat price: 1,900 credits (about $19 worth) for Business and 3,900 credits (about $39 worth) for Enterprise, at the fixed conversion of 1 AI Credit equals $0.01.

In other words, the last three months haven't been the normal state of Copilot billing. They've been a grace period, and any usage habits a team built up since June were built against a pool that's about to shrink by more than a third.

### How AI Credits actually work

Credits are consumed based on token usage, input tokens, output tokens, and cached tokens, priced according to each model's own published rate. A short chat question against a cheap model can cost a small fraction of a credit. A long agent-mode session against a frontier model, reading a large diff and iterating across multiple files, can cost dozens of credits in a single interaction. On GitHub's own community discussion thread about the change, developers have posted examples of individual agent-mode requests burning through several hundred credits at once, and one person calculated that four coding-agent requests alone consumed roughly half of their team's monthly promotional allowance. That's what makes "how much will this cost us" hard to answer from the seat price alone: it depends on which model gets picked and how big the task is, not on a flat per-seat number.

Two things are explicitly excluded from credit consumption: code completions and Next Edit Suggestions stay unlimited and unmetered on every paid plan. Everything that involves a back-and-forth interaction, chat, agent mode, the standalone coding agent, code review (which also draws GitHub Actions minutes), and the Copilot CLI, draws from the credit pool.

Credits are pooled at the organization level rather than locked to each individual seat, and the pool resets at 00:00 UTC on the first of each month. Unused credits do not roll over. Once the pool is exhausted, GitHub's documentation describes two outcomes depending on an admin's settings: usage continues and gets billed at $0.01 per credit (the default unless an org has turned that off), or credit-consuming features get blocked until the next reset while completions keep working normally.

### What this does to a real team's bill

The scenario below assumes Copilot Business, since that's the tier that actually applies to most small and mid-sized teams (Enterprise carries its own GitHub Enterprise Cloud prerequisite that adds cost on top, a point we've covered in more detail in our [Copilot, Claude Code, and OpenCode pricing comparison](https://scriptxeno.github.io/posts/github-copilot-vs-claude-code-vs-opencode/)). The credit-per-seat estimates for light, medium, and heavy usage below are our own modeling, built from GitHub's published token rates and the real usage examples cited above, not an official GitHub number, so treat them as a starting point to check against your own team's actual dashboard.

- Light usage: mostly completions plus occasional chat, roughly 300 credits a seat a month.
- Medium usage: daily agent-mode use for typical refactors and debugging, roughly 1,400 credits a seat a month.
- Heavy usage: multiple agent-mode sessions a day, often on a frontier model for real multi-file work, roughly 2,800 credits a seat a month.

| Team size | Usage level | Credits used/month | Pool before Sep 1 (3,000/seat) | Pool after Sep 1 (1,900/seat) | Bill before Sep 1 | Bill after Sep 1 |
|---|---|---|---|---|---|---|
| 3 people | Light | 900 | 9,000 | 5,700 | $57 | $57 |
| 3 people | Medium | 4,200 | 9,000 | 5,700 | $57 | $57 |
| 3 people | Heavy | 8,400 | 9,000 | 5,700 | $57 | $84 |
| 8 people | Light | 2,400 | 24,000 | 15,200 | $152 | $152 |
| 8 people | Medium | 11,200 | 24,000 | 15,200 | $152 | $152 |
| 8 people | Heavy | 22,400 | 24,000 | 15,200 | $152 | $224 |
| 15 people | Light | 4,500 | 45,000 | 28,500 | $285 | $285 |
| 15 people | Medium | 21,000 | 45,000 | 28,500 | $285 | $285 |
| 15 people | Heavy | 42,000 | 45,000 | 28,500 | $285 | $420 |

(Bill figures assume overage is allowed at $0.01 a credit rather than blocked; a team that hard-stops at the pool limit instead pays the flat seat fee and simply loses Copilot access to metered features until the next reset.)

Light and medium teams don't see a dollar change in this model, but they do see their cushion shrink hard. A medium-usage team was using under half its promotional pool before September 1 and jumps to roughly three-quarters of its much smaller September pool, which is a meaningfully worse position even without an overage charge yet. Heavy teams cross the line entirely: the same usage pattern that fit inside the promotional pool with room to spare (93 percent utilization) turns into real overage money the moment the standard allowance takes over, because 2,800 credits a seat was never sustainable against a 1,900-credit baseline.

Because credits pool at the organization level, team size changes the risk profile even when the per-seat allowance is identical. A single unusually heavy month from one developer, say a big migration that burns 6,000 credits, adds only $9 in September overage on a 15-person team's pool, because fourteen lighter teammates' unused credits absorb most of it. That same developer on a 3-person team pushes the whole org over the September pool by nearly a thousand credits. Smaller teams have less room to average out one person's spike, which matters more than the standard per-seat number suggests on its own.

The same mechanics apply one tier up. An 8-seat Enterprise org sees its pool fall from 56,000 credits (7,000 a seat) to 31,200 (3,900 a seat), a drop of nearly 25,000 credits, close to $250 worth of included usage disappearing on September 1 regardless of whether that org's usage habits have adjusted for it.

### What to do before September 1

A few concrete things are worth doing with the time left, most of them inside GitHub's own billing and AI Controls settings.

1. Pull the Copilot usage dashboard now and look at actual monthly credit burn per seat, not the seat price. Compare that number against 1,900 (Business) or 3,900 (Enterprise), not against the promotional number the team has been running against since June.
2. Decide deliberately whether overage should be allowed at $0.01 a credit or blocked outright, rather than leaving whatever the default happens to be. GitHub's AI Controls include a policy toggle for this, and it's worth an explicit decision either way.
3. Set a universal user-level budget above the per-license value if pooling across the team is the goal, and enable the "stop usage when budget limit is reached" toggle if a hard ceiling matters more than uninterrupted access.
4. Give known heavy users an individual budget override instead of raising the cap for everyone. It targets the actual source of overage risk without loosening the limit for teammates who were never close to it.
5. Set an enterprise or organization spending limit on metered overage specifically, so a bad week can't turn into an unbounded pay-as-you-go bill.
6. Push routine, low-stakes work toward cheaper models in the model picker and save frontier or premium models for tasks that actually need them. Since cost is driven by tokens and model rate rather than a flat per-request charge, this single habit change moves the credit math more than almost anything else on this list.
7. Remember that completions and Next Edit Suggestions don't touch the credit pool at all. Routing simple inline work through chat or agent mode when it doesn't need to be there is spending credits for no reason.

None of this requires waiting for September 1. The dashboard, budgets, and model picker work the same way today as after the drop, so a team can simulate the smaller pool this week by watching how close current usage already sits to the standard number.

If the numbers above make Copilot look expensive for a specific team's usage pattern, it's worth comparing against what else is out there, including tools that cost nothing for lighter workloads, rounded up separately in our [guide to free AI coding tools for solo developers](https://scriptxeno.github.io/posts/best-free-ai-coding-tools-2026-solo-developers/). We used a similar approach, real published rates against realistic usage tiers, in our [Claude Code and Opencode Zen cost calculator](https://scriptxeno.github.io/posts/claude-code-opencode-zen-cost-calculator/), for a side-by-side against a different tool's actual math.

### Frequently asked questions

**When exactly does the Copilot credit drop happen?**
September 1, 2026. The boosted promotional allowance runs from June 1 through September 1, 2026, and the standard, lower allowance takes over from that date.

**Does the seat price go up on September 1?**
No. Copilot Business stays at $19 a user a month and Copilot Enterprise stays at $39 a user a month. What changes is the size of the AI Credit allowance bundled into that price, not the price itself.

**Will my team automatically get charged more after September 1?**
Only if usage exceeds the smaller pool and the organization has left metered overage enabled, which bills at $0.01 a credit. A team that disables the overage policy or sets a hard-stop budget instead loses access to credit-consuming features once the pool runs out, rather than accruing a bigger bill.

**Do code completions get affected by this change?**
No. Inline completions and Next Edit Suggestions remain unlimited and unmetered on every paid Copilot plan, before and after September 1. The credit pool only covers chat, agent mode, the coding agent, code review, and the CLI.

**Is switching to a cheaper model inside Copilot actually going to save credits?**
Yes, meaningfully. Since credits are consumed based on each model's own token rate, routing routine work to a smaller or cheaper model instead of a frontier model on the picker directly reduces how many credits a given task costs, without changing what Copilot feature is being used.

**Should a small team avoid Copilot Enterprise because of this?**
For most teams under 15 or so people, yes, and not only because of the credit drop. Enterprise requires GitHub Enterprise Cloud as a prerequisite, which adds its own per-seat cost on top of the $39 Copilot seat, pushing the real price well past what Business already covers for teams that don't need Enterprise's compliance and governance features.

### Sources

- [GitHub Copilot is moving to usage-based billing, The GitHub Blog](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/)
- [Usage-based billing for organizations and enterprises, GitHub Docs](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises)
- [Models and pricing for GitHub Copilot, GitHub Docs](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)
- [Getting started with budget controls, GitHub Docs](https://docs.github.com/en/copilot/tutorials/budgets/getting-started-with-budget-controls)
- [Budgets for usage-based billing, GitHub Docs](https://docs.github.com/en/copilot/concepts/billing/budgets-for-usage-based-billing)
- [GitHub Copilot is moving to usage-based billing, GitHub community discussion #192948](https://github.com/orgs/community/discussions/192948)
- [Copilot AI credits drop up to 44% on 1 September 2026, ecorpit](https://ecorpit.com/github-copilot-promo-credits-expiry-september-bill-forecast-2026/)
- [GitHub Copilot AI Credits Drop September 1: Set Budget Controls, Windows Forum](https://windowsforum.com/windows-news.4/github-copilot-ai-credits-drop-september-1-set-budget-controls.439112/)
