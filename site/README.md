# quantoracle.dev (web frontend)

A Next.js 14 App Router site that exposes 10 high-search-volume quant finance calculators as free, fast, ad-supported tools. Each calculator wraps an existing endpoint at `https://api.quantoracle.dev`, so there's no backend duplication — this site is purely a SEO/distribution surface for the API that's already shipped.

## Why this exists

The API has been live since 2026-04 with multi-chain x402 payment rails, real on-chain settlements, and 73 deterministic endpoints. But the homepage `quantoracle.dev` 301-redirects to GitHub, making the project invisible to the ~250,000 humans/month who Google for things like "options profit calculator" or "kelly criterion calculator." This site fixes that.

The autonomous-agent buyer for x402 services hasn't materialized at scale yet. Real humans searching for these calculators have. Go where the demand is.

## Stack

- Next.js 14 App Router (RSC by default, static generation per page)
- Tailwind CSS
- Recharts (for payoff diagrams, equity curves)
- Vercel hosting (free tier covers ~100GB bandwidth/mo)
- Google AdSense → Mediavine (when 50K monthly sessions hit)
- PostHog or Plausible for analytics

## Pages (launch set)

| URL | Endpoint wrapped | Search volume |
|---|---|---|
| `/options-profit-calculator` | `/v1/options/payoff-diagram` + `/v1/options/strategy` | ~165K/mo |
| `/black-scholes-calculator` | `/v1/options/price` | ~50K/mo |
| `/crypto-liquidation-calculator` | `/v1/crypto/liquidation-price` | ~30K/mo |
| `/impermanent-loss-calculator` | `/v1/crypto/impermanent-loss` | ~15K/mo |
| `/position-size-calculator` | `/v1/risk/position-size` | ~12K/mo |
| `/value-at-risk-calculator` | `/v1/risk/var-parametric` | ~8K/mo |
| `/kelly-criterion-calculator` | `/v1/risk/kelly` | ~8K/mo |
| `/implied-volatility-calculator` | `/v1/options/implied-vol` | ~8K/mo |
| `/sharpe-ratio-calculator` | `/v1/stats/sharpe-ratio` | ~5K/mo |
| `/hedge-ratio-calculator` | `/v1/hedging/recommend` | ~5K/mo |

## Page template (every calculator follows this)

1. H1 with the target keyword exactly (e.g. "Black-Scholes Option Pricing Calculator")
2. 1-line subtitle with trust signal ("Powered by the same engine pricing 50,000+ options/day for AI agents")
3. Two-column layout: inputs on left, results + chart on right (stacks on mobile)
4. "What does this mean?" — 1-paragraph plain-English interpretation of the result
5. Two CTAs side-by-side: "Save this analysis" (premium upsell) + "Open account at [affiliate broker]" (revenue)
6. FAQ accordion with 10 hand-written questions, each as its own H2, marked up with `Schema.org/FAQPage` for Google rich snippets
7. Related calculators (3-5 internal links — cross-linking for SEO juice)
8. Footer: "Powered by the QuantOracle API — 73 quant endpoints, free tier, no key. [API docs →]"

Word count target: 800-1,500 words per page. Most of that is the FAQ. Google ranks long-form for finance.

## Monetization stack

1. **AdSense** from day 1 (placeholder slots in the FAQ section)
2. **Affiliate links** to tastytrade ($50-200/account), IBKR ($200/qualified), Coinbase ($5-100/crypto signup) — strategically placed near calculator outputs (highest intent moment)
3. **Premium tier** ($9-19/mo) — saved portfolios, multi-leg analysis, alerts. Activates once monthly traffic > 30K
4. **API upsell** — every footer drives developers to `/api-docs` where they convert at 1-5/month at $49-499

## Folder structure

```
site/
├── app/
│   ├── layout.tsx                 # nav + footer + analytics
│   ├── page.tsx                    # homepage with calculator index
│   ├── (calculators)/              # route group, no URL segment
│   │   ├── options-profit-calculator/page.tsx
│   │   ├── black-scholes-calculator/page.tsx
│   │   ├── crypto-liquidation-calculator/page.tsx
│   │   ├── impermanent-loss-calculator/page.tsx
│   │   ├── position-size-calculator/page.tsx
│   │   ├── value-at-risk-calculator/page.tsx
│   │   ├── kelly-criterion-calculator/page.tsx
│   │   ├── implied-volatility-calculator/page.tsx
│   │   ├── sharpe-ratio-calculator/page.tsx
│   │   └── hedge-ratio-calculator/page.tsx
│   ├── api-docs/page.tsx           # developer landing — converts visiting devs to API users
│   ├── about/page.tsx
│   └── sitemap.ts                   # auto-generated for Search Console
├── components/
│   ├── CalculatorShell.tsx         # shared two-column layout
│   ├── InputCard.tsx
│   ├── ResultsCard.tsx
│   ├── PayoffChart.tsx
│   ├── FAQ.tsx                     # with schema.org markup
│   ├── AffiliateCTA.tsx
│   └── AdSlot.tsx
├── lib/
│   ├── api.ts                      # wrapper around api.quantoracle.dev
│   ├── seo.ts                      # generateMetadata helper
│   └── faqs/                       # one MDX/JSON file per page, hand-written
└── public/
    ├── og-options-profit.png       # per-page Open Graph images
    └── ...
```

## DNS migration (the moment of truth)

Currently `quantoracle.dev` 301-redirects to `github.com/QuantOracledev/quantoracle`. Before launching this site, that redirect needs to be removed and a CNAME pointed at Vercel. The API stays at `api.quantoracle.dev` (subdomain), unchanged.

This is the cutover risk: any inbound link to `quantoracle.dev` currently going to GitHub will now hit the new site instead. Audit links first, but the only meaningful one is the GitHub README's own self-link, which obviously is fine to repoint.

## Launch sequence

1. Build the scaffold + 1 calculator (Black-Scholes is simplest for v1) — ~1 weekend
2. Deploy to Vercel under `quantoracle-site.vercel.app`, confirm API calls work from server-side, confirm Lighthouse score > 95
3. Build remaining 9 calculators using the shared template — ~1 weekend
4. Hand-write FAQs and meta descriptions per page — half day per page (this is the tedious-but-essential SEO work)
5. Cut over DNS, submit sitemap to Google Search Console + Bing Webmaster Tools
6. Sign up for AdSense, place 2-3 ad slots per page
7. Sign up for tastytrade / IBKR / Coinbase affiliate programs, swap placeholder CTAs for real tracking links
8. Wait. Calculator-keyword SEO typically takes 2-4 months to start ranking. Don't panic-iterate before week 8.
9. Once monthly traffic > 5K: start writing supporting blog posts ("How to size positions with Kelly Criterion: a worked example") that internal-link to the calculators
10. Once monthly traffic > 30K: build the premium tier

## Cost projection

- Vercel: $0/mo (free tier sufficient until ~500K page views/mo)
- Domain: already owned
- AdSense / affiliates: revenue-share, no upfront
- Analytics: Plausible $9/mo or Posthog free tier
- **Total burn: $0-9/month**

## What to NOT build initially

- User accounts (premium can wait until traffic justifies it)
- Server-side calculations (the API already does this — just call it)
- Custom CMS for FAQs (just hand-write each page's MDX file, 10 pages is tractable)
- A backend (this is a frontend-only project; the backend is api.quantoracle.dev)
- Custom auth (when premium ships, use Clerk or Auth.js, don't roll your own)

## Success criteria (be honest with yourself in 90 days)

- **Month 1**: Site live, all 10 pages indexed in Google Search Console
- **Month 2**: At least 3 pages ranked top-50 for their target keyword
- **Month 3**: Combined organic traffic > 1,000 visits/mo, first $1 of AdSense revenue
- **Month 6**: > 10K visits/mo, > $200/mo combined ad + affiliate revenue
- **Month 12**: > 50K visits/mo, > $2K/mo

If month 3 numbers aren't on track, the SEO competitive analysis was wrong and the strategy needs to be reconsidered. If month 3 numbers ARE on track, double down with another 10 calculators (long tail: Sortino, Calmar, Treynor, Black-Litterman, etc.).
