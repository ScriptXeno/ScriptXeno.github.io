---
title: "MailGrab v2.0.0: A Concurrent Crawler With an MCP Server for AI Coding Agents"
description: MailGrab v2.0.0 adds concurrent crawling, default robots.txt compliance, email de-obfuscation, and an MCP server so Claude Code and other AI coding agents can crawl a site and harvest emails directly.
author: oceanofanything
date: 2026-09-12
categories: [AI Tools, email-scraping]
tags: [mailgrab, MCP, ai coding tools, email-scraper, email-harvesting, web-crawler, python, automation, open-source]
image:
  path: https://cdn.jsdelivr.net/gh/ScriptXeno/mailgrab-v2-mcp-server-ai-coding-agents-images@main/mailgrab-v2-mcp-server-ai-coding-agents.webp
  path_sm: https://cdn.jsdelivr.net/gh/ScriptXeno/mailgrab-v2-mcp-server-ai-coding-agents-images@main/thumb-800w.webp
  alt: MailGrab's concurrent crawler connecting multiple websites through a central node to an AI coding agent
  lqip: data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
---
## MailGrab v2.0.0: A Concurrent Crawler With an MCP Server for AI Coding Agents

I maintain MailGrab, the Python email scraper this blog [reviewed back in May 2025](/posts/mailgrab-the-ultimate-email-scraper/). On September 3, 2026, I tagged v2.0.0, and it's not a small update. It's the project's first tagged release, so there's technically no "v1.0.0" to diff it against, but the version number is doing real work: it marks the jump from a single-threaded script to a concurrent, robots.txt-aware crawler with a 43-test suite behind it. It also adds two new structured output formats and, for readers of this particular blog, an MCP server that lets Claude Code, Claude Desktop, Cursor, GitHub Copilot, and Codex CLI crawl a site and harvest emails on their own.

That last part is the angle I actually want to spend time on, past the usual changelog rundown. Handing an email scraper to an AI coding agent as a real callable tool, instead of a shell command it has to guess the flags for, changes how you'd use MailGrab inside an agent-driven workflow. I'll cover that in detail, along with the crawling, correctness, and security work that makes the rest of 2.0.0 worth using on its own.

### What changed, at a glance

| Area | Before this release | As of 2.0.0 |
|---|---|---|
| Fetching | One page at a time | Concurrent, via `ThreadPoolExecutor` (`--concurrency`, `MAILGRAB_MAX_WORKERS`) |
| robots.txt | Left to the user as advice | Checked and enforced by default; `--ignore-robots` to opt out |
| Email sources | Plain text and `mailto:` addresses | Adds "name [at] domain [dot] com" text and Cloudflare-protected addresses |
| Crawl scope | A single `--depth` cap | `--depth` (total pages) and `--max-hops` (link distance from each seed), tracked independently |
| Output | `_emails.txt`, `_scrappedUrls.txt` | Adds `_emails.csv` and `_results.json`, plus `--append`/`--resume` and `--quiet` |
| AI agent access | None; CLI only | `mailgrab_mcp_server.py` exposes a `crawl_website` MCP tool |
| Tests | No tagged baseline to compare against | 43 tests: 35 end-to-end, 8 against the MCP server itself |

### Give your AI coding agent an email-harvesting tool

