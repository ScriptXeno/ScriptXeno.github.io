# ScriptXeno

[ScriptXeno](https://scriptxeno.github.io) is a tech blog covering AI coding agents (Claude Code, OpenCode, GitHub Copilot), autonomous AI agents (OpenClaw, PicoClaw), and practical AI-driven automation for solo developers and small businesses. Written and maintained by Nakshatra Ranjan Saha ([oceanofanything](https://github.com/oceanofanything)).

## Stack

A static Jekyll site on the [jekyll-theme-chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) theme, deployed to GitHub Pages. There's no backend, database, or JS framework — posts are Markdown files in `_posts/`, rendered to static HTML at build time. The theme is fully vendored here (not just gem-referenced): `_layouts/`, `_includes/`, and `_sass/` are a full local copy, so they're the actual source of truth for markup and styling, not the gem.

## Local development

```bash
bundle install
bash tools/run.sh          # serve locally with live reload
bash tools/test.sh         # build + htmlproofer, matching CI
```

`tools/run.sh` accepts `-H/--host` and `-p/--production`; `tools/test.sh` accepts `-c/--config` to build against alternate config files.

## Repo structure

- `_posts/` — blog posts (`YYYY-MM-DD-slug.md`); published URLs are date-independent (`/posts/:title/`)
- `_plugins/` — a few small local Jekyll hooks on top of the theme (git-history-based `last_modified_at`, an upstream `jekyll-seo-tag` schema fix, and a `jekyll-watch` ignore-path patch)
- `tools/blog-mcp/` — a local MCP server for the post lifecycle: reading/writing/editing/publishing posts, creating per-post image-hosting repos, PNG→WebP conversion, thumbnail prompt generation, and Gemini image generation. See its own README for setup.
- `CLAUDE.md` — detailed conventions for this repo (permalink structure, tag/category casing rules, image hosting, CI/deploy quirks) for anyone (human or AI agent) working in it

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the process, or the [Write for Us](https://scriptxeno.github.io/write-for-us/) page for guest post guidelines. Questions or collaborations: [work.oceanofanything@gmail.com](mailto:work.oceanofanything@gmail.com).

## License

MIT, inherited from the jekyll-theme-chirpy theme this site is built on — see [LICENSE](LICENSE).
