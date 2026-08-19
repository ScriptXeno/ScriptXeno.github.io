---
title: How I Run This Blog with Claude Code, a CLAUDE.md File, and a Custom MCP Server (Real Setup, 2026)
description: "A first-hand look at the actual tooling behind this blog: the CLAUDE.md file that documents this repo's real Jekyll and Chirpy conventions, and blog-mcp, the custom local MCP server that handles front matter, tag casing, image hosting, and publishing."
author: oceanofanything
date: 2026-08-19
categories: [AI Agents, AI, productivity]
tags: [Claude Code Tutorial, AI coding workflow, ai coding tools, Chirpy markdown, GitHub Pages, Claude, developer productivity, AI Assisted Development Tools]
image:
  path: https://scriptxeno.github.io/2026-08-19-how-i-run-this-blog-claude-code-mcp-server-images/2026-08-19-how-i-run-this-blog-claude-code-mcp-server.webp
  alt: Diagram of the five-step Claude Code and MCP server publishing pipeline used to run this blog
  lqip: data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
---
## How I Run This Blog With Claude Code, a CLAUDE.md File, and a Custom MCP Server

People occasionally ask how a one-person tech blog manages to put out posts this regularly, so here is the actual, unglamorous answer. I write every post through Claude Code, pointed at a project file called CLAUDE.md that documents this exact repository's real conventions, plus a small MCP server I built myself, blog-mcp, that handles the parts of publishing that are tedious and error-prone to do by hand: front matter formatting, tag and category casing, image hosting on a separate GitHub account, and the actual git commit and push. Nothing about this setup is a generic "AI blogging workflow." It is wired specifically to this Jekyll site, this vendored Chirpy theme, and this particular multi-account GitHub arrangement, and large parts of it would simply break on a different repo.

### Quick answer

A CLAUDE.md file at the repo root tells Claude Code the real rules of this site: the Chirpy theme is fully vendored rather than just gem-referenced, tags and categories are case-sensitive so "ai" and "AI" are two different archive pages, post images always live in an external GitHub Pages repo rather than in this repository, and the permalink structure is fixed and must never change without touching every published post's links. On top of that sits blog-mcp, a local MCP server with tools to list and read posts, write and edit them through a hand-rolled front matter serializer, reconcile tag and category casing against everything already published, create and push to per-post image repos on a separate GitHub account, build a thumbnail prompt grounded in the site's actual brand colors, and publish with one scoped commit and push. I still do the research, drafting, and editing myself, sentence by sentence. The tooling exists to remove the fiddly parts of turning a finished draft into a correctly formatted, live post, not to write the post for me.

### What CLAUDE.md actually documents

This repo has no backend, no database, no JavaScript framework. It is Markdown posts in `_posts/`, rendered to static HTML by Jekyll at build time, deployed to GitHub Pages. That sounds simple until you look closer at a few things that are easy to get wrong, and CLAUDE.md exists to write those down once instead of relearning them every time.

The first is that the Chirpy theme isn't just pulled in as a gem and left alone. The Gemfile references `jekyll-theme-chirpy`, but `_layouts/`, `_includes/`, and `_sass/` in this repo are a full local copy of the theme's own templates and styles, not a handful of override files. The actual source of truth for markup and styling lives in this repo, not in the gem, which matters if you are ever tempted to "just check the theme docs" instead of the local files.

The second is the permalink warning. `_config.yml` sets `permalink: /posts/:title/` as the default, so published URLs are not date-based even though every post file is named `_posts/YYYY-MM-DD-slug.md`. Changing that default would quietly break every link to every post that has ever shipped, so CLAUDE.md flags it as something not to touch casually.

The third is tag and category casing, a genuinely sharp edge on a Jekyll site using `jekyll-archives`. Each distinct casing of a tag or category gets its own archive page. "Tech" and "tech" are not the same tag, they are two different pages that will both quietly exist if you are not paying attention. CLAUDE.md tells me to check how a tag or category has already been cased across published posts before adding it anywhere, and never to introduce a new-cased variant of something that already shipped. That is not always a mistake to fix, either. Right now the tag corpus uses lowercase `ai`, while the category corpus separately uses `AI`. Both are legitimately established, independently, in their own corpus, two different fields that happen to use the same word differently, and the tooling I will get to in a minute knows to leave that kind of thing alone.

