---
title: 7 Best Email Scraper Projects on GitHub, Compared (2026)
description: Compare 7 GitHub email scraper projects with real stars, forks, and last-commit data, including MailGrab's new v2.0.0 release with concurrent crawling and an MCP server.
author: oceanofanything
date: 2026-06-05
categories: [automation, email-scraping]
tags: [email-scraper, automation, python, web-crawler, marketing, data-collection, lead-generation, mailgrab, email-harvesting, contact-extraction]
image:
  path: https://cdn.jsdelivr.net/gh/ScriptXeno/best-email-scraper-projects-github@main/best-email-scraper-projects-github.webp
  alt: The best projects focus not only on extracting emails but also on ensuring data quality and usability
  lqip: data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
---
# Best Email Scraper Projects on GitHub with Strong Community Support

Open-source email scrapers remain popular among developers, marketers, researchers, and cybersecurity professionals who need to extract publicly available contact information from websites. GitHub hosts hundreds of email extraction projects, though, which makes it hard to tell which repositories are actually maintained, trusted, and useful versus abandoned or barely tested.

This guide compares seven email scraper projects on GitHub using live data pulled from the GitHub API: stars, forks, last commit date, and whether each one has seen a real commit in the last six months. It also covers what to check before trusting any open-source scraper with real work.

> Always comply with local privacy laws, website terms of service, GDPR, CAN-SPAM, and other applicable regulations when collecting or using email addresses.

## Email scraper GitHub comparison table

