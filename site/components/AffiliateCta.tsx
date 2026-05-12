import { CALCULATORS } from '@/lib/calculators';

// TradingView affiliate ID. Public value (lives in every link), so safe to
// commit. The per-page sub-ID is appended by AffiliateCta so the dashboard
// shows conversion attribution per page.
const TRADINGVIEW_AFF_ID = '166298';

/** Builds an affiliate-tagged TradingView pricing URL with per-page tracking. */
function tradingViewUrl(subId: string): string {
  const params = new URLSearchParams({
    aff_id: TRADINGVIEW_AFF_ID,
    aff_sub: subId,
  });
  return `https://www.tradingview.com/pricing/?${params.toString()}`;
}

export type AffiliateCtaCategory = 'options' | 'crypto' | 'risk' | 'stats' | 'compare';

/**
 * Sponsored TradingView CTA. Used by:
 *   - CalculatorShell (passes a calculator slug; category is looked up from CALCULATORS)
 *   - Compare article pages (passes a slug like 'compare-foo' + category='compare')
 *
 * `subId` is the value that appears in the TradingView affiliate dashboard for
 * per-page conversion attribution. Use distinct slugs per page so you can tell
 * which content is driving signups.
 */
export function AffiliateCta({
  subId,
  category,
}: {
  subId: string;
  category?: AffiliateCtaCategory;
}) {
  // If category not explicitly provided, look it up from CALCULATORS by slug.
  // Lets calculator pages continue to pass just `subId` and get the right copy.
  const cat = category ?? CALCULATORS.find((c) => c.slug === subId)?.category;

  // Per-category copy. TradingView fits all categories — chartists across
  // options, crypto, risk, and general quant audiences all use it.
  const headline =
    cat === 'crypto'
      ? 'Chart and trade crypto with TradingView Pro'
      : cat === 'options'
        ? 'Visualize options strategies on TradingView Pro'
        : cat === 'compare'
          ? 'See it on a chart with TradingView Pro'
          : 'Backtest and chart with TradingView Pro';
  const body =
    cat === 'crypto'
      ? 'Multi-exchange charts, alerts, and indicators across BTC, ETH, and 100,000+ crypto pairs. Free 30-day Pro trial.'
      : cat === 'options'
        ? 'Real-time charts, custom Pine Script indicators, and multi-monitor layouts used by serious options traders. Free 30-day Pro trial.'
        : cat === 'compare'
          ? 'Charts, indicators, and alerts to put these concepts to work on real markets. The chart platform used by 60M+ traders. Free 30-day Pro trial.'
          : 'The chart platform used by 60M+ traders. Custom indicators, multi-timeframe analysis, alerts. Free 30-day Pro trial.';

  return (
    <a
      href={tradingViewUrl(subId)}
      target="_blank"
      // FTC-compliant: rel='sponsored' marks this as paid; 'nofollow' tells
      // search engines not to pass link equity; 'noopener' is security.
      rel="sponsored nofollow noopener"
      // Visually differentiated from content cards: accent-tinted background,
      // accent border, and a left-edge stripe so users immediately register
      // this as an ad slot rather than mistaking it for editorial content.
      className="block group rounded-lg border border-accent/30 bg-accent/[0.04] border-l-4 border-l-accent p-5 hover:border-accent/60 hover:bg-accent/[0.07] transition"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/30 rounded px-2 py-0.5">
          Sponsored
        </span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 group-hover:text-accent transition">
          tradingview.com →
        </span>
      </div>
      <div className="font-semibold text-slate-100 mb-1 group-hover:text-accent transition">
        {headline}
      </div>
      <p className="text-sm text-slate-300">{body}</p>
      <p className="mt-2 text-[10px] text-slate-500">
        QuantOracle earns a commission if you sign up via this link. Doesn&apos;t cost you extra.
      </p>
    </a>
  );
}
