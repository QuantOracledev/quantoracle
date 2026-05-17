import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/compare',
  title: 'Compare — Quant Finance Concepts Side-by-Side',
  description:
    'Head-to-head explainers of commonly-confused quant finance concepts: which to use, when each one lies, and decision rules from real practitioners.',
  keywords: ['quant finance comparisons', 'risk metric comparison', 'quant concepts explained'],
});

const articles = [
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
      'Three exercise styles, three different prices. Merton\'s 1973 theorem, the early exercise premium, and when each pricing method actually matters.',
  },
  {
    slug: 'geometric-vs-arithmetic-vs-time-weighted-returns',
    title: 'Geometric vs Arithmetic vs Time-Weighted Returns',
    blurb:
      'Three ways to compute mean return, three different answers. Volatility drag is real money. The gotcha that breaks long-term wealth projections.',
  },
];

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>{' '}
        / Compare
      </nav>
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Compare</h1>
        <p className="mt-4 text-slate-300 text-lg">
          Head-to-head explainers of commonly-confused quant finance concepts. Each article picks
          a real decision a practitioner has to make and walks through how to make it.
        </p>
      </header>
      <div className="space-y-3">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/compare/${a.slug}`}
            className="card hover:border-accent/40 transition block"
          >
            <div className="font-semibold text-slate-100 mb-1">{a.title}</div>
            <div className="text-sm text-slate-400">{a.blurb}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
