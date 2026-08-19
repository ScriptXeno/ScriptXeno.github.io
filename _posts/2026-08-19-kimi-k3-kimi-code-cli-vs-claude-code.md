---
title: "Kimi K3 and Kimi Code CLI: Is Moonshot's Free Coding Agent Worth a Look"
description: Moonshot AI's Kimi K3 model and Kimi Code CLI get pitched as a free Claude Code alternative. Here's what the specs, pricing, license, and benchmarks actually show, verified against current sources.
author: oceanofanything
date: 2026-08-19
categories: [AI Tools, AI, Developer Platforms]
tags: [Kimi K3, Kimi Code CLI, Moonshot AI, Claude Code alternative, OpenCode, AI Coding Agent, china, benchmark, pricing, Open source AI coding tool]
image:
  path: https://scriptxeno.github.io/2026-08-19-kimi-k3-kimi-code-cli-vs-claude-code-images/2026-08-19-kimi-k3-kimi-code-cli-vs-claude-code.webp
  alt: Price comparison bar chart showing Kimi K3's lower per-million-token cost against Claude
  lqip: data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
---
## Kimi K3 and Kimi Code CLI: Is Moonshot's Free Coding Agent Worth a Look

Moonshot AI, the Chinese lab behind the Kimi chatbot, released a new open-weight model called Kimi K3 in July 2026, alongside its own terminal coding agent, Kimi Code CLI. Both have been getting pitched around as a cheap way to get Claude Code style agentic coding without an Anthropic subscription. That pitch is only partly true, so here is what actually checks out.

### Quick answer

Kimi K3 is a real, large, open-weight model (Moonshot says 2.8 trillion parameters, mixture-of-experts, 1 million token context) that does well on coding-specific benchmarks and costs a fraction of Claude's per-token price. Kimi Code CLI is a genuinely open-source (Apache-2.0) terminal agent that feels similar to Claude Code to use. Neither one is fully free, though: the free tier of Moonshot's own app only gives you the older K2.7 model, and you need a paid plan or API key to actually run K3. For cost-conscious solo developers who don't mind a rougher edge here and there, it's worth trying. For anyone whose work can't tolerate an occasional wrong answer, Claude Code still has the edge in maturity.

### What Kimi K3 and Kimi Code CLI actually are

These get talked about as one product, but they're two different things. Kimi K3 is the model, a mixture-of-experts system Moonshot released on July 16, 2026. Moonshot puts the parameter count at 2.8 trillion, though one Fortune report cited 2.7 trillion, so treat the exact figure as "around 2.7 to 2.8 trillion" rather than a settled spec. It runs 16 active experts out of 896 per token, uses what Moonshot calls "Kimi Delta Attention," and ships with a 1 million token context window plus native image and video input. Moonshot calls it the world's first "open 3T-class" model, meaning the first open-weight model in that size class aiming to compete with the largest proprietary systems.

Kimi Code CLI is the separate terminal agent, a TypeScript tool that reads and edits code, runs shell commands, searches files, and fetches web pages while asking for confirmation before risky actions, the same permission-gated pattern Claude Code uses. It's evolving out of an earlier Python tool called Kimi CLI, which is being wound down as users migrate. Adding to the naming confusion, Moonshot also sells a hosted subscription product called "Kimi Code" through its consumer app, which is not the same thing as the open-source Kimi Code CLI on GitHub, despite the near-identical branding.

### The benchmark picture, with real caveats

Moonshot's own tables show K3 doing well specifically on coding tasks: 76.8 percent on SWE-bench Verified, 88.3 on Terminal-Bench 2.1, 81.2 on FrontierSWE, plus strong GPQA Diamond and TAU-Bench scores in the low-to-high 90s and high 70s. Coverage of the release said K3 places within the top three tested models on most benchmarks and leads specifically on frontend and visual coding tasks, while Moonshot describes it as competitive with current flagship models from Anthropic and OpenAI, though multiple outlets noted it still trails Claude's Opus 4.8 and OpenAI's GPT-5.6 on overall, non-coding benchmarks.

Take that with the usual grain of salt that applies to any vendor's own comparison table. Coverage of the release specifically flagged that different vendors ran these benchmarks with different agent harnesses, and swapping harnesses alone can shift scores by 10 to 26 points on some tasks. "K3 beats X on benchmark Y" is a shakier claim than it looks in a marketing table, and independent, harness-matched comparisons are still catching up.

