/**
 * RSS 2.0 feed for QuantOracle.
 *
 * Purpose: enable aggregators (Quantocracy, blog readers, Feedly, etc.) to
 * pull our content automatically. The feed includes the comparison/explainer
 * articles in /compare/* — these are the editorial pieces aggregators actually
 * want; calculator pages are tool URLs and don't belong here.
 *
 * To add a new compare article: add an entry to COMPARE_ARTICLES below.
 * To regenerate: this is a route handler — Next.js serves it on every request,
 * so no build step needed. Date is the publish date (ISO 8601).
 */

const SITE_URL = 'https://quantoracle.dev';

interface Article {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // ISO date
}

const COMPARE_ARTICLES: Article[] = [
  {
    slug: 'sharpe-vs-sortino-vs-calmar',
    title: 'Sharpe vs Sortino vs Calmar: Which Risk-Adjusted Return Metric Should You Use?',
    description:
      'Three risk-adjusted return metrics, three different things they measure. Formulas, when each one lies, what good values look like, and which one allocators actually use.',
    publishedAt: '2026-05-11T00:00:00Z',
  },
  {
    slug: 'kelly-vs-fixed-fractional-vs-optimal-f',
    title: 'Kelly vs Fixed Fractional vs Optimal-f: Which Position Sizing Method Should You Use?',
    description:
      'Three position-sizing methods with wildly different aggressiveness profiles. Formulas, when each one over-bets, and why almost everyone actually uses half-Kelly.',
    publishedAt: '2026-05-11T00:00:00Z',
  },
  {
    slug: 'var-vs-cvar-vs-max-drawdown',
    title: 'VaR vs CVaR vs Max Drawdown: Three Ways to Measure Downside Risk',
    description:
      'Three downside metrics that answer fundamentally different questions. Where VaR lies, why CVaR was invented, and why allocators care about drawdown most.',
    publishedAt: '2026-05-11T00:00:00Z',
  },
  {
    slug: 'black-scholes-vs-binomial',
    title: 'Black-Scholes vs Binomial Tree: Which Option Pricing Method?',
    description:
      'The two canonical option pricing methods. When the closed-form formula is right, when binomial wins on early exercise, and how many tree steps you actually need.',
    publishedAt: '2026-05-11T00:00:00Z',
  },
  {
    slug: 'hurst-vs-autocorrelation-vs-variance-ratio',
    title: 'Hurst Exponent vs Autocorrelation vs Variance Ratio Test',
    description:
      'Three ways to detect whether a time series is trending, mean-reverting, or random walk. Which to use when, how they disagree, and what to do when they conflict.',
    publishedAt: '2026-05-11T00:00:00Z',
  },
  {
    slug: 'implied-vol-vs-historical-vol-vs-realized-vol',
    title: 'Implied vs Historical vs Realized Volatility: Which One Should You Use?',
    description:
      'Three volatility metrics that look similar but answer different questions. Implied is forward-looking, historical is close-to-close, realized uses high-frequency intraday data. Decision rule + concrete formulas.',
    publishedAt: '2026-05-14T00:00:00Z',
  },
  {
    slug: 'american-vs-european-vs-bermudan-options',
    title: 'American vs European vs Bermudan Options: Which Exercise Style and Why It Matters',
    description:
      'Three exercise styles, three different prices for the same parameters. Merton\'s 1973 theorem on early exercise, when the premium is positive, and the pricing methods that handle each style.',
    publishedAt: '2026-05-14T00:00:00Z',
  },
  {
    slug: 'geometric-vs-arithmetic-vs-time-weighted-returns',
    title: 'Geometric vs Arithmetic vs Time-Weighted Return: Three Means, Three Answers',
    description:
      'One of the most common quant mistakes: using arithmetic mean where geometric belongs. The gap (volatility drag) is real money. CAGR, Sharpe inputs, manager comparison — each demands a different one.',
    publishedAt: '2026-05-14T00:00:00Z',
  },
];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function articleItem(a: Article): string {
  const url = `${SITE_URL}/compare/${a.slug}`;
  const pubDate = new Date(a.publishedAt).toUTCString();
  return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(a.description)}</description>
      <pubDate>${pubDate}</pubDate>
      <author>noreply@quantoracle.dev (QuantOracle)</author>
    </item>`;
}

export async function GET() {
  // Sort newest first so aggregators see most recent at top
  const sorted = [...COMPARE_ARTICLES].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const lastBuildDate = new Date(sorted[0]?.publishedAt ?? Date.now()).toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>QuantOracle — Quant Finance Explainers</title>
    <link>${SITE_URL}</link>
    <description>Head-to-head explainers of commonly-confused quant finance concepts: risk-adjusted returns, position sizing, option pricing, time-series tests. From quantoracle.dev — free calculators + API for quant practitioners.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${sorted.map(articleItem).join('\n')}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
