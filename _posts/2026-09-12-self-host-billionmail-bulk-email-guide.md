---
title: How to Self-Host an Open-Source Bulk Email Sender With BillionMail
description: "A practical setup guide for BillionMail, the open-source self-hosted bulk email sender: server and domain prerequisites, the real install commands, the SPF, DKIM, and DMARC records you need, and how to warm up a new sending domain before you send at volume."
author: oceanofanything
date: 2026-09-12
categories: [Self-Hosting, Email Marketing]
tags: [self-hosted email, bulk email, dns, dkim, dmarc, spf, docker, open-source, billionmail]
image:
  path: https://scriptxeno.github.io/self-host-billionmail-bulk-email-guide-images/self-host-billionmail-bulk-email-guide.webp
  alt: "A self-hosted mail server pipeline: DNS and authentication checks flowing into a server stack and out as verified email"
  lqip: data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
---
# Setting up BillionMail: a real self-hosted bulk email install

If you already know you want to self-host your bulk email sender and you are past the "which tool" stage, this is the walkthrough. It covers one tool end to end: what server and domain setup you need before you touch a terminal, the actual install commands, the DNS records a receiving mail server checks before it will trust you, and the part most guides skip, warming up a brand-new sending domain so your mail does not land in spam the moment you turn the tap on.

If you have not picked a tool yet, start with [Best Open-Source Bulk Email Sender Tools (GitHub) to Use in 2025-2026](/posts/best-bulk-email-sender-free/) instead. It compares phpList, BillionMail, listmonk, and two smaller PHP and Flask options. This post does not repeat that comparison. It picks one of those tools, BillionMail, and shows the real setup.

## Why BillionMail for this walkthrough

BillionMail bundles a full mail server (Postfix for sending, Dovecot for mailboxes, rspamd for spam filtering) with a campaign-sending layer and webmail on top, all in one Docker Compose stack. That matters for a setup guide specifically because the DNS work in this post is not hypothetical. BillionMail generates its own DKIM key and asks you to publish it, runs its own Postfix instance that needs SPF and PTR records to match, and gives you a command to check all of it. A tool like listmonk is excellent at composing and queueing campaigns, but it sends through whatever SMTP server or relay you point it at and has no DKIM signing of its own, so the DNS section of a listmonk guide is really a guide to whichever relay you pick. BillionMail's DNS requirements come from BillionMail itself, which is what this post is about.

One correction worth stating up front, also made in the comparison post above: the name implies unlimited sending, and there is no such thing in practice. Your actual throughput is set by your VPS, your SMTP rate limits, and your sender reputation, not by the software. What follows is how to get the software running and correctly authenticated. Reputation still has to be earned, and the last section covers that.

BillionMail is AGPLv3-licensed, developed under the aaPanel GitHub organization, and has 15,578 GitHub stars and 1,697 forks as of this writing (roughly 15.6k stars, 1.7k forks). It supports Linux servers on amd64 or arm64.

## Before you start

Four things need to be in place before installation, and none of them are optional:

* **A domain you control DNS for.** Use a dedicated subdomain for sending, such as `mail.yourdomain.com`, rather than your root domain. If a subdomain's reputation takes a hit, your root domain and its regular email are not dragged down with it.
* **A VPS running Linux.** BillionMail's own documentation lists a minimum of 1 CPU core, 1 GB of RAM, and 20 GB of disk. That is enough to get the containers up, not enough headroom for a real send queue, logs, and webmail under actual load. Budget for at least 2 vCPUs and 4 GB of RAM if you intend to send anything beyond test messages.
* **Docker and Docker Compose installed**, unless you plan to use the native install script instead (covered below).
* **Port 25 reachable, outbound and inbound.** Mail servers exchange messages over port 25, no exception. Many cloud providers, AWS, Google Cloud, and Azure among them, block outbound port 25 by default to cut down on spam from compromised instances. BillionMail's own setup docs flag this directly and give you two options: ask your provider to unblock it, which most will do for a legitimate account on request, or route outbound mail through an SMTP relay instead. Check this before you install, not after your first campaign silently fails to send.

