/**
 * Cross-link graph for the native `/writing/*` tutorials.
 *
 * Why this exists (audit 2026-05-20): the /writing tutorials are the agentic
 * conversion funnel — a developer reads a tutorial, then installs an npm
 * package and points their agent at the API. But the tutorials were poorly
 * interconnected: the flagship `agent-framework-comparison-2026` (528 lines)
 * linked to ZERO calculators and ZERO sibling content, and sibling-tutorial
 * links were thin and inconsistent across the set.
 *
 * This module + the WritingRelated component give every tutorial a uniform
 * footer: sibling tutorials (keep the developer in the cluster) + the most
 * relevant calculators (route them to the live tools the tutorial wires up).
 *
 * Only native on-site tutorials belong here. dev.to-syndicated pieces are
 * external and listed separately in app/writing/page.tsx.
 *
 * Adding a tutorial: add it to WRITING_TUTORIALS, then add a RELATED entry.
 */

export interface WritingTutorial {
  slug: string;
  title: string;
  blurb: string;
}

/** Every native /writing tutorial. Keep in sync with app/writing/ + sitemap.ts. */
export const WRITING_TUTORIALS: WritingTutorial[] = [
  {
    slug: 'agent-framework-comparison-2026',
    title: 'Which agent framework for quant tools?',
    blurb:
      'AgentKit vs GOAT vs Vercel AI SDK vs LangChain vs elizaOS — decision tables, real code in each, and the migration paths between them.',
  },
  {
    slug: 'vercel-ai-sdk-quant-tools',
    title: 'Quant tools for your Vercel AI SDK agent in 5 minutes',
    blurb:
      'Wire 15 deterministic quant tools into a Vercel AI SDK agent with one import — Black-Scholes, Kelly, Monte Carlo, VaR, and more.',
  },
  {
    slug: 'agentkit-reliable-quant-finance-math',
    title: 'Reliable quant math for your Coinbase AgentKit agent',
    blurb:
      'Wire deterministic quant tools into a Coinbase AgentKit agent in under 10 minutes — free tier plus paid composites via x402, Base + Solana.',
  },
  {
    slug: 'chaining-x402-paid-tool-calls',
    title: 'Chaining x402 paid tool calls in an agent loop',
    blurb:
      'A working risk-audit → hedge-recommend demo on Base mainnet. The system-prompt pattern that makes multi-step paid tool calls reliable.',
  },
  {
    slug: 'quant-tools-mcp-server',
    title: 'Add 73 quant tools to your AI agent in 60 seconds with MCP',
    blurb:
      'Wire 63 deterministic calculators + 10 composite workflows into Claude Desktop, Cursor, or any MCP-capable agent in one config line. Free tier + x402 paid composites.',
  },
  {
    slug: 'anatomy-of-a-paying-quant-agent',
    title: 'Anatomy of a paying quant agent — 8 x402 tool calls, 75 minutes, $0.285 USDC',
    blurb:
      "A real wallet ran 8 chained paid composites through QuantOracle on Base mainnet in 75 minutes for $0.285 USDC. The exact sequence, the on-chain proof, and how to build one.",
  },
  {
    slug: 'batch-quant-api-calls',
    title: 'Batch API calls for speed: price a whole option chain in one request',
    blurb:
      'The /v1/batch endpoint bundles up to 100 computations into one HTTP round-trip. A real run: 20 Black-Scholes calls, 7,182 ms → 1,426 ms (5× faster). Batch is paid — you pay for the speed.',
  },
  {
    slug: 'sui-talus-quant-agent',
    title: 'Add reliable quant math to your Sui / Talus agent',
    blurb:
      'Wire deterministic quant tools into a Sui AI agent (Talus/Nexus, Sui AI Agent Kit, or any MCP host) — two routes: zero-code MCP, or a portable TypeScript tool-pack. Free tier, no API key.',
  },
  {
    slug: 'live-crypto-data-for-agents',
    title: 'Live crypto volatility & funding for your agent, in one call',
    blurb:
      'QuantOracle Live: give your agent fresh realized volatility + perp funding rates with one API call — we fetch the market data and run the math. 100 free/day, then pay-per-call via x402.',
  },
  {
    slug: 'langchain-reliable-quant-finance-math',
    title: 'Reliable quant finance math for your LangChain agent',
    blurb:
      'Wire 73 deterministic quant tools into any LangChain agent with one import — options pricing, Greeks, risk metrics, Monte Carlo, backtests. No hallucinated math. 1,000 free calls/day.',
  },
];

const BY_SLUG: Record<string, WritingTutorial> = Object.fromEntries(
  WRITING_TUTORIALS.map((t) => [t.slug, t]),
);

