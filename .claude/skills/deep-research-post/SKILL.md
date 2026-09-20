---
name: deep-research-post
description: Turn a topic, link, or text fragment into a fully-researched, humanized, SEO-ready ScriptXeno blog post — 6-channel deep research (GitHub, Reddit/forums, YouTube, web press, social, competitive landscape), synthesis, drafting with TL;DR/FAQ/internal links/charts, fact-verification, a doodle-style feature-image prompt, and a local draft post ready for review. Use when the user gives a topic/product/link and asks for a new blog post, especially with language like "research this deeply", "make a blog on X", "write about X for the blog", or when they hand over just an idea/link/fragment and expect finished, industry-grade content back.
---

# Deep-research blog post pipeline

This skill exists because one real session (2026-09-20) produced 4 posts this way and the
process kept needing re-derivation each time. It's now a checklist, not a memory test.

## When to use this

The user hands you **a topic, a product name, a URL (often docs), or just a rough idea/link
fragment** and wants a full ScriptXeno blog post out the other end — not a quick summary,
a publish-ready draft. Signals: "research this deeply", "launch N agents", "make it look
human written", "industry winning content", or simply naming a tool/trend and saying
"write about this."

If the user gives you **several topics at once** (e.g. 3 content-gap ideas from keyword
research), run this pipeline once per topic via `pipeline()` in a single Workflow rather
than one Workflow per topic — see the n8n/Cursor 3-post precedent in this skill's history.

## The pipeline

### 0. Ground yourself first (don't skip, don't delegate this part)

If the user gave a URL (docs, GitHub repo, product page), `WebFetch` it yourself before
writing any agent prompts. You need this to (a) write informed, specific research-agent
prompts instead of generic ones, and (b) have your own baseline to sanity-check what
comes back. For a docs site, also try `<domain>/llms.txt` — many doc sites publish one
and it gives you a full sitemap in one fetch, which tells you what else is worth fetching.

Pull fresh ground-truth from this repo before drafting anything:

```bash
grep -hoE 'tags: \[[^]]*\]' _posts/*.md | sed 's/tags: \[//;s/\]//' | tr ',' '\n' | sed 's/^ *//;s/ *$//' | sort -u
grep -hoE 'categories: \[[^]]*\]' _posts/*.md | sed 's/categories: \[//;s/\]//' | tr ',' '\n' | sed 's/^ *//;s/ *$//' | sort -u
for f in _posts/*.md; do
  title=$(grep -m1 '^title:' "$f" | sed 's/^title: *//')
  slug=$(basename "$f" .md | sed -E 's/^[0-9]{4}-[0-9]{2}-[0-9]{2}-//')
  echo "$slug | $title"
done
```

Tags/categories are case-sensitive and each casing gets its own archive page (per
CLAUDE.md) — never introduce a new-cased duplicate of something that already exists.
Curate a *relevant subset* of tags/categories and a *relevant subset* of the post catalog
to embed in agent prompts (the full lists are hundreds of lines; only pass what's
plausibly relevant to this topic, or agent prompts balloon for no benefit).

Load these skills yourself and carry their guidance into your agent prompts as explicit
instructions — don't assume a spawned subagent will independently invoke them:

- `claude-seo:seo-content` — E-E-A-T, word-count floors, AI-content-quality bar
- `claude-seo:seo-page` — on-page checklist (title/meta lengths, heading hierarchy,
  **never recommend FAQPage/HowTo schema for rich results** — plain markdown FAQ instead)
- `humanizer:humanizer` — the AI-writing-pattern checklist. Critical exception: this
  blog's own established voice uses em dashes constantly and consistently — that IS the
  "writer's sample" the skill's own em-dash rule defers to, so tell writer-stage agents
  to match ScriptXeno's existing rate rather than stripping dashes per the generic
  default.
- `dataviz` — only if a chart is planned; pull the validated categorical palette hex
  codes from `references/palette.md` so every chart shares consistent, accessible colors.

### 1. Research — N parallel channels (default 6, ask if the user wants more/fewer)

One `Workflow` script, `parallel()` over channel agents (a barrier is correct here — the
synthesis stage genuinely needs all channels before deduping). Default channel split for
a tool/product/trend topic:

1. **Source repo / technical primary source** (GitHub repo, official docs deep-dive
   beyond what you already fetched, changelog, real issue/PR activity)
2. **Reddit + forums + Hacker News** — real developer sentiment, both enthusiasm and
   skepticism, quote real comments with attribution
3. **YouTube** — real video URLs/titles/channels if they exist; explicitly told to say
   "nothing found" rather than substitute a loosely-related video