### Pricing: cheaper, not free

Through Moonshot's own API, Kimi K3 costs $3 per million input tokens and $15 per million output tokens, with cached input tokens dropping to about $0.30 per million, a 90 percent discount, and no surcharge for the full 1 million token context. Through OpenRouter, which aggregates roughly a dozen third-party hosts including Fireworks, Together, DeepInfra, and Baseten, blended pricing runs slightly lower, around $2.60 input and $13 output per million tokens. Either way, that undercuts Claude's per-token pricing by a wide margin; for the specific numbers on Claude's side, see our [Claude Code plus Opencode Zen cost calculator](https://scriptxeno.github.io/posts/claude-code-opencode-zen-cost-calculator/).

The "free" part of the pitch needs a caveat. Moonshot's consumer app has a free tier, but it only includes the older K2.7 model with a handful of agent credits a month and no access to the Kimi Code agent product. Getting K3 through the hosted app requires a paid tier, priced around $19 a month and up in US pricing, with higher tiers adding more parallel agents and the full 1 million token context. What's actually free is the Kimi Code CLI software itself, since it's Apache-2.0 licensed and costs nothing to download. You still need to bring your own inference: a Moonshot API key billed pay-as-you-go, a paid Kimi subscription, or another provider's API pointed at through the CLI's config.

### The license on the model weights has strings attached

Kimi K3's weights are downloadable, which is genuinely useful if you want to self-host, but calling it fully open source oversimplifies things. Coverage of the license terms describes a custom document rather than a plain MIT license: run K3 as a paid hosted inference service and you need a separate agreement with Moonshot once that business crosses $20 million a year in revenue from it, and embed K3 inside your own product and you're required to prominently display "Kimi K3" once that product passes 100 million monthly active users or $20 million a month in revenue. None of that affects a solo developer experimenting locally, but read the actual license file before planning a commercial deployment around the open weights.

### How to actually try it

There are a few practical routes to K3 or Kimi Code CLI, and none require Moonshot's consumer app.

The most direct is installing Kimi Code CLI itself, via a shell install script, Homebrew, or npm with Node 22.19 or later, then pointing it at a Moonshot API key. It includes built-in subagents for parallel coder, explore, and plan roles, conversational MCP server setup, a VS Code extension, and Agent Client Protocol support for editors like Zed and JetBrains.

