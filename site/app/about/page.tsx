import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/about',
  title: 'About QuantOracle',
  description:
    'QuantOracle is a free toolkit of 15 quant finance calculators + 73 deterministic API endpoints for AI agents. Built because LLMs hallucinating math is a real problem in finance. Verified against 120 textbook benchmarks.',
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> / About
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">About QuantOracle</h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          QuantOracle is a free toolkit of quant finance calculators and a deterministic API for
          AI agents. Built because LLMs hallucinating math is a real problem in finance, and the
          fix — grounded tools — was missing for the things quant practitioners actually need.
        </p>
      </header>

      <article className="prose-soft space-y-8">
        <section>
          <h2>What this is</h2>
          <p>
            Two surfaces, one engine:
          </p>
          <ul>
            <li>
              <strong>Interactive calculators</strong> at quantoracle.dev — 15 free, no-signup quant
              finance tools covering Black-Scholes pricing, Kelly Criterion, Monte Carlo simulation,
              Sharpe / Sortino / Calmar / VaR / CVaR risk metrics, Hurst exponent, drawdown
              analysis, crypto liquidation, impermanent loss, and more. All client-side input, all
              server-side math.
            </li>
            <li>
              <strong>HTTP API</strong> at api.quantoracle.dev — 73 deterministic endpoints (63
              calculators + 10 paid composites). Free tier 1,000 calls/IP/day, no API key. Paid
              composites via x402 micropayments on Base or Solana. Same math powers both surfaces.
            </li>
          </ul>
        </section>

        <section>
          <h2>Why this exists</h2>
          <p>
            Three observations motivated the project:
          </p>
          <ol>
            <li>
              <strong>LLMs do quant finance math wrong.</strong> GPT-4o&apos;s Black-Scholes Greeks
              drift 5-30% depending on moneyness. Kelly fractions get flipped. Sharpe annualization
              gets confused with arithmetic averaging. The agent can&apos;t tell. For consequential
              financial decisions, this is unacceptable.
            </li>
            <li>
              <strong>Existing tools weren&apos;t agent-shaped.</strong> Most quant calculators are
              websites for humans or libraries for Python notebooks. Few are wired up as deterministic
              tool-call surfaces that agents can pick up via LangChain / AgentKit / MCP. Almost none
              support x402 micropayments for paid composites.
            </li>
            <li>
              <strong>Verification was missing.</strong> A &quot;quant API&quot; that hasn&apos;t
              been tested against textbook values is just code. QuantOracle ships with{' '}
              <a href="https://github.com/QuantOracledev/quantoracle/blob/main/tests/accuracy_benchmarks.py" target="_blank" rel="noopener" className="text-accent">
                120 accuracy benchmarks
              </a>
              {' '}verifying every endpoint against published reference values (Hull, Lopez de Prado,
              Kelly 1956, Parkinson 1980, RiskMetrics, etc.). When the math is wrong, the test
              fails.
            </li>
          </ol>
        </section>

        <section>
          <h2>What makes QuantOracle different</h2>
          <p>From a quant practitioner&apos;s perspective:</p>
          <ul>
            <li>
              <strong>Deterministic.</strong> Same inputs → same outputs. Every time. No model
              variability, no temperature sampling, no token drift.
            </li>
            <li>
              <strong>Verified.</strong> Every endpoint is tested against published-textbook values.
              The benchmark suite is public; you can rerun it.
            </li>
            <li>
              <strong>Free for humans, paid for agents at volume.</strong> The free tier covers
              effectively all retail and most agent use. Paid composites exist for agents that need
              bundled multi-step computation. Wallet-native payment, no signup.
            </li>
            <li>
              <strong>Multi-surface.</strong> Same math available via website, REST API, MCP server,
              LangChain Python toolkit, and Coinbase AgentKit action provider. Pick the integration
              that matches your stack.
            </li>
          </ul>
        </section>

        <section>
          <h2>Who maintains this</h2>
          <p>
            QuantOracle is built and maintained by a small independent team of practitioners. We
            keep individual identities private at the project level — the work speaks for itself,
            and the open-source codebase + verification suite means you don&apos;t have to take any
            individual&apos;s word for the math. Verify it yourself; everything is auditable.
          </p>
          <p>
            If you&apos;d like to contact us for a partnership, sponsorship, or enterprise
            inquiry, the channels are at <Link href="/contact" className="text-accent">/contact</Link>.
          </p>
        </section>

        <section>
          <h2>Open source</h2>
          <p>
            The entire QuantOracle stack is open source under the MIT license at{' '}
            <a href="https://github.com/QuantOracledev/quantoracle" target="_blank" rel="noopener" className="text-accent">
              github.com/QuantOracledev/quantoracle
            </a>
            . That includes:
          </p>
          <ul>
            <li>The FastAPI backend implementing all 73 endpoints</li>
            <li>The Next.js frontend rendering the calculator pages</li>
            <li>The 120-test accuracy benchmark suite</li>
            <li>The LangChain Python toolkit (also on PyPI as <code>langchain-quantoracle</code>)</li>
            <li>The MCP server (on npm as <code>quantoracle-mcp</code>)</li>
            <li>The Coinbase AgentKit action provider</li>
            <li>Example agents, integration docs, comparison articles</li>
          </ul>
          <p>
            If you find a bug in the math, the API, or the calculators —{' '}
            <a href="https://github.com/QuantOracledev/quantoracle/issues/new" target="_blank" rel="noopener" className="text-accent">
              file an issue
            </a>
            . Fixes typically ship the same day.
          </p>
        </section>

        <section>
          <h2>What&apos;s on the roadmap</h2>
          <p>Things we&apos;re actively working on or considering:</p>
          <ul>
            <li>More calculators (the highest-traffic quant queries we don&apos;t cover yet)</li>
            <li>More <Link href="/compare" className="text-accent">comparison articles</Link> (1-2 per week)</li>
            <li>More language bindings (currently TypeScript and Python; thinking about Rust)</li>
            <li>A premium tier with bulk discounts on paid composites + priority API access (later in 2026)</li>
            <li>Educational content (videos, deep-dive articles on specific topics)</li>
          </ul>
          <p>
            Specific requests for new calculators or endpoints:{' '}
            <a href="https://github.com/QuantOracledev/quantoracle/issues/new" target="_blank" rel="noopener" className="text-accent">
              open an issue
            </a>
            {' '}with the use case and we&apos;ll evaluate.
          </p>
        </section>

        <section>
          <h2>How to support QuantOracle</h2>
          <p>If you find the toolkit useful:</p>
          <ul>
            <li>
              <strong>Star the GitHub repo.</strong> Star counts factor into discoverability across
              the ecosystem (npm, MCP registries, awesome-lists).
            </li>
            <li>
              <strong>Share the comparison articles.</strong> The{' '}
              <Link href="/compare" className="text-accent">/compare</Link> pieces rank better when
              they get linked from other sites or social posts.
            </li>
            <li>
              <strong>Follow on dev.to.</strong>{' '}
              <a href="https://dev.to/quantoracle" target="_blank" rel="noopener" className="text-accent">
                @quantoracle
              </a>
              {' '}— we publish long-form tutorials and integration patterns there.
            </li>
            <li>
              <strong>Click through the sponsored links</strong> on calculator pages if
              you&apos;re going to sign up for those services anyway. Full disclosure at{' '}
              <Link href="/affiliate-disclosure" className="text-accent">/affiliate-disclosure</Link>.
            </li>
            <li>
              <strong>Tell people.</strong> Word of mouth is how indie projects survive.
            </li>
          </ul>
        </section>
      </article>
    </div>
  );
}