You will also want the ability to set a PTR (reverse DNS) record for your VPS's IP address. That is done through your hosting provider's control panel, not your domain's DNS zone, and some providers require a support ticket to change it.

## Installing BillionMail

Clone the repository and bring it up with Docker Compose:

```bash
cd /opt
git clone https://github.com/aaPanel/BillionMail
cd BillionMail
cp env_init .env
docker compose up -d || docker-compose up -d
```

Before running that last command, open `.env` and set at least:

* `BILLIONMAIL_HOSTNAME` to your actual mail subdomain (for example `mail.yourdomain.com`), not the `mail.example.com` default.
* `ADMIN_USERNAME` and `ADMIN_PASSWORD`, away from the `billion` / `billion` defaults.
* `HTTPS_PORT` and `TZ` if you need something other than 443 and UTC.

If you would rather skip Docker, the project ships a native installer that does the same job:

```bash
cd /opt
git clone https://github.com/aaPanel/BillionMail
cd BillionMail
bash install.sh
```

BillionMail's own documentation puts install time at about eight minutes from a clean server to sending a test email. Most of that time is Docker pulling and starting the container images, not anything you configure by hand, so a slow connection to Docker Hub will add to it.

The Compose stack brings up seven services: the core Go backend, Postfix, Dovecot, rspamd, Redis, PostgreSQL, and Roundcube (which handles both webmail and the admin-panel interface through its own bundled FPM image, rather than a separate component). By default, PostgreSQL and Redis are bound to `127.0.0.1` only, so they are not reachable from outside the server even though their ports appear in the compose file. The ports actually exposed to the internet are 80 and 443 for the web interface, 25, 465, and 587 for outgoing mail, and 143, 993, 110, and 995 for IMAP and POP3. Confirm your firewall or cloud security group allows all of those before you start testing.

Once the containers are up, everything after this point happens either in the web admin panel at your hostname, or through the bundled `bm` command-line helper. A few commands worth knowing:

```bash
bm default          # show the admin panel URL and current login
bm status            # check that every container is running
bm add-domain yourdomain.com
bm show-record       # print the DNS records BillionMail expects for your domains
```

`bm help` lists the rest, including password and username changes, log viewing, and service restarts.

## Adding your sending domain and getting your DNS records

Log into the admin panel, go to domain management, and add your sending domain (the same subdomain you put in `BILLIONMAIL_HOSTNAME`). Set a mailbox quota and a mailbox count, then save. BillionMail generates a DKIM key pair for that domain automatically and shows you the six DNS records it needs, the same list `bm show-record` prints from the command line:

| Record | Where you set it | Example | What it does |
|---|---|---|---|
| A | Your domain's DNS zone | `mail.yourdomain.com` -> `203.0.113.10` | Points your mail subdomain at your VPS's IP address |
| MX | Your domain's DNS zone | `yourdomain.com` MX 10 `mail.yourdomain.com` | Tells other mail servers where to deliver mail addressed to your domain |
| SPF | Your domain's DNS zone (TXT) | `v=spf1 mx ip4:203.0.113.10 -all` | Lists which servers are allowed to send mail as your domain |
| DKIM | Your domain's DNS zone (TXT, at the selector BillionMail shows you) | `default._domainkey.yourdomain.com` TXT `v=DKIM1; k=rsa; p=...` | Publishes the public key BillionMail uses to verify its signed outgoing mail |
| DMARC | Your domain's DNS zone (TXT) | `_dmarc.yourdomain.com` TXT `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com` | Tells receiving servers what to do with mail that fails SPF or DKIM, and where to email reports about it |
| PTR | Your VPS provider's network settings, not your DNS zone | `10.113.0.203.in-addr.arpa` -> `mail.yourdomain.com` | Maps your server's IP back to your hostname; many receivers reject mail from IPs with no PTR record at all |

