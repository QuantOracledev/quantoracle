# QuantOracle — Operations & Strategy

> Internal COO working document. Updated each session. The first thing Claude
> reads when starting a fresh operating session.

**Last updated:** 2026-05-20 (crawler-trap fix confirmed; priority #1 reframed to rank/authority)  
**Updated by:** Claude (COO)

**Current 13 URLs needing manual Google Search Console submission** (paste into URL Inspection):

```
https://quantoracle.dev/pricing
https://quantoracle.dev/about
https://quantoracle.dev/contact
https://quantoracle.dev/privacy
https://quantoracle.dev/terms
https://quantoracle.dev/options-profit-calculator
https://quantoracle.dev/position-size-calculator
https://quantoracle.dev/kelly-criterion-calculator
https://quantoracle.dev/sharpe-ratio-calculator
https://quantoracle.dev/monte-carlo-simulation-calculator
https://quantoracle.dev/compare/kelly-vs-fixed-fractional-vs-optimal-f
https://quantoracle.dev/compare/var-vs-cvar-vs-max-drawdown
https://quantoracle.dev/compare/z-score-vs-bollinger-bands-vs-rsi
```

Note: 5 of these (/pricing, /about, /contact, /privacy, /terms) were previously
indexed and have re-entered the "Discovered, not crawled" queue — likely a
transient state during a Google re-crawl cycle. Worth monitoring; not urgent.

---

## North Star

**Long-term profitability via AdSense + x402 micropayments + (eventual) premium tier.**

Right-now bottleneck: **traffic**. Product works (4-10 min engagement on top
calcs, 50% engagement rate on /compare/* when found, 100% engagement on the
returning-user cohort). Distribution is what's behind.

### Three audience surfaces — track each separately

The product has three distinct audiences, and each one's signal lives in
a different place. **Never lump them.** The morning brief's "Audience signal"
section makes this split visible at a glance.

| Audience | Signal | Monetization | What it means when it moves |
|---|---|---|---|
| Humans (browsers) | GA4 sessions | AdSense | Real content readers; the AdSense applicability metric |
| Agents (MCP, Vercel AI, Python, LangChain) | External API calls (source ∉ {quantoracle-site, unknown}) | x402 micropayments + integration packages | Real product-market fit for the API surface |
| Bots (Googlebot, Bingbot, SSR prefetch) | Internal/SSR API calls (source = quantoracle-site) | none — pure cost | Crawl health + architectural noise; minimize where possible |

**GA4 will never see the agentic surface** — there's no browser pageview for
an MCP client or Python script. So the external API count is the *only*
signal we have for the agentic product. Lumping it into a single "total API
calls" number lets it hide.

**Documented churn signal — 2026-05-16 TradingKarlos burst:** A single agent
(`TradingKarlos/portfolio-optimizer`, IP 187.188.32.152 Mexico) made 102
calls executing a real portfolio workflow (optimize → MC → VaR → drawdown →
correlation). Then never came back. Open API means we have zero contact info
to follow up. Pattern worth instrumenting: when an unknown UA does a real
workflow and disappears, that's a lost-customer signal that's currently
invisible. Future consideration: optional contact-capture for high-volume
anonymous agents.

---

## Top 3 strategic priorities (next 30 days)

### 1. Traffic → AdSense readiness

**Target:** sustained 50+ daily sessions, 30%+ organic search share, domain
age 90+ days. Realistic apply date: **early August 2026** at current
trajectory; could pull forward to early July if upstream PRs merge.

**Bottleneck reframe (2026-05-20):** The "get indexed" era is over — 25+ URLs
are indexed and pages are appearing in results. The new bottleneck is **rank,
not indexing, and not CTR.** GSC (last 7d): ~300 impressions → 5 clicks.
Several pages rank position 6-9 (bottom of page 1) with 0 clicks, and
/black-scholes-calculator sits at position ~60 (page 6) on its 73 impressions.

Important honest finding: the 0% CTR on position-8 pages is **NOT a fixable
title/meta problem.** At 8-43 impressions per page at position 6-9, expected
clicks are <1 regardless of title (position 8 + AI Overviews + featured
snippets = ~1-2% CTR ceiling). We're seeing the statistical noise floor, not
a metadata defect. Don't burn effort on speculative title rewrites — GSC's
<10-impression privacy threshold also hides the actual queries, so any
rewrite is blind guessing.

What actually moves rank for a 16-day-old domain:

- **Time.** New domains are suppressed for weeks-to-months ("sandbox"). Some
  of the position-60 problem resolves on its own as the domain ages.
- **Land the two upstream PRs.** [vercel/ai#15295](https://github.com/vercel/ai/pull/15295)
  and [goat-sdk/goat#582](https://github.com/goat-sdk/goat/pull/582) — these
  are the highest-value backlinks available and the asymmetric bet. Authority
  links are the lever that moves page-6 rankings.
- **Content depth + internal linking.** Make each calculator/compare page the
  genuinely best resource for its query, and interlink the catalog so ranking
  authority flows between pages.
- **Compound the /compare cluster.** 7 of 11 /compare pages now rank page 1
  for niche queries. Topical authority in a cluster lifts the whole cluster.

Do NOT keep doing: manual indexing submission (done), title rewrites on
already-ranking pages (no diagnosable defect), publishing more content
speculatively (existing set hasn't proven out — see weekly scan 2026-05-18).

### 2. x402 settlement growth

**Target:** measurable settled revenue (>$10/mo recurring) by August 2026.

Lifetime settled revenue is $2.495 USDC across 171 transactions, mostly from
April 20-21 load tests. Real organic agent traffic to paid endpoints is near
zero. Path forward:

- Get the 4 published npm integration packages into developer hands (the PRs
  above + /writing tutorials are the levers)
- The `@quantoracle/ai-tools` package (Vercel AI SDK) has the broadest
  audience; that's the primary driver
- AgentKit and GOAT serve the onchain-agent audience specifically

### 3. Maintain product + infra reliability

**Target:** zero P1 incidents, MCP and HTTP clients see no degradation.

The droplet is at 77% memory pressure (743/961 MB). Within current usage that's
fine, but a sustained traffic spike would push us into swap. **Pre-decided
action:** when 7-day traffic exceeds ~200 sessions/day sustained, upgrade
droplet to 2GB tier ($12/mo on DigitalOcean). Below that threshold, hold.

---

## Open initiatives (active)

| # | Initiative | State | Next action |
|---|---|---|---|
| 1 | [vercel/ai#15295](https://github.com/vercel/ai/pull/15295) — registry add | Open, awaiting review (filed 2026-05-14) | Watch for review activity; respond fast if maintainer asks for changes |
| 2 | [goat-sdk/goat#582](https://github.com/goat-sdk/goat/pull/582) — plugin table add | Open, awaiting review (filed 2026-05-14) | Same |
| 3 | 13 not-yet-indexed URLs in Google (was 15; -2 net change since AM sweep) | Submitted via IndexNow to non-Google engines; Google submission pending | CEO needs to manually click "Request Indexing" in Search Console for the 13 URLs listed below |
| 4 | /writing/agent-framework-comparison-2026 indexing | **Indexed in Google as of 2026-05-17** | Watch for first organic clicks |
| 5 | /compare/sharpe-vs-information-ratio-vs-treynor | Crawled, not yet indexed | Wait 3-7 days; resubmit if not indexed by then |
| 6 | /compare/z-score-vs-bollinger-bands-vs-rsi | **Indexed + ranking page 1 (pos ~6.7) for "mean reversion" niche query, 11 impressions/7d, 0 clicks** | Position-8 noise floor; no action — see priority #1 reframe |
| 7 | Weekly GSC + content-opportunity scan | CronCreate job exists, session-only, expires 7 days. `ops/gsc-weekly.py` runs manually | Schedule skill (remote claude.ai) was failing; retry next session |
| 8 | AdSense readiness monitor | Manual; checked during morning brief | Run during each brief |
| 9 | Dependabot HIGH alert #1 (bigint-buffer transitive in agentkit) | **No fix path — package abandoned at 1.1.5; comes via @coinbase/agentkit → @solana/spl-token. Scope=dev, never in published @quantoracle/agentkit artifact** | Wait for upstream Coinbase team to switch off @solana/spl-token; no action available |
| 10 | options-profit-calculator crawler trap | **CLOSED 2026-05-20.** rel="nofollow" + robots.txt Disallow (deployed 2026-05-17) worked: /options/payoff-diagram SSR calls went 567 (05-18) → 0 (05-19) → 37 (05-20). No Cloudflare/Vercel-Firewall escalation needed. | Done |

## Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-14 | Tighten input caps on compute-heavy endpoints (Monte Carlo sims max 2500, binomial steps max 200, etc.) | Server stability before traffic scales; doc impact minimal |
| 2026-05-14 | Tiered bundle architecture for Vercel AI SDK + GOAT packages (core/options/risk/defi) | Default surface ≤ 5 tools; LLM tool-selection accuracy drops past ~20 tools |
| 2026-05-14 | Skip AgentKit expansion to 15 tools | AgentKit audience prefers curated; v0.1 with 5 tools is the right shape |
| 2026-05-15 | Reduce free tier later, not now | Pre-traction window has no users to anger; tighten when there's a reason |
| 2026-05-15 | Keep monte-carlo at 2500-sim cap (down from 5000) | P5/P95 tail CI widens ~50% but median/mean indistinguishable; server stability worth it |
| 2026-05-17 | gunicorn `--timeout 300` to fix MCP SSE worker kills | 13 worker kills/3h before fix, 0 after; persistent in deploy/quantoracle.service |
| 2026-05-17 | Build custom GSC MCP wrapper instead of third-party | Trust surface minimization; 165 lines we own beats a black-box dependency |
| 2026-05-17 | Manual Google indexing submission instead of Indexing API | Indexing API officially for JobPosting/BroadcastEvent only; manual via Search Console is the sanctioned path |
| 2026-05-17 | Merge 5 Dependabot moderate-severity PRs (#7-#11) in one batch | Cleared 9 of 14 open alerts; all PRs passed Vercel checks; runtime hono + ip-address fixes shipped to mcp-server |
| 2026-05-17 | No action on bigint-buffer HIGH (alert #1) | No upstream patch exists; transitive via Coinbase agentkit peer dep; scope=dev never ships in our npm artifact |
| 2026-05-17 | Skip blind title rewrites on 3 page-1-zero-CTR pages | GSC's <10-imp privacy threshold hides the actual queries; rewrites without query data = guessing |
| 2026-05-18 | Wait one more day on the crawler-trap fix before escalating | rel="nofollow" + robots.txt Disallow shipped 2026-05-17 21:08 UTC. 2026-05-18 partial-day showed 567 SSR calls (vs 374 prior day) — likely the existing crawl queue draining, not new crawls. Decision criterion below. |
| 2026-05-18 | Don't enable Cloudflare Bot Fight Mode yet | DNS is currently configured backwards for what we'd need: apex/www are DNS-only (Vercel direct, Cloudflare doesn't see them) while api.quantoracle.dev IS proxied. Toggling BFM today would filter agentic traffic while leaving the bot traffic untouched. |
| 2026-05-20 | Crawler-trap fix confirmed working; no Cloudflare/Vercel-Firewall escalation | /options/payoff-diagram SSR: 567 → 0 → 37. Free rel="nofollow" + robots.txt fix held. The $20/mo Vercel Firewall question is off the table. |
| 2026-05-20 | Reframe priority #1: bottleneck is rank, not indexing, not CTR | 25+ URLs indexed; ~300 impressions/7d → 5 clicks. 0% CTR at position 6-9 is the noise floor (expected clicks <1), not a fixable title defect. Levers are now authority/links + domain age, not metadata. |

## Watch list

- **Crawler-trap fix — RESOLVED 2026-05-20.** rel="nofollow" + robots.txt
  Disallow (deployed 2026-05-17 21:08 UTC) worked. `/options/payoff-diagram`
  SSR calls: 567 (05-18) → 0 (05-19) → 22 (05-20). Total internal/SSR
  collapsed 596/day → ~54-77/day. No escalation needed — Cloudflare Bot
  Fight Mode / Vercel Firewall not required. Free fix held.
- **Worker timeout reoccurrence.** Fixed 2026-05-17 with `--timeout 300`. If
  the pattern returns (>5 SIGABRT kills/hour), there's a different root cause
  (memory pressure, KV stall, new SSE consumer).
- **API memory growth.** Currently 743/961 MB used. If sustained > 850 MB
  for 24h, plan droplet upgrade.
- **Vercel webhook lag.** Direct pushes sometimes don't trigger Vercel auto-
  deploy. Pattern: gh-CLI merge commits fire reliably; direct git pushes
  intermittent. Workaround: empty-commit retrigger if no deploy within 3 min.
- **AdSense readiness criteria** (as of 2026-05-20):
  - 7-day average daily sessions ≥ 50 (currently ~8/day — 16% of target)
  - Domain age ≥ 90 days (currently 16 days — earliest viable 2026-08-02)
  - Organic search share ≥ 30% (currently ~11%, flat for 3 weeks)
  - Engagement rate ≥ 30% (currently ~37% — MEETING ✓)
  - All pass → recommend applying. Domain-age gate is binding regardless.
- **Rank, not CTR, is the bottleneck** (2026-05-20 finding). Pages at
  position 6-9 with 0 clicks are at the statistical noise floor, not a
  metadata defect — do not rewrite titles speculatively. /black-scholes-
  calculator is the priority climb: 73 impressions/7d stuck at position
  ~60 (page 6). Authority/links + domain age are the levers. See
  priority #1 reframe above.

## Things I can do without asking

- Write, edit, deploy `/writing` and `/compare` articles when GSC/GA4 signal supports
- Calculator title/meta/SEO improvements
- API/worker patches for operational issues
- Integration package bug fixes and minor releases (pre-1.0 patch bumps)
- Analytics monitoring and weekly digests
- SEO hygiene: sitemap, IndexNow, internal linking, schema
- Spam issue/PR triage on the QuantOracle repo
- Security patches (Dependabot moderate/low merges with sanity check)
- Empty-commit retriggers to force Vercel rebuilds

## Things I escalate

- Anything ≥ $10/mo recurring (droplet upgrade, SaaS, paid tools)
- Pricing / tier-structure changes (free tier size, x402 prices)
- Public positioning changes (taglines, fundamental UX)
- Legal/regulatory (TOS, privacy, financial-advice disclaimers)
- Door-closing decisions (deleting content, deprecating endpoints, force-pushing to main)
- New paid commitments
- Strategic pivots beyond "ship more of what's working"
- Force-push main (always escalate)
- Anything involving destroying creds, accounts, or financial holdings

## Resources

- Status pages: https://api.quantoracle.dev/health, https://quantoracle.dev/, https://www.npmjs.com/package/@quantoracle/ai-tools
- Droplet SSH: `ssh root@142.93.191.231` (works from this machine, key in ~/.ssh/id_ed25519)
- GitHub repo: https://github.com/QuantOracledev/quantoracle
- Branch protection on `main`: PR required (admin bypass allowed); CODEOWNERS on package.json + requirements.txt + deploy/ + api/
- Dependabot: enabled, auto-PRs for moderate+
- Google Search Console: https://search.google.com/search-console (property: sc-domain:quantoracle.dev)
- Google Cloud project: `quantoracle-analytics`
- npm packages owned: `@quantoracle/ai-tools`, `@quantoracle/goat-plugin`, `@quantoracle/agentkit`, `@quantoracle/plugin-quantoracle`

## Operating rhythm

When the CEO opens a Claude session and says **"brief me"** or **"status"**,
run `ops/morning-brief.py` and report. Otherwise default to executing on the
top priority that fits the available time.

**Weekly tools (existence; may need to re-trigger if dormant):**

- `ops/gsc-weekly.py` — content-opportunity scan + indexing freshness check
- `ops/morning-brief.py` — startup briefing
- `ops/worker-watch.sh` — droplet worker-timeout monitor

These can be called from Claude or via cron if the user wants them autonomous.
