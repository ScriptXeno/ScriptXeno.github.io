---
title: Are AI browser agents like Comet and Atlas safe for small business use yet?
description: A risk-based look at whether Perplexity's Comet and OpenAI's ChatGPT Atlas are mature enough for small business tasks, informed by the 2026 PleaseFix zero-click vulnerability disclosures.
author: oceanofanything
date: 2026-08-19
categories: [AI Agents, cybersecurity, AI Tools]
tags: [ai agents, AI prompt injection, AI risk, AI safety, browser automation, cybersecurity, Small business AI automation, agentic ai, OpenAI, Perplexity]
image:
  path: https://scriptxeno.github.io/2026-08-19-ai-browser-agents-safe-for-small-business-images/2026-08-19-ai-browser-agents-safe-for-small-business.webp
  alt: A browser window with a robot cursor icon inside it next to a cracked shield icon
  lqip: data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
---
## Quick answer

Not yet, not for anything touching money, credentials, or client data without a human watching. Zenity Labs spent 2026 demonstrating that Comet, Atlas, and several other agentic browsers can be hijacked by content the agent reads during a normal task, no click required. The single most important precaution if you use one anyway: never let the agent operate under your primary logged in identity for anything consequential. Give it a separate, low privilege account with no saved payment methods, no access to your main email, and no password manager unlocked in the background.

## What Comet and Atlas actually do well

Before getting into what can go wrong, it's worth being fair about what these tools are for. Perplexity's Comet and OpenAI's ChatGPT Atlas are both Chromium based browsers with an AI agent built in that can read a page, fill out forms, click through multi step workflows, and carry out tasks like booking a reservation, summarizing your inbox, or comparing prices across tabs. For a solo founder or a small team, research that used to take twenty open tabs can happen in one instruction, and repetitive tasks like updating a spreadsheet from a dashboard or drafting a routine email reply get faster.

Comet has pushed hardest into the business market. Comet Enterprise, launched in March 2026, adds admin controls over which actions the agent may take, plus a security partnership with CrowdStrike that plugs the Falcon platform into Comet for threat detection and data protection, deployable through mobile device management. Comet also runs on Windows, Mac, Android, iOS, and iPad, with iPad support adding proper multi window and split view earlier this year.

ChatGPT Atlas told a different story. It launched in October 2025 as a standalone macOS browser with an agent mode for multi step tasks, but Windows, iOS, and Android versions never shipped, even as public betas. OpenAI discontinued the standalone Atlas browser entirely on August 9, 2026, folding it into a ChatGPT Chrome extension and a browser mode inside the ChatGPT desktop app instead. Worth being precise here: this was a planned product consolidation OpenAI announced in advance, not a temporary outage, and Atlas no longer exists as a standalone product.

## The PleaseFix vulnerability, explained without the jargon

PleaseFix is not one bug in one piece of software. Zenity Labs, the firm that disclosed it, describes it as a vulnerability class, a pattern of weakness that shows up anywhere an AI agent treats content it reads as instructions it should follow. Zenity frames it as the agent version of "ClickFix," an older social engineering trick where a fake error message convinces a human to paste a malicious command into their own computer. PleaseFix removes the human step entirely.

In plain terms: an attacker hides instructions inside content the agent is going to process anyway, a calendar invite, an email, a web page, a social post. You ask your browser agent to do something ordinary involving that content, check my calendar, summarize this email thread, look something up on this page. The agent reads the hidden instructions along with the legitimate content and, because it cannot reliably tell "instructions from my user" apart from "text that looks like instructions sitting in a document," it may act on them. Zenity calls this "intent collision," the hidden request overriding your actual request while the agent uses your own logged in session, cookies, and permissions to carry it out. No popup, no click, no obvious error. That is what makes it zero click.

Zenity first disclosed this in Perplexity Comet in March 2026, coordinating with Perplexity and 1Password before going public. The research expanded by August 2026, when Zenity's Michael Bargury and Stav Cohen presented "Pwning Agentic Browsers with PleaseFix" at Black Hat USA. Demonstrated impact ranged from local file theft and password vault compromise to account takeover, unauthorized purchases, and in some chains, deleting cloud infrastructure or corrupting a database the victim had access to.

## Who is actually confirmed affected, and what got patched

