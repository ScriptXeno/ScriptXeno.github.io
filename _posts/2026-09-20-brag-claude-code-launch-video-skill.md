---
title: "/brag: The Claude Code Skill That Makes Your Project's Launch Video For You"
description: A Claude Code skill that writes your launch video's brief and hands rendering to HyperFrames — how /brag's cross-agent trick works, and if it's worth it.
author: oceanofanything
date: 2026-09-20
categories: [AI Agents, Developer Platforms, Generative Video, GitHub Projects, Vibe Coding]
tags: [ai, ai agents, agentic ai, vibe coding, Claude, Claude Code Guide, developer-tools, open-source, github, video generation with ai, generative-ai, creative-ai, AI video, skills.sh]
image:
  path: https://cdn.jsdelivr.net/gh/ScriptXeno/2026-09-20-brag-claude-code-launch-video-skill-images@main/2026-09-20-brag-claude-code-launch-video-skill.webp
  alt: Hand-drawn poster illustration of a person with a red retro TV/camera for a head, screen showing a play button, headline reading Your Project Just Shipped, Now Let It Brag
  lqip: data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
---
**TL;DR**
- `/brag` is a Claude Code Agent Skill that turns a finished project into a 20-second launch video — one command, no video editor required.
- It doesn't render anything itself. It writes the creative brief (angle, tone, which moments to show) and hands the actual video build to [HyperFrames](https://scriptxeno.github.io/posts/hyperframes-heygen-html-to-video-ai-agents/), HeyGen's open-source HTML-to-video framework.
- The genuinely clever engineering bit: the repo exposes one skill directory at four different agents' discovery paths via symlinks, so the same install works in Claude Code, opencode, Codex CLI, and Google Antigravity.
- It's small — about three months old, ~5,954 stars, one maintainer — and real: fixed bugs fast, declined a 10,400-line rewrite to stay lightweight, and has at least one company quietly forking it for internal use.
- Public discourse is thin (no Reddit or Hacker News thread, no Product Hunt listing), which is normal for a project this size and age, not a red flag.
- It has zero independent value if HyperFrames stalls — that's the honest trade-off of building "thin on purpose."

## What /brag Actually Does

