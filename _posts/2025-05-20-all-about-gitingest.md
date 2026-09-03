---
title: "Gitingest: Convert GitHub Repos into AI-Ready Text Digests"
description: Gitingest turns a GitHub repo or local directory into a single LLM-ready text digest, with a summary, file tree, and token count. How it actually works, verified CLI flags and limits, and how it compares to Repomix and pasting files by hand.
author: oceanofanything
date: 2025-05-20
categories: [AI, tools, news, github]
tags: [ai tools, developer-tools, github, python, open-source, GitIngest, LLM Integration, codebase analysis, code summarization, Git workflow, GitHub integration, docker, Python CLI tools, prompt engineering]
image:
  path: https://scriptxeno.github.io/2025-05-20-all-about-gitingest-images/2025-05-20-all-about-gitingest.webp
  alt: Banner Art By Nakshatra Ranjan Saha
  lqip: data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
---
# Gitingest: turning a GitHub repo into an LLM-ready text digest

Getting a language model to reason about a whole codebase usually starts with a manual, repetitive step: open a file, copy it, paste it into the chat, repeat for every module the model needs to see, and hope you did not skip the one config file that explains why the code is structured the way it is. Gitingest exists to remove that step. Point it at a local folder or a GitHub URL and it walks the repository, respects `.gitignore`, and hands back a single text file built from a summary, a directory tree, and the contents of every file it included, formatted so a model can read the whole thing in one prompt.

### Quick answer