The browsers Zenity specifically confirmed and demonstrated zero click exploit chains against are Claude in Chrome, Gemini in Chrome, Perplexity Comet, ChatGPT Atlas, and Microsoft's Copilot Mode in Edge. Genspark, sometimes grouped into this conversation because it is also an agentic browsing product, was not on Zenity's confirmed PleaseFix list, so it belongs in "mentioned in passing" rather than confirmed, at least based on what Zenity has published.

Patch status is uneven and not fully public. Perplexity added blocks on file system access after the initial disclosure, but Zenity reported bypassing those filters twice, once via view source style URLs and once via file extension tricks, a useful data point on how hard this bug class is to close with a single fix. OpenAI shipped a Lockdown Mode in February 2026 and a hardening update built on adversarial red teaming, but its own security team wrote plainly that prompt injection is unlikely to ever be fully solved, comparing it to scams and social engineering on the open web. That's an unusually honest thing for a vendor to say, and it deserves to be treated as a calibration signal, not dismissed as an excuse.

Comet has a track record here beyond PleaseFix. SquareX found undisclosed built in extensions with system level access in late 2025, LayerX testing found Comet stopped only about 7 percent of phishing and web based attacks out of the box versus roughly 47 percent for Chrome and 54 percent for Edge, and Guardio's "Scamlexity" research showed it completing a fake storefront purchase without confirmation. None of this makes Comet uniquely bad, the whole category has these problems, but it gives Comet the longest public track record of researchers finding them.

## The real threat model: it's not hackers, it's the page you're already on

For a small business owner, the mental model that matters is not "someone breaks into my computer." It's closer to this: you hand a new, eager, not very skeptical employee your logged in laptop and ask them to handle your inbox and some bookings for the afternoon. Most of what they touch is fine. But if one email or calendar invite that day contains a note addressed to "the assistant handling this inbox," that employee might follow it, because they cannot always tell a legitimate instruction from an embedded one. That is the entire threat model. No malware needs to land on your machine. The compromised or malicious page, email, or invite is the attack, and your agent's own permissions are the payload.

