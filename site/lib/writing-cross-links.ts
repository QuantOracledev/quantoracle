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
    'anatomy-of-a-paying-quant-agent',
    'quant-tools-mcp-server',
    'agent-framework-comparison-2026',
    'agentkit-reliable-quant-finance-math',
  ],
  'quant-tools-mcp-server': [
    'anatomy-of-a-paying-quant-agent',
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