The second is through OpenCode, the model-agnostic coding agent we've [covered in detail before](https://scriptxeno.github.io/posts/opencode-open-source-ai-agent/). Moonshot AI is one of OpenCode's supported providers: run `opencode auth login`, select Moonshot AI, paste in a Kimi Open Platform API key, and set the model to K3. Since OpenCode already handles the agent workflow, editing, and tool use, this is arguably the lowest-friction way to test K3, and it fits alongside the free-model routing this blog has [written about for solo developers](https://scriptxeno.github.io/posts/best-free-ai-coding-tools-2026-solo-developers/) stitching a setup together from more than one provider.

There's also a third, slightly odd option. Because Moonshot serves K3 through an Anthropic-compatible endpoint, you can point Claude Code itself at Kimi's API by changing the base URL and model environment variables, the same endpoint-swapping trick documented elsewhere on this blog. That gets you Claude Code's interface with K3 doing the actual model work underneath, at K3's token pricing rather than Anthropic's.

### What developers are actually saying

Reception so far is fairly consistent. People who've tried Kimi Code CLI describe it as familiar if you already know Claude Code, with video input and conversational MCP setup called out as genuine points of difference rather than parity features. On the model side, comparisons generally agree that Kimi K3 wins on cost per task, one comparison put it around $0.95 per benchmarked task, the cheapest of the group, and does particularly well on frontend and visual coding work, while Claude Code keeps the edge on general reasoning, long-horizon consistency, and reliability where a wrong answer is expensive to unwind. That split, cost and specific strengths against polish and consistency, is a genuine tradeoff, not a case of one tool simply being better.

### Should you actually use it

If you're cost-sensitive, curious about self-hosting an open-weight model, or doing frontend-heavy work where K3 specifically performs well, it's worth setting up, especially through OpenCode where the switching cost is low. If your work involves long, expensive, hard-to-verify tasks where a wrong answer is costly, there's no pressing reason to drop Claude Code yet. Plenty of developers will end up running both: K3 for cheap, high-volume work, Claude Code for the parts of a project where getting it right the first time matters more than the token bill.

### Frequently asked questions

**Is Kimi K3 actually free to use?**
Not in the way "free" usually implies. Moonshot's free app tier only includes the older K2.7 model with a small monthly agent-credit allowance, not K3 or the Kimi Code agent. Using K3 means paying either through Moonshot's API ($3 per million input tokens, $15 per million output tokens) or a paid app subscription tier.

**Is Kimi Code CLI open source?**
Yes, the CLI tool itself is Apache-2.0 licensed and free to download. That's separate from the K3 model weights, which are open-weight under a custom license with commercial-use gates, not a standard permissive license.

**How does Kimi K3 actually compare to Claude Code on real work?**
Moonshot's own tables show K3 doing well on coding and tool-use tasks, leading on frontend and visual coding work specifically, while trailing Claude's top-tier model on broader, non-coding benchmarks. Independent comparisons generally agree Kimi wins on cost and those specific coding strengths while Claude Code wins on overall reliability and polish. Vendor harnesses differ per model and can swing scores by 10 to 26 points, so treat any single number skeptically.

**Can I use Kimi K3 inside tools I already use?**
Yes. Kimi Code CLI works directly with a Moonshot API key, OpenCode has an official Moonshot AI provider you can select during setup, and because Moonshot serves K3 through an Anthropic-compatible endpoint, you can even point Claude Code itself at Kimi's API by editing its base URL and model settings.

**What's the catch with calling the model weights "open source"?**
The license carries revenue-based gates rather than being a plain permissive license: a paid hosted service built on K3 needs a separate agreement with Moonshot past $20 million a year in revenue from that use, and a product embedding K3 must display "Kimi K3" attribution once it passes 100 million monthly active users or $20 million a month in revenue.

**Should I switch from Claude Code to Kimi Code CLI?**
Probably not a full switch, at least not yet. It's a reasonable addition for cost-sensitive or high-volume work, particularly frontend-heavy tasks, but Claude Code still has the longer track record for high-stakes work where reliability matters more than price per token.

### Sources

- [Moonshot's Kimi K3 pushes Chinese AI into new territory - Fortune](https://fortune.com/2026/07/16/moonshots-kimi-k3-pushes-chinese-ai-into-fable-level-territory/)
- [China's Moonshot AI unveils Kimi K3 that rivals OpenAI, Anthropic - CNBC](https://www.cnbc.com/2026/07/17/moonshot-ai-kimi-k3-model-openai-anthropic-china.html)
- [Kimi K3 by Moonshot AI - Modal Model Library](https://modal.com/library/moonshot/kimi-k3)
- [Kimi K3 - API Pricing & Benchmarks - OpenRouter](https://openrouter.ai/moonshotai/kimi-k3)
- [MoonshotAI/kimi-cli - GitHub](https://github.com/MoonshotAI/kimi-cli)
- [Kimi Code - Moonshot AI](https://www.kimi.com/code)
- [Kimi Code CLI: A Beginner-Friendly Guide to Moonshot AI's Terminal Coding Agent - DEV Community](https://dev.to/arshtechpro/kimi-code-cli-a-beginner-friendly-guide-to-moonshot-ais-terminal-coding-agent-39db)
- [Moonshot AI Releases Kimi Code CLI: A Terminal AI Coding Agent Built in TypeScript - MarkTechPost](https://www.marktechpost.com/2026/06/06/moonshot-ai-releases-kimi-code-cli-a-terminal-ai-coding-agent-built-in-typescript-for-next-gen-agents/)
- [Is Kimi K3 Open Source? License, Weights, GitHub, and What You Can Actually Use Today - Wan 2.7](https://wan27.org/blog/kimi-k3-open-source)
- [Kimi K3 Benchmarks Explained: A Coding-Agent Evaluation Guide - NxCode](https://www.nxcode.io/resources/news/kimi-k3-benchmarks-coding-agent-evaluation-guide-2026)
- [Kimi Code Plan Guide 2026 - codingplan.org](https://codingplan.org/en/plans/kimi)
- [Kimi vs Claude Code: Coding Agent Comparison 2026 - Layer3Labs](https://www.layer3labs.io/comparisons/kimi-k3-vs-claude-code)
- [Use Kimi Models in OpenCode - Kimi API Platform](https://platform.kimi.ai/docs/guide/open-code)
