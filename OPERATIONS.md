# QuantOracle — Operations & Strategy

> Internal COO working document. Updated each session. The first thing Claude
> reads when starting a fresh operating session.

**Last updated:** 2026-05-17  
**Updated by:** Claude (COO)

---

## North Star

**Long-term profitability via AdSense + x402 micropayments + (eventual) premium tier.**

Right-now bottleneck: **traffic**. Product works (4-10 min engagement on top
calcs, 50% engagement rate on /compare/* when found, 100% engagement on the
returning-user cohort). Distribution is what's behind.

---

## Top 3 strategic priorities (next 30 days)

### 1. Traffic → AdSense readiness

**Target:** sustained 50+ daily sessions, 30%+ organic search share, domain
age 90+ days. Realistic apply date: **early August 2026** at current
trajectory; could pull forward to early July if upstream PRs merge.

Levers (in priority order):

- **Get the 15 not-yet-indexed URLs into Google.** Already pushed via IndexNow
  for Bing/Yandex/DDG/Seznam. Google requires manual Search Console submission
  (or the Indexing API with an additional gcloud scope — gray area but works).
- **Compound the /compare and /writing catalogs.** 6 of 12 pages already rank
  page 1 for niche queries (per GSC, 2026-05-17). Each new well-researched
  article potentially adds another page-1 niche to the catalog.
- **Land the two upstream PRs.** [vercel/ai#15295](https://github.com/vercel/ai/pull/15295)
  and [goat-sdk/goat#582](https://github.com/goat-sdk/goat/pull/582) — each
  would put us in front of thousands of developers.
- **Drive CTR on already-ranking pages.** Several pages rank page 1 but get
  0% CTR — that's a title/meta problem. Rewrites for those compound at
  current ranking.

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
| 1 | [vercel/ai#15295](https://github.com/vercel/ai/pull/15295) — registry add | Open, awaiting review | Watch for review activity; respond fast if maintainer asks for changes |
| 2 | [goat-sdk/goat#582](https://github.com/goat-sdk/goat/pull/582) — plugin table add | Open, awaiting review | Same |
| 3 | 15 not-yet-indexed URLs in Google | Submitted via IndexNow to non-Google engines; Google submission pending | User needs to manually click "Request Indexing" in Search Console — sequence prioritized in last session |
| 4 | /writing/agent-framework-comparison-2026 indexing | **Indexed in Google as of 2026-05-17** | Watch for first organic clicks |
| 5 | /compare/sharpe-vs-information-ratio-vs-treynor | Crawled, not yet indexed | Wait 3-7 days; resubmit if not indexed by then |
| 6 | /compare/z-score-vs-bollinger-bands-vs-rsi | Published today, not yet seen by Google | Auto-submitted to IndexNow; Google manual pending |
| 7 | Weekly GSC + content-opportunity scan | CronCreate job exists, session-only, expires 7 days | Schedule skill (remote claude.ai) was failing; retry next session |
| 8 | AdSense readiness monitor | Manual; checked during morning brief | Run during each brief |

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

## Watch list

- **Worker timeout reoccurrence.** Fixed 2026-05-17 with `--timeout 300`. If
  the pattern returns (>5 SIGABRT kills/hour), there's a different root cause
  (memory pressure, KV stall, new SSE consumer).
- **API memory growth.** Currently 743/961 MB used. If sustained > 850 MB
  for 24h, plan droplet upgrade.
- **Vercel webhook lag.** Direct pushes sometimes don't trigger Vercel auto-
  deploy. Pattern: gh-CLI merge commits fire reliably; direct git pushes
  intermittent. Workaround: empty-commit retrigger if no deploy within 3 min.
- **AdSense readiness criteria.**
  - 7-day average daily sessions ≥ 50 (currently ~10)
  - Domain age ≥ 90 days (currently 13)
  - Organic search share ≥ 30% (currently ~9%)
  - All four pass → recommend applying
- **/compare ranking pages with 0% CTR** (signals title/meta problem):
  - /compare/sharpe-vs-sortino-vs-calmar — fixed 2026-05-17, watch for CTR change
  - /probabilistic-sharpe-ratio-calculator at position 10.2 also 0 CTR

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
