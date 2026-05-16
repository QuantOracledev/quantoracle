/**
 * Cross-links from each calculator page to related editorial content:
 * `/compare/*` head-to-head articles and `/writing/*` tutorials.
 *
 * Why this exists (GA4 data, May 2026):
 * - Top calculator pages get 4-10 minute engaged sessions
 * - Returning users average 4.5 pages/session
 * - `/compare/*` articles have 100% engagement when found
 * - `/writing/*` integration tutorials had 0 organic traffic in their first
 *   30 days because no surfaces linked to them
 *
 * Surfacing these from high-engagement calc pages is the single highest-
 * leverage internal-linking move — it converts captive multi-minute audiences
 * into multi-page sessions.
 *
 * Slugs reference:
 *   compare/*  — see site/app/compare/<slug>/page.tsx
 *   writing/*  — see site/app/writing/<slug>/page.tsx
 */

export interface CalculatorCrossLinks {
  /**
   * Head-to-head explainer articles directly relevant to this calculator's
   * underlying concept. Surfaced as "Compare this approach" tiles.
   */
  compare: { slug: string; title: string; what: string }[];
  /**
   * Long-form tutorials covering how to use this calculator's underlying
   * endpoint from an AI agent. Surfaced as "Build this into your agent" tiles.
   */
  writing: { slug: string; title: string; what: string }[];
}

/**
 * Map: calculator-slug → cross-links. Calculators without entries fall back
 * to an empty result; their CalculatorShell footer simply omits the section.
 *
 * Adding a new entry: just include the calc slug and any combination of
 * compare/writing arrays. No code changes needed beyond this file.
 */
const COMPARE_TITLES = {
  'american-vs-european-vs-bermudan-options': {
    title: 'American vs European vs Bermudan Options',
    what: 'Three exercise styles, three different prices for the same parameters.',
  },
  'black-scholes-vs-binomial': {
    title: 'Black-Scholes vs Binomial Tree',
    what: 'When the closed-form formula is right vs when binomial wins on early exercise.',
  },
  'black-scholes-vs-monte-carlo': {
    title: 'Black-Scholes vs Monte Carlo',
    what: 'Closed-form speed vs simulation generality — when each is right.',
  },
  'sharpe-vs-information-ratio-vs-treynor': {
    title: 'Sharpe vs Information Ratio vs Treynor',
    what: 'Three risk-adjusted return metrics, three different questions.',
  },
  'geometric-vs-arithmetic-vs-time-weighted-returns': {
    title: 'Geometric vs Arithmetic vs Time-Weighted Return',
    what: 'Three means, three answers — and one common mistake.',
  },
  'hurst-vs-autocorrelation-vs-variance-ratio': {
    title: 'Hurst vs Autocorrelation vs Variance Ratio',
    what: 'Three ways to detect trending vs mean-reverting series.',
  },
  'implied-vol-vs-historical-vol-vs-realized-vol': {
    title: 'Implied vs Historical vs Realized Volatility',
    what: 'Three vol metrics that look similar but answer different questions.',
  },
  'kelly-vs-fixed-fractional-vs-optimal-f': {
    title: 'Kelly vs Fixed Fractional vs Optimal-f',
    what: 'Three position-sizing methods with wildly different aggressiveness profiles.',
  },
  'sharpe-vs-sortino-vs-calmar': {
    title: 'Sharpe vs Sortino vs Calmar',
    what: 'Three risk-adjusted return metrics, three different things they measure.',
  },
  'var-vs-cvar-vs-max-drawdown': {
    title: 'VaR vs CVaR vs Max Drawdown',
    what: 'Three downside metrics that answer fundamentally different questions.',
  },
} as const;

const WRITING_TITLES = {
  'vercel-ai-sdk-quant-tools': {
    title: 'Add this to your Vercel AI SDK agent',
    what: 'Tutorial: wire 15 deterministic quant tools into a Vercel AI SDK agent in 5 minutes.',
  },
  'agentkit-reliable-quant-finance-math': {
    title: 'Add this to your Coinbase AgentKit agent',
    what: 'Tutorial: wire grounded quant math into AgentKit in 10 minutes — Base + Solana.',
  },
  'chaining-x402-paid-tool-calls': {
    title: 'Chain paid tool calls in an agent loop',
    what: 'Multi-step demo: risk audit → hedge recommendation, settled in USDC via x402.',
  },
  'agent-framework-comparison-2026': {
    title: "Choosing an agent framework — the comparison",
    what: 'AgentKit vs GOAT vs Vercel AI SDK vs LangChain vs elizaOS, with decision tables and migration paths.',
  },
} as const;

