# blog-mcp

A local MCP (Model Context Protocol) server that gives an AI agent (Claude Code, or any
other MCP client) direct tools for running ScriptXeno's blog workflow: reading and writing
posts, creating the per-post image-hosting repos the site uses, converting/uploading/optimizing
images, generating new thumbnails (default: the N&D Co. Image API on Cloudflare Workers AI;
Gemini's "nano banana" is available as an alternate provider), and notifying IndexNow once a
post is live.

It runs as a local Node process over stdio — the MCP client (Claude Code) spawns and manages
it automatically per `.mcp.json` at the repo root. You never start it by hand.

## Setup

1. **Install and build**:
   ```bash
   cd tools/blog-mcp
   npm install
   npm run build
   ```
   Re-run `npm run build` any time you change a file under `src/` — the MCP client runs the
   compiled output in `build/`, not the TypeScript source directly.

2. **Credentials** — copy `.env.example` to `.env` (gitignored, never commit it) and fill in:

   | Variable | Needed by | How to get it |
   |---|---|---|
   | `CLOUDFLARE_SERVICE_WORKER_API_ENDPOINT` | `generate_image` (default provider) | The deployed N&D Co. Image API Worker URL. |
   | `CLOUDFLARE_IMAGE_GENERATION_API_KEY` | `generate_image` (default provider) | API key for that Worker. Free tier: 10,000 Neurons/day, resets 00:00 UTC — see [Thumbnail model selection](#thumbnail-model-selection-nd-co-image-api). |
   | `SCRIPTXENO_GITHUB_TOKEN` | `create_image_repo`, `upload_image` | A token from the **ScriptXeno** GitHub account itself — see [Why a separate GitHub token](#why-a-separate-github-token-for-image-repos) below. |
   | `GITHUB_OWNER` | image tools | Defaults to `ScriptXeno`; only change this if the blog ever moves accounts. |
   | `GEMINI_API_KEY` | `generate_image` (`provider: "gemini"`) | Google AI Studio (aistudio.google.com). Currently **blocked on billing** — the free tier allocates zero quota for image models, confirmed live (HTTP 429, `limit: 0`) regardless of which image model is used. Kept as an alternate provider for when that's resolved. |
   | `NANOBANANA_MODEL` | `generate_image` (`provider: "gemini"`) | Defaults to `gemini-3.1-flash-image`. Override if Google renames/replaces the model again. |

3. **Register with Claude Code** — already done via `.mcp.json` at the repo root:
   ```json
   {
     "mcpServers": {
       "scriptxeno-blog": {
         "command": "node",
         "args": ["<repo-root>/tools/blog-mcp/build/index.js"]
       }
     }
   }
   ```
   Claude Code only reads this at session/project startup, so **restart Claude Code once**
   after adding or changing it (and possibly click through a one-time trust prompt for a new
   project-scoped MCP server). After that, every session in this project auto-connects —
   nothing to start manually, ever.

## Tool reference

### Posts

#### `list_posts`
No input. Returns every post's `filename`, `title`, `date`, `description`, newest first.

#### `read_post`
| Input | Type | Notes |
|---|---|---|
| `filename` | string | e.g. `2026-06-17-my-post.md` — `.md` is added automatically if omitted |

Returns `{ filename, frontMatter, body }` — `frontMatter` is the fully parsed front matter
(dates as plain `"YYYY-MM-DD"` strings, never JS `Date` objects — see
[Front matter](#front-matter-parsing-vs-writing) below).

#### `write_post`
| Input | Type | Notes |
|---|---|---|
| `title` | string | required |
| `description` | string | required |
| `author` | string | defaults to `oceanofanything`; must be a key in `_data/authors.yml` or the call is rejected |
| `date` | string | optional, `YYYY-MM-DD`; defaults to today in Asia/Kolkata |
| `categories` | string[] | required — see casing reconciliation below |
| `tags` | string[] | required — see casing reconciliation below |
| `image` | `{ path, alt, lqip? }` | `lqip` defaults to the site-wide static placeholder if omitted |
| `body` | string | Markdown body, no front matter |
| `slug` | string | optional; defaults to a slugified `title` |

Fails loudly (no partial write) if: the author isn't recognized, or a post already exists at
the computed filename. Returns the new `filename` plus `categoryCorrections` /
`tagCorrections` / `categoryAmbiguities` / `tagAmbiguities` — see
[Tag/category casing](#tagcategory-casing-reconciliation).

#### `edit_post`
| Input | Type | Notes |
|---|---|---|
| `filename` | string | required |
| `frontMatterPatch` | object | optional — any subset of `title`/`description`/`author`/`date`/`categories`/`tags`/`image`, shallow-merged onto the existing front matter (`image` merges its own sub-fields; `categories`/`tags` replace the whole array and go through casing reconciliation) |
| `body` | string | optional — replaces the whole body when given |

Pass `body` alone for a **content-only edit** — the original front-matter text is spliced
back in completely untouched, byte-for-byte, no YAML re-serialization at all. Pass
`frontMatterPatch` (with or without `body`) to actually change front-matter fields, which
does go through the hand-rolled serializer.

#### `list_tags` / `list_categories`
No input. Returns every **distinct exact-casing** value currently in use across all posts,
sorted — the tool version of the `grep` pipeline in the repo's `CLAUDE.md`. Note tags and
categories are separate corpora with their own established conventions (e.g. tags currently
use lowercase `ai`, categories use `AI` — both are legitimate, separately-established
casings, not a collision to fix).

### Thumbnails

#### `build_thumbnail_prompt`
| Input | Type | Notes |
|---|---|---|
| `filename` | string | existing post |
| `headline` | string | optional short punchy headline (3-6 words) to render on the thumbnail; strongly recommended over the automatic fallback (a truncated version of the post title) |
| `subjectOverride` | string | optional — what the supporting graphic should depict, if different from the post's `description` |
| `aspectRatio` | string | default `"16:9"` |

Returns `{ filename, prompt, headline, aspectRatio }` — a detailed, ready-to-use prompt
combining the post's specific subject with a **fixed house style** (see
[Thumbnail house style](#thumbnail-house-style)), so thumbnails stay visually consistent
across posts instead of each one being styled ad hoc. Does not generate anything itself —
feed the returned `prompt` to `generate_image`.

### Images

#### `create_image_repo`
| Input | Type | Notes |
|---|---|---|
| `slug` | string | e.g. `2026-08-19-my-post` |
| `addImagesSuffix` | boolean | default `true` → repo named `<slug>-images` |
| `description` | string | optional GitHub repo description |

Idempotent — if the repo already exists it's reused (not recreated), and Pages is
(re-)enabled either way. Returns `{ owner, repo, created, defaultBranch, pagesUrl }`.

#### `upload_image`
| Input | Type | Notes |
|---|---|---|
| `repo` | string | e.g. `2026-08-19-my-post-images` |
| `localPath` | string | optional — absolute path to a file already on disk (e.g. `generate_image`'s output) |
| `imageData` | string | optional — base64 image bytes, e.g. an image attached directly in the chat. Takes precedence if both are given. |
| `baseName` | string | optional — filename base with no extension; defaults to `repo` with any `-images` suffix stripped |
| `includeTinyPlaceholder` | boolean | default `true` — also uploads a small blurred `lqip.webp` for repo parity (not referenced by post front matter, which always uses the static placeholder) |

Provide **either** `localPath` or `imageData` — not neither. Converts to PNG + WebP via
`sharp` and uploads both (upsert-safe: safe to call again for the same filename). Returns
`{ pngUrl, webpUrl, lqip }` ready to paste straight into a post's `image:` front matter.

**Using an image attached in chat**: if you (the human) drag or paste an image directly into
the Claude Code conversation, the agent can pass its bytes straight through as `imageData`
— no need to save it to disk or know a file path first.

#### `convert_to_webp`
| Input | Type | Notes |
|---|---|---|
| `localPath` | string | optional — absolute path to a source PNG/JPEG/etc. Output defaults to the same path with a `.webp` extension. |
| `imageData` | string | optional — base64 source bytes. Takes precedence if both are given. Output defaults into `tools/blog-mcp/generated/`. |
| `outputPath` | string | optional — override the output path entirely |
| `quality` | number | default `82` |

Standalone WebP conversion via `sharp` — no GitHub repo or upload involved, just a local file
in, a local file out. Returns `{ outputPath, originalBytes, optimizedBytes, savedPercent }`.
Use `upload_image` instead when the result also needs hosting on a post's image repo.

#### `generate_image`
| Input | Type | Notes |
|---|---|---|
| `prompt` | string | required |
| `provider` | string | default `"cloudflare"`; pass `"gemini"` for nano-banana instead |
| `model` | string | cloudflare only — overrides the default (`@cf/black-forest-labs/flux-2-klein-4b`); verified against the live `/models` list before use |
| `width` / `height` | number | cloudflare only — default `1920` / `1072`, see [Thumbnail model selection](#thumbnail-model-selection-nd-co-image-api) for why 1072 and not 1080 |
| `seed` / `guidance` / `negativePrompt` | number / number / string | cloudflare only, all optional |
| `aspectRatio` | string | gemini only, e.g. `"16:9"`, `"1:1"` |

Saves the result to `tools/blog-mcp/generated/` (gitignored) as `<timestamp>.<ext>` — **does
not auto-upload**. Review the file, then pass its `localPath` to `upload_image`. The default
(`cloudflare`) provider needs `CLOUDFLARE_SERVICE_WORKER_API_ENDPOINT` +
`CLOUDFLARE_IMAGE_GENERATION_API_KEY`; on its free plan a `429` means the 10,000
Neuron/day quota is exhausted until 00:00 UTC — the tool surfaces this clearly and does not
retry. `provider: "gemini"` needs `GEMINI_API_KEY` **with billing enabled** — see the
[Setup](#setup) table.

### Publishing

#### `publish_post`
| Input | Type | Notes |
|---|---|---|
| `filename` | string | required |
| `message` | string | optional commit message; defaults to `Publish <filename>` |

Runs `git add` / `commit` / `push` scoped to **only** that one post file via pathspec — any
other pending changes in the working tree are left alone. This pushes straight to `main`,
which triggers `pages-deploy.yml` and goes live. There is no undo tool; revert with
`git revert <sha>` if needed (the returned `commitSha` is exactly what you'd revert).

#### `submit_indexnow`
| Input | Type | Notes |
|---|---|---|
| `urls` | string[] | required, 1–10,000 full URLs, all on `scriptxeno.github.io` |

Notifies IndexNow (Bing and other participating engines) that the given URLs are new or
changed, so they get crawled faster than waiting on organic discovery — a workaround for the
low daily quota on Google's own manual "Request indexing" button (Google itself doesn't
participate in IndexNow, so this doesn't help Google specifically). Host and key are hardcoded
in `src/tools/indexnow.ts` to this site's own key file,
`https://scriptxeno.github.io/8224327bc30e4fd28859be57075c7439.txt` — no credentials needed.
Call it with the real post URL(s) right after `publish_post` once the page is confirmed live.
Returns `{ submitted, status, ok }`.

## Design notes

### Thumbnail model selection (N&D Co. Image API)

`generate_image` defaults to the N&D Co. Image API (a Cloudflare Worker in front of Workers
AI) rather than Gemini, because it actually works today — Gemini/nano-banana is blocked on
billing (see Known limitations) — and gives real width/height control, which the site's 16:9
thumbnail convention needs. The default model, `@cf/black-forest-labs/flux-2-klein-4b`, was
picked via a live side-by-side trial (2026-09-12) rather than guessed:

The Worker's live `/models` endpoint listed 5 models; `@cf/black-forest-labs/flux-1-schnell`
was excluded immediately since it doesn't support `width`/`height` at all, and hitting the
site's exact aspect ratio matters more than anything else here. The remaining 4 were each
generated once, at `1920x1080`, from the exact `THUMBNAIL_HOUSE_STYLE` prompt:

| Model | Result |
|---|---|
| Leonardo Phoenix 1.0 | Rendered the requested headline as garbled, misspelled text — unusable. |
| Leonardo Lucid Origin | Rendered the correct headline, but in white instead of the required sky-blue, plus a hallucinated extra line of yellow text that wasn't in the prompt. |
| FLUX.2 Dev | Timed out (HTTP 408) at 30 steps against the Worker's request timeout — unreliable for a synchronous tool call, independent of output quality. |
| **FLUX.2 Klein 4B** | Got the headline text, its color, and the flat vector/line-art style all correct — the only one that did. |

Klein 4B wasn't perfect either: it silently snapped a requested height of `1080` down to
`1072` (the nearest multiple of 16) instead of matching exactly, and it drew a small
watermark-like logo in the bottom-right corner — traced to the prompt itself asking to leave
that corner quiet "for a small logo mark to be placed afterward"; the model drew the mark
instead of leaving space for one. Both are fixed at the source: `DEFAULT_HEIGHT` in
`src/lib/ndimage.ts` is set to `1072` (what this model actually delivers, not a value it
silently rounds), and `THUMBNAIL_HOUSE_STYLE` (`src/lib/thumbnailStyle.ts`) was reworded to
drop the word "logo" and the shouty all-caps "HOUSE STYLE" section header that Lucid Origin
appeared to be echoing onto the image as text. That reworded prompt could not be re-tested
live before the day's 10,000-Neuron free quota ran out — treat it as a reasoned fix, not a
re-verified one, and look closely at the next few real `generate_image` outputs.

`generate_image` still saves to a local staging folder for review rather than auto-uploading
specifically because of failure modes like these — always look at the image before
`upload_image`. If a future model swap or Worker update needs re-testing, reuse this same
method: pull the live `/models` list, generate one sample per width/height-capable candidate
at the target resolution with the real house-style prompt, and compare by eye rather than
assuming the docs' example model list or a model's marketing description.

### Thumbnail house style

The site's actual published thumbnails today are inconsistent — a beige stock-photo banner,
a navy 3D-render poster, and a neon cyberpunk graphic all coexist with no shared visual
identity (confirmed by pulling and viewing several real ones). Rather than inventing a style
from nothing, `build_thumbnail_prompt` (`src/lib/thumbnailStyle.ts`) grounds its fixed house
style in the site's actual, already-consistent brand assets: `assets/logo/logo.png` and
`assets/preview/ScriptXeno-Social-Preview-Image.png` (a stark black-and-white "SX" monogram,
bold geometric type, pure black background), plus the real accent color used throughout the
site's own UI (`_sass/themes/_dark.scss`'s `--link-color`/`--toc-highlight`,
`rgb(138, 180, 248)`). The style is baked into one constant applied to every prompt — relying
on whoever/whatever writes a prompt to remember the brand each time is what produced the
inconsistency in the first place. Adjust `THUMBNAIL_HOUSE_STYLE` directly if the desired look
ever changes; every future thumbnail prompt picks up the change automatically.

### Front matter: parsing vs. writing

`gray-matter` is used for **parsing only**. Its writer (`matter.stringify()`) was tested
against a real post and reliably corrupts it: it turns `date: 2026-06-17` into a full
`2026-06-17T00:00:00.000Z` timestamp (its YAML engine parses dates into JS `Date` objects,
which re-serialize with a time component), reformats `tags: [a, b]` into block-list style,
and reflows quoted one-line `title`/`description` into wrapped block scalars. So writing goes
through a hand-rolled serializer (`src/lib/frontmatter.ts`) that emits the repo's actual
established convention (quoted-only-when-necessary `title`/`description`/`alt`, bare
`YYYY-MM-DD` dates, flow-style `[a, b]` arrays, a fixed `image: {path, alt, lqip}` block
order) and preserves any unrecognized/legacy front-matter key instead of silently dropping it.

`edit_post`'s body-only path goes further: it never runs the front matter through any YAML
layer at all, splicing the original raw text back in unchanged, so a caption tweak can never
introduce so much as a whitespace diff in the front matter.

### Tag/category casing reconciliation

Tags and categories are case-sensitive on this site (`jekyll-archives` gives each distinct
casing its own archive page — `Tech` and `tech` would be two different pages). `write_post`/
`edit_post` check every tag/category you give against what's already published:

- Exact match to an existing value (any field, any casing) → kept as-is.
- Case-insensitive match to **exactly one** existing casing → silently auto-corrected to it
  (returned in `*Corrections`).
- Case-insensitive match to **more than one** existing casing (a genuine pre-existing split —
  this really happens: tags use `ai`, categories use `AI`, independently established, each
  internally consistent) → left as typed, reported in `*Ambiguities` rather than guessing a
  winner.
- No match at all → treated as a legitimately new tag/category, kept as typed.

### Why a separate GitHub token for image repos

`ScriptXeno` (owner of `ScriptXeno.github.io` and every `<slug>-images` repo) is a **separate
personal GitHub account**, not an organization, from whichever account `gh auth login` is
signed into locally. That account (`OCEANOFANYTHING`) has collaborator push-access to the
blog repo specifically — enough for `publish_post` to work using ambient `gh`/`git`
credentials — but push access to one repo does not grant the ability to create *new* repos
under someone else's personal account. Only the account owner can do that.

So `create_image_repo`/`upload_image` (in `src/lib/github.ts`) authenticate via
`SCRIPTXENO_GITHUB_TOKEN` passed as a `GH_TOKEN` environment variable override on each `gh`
invocation — `gh` honors this per-call without needing `gh auth switch`. `publish_post`
(`src/tools/publish.ts`) is unaffected and keeps using the ambient `git`/`gh` credentials,
since OCEANOFANYTHING's push access to the blog repo already works.

**Recommended token**: a fine-grained PAT generated from the ScriptXeno account —
Resource owner: ScriptXeno, Repository access: **All repositories** (required: a repo that
doesn't exist yet can't be individually selected), permissions **Administration**,
**Contents**, and **Pages** all set to Read and write. Note `Administration` bundles repo
creation *and* deletion together — there's no way to grant creation without also granting
deletion, with either a fine-grained or classic token, so this token can delete repos on the
account same as it can create them.

### `gh api` status-code handling

`gh api` does not print the numeric HTTP status anywhere by default — a successful response
and a "here's some JSON" response look identical without help. `src/lib/github.ts` always
calls `gh api --include`, which prepends the real `HTTP/x.x <status>` line, and parses that
explicitly. (This was a real bug during development: without `--include`, a successful 201
repo-creation was indistinguishable from failure and got reported as an error.)

## Known limitations

- **The reworded `THUMBNAIL_HOUSE_STYLE` (dropping "logo" and the all-caps section header,
  see [Thumbnail model selection](#thumbnail-model-selection-nd-co-image-api)) has not been
  re-verified live** — the day's free Neuron quota ran out mid-trial. It's a reasoned fix
  based on what the unmodified prompt visibly did, not a confirmed one; watch the next few
  real thumbnail generations for a recurring watermark or stray text.
- **Cloudflare free-plan quota is shared across all callers of that Worker**, not scoped
  per-project — 10,000 Neurons/day, resets 00:00 UTC. A single `1920x1072` generation on a
  quality-focused model (Phoenix, Lucid Origin) can use a meaningful chunk of it; the default
  Klein 4B is comparatively cheap (fixed at 4 steps). `generateNdImage()` surfaces a `429`
  clearly and does not retry — if generation is unavailable, that's almost certainly why.
- **`generate_image`'s Gemini response-shape parsing is defensive, not guaranteed.** Gemini's
  Interactions API is new enough that its documentation doesn't fully pin down the nested
  field name for image bytes in the response. `findImageData()` walks the response tree
  looking for a long base64-looking `data` field rather than assuming one exact path. If a
  future API change breaks this, the thrown error includes the raw response JSON — that's
  what you'd use to fix the field path.
- **No lockfile.** `package-lock.json` is covered by the repo's blanket `node_modules`/
  `package-lock.json` gitignore rule, so dependency versions aren't pinned over time. Fine
  for a personal tool; re-run `npm install` if a future `npm run build` behaves differently
  than expected and check `npm list` against the versions in `package.json`.
- **TypeScript is pinned to `^5.9.3`**, not `latest` — TypeScript 7 (a Go-native rewrite,
  GA July 2026) dropped the JS compiler API that some dev tools depend on. Plain `tsc`
  compilation isn't affected either way; this is just avoiding an unnecessary variable.
- **No automated tests.** Every tool listed above as "verified" was checked with real,
  disposable end-to-end calls during development (see git history / conversation record) —
  there's no regression suite, so a future change to `src/lib/frontmatter.ts` or
  `src/lib/github.ts` in particular is worth manually re-exercising given how much correctness
  lives in exact serialization/status-parsing details.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Tools don't show up at all | Claude Code hasn't picked up `.mcp.json` yet — restart it (see [Setup](#setup)) |
| `create_image_repo`/`upload_image` fail with 401/403 | `SCRIPTXENO_GITHUB_TOKEN` missing, expired, or missing a required permission (Administration/Contents/Pages) |
| `create_image_repo` creates the repo under the wrong account | `SCRIPTXENO_GITHUB_TOKEN` isn't actually a ScriptXeno-account token, or `GITHUB_OWNER` was overridden |
| `upload_image`'s returned URL 404s right after upload | Normal — GitHub Pages takes a few seconds to build after the first push to a repo; retry after ~15–20s |
| `generate_image` returns HTTP 429 with `limit: 0` | Free-tier quota for image models is zero regardless of model — billing must be enabled on the Gemini key's Google Cloud project |
| `generate_image` throws "Could not locate image data" | The Interactions API's response shape has changed — the error includes the raw JSON; update `findImageData()` in `src/tools/generate_image.ts` with the real field path |
| `publish_post` fails with "nothing to commit" | The post file's content is identical to what's already committed |
| `submit_indexnow` returns a 422 | The URL doesn't actually resolve on `scriptxeno.github.io` yet — GitHub Pages needs a few seconds after `publish_post` before a brand-new URL is live; confirm with `curl` first, same as before publishing anywhere else |
