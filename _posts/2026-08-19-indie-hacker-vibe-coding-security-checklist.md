---
title: "The Indie Hacker's Vibe-Coding Security Checklist: What to Fix Before You Launch"
description: "A practical, no-budget security checklist for indie hackers about to launch a vibe-coded app: secrets, broken access control, injection, insecure defaults, hallucinated packages, and logging, with real 2026 incident data."
author: oceanofanything
date: 2026-08-19
categories: [Vibe Coding, AI, cybersecurity]
tags: [vibe coding, AI safety, Vibe Coding Tools, AI risk, startups, Claude Code for Indie Hackers, AI code generation, app development]
image:
  path: https://scriptxeno.github.io/2026-08-19-indie-hacker-vibe-coding-security-checklist-images/2026-08-19-indie-hacker-vibe-coding-security-checklist.webp
  alt: Checklist graphic of six vibe-coding security categories for indie hackers
  lqip: data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
---
## The Indie Hacker's Vibe-Coding Security Checklist: What to Fix Before You Launch

You built a working app in a weekend by describing what you wanted to Claude, Lovable, Bolt, or Replit Agent, and now you are staring at a "deploy" button. The app works. Every existing 2026 article about vibe coding security is written for enterprise security teams, with sections on SIEM integration and CISO reporting lines. None of it is written for the person who is actually about to click deploy this week, alone, with no security team to hand this off to.

This is that article. It assumes you have a working app, a few hours before launch, and no budget for a penetration test. It is a practical companion to our [earlier look at how small teams are using vibe coding](/posts/vibe-coding-small-teams-custom-apps-2026/) to build custom software fast. That post covered the trend and the cost savings. This one covers the part that gets skipped when speed is the whole point.

## Quick answer

There is no single switch that makes a vibe-coded app "safe." But most of the damage in real incidents traces back to a short list of gaps: secrets left in code or git history, API routes that never check who is asking or what they are allowed to touch, user input that reaches a database or a browser without validation, and default settings the AI generated for convenience during development that nobody tightened before launch. Work through those four categories, plus your dependencies and your logging, and you will have closed off the vulnerability classes that actually show up in production vibe-coded apps, not a generic "be more secure" checklist.

## Why vibe-coded apps keep failing security reviews

This is not a vague fear. GitGuardian's State of Secrets Sprawl 2026 report, published in March, found that AI-assisted commits leak hardcoded secrets at 3.2 percent, more than double the 1.5 percent rate for human-only commits. The same report counted 28.65 million new secrets exposed on public GitHub in 2025, a 34 percent jump year over year, with leaked credentials tied to AI services themselves up 81 percent.

Application security firm Escape scanned 5,600 live, publicly deployed vibe-coded applications and documented more than 2,000 high-impact vulnerabilities, over 400 exposed secrets, and 175 instances of exposed personal data including medical and financial records, all in software that was already running in production. Forbes covered the same research in March 2026 under the headline "Vibe Coding Has A Massive Security Problem," and the number that should worry you is not the scan's total but the fact that the apps it scanned looked done. They had users. They had launched.

The mechanism is straightforward: a language model optimizes for whatever you asked it for. If your prompt was "build a login page" and not "build a login page that checks the requesting user actually owns the account they are viewing," you frequently get the first thing and not the second. Even the vibe-coding platforms themselves are not immune to this gap. In July 2025, Wiz Research found that Base44 (since acquired by Wix) generated apps whose registration and one-time-password endpoints required no authentication at all, and whose app identifier was exposed right in the public URL. Anyone who found that identifier could register as a user of someone else's private app. Wix patched it within 24 hours, but the bug had been sitting in production apps the whole time, unnoticed, because nobody had asked the AI to check for it.

## The pre-launch checklist

### 1. Secrets and credentials

Rotate any API key, database password, or token you ever pasted directly into a chat prompt, especially if you used a free or low-cost model gateway. Some of these platforms retain conversation data for evaluation or training, a point we flagged when covering [running Claude Code through a free model gateway](/posts/claude-code-unlimited-opencode-zen/): treat anything typed into a prompt window as no longer private.