4. **Web press / blogs** — Product Hunt, tech press, dev.to/Medium first-hand writeups,
   the vendor's own launch announcement and stated motivation
5. **Social/chat** (X/Twitter, Discord if searchable, LinkedIn) — real quoted reactions
6. **Competitive landscape** — an honest, skeptical technical assessment of what's
   genuinely novel vs. marketing framing of an existing idea

Give every channel agent the SAME short "docs brief" (what you learned in step 0) so none
of them waste effort re-deriving the basics, then their channel-specific assignment.
Explicitly instruct every one: cite every claim, quote real sources, and **say plainly
when a channel is quiet** rather than padding with generic filler — a thin-but-honest
report is more useful than a padded fake one.

Use `effort: 'high'` on research agents when the user asked for depth ("deepest level",
"continuously until expert").

### 2. Synthesize — one agent, one barrier

Feed all N research reports to one synthesis agent. Ask for three things explicitly:
(a) a deduplicated, cited master fact list organized by theme, (b) an explicit list of
anything unverified or where sources conflicted (so the writer doesn't launder an
uncertain claim into stated fact), (c) the agent's own honest verdict on significance,
with reasoning — this becomes the spine of the post's "is this real or hype" section.

### 3. Write — one agent, schema-forced structured output

Schema fields: `title, description, tags, categories, body, chartTitle, chartType,
chartData`. Requirements to bake into the prompt, every time:

- Long-form and *insightful*, not padded — cap word count loosely (2500-3500 is a good
  default) but the real instruction is "every section teaches something concrete."
- TL;DR (4-6 bullets) directly under the H1.
- Plain-markdown FAQ (5-7 questions) near the end. **Never FAQPage schema markup** —
  it stopped producing Google rich results; a real Q&A section in prose is still good
  UX and E-E-A-T, just not structured data.
- 3-5 internal links, restricted to slugs literally present in the catalog you pass in
  — the writer must not invent a slug.
- One proposed chart with `chartData` traceable to real numbers from the synthesis
  report — never invented. If nothing in the research supports a clean chart, it's fine
  to skip and say so; don't force fabricated data into a chart shape.
