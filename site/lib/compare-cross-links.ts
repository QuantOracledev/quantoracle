/**
 * Single source of truth for the `/compare/*` article catalog and the
 * sibling-article cross-link graph.
 *
 * Why this exists (GSC data, 2026-05-20):
 * - Calculator pages link OUT to /compare articles (calculator-cross-links.ts)
 * - /compare articles link back to calculators in-content
 * - But /compare articles did NOT link to each OTHER — 4 of 11 had zero
 *   sibling links. Google saw 11 disconnected leaf articles instead of one
 *   topical cluster, and a well-ranking article (e.g. z-score at position
 *   ~6, sharpe-vs-sortino at ~8) couldn't pass authority to weaker siblings.
 *
 * Interconnecting the cluster is the highest-leverage on-site SEO move
 * available while the domain ages out of the new-site sandbox: it builds a
 * genuine topical-authority signal and routes ranking equity around the
 * cluster. It also genuinely helps readers — someone comparing Sharpe
 * variants usually wants the adjacent risk-metric comparisons too.
 *
 * Adding a new /compare article: add it to COMPARE_ARTICLES, then add a
 * RELATED entry mapping its slug to 3 conceptually-adjacent siblings.
 */

export interface CompareArticle {
  slug: string;
  title: string;
  blurb: string;
}

/**
 * Every /compare article. The /compare index page renders this list; the
 * cross-link component pulls titles/blurbs from it. Keep in sync with the
 * directories under site/app/compare/ and with sitemap.ts.
 */
export const COMPARE_ARTICLES: CompareArticle[] = [
  {
    slug: 'z-score-vs-bollinger-bands-vs-rsi',
    title: 'Z-Score vs Bollinger Bands vs RSI',
    blurb:
      'Three mean-reversion indicators that all measure "how far from the mean" — and produce different signals. When each is right for pairs trading vs single-asset, and how to combine them.',
  },
  {
    slug: 'black-scholes-vs-monte-carlo',
    title: 'Black-Scholes vs Monte Carlo',
    blurb:
      'Two option pricing methods, two different jobs. Closed-form speed vs simulation generality. Where each is right, where each lies, and how to combine them.',
  },
  {
    slug: 'sharpe-vs-information-ratio-vs-treynor',
    title: 'Sharpe vs Information Ratio vs Treynor',
    blurb:
      'Three risk-adjusted return metrics that look similar but ask different questions. Total vol vs tracking error vs beta — which is right for what audience.',
  },
  {
    slug: 'sharpe-vs-sortino-vs-calmar',
    title: 'Sharpe vs Sortino vs Calmar',
    blurb:
      'Three risk-adjusted return metrics, three different things they measure. Which one to use when, and what good values look like.',
  },
  {
    slug: 'kelly-vs-fixed-fractional-vs-optimal-f',
    title: 'Kelly vs Fixed Fractional vs Optimal-f',
    blurb:
      'Three position sizing methods with wildly different aggressiveness. Why most people should use fixed-fractional, and the half-Kelly trick.',
  },
  {
    slug: 'var-vs-cvar-vs-max-drawdown',
    title: 'VaR vs CVaR vs Max Drawdown',
    blurb:
      'Three downside risk metrics with very different blind spots. Where VaR lies, why CVaR fixes it, and why allocators care about drawdown most.',
  },
  {
    slug: 'black-scholes-vs-binomial',
    title: 'Black-Scholes vs Binomial Tree',
    blurb:
      'Two canonical option pricing methods. When the closed-form formula is right, when binomial trees beat it on early exercise, and how many tree steps you actually need.',
  },
  {
    slug: 'hurst-vs-autocorrelation-vs-variance-ratio',
    title: 'Hurst vs Autocorrelation vs Variance Ratio',
    blurb:
      'Three tests for detecting trend or mean-reversion. One-number summary, lag-by-lag, formal hypothesis test. When to use each.',
  },
  {
    slug: 'implied-vol-vs-historical-vol-vs-realized-vol',
    title: 'Implied vs Historical vs Realized Volatility',
    blurb:
      'Three volatility metrics with the same Greek letter and three different jobs. Pricing options, computing Sharpe, forecasting tomorrow — each demands a different one.',
  },
  {
    slug: 'american-vs-european-vs-bermudan-options',
    title: 'American vs European vs Bermudan Options',
    blurb:
      "Three exercise styles, three different prices. Merton's 1973 theorem, the early exercise premium, and when each pricing method actually matters.",
  },
  {
    slug: 'geometric-vs-arithmetic-vs-time-weighted-returns',
    title: 'Geometric vs Arithmetic vs Time-Weighted Returns',
    blurb:
      'Three ways to compute mean return, three different answers. Volatility drag is real money. The gotcha that breaks long-term wealth projections.',
  },
];

