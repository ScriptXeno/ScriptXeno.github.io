---
title: "The skills.sh Credential Theft Campaign: What to Check on Your Machine Right Now"
description: Zenity Labs disclosed a typosquatting campaign on Vercel's skills.sh AI agent skill registry that stole SSH keys and cloud credentials, with one skill family reaching 1.7 million installs. Here's what's actually confirmed versus press-release language, and a step-by-step checklist to check if you were affected and vet new skills going forward.
author: oceanofanything
date: 2026-08-19
categories: [AI Agents, cybersecurity, AI]
tags: [cybersecurity, ai agents, agentic ai, AI safety, AI risk, Vercel, skills.sh, AI supply chain security]
image:
  path: https://scriptxeno.github.io/2026-08-19-skills-sh-credential-theft-campaign-checklist-images/2026-08-19-skills-sh-credential-theft-campaign-checklist.webp
  alt: A puzzle-piece skill icon with a key being extracted into an open padlock, labeled 1.7 million installs
  lqip: data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
---
## The skills.sh Credential Theft Campaign: What to Check on Your Machine Right Now

If you use an AI coding agent and installed a "skill" (a packaged add-on extending what the agent can do) from a public registry recently, this is worth ten minutes of your time. Security researchers disclosed a credential-stealing campaign on skills.sh, Vercel's public skill registry for AI agents, in early August 2026. This is a different registry from OpenClaw's ClawHub, which we've [covered before on this blog](https://scriptxeno.github.io/posts/best-openclaw-agentskills-small-business-security-checked/), but the underlying risk, a marketplace where anyone can publish code an agent will run, is the same problem we described in our [broader look at AI agent security](https://scriptxeno.github.io/posts/why-openclaw-is-dengerous/).

### Quick answer

In early August 2026, Zenity Labs disclosed at Black Hat USA that attackers had cloned popular skills.sh listings, let the clones build a clean reputation and real download counts, then quietly rewrote them to make AI agents find and exfiltrate SSH keys, cloud credentials, and other secrets. One affected skill family reached more than 1.7 million aggregate installs before the listings were pulled. If you've installed anything from skills.sh recently, check now whether any skill relates to Paperclip or Browser Use, and whether your machine made outbound connections you can't explain since mid-July 2026. If you find either, rotate your SSH keys and cloud credentials. Deleting the skill alone is not enough.

### What actually happened, according to the people who found it

Zenity Labs, an AI agent security vendor, says attackers created two fake GitHub organizations impersonating the real Paperclip AI project (paperclipai) and Browser Use (browser-use), and used them to host copies of those tools' skills on skills.sh. The first uploads were verbatim copies of the legitimate skills, which is what let them pass the registry's checks and start accumulating installs. According to Zenity, the switch to malicious behavior happened around July 11, 2026, and by roughly August 2 the affected skills had combined for over 1.7 million installs. Zenity is explicit that this is aggregate downloads, not unique victims, and should not be read as 1.7 million compromised machines.

The credential-hunting instructions reportedly targeted SSH keys, cloud credentials, Git and package manager tokens, Kubernetes and Docker configuration, database credentials, infrastructure-as-code credentials, project .env files, and service account files, bundled with machine details and sent to attacker-controlled infrastructure. One useful detail: the malicious instructions were reportedly not in the main skill file a quick scan would read first, but in a secondary file, something like a setup document, that the agent only reads and acts on once it is already running the skill. That is why a one-time look at the listing can appear clean.

Zenity says this was not isolated, reporting dozens of other malicious or risky skills across public registries beyond skills.sh, plus hundreds of reserved but unused typosquatted package names apparently staged for future use. It also says more than 30 percent of the dangerous skills it examined were built to abuse an AI coding agent itself, naming Claude Code and OpenClaw specifically, as the delivery mechanism for a second-stage payload. A few reportedly replaced a built-in skill-creation tool or altered the agent's own configuration so a deleted skill would try to reinstall itself.

### What's confirmed versus what's just repeated