Confirm your `.env` file is actually ignored by git, not just listed in `.gitignore` after the fact. Check `git log -p -- .env` (or search history for your key's prefix) to make sure an early commit did not already capture it before you added the ignore rule. A `.gitignore` entry does nothing to history that predates it.

Check whether the AI put a key directly into frontend JavaScript. Anything shipped to the browser is public, so calls to paid APIs need a small backend route that holds the key server-side, not a client-side fetch with the key inline. Before your first real deploy, run an open-source scanner like gitleaks against the whole repository, including history, not just the current commit.

### 2. Authentication and authorization

This is the single most common failure class in AI-generated code, and it maps directly to the OWASP Top 10's leading category, broken access control. The AI tends to write a query like "get the invoice by its ID" and stop there, producing something equivalent to `SELECT * FROM invoices WHERE id = ?` with no check that the invoice belongs to the person asking for it. That is an IDOR (insecure direct object reference) vulnerability, and it is exactly the shape of bug Wiz found in Base44.

Go through every route in your app and ask two questions: does it require a logged-in session, and does it verify the logged-in user owns the specific record being requested? Do not stop at the UI. Hiding a button or a page link is not a security control if the underlying API route will still answer a direct request. Test this yourself: log in as one test account, note an object ID that belongs to a second test account, and try to fetch it directly by changing the ID in the URL or request body.

### 3. Input validation and injection

Check that database access goes through parameterized queries or your ORM's built-in escaping, not string concatenation with values a user typed. AI assistants know the correct pattern, but under time pressure or in a quick fix later in the project, string-built queries can slip back in.

Check anywhere the app displays content a user submitted, comments, profile bios, uploaded filenames, for whether it is properly escaped before being rendered, or whether the AI took a shortcut with raw HTML insertion. If you are on a framework where that shortcut has a name (React's `dangerouslySetInnerHTML` is the obvious one), search your codebase for it directly. For file uploads, confirm the file type and size limits are enforced on the server, not only in the frontend form, since a frontend check is trivial to bypass with a direct request.

### 4. Defaults the AI never thought to lock down

A handful of settings get left wide open because they were convenient during development and nobody circled back:

1. CORS configured to allow any origin, which is fine for local testing against your own frontend but becomes a problem once real authenticated requests are in play.
2. Debug mode or verbose error pages still active, which can leak stack traces, file paths, or internal variable names to anyone who triggers an error.
3. An admin or internal dashboard route that the AI built for your convenience and left reachable at a guessable path, with no additional check beyond "you know the URL."
4. No rate limiting on login, signup, or password reset endpoints, leaving them open to brute-force attempts or automated abuse.

None of these require deep security expertise to fix. They require someone to actually go looking, which is the step that gets skipped when the goal was to ship fast.

### 5. Dependencies and generated packages

AI coding assistants occasionally reference packages that do not exist. Researchers from the University of Texas at San Antonio, Virginia Tech, and the University of Oklahoma generated 576,000 code samples across sixteen commercial and open-source models and found that 19.7 percent of the packages referenced were hallucinated, names that do not exist on any public registry. That matters because an attacker can register that exact nonexistent package name ahead of time and wait for someone's build to pull it in, a technique known as slopsquatting. Before installing anything an assistant suggested, check that the package actually exists on the real registry, has a plausible download history, and matches what you expected it to do. Pin your dependency versions rather than letting the project drift to whatever "latest" resolves to on a future install.

### 6. Logging, monitoring, and a plan for when something goes wrong

Search your codebase for stray debug logging that prints full request bodies, headers, or tokens. It is an easy thing for an assistant to add while chasing a bug and forget to remove afterward. Beyond that, you do not need an elaborate setup, just something. A basic error tracker and access logs are enough to tell you whether something unusual happened, and worth having before launch rather than after an incident. Decide now, not during an incident, what you would actually do first if you saw a spike in signups from one IP range or a report of someone accessing data that was not theirs.

## Running this in an afternoon

If you built the app with a terminal-native coding agent like [Claude Code or OpenCode](/posts/opencode-open-source-ai-agent/), that same tool can do a useful first pass on this list. Ask it directly to list every API route in the project, state whether each one checks authentication, and state whether each one that touches a specific record also checks ownership of that record. It will not catch everything, since the same model that wrote the gap can miss it on review too, but it turns a vague "check for security issues" prompt into a concrete list you can verify by hand.

Pair that with two manual steps that models are worse at: the IDOR test described above, done as a real logged-in user trying to reach another user's data, and a walk through your `.env` and deployment settings looking for the defaults listed in section four. An automated scan and a five-minute human test cover most of what matters more than either one alone. Our [earlier OpenClaw security playbook](/posts/why-openclaw-is-dengerous/) covers a related but distinct problem, autonomous AI agents acting with excessive permissions once they are running. This checklist is about the application your AI helped you write, not the agent itself, but the underlying lesson is the same: AI-assisted development moves the effort from typing code to reviewing it, and skipping the review is where the risk lives.

## Frequently asked questions

**Is vibe coding inherently insecure?**
No. The vulnerabilities showing up in vibe-coded apps are ordinary, well-understood classes like broken access control and injection, not something new to AI. What is different is that the person shipping the app often has no background to recognize them, and the tool will not raise a flag unless it was asked to.

**How long does a basic security pass actually take?**
For a small indie project, a focused afternoon covering the six sections above is realistic: an hour on secrets and dependencies, an hour manually testing authorization on your core routes, and the rest on defaults and logging. It will not replace a professional audit, but it closes the gaps that account for most real incidents.

**Do I need to hire a security engineer before launching a side project?**
For a small MVP with no regulated data, generally no. For anything handling payment details, health information, or other people's private data at scale, a paid review before launch is worth the cost even for a solo founder.

**What is the single most common vulnerability in vibe-coded apps?**
Broken access control, particularly IDOR, where an API checks that a user is logged in but not that the specific record they are requesting belongs to them. It lines up with OWASP's own ranking of broken access control as the top category in its Top 10 list.

**Will AI coding tools eventually fix this on their own?**
Some platforms are adding security-focused scanning as a feature, and models continue to improve. But as of today, the burden is still on whoever is shipping the app to ask for these checks explicitly and verify the results, not to assume the tool added them by default.

**Should I re-run this checklist after every update, or just before the first launch?**
Treat it as a pre-launch pass plus a lighter recheck after any change that touches authentication, adds a new API route, or adds a new dependency. Most of the risk gets introduced when new surface area is added, not when existing, already-reviewed code sits untouched.
