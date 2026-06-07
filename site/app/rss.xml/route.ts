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
  /** Path prefix — defaults to 'compare' for backward compat. */
  section?: 'compare' | 'writing';
}

/** Tutorials and long-form articles on quantoracle.dev/writing. Newest first. */
const WRITING_ARTICLES: Article[] = [
  {
    slug: 'live-crypto-data-for-agents',
    title: 'Live Crypto Volatility & Funding for Your Agent — Data + Compute in One Call',
    description:
      'QuantOracle Live: give your agent fresh crypto realized volatility and perpetual funding rates with one API call. We fetch the live market data and run the math — no exchange integrations to manage. 3 free calls/IP/day, then pay-per-call via x402.',
    publishedAt: '2026-06-07T16:00:00Z',
    section: 'writing',
  },
  {
    slug: 'sui-talus-quant-agent',
    title: 'Add Reliable Quant Math to Your Sui / Talus Agent',
    description:
      'Wire deterministic quant-finance tools — Black-Scholes, liquidation price, impermanent loss, Monte Carlo, full risk analysis — into a Sui AI agent (Talus/Nexus, Sui AI Agent Kit, or any MCP host). Two routes: zero-code MCP, or a portable TypeScript tool-pack. Free tier, no API key.',
    publishedAt: '2026-06-05T18:00:00Z',
    section: 'writing',
  },
  {
    slug: 'batch-quant-api-calls',
    title: 'Batch API Calls for Speed: Price a Whole Option Chain in One Request',
    description:
      'The /v1/batch endpoint bundles up to 100 quant computations into a single HTTP round-trip. A real benchmark: 20 Black-Scholes calls dropped from 7,182 ms sequential to 1,426 ms batched — 5× faster. Batch is a paid endpoint (sum of sub-request prices via x402) — you pay for the speed, not a discount. Request shape, response shape, pricing, gotchas, and the single-tool agent pattern.',
    publishedAt: '2026-06-02T16:00:00Z',
    section: 'writing',
  },
  {
    slug: 'agent-framework-comparison-2026',
    title:
      'AgentKit vs GOAT vs Vercel AI SDK vs LangChain vs elizaOS: Which Agent Framework for Quant Tools?',
    description:
      'Five agent frameworks, one quant API, real code in each. Decision tables, code samples, performance numbers, and migration paths between them. The honest comparison covering AgentKit, GOAT, Vercel AI SDK, LangChain, and elizaOS.',
    publishedAt: '2026-05-15T16:00:00Z',
    section: 'writing',
  },
  {
    slug: 'vercel-ai-sdk-quant-tools',
    title: 'Add Reliable Quant Finance Math to Your Vercel AI SDK Agent in 5 Minutes',
    description:
      'Wire 15 deterministic quant tools — Black-Scholes, Kelly, Monte Carlo, VaR, Sharpe, impermanent loss, liquidation price — into a Vercel AI SDK agent with a single import. Works with generateText, streamText, and useChat.',
    publishedAt: '2026-05-14T12:00:00Z',
    section: 'writing',
  },
  {
    slug: 'agentkit-reliable-quant-finance-math',
    title: 'How to Give Your Coinbase AgentKit Agent Reliable Quant Finance Math (10 Minutes)',
    description:
      'Wire 5 deterministic quant tools — Black-Scholes, Kelly, Monte Carlo, plus 2 paid composites via x402 — into a Coinbase AgentKit agent in under 10 minutes. Free tier + Solana variant included.',
    publishedAt: '2026-05-14T00:00:00Z',
    section: 'writing',
  },
  {
    slug: 'chaining-x402-paid-tool-calls',
    title: 'Chaining x402 Paid Tool Calls — A Working Risk-Audit → Hedge-Recommend Demo on Base Mainnet',
    description:
      'Most x402 demos show one call, one response. The interesting case is chaining multiple paid calls in one agent loop. Working code, transcript, and the system-prompt pattern that makes it reliable.',
    publishedAt: '2026-05-14T00:00:00Z',
    section: 'writing',
  },
];

const COMPARE_ARTICLES: Article[] = [
  {
    slug: 'z-score-vs-bollinger-bands-vs-rsi',
    title: 'Z-Score vs Bollinger Bands vs RSI: Which Mean Reversion Indicator?',
    description:
      'Three mean-reversion indicators that all measure "how far from the mean" — and produce different signals. Z-score is the statistical one. Bollinger Bands are the chart overlay. RSI is the bounded oscillator. When each lies, when they disagree, and which is right for pairs trading vs single-asset.',
    publishedAt: '2026-05-17T14:00:00Z',
  },
  {
    slug: 'black-scholes-vs-monte-carlo',
    title: 'Black-Scholes vs Monte Carlo: Which Option Pricing Method Should You Use?',
    description:
      'Two option pricing approaches, two different jobs. Closed-form Black-Scholes is microseconds-fast but only handles vanilla European payoffs. Monte Carlo handles anything you can simulate but pays the variance tax. Decision rule, convergence, Greeks, and the American / path-dependent / multi-asset edge cases.',
    publishedAt: '2026-05-15T16:00:00Z',
  },
  {
    slug: 'sharpe-vs-information-ratio-vs-treynor',
    title: 'Sharpe vs Information Ratio vs Treynor: Three Risk-Adjusted Return Metrics',
    description:
      'Three numbers that all claim to measure risk-adjusted return, three different questions. Sharpe scales by total volatility. Information Ratio scales benchmark-relative return by tracking error. Treynor scales by beta. When each is right and what good values look like.',
    publishedAt: '2026-05-15T16:00:00Z',
  },
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
  const section = a.section ?? 'compare';
  const url = `${SITE_URL}/${section}/${a.slug}`;
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
  const sorted = [...WRITING_ARTICLES, ...COMPARE_ARTICLES].sort(
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