Gitingest is an open source Python tool, usable as a CLI, a Python library, or a hosted web app at [gitingest.com](https://gitingest.com), that converts a Git repository or local directory into one text digest for feeding to an LLM. It is MIT licensed, actively maintained under the [coderamp-labs/gitingest](https://github.com/coderamp-labs/gitingest) organization on GitHub (the project started under maintainer Romain Courtois's `cyclotruc` handle, and the old URL still redirects there), and has passed 15,000 GitHub stars as of September 2026. Install it with `pip install gitingest` or `pipx install gitingest`, or skip installing anything at all and just replace `github` with `ingest` in any GitHub repository URL to get the same digest in your browser.

### What it actually does

The core trick is the URL swap: `github.com/coderamp-labs/gitingest` becomes `gitingest.com/coderamp-labs/gitingest`, and you land on a page with the same three-part output the CLI produces locally. First a summary (repository name, number of files analyzed, and an estimated token count using `tiktoken`, so you know before you paste anything whether the digest will actually fit in your model's context window). Then a directory tree showing the repository's structure. Then the concatenated contents of every included file, each one preceded by its path so the model knows where in the project it is reading from. Running the CLI writes all three sections into one `digest.txt` by default, which is what you paste into a chat or hand to an agent.

### Installing it

```bash
pip install gitingest
# or, for an isolated CLI install
pipx install gitingest
# adds the extras needed to run the local web UI yourself
pip install gitingest[server]
```

`pipx` is worth using over plain `pip` for a command-line tool like this since it keeps Gitingest's dependencies out of whatever Python environment you happen to be in when you run it.

### CLI usage, verified against the current flags

The flags in a lot of Gitingest writeups online (including the earlier version of this post) are stale. Checked directly against the CLI source as it stands today:

```bash
# current directory, writes ./digest.txt
gitingest .

# a full GitHub repo
gitingest https://github.com/coderamp-labs/gitingest

# just one subdirectory of a repo
gitingest https://github.com/coderamp-labs/gitingest/tree/main/src/gitingest

# exclude and include shell-style glob patterns (repeatable flags)
gitingest . -e "*.md" -e "node_modules/*" -i "*.py"

# raise the per-file size cap past the 10 MB default, in bytes
gitingest . -s 50000000

# print to stdout instead of writing digest.txt
gitingest . -o -

# a private repo, via a token flag or the GITHUB_TOKEN env var
gitingest https://github.com/you/private-repo -t ghp_yourtoken
```

Two corrections worth flagging: the exclude flag is `-e` / `--exclude-pattern` (repeatable, not a single `--exclude`), and `-s` / `--max-size` takes a plain byte count, not a string like `100kb`. There's also a `-b` / `--branch` flag for pulling a specific branch, and an `--include-submodules` flag if the repo you're ingesting pulls in others.

### Python usage

```python
from gitingest import ingest

summary, tree, content = ingest("https://github.com/coderamp-labs/gitingest")
```

For async code (Jupyter notebooks can `await` this directly):

```python
import asyncio
from gitingest import ingest_async

summary, tree, content = asyncio.run(ingest_async("path/to/directory"))
```

Both return the same three strings the CLI writes to `digest.txt`, which is the more useful entry point if you're building something on top of Gitingest rather than running it once by hand, like a script that regenerates a digest every time a repo changes and hands it to an agent automatically.

### Where it falls over

Gitingest has hard limits baked into its default configuration, and they matter more than the marketing copy on any tool's homepage usually admits: files over 10 MB are skipped unless you raise `--max-size`, it stops after 10,000 files, it will not walk more than 20 directories deep, and total output is capped at 500 MB. On an average app repo none of that matters. On a large monorepo, a repo with vendored dependencies checked in, or one with big binary or data files, you will need `--exclude-pattern` to keep the digest from either hitting those caps or producing a token count too large for any model's context window to hold anyway. The token estimate in the summary is the useful signal here: if it comes back at 400,000 tokens, that is Gitingest telling you the digest needs trimming, not a bug.

### Gitingest versus doing it by hand, or with Repomix

Compared to manually copying files into a chat, Gitingest's advantage is completeness and speed: it walks the whole tree once, respects `.gitignore` so you are not pasting in `node_modules`, and tells you the token count up front instead of finding out mid-conversation that the model lost track of an earlier file.

The closest alternative worth knowing about is [Repomix](https://github.com/yamadashy/repomix), a Node-based tool that does the same job with more output format options (XML, Markdown, or plain text, versus Gitingest's single text format) and a built-in remote MCP server, so an agent can call it directly rather than you running it as a separate step. Gitingest's edge is the zero-install path: the `gitingest.com` URL swap and a [Chrome extension](https://chromewebstore.google.com/detail/gitingest-turn-any-git-re/adfjahbijlkjfoicpjkhjicpjpjfaood) that adds an "Ingest" button to GitHub's own repo pages, so you never have to open a terminal at all. Which one to reach for mostly comes down to your stack and whether you want the output piped straight into an agent's tool calls or pasted by hand.

This is the same underlying problem this blog's own tooling deals with, just solved for a different audience. The [MCP server behind this blog](https://scriptxeno.github.io/posts/how-i-run-this-blog-claude-code-mcp-server/) exists so Claude Code always has structured, current context about this specific repo instead of stale or partial file contents; Gitingest is a much more general version of the same idea, aimed at any repo you have not built custom tooling for. If you are running an agent like [OpenCode](https://scriptxeno.github.io/posts/opencode-open-source-ai-agent/) against a codebase it has not seen before, generating a digest first and dropping it into the agent's initial context is a fast way to give it the shape of the project before it starts making changes.

### Self-hosting with Docker

```bash
git clone https://github.com/coderamp-labs/gitingest.git
cd gitingest
docker build -t gitingest .
docker run -d --name gitingest -p 8000:8000 gitingest
```

That builds and runs the same web app gitingest.com serves, reachable at `http://localhost:8000`. Worth doing if you want the browser workflow for private or internal repos without sending anything to a third-party server, or if you just want the local web UI running from `pip install gitingest[server]` instead.

### Frequently asked questions

**Is Gitingest free?**
Yes. It is MIT licensed, the CLI and Python library are free to install and run, and the hosted version at gitingest.com is free to use.

**Does it work on private repositories?**
Yes, with a GitHub personal access token, either passed via `-t`/`--token` or set as the `GITHUB_TOKEN` environment variable.

**Does my code get sent anywhere when I use it?**
Only if you use the hosted gitingest.com version, which has to clone and process the repo on its own servers to build the digest. The CLI and Python library run entirely on your machine and never send anything out, so for private or sensitive code, install it locally instead of using the web version.

**How is this different from just cloning the repo and using `find` and `cat`?**
It automates the parts that are tedious to script from scratch: respecting `.gitignore`, walking the tree in a consistent order, formatting each file with its path, and estimating the token count so you know upfront whether the result fits your model's context window.

**What's the real difference between Gitingest and Repomix?**
Ecosystem and output flexibility, mainly. Gitingest is Python-based and outputs one text format; Repomix is Node-based, supports XML, Markdown, and plain text output, and ships a remote MCP server so an agent can call it as a tool directly instead of you running a CLI step first.

**Can Gitingest choke on a very large repository?**
It has real caps: a 10 MB per-file limit by default, a 10,000 file limit, a 20-level directory depth limit, and a 500 MB total output limit. On a large monorepo you will likely need `--exclude-pattern` to stay under those and to keep the resulting token count usable.

### Sources

- [Gitingest on GitHub](https://github.com/coderamp-labs/gitingest)
- [Gitingest README](https://github.com/coderamp-labs/gitingest/blob/main/README.md)
- [Gitingest CLI source (`__main__.py`)](https://github.com/coderamp-labs/gitingest/blob/main/src/gitingest/__main__.py)
- [Gitingest config defaults (`config.py`)](https://github.com/coderamp-labs/gitingest/blob/main/src/gitingest/config.py)
- [gitingest.com](https://gitingest.com)
- [GitHub discussion: comparison with Repomix and other similar tools](https://github.com/coderamp-labs/gitingest/discussions/268)
- [Repomix on GitHub](https://github.com/yamadashy/repomix)
- [Gitingest Chrome extension on the Chrome Web Store](https://chromewebstore.google.com/detail/gitingest-turn-any-git-re/adfjahbijlkjfoicpjkhjicpjpjfaood)