The fourth is images. Every post's `image.path` points to an external URL, almost always a small per-post or per-project GitHub Pages repo under the ScriptXeno or oceanofanything account, not a file living under this repo's own `assets/`. That convention exists partly for repo hygiene and partly because it turned into a real, separate authentication problem, which is where blog-mcp comes in.

### The problem blog-mcp actually solves

None of this is difficult to do by hand once. It becomes tedious and mistake-prone the fortieth time, in the specific ways that Jekyll and YAML make tedious. Two problems in particular kept showing up.

The first is that YAML front matter is more fragile than it looks. I tried using the `gray-matter` library's own writer to save posts, and it reliably corrupted them: it turned a plain `date: 2026-06-17` into a full `2026-06-17T00:00:00.000Z` timestamp, because its YAML engine parses dates into JavaScript `Date` objects and re-serializes them with a time component nobody wants, it reformatted `tags: [a, b]` into multi-line block-list style, and it reflowed quoted one-line titles and descriptions into wrapped block scalars. None of that is wrong YAML, it is just not this repo's established formatting, and a post whose front matter looks different from every other post's is annoying to review. So blog-mcp uses `gray-matter` for parsing only, and writes through a hand-rolled serializer that emits bare `YYYY-MM-DD` dates, flow-style `[a, b]` arrays, quotes only when actually necessary, and a fixed `image: {path, alt, lqip}` field order, matching what is already on disk. Editing a post's body alone goes further still: the original front matter text gets spliced back in untouched, with no YAML layer involved, so a caption tweak can never introduce so much as a whitespace diff above it.

The second problem is the tag and category casing rule, easy to state and tedious to actually check by hand across dozens of posts every time. So `write_post` and `edit_post` check every tag and category against what is already published: an exact match is kept as is, a case-insensitive match to exactly one existing casing gets silently corrected to that casing, a match to more than one existing casing (a real, already-established split, like `ai` and `AI`) is left as typed and reported as an ambiguity instead of guessing a winner, and anything with no match is treated as legitimately new. That is the `grep` pipeline from CLAUDE.md, running automatically on every save instead of something I have to remember to type first.

### The rest of the tool list

Beyond the front matter tools, `list_tags` and `list_categories` return every distinct exact-casing value currently in use, the same information CLAUDE.md's grep commands produce, just callable directly. `build_thumbnail_prompt` takes a saved post and returns a ready-to-use image generation prompt that folds in a fixed house style rather than letting every thumbnail get styled ad hoc, which is a problem this site actually had. Pulling a handful of already-published thumbnails turned up a beige stock-photo banner, a navy 3D-render poster, and a neon cyberpunk graphic coexisting with no shared identity at all. Instead of inventing a new look from nothing, the house style is grounded in assets that were already consistent: the black-and-white "SX" monogram logo, the same bold geometric type used on the site's own social preview image, and the actual accent color pulled from `_sass/themes/_dark.scss`, an RGB blue used as the link and table-of-contents highlight color across the whole theme. That style is baked into one constant, so every future thumbnail prompt picks it up automatically instead of relying on me to remember the brand each time, which is exactly what produced the inconsistency in the first place.

`create_image_repo` and `upload_image` handle the external image hosting, and this is where the separate GitHub account becomes unavoidable rather than a stylistic choice. The ScriptXeno account, which owns this blog's repo and every per-post images repo, is a separate personal GitHub account from the one my ambient `gh` and `git` credentials are signed into. That account has collaborator push access to this blog repo specifically, enough for publishing an existing post, but push access to one repo does not grant the ability to create new repos under someone else's personal account. Only the account owner can do that. So those two tools authenticate through a dedicated token, scoped to the ScriptXeno account, passed in on each call rather than switching my whole local `gh` session to a different identity for one task and back.

