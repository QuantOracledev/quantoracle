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
      'LLMs computing Black-Scholes in-context drift 5-30% on the Greeks and the agent can\'t tell. Here\'s how to wire grounded quant tools into a LangChain agent with pip install langchain-quantoracle — covers Kelly, Monte Carlo, Sharpe, and the rest.',
    url: 'https://dev.to/quantoracle/how-to-give-your-langchain-agent-reliable-quant-finance-math-in-10-minutes-5fki',
    publishedAt: '2026-04-20',
    tags: ['langchain', 'python', 'ai', 'finance'],
    venue: 'dev.to',
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

      <section className="mt-12 pt-8 border-t border-ink-700/40">
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