const BY_SLUG: Record<string, CompareArticle> = Object.fromEntries(
  COMPARE_ARTICLES.map((a) => [a.slug, a]),
);

/**
 * compare-slug → 3 conceptually-adjacent sibling slugs. Groupings:
 *   options pricing   — black-scholes-vs-binomial, black-scholes-vs-monte-carlo,
 *                       american-vs-european-vs-bermudan-options
 *   volatility        — implied-vol-vs-historical-vol-vs-realized-vol
 *   risk-adjusted ret — sharpe-vs-sortino-vs-calmar,
 *                       sharpe-vs-information-ratio-vs-treynor
 *   downside risk     — var-vs-cvar-vs-max-drawdown
 *   position sizing   — kelly-vs-fixed-fractional-vs-optimal-f
 *   mean reversion    — z-score-vs-bollinger-bands-vs-rsi,
 *                       hurst-vs-autocorrelation-vs-variance-ratio
 *   return math       — geometric-vs-arithmetic-vs-time-weighted-returns
 */
const RELATED: Record<string, string[]> = {
  'z-score-vs-bollinger-bands-vs-rsi': [
    'hurst-vs-autocorrelation-vs-variance-ratio',
    'var-vs-cvar-vs-max-drawdown',
    'sharpe-vs-sortino-vs-calmar',
  ],
  'black-scholes-vs-monte-carlo': [
    'black-scholes-vs-binomial',
    'american-vs-european-vs-bermudan-options',
    'implied-vol-vs-historical-vol-vs-realized-vol',
  ],
  'sharpe-vs-information-ratio-vs-treynor': [
    'sharpe-vs-sortino-vs-calmar',
    'var-vs-cvar-vs-max-drawdown',
    'geometric-vs-arithmetic-vs-time-weighted-returns',
  ],
  'sharpe-vs-sortino-vs-calmar': [
    'sharpe-vs-information-ratio-vs-treynor',
    'var-vs-cvar-vs-max-drawdown',
    'geometric-vs-arithmetic-vs-time-weighted-returns',
  ],
  'kelly-vs-fixed-fractional-vs-optimal-f': [
    'var-vs-cvar-vs-max-drawdown',
    'sharpe-vs-sortino-vs-calmar',
    'geometric-vs-arithmetic-vs-time-weighted-returns',
  ],
  'var-vs-cvar-vs-max-drawdown': [
    'sharpe-vs-sortino-vs-calmar',
    'kelly-vs-fixed-fractional-vs-optimal-f',
    'z-score-vs-bollinger-bands-vs-rsi',
  ],
  'black-scholes-vs-binomial': [
    'black-scholes-vs-monte-carlo',
    'american-vs-european-vs-bermudan-options',
    'implied-vol-vs-historical-vol-vs-realized-vol',
  ],
  'hurst-vs-autocorrelation-vs-variance-ratio': [
    'z-score-vs-bollinger-bands-vs-rsi',
    'var-vs-cvar-vs-max-drawdown',
    'sharpe-vs-sortino-vs-calmar',
  ],
  'implied-vol-vs-historical-vol-vs-realized-vol': [
    'black-scholes-vs-monte-carlo',
    'black-scholes-vs-binomial',
    'american-vs-european-vs-bermudan-options',
  ],
  'american-vs-european-vs-bermudan-options': [
    'black-scholes-vs-binomial',
    'black-scholes-vs-monte-carlo',
    'implied-vol-vs-historical-vol-vs-realized-vol',
  ],
  'geometric-vs-arithmetic-vs-time-weighted-returns': [
    'sharpe-vs-sortino-vs-calmar',
    'sharpe-vs-information-ratio-vs-treynor',
    'kelly-vs-fixed-fractional-vs-optimal-f',
  ],
};

/**
 * Related sibling /compare articles for a given compare slug. Returns the
 * full article objects (title + blurb), skipping any unknown slugs. Empty
 * array if the slug has no mapping (the component then renders nothing).
 */
export function getRelatedCompare(slug: string): CompareArticle[] {
  return (RELATED[slug] ?? [])
    .map((s) => BY_SLUG[s])
    .filter((a): a is CompareArticle => a !== undefined);
}
