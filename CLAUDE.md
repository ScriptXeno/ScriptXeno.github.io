# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ScriptXeno is a Jekyll static blog (theme: `jekyll-theme-chirpy`) deployed to GitHub Pages at
`https://scriptxeno.github.io`. Content is authored as Markdown posts in `_posts/`; there is no
backend, database, or JS framework — Jekyll renders everything to `_site/` at build time.

## Commands

- Install dependencies: `bundle install`
- Serve locally with live reload: `bash tools/run.sh` (wraps `bundle exec jekyll s -l -H 127.0.0.1`)
  - `-H, --host <host>` to change bind address, `-p, --production` to run with `JEKYLL_ENV=production`
- Build + test like CI: `bash tools/test.sh`
  - Cleans `_site`, builds with `JEKYLL_ENV=production`, then runs
    `bundle exec htmlproofer _site --disable-external --ignore-urls ...` to check internal links/HTML
  - Accepts `-c, --config "<file_a[,file_b]>"` to build against alternate/multiple config files
- There is no JS package.json / npm pipeline in this repo. `.github/workflows/ci.yml` runs
  `npm i && npm run build` before `tools/test.sh`, but no `package.json` exists here — that step is
  leftover from the Chirpy "Starter" template and will fail if the workflow actually runs. Don't assume
  an npm/rollup build is part of this project; `_javascript/` and the `assets/js/dist` gitignore entry
  are similarly vestigial.
- No unit test suite exists; `htmlproofer` (via `tools/test.sh`) is the only automated check, and it
  operates on the built HTML output, not source files.

## Architecture

- **Theme is fully vendored, not just gem-referenced.** `Gemfile` pulls in `jekyll-theme-chirpy` as a
  gem, but `_layouts/`, `_includes/`, and `_sass/` here contain a full local copy of the theme's
  templates/partials/styles (not the usual handful of override files). Treat these directories as the
  actual source of truth for markup/styling — the gem mainly supplies Ruby-side behavior (SEO tag,
  archives, etc.) for anything not locally overridden.
- Two local Jekyll plugins in `_plugins/` beyond the theme gem:
  - `posts-lastmod-hook.rb` — sets `post.data['last_modified_at']` from `git log` history for each post.
  - `watcher-patch.rb` — extends `jekyll-watch`'s ignored paths (adds `*.TMP`).
- `assets/lib` is a git submodule (`chirpy-static-assets`), but `assets.self_host.enabled` is empty/off
  in `_config.yml`, so it isn't actually used for asset hosting unless that's turned on.
- Deploy/CI workflows in `.github/workflows/`:
  - `pages-deploy.yml` — builds with Ruby 3.3 and deploys to GitHub Pages on push to `main`/`master`.
  - `ci.yml` — separate PR-time matrix build (Ruby 3.1–3.3) that also runs `tools/test.sh` (see the
    broken npm step noted above).
  - `publish.yml` — reacts to pushes on a `docs` branch and dispatches a `deploy` event to another repo
    via `secrets.BUILDER`; this is a vestige of the upstream Chirpy theme template, unrelated to how
    this blog's own posts get published.

## Content model: posts, tags, categories, images

Post front matter (see any file in `_posts/`) drives the site: `title`, `description`, `author`
(must be a key in `_data/authors.yml` — currently `oceanofanything`, `dipro`), `date`, `categories: [...]`,
`tags: [...]`, and `image: {path, alt, lqip}`. Filenames follow `_posts/YYYY-MM-DD-slug.md`, but the
`permalink: /posts/:title/` default in `_config.yml` means published URLs are **not** date-based —
that default must not change without updating every existing post's links (there's an explicit warning
in `_config.yml` about this).

**Tags and categories are case-sensitive and each distinct casing gets its own archive page**
(`jekyll-archives` renders `tag` → `/tags/:name/`, `category` → `/categories/:name/`). `Tech` and `tech`
are two different pages, not the same tag. This means:

- Before adding any tag/category to a post, check how it has been cased in already-published posts and
  reuse that exact casing — never introduce a new-cased variant of a concept that already shipped:
  ```bash
  grep -hoE 'tags: \[[^]]*\]' _posts/*.md | sed 's/tags: \[//;s/\]//' | tr ',' '\n' | sed 's/^ *//;s/ *$//' | sort -u
  grep -hoE 'categories: \[[^]]*\]' _posts/*.md | sed 's/categories: \[//;s/\]//' | tr ',' '\n' | sed 's/^ *//;s/ *$//' | sort -u
  ```
- As of this writing there are ~737 unique tags and ~38 unique categories across 41 posts with no
  existing case collisions (e.g. `AI` and `Vibe Coding` are established Title Case; `news` and
  `automation` are established lowercase) — keep it that way when writing or editing posts.

**Post images are not stored in this repository.** Every existing post's `image.path` points to an
external URL, almost always another small GitHub repo (under the `ScriptXeno` or `oceanofanything`
GitHub account) published via GitHub Pages, e.g.
`https://scriptxeno.github.io/<slug>-images/<file>.webp` or `https://oceanofanything.github.io/<project>/...`.
To add images for a new post, they need to be hosted in such an external repo/Pages site first, then
referenced by URL — don't add image files under this repo's `assets/`.
