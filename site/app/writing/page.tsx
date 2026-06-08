import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/writing',
  title: 'Writing — Tutorials and Explainers on Quant + Agent APIs',
  description:
    'Long-form tutorials and explainers on building AI agents with quant finance APIs — covering LangChain, Coinbase AgentKit, x402 payments, and integration patterns. Published on dev.to.',
  keywords: [
    'quantoracle writing',
    'agentkit tutorial',
    'langchain quant tutorial',
    'x402 tutorial',
    'agent api tutorials',
  ],
});

interface Article {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  tags: string[];
  venue: 'dev.to' | 'site';
}

/**
 * Published articles. Add new entries at the top. The /writing hub gets
 * indexed by Google and provides a discoverability anchor for everything
 * we publish — visitors who land on a calculator page can jump to long-form,
 * and vice versa.
 *
 * `venue: 'site'` = native article on quantoracle.dev (internal link).
 * `venue: 'dev.to'` = external publication (opens in new tab).
 */
const ARTICLES: Article[] = [
  {
    title: 'Live crypto volatility & funding for your agent, in one call',
    description:
      'QuantOracle Live: give your agent fresh crypto realized volatility and perpetual funding rates with one API call. We fetch the live market data and run the math — no exchange integrations, rate limits, or geo-blocks to manage. 3 free calls/IP/day, then pay-per-call via x402.',
    url: '/writing/live-crypto-data-for-agents',
    publishedAt: '2026-06-07',
    tags: ['live-data', 'crypto', 'ai-agent', 'x402', 'volatility'],
    venue: 'site',
  },
  {
    title: 'Add reliable quant math to your Sui / Talus agent',
    description:
      'Wire deterministic quant-finance tools — Black-Scholes, liquidation price, impermanent loss, Monte Carlo, full risk analysis — into a Sui AI agent (Talus/Nexus, Sui AI Agent Kit, or any MCP host). Two routes: zero-code MCP, or a portable TypeScript tool-pack. Free tier, no API key.',
    url: '/writing/sui-talus-quant-agent',
    publishedAt: '2026-06-05',
    tags: ['sui', 'talus', 'ai-agent', 'mcp', 'defi'],
    venue: 'site',
  },
  {
    title: 'Batch API calls for speed: price a whole option chain in one request',
    description:
      'The /v1/batch endpoint bundles up to 100 quant computations into a single HTTP round-trip. A real benchmark: 20 Black-Scholes calls dropped from 7,182 ms sequential to 1,426 ms batched — 5× faster. Batch is a paid endpoint (sum of sub-request prices via x402) — you pay for the speed, not a discount. Request shape, response shape, pricing, gotchas, and the single-tool agent pattern.',
    url: '/writing/batch-quant-api-calls',
    publishedAt: '2026-06-02',
    tags: ['batch', 'performance', 'api', 'option-chain', 'ai-agent'],
    venue: 'site',
  },
  {
    title:
      'Anatomy of a paying quant agent — 8 x402 tool calls, 75 minutes, $0.285 USDC on Base mainnet',
    description:
      "Case study: on 2026-05-29 a single wallet ran 8 chained x402 paid tool calls through the QuantOracle API in 75 minutes for $0.285 USDC. All 8 transactions are settled on Base and verifiable on-chain. The exact sequence, what each step does, the pauses that tell a story, and how to build an agent that runs the same loop.",
    url: '/writing/anatomy-of-a-paying-quant-agent',
    publishedAt: '2026-05-29',
    tags: ['x402', 'case-study', 'base-mainnet', 'agent-loop', 'on-chain'],
    venue: 'site',
  },
  {
    title: 'Add 73 quant tools to your AI agent in 60 seconds with MCP',
    description:
      'Wire 63 deterministic quant calculators plus 10 composite workflows into Claude Desktop, Cursor, or any MCP-capable agent in one config line. Free tier handles most use cases; paid composites settle via x402 USDC on Base or Solana.',
    url: '/writing/quant-tools-mcp-server',
    publishedAt: '2026-05-28',
    tags: ['mcp', 'claude-desktop', 'cursor', 'tutorial', 'ai-agent'],
    venue: 'site',
  },
  {
    title:
      'AgentKit vs GOAT vs Vercel AI SDK vs LangChain vs elizaOS: which agent framework for quant tools?',
    description:
      'Five agent frameworks, one quant API, real code in each. The honest comparison with decision tables, code samples, performance numbers, and the migration paths between them.',
    url: '/writing/agent-framework-comparison-2026',
    publishedAt: '2026-05-15',
    tags: ['agentkit', 'langchain', 'vercel', 'goat', 'eliza', 'comparison'],
    venue: 'site',
  },
  {
    title: 'Add reliable quant finance math to your Vercel AI SDK agent in 5 minutes',
    description:
      'Wire 15 deterministic quant tools — Black-Scholes, Kelly, Monte Carlo, VaR, Sharpe, impermanent loss, liquidation price — into a Vercel AI SDK agent with a single import. Free tier for most tools, x402 USDC for paid composites. Works with generateText, streamText, and useChat.',
    url: '/writing/vercel-ai-sdk-quant-tools',
    publishedAt: '2026-05-14',
    tags: ['vercel', 'ai-sdk', 'typescript', 'tutorial'],
    venue: 'site',
  },
  {
    title: 'How to give your Coinbase AgentKit agent reliable quant finance math (in 10 minutes)',
    description:
      'Wire 5 deterministic quant tools — Black-Scholes, Kelly, Monte Carlo, plus 2 paid composites via x402 — into a Coinbase AgentKit agent in under 10 minutes. Free tier + Solana variant included.',
    url: '/writing/agentkit-reliable-quant-finance-math',
    publishedAt: '2026-05-14',
    tags: ['agentkit', 'typescript', 'ai', 'coinbase'],
    venue: 'site',
  },
  {
    title: 'Chaining x402 paid tool calls — a working risk-audit → hedge-recommend demo on Base mainnet',
    description:
      'Most x402 demos show one call, one response. The interesting case — and what actually pays for itself — is chaining multiple paid calls in one agent loop. Working code, transcript, and the system-prompt pattern that makes it reliable.',
    url: '/writing/chaining-x402-paid-tool-calls',
    publishedAt: '2026-05-14',
    tags: ['web3', 'ai', 'tutorial', 'typescript'],
    venue: 'site',
  },
  {
    title: 'AgentKit vs LangChain vs Direct HTTP: picking the right integration for paid agent APIs',
    description:
      'I built the same agent three ways using a real x402 API. Same question, same answer, three different integration patterns. The honest comparison with code samples and a decision table.',
    url: 'https://dev.to/quantoracle/agentkit-vs-langchain-vs-direct-http-picking-the-right-integration-for-paid-agent-apis-2582',
    publishedAt: '2026-05-14',
    tags: ['agentkit', 'langchain', 'ai', 'webdev'],
    venue: 'dev.to',
  },
  {
    title: 'How to give your LangChain agent reliable quant finance math (in 10 minutes)',
    description:
      'LLMs computing Black-Scholes in-context drift 5-30% on the Greeks and the agent can\'t tell. Wire 73 grounded, deterministic quant tools into a LangChain agent with one import (pip install langchain-quantoracle) — options pricing, Greeks, risk metrics, Monte Carlo, backtests.',
    url: '/writing/langchain-reliable-quant-finance-math',
    publishedAt: '2026-04-20',
    tags: ['langchain', 'python', 'ai', 'finance'],
    venue: 'site',
  },
];