The specific numbers, attack mechanics, and researcher quotes here trace back to Zenity's own disclosure, presented at Black Hat and published through its newsroom and blog. Most of the coverage that followed, including pieces syndicated through Businesswire, vmblog, ittech-pulse, and shorter write-ups at TheNextWeb and SC Media, closely mirrors that press release rather than adding independently verified detail. That does not make the claims false. Zenity has published other agent-security research before this, and none of it requires a leap of faith, but it is one vendor's account of its own research until Vercel, GitHub, or an unaffiliated party confirms the specifics.

The more granular details, the exact fake GitHub organization names and the July 11 and August 2 dates, appear most clearly in CSO Online's reporting, which went beyond restating the press release. That's a credible trade publication, but those specifics are not yet corroborated by a second outlet's own reporting, so hold them a little more loosely than the top-line install count.

One thing that is independently verifiable, and lines up with Zenity's core claim: Trail of Bits published research in June 2026, before this campaign was disclosed, showing skills.sh's own scanner integrations (added with Gen, Socket, and Snyk starting in February 2026, covering more than 60,000 skills) could be bypassed. Its researchers demonstrated at least three routes around that scanning: hiding a script inside a .docx file, shipping clean-looking Python source next to precompiled bytecode that does something different (the same pattern behind the xz-utils backdoor), and using prompt injection to convince an LLM-based reviewer that a malicious redirect was legitimate configuration. The gap that let a credential-stealing skill sit unnoticed for weeks was not a surprise. It had already been demonstrated two months earlier, and it apparently was not closed before this campaign ran.

### Where things stand right now

Vercel and GitHub reportedly removed the flagged listings and attacker repositories after Zenity's disclosure, with most accounts describing removal within hours and one putting it at about 12 hours. There is no clear public record of a new, campaign-specific scanning change or patch note from Vercel since. The audit partnership it points to predates the incident by nearly six months and is the same scanning Trail of Bits had already shown gaps in. Zenity's own response was a free tool, AI Total, that runs a candidate skill in a sandbox seeded with bait credentials and watches what it does at runtime rather than just reading its code, a reasonable answer to a real gap. Zenity also sells AI agent security products, so there is a commercial angle to how prominently it promotes this, though that does not undercut the technical substance, which matches what Trail of Bits already showed independently.

### Checklist: figuring out if you were affected

1. List every AI agent skill installed on every machine and CI environment you control, across skills.sh, ClawHub, and any other registry your agents pull from.
2. Cross-check any Paperclip or Browser Use related skill against the real projects on GitHub (paperclipai and browser-use), confirming the publisher name matches exactly, not just the display name.
3. Check install and last-updated dates. Anything touched on or after July 11, 2026, tied to those two names deserves a closer look.
4. Search shell history, cron jobs, and agent config files for GitHub organizations or raw download URLs you do not recognize, especially ones that skip a package's real registry entry.
5. Review outbound network or firewall logs around a suspect skill's install or update time for connections to unfamiliar domains.
6. Check SSH authorized_keys for entries you did not add, your cloud provider's IAM console for keys or service accounts you do not recognize, and your Git host's security log for new access tokens.
7. Check CI systems, such as GitHub Actions secrets, for unexpected reads or newly added entries.
8. If anything above turns up something you cannot explain, assume every credential that skill's process could reach is compromised. Rotate SSH keys, cloud credentials, API tokens, database passwords, and .env secrets on that machine, rather than just uninstalling the skill.
9. If you find confirmed malicious execution rather than a merely suspicious file, rebuild the machine instead of cleaning it manually. Some of these skills reportedly alter agent configuration to reinstall themselves.

### Checklist: vetting a new skill before you install it

1. Do not treat a passed automated security audit as sufficient on its own. Trail of Bits showed those scans can be bypassed within a few hours of effort, and this campaign sat undetected for weeks.
2. Open the actual repository behind the skill and read it, not just the listing page. No public repo you can read is a reason to skip it.
3. Confirm the publisher's organization name matches the real project exactly, the way this campaign's fake orgs were built to look almost right rather than exactly right.
4. Be more cautious with a skill that looks like a fresh clone of something already popular. A near-identical name plus a short publish history is the exact pattern behind this campaign.
5. Watch for install counts that jump unusually fast, rather than growing the way genuine adoption usually does.
6. Try a new skill in a disposable container or VM with no real credentials first, before trusting it on a machine that holds SSH keys or cloud access.
7. Scope credentials tightly for anything an agent or skill can reach. A skill that only drafts email does not need broad cloud admin access.
8. Recheck skills you already trust every so often. This campaign worked because the malicious update came after the skill had already earned trust, not at first install.