`generate_image` calls Gemini's image model and saves the result locally for review, deliberately without auto-uploading it, so I look at what came back before it goes near a live post. `publish_post` is the last step: it stages, commits, and pushes exactly one post file by path, scoped so nothing else sitting in the working tree gets swept up by accident, straight to `main`, which is what actually triggers the GitHub Pages deploy.

### How a post like this one actually gets made

The order in practice looks like this. I pick a topic and gather real facts for it, sometimes from a live codebase like this one, sometimes from documentation or reporting elsewhere. I draft the post in the house style this blog already uses: a short quick-answer section near the top, sentence-case subheadings, a handful of FAQ entries at the end, no bloated bullet lists, no inflated claims. Before saving anything, I run the draft through a check for the kind of writing patterns that make AI-assisted prose read stiffly, stock phrasing, repetitive sentence shapes, forced rule-of-three lists, and fix what needs fixing. Only then does it go through `write_post`, which validates the author against `_data/authors.yml`, applies the tag and category casing reconciliation described above, and refuses to write anything at all if the target filename already exists rather than doing a partial write. If a thumbnail is needed, `build_thumbnail_prompt` turns the saved post into a prompt, `generate_image` produces a candidate, I look at it, and `upload_image` converts it to PNG and WebP and pushes both to the post's image repo. Everything gets a final read-back through `read_post` before I trust it. Only then does `publish_post` commit and push the single file, and the site rebuilds.

This is not theoretical. As of writing, this blog has 42 genuinely published posts, two of them pushed live earlier today, and the blog-mcp server itself only landed here a short while ago, in its own commit, with the thumbnail prompt tool following right after in a separate one. I even ran `publish_post` once against a disposable test post specifically to confirm the commit and push behaved as documented, then reverted it once it had.

### What does not work yet

None of this is flawless, and pretending otherwise would defeat the point of writing about it honestly. There is no automated test suite for blog-mcp itself. Every tool was checked with real, disposable end-to-end calls during development rather than a regression suite, so a future change to the front matter serializer or the GitHub integration code is worth manually re-exercising rather than trusting blindly. Image generation through Gemini needs billing enabled on the underlying Google Cloud project; the free tier allocates zero quota for image models, confirmed live with a 429 response, regardless of which image model gets requested. Even once a thumbnail generates cleanly, I still look at it myself before uploading, since any headline text baked directly into an AI-generated image is the part most likely to render with a dropped letter or a warped word.

### Frequently asked questions

**Does an AI actually write these posts for you?**
No. I research and write the actual sentences. Claude Code and the blog-mcp tools handle formatting, tag and category consistency, image hosting, and publishing, the mechanical parts around the writing, not the writing itself.

**Why not just use the Chirpy theme's own front matter conventions through a plugin?**
Because the failure I actually hit was a YAML library's writer quietly reformatting dates and arrays the moment it saved anything, not a missing feature. A hand-rolled serializer matching this repo's existing formatting turned out to be more reliable than a general-purpose one.

**Why does uploading an image need a different GitHub account than publishing a post does?**
Because the ScriptXeno account owns the blog repo and every per-post image repo, and it is a separate personal account from the one my local `gh` session is normally signed into. That account already has collaborator access to push posts here, but creating a brand-new repo under someone else's personal account requires that account's own token, not borrowed collaborator access.

**Is the tag and category casing rule something Jekyll enforces automatically?**
No. `jekyll-archives` will happily generate a separate archive page for every distinct casing it sees, silently. Nothing in Jekyll stops you from creating "Tech" and "tech" as two unrelated pages. The discipline has to come from checking before you type, which is what CLAUDE.md documents and what `write_post`'s casing reconciliation now checks automatically.

**Could this setup work on someone else's blog?**
The general shape could: a project instructions file plus a small local tool server built around that repo's real conventions. The specifics could not transfer directly. The front matter format, the account split, the thumbnail brand colors, all of it is particular to this repo, and copying the tools without copying the underlying conventions would just automate the wrong thing faster.

**What happens if the theme or repo structure changes?**
CLAUDE.md and blog-mcp both need updating alongside it. Neither is independent of the actual repo; they describe and operate on it as it exists now, not as a stable abstraction layered on top.