export default function WritingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>{' '}
        / Writing
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Writing</h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          Long-form tutorials and explainers on building AI agents with quant finance APIs.
          Coverage of LangChain, Coinbase AgentKit, x402 payments, MCP, and the integration
          patterns we&apos;ve found useful in practice. Some pieces live here on the site for
          full SEO control; others are syndicated to dev.to where they reach the agent-builder
          audience directly.
        </p>
      </header>

      <div className="space-y-4">
        {ARTICLES.map((a) => {
          const isExternal = a.venue !== 'site';
          const titleEl = (
            <h2 className="text-lg font-semibold text-slate-100 mb-2">
              {isExternal ? (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener"
                  className="hover:text-accent transition"
                >
                  {a.title} ↗
                </a>
              ) : (
                <Link href={a.url} className="hover:text-accent transition">
                  {a.title} →
                </Link>
              )}
            </h2>
          );
          return (
            <article
              key={a.url}
              className="rounded-lg border border-ink-700/60 p-5 hover:border-accent/40 transition"
            >
              <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
                <time className="text-xs text-slate-500">{a.publishedAt}</time>
                <span className={`text-[10px] uppercase tracking-wider rounded px-2 py-0.5 border ${
                  a.venue === 'site'
                    ? 'text-accent border-accent/30 bg-accent/5'
                    : 'text-slate-500 border-ink-700'
                }`}>
                  {a.venue === 'site' ? 'on site' : a.venue}
                </span>
              </div>
              {titleEl}
              <p className="text-sm text-slate-300 mb-3 leading-relaxed">{a.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {a.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] uppercase tracking-wider bg-ink-800/60 border border-ink-700/40 rounded px-2 py-0.5 text-slate-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {/* Build CTA — the /writing audience is developers evaluating whether to
          build with QuantOracle. The aligned conversion is the API/pricing
          funnel (agentic revenue), not a chart-platform affiliate. */}
      <section className="mt-12 rounded-lg border border-accent/30 bg-accent/[0.04] p-6">
        <h2 className="text-xl font-semibold mb-2">Ready to build?</h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-4 max-w-2xl">
          Every tutorial here runs on the same deterministic API — 73 endpoints, 1,000 free
          calls per day with no signup, and paid composite workflows (full risk audit, hedge
          recommendations, strategy optimization) from $0.015 USDC settled automatically via
          x402 on Base or Solana. No API keys, no billing setup.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/pricing" className="btn-primary">
            See pricing
          </Link>
          <Link href="/api-docs" className="btn-ghost">
            API docs →
          </Link>
        </div>
      </section>

      <section className="mt-8 pt-8 border-t border-ink-700/40">
        <h2 className="text-lg font-semibold mb-2">Follow for new posts</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          <a
            href="https://dev.to/quantoracle"
            target="_blank"
            rel="noopener"
            className="text-accent hover:underline"
          >
            Follow @quantoracle on dev.to
          </a>
          {' '}for new tutorials and integration patterns. You can also subscribe to the{' '}
          <Link href="/rss.xml" className="text-accent hover:underline">
            QuantOracle RSS feed
          </Link>{' '}
          for the head-to-head explainer series under{' '}
          <Link href="/compare" className="text-accent hover:underline">
            /compare
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