`/brag` (repo: [latent-spaces/brag](https://github.com/latent-spaces/brag), docs: [latent-spaces.github.io/brag](https://latent-spaces.github.io/brag/)) is a Claude Code **Agent Skill** — a packaged set of instructions Claude follows, not a standalone application. You run it from inside a project you just built, type "let's /brag," and it walks through a pipeline: plan, then a composition brief, then share copy, then a rendered `brag.mp4`, all dropped into a `brag-output/` folder alongside the plan and brief files it wrote along the way.

The part worth understanding is where the skill's job ends. `/brag` never touches a rendered frame. It decides the product angle, the tone, and which moments of your project deserve screen time — then hands that brief entirely to HyperFrames, which we've [covered in depth already](https://scriptxeno.github.io/posts/hyperframes-heygen-html-to-video-ai-agents/): HeyGen's open-source framework for having an AI agent direct HTML/CSS/JS motion graphics rather than generate video pixel-by-pixel. If you haven't read that piece, the short version is that HyperFrames treats a video as animated web components with a timeline, which is exactly the kind of thing an agent can reason about and edit — no diffusion model guessing what a "product demo" should look like frame by frame.

`/brag`'s own `SKILL.md` states this design choice outright, and it's a good line because it reframes what looks like a limitation as a bet: *"Brag stays thin on purpose so it rides the latest HyperFrames and gets their improvements for free."* Every time HeyGen improves HyperFrames' rendering, timing, or effects, `/brag` gets better without its own maintainer touching a line of code.

Two flags round out the surface area. Voiceover is off by default — when you want narration, `--voice` turns it on and routes through Kokoro, an open-source TTS engine, itself invoked through HyperFrames rather than by `/brag` directly. Tone is steerable with `--tone '...'` if the default doesn't match your project's personality. That's the whole interface: a command, two optional flags, and an output folder.

## The Clever Part: One Skill Directory, Four Agent Homes

The more interesting engineering story here isn't the video output — it's distribution. Every AI coding agent that supports "skills" looks for them in its own directory convention: Claude Code checks `.claude/skills/`, opencode checks `.opencode/skills/`, and so on. Normally that means a skill author either picks one agent and ignores the rest, or maintains near-duplicate copies of the same instructions in multiple folders.

`/brag` sidesteps this with git symlinks. There's exactly one real directory, `skills/brag/`, and `.claude/skills/brag/`, `.agents/skills/brag/`, and `.opencode/skills/brag/` are all symlinks pointing back to it — confirmed by pulling the repo's [raw git tree via the GitHub API](https://api.github.com/repos/latent-spaces/brag/git/trees/main) and seeing those paths listed as mode-`120000` (symlink) blobs, not real directories. Clone the repo, and whichever agent you're using finds the skill sitting right where it expects, because as far as the filesystem is concerned, it is.

Coverage reaches even further than the symlink trick alone: [PR #15](https://github.com/latent-spaces/brag/pull/15), responding to [issue #14](https://github.com/latent-spaces/brag/issues/14), added a global-path lookup at `~/.gemini/config/skills/brag/` so Google Antigravity — [our earlier coverage here](https://scriptxeno.github.io/posts/google-antigravity/) — can discover it too, since Antigravity doesn't look inside a project's own `.claude`-style folders the same way. The whole cross-agent push traces back to a blunt complaint in [issue #1](https://github.com/latent-spaces/brag/issues/1) — *"Claude code supremacy has to end 😭"* — which the maintainer resolved six days later when [PR #3](https://github.com/latent-spaces/brag/pull/3) merged.

It's not a free lunch. Symlinks are a genuine friction point on Windows: without `git config core.symlinks true` and, in some setups, admin rights, `git clone` on Windows either fails to materialize them or drops in plain text files pointing nowhere, and the workaround is copying the target directory manually. That's a real cost that a single-path, Claude-only skill simply doesn't have to think about — worth knowing before you tell a Windows-using teammate to just clone and go.

There's also a legitimate bug this mechanism produced and then fixed: because the skill referenced its own assets by a path that assumed a specific install location, installs via a Claude Code plugin marketplace (a different install path than a direct clone) broke on asset lookups, as reported in [issue #19](https://github.com/latent-spaces/brag/issues/19). [PR #22](https://github.com/latent-spaces/brag/pull/22) fixed it by introducing a `<skill-dir>`-relative convention instead of hardcoded paths — the kind of bug you only find once people start installing a thing more than one way, which is itself a small signal that the multi-path distribution is getting real use, not just existing in theory.

Beyond the symlinks, `/brag` is also installable the more conventional way: through a Claude Code plugin marketplace, or generically via the third-party [`skills` CLI](https://github.com/vercel-labs/skills) (`npx skills add ...`) from Vercel Labs, and it's listed on the community registry at [skills.sh](https://www.skills.sh/latent-spaces/brag). Neither of those is `/brag`-specific infrastructure — they're general tooling for the wider agent-skills ecosystem that `/brag` simply plugs into.

## What the GitHub Numbers Actually Say

As of September 20, 2026, `/brag` sits at roughly 5,954 stars, 373 forks, 23 watchers, and 8 "open issues" on a repo created June 16, 2026 — about three months old. That last number is worth pulling apart before you repeat it, because GitHub's `open_issues_count` field silently bundles issues and pull requests together. The real breakdown is 2 open issues and 6 open PRs. One of the two issues is pure praise with nothing actionable in it ([#17](https://github.com/latent-spaces/brag/issues/17): "this is the best repo i have ever seen"); the other is a real, still-open feature request for PR-scoped demo videos ([#23](https://github.com/latent-spaces/brag/issues/23)).

Here's that split as a chart, since it's a clean, real, traceable distinction rather than a raw headline number:

![GitHub's open_issues_count for /brag bundles 2 real open issues with 6 open pull requests](https://cdn.jsdelivr.net/gh/ScriptXeno/2026-09-20-brag-claude-code-launch-video-skill-images@main/comparison-chart.webp){:.shadow}

GitHub also flags the repo's primary language as Python, and that one is worth debunking directly rather than repeating uncritically: there is exactly one `.py` file in the whole repository (`analyze_music_cues.py`, 10,751 bytes). Everything else is overwhelmingly Markdown skill instructions plus small Node and shell glue scripts. The actual runtime dependency chain a user needs installed is Node.js 22+, FFmpeg, and the HyperFrames CLI — nothing about running `/brag` day to day involves Python. GitHub's linguist tool weighs files by byte count, and one dense analysis script apparently outweighs a pile of small Markdown and shell files. It's a good reminder that a repo's GitHub-reported "primary language" describes what's biggest in the diff, not what the tool actually runs on.

The commit history — 31 commits total — is heavily concentrated in the project's most recent week, and it's substantive work rather than churn: a CVE-driven dependency bump ([`eacec90`](https://github.com/latent-spaces/brag/commit/eacec90)), two real bug fixes (the asset-path issue above, plus an output-directory collision fix), voiceover support, and the Google Antigravity discovery docs.

What stands out more than the commit count is what the maintainer, Shunit Haviv Hakimi ([shunithaviv](https://github.com/shunithaviv)), has said no to. [PR #11](https://github.com/latent-spaces/brag/pull/11) proposed a 10,400-line pipeline rewrite; she declined it with a specific reason rather than a vague "not right now": *"We'd lose the lightweight flexible version of brag and I'd be signing up to keep a second source of truth in sync."* [PR #6](https://github.com/latent-spaces/brag/pull/6) proposed a sibling `/flex` command for real-footage videos instead of animated ones; she redirected it into a flag on the existing command and explained the actual design reasoning behind rebuilding the UI in CSS rather than screen-recording it — animated components can be timed and staged in ways *"that static screenshots can't."* That's architectural discipline you can point to in commit history, not marketing copy.

One accidental data point on commercial interest: [PR #13](https://github.com/latent-spaces/brag/pull/13) came from someone at Simform, an established dev consultancy, attempting to rebrand the skill for B2B pre-sales use. It was closed within 19 seconds as "opened in error" — apparently meant for a private fork — but it confirms at least one company has adapted the project internally, which is a more concrete signal than a star count.

GitHub Discussions are confirmed disabled on the repo (checked via both REST and GraphQL, not just an empty page), and the project did pick up two Trendshift placements — #2 Python Repository of the Day on September 16, 2026, and #5 Repository of the Day across all languages on September 17 — which, combined with the Python-language mislabel, is a small irony: it trended partly under a language tag that barely describes what it does.

## Who's Behind It

`latent-spaces`, the GitHub org that owns the repo, reads as a personal umbrella rather than a company. It was created June 11, 2026 — five days before `/brag` itself — describes itself simply as "a home for side quests, prototypes, and useful oddities," has no company, blog, or location field set, and lists exactly one public member: shunithaviv. Four other repos live under the same org, all in the same Claude-Code-and-HyperFrames tooling niche, all far smaller (3–12 stars against `/brag`'s ~5,954). This is one prolific solo builder's outlier hit, not a funded team's flagship product, and there's no commit or PR activity from HeyGen or HyperFrames maintainers in the `/brag` repo itself — the dependency runs one direction, `/brag` calling out to `npx hyperframes`, not a co-maintained integration.

## Reception: Real, But Genuinely Thin

Here's where it's worth being direct rather than padding: broad public discourse on `/brag` barely exists. No Reddit thread and no Hacker News discussion turned up across roughly fifteen search phrasings and a direct Hacker News Algolia API query — zero relevant hits. (A direct Reddit API fetch was also blocked mid-research, so treat the Reddit silence as "not found by these methods," not a certainty that nothing was ever posted.) There's no Product Hunt listing and no creator launch post anywhere — not on X, not on Medium, not in GitHub Discussions. shunithaviv's GitHub profile carries no bio or social links, and no "why I built this" writeup surfaced from any angle searched.

What reception does exist clusters in three places. On X, four enthusiastic posts from third-party AI-influencer accounts (not the creator) appeared within about 48 hours of an informal launch window in late June 2026, though none of their engagement numbers could be independently verified. On YouTube, four short-form videos are confirmed to specifically cover `/brag` — reaction/summary Shorts from SSK Tech Podcast, [Ikjot Juneja](https://ikjotjuneja.substack.com/p/claude-brag-launch-product-videos) (who also wrote it up directly on Substack), a repurposed finance channel posting under the handle @BullBearAcademy6, and Dubibubi — with no long-form hands-on review found anywhere. (Two other videos, from Moe Lueker and Alex Sprogis, turned up in searches but couldn't be confirmed as being about `/brag` specifically rather than adjacent HyperFrames or Claude-skill content, so they're not cited as coverage here.) The GitHub issue tracker itself functions as the closest thing to a comment section — genuine unsolicited enthusiasm in issue #17, plus practical adoption requests from people asking about licensing so they can use it internally at their own companies.

Press coverage is exactly two dated, independently findable pieces: [Ikjot Juneja's Substack writeup](https://ikjotjuneja.substack.com/p/claude-brag-launch-product-videos) (July 20, 2026) and [AIBit's article](https://aibit.im/en/article/turn-project-into-launch-video-brag) (July 3, 2026, the earliest dated coverage found, citing 760+ stars and 56 forks at the time — useful for triangulating a late-June-to-early-July informal launch window, since no single announced launch date exists). Sentiment everywhere found is uniformly positive, but that's an absence worth naming rather than a clean bill of health — nobody found a critical take on `/brag` specifically, which for a project this size and this quiet mostly just means not enough people have looked yet.

Context matters here: for a six-thousand-star, three-month-old solo project, this level of quiet is normal. It's a different situation from a much larger, more heavily marketed release where thin discourse would be a real flag — small projects with real, organic (if modest) traction just look like this.

## A Practical Walkthrough

Getting `/brag` running looks like this:

1. **Install it** into your project. If you're on Claude Code, either clone the repo directly (so the `.claude/skills/brag/` symlink resolves) or install it through a Claude Code plugin marketplace. If you're on another supported agent — opencode, Codex CLI, Google Antigravity — the same clone works, since the relevant symlink or global path already points at the same skill directory. On Windows, remember `git config core.symlinks true` (and possibly admin rights) or copy the `skills/brag/` folder manually into your agent's expected location.
2. **Make sure the runtime dependencies are in place**: Node.js 22+, FFmpeg on your PATH, and the HyperFrames CLI (installed on demand via `npx hyperframes` when the skill invokes it).
3. **Run the skill** from inside the project you want to showcase — literally typing "let's /brag" to Claude Code (or the equivalent invocation in your agent).
4. **Let it plan.** The skill inspects your project and writes a plan and a composition brief: what the video's angle is, which parts of the product to show, and in what order.
5. **Optionally steer it.** Add `--tone '...'` if you want a specific voice (playful, serious, technical) instead of the default, and `--voice` if you want Kokoro-generated narration layered in — it's off by default.
6. **Hand-off happens automatically.** `/brag` passes the composition brief to HyperFrames, which builds, times, and renders the actual video.
7. **Collect your output** from `brag-output/`: the plan, the composition brief, ready-to-post share copy, and `brag.mp4`.

Worth noting: the docs site's own looping demo video was made by `/brag` running on its own repository — a genuinely self-referential piece of dogfooding that at least proves the tool works on a real, if small, codebase.

If you want three concrete examples of what the output looks like, the repo ships three demo sites — Horse Tinder, Fish Flight School, and Taxi for Taxis — built with a benchmarking tool called Impeccable specifically to exercise `/brag` end to end, plus bundled royalty-free music from [ende.app](https://ende.app) and sound effects from [Kenney.nl](https://kenney.nl).

## Where It Sits Next to the Alternatives

`/brag` isn't the only Claude Code skill trying to turn a codebase into a launch video, and it isn't even the only one delegating to a renderer instead of owning one. The closest direct analogs are Remotion-based skills that keep the entire render stack in-house rather than handing off: Remotion's own official skill ([`remotion-dev/skills`](https://github.com/remotion-dev/skills)), [`EveryInc/product-launch-video`](https://github.com/EveryInc/product-launch-video) (44 stars, a thorough five-stage workflow with real quality constraints baked in), and [`memex-lab/product-launch-video-skill`](https://github.com/memex-lab/product-launch-video-skill) (12 stars, adds Gemini TTS). One broader competitor, [`ucsandman/marketing-studio`](https://github.com/ucsandman/marketing-studio), does more in one command — logo reveal, demo, launch video, social clips, and OG images — by orchestrating Playwright, FFmpeg, and TTS directly instead of delegating to either HyperFrames or Remotion.

None of the adjacent screen-recording tools (Guidde, Tella, Screen Studio) or script-driven AI video generators (HeyGen's own consumer product, Luma, VEED, JoggAI) read a codebase the way `/brag` and its Remotion-based peers do — that's a real category-defining feature, not marketing language.

`/brag`'s actual differentiation is scope and distribution, not rendering quality. It does one narrow thing, creative direction, and rides someone else's actively-improving renderer instead of maintaining its own, while reaching more agent surfaces (four discovery paths, plus generic installers) than any Remotion-based competitor found in this research. The honest flip side is dependency risk: `/brag` has no independent value if HyperFrames stalls, changes its interface, or goes in a different direction. That's not a hidden flaw the maintainer is downplaying — it's the explicit trade-off of staying "thin on purpose," and there's no comparable head-to-head star or install count against `remotion-dev/skills` to say definitively which approach is winning.

## A Word on the Ecosystem It Lives In

`/brag` distributes partly through the same skills.sh registry and Agent Skills ecosystem that had a real supply-chain incident earlier this year: Zenity Labs, presenting at Black Hat USA in early August 2026, found cloned skills impersonating Paperclip AI and Browser Use that had been rewritten to exfiltrate credentials, reaching an aggregate 1.7 million installs before removal — [we covered the full checklist for that here](https://scriptxeno.github.io/posts/skills-sh-credential-theft-campaign-checklist/). To be clear: no evidence checked against Zenity's or Snyk's named victims and findings ties `/brag`, latent-spaces, or HyperFrames to that incident or any other malicious-skill disclosure. But that's absence of evidence, not a verified clean bill — `/brag` doesn't appear to have been independently security-scanned either way, and if you're installing agent skills from third-party registries generally, that's worth treating as due diligence you do yourself rather than assume someone else already did.

One more thing worth flagging so search and your own memory don't conflate two unrelated projects: there's a same-named, completely different tool called [`kammradt/brag-skill`](https://github.com/kammradt/brag-skill) (related to GitHub's own "brag-sheet" concept) that generates developer performance-review documents, not videos. If you go looking for `/brag` and land on that instead, you're in the wrong repo.

## The Honest Verdict

`/brag` reads as early and small but real — a different pattern than the "significant tool with a hype gap" ScriptXeno found when we dug into the larger HyperFrames project itself. It's genuinely useful and narrowly differentiated rather than a novelty wrapper: the "thin on purpose" architecture is backed by a maintainer who has actually turned down a 10,400-line rewrite and a sibling-command proposal specifically to preserve it, and the cross-agent symlink distribution is a legitimately clever piece of engineering that goes further than any competitor's packaging in this space. The Hyperframes dependency is a real structural risk, not a criticism invented by skeptics — the project has no independent value without it, and that's worth saying plainly rather than softening.

Community engagement so far looks organic rather than manufactured: bug reports fixed within a day, unsolicited feature PRs from people actually building on it (even the ones that got declined), an accidental corporate-fork data point from Simform, and three weeks of documented star growth in early independent press. But broad discourse is thin, and for a six-thousand-star, three-month-old repo, that's expected rather than damning — no Reddit or Hacker News thread, no Product Hunt listing, no creator announcement post, no long-form review anywhere. Worth watching, not yet worth calling either a breakout hit or a thin gimmick.

## FAQ

**Does /brag actually render the video itself?**
No. It writes the creative brief — angle, tone, which moments to feature — and hands the render entirely to HyperFrames. `/brag` never touches a rendered frame.

**What do I need installed to run it?**
Node.js 22+, FFmpeg, and the HyperFrames CLI (which installs on demand via `npx hyperframes`). Despite GitHub flagging the repo as primarily Python, none of that is Python-based day to day — the one `.py` file in the repo is a music-analysis script, not something you run yourself.

**Does it work outside Claude Code?**
Yes. The same skill directory is exposed via symlinks at the discovery paths for Claude Code, opencode, and Codex CLI, plus a separate global path for Google Antigravity. On Windows, symlinks need `git config core.symlinks true` (and sometimes admin rights), or you can copy the skill folder manually.

**Is voiceover included by default?**
No. It's off unless you pass `--voice`, which routes narration through Kokoro, an open-source TTS engine, invoked via HyperFrames.

**Who maintains it, and is this a company product?**
One visible maintainer, Shunit Haviv Hakimi, under a GitHub org called `latent-spaces` that reads as a personal/indie umbrella — no company details, no other team members listed publicly. It's MIT licensed.

**Is this the same as the "brag" tool that writes performance reviews?**
No — that's a different, unrelated project (`kammradt/brag-skill`, tied to GitHub's "brag-sheet" concept) for developer self-reviews, not video generation. Different repo, different purpose.

**Has /brag had any security issues?**
None found tied specifically to `/brag`. The wider skills.sh ecosystem it partly distributes through did have a real credential-theft incident involving cloned skills impersonating other tools, but no evidence connects `/brag` or latent-spaces to it — that said, `/brag` doesn't appear to have been independently audited either, so treat that as an open question rather than a clean bill of health.