---
title: "HyperFrames: HeyGen's Open-Source Bet That AI Agents Should Direct Your Videos, Not Just Generate Them"
description: HyperFrames turns HTML into video with AI agents writing the code. How HeyGen's open-source Remotion rival works, and whether the hype holds up.
author: oceanofanything
date: 2026-09-20
categories: [AI Agents, Generative Video, GitHub Projects]
tags: [ai, agentic ai, ai agents, AI video, video generation with ai, MCP, open-source, github, generative-ai]
image:
  path: https://cdn.jsdelivr.net/gh/ScriptXeno/2026-09-20-hyperframes-heygen-html-to-video-ai-agents-images@main/2026-09-20-hyperframes-heygen-html-to-video-ai-agents.webp
  path_sm: https://cdn.jsdelivr.net/gh/ScriptXeno/2026-09-20-hyperframes-heygen-html-to-video-ai-agents-images@main/2026-09-20-hyperframes-heygen-html-to-video-ai-agents-sm.webp
  alt: "Hand-drawn illustration of a browser window unspooling into a filmstrip, with a personified AI agent typing HTML beside it"
  lqip: data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
---
**TL;DR**
- HyperFrames is HeyGen's Apache 2.0 framework that turns HTML/CSS/JS into video: an AI agent writes an editable project, and a headless browser plays it live or renders it by seeking to an exact frame instead of recording playback.
- It competes directly with Remotion, but the pitch is different — no React, no build step, and an authoring model chosen specifically because LLMs write plain HTML far more reliably than typed JSX.
- The traction is real but lopsided: 51,781 GitHub stars and over a million npm downloads in the last 30 days, against zero Reddit threads and a three-point Hacker News post. That combination tells you exactly where the growth is coming from.
- HeyGen's own engineers admit the core rendering trick isn't new — it's inherited from Remotion, WebVideoCreator, and Replit's earlier work. What's actually new is the zero-build, agent-first authoring contract and unusually early WebMCP support.
- A couple of the numbers repeated everywhere about HyperFrames — an "80% of Remotion migrates automatically" claim, a specific render-speed benchmark — trace back to single, unverified sources being copy-pasted across a dozen near-identical SEO posts.
- Worth trying if an agent is already writing your video output. Worth being skeptical of if someone tells you it's killing Remotion.

## What HyperFrames Actually Does