This blog has covered the broader version of this problem before, including a [deeper hardening playbook for agent security in general](https://scriptxeno.github.io/posts/why-openclaw-is-dengerous/), worth reading if you're already running any kind of autonomous agent, browser based or not.

## What to check before you let an agent touch anything real

Start by assuming the agent will eventually read something it shouldn't, and plan around that instead of hoping it won't happen. A few concrete things to check before adoption, not after: whether the tool runs under a separate account with no access to your primary email, banking, or password manager, whether it requires an explicit, unbypassable confirmation step for anything consequential (sending money, emailing a new recipient, deleting something), and whether that confirmation can itself be spoofed by injected content, which research has already shown is possible in some cases. Also check whether the vendor publishes a security disclosure process and an actual patch history rather than just marketing copy about safety. If you're looking at an enterprise tier for its admin controls, ask what those controls actually restrict. Permission scoping narrows the blast radius, it doesn't eliminate the underlying architecture problem.

This blog's [practical AI security checklist](https://scriptxeno.github.io/posts/indie-hacker-vibe-coding-security-checklist/) walks through a lot of this from the angle of a solo operator or small team, and the [tool vetting guide for small business security](https://scriptxeno.github.io/posts/best-openclaw-agentskills-small-business-security-checked/) is directly relevant if you're comparing several agentic tools and need a repeatable way to vet them rather than trusting a vendor's own claims.

## Is this mature enough for anything sensitive yet

Being honest, no. This isn't one buggy release that gets fixed next quarter. Gartner told CISOs in December 2025 to hold off on AI browsers for now, and the industry data backs that caution up rather than making it look overcautious in hindsight. Darktrace's 2026 report found 92 percent of security professionals concerned about AI agents in their organization, and a Gravitee survey found that while more than 80 percent of technical teams have pushed agents into active testing or production, fewer than 15 percent of those deployments went live with full security and IT approval. That gap, adoption running well ahead of governance, is exactly the environment where a zero click exploit class like PleaseFix does real damage before anyone notices.

None of that makes these tools useless. For low stakes browsing, research, and drafting where the worst case is mildly annoying rather than costly, a browser agent run under a limited account is a reasonable bet today. For anything touching your business bank account, client data, or your primary email, wait, or use these tools in a tightly scoped, supervised way rather than handing over standing access and walking away. OpenAI itself is telling you this problem has no finish line. Believe them.

## Frequently asked questions

**Did PleaseFix get fully fixed?** Not as a single fix. Perplexity added filters that researchers then bypassed, and PleaseFix is described by its discoverers as a structural vulnerability class rather than a specific bug, so no single patch closes it for good across the affected browsers.

**Is ChatGPT Atlas still available?** No, not as a standalone browser. OpenAI discontinued it on August 9, 2026, after roughly nine months, folding its browsing features into a ChatGPT Chrome extension and a browser mode in the ChatGPT desktop app.

**Should a small business use the enterprise version for more safety?** Enterprise tiers like Comet Enterprise add real controls, admin restrictions on agent actions and integration with security tools like CrowdStrike, and that meaningfully reduces exposure. It does not eliminate the underlying zero click risk, which sits in how the agent interprets content, not in account permissions alone.

**What's the single biggest mistake a small business could make here?** Connecting the agent to fully privileged accounts, main email, saved payment methods, an unlocked password manager, and then leaving it unsupervised. Treat it like a new hire on day one, not a trusted long term employee.

**Is prompt injection the same thing as PleaseFix?** Related but not identical. Prompt injection is the general technique of hiding instructions in content an AI processes. PleaseFix is Zenity's name for a specific class of zero click exploit chains built on that technique, targeting the browser agent architecture rather than a single chatbot interface.

## Sources

- [PleaseFix: Zero-Click AI Agent Vulnerabilities (Zenity Labs research)](https://zenity.io/research/pleasefix-vulnerabilities)
- [Zenity Labs Discloses PleaseFix Vulnerability Family in Perplexity Comet and Other Agentic Browsers](https://zenity.io/company-overview/newsroom/company-news/zenity-labs-discloses-pleasefix-perplexedagent-vulnerability)
- [Zenity Labs Exposes the Full Scope of PleaseFix (Business Wire, Black Hat USA 2026 research)](https://www.businesswire.com/news/home/20260805803998/en/Zenity-Labs-Exposes-the-Full-Scope-of-PleaseFix-a-Vulnerability-Class-Enabling-Zero-Click-Attacks-Across-Leading-Agentic-Browsers)
- [PleaseFix: Zenity Demonstrates Zero-Click Takeover of Every Major Agentic Browser (Forkast)](https://forkast.news/pleasefix-zenity-demonstrates-zero-click-takeover-of-every-major-agentic-browser/)
- [The vulnerability that turns your AI agent against you (Help Net Security)](https://www.helpnetsecurity.com/2026/03/04/agentic-browser-vulnerability-perplexedbrowser/)
- [PleaseFix: Zero-Click Browser Agent Hijacking (Cloud Security Alliance research note)](https://labs.cloudsecurityalliance.org/research/csa-research-note-pleasefix-agentic-browser-exploits-2026032/)
- [Security gap in Perplexity's Comet browser exposed users to system-level attacks (Help Net Security)](https://www.helpnetsecurity.com/2025/11/20/perplexity-comet-browser-security-mcp-api/)
- [LayerX finds Comet browser up to 85 percent more vulnerable to phishing and web attacks than Chrome](https://layerxsecurity.com/blog/layerx-finds-that-perplexitys-comet-browser-is-up-to-85-more-vulnerable-to-phishing-and-web-attacks-than-chrome/)
- [Researchers Trick Perplexity's Comet AI Browser Into Phishing Scam in Under Four Minutes (The Hacker News)](https://thehackernews.com/2026/03/researchers-trick-perplexitys-comet-ai.html)
- [CrowdStrike and Perplexity Partner to Deliver Enhanced Security for Comet Enterprise](https://www.crowdstrike.com/en-us/press-releases/crowdstrike-perplexity-extend-enterprise-grade-security-to-comet-enterprise/)
- [Comet Enterprise (Perplexity)](https://www.perplexity.ai/enterprise/comet)
- [Continuously hardening ChatGPT Atlas against prompt injection attacks (OpenAI)](https://openai.com/index/hardening-atlas-against-prompt-injection/)
- [OpenAI says prompt injection may never be solved for browser agents like Atlas (CyberScoop)](https://cyberscoop.com/openai-chatgpt-atlas-prompt-injection-browser-agent-security-update-head-of-preparedness/)
- [OpenAI explains what will happen when ChatGPT Atlas shuts down (9to5Mac)](https://9to5mac.com/2026/08/04/openai-explains-what-will-happen-when-chatgpt-atlas-shuts-down-this-weekend/)
- [Perplexity's Comet AI browser for iOS upgraded with 8 major improvements (9to5Mac)](https://9to5mac.com/2026/05/21/perplexitys-comet-ai-browser-for-ios-upgraded-with-8-major-improvements/)