(The IP address above, 203.0.113.10, is a documentation-reserved address from RFC 5737, not a real server. Use your own VPS's IP in every record.)

## The DNS records, explained plainly

Three of those six records exist specifically to prove your mail is legitimate, and it is worth understanding what each one actually checks:

**SPF (Sender Policy Framework)** is a DNS record that lists which mail servers are allowed to send email for your domain. When another server receives a message claiming to be from your domain, it checks the sending IP against this list. No match, and the message fails SPF.

**DKIM (DomainKeys Identified Mail)** adds a cryptographic signature to every outgoing message, generated with a private key BillionMail keeps on your server. The receiving server checks that signature against the public key you published in DNS. A valid match proves the message was not altered in transit and really did originate from your server.

**DMARC (Domain-based Message Authentication, Reporting and Conformance)** sits on top of both. It tells receiving servers what to do when a message fails SPF or DKIM, and it gives you a mailbox to receive reports about who is sending mail claiming to be from your domain. Start with a monitoring-only policy:

```
v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

`p=none` asks receivers to take no enforcement action and just send you reports, which lets you confirm your SPF and DKIM are actually passing before anything is on the line. Once reports look clean for a couple of weeks, move to `p=quarantine` (failing mail goes to spam), and eventually `p=reject` (failing mail is refused outright) once you are confident nothing legitimate is failing.

DNS changes typically take anywhere from a few minutes to 48 hours to propagate fully, depending on your registrar and the TTL on the record. Use `bm show-record` or a lookup tool like `dig TXT yourdomain.com` to confirm a record is live before assuming something is broken.

## You're not done yet: warming up your sending domain

A working install with correct DNS gets your mail server accepted by other mail servers. It does not get your mail into inboxes at volume on day one. A brand-new domain and a brand-new IP address have no sending history, and mailbox providers use exactly that history to decide how much to trust a new source. Send a large batch immediately and a fair amount of it lands in spam or gets throttled, regardless of how correctly SPF, DKIM, and DMARC are configured.

This is not optional, and it is not specific to BillionMail. If any meaningful share of your list is on Gmail, Google's bulk sender requirements, mandatory since February 1, 2024, apply once you send more than 5,000 messages a day to Gmail addresses: SPF and DKIM have to be set up for your domain, DMARC has to be set up for your sending domain, marketing and subscription mail needs one-click unsubscribe support (RFC 8058) with a visible unsubscribe link, and your spam rate in Google Postmaster Tools has to stay below 0.30 percent, with Google itself recommending you stay below 0.10 percent for real headroom.

A practical ramp for a new domain:

* Start small, a few dozen to a few hundred messages a day, sent to your most engaged existing contacts, the people most likely to open and not mark it as spam.
* Hold at each volume level for a couple of days before increasing it, and avoid jumps larger than roughly 50 percent day over day. A sudden 10x spike in sending from a domain with no history is exactly the pattern spam filters are built to catch.
* Expect the full ramp to your target sending volume to take two to four weeks, not days.
* Watch bounce and complaint rates the whole time. rspamd and Postfix logs on the server itself are your first read; BillionMail's own FAQ documentation includes a section on checking sender reputation, and it is worth pairing that with Google Postmaster Tools if Gmail addresses make up any real share of your list.

Skipping this step is the most common reason a correctly configured self-hosted mail server still ends up in spam. The DNS setup above proves you are who you say you are. Warmup is what proves you are not a problem.

## References

* [BillionMail / aaPanel](https://github.com/aaPanel/BillionMail) - GitHub repository, install scripts, and license
* [BillionMail Docker installation](https://www.billionmail.com/start/docker.html) - official install steps and .env configuration
* [BillionMail pre-deployment preparation](https://www.billionmail.com/start/preparation.html) - hardware requirements and port 25 guidance
* [BillionMail domain configuration](https://www.billionmail.com/start/domain.html) - adding a sending domain and required DNS records
* [DKIM, DMARC and SPF - docker-mailserver](https://docker-mailserver.github.io/docker-mailserver/latest/config/best-practices/dkim_dmarc_spf/) - background on how the three records work together
* [Email sender guidelines - Google](https://support.google.com/a/answer/81126) - Gmail's bulk sender requirements and spam rate thresholds
* [Best Open-Source Bulk Email Sender Tools (GitHub) to Use in 2025-2026](/posts/best-bulk-email-sender-free/) - comparison of BillionMail against phpList, listmonk, and other options