[HyperFrames](https://github.com/heygen-com/hyperframes) is an open-source project from HeyGen — the AI avatar and video company — with a one-line pitch on its own repo: "Write HTML. Render video. Built for agents." It's Apache 2.0 licensed, with no seat limit and no commercial threshold, which is worth flagging up front because it's a real point of departure from Remotion, whose license is free only up to three people per company before it switches to $25/seat/month or $0.01 per render with a $100/month minimum ([Remotion pricing](https://www.remotion.dev/docs/license/pricing)).

The pipeline, per the [docs](https://hyperframes.heygen.com/introduction), works in three steps. You describe what you want. An AI agent generates an editable project — actual HTML, CSS, JavaScript, and optionally React source files, not a black-box binary. HyperFrames then either plays that project live in a preview, or renders it in batch to MP4, MOV, WebM, GIF, or PNG. The surface area around that core loop is bigger than you'd expect from a project with a first commit dated March 10, 2026 ([repo created_at, GitHub API](https://api.github.com/repos/heygen-com/hyperframes)): a CLI, a visual Studio editor, a headless SDK for querying and mutating compositions with undo/redo, a hosted MCP connector, WebMCP tools baked into Studio, a seven-level prompting guide, render targets for local machines, AWS Lambda, and GCP Cloud Run, deployment templates for Vercel, Cloudflare, and Modal, 4K/HDR output, GSAP and shader-transition packages, and a catalog of reusable animation blocks.

It went public sometime in mid-to-late April 2026 — HeyGen's own launch post on X was dated April 16 ([HeyGen](https://x.com/HeyGen/status/2044827454460871072?lang=en)), with press pickup starting the next day ([TheAgentTimes](https://theagenttimes.com/articles/heygen-open-sources-hyperframes-giving-us-a-deterministic-vi-10740a56)). By July, the same engine had been folded back into HeyGen's own paid product: the company's own release notes say HyperFrames "is now part of Video Agent in the HeyGen web app" ([HeyGen July 2026 release](https://www.heygen.com/blog/heygen-july-2026-release)). Open-sourcing the engine and monetizing a packaged version of it aren't in tension — that's a fairly standard playbook — but it's worth knowing before you assume the open-source repo is the whole story.

## The Real Technical Story: Seeking vs. Frame Functions

This is the part most coverage glosses over, and it's the actual engineering decision worth understanding.

Remotion's model is that a video is a pure function of the frame number. Your React component reads `useCurrentFrame()`, computes what frame 47 looks like from scratch, and renders it. There's no timeline being played and paused — every frame is an independent computation, which is exactly why Remotion output is deterministic: frame 47 always looks like frame 47 because nothing carries state forward from frame 46.

HyperFrames takes a different route to the same destination. Every HyperFrames composition exposes a global object, `window.__hf = { duration, seek(t) }`. The renderer never actually plays the page. It calls `seek(0)`, takes a screenshot, calls `seek(1/30)`, takes a screenshot, and so on through the whole duration ([HeyGen's research page](https://www.heygen.com/research/html-to-video) walks through this in detail). Instead of computing each frame from a pure function, it pauses whatever animation is running — a CSS transition, a GSAP timeline, a Lottie file — and forces it to a specific point in time before capturing.

That distinction matters because it's what lets HyperFrames work with animation code an agent is more likely to actually write correctly. GSAP is the default animation engine because its timelines are natively pause-and-seekable; other libraries plug in through a three-method `FrameAdapter` interface. `<video>` tags get pre-flattened by FFmpeg into per-frame JPEGs swapped in as `<img>` data URIs — what the team calls "the flipbook approach" — because native video decoding turned out to be non-deterministic across different machines. Determinism itself is enforced with specific Chrome flags (`--deterministic-mode`, `--enable-begin-frame-control`, `--run-all-compositor-stages-before-draw`) plus the `HeadlessExperimental.beginFrame` CDP call, and it's reliable mainly on Linux's `chrome-headless-shell` — macOS and Windows fall back to heuristic screenshot validation, which is a meaningfully weaker guarantee than the marketing copy implies.

Here's the part I'd actually highlight to a skeptical reader: HeyGen's own research page names its prior art without being asked. It states directly that "GSAP's timelines are already paused-and-seekable by design," that "Remotion proved years ago that HTML could be a video format if you built the authoring model right," and credits "Replit and Vinlic's WebVideoCreator" with pioneering time virtualization and BeginFrame capture. That's an unusually honest paragraph for a project launch, and it should reset expectations about what's genuinely new here versus what's a repackaging of established browser-automation techniques for a new authoring style.

The actual reason for choosing plain HTML over JSX comes down to training data. React plus Remotion is a small slice of what large language models have seen; plain HTML, CSS, and `data-*` attributes are everywhere. That reasoning has been attributed to HeyGen co-founder and CEO Joshua Xu, though it comes through a secondary write-up rather than a primary interview specifically about HyperFrames, so treat it as reported rather than a verified direct quote.

## Built For Agents, Not Just Used By Them

Most "AI video" tools bolt an agent onto a UI built for humans. HyperFrames inverts that: the editing surface itself is exposed as agent-callable tools. Studio exposes its editing capabilities through WebMCP — `navigator.modelContext` — which lets an agent query and mutate a composition directly through the browser rather than shelling out to a CLI. That's genuinely early: WebMCP is a brand-new W3C Web Machine Learning Community Group proposal, backed by Google and Microsoft, and as of this writing it runs as a public origin trial spanning Chrome 149 through 156, with the API surface itself having moved from the original `navigator.modelContext` to `document.modelContext` along the way ([WebMCP origin trial status](https://www.spronta.com/blog/state-of-webmcp-july-2026/)). HyperFrames is riding someone else's nascent standard rather than inventing agent-web interop from scratch, but shipping against it this early is a real, forward-leaning bet, not vaporware.

Alongside WebMCP there's a hosted MCP connector for agents that talk over the more established Model Context Protocol, and a headless SDK underneath both — query, mutate, animate, serialize a composition, with undo/redo and pluggable persistence. If you've read [how this blog runs its own publishing pipeline through Claude Code and a custom MCP server](https://scriptxeno.github.io/posts/how-i-run-this-blog-claude-code-mcp-server/), the shape will feel familiar: instead of a human clicking through a GUI, an agent calls tools against a project's live state, and the project itself stays a normal, inspectable set of files.

The seven-level prompting guide in the docs is worth a look even if you never touch the CLI, because it's really a map of what "video as code" is good at versus not: it moves from getting a first video on screen, to controlling camera and layout, to adding motion and life, to substance (real code and data driving visuals, color grading), to voice and sound, to templating at scale, and finally a capstone exercise combining all of it. That progression is a decent proxy for how far you can actually push an agent before you're back to hand-editing timelines yourself.

## Walking Through It: From Prompt To Rendered Video

In practice the workflow looks like this. You install the CLI (documented at [hyperframes.heygen.com](https://hyperframes.heygen.com/introduction)) and either write a prompt for an agent — Claude Code, or another coding agent wired to the MCP connector — or start from one of the Catalog's reusable blocks. The agent produces a project: an `index.html`, some CSS, a JS file wiring up GSAP timelines against `data-*` attributes, and the `window.__hf` seek contract. You preview it in Studio, where you can also let an agent drive edits directly through WebMCP tools instead of you clicking sliders. Once it looks right, you render — locally for a quick MP4, or against AWS Lambda or GCP Cloud Run if you're batch-producing dozens of variants of the same template with different data (the docs' own flagship examples include exactly this: template-based "one shoot, many cuts" rendering, beat-synced editing, and personalized data visualization driven by a spreadsheet or API response).

The output is a normal Git-trackable project, which is the categorical thing worth understanding about this whole category of tool: HyperFrames, Remotion, and Motion Canvas all hand you back an inspectable, version-controllable source project you can diff and re-render. Prompt-to-finished-video tools like Argil or Creatify hand you back a rendered clip and nothing else. If you ever need to change one word of dialogue or one brand color across fifty rendered videos, that difference is the whole game.

If you want to see it rather than read about it, HeyGen's own tutorial, ["Code Your Videos in HTML With ZERO Editing"](https://www.youtube.com/watch?v=mQmyQZRGQJ4), is the cleanest on-brand walkthrough of writing a composition and rendering it — plain HTML in, MP4 out, no timeline scrubbing.

## Who's Actually Using This, And How Loud Is It Really

This is where a lot of coverage turns into a highlight reel. It shouldn't.

### The Numbers That Are Solid

As of a live API check on September 20, 2026, the repo sits at 51,781 stars, 4,719 forks, and 141 watchers, with 62 contributors, roughly 4,558 commits, and a release cadence of multiple versions per day recently ([repo API](https://github.com/heygen-com/hyperframes)). But the contributor list is worth reading past the headline count: the top five committers by volume — miguel-heygen, vanceingalls, jrusso1020, ukimsanov, waterrrforever — all read as HeyGen staff. This is a corporate-maintained project with a large audience amplifying it, not a broad outside contributor base building it together.

The most useful number in the whole set, precisely because it's the hardest one to inflate artificially, is npm downloads: 1,070,085 in the last 30 days, per the [npm registry API](https://api.npmjs.org/downloads/point/last-month/hyperframes). Stars can be bought or bulk-followed off a launch tweet; a million-plus package installs a month is closer to a real usage signal.

Star growth over the last few weeks is also worth putting a number to: a [star-history tracker](https://star-history.com/#heygen-com/hyperframes&Date) had the repo at roughly 44,000 stars a few weeks before the live API check above returned 51,781. Read that as a directional signal, not a smooth trend line — the two counts come from different measurement methods (a snapshot tracker versus a live API pull) taken at different moments, not a controlled before/after comparison.

![HyperFrames GitHub stars: two different-methodology snapshots, not a smooth trend line](https://cdn.jsdelivr.net/gh/ScriptXeno/2026-09-20-hyperframes-heygen-html-to-video-ai-agents-images@main/comparison-chart.webp){:.shadow}

### The Silence That's Also A Number

Here's the part that undercuts the "developer community is buzzing" framing you'll see on other sites covering this. Across nine actively searched subreddits — r/artificial, r/generativeAI, r/webdev, r/reactjs, r/SideProject, r/programming, r/LocalLLaMA, r/ClaudeCode, r/ClaudeAI — there are zero HyperFrames threads. Not quiet ones, none. The one Hacker News appearance is a [Show HN post](https://news.ycombinator.com/item?id=47902856) by a third-party developer, not HeyGen, and it landed at 3 points and 2 comments. There's no Product Hunt listing, and none of TechCrunch, VentureBeat, or The Verge have covered it.

That's a specific pattern: explosive star and download growth, near-total silence in the forums where developers actually argue about tools. It reads like a company with an existing large audience pushing its own open-source release through its own channels — which HeyGen has, given its consumer AI-avatar product — rather than something spreading by word of mouth. That's not a knock on the tool's quality. It's a reason not to treat the star count as a referendum.

### Real Voices, Not Vendor Copy

The most substantive public comment on how HyperFrames actually relates to Remotion doesn't come from either company's marketing — it comes from a HeyGen engineer answering a GitHub issue. In [issue #318](https://github.com/heygen-com/hyperframes/issues/318), jrusso1020 wrote:

> "HyperFrames is definitely inspired by Remotion. We have used Remotion at HeyGen in production (at scale) and learned a ton from it... Several parts of our renderer borrow directly from patterns the Remotion team pioneered (Chrome launch flags, port selection, image2pipe → FFmpeg streaming, in-order frame buffering)."

And on scope, from the same thread:

> "HyperFrames isn't trying to replace a pro NLE like Premiere or Resolve... That's a real limitation for professional videographers, and we're upfront about it."

That's a more honest and more useful comparison than anything on either project's landing page. On the enthusiast side, the closest thing to a viral framing came from X, where Ihtesham Ali posted: "Say goodbye to Remotion. HeyGen just open sourced Hyperframes and it does everything Remotion does without the React, without the JSX..." ([source](https://x.com/ihteshamali/status/2046154121313714398?lang=en)) — which is closer to launch-day enthusiasm than a considered take. The one piece of real critical feedback from the HN thread, from a commenter called siegers, is more measured: "I like this approach and that it's so flexible and approachable. My nit for the site would be to explain it a bit better — it's a bit hard to grok."

Independent dev-blog reviews are genuinely worth reading if you want depth beyond this post: [Nidhin's deep dive](https://blog.nidhin.dev/video-as-code-a-deep-dive-into-heygen-s-hyperframes) calls it "a new category" of tool; [andrew.ooo's review](https://andrew.ooo/posts/hyperframes-heygen-html-video-agents-review/) is more measured about where it fits next to Remotion in an agent-driven workflow.

## What's Actually New Here (And What Isn't)

To be blunt about it: deterministic, frame-seeking rendering of HTML in headless Chrome is not new, and HeyGen doesn't claim otherwise once you read past the landing page. WebVideoCreator and Replit's rendering engine did this earlier; Remotion proved the underlying premise — that HTML-derived output can be a real, production-grade video format — years before HyperFrames existed. The "determinism" pitch in HyperFrames' marketing is really a contrast with ad-hoc screen-recording via raw Puppeteer scripts, not with Remotion, whose frame-as-pure-function model is already deterministic by construction.

What's genuinely new is narrower, but real: a zero-build, plain-HTML authoring contract that's a sensible bet on how LLMs actually generate reliable code, and WebMCP tool exposure this early is a legitimately forward-leaning integration that almost nothing else in this space has attempted yet. HyperFrames' own comparison guide is honest that Remotion is "older and much more established... more templates, more tutorials, more answered questions, far more production history," and claims roughly 80% of a typical Remotion composition maps mechanically to HyperFrames via migration tooling. No independent source has confirmed that percentage. One counter-example exists: a developer using Codex to migrate a 17.7-second Remotion segment hit text and font rendering regressions that needed manual fixes ([GitHub issue](https://github.com/Vincentwei1021/anything2explainer/issues/14)). That's one data point against the average, not a refutation of it — but it's the kind of thing that should make you test the migration path on your own project before trusting the number.

Also worth naming directly: a specific benchmark claiming a 60-second HyperFrames render versus a 162-second Remotion render, with 4MB versus 14MB output, has been repeated across a dozen near-identical comparison articles — several on domains with no connection to HeyGen at all (parasite SEO sites cashing in on search interest). That number traces to one anecdotal, single-prompt test by one developer using one model. It isn't a controlled benchmark, and nobody has reproduced it. If you see it cited as settled fact anywhere, including possibly here in someone's summary of this post, that's worth pushing back on.

If you're weighing this against the broader field of AI video tools rather than specifically Remotion, it's a genuinely different animal from something like [Moonvalley](https://scriptxeno.github.io/posts/ai-video-startu-lands-53M/), which generates finished video pixels directly rather than a source project you can hand-edit.

## The Rough Edges

The determinism guarantee has an open crack in it: [issue #2107](https://github.com/heygen-com/hyperframes/issues/2107) documents "registry blocks" — runtime data fetches combined with async timeline registration — that violate the determinism contract HyperFrames is built around. That's not a minor cosmetic bug; it's a hole in the exact promise the project leads with.

Platform support is uneven. There's a recurring class of Windows bugs where headless Chrome or the CLI spawns visible console windows because of a missing `windowsHide` flag, still being patched piecemeal as of September 2026 across [#3430](https://github.com/heygen-com/hyperframes/issues/3430), [#3476](https://github.com/heygen-com/hyperframes/issues/3476), and [#3500](https://github.com/heygen-com/hyperframes/issues/3500). Apple Silicon M4 users have hit CLI hangs during calibration and Docker render timeouts. There have been rendering regressions — a white-bar bug, stretched overlays during stitching. None of this is unusual for a project six months past its first commit, but it does mean "pre-1.0, requires CLI comfort" is an accurate description, not false modesty.

GitHub Discussions are thin — five threads total — which tells you real activity lives in Issues, and an official Discord exists but its content isn't search-indexed, so its actual temperature is unknown from the outside. And nobody has run star-history forensics on the recent 44,000-to-51,781 jump. It's plausible that's entirely organic distribution off HeyGen's existing audience. It hasn't been independently verified either way, so don't read confidence into that number that the data doesn't support.

## Verdict: Significant Tool, Vendor-Amplified Story

My honest read: HyperFrames is a real, well-built, useful tool for a specific workflow — and it's an incremental repackaging of known browser-automation techniques for a new authoring style, amplified heavily by a well-resourced vendor's existing distribution, not a category-defining breakthrough. Both of those things are true at once, and most of the coverage I read while researching this only says one of them.

The case for taking it seriously: the license is genuinely more generous than Remotion's for anyone past a three-person team, the zero-build HTML-first authoring model is a sound bet on how agents actually write reliable code, and shipping WebMCP support while the standard itself is still an early-stage origin trial is ahead of almost everyone else building agent tooling right now. If you're already running an agentic workflow — something in the spirit of what we've covered with [OpenCode](https://scriptxeno.github.io/posts/opencode-open-source-ai-agent/) or [Cursor versus Claude Code](https://scriptxeno.github.io/posts/cursor-vs-claude-code-comparison/) — and you need programmatic video output at the end of that pipeline, HyperFrames is worth an afternoon of testing.

The case for skepticism: the star count and download numbers are real, but the near-total absence of organic developer discussion around a tool with 51,781 stars is not a normal pattern for something spreading by genuine word of mouth. HeyGen's own docs and engineers are refreshingly honest that the core rendering technique isn't theirs to claim credit for. And at least two of the most-quoted facts about HyperFrames in circulation — the migration percentage, the render-speed benchmark — are unverified numbers being treated as settled by content that exists mainly to rank for "HyperFrames vs Remotion." If you're evaluating this for a real project, read the GitHub issues before the marketing page. That's usually true of any tool, but it's especially true here.

If you're scanning for what else is worth watching in this space, it's on the kind of list we track in [Best Trending GitHub Repositories in 2026](https://scriptxeno.github.io/posts/best-trending-github-repositories-2026/) — not because it's hype, but because the underlying bet (agents writing plain, boring HTML instead of typed React) is one worth keeping an eye on regardless of how this particular repo's star count holds up over the next year.

## FAQ

**Is HyperFrames actually free to use commercially?**
Yes — it's Apache 2.0 with no seat count or commercial-use threshold, which is a real difference from Remotion, whose free tier caps out at three people per company before paid pricing kicks in.

**Do I need to know React to use HyperFrames?**
No. That's the point of the project — compositions are plain HTML, CSS, and JavaScript (with optional React support), specifically so an AI agent can write them reliably without needing Remotion's `useCurrentFrame`/JSX conventions.

**How is HyperFrames actually different from Remotion under the hood?**
Remotion renders each frame as an independent pure function of the frame number. HyperFrames pauses a running animation (usually GSAP) and seeks it to an exact timestamp before screenshotting, using a `window.__hf.seek(t)` contract exposed by every composition.

**Can I migrate an existing Remotion project to HyperFrames?**
There's migration tooling and HeyGen claims around 80% of a typical composition translates mechanically, flagging patterns like `useState` and `useEffect` that don't carry over. That percentage hasn't been independently verified, and at least one real migration attempt hit font-rendering regressions that needed manual fixes — test it on a real project before relying on it.

**Is the "developer community" actually excited about this?**
The GitHub numbers (51,781 stars, over a million monthly npm downloads) are real. Organic community discussion is not — there are zero threads across nine major subreddits and a single lukewarm Hacker News post. Treat the stars as vendor-distribution reach, not a grassroots signal.

**What can HyperFrames render to, and where?**
MP4, MOV, WebM, GIF, and PNG, including 4K/HDR, either locally or via AWS Lambda and GCP Cloud Run, with deployment templates for Vercel, Cloudflare, and Modal.

**Is this good for professional video editing work?**
HeyGen's own engineers say no, directly — it isn't trying to replace a professional NLE like Premiere or Resolve. It's built for programmatic, template-driven, and agent-authored video, not frame-accurate manual editing.