# Monetization wiring

This site has four monetization layers, all currently inert until you finish the signups and paste the credentials. Layer 1 (AdSense) and Layer 2 (affiliates) are the immediate priorities; layers 3 and 4 wait for traffic to materialize.

## Layer 1 — Google AdSense

**Status:** infrastructure shipped, requires AdSense approval + env config to activate.

### How it's wired

- `components/AdSlot.tsx` — renders `<ins class="adsbygoogle">` tags in production, dashed placeholder previews in dev, or nothing if not configured.
- `components/CalculatorShell.tsx` — embeds two `<AdSlot>` instances per calculator page:
  - `POST_RESULT` — between the calculator output and the FAQ section. Highest CTR slot.
  - `MID_LONGFORM` — inside the long-form explainer. Reaches engaged readers, lower CTR.
- `app/layout.tsx` — loads the AdSense JS bundle (`adsbygoogle.js`) only when `NEXT_PUBLIC_ADSENSE_CLIENT` is set, so the site has zero ad-related JS overhead until you activate it.

### To activate, after AdSense approval

1. In the AdSense dashboard, create **two ad units**:
   - "QuantOracle - Post-Result" — Display ad, responsive
   - "QuantOracle - Mid-Longform" — Display ad, responsive
   - (Optional third: "QuantOracle - Above-Related" if you want a third slot — code already supports it, just uncomment the AdSlot call in CalculatorShell.tsx)
2. Each ad unit gives you a numeric **slot ID**.
3. Set the following environment variables in your Vercel project (Settings → Environment Variables, scoped to Production):

```
NEXT_PUBLIC_ADSENSE_CLIENT       = ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_AD_SLOT_POST_RESULT  = 1234567890
NEXT_PUBLIC_AD_SLOT_MID_LONGFORM = 0987654321
```

4. Redeploy. Ads start serving on the next deploy.

### Preview the layout impact before activation

Set `NEXT_PUBLIC_AD_SLOTS_VISIBLE=true` in dev or in a Vercel preview branch. Dashed-border placeholders appear where ads will go. Useful for visual review without serving real ads. Do NOT set this in production unless you want the placeholders visible to real users.

### AdSense application checklist

You cannot apply for AdSense until the site is live and indexed. Order:

1. Deploy to Vercel + cut DNS so `quantoracle.dev` resolves to the calculator site.
2. Submit sitemap to Google Search Console; wait for at least the homepage and 3-5 calculator pages to be indexed (usually 5-14 days for a new domain).
3. Apply for AdSense at [adsense.google.com](https://www.google.com/adsense/start/). Approval typically takes 1-7 days. They check for: real content (you have it), original content (you have it), no thin pages (your pages are 1,000-1,500 words), no policy violations.
4. After approval, create the ad units, paste the IDs as env vars, redeploy.

### Realistic AdSense revenue

Finance niche RPM (revenue per 1,000 impressions) is typically $5-30. With two ad slots per page and 1.5 pageviews per session on average, expect:

| Monthly traffic | Approx. RPM × impressions | Monthly revenue |
|---|---|---|
| 5,000 visits  | $10 × ~12K | $100-200 |
| 25,000 visits | $15 × ~75K | $800-1,500 |
| 100,000 visits | $20 × ~300K | $4K-7K |

Once you exceed ~50K monthly sessions, [Mediavine](https://www.mediavine.com/) becomes a much better deal (RPM $20-50+, premium ad partners). Apply when you cross that threshold.

## Layer 2 — Broker affiliate links

**Status:** placeholder CTAs in `components/CalculatorShell.tsx` (`AffiliateCta`), pointing to `href="#"`. Needs real tracking links from each program.

### Recommended affiliate programs

| Program | Payout | Niche fit | Approval difficulty |
|---|---|---|---|
| [tastytrade Affiliate](https://www.tastytrade.com/affiliates) | $50-200 per qualified account | Options-heavy — pair with options calculators | Easy (no traffic minimum) |
| [Interactive Brokers](https://www.interactivebrokers.com/en/index.php?f=ibgaffiliateprogram) | $200 per qualified account | Broad — pair with stocks/options/futures | Moderate (they vet content) |
| [Coinbase Affiliate](https://www.coinbase.com/affiliates) | $5-100 per signup | Crypto — pair with crypto calculators | Easy |
| [Webull](https://www.webull.com/affiliate) | $20-100 per signup | Retail traders | Easy |
| [Kraken](https://www.kraken.com/affiliate-program) | $50+ per signup | Crypto power users | Moderate |

Sign up for tastytrade + Coinbase first. Those two cover ~80% of the calculator audience.

### Wiring real links

In `components/CalculatorShell.tsx`, the `AffiliateCta` component currently switches between "crypto" and "general" copy by category. After signup:

1. Replace `href="#"` with your real tracking URLs.
2. Optionally split by category: crypto pages → Coinbase; options pages → tastytrade; general → IBKR.
3. Keep `rel="nofollow sponsored noopener"` on every affiliate link (FTC + SEO best practice).

### Realistic affiliate revenue

Cold calculator traffic converts at 0.05-0.2% to broker signups. With 25K monthly visits:

- 25,000 × 0.001 conversion × $100/signup = **~$2,500/mo** at the high end
- 25,000 × 0.0005 conversion × $50/signup = **~$625/mo** at the low end

Affiliate revenue often exceeds AdSense once traffic is real, especially for options pages.

## Layer 3 — Premium tier (deferred)

**Status:** placeholder `PremiumCta` shows "coming soon." No build work done yet.

Planned features at $9-19/mo:
- Save & revisit your analyses
- Multi-leg position tracker
- IV-crush alerts
- Higher API rate limits for the underlying QuantOracle API
- Email summary of saved positions

Build trigger: when monthly traffic exceeds 30K AND at least one calculator is ranking page-1 for its target keyword. Until then, it's premature.

Stack when ready: Next.js + Clerk auth + Stripe billing + Postgres or Turso for saved-state persistence. ~2 weeks of work.

## Layer 4 — API upsell

**Status:** live and unchanged from before the calculator site existed.

Every page footer links to `/api-docs` which pitches the underlying QuantOracle API to developers. Conversion is one-off (1-5 paying API users/mo at $49-499) but high-LTV. Already wired; no further work.

## Environment variables summary

For the calculator site to monetize fully, the Vercel project needs (Production scope):

```
# AdSense (Layer 1)
NEXT_PUBLIC_ADSENSE_CLIENT       = ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_AD_SLOT_POST_RESULT  = 1234567890
NEXT_PUBLIC_AD_SLOT_MID_LONGFORM = 0987654321

# Layer 2 (affiliates) is hardcoded in CalculatorShell.tsx, no env vars needed

# Layer 3 (premium) — when ready
STRIPE_SECRET_KEY                = sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE   = pk_live_...
DATABASE_URL                     = postgres://...
CLERK_SECRET_KEY                 = sk_live_...

# Layer 4 (API upsell) — none needed; the API is already live separately
```

For a Vercel preview branch where you want to see ad placeholders without serving real ads:

```
NEXT_PUBLIC_AD_SLOTS_VISIBLE = true
```

## What to NOT do

- **No interstitial ads.** Calculator users have a task; interrupting it crashes UX and ranks.
- **No autoplay video ads.** Same.
- **No sticky ads** that follow the scroll on mobile. AdSense allows it but Google's Page Experience signals penalize it heavily.
- **No more than 3 ad units per page.** CTR collapses, AdSense quality score drops.
- **No "click to see results" walls with ads on the result page.** AdSense considers that deceptive, will ban.
- **No premium tier launched before the traffic supports it.** Pre-launching Stripe billing for a calculator site at 100 visits/mo is a waste of two weeks.