Our [indie-hacker security checklist](https://scriptxeno.github.io/posts/indie-hacker-vibe-coding-security-checklist/) applies the same instinct to AI-generated code more broadly: treat anything you did not write yourself as untrusted until you have actually looked at it.

### Frequently asked questions

**Is skills.sh the same registry as OpenClaw's ClawHub?**
No. Skills.sh is run by Vercel and serves AI agent skills generally. ClawHub is OpenClaw's own skill marketplace. They are separate registries with separate operators, though the underlying weakness, unvetted third-party code an agent will execute, is common to both.

**I've never installed a Paperclip or Browser Use skill. Does this affect me?**
Probably not from this specific campaign, since the confirmed malicious family was built around those two names. Still run the checklist above, since Zenity says it found dozens of other malicious skills beyond this one family.

**If I find and delete the malicious skill, am I done?**
No. Deleting the skill stops the active theft but does not undo any theft that already happened. If it ran on your machine during the malicious period, treat every credential it could reach as exposed and rotate it.

**Has skills.sh fixed the scanning gap that let this happen?**
There is no clear public record of a new patch issued specifically in response to this disclosure. The scanning skills.sh already had, built with Gen, Socket, and Snyk since February 2026, is the same scanning Trail of Bits had already shown bypassable two months earlier. Listings were removed quickly, which is incident response, not a fix to the underlying gap.

**Is this specific to skills.sh, or a general risk with AI agent skill registries?**
General. The Trail of Bits research that predates this campaign found comparable scanner bypasses across skills.sh, ClawHub, and a Cisco skill-scanner, using different techniques for each. Any registry that lets agents execute third-party instructions carries this risk until proven otherwise.

**Should small teams stop using AI agent skill registries altogether?**
That is more caution than the evidence calls for. Treat every skill as untrusted code until you have checked it yourself, scope credentials tightly, and recheck skills you already rely on periodically, the same way you would treat any other third-party dependency with update access to your systems.

### Sources

- [Zenity Labs Uncovers 1.7 Million-Install Malicious Skills Campaign and Dozens of Malicious AI Agent Skills](https://www.businesswire.com/news/home/20260806707467/en/Zenity-Labs-Uncovers-1.7-Million-Install-Malicious-Skills-Campaign-and-Dozens-of-Malicious-AI-Agent-Skills) (Businesswire, Zenity press release)
- [Zenity Labs Launches AI Total to Detect Malicious AI Skills](https://zenity.io/company-overview/newsroom/company-news/zenity-labs-discovers-dozens-of-malicious-ai-agent-skills-evading-detection-launches-ai-total) (Zenity newsroom)
- [Zenity's Black Hat USA 2026 AI Agent Security Recap](https://zenity.io/blog/ai-agent-security-black-hat-recap) (Zenity blog)
- [Trojanized AI skills gain 1.7M installs in agent-targeted attack](https://www.csoonline.com/article/4206851/trojanized-ai-skills-gain-1-7m-installs-in-agent-targeted-attack.html) (CSO Online)
- [Attackers exploit AI skills registry for credential theft](https://www.scworld.com/brief/attackers-exploit-ai-skills-registry-for-credential-theft) (SC Media)
- [Malicious AI 'skills' turned agents into credential thieves, at scale](https://thenextweb.com/news/zenity-malicious-ai-skills-1-7m-installs-supply-chain-credential-theft) (TheNextWeb)
- [Automated security audits now available for skills.sh](https://vercel.com/changelog/automated-security-audits-now-available-for-skills-sh) (Vercel changelog)
- [The sorry state of skill distribution](https://blog.trailofbits.com/2026/06/03/the-sorry-state-of-skill-distribution/) (Trail of Bits blog)
