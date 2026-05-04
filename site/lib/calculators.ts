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
    status: 'planned',
  },
  {
    slug: 'crypto-liquidation-calculator',
    title: 'Crypto Liquidation Price Calculator',
    short: 'Calculate the liquidation price for leveraged long and short positions.',
    endpoint: '/v1/crypto/liquidation-price',
    searchVolume: '~30K/mo',
    category: 'crypto',
    status: 'planned',
  },
  {
    slug: 'impermanent-loss-calculator',
    title: 'Impermanent Loss Calculator',
    short: 'Estimate impermanent loss for liquidity-pool positions across price moves.',
    endpoint: '/v1/crypto/impermanent-loss',
    searchVolume: '~15K/mo',
    category: 'crypto',
    status: 'planned',
  },
  {
    slug: 'position-size-calculator',
    title: 'Position Size Calculator',
    short: 'Size positions consistently using fixed-fractional, ATR, and risk-of-ruin rules.',
    endpoint: '/v1/risk/position-size',
    searchVolume: '~12K/mo',
    category: 'risk',
    status: 'planned',
  },
  {
    slug: 'value-at-risk-calculator',
    title: 'Value at Risk (VaR) Calculator',
    short: 'Compute parametric VaR and CVaR for a return series at any confidence level.',
    endpoint: '/v1/risk/var-parametric',
    searchVolume: '~8K/mo',
    category: 'risk',
    status: 'planned',
  },
  {
    slug: 'kelly-criterion-calculator',
    title: 'Kelly Criterion Calculator',
    short: 'Find the optimal bet/position size given win rate and win/loss ratio.',
    endpoint: '/v1/risk/kelly',
    searchVolume: '~8K/mo',
    category: 'risk',
    status: 'planned',
  },
  {
    slug: 'implied-volatility-calculator',
    title: 'Implied Volatility Calculator',
    short: 'Solve for the implied volatility of an option given its market price.',
    endpoint: '/v1/options/implied-vol',
    searchVolume: '~8K/mo',
    category: 'options',
    status: 'planned',
  },
  {
    slug: 'sharpe-ratio-calculator',
    title: 'Sharpe Ratio Calculator',
    short: 'Compute the Sharpe ratio of a returns series with a configurable risk-free rate.',
    endpoint: '/v1/stats/sharpe-ratio',
    searchVolume: '~5K/mo',
    category: 'stats',
    status: 'planned',
  },
  {
    slug: 'hedge-ratio-calculator',
    title: 'Hedge Calculator',
    short: 'Get ranked hedge structures (collar, protective put, partial put) for a position.',
    endpoint: '/v1/hedging/recommend',
    searchVolume: '~5K/mo',
    category: 'risk',
    status: 'planned',
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