function mkCompare(slug: keyof typeof COMPARE_TITLES) {
  return { slug, ...COMPARE_TITLES[slug] };
}

function mkWriting(slug: keyof typeof WRITING_TITLES) {
  return { slug, ...WRITING_TITLES[slug] };
}

export const CROSS_LINKS: Record<string, CalculatorCrossLinks> = {
  'black-scholes-calculator': {
    compare: [
      mkCompare('black-scholes-vs-binomial'),
      mkCompare('black-scholes-vs-monte-carlo'),
      mkCompare('implied-vol-vs-historical-vol-vs-realized-vol'),
    ],
    writing: [
      mkWriting('vercel-ai-sdk-quant-tools'),
      mkWriting('agentkit-reliable-quant-finance-math'),
      mkWriting('agent-framework-comparison-2026'),
    ],
  },
  'american-option-calculator': {
    compare: [
      mkCompare('american-vs-european-vs-bermudan-options'),
      mkCompare('black-scholes-vs-binomial'),
    ],
    writing: [mkWriting('vercel-ai-sdk-quant-tools')],
  },
  'monte-carlo-simulation-calculator': {
    compare: [mkCompare('black-scholes-vs-monte-carlo')],
    writing: [
      mkWriting('vercel-ai-sdk-quant-tools'),
      mkWriting('agentkit-reliable-quant-finance-math'),
      mkWriting('agent-framework-comparison-2026'),
    ],
  },
  'implied-volatility-calculator': {
    compare: [mkCompare('implied-vol-vs-historical-vol-vs-realized-vol')],
    writing: [mkWriting('vercel-ai-sdk-quant-tools')],
  },
  'kelly-criterion-calculator': {
    compare: [mkCompare('kelly-vs-fixed-fractional-vs-optimal-f')],
    writing: [
      mkWriting('vercel-ai-sdk-quant-tools'),
      mkWriting('agentkit-reliable-quant-finance-math'),
    ],
  },
  'position-size-calculator': {
    compare: [mkCompare('kelly-vs-fixed-fractional-vs-optimal-f')],
    writing: [mkWriting('agentkit-reliable-quant-finance-math')],
  },
  'value-at-risk-calculator': {
    compare: [mkCompare('var-vs-cvar-vs-max-drawdown')],
    writing: [
      mkWriting('agentkit-reliable-quant-finance-math'),
      mkWriting('chaining-x402-paid-tool-calls'),
    ],
  },
  'drawdown-calculator': {
    compare: [mkCompare('var-vs-cvar-vs-max-drawdown')],
    writing: [],
  },
  'hurst-exponent-calculator': {
    compare: [mkCompare('hurst-vs-autocorrelation-vs-variance-ratio')],
    writing: [],
  },
  'probabilistic-sharpe-ratio-calculator': {
    compare: [
      mkCompare('sharpe-vs-sortino-vs-calmar'),
      mkCompare('sharpe-vs-information-ratio-vs-treynor'),
    ],
    writing: [],
  },
  'sharpe-ratio-calculator': {
    compare: [
      mkCompare('sharpe-vs-sortino-vs-calmar'),
      mkCompare('sharpe-vs-information-ratio-vs-treynor'),
    ],
    writing: [mkWriting('agentkit-reliable-quant-finance-math')],
  },
  'cagr-calculator': {
    compare: [mkCompare('geometric-vs-arithmetic-vs-time-weighted-returns')],
    writing: [],
  },
  'options-profit-calculator': {
    compare: [],
    writing: [mkWriting('vercel-ai-sdk-quant-tools')],
  },
  'crypto-liquidation-calculator': {
    compare: [],
    writing: [mkWriting('vercel-ai-sdk-quant-tools')],
  },
  'impermanent-loss-calculator': {
    compare: [],
    writing: [mkWriting('vercel-ai-sdk-quant-tools')],
  },
};

export function getCrossLinks(slug: string): CalculatorCrossLinks {
  return CROSS_LINKS[slug] ?? { compare: [], writing: [] };
}