MailGrab now ships `mailgrab_mcp_server.py`, which exposes a single tool, `crawl_website`, over the [Model Context Protocol](https://modelcontextprotocol.io). Point Claude Code, Claude Desktop, Cursor, GitHub Copilot (VS Code or its CLI), or Codex CLI at it, and the agent can crawl a site and pull back emails as part of a task instead of you running `python MailGrab.py` by hand and pasting the output back into the chat. The [wiki's MCP Server page](https://github.com/OCEANOFANYTHING/MailGrab/wiki/MCP-Server) has setup steps for each client. The server itself starts with a plain `python mailgrab_mcp_server.py`; each client's config just points at that command.

For readers who follow the Claude Code and MCP posts on this blog, this is the same idea applied to a different job: instead of an agent telling you to run a script and report back what happened, it calls a tool and gets the result directly in its own context, then acts on it, filtering the results, writing them into a project file, cross-referencing them against whatever else it's working on.

#### Why each call gets its own subprocess and temp directory

The specific design choice worth explaining, rather than just naming, is this: every `crawl_website` call runs `MailGrab.py` as its own subprocess in its own private temp directory, instead of importing the scraper's code and running it in the same process as the MCP server.

That closes off two problems at once. MCP's stdio transport, which is what most of these clients use to talk to a local server, works by exchanging JSON-RPC messages over the process's own stdin and stdout. If MailGrab's scraping code ran in the same process as the server and printed so much as a stray debug line to stdout, that line would land inside the JSON-RPC stream every client is trying to parse, and the tool call, or the whole session, would break on malformed output. Running the scraper as a separate subprocess means its output is captured and read back programmatically; it never gets a chance to reach the server's own stdout.

The second problem is plainer: MailGrab writes results to files in the current working directory, `_emails.txt`, `_emails.csv`, `_results.json`, and so on. An agent can reasonably make more than one `crawl_website` call in flight, or a user can run more than one agent against the same server. Two calls sharing a working directory would race on the same filenames and overwrite or interleave each other's output. Giving each call its own temp directory removes the race, since there's nothing left to share.

Neither of these is a hypothetical for a tool meant to be driven by an agent rather than a person watching a terminal. They're the two most likely ways an AI-agent integration silently breaks, and one design choice closes off both.

### From one page at a time to a real crawler

Before 2.0.0, MailGrab fetched one page, waited for the response, then fetched the next. For a small site that's fine. For a few hundred pages, all that waiting adds up serially, and a crawl that could run with several requests in flight at once instead takes however long the slowest page takes, times the number of pages.

Version 2.0.0 fetches pages concurrently through a `ThreadPoolExecutor`, tunable with `--concurrency` or the `MAILGRAB_MAX_WORKERS` environment variable. Crawling is I/O-bound, mostly waiting on network responses, which is exactly the case where Python threads work well despite the GIL: while one thread waits on a response, others can be sending requests or parsing pages already fetched. A shared `requests.Session()` adds connection pooling on top, so repeated requests to the same host reuse a connection instead of renegotiating TLS every time, and per-request timeouts (`--timeout`) stop one slow or hanging page from tying up a thread that would otherwise be free to keep working.

None of this is unlimited by default. `--delay` sets a per-domain rate limit, and it now respects a site's own `Crawl-delay` directive in robots.txt on top of whatever you set yourself, so faster fetching doesn't turn into hammering a small site with concurrent requests it never agreed to.

### robots.txt compliance is now the default, not a suggestion

The original review of MailGrab, written before this repository had a tagged release, listed "respect robots.txt" under its own best-practices advice to the user, which reads like a fair sign the crawler itself wasn't checking it. That's changed. MailGrab now reads and follows robots.txt by default and skips URLs it disallows for its user agent. `--ignore-robots` turns that off, for cases where you have your own reason to (crawling your own site, for instance), but the default posture is now compliant rather than permissive.

A few smaller correctness fixes travel with this. `mailto:` links are now parsed directly as an email source rather than only picked up as visible text, and `tel:`, `javascript:`, and anchor-only links are recognized and skipped before MailGrab ever tries to fetch them, so the crawler doesn't spend a request on a link that was never going to be a page.

The more interesting addition is de-obfuscation. Sites that don't want to hand an address straight to a bot often write it as text, "name [at] domain [dot] com," or run it through Cloudflare's email-protection feature, which replaces the visible `mailto:` link with an encoded string and reveals the real address through a small script in the browser. MailGrab 2.0.0 parses both. The at/dot pattern is a text substitution. Cloudflare's own scheme, publicly documented and widely reverse-engineered, stores the address as hex where the first byte is a key and every other byte, XORed against that key, decodes to one character of the real address; it's reversible without a browser, and MailGrab now does that decoding itself. Addresses hidden either way show up in the results instead of getting silently missed.

### Two limits that used to get confused: --depth and --max-hops

`--depth` in MailGrab has always capped the total number of pages a crawl will visit. What it never did on its own is control how far a crawl wanders from any single starting URL, since a crawl's actual order can burn through that page cap either close to the seed URLs or several links away from them, depending on how pages happen to link to each other.

`--max-hops` is new in 2.0.0 and closes that specific gap: it caps how many links away from each seed URL the crawler will follow, independently of the total-page `--depth` cap. Set `--max-hops 2` and MailGrab won't follow a link chain more than two clicks from where it started, no matter how high `--depth` is set or how many pages that leaves unvisited. The two limits now do genuinely different jobs instead of one standing in for both.

Sitemap-seeded discovery (`--use-sitemap`) helps in the opposite direction: it reads a site's `sitemap.xml` and seeds the crawl from every URL listed there, including one level into a `sitemapindex` that points at other sitemap files. Sitemaps often list pages, older posts, deep product pages, that a shallow, link-following crawl within a small `--max-hops` would never reach on its own. Seeding from the sitemap catches those without forcing you to raise the hop limit and crawl far more of the site than you actually wanted.

### What you get back: CSV, JSON, and resumable runs

MailGrab still writes the plain-text `_emails.txt` and `_scrappedUrls.txt` files it always has. Version 2.0.0 adds two structured formats: `_emails.csv`, one row per email address with its source URL, ready to open in a spreadsheet, and `_results.json`, which holds everything, emails, URLs, sources, and any social or contact links found alongside them, in one file.

`_results.json` also doubles as the file `--append` and `--resume` read back, so a second run against the same site adds to a previous crawl instead of starting over, useful for a site you check back on periodically rather than one you only ever crawl once. `--quiet` prints a single JSON summary line instead of the normal console output, meant for piping MailGrab's own results into another script or CI job without parsing human-readable text.

### Cleaner lists: dedup, placeholder filtering, and MX checks

Deduplication is now case-insensitive, so `Jane@Example.com` and `jane@example.com` collapse to one entry instead of two. MailGrab also filters out obvious placeholder addresses, the `email@example.com` style text left over in template HTML, before they reach your results.

The last piece, `--verify-mx`, is opt-in rather than default: it looks up the MX record for each unique domain in the results and drops addresses whose domain has no mail server configured at all. It's opt-in because it adds a DNS lookup per domain, which costs time on a large crawl, but it catches typo domains and dead addresses that a text-pattern match alone can't tell apart from a working one.

### Fewer ways a long crawl can fail

A custom `--user-agent` can matter more than it sounds like it should, since some sites serve different content, or nothing at all, to requests that look like an unlabeled scraper. Proxy support (`--proxy`, including SOCKS) and 5xx retry-with-backoff cover two different failure modes: routing traffic through infrastructure you control, and not treating a single server hiccup as a reason to drop a page from the results. Startup validation for `--proxy` and `--depth` now fails immediately, with a clear message and a non-zero exit code, if either is malformed, instead of letting a bad argument surface as a confusing failure an hour into a long crawl.

### Two ReDoS bugs, found by trying to break it

MailGrab's actual job is running regular expressions against arbitrary HTML pulled from the open web, which makes one specific class of bug worth taking seriously: a regex with catastrophic backtracking can take exponential time against a crafted input string, effectively freezing whatever's running it on a single page. That's a ReDoS bug, regular expression denial of service, and it doesn't need an attacker with any special access. It just needs one page, anywhere in the crawl, built to trigger it.

The 2.0.0 release notes say two such regexes were found and fixed during adversarial testing, meaning someone deliberately built worst-case input strings to look for exponential blowups in the parsing patterns rather than waiting to find out the hard way. The notes don't name the specific patterns, so this post won't guess at the diff, but the category of bug is a real one for exactly the kind of tool MailGrab is: something that runs its own regexes against pages from sites it doesn't control. In the old single-threaded version, a hung regex froze the entire run. In the concurrent version, it would tie up one worker thread instead of the whole process, a real improvement in blast radius even before you count the fixes themselves.

### 43 tests, including 8 that drive the MCP server itself

All of the above is backed by a test suite that came in with this release: 43 tests total. `test_mailgrab.py` accounts for 35 of them, run end-to-end against a local mock HTTP server rather than real websites, covering crawling, parsing, and output behavior directly. `test_mailgrab_mcp.py` covers the other 8, and it doesn't just test the scraping code and assume the MCP wrapper works: it drives the actual MCP server through the official MCP client SDK, the same way a real client like Claude Code would. The itemized rundown lives in `TODO.md` and `CLAUDE.md` in the repository, for anyone who wants the full list rather than the summary.

### Should you upgrade?

If you already use MailGrab's CLI for occasional scraping, the practical changes are the robots.txt default (a crawl may cover less of a site than it used to, unless you pass `--ignore-robots`), a real speed improvement on anything more than a handful of pages, and two output formats, `_results.json` especially, that are much easier to feed into another script than the plain-text files were. If you crawl public sites you don't control at any real scale, the ReDoS fixes are worth having on their own.

If you're driving MailGrab through an AI coding agent, the MCP server is the actual reason to care about this release. It's the difference between telling an agent to shell out to a Python script and hoping it gets the flags right, and giving it a tool it can call directly as part of whatever it's already doing.

MailGrab is MIT-licensed, runs on Python 3.9 and up, and works on Windows, Linux, and macOS. Full install steps and CLI basics are in [the original MailGrab review](/posts/mailgrab-the-ultimate-email-scraper/) from before this release; everything past installation is documented in the [GitHub Wiki](https://github.com/OCEANOFANYTHING/MailGrab/wiki). If you're harvesting addresses to actually mail them afterward, [our roundup of open-source bulk email senders](/posts/best-bulk-email-sender-free/) covers the sending side of that workflow, and if you want to see how MailGrab stacks up against other scraper projects, [we've covered a few others](/posts/best-email-scraper-projects-github/) too.
