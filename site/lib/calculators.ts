/**
 * Single source of truth for the launch set of calculator pages.
 * Used by the homepage index, sitemap, related-calculators block, and nav.
 */
export interface CalculatorMeta {
  slug: string;
  title: string;
  short: string;
  endpoint: string;
  searchVolume: string;
  category: 'options' | 'risk' | 'crypto' | 'stats';
  status: 'live' | 'planned';
}

export const CALCULATORS: CalculatorMeta[] = [
  {
    slug: 'black-scholes-calculator',
    title: 'Black-Scholes Option Pricing Calculator',
    short: 'Price European calls and puts with full Greeks (delta, gamma, vega, theta, rho).',
    endpoint: '/v1/options/price',
    searchVolume: '~50K/mo',
    category: 'options',
    status: 'live',
  },
  {
    slug: 'american-option-calculator',
    title: 'American Option Pricing Calculator (Binomial Tree)',
    short:
      'Price American calls and puts with early exercise and dividend yield via a binomial tree.',
    endpoint: '/v1/derivatives/binomial-tree',
    searchVolume: '~5K/mo',
    category: 'options',
    status: 'live',
  },
  {
    slug: 'options-profit-calculator',
    title: 'Options Profit Calculator',
    short: 'Visualize the payoff diagram and break-even points for any option strategy.',
    endpoint: '/v1/options/payoff-diagram',
    searchVolume: '~165K/mo',
    category: 'options',
    status: 'live',
  },
  {
    slug: 'crypto-liquidation-calculator',
    title: 'Crypto Liquidation Price Calculator',
    short: 'Calculate the liquidation price for leveraged long and short positions.',
    endpoint: '/v1/crypto/liquidation-price',
    searchVolume: '~30K/mo',
    category: 'crypto',
    status: 'live',
  },
  {
    slug: 'impermanent-loss-calculator',
    title: 'Impermanent Loss Calculator',
    short: 'Estimate impermanent loss for liquidity-pool positions across price moves.',
    endpoint: '/v1/crypto/impermanent-loss',
    searchVolume: '~15K/mo',
    category: 'crypto',
    status: 'live',
  },
  {
    slug: 'position-size-calculator',
    title: 'Position Size Calculator',
    short: 'Size positions consistently using account size, risk-per-trade, entry, and stop-loss.',
    endpoint: '/v1/risk/position-size',
    searchVolume: '~12K/mo',
    category: 'risk',
    status: 'live',
  },
  {
    slug: 'value-at-risk-calculator',
    title: 'Value at Risk (VaR) Calculator',
    short: 'Compute parametric VaR and CVaR for a return series at any confidence level.',
    endpoint: '/v1/risk/var-parametric',
    searchVolume: '~8K/mo',
    category: 'risk',
    status: 'live',
  },
  {
    slug: 'drawdown-calculator',
    title: 'Drawdown Calculator (Max Drawdown + Recovery)',
    short: 'Compute max drawdown, average drawdown, drawdown duration, and recovery time from any equity curve.',
    endpoint: '/v1/risk/drawdown',
    searchVolume: '~5K/mo',
    category: 'risk',
    status: 'live',
  },
  {
    slug: 'hurst-exponent-calculator',
    title: 'Hurst Exponent Calculator (Trending vs Mean-Reverting)',
    short: 'Classify a time series as trending, mean-reverting, or random walk using the Hurst exponent (R/S analysis).',
    endpoint: '/v1/stats/hurst-exponent',
    searchVolume: '~1-2K/mo',
    category: 'stats',
    status: 'live',
  },
  {
    slug: 'probabilistic-sharpe-ratio-calculator',
    title: 'Probabilistic Sharpe Ratio Calculator',
    short:
      'Compute the probability that a strategy\'s true Sharpe ratio exceeds a benchmark — accounts for skewness, kurtosis, and sample size.',
    endpoint: '/v1/stats/probabilistic-sharpe',
    searchVolume: '~1K/mo',
    category: 'stats',
    status: 'live',
  },
  {
    slug: 'kelly-criterion-calculator',
    title: 'Kelly Criterion Calculator',
    short: 'Find the optimal bet/position size given win rate and average win/loss.',
    endpoint: '/v1/risk/kelly',
    searchVolume: '~8K/mo',
    category: 'risk',
    status: 'live',
  },
  {
    slug: 'implied-volatility-calculator',
    title: 'Implied Volatility Calculator',
    short: 'Solve for the implied volatility of an option given its market price.',
    endpoint: '/v1/options/implied-vol',
    searchVolume: '~8K/mo',
    category: 'options',
    status: 'live',
  },
  {
    slug: 'cagr-calculator',
    title: 'CAGR Calculator (Compound Annual Growth Rate)',
    short:
      'Compute the compound annual growth rate from a starting value, ending value, and time period — plus doubling time and forward projections.',
    endpoint: '/v1/tvm/cagr',
    searchVolume: '~30K/mo',
    category: 'stats',
    status: 'live',
  },
  {
    slug: 'sharpe-ratio-calculator',
    title: 'Sharpe Ratio Calculator',
    short: 'Compute the Sharpe ratio of a returns series with a configurable risk-free rate.',
    endpoint: '/v1/stats/sharpe-ratio',
    searchVolume: '~5K/mo',
    category: 'stats',
    status: 'live',
  },
  {
    slug: 'monte-carlo-simulation-calculator',
    title: 'Monte Carlo Simulation Calculator',
    short:
      'Simulate thousands of price paths to see the full distribution of portfolio outcomes — mean, median, P5/P95, probability of loss.',
    endpoint: '/v1/simulate/montecarlo',
    searchVolume: '~15K/mo',
    category: 'risk',
    status: 'live',
  },
];

export function getCalculator(slug: string): CalculatorMeta | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}

export function getRelated(slug: string, count = 3): CalculatorMeta[] {
  const me = getCalculator(slug);
  if (!me) return CALCULATORS.slice(0, count);
  // Same category first, then fall back to others.
  const sameCat = CALCULATORS.filter((c) => c.category === me.category && c.slug !== slug);
  const others = CALCULATORS.filter((c) => c.category !== me.category && c.slug !== slug);
  return [...sameCat, ...others].slice(0, count);
}