- Meta description 140-160 characters.
- Explicit humanizer instructions (see step 0's exception on em dashes).
- Exactly one H1, clean H2/H3, no skipped levels.

### 4. Verify — one agent, schema-forced

Re-check, in this order, against ground truth you provide (not the writer's own claims):
internal links resolve to real catalog slugs (fix or drop any that don't), tag/category
casing matches existing entries exactly, TL;DR and FAQ are present as plain markdown,
heading hierarchy is clean, flag (don't silently strip) any suspiciously specific
uncited claim, flag and fix any remaining AI-writing-pattern tells.

**This stage has caught real fabricated statistics in past runs** (a self-contradicting
GPU count, a garbled percentage, a claim attributed to the wrong source) — treat it as
load-bearing, not decorative. Even so, independently spot-check the 2-3 highest-stakes
or most-specific numeric claims yourself afterward (WebSearch/WebFetch) before shipping —
a past run found 3 claims the verify stage flagged as "unverified" that turned out to be
real, just missing a citation; don't reflexively delete a flagged claim, confirm it.

### 5. After the workflow returns — do this part yourself, not via agent

- **Chart**: generate it yourself with matplotlib using the dataviz skill's validated
  palette (categorical slot order, light-surface chrome, thin bars, direct value
  labels, source-note caption). Read the rendered PNG back with the `Read` tool and
  actually look at it before using it — the dataviz skill's own "render it and look at
  it" step is not optional. Upload via the blog-mcp `upload_image` tool
  (`baseName: "comparison-chart"`), embed via `![alt](jsdelivr-url){:.shadow}` at the
  point in the body where the writer referenced it.
- **Feature-image prompt**: write it yourself, matching this blog's established visual
  identity — cream/off-white background, thin hand-drawn ink linework, flat muted
  pastel fills (sage green / dusty blue / coral-orange / mustard yellow), a bold
  hand-lettered title with one marker-highlighted phrase, one or two dashed-border
  speech-bubble callouts, a bottom row of 3-4 small labeled icons each with its own
  colored underline, 1536x1024 landscape. **By explicit user preference: do NOT default
  to a recurring human cartoon character across posts** — personify the actual subject
  instead (the tools/products themselves, given faces/limbs/expressions; a
  boxing-ring for head-to-head comparisons, a podium for 3-way comparisons, a
  moving-in/ownership metaphor for self-hosting topics, etc.). Give the user the prompt
  directly in chat text, not just a file path — they'll want to paste it somewhere.
- **Create the repo scaffolding**: `create_image_repo` (slug = `YYYY-MM-DD-post-slug`,
  no `-images` suffix — the tool adds it), then `upload_image` for the chart. The real
  feature image usually doesn't exist yet (the user needs to generate it from your
  prompt externally) — set `image.path` to a clearly-labeled placeholder (the chart
  image works fine) with alt text that says PLACEHOLDER, so nothing 404s and it's
  obvious what still needs swapping.
- **Draft the post**: `write_post` with `slug` = the **bare slug, no date prefix** (the
  tool prepends the date itself — passing a pre-dated slug creates a doubled-date
  filename bug; if you do this by accident, just `mv` the file to the correct name,
  front matter is unaffected).
- **Rebuild and verify, yourself, independently of what any agent reported**:
  - `JEKYLL_ENV=production bundle exec jekyll build`, confirm zero errors.
  - Grep every internal link the post actually contains and confirm each target slug
    has a real built page under `_site/posts/<slug>/` — don't trust "verified" claims
    from the write/verify agents without re-checking against the built output yourself.
  - Re-run the tag/category casing check against the **full** existing catalog (not
    just the curated subset you fed to agents) — a subset check can miss a collision
    that exists elsewhere in the full 700+ tag list.
  - Serve `_site` locally (`python -m http.server`) and run a Playwright sweep (console
    errors, broken `<img>` elements) across the new post at desktop + mobile viewports.
    A single 404 for `scriptxeno.goatcounter.com/counter/....json` on a brand-new,
    never-visited page is expected and harmless — don't chase it.
- **Once the user provides the real generated feature image** (they'll usually save it
  locally and tell you the path): resize a copy to 800px wide for `path_sm` (matches
  the homepage/related-post card thumbnail convention — skipping this reintroduces the
  "oversized image" Lighthouse finding this blog already fixed once), upload both full
  and thumb via `upload_image`, then **hand-edit the post's front matter directly**
  to add `path_sm` and swap in the real `path`/`alt` — the `write_post`/`edit_post`
  tools' `image` schema only supports `path`/`alt`/`lqip`, not `path_sm`, so this step
  can't go through the MCP tool.
- **Do not commit, push, or publish without a separate, explicit go-ahead.** Every
  publish in this blog's history followed an explicit "make it live" from the user,
  never an inferred one from "looks done."
- Once live: submit the new URL(s) to IndexNow (`submit_indexnow` MCP tool) and give
  the user the same URL(s) formatted for manual GSC "Request Indexing" submission
  (GSC has no API for this from here — it's always a manual paste, one at a time).

## Known gotchas (learned the hard way, don't re-learn them)

- **Long string-replace surgery on agent-returned bodies needs a precise, uniquely-
  matching end boundary.** A loose generic marker (e.g. a bare `)*`) can match a much
  later, unrelated occurrence in a long document and silently delete everything in
  between. Always print the before/after length and grep the result before trusting a
  targeted edit like this — a real incident on 2026-09-20 deleted ~10KB of a post this
  way before being caught by a length sanity check.
- **Don't read a base64-encoded image into your own context via `Read`/`imageData`**
  when the bytes already exist as a file — pass `localPath` instead. Base64-encoding an
  image into a text file just to read it back burns tens of thousands of tokens and can
  truncate before the encoding even finishes for a larger image.
- **The MCP server's compiled tool code lags behind source edits until the process
  restarts.** If you just changed `tools/blog-mcp/src/**` and rebuilt, check with
  `ToolSearch` before assuming a new tool or parameter is actually callable this
  session — fall back to the previously-available tool shape if it isn't live yet.
- **GitHub Pages' own legacy per-branch Jekyll builder can silently race a custom
  GitHub Actions Pages deploy** if the repo's Pages source is ever set to "Deploy from
  a branch" instead of "GitHub Actions" — this produced real, intermittent production
  breakage earlier in this blog's history. Not something this skill causes, but if a
  freshly-deployed post looks broken/unstyled right after a push, check
  `gh api repos/ScriptXeno/ScriptXeno.github.io/pages --jq '{build_type}'` is
  `"workflow"` before assuming the post content itself is at fault.

## Scaling this up or down

- User says "just write about X" with no research emphasis: skip straight to a single
  research agent (or do it yourself) instead of 6 — this skill's heavy-research mode is
  for when the user explicitly wants exhaustive, multi-channel depth.
- User gives several topics at once: one Workflow, `pipeline()` over topics through
  research → write → verify stages (each topic's stages run independently, no barrier
  needed *between* topics — only within a topic's own research fan-out).
- User wants more or fewer than 6 channels: adjust the `CHANNELS` array; the shape
  (shared docs brief + channel-specific ask + citation requirement) stays the same.