/** writing-slug → sibling writing-slugs (the rest of the tutorial cluster). */
const RELATED: Record<string, string[]> = {
  'agent-framework-comparison-2026': [
    'anatomy-of-a-paying-quant-agent',
    'quant-tools-mcp-server',
    'vercel-ai-sdk-quant-tools',
    'agentkit-reliable-quant-finance-math',
    'chaining-x402-paid-tool-calls',
  ],
  'vercel-ai-sdk-quant-tools': [
    'anatomy-of-a-paying-quant-agent',
    'quant-tools-mcp-server',
    'agentkit-reliable-quant-finance-math',
    'chaining-x402-paid-tool-calls',
  ],
  'agentkit-reliable-quant-finance-math': [
    'anatomy-of-a-paying-quant-agent',
    'quant-tools-mcp-server',
    'vercel-ai-sdk-quant-tools',
    'chaining-x402-paid-tool-calls',
  ],
  'chaining-x402-paid-tool-calls': [
    'batch-quant-api-calls',
    'anatomy-of-a-paying-quant-agent',
    'quant-tools-mcp-server',
    'agent-framework-comparison-2026',
    'agentkit-reliable-quant-finance-math',
  ],
  'quant-tools-mcp-server': [
    'anatomy-of-a-paying-quant-agent',
    'batch-quant-api-calls',
    'agent-framework-comparison-2026',
    'vercel-ai-sdk-quant-tools',
    'chaining-x402-paid-tool-calls',
  ],
  'anatomy-of-a-paying-quant-agent': [
    'chaining-x402-paid-tool-calls',
    'quant-tools-mcp-server',
    'agentkit-reliable-quant-finance-math',
    'vercel-ai-sdk-quant-tools',
  ],
  'batch-quant-api-calls': [
    'chaining-x402-paid-tool-calls',
    'quant-tools-mcp-server',
    'vercel-ai-sdk-quant-tools',
    'agent-framework-comparison-2026',
  ],
  'sui-talus-quant-agent': [
    'quant-tools-mcp-server',
    'chaining-x402-paid-tool-calls',
    'batch-quant-api-calls',
    'agent-framework-comparison-2026',
  ],
  'live-crypto-data-for-agents': [
    'batch-quant-api-calls',
    'quant-tools-mcp-server',
    'chaining-x402-paid-tool-calls',
    'anatomy-of-a-paying-quant-agent',
  ],
  'langchain-reliable-quant-finance-math': [
    'vercel-ai-sdk-quant-tools',
    'quant-tools-mcp-server',
    'agent-framework-comparison-2026',
    'agentkit-reliable-quant-finance-math',
  ],
};

/**
 * writing-slug → calculator slugs the tutorial's tools map onto. Gives the
 * developer a path to the live calculators (and routes internal authority
 * toward the high-value calculator pages).
 */
const RELATED_CALCULATORS: Record<string, string[]> = {
  'agent-framework-comparison-2026': [
    'black-scholes-calculator',
    'monte-carlo-simulation-calculator',
    'kelly-criterion-calculator',
  ],
  'vercel-ai-sdk-quant-tools': [
    'black-scholes-calculator',
    'monte-carlo-simulation-calculator',
    'value-at-risk-calculator',
  ],
  'agentkit-reliable-quant-finance-math': [
    'black-scholes-calculator',
    'kelly-criterion-calculator',
    'monte-carlo-simulation-calculator',
  ],
  'chaining-x402-paid-tool-calls': [
    'value-at-risk-calculator',
    'monte-carlo-simulation-calculator',
    'drawdown-calculator',
  ],
  'quant-tools-mcp-server': [
    'black-scholes-calculator',
    'kelly-criterion-calculator',
    'monte-carlo-simulation-calculator',
  ],
  'anatomy-of-a-paying-quant-agent': [
    'value-at-risk-calculator',
    'sharpe-ratio-calculator',
    'kelly-criterion-calculator',
  ],
  'batch-quant-api-calls': [
    'black-scholes-calculator',
    'value-at-risk-calculator',
    'monte-carlo-simulation-calculator',
  ],
  'sui-talus-quant-agent': [
    'crypto-liquidation-calculator',
    'impermanent-loss-calculator',
    'value-at-risk-calculator',
  ],
  'live-crypto-data-for-agents': [
    'crypto-liquidation-calculator',
    'impermanent-loss-calculator',
    'monte-carlo-simulation-calculator',
  ],
  'langchain-reliable-quant-finance-math': [
    'black-scholes-calculator',
    'kelly-criterion-calculator',
    'value-at-risk-calculator',
  ],
};

/** Sibling tutorials for a writing slug (full objects; unknown slugs skipped). */
export function getRelatedTutorials(slug: string): WritingTutorial[] {
  return (RELATED[slug] ?? [])
    .map((s) => BY_SLUG[s])
    .filter((t): t is WritingTutorial => t !== undefined);
}

/** Calculator slugs a writing tutorial should point at. */
export function getRelatedCalculators(slug: string): string[] {
  return RELATED_CALCULATORS[slug] ?? [];
}