| Tool | Stars | Forks | Last commit | Language | Actively maintained |
| --- | --- | --- | --- | --- | --- |
| [Email Scraper Tool](https://github.com/AdrianTomin/email-scraper) | 28 | 8 | Nov 4, 2024 | Python | No |
| [theHarvester](https://github.com/laramies/theHarvester) | 17,349 | 2,583 | Sep 10, 2026 | Python | Yes |
| [EmailHarvester](https://github.com/maldevel/EmailHarvester) | 979 | 197 | Jun 7, 2026 | Python | Yes |
| [Email-Scraping](https://github.com/ayushagarwalk/Email-Scraping) | 66 | 29 | Jun 8, 2024 | Python | No |
| [Email-Harvester](https://github.com/eyuelberga/Email-Harvester) | 2 | 2 | Sep 15, 2021 | Python | No |
| [GHunt](https://github.com/mxrch/GHunt) | 19,543 | 1,714 | Apr 10, 2026 | Python | Yes |
| [MailGrab](https://github.com/OCEANOFANYTHING/MailGrab) | 10 | 5 | Sep 11, 2026 | Python | Yes |

Numbers came from the GitHub API (`api.github.com/repos/<owner>/<repo>`) on September 12, 2026. "Actively maintained" means at least one real commit in the six months before that date, not just an open repository. Stars and forks change constantly, so treat this table as a dated snapshot and check the repo yourself before relying on any of these for real work.

Two things stand out. First, the star counts split into two clear tiers: theHarvester and GHunt sit at 17,000 to 19,500 stars because both are general OSINT tools that security researchers use for far more than email addresses, while the five purpose-built email scrapers on this list top out at under 1,000. Second, three of the seven repositories have gone more than a year without a commit. A high star count from years ago does not tell you whether the code still works against today's websites.

## What makes a good email scraper project

A quality email scraper project typically includes active maintenance, clear documentation, positive community engagement, export capabilities (CSV, JSON, Excel), efficient crawling, email validation, and sensible error handling with duplicate removal. The best projects extract emails and keep the resulting data usable afterward.

## 1. Email Scraper Tool by Adrian Tomin

A Python-based crawler that recursively visits web pages and extracts email addresses using pattern matching and automated link discovery. It's a small project (28 stars, 8 forks) and hasn't had a commit since November 2024, so there's no active maintainer fixing anything that breaks. The code is simple enough to read in one sitting, which is exactly why it still gets recommended for learning. Best for Python learners, small business research, and basic lead discovery where you're comfortable debugging it yourself if a site's markup changes.

## 2. theHarvester

theHarvester is one of the most widely used open-source OSINT tools in security work, not built specifically as an email scraper but capable of pulling emails, subdomains, hosts, and employee names from public sources like search engines and PGP key servers. At 17,349 stars, 2,583 forks, and a commit within the last few days as of this writing, it's the most actively developed project on this list by a wide margin. Best for OSINT investigations, reconnaissance work, and anyone who wants a tool with a real security-community track record and ongoing maintenance behind it.

## 3. EmailHarvester

A search-engine-based email harvesting tool that queries multiple search engines to compile email addresses tied to a target domain. With 979 stars and 197 forks, it's more established than most single-purpose scrapers here, though maintenance is uneven: the repository went quiet after a March 2025 update, then had three community pull requests merged within two days in early June 2026. That pattern, long gaps followed by short bursts of merges, is worth knowing before you depend on it for anything time-sensitive. Best for quick, targeted domain-specific email discovery where you can tolerate an unpredictable release cadence.

## 4. Email-Scraping by Ayush Agarwal

This project focuses on bulk website processing, letting you scan multiple domains and collect unique email addresses in one pass. It has 66 stars and 29 forks, but the last commit was in June 2024, over two years before this comparison. The core scraping logic still runs; there's just nobody actively patching it. Best for agency research, market analysis, and bulk prospecting, with the understanding that you're on your own if it breaks.

## 5. Email-Harvester by eyuelberga

A minimal domain email collector with 2 stars and 2 forks. The entire commit history is a single push from September 2021, the day the repository was created, and nothing since. This one is included for completeness rather than as a strong recommendation: it's a reasonable read for seeing a stripped-down implementation, but there's no maintenance to speak of. Best for a quick look at a minimal single-file approach, not for extraction work you depend on.

## 6. GHunt

GHunt is a well-known OSINT tool focused specifically on Google accounts, pulling public information tied to a Gmail address or Google account, including, in many cases, associated contact details. It's the most-starred project on this list at 19,543 stars and 1,714 forks, with 76 open issues that reflect real, heavy usage rather than neglect. Its commit history through early 2026 shows a steady release cadence (merges in February, March, and April), though nothing new landed in the five months before this snapshot, which is more consistent with a mature project settling than with abandonment. Best for OSINT work centered on Google accounts rather than general website scraping.

## 7. MailGrab

*Disclosure: MailGrab is maintained by this post's author.*

MailGrab shipped its first tagged release, v2.0.0, on September 3, 2026, and it's a genuinely different tool than the single-line description you'll see elsewhere. The rewrite moved it from a single-threaded scraper to a concurrent, robots.txt-aware crawler, backed by a 43-test suite. What's new in v2.0.0:

- Concurrent fetching through a thread pool (`--concurrency`), a shared connection-pooled session, per-request timeouts, and rate limiting that respects robots.txt's own `Crawl-delay`
- `--same-domain` scoping and robots.txt compliance by default, with `--ignore-robots` to opt out when needed
- De-obfuscation for "name [at] domain [dot] com"-style text and Cloudflare's `data-cfemail` spans, plus direct `mailto:` parsing
- Per-seed hop limiting, sitemap-seeded discovery, structured `_emails.csv` and `_results.json` output with per-email source URLs, append/resume support, and optional MX-record validation
- An MCP server (`mailgrab_mcp_server.py`) that exposes crawling as a `crawl_website` tool over the Model Context Protocol, so Claude Code, Claude Desktop, Cursor, GitHub Copilot, and Codex CLI can crawl a site and pull emails directly instead of shelling out to the CLI

The repository itself is still small next to theHarvester or GHunt (10 stars, 5 forks), but its commit history is the most active of any tool here, with a real release in the days before this comparison was written. We've covered the full feature set in more depth in [our dedicated MailGrab post](https://scriptxeno.github.io/posts/mailgrab-the-ultimate-email-scraper/). Best for automated workflows, larger website networks, and AI coding agents that need email extraction as a callable tool rather than a shell command.

## How to evaluate GitHub email scraper projects yourself

The table above is a snapshot, not a permanent ranking. Before using any repository, pull its current stats yourself (`https://api.github.com/repos/<owner>/<repo>` works in a browser, no auth needed) and check its activity: recent commits, active issue discussions, a maintainer who actually responds, and documentation that's kept current. An inactive project can stop working quickly as websites change their markup or add new anti-scraping measures.

Community signals matter too, but read them in context: stars and forks measure how many people found a project at some point, not whether it works today. EmailHarvester and GHunt both show that a long gap between commits doesn't automatically mean abandonment, and a fresh commit doesn't automatically mean the project is well-tested. Check the documentation itself: a project with a real installation guide, usage examples, and a troubleshooting section is much less likely to waste your time than one with a bare one-line README.

## Legal and ethical considerations

Email scraping sits in a legal gray area depending on jurisdiction and how the data gets used. Scrape only publicly available information, respect robots.txt where it applies, follow the target website's terms of service, comply with GDPR and other relevant privacy regulations, and avoid unsolicited mass outreach with whatever you collect. Collecting data responsibly protects you and whoever you're collecting it about.

## Final thoughts

Stars are a popularity signal, not a maintenance signal. theHarvester (17,349 stars) and GHunt (19,543 stars) dwarf everything else on this list, but that reflects their much broader OSINT use case, not necessarily cleaner email extraction. Three of the seven repositories here, Email Scraper Tool, Email-Scraping, and Email-Harvester by eyuelberga, haven't had a commit in over a year, which doesn't make them useless for a one-off job, but does mean you're the only one who'll fix anything that breaks.

If you want a tool someone is actively shipping updates to right now, theHarvester, GHunt, and MailGrab all had commits within days of this comparison. Weigh that recent-commit evidence more heavily than star count when you're choosing what to build a real workflow on.

## Frequently asked questions

**What is the best open-source email scraper on GitHub?**
There's no single universal winner. theHarvester and GHunt have the largest communities but are built for broader OSINT work; MailGrab and EmailHarvester are more narrowly focused on email extraction and are still receiving commits as of this comparison.

**Which of these GitHub email scrapers are actively maintained?**
Based on commit history as of September 2026: theHarvester, GHunt, EmailHarvester, and MailGrab have all had commits within the last six months. Email Scraper Tool by Adrian Tomin (last commit November 2024), Email-Scraping by Ayush Agarwal (June 2024), and Email-Harvester by eyuelberga (a single commit from September 2021) have not.

**What changed in MailGrab's v2.0.0 release?**
Published September 3, 2026, it added concurrent crawling, robots.txt compliance, sitemap-seeded discovery, email de-obfuscation, structured CSV/JSON output, optional MX validation, and an MCP server so AI coding agents like Claude Code and Cursor can crawl a site for emails directly, all covered by a 43-test suite.

**Are GitHub email scrapers free?**
Most of these repositories are open-source and free to use, though some workflows may depend on paid APIs or external services you connect them to.

**Is email scraping legal?**
It depends on your location, where the data comes from, and how you use it afterward. Check applicable privacy and marketing regulations before relying on scraped data for outreach.

**Which language is most common for email scrapers?**
Python, by a wide margin, because of its mature ecosystem for web crawling, parsing, and automation. All seven projects in this comparison are written in Python.

**Author bio**

Nakshatra Ranjan Saha is a digital entrepreneur and technology enthusiast who researches open-source tools, automation systems, and digital growth strategies. Through practical testing and analysis, he helps businesses identify reliable software solutions for modern workflows.
