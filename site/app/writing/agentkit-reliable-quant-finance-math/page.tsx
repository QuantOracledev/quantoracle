import Link from 'next/link';
import { AffiliateCta } from '@/components/AffiliateCta';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/writing/agentkit-reliable-quant-finance-math',
  title: 'How to Give Your Coinbase AgentKit Agent Reliable Quant Finance Math (10 Minutes)',
  description:
    'LLMs computing Black-Scholes in-context drift 5-30% on the Greeks. Here\'s how to wire grounded quant tools — Black-Scholes, Kelly, Monte Carlo, full risk audit, hedge recommendations — into a Coinbase AgentKit agent in 10 minutes. Free tier + x402 paid composites.',
  keywords: [
    'coinbase agentkit tutorial',
    'agentkit action provider',
    'agentkit quant finance',
    'agentkit black scholes',
    'agentkit x402 micropayments',
    'agentkit langchain integration',
  ],
});

const LAST_UPDATED = 'May 14, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Give Your Coinbase AgentKit Agent Reliable Quant Finance Math (10 Minutes)',
  description:
    'Wire grounded quant tools (Black-Scholes, Kelly, Monte Carlo, risk audit, hedge recommendations) into a Coinbase AgentKit agent in 10 minutes. Free tier + x402 paid composites. Works on Base AND Solana.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-05-14',
  dateModified: '2026-05-14',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/writing/agentkit-reliable-quant-finance-math',
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'QuantOracle', item: 'https://quantoracle.dev' },
    { '@type': 'ListItem', position: 2, name: 'Writing', item: 'https://quantoracle.dev/writing' },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'AgentKit Quant Finance Math',
      item: 'https://quantoracle.dev/writing/agentkit-reliable-quant-finance-math',
    },
  ],
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> /{' '}
        <Link href="/writing" className="hover:text-accent">Writing</Link>{' '}
        / AgentKit Quant Finance Math
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          How to Give Your Coinbase AgentKit Agent Reliable Quant Finance Math (in 10 Minutes)
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          LLMs trying to compute Black-Scholes prices in-context are wrong by 5-30% depending on
          moneyness. Kelly fractions get flipped. Sharpe ratios get the annualization wrong. The
          agent can&apos;t tell. That&apos;s a fixable problem when the agent has access to
          grounded tools.
        </p>
        <p className="mt-3 text-xs text-slate-500">Published {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft">
        <p>
          Let me show you how to wire 5 deterministic quant finance actions into a Coinbase
          AgentKit agent in under 10 minutes — Black-Scholes pricing, Kelly Criterion, Monte
          Carlo, and two paid composites that settle automatically via x402.
        </p>

        <h2>What we&apos;re building</h2>
        <p>By the end of this you&apos;ll have an AgentKit agent that handles prompts like:</p>
        <ul>
          <li><em>&quot;Price a 30-day NVDA call with strike $185, spot $180, 28% IV&quot;</em> → returns exact BS price + all Greeks</li>
          <li><em>&quot;I have 55% win rate, $150 avg win, $100 avg loss — what&apos;s my Kelly?&quot;</em> → returns full / half / quarter Kelly fractions</li>
          <li><em>&quot;Audit risk on these 252 daily returns: [...]&quot;</em> → returns Sharpe, Sortino, Calmar, max DD, VaR, CVaR, Kelly, Hurst (paid: $0.04 USDC)</li>
          <li><em>&quot;Recommend hedges for my $100K long NVDA position over 30 days&quot;</em> → returns ranked hedge structures (paid: $0.04 USDC)</li>
        </ul>
        <p>
          The free actions cover most use cases. Paid composites pay themselves via the AgentKit
          wallet — no API key, no signup, no billing setup.
        </p>

        <h2>Why this matters</h2>
        <p>There are three failure modes when LLMs do financial math in-context:</p>
        <ol>
          <li><strong>Black-Scholes drift.</strong> GPT-4o&apos;s Greeks are wrong by 5-30% depending on moneyness. The model doesn&apos;t flag the uncertainty.</li>
          <li><strong>Compound interest skips steps.</strong> A 30-year projection at 8% loses meaningful precision over the token sequence.</li>
          <li><strong>Kelly and VaR get mis-applied.</strong> LLMs often confuse arithmetic vs geometric returns, or fail to annualize correctly.</li>
        </ol>
        <p>
          Grounded tools fix all three. The QuantOracle API is byte-exact against textbook
          implementations (Hull, Lopez de Prado, Kelly, Parkinson) and verified by 120 accuracy
          benchmarks. Same inputs → same outputs, every time. The agent can cite the specific
          tool call as the source for any number it presents.
        </p>

        <h2>Setup</h2>

        <h3>1. Spin up a fresh AgentKit project</h3>
        <pre><code className="language-bash">{`npx create-onchain-agent
cd your-agent-name`}</code></pre>
        <p>
          This gives you the standard AgentKit template with CDP wallet provisioning + LangChain
          ReAct loop wired in.
        </p>

        <h3>2. Drop the QuantOracle action provider into your project</h3>
        <pre><code className="language-bash">{`mkdir -p src/quantoracle
curl -sL https://raw.githubusercontent.com/QuantOracledev/quantoracle/main/integrations/agentkit/quantoracleActionProvider.ts -o src/quantoracle/quantoracleActionProvider.ts
curl -sL https://raw.githubusercontent.com/QuantOracledev/quantoracle/main/integrations/agentkit/schemas.ts -o src/quantoracle/schemas.ts
curl -sL https://raw.githubusercontent.com/QuantOracledev/quantoracle/main/integrations/agentkit/constants.ts -o src/quantoracle/constants.ts
curl -sL https://raw.githubusercontent.com/QuantOracledev/quantoracle/main/integrations/agentkit/index.ts -o src/quantoracle/index.ts`}</code></pre>
        <p>
          Four files, ~800 lines total. No new npm dependencies — the provider uses{' '}
          <code>zod</code> and the AgentKit core, both already in the template.
        </p>

        <h3>3. Wire the provider into your agent</h3>
        <p>Edit <code>src/index.ts</code> (or wherever your AgentKit setup lives):</p>
        <pre><code className="language-typescript">{`import { AgentKit, CdpEvmWalletProvider } from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { quantoracleActionProvider } from "./quantoracle";

const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
  apiKeyId: process.env.CDP_API_KEY_ID!,
  apiKeySecret: process.env.CDP_API_KEY_SECRET!,
  networkId: "base-mainnet",
});

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [quantoracleActionProvider()],   // <-- just add this
});

const tools = await getLangChainTools(agentkit);
const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });
const agent = createReactAgent({
  llm,
  tools,
  checkpointSaver: new MemorySaver(),
  messageModifier: \`You are a financial analyst agent with access to deterministic
quant finance tools via QuantOracle. ALWAYS use the tools for any financial math —
never compute Black-Scholes prices, Kelly fractions, Sharpe ratios, or Monte Carlo
simulations in-context. Your computations would drift; the tools are exact.\`,
});`}</code></pre>
        <p>
          That&apos;s the whole integration. The agent now has 5 new tools and the LLM will pick
          the right one based on the Zod schemas&apos; <code>.describe()</code> annotations.
        </p>

        <h3>4. Try it</h3>
        <pre><code className="language-typescript">{`const response = await agent.invoke({
  messages: [{ role: "user", content: "Price a 1-year ATM call on a $100 stock at 20% vol, 5% rate" }],
});
console.log(response.messages.at(-1).content);`}</code></pre>
        <p>Expected output (paraphrased):</p>
        <blockquote>
          Using the Black-Scholes pricing tool: for a 1-year European call with spot $100, strike
          $100, risk-free rate 5%, and volatility 20%, the price is <strong>$10.45</strong> with
          delta 0.637, gamma 0.019, vega 0.375, theta -0.018, rho 0.532. The model is using the
          standard Black-Scholes-Merton assumptions (log-normal returns, constant volatility, no
          dividends).
        </blockquote>
        <p>
          The price is bytes-exact against the analytical formula. The Greeks are similarly
          exact. No drift, no hallucination. Verify it yourself via the{' '}
          <Link href="/black-scholes-calculator" className="text-accent">
            Black-Scholes Calculator
          </Link>{' '}
          on this site.
        </p>

        <h2>How the paid composites work</h2>
        <p>
          <code>assess_portfolio_risk</code> and <code>recommend_hedge</code> are two endpoints
          that wrap 5-15 calculator calls into a single response. They cost $0.04 USDC each,
          settled on-chain via x402 on Base mainnet.
        </p>
        <p>
          <strong>Your AgentKit wallet pays automatically.</strong> You don&apos;t write any
          payment code. When the LLM picks one of these tools, the action provider:
        </p>
        <ol>
          <li>POSTs to the endpoint with <code>Accept: application/x-x402-v2</code></li>
          <li>Receives a 402 response with the payment requirement</li>
          <li>Asks AgentKit&apos;s wallet to sign a USDC <code>transferWithAuthorization</code></li>
          <li>POSTs the signed authorization back to the facilitator</li>
          <li>Receives the actual response after settlement (~2 seconds on Base)</li>
        </ol>
        <p>
          The wallet needs ~$0.50 USDC to cover many calls. No API key needed; no signup; no
          billing setup. See <Link href="/pricing" className="text-accent">/pricing</Link> for
          the full price table.
        </p>

        <h2>Bonus: same agent, but on Solana</h2>
        <p>
          If you&apos;re already in the Solana ecosystem (Jupiter, Drift, Marginfi, etc.), you
          don&apos;t need to bridge to Base. The same QuantOracle action provider works with{' '}
          <code>SolanaKeypairWalletProvider</code>:
        </p>
        <pre><code className="language-typescript">{`import { AgentKit, SolanaKeypairWalletProvider } from "@coinbase/agentkit";
import { quantoracleActionProvider } from "./quantoracle";

const walletProvider = await SolanaKeypairWalletProvider.fromBase58PrivateKey(
  process.env.SOLANA_PRIVATE_KEY!,
  "solana-mainnet",
);

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [quantoracleActionProvider()],
});
// ...rest identical`}</code></pre>
        <p>
          x402 settlement on Solana is sub-second (vs ~2s on Base), which makes Solana the better
          fit for high-frequency agent workflows. Same exact API, just routed differently. Real
          settlement evidence: QuantOracle has processed real on-chain x402 transactions on both
          chains.
        </p>

        <h2>What&apos;s actually in those 5 actions</h2>
        <p>For reference — these are the schemas the LLM sees:</p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Cost</th>
                <th className="px-3 py-2">What it does</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-mono text-xs">price_option</td>
                <td className="px-3 py-2 text-chart-gain">Free</td>
                <td className="px-3 py-2">Black-Scholes pricing for European calls/puts with full Greeks</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-mono text-xs">calculate_kelly</td>
                <td className="px-3 py-2 text-chart-gain">Free</td>
                <td className="px-3 py-2">Kelly Criterion: full / half / quarter fractions</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-mono text-xs">simulate_portfolio</td>
                <td className="px-3 py-2 text-chart-gain">Free</td>
                <td className="px-3 py-2">Monte Carlo: GBM paths, terminal distribution, prob of ruin</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-mono text-xs">assess_portfolio_risk</td>
                <td className="px-3 py-2">$0.04 USDC</td>
                <td className="px-3 py-2">Composite audit: Sharpe + Sortino + Calmar + max DD + VaR + CVaR + Kelly + Hurst</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-mono text-xs">recommend_hedge</td>
                <td className="px-3 py-2">$0.04 USDC</td>
                <td className="px-3 py-2">Ranked hedge structures (collar, protective put, partial put, inverse)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The free tier covers 1,000 calls/IP/day, which is enough for most agents. The paid
          composites are designed for agents making consequential financial decisions where
          bundling 5-15 calculator calls behind one tool call simplifies the agent&apos;s
          reasoning.
        </p>

        <h2>Verification</h2>
        <p>
          If you want to confirm the math before trusting it in production, every endpoint is
          verified against published textbook values (Hull&apos;s &quot;Options, Futures and
          Other Derivatives&quot;, Lopez de Prado&apos;s &quot;Advances in Financial Machine
          Learning&quot;, Kelly&apos;s 1956 paper, Parkinson 1980, etc.). The full benchmark
          suite is at{' '}
          <a
            href="https://github.com/QuantOracledev/quantoracle/blob/main/tests/accuracy_benchmarks.py"
            target="_blank"
            rel="noopener"
            className="text-accent"
          >
            tests/accuracy_benchmarks.py
          </a>{' '}
          — 120 tests, all green against the live API.
        </p>
        <p>
          You can also use the 15 free interactive calculators on this site to verify any agent
          output by hand. Same engine, same answers.
        </p>

        <h2>Useful prompts to test with</h2>
        <p>Drop these into your agent&apos;s chat to verify everything works:</p>
        <pre><code>{`"Price a 30-day put on a $180 stock at strike $175, 25% IV, 5% rate"
"My strategy: 55% win rate, $200 avg win, $100 avg loss. What's the optimal position size?"
"Simulate $100K invested at 7% return / 15% vol over 25 years with $1K/mo contributions"
"Audit risk on these monthly returns: [0.02, -0.01, 0.03, 0.01, -0.04, 0.02, 0.05, -0.01, 0.02, 0.03, -0.02, 0.04]"
"I'm long $50K SOL. Recommend the cheapest 30-day hedge to protect against a 10% drop."`}</code></pre>
        <p>
          The first three are free; the last two will trigger an x402 settlement of $0.04 USDC each.
        </p>

        <h2>What&apos;s next</h2>
        <p>If this pattern works for you, the same approach extends to:</p>
        <ul>
          <li>
            <strong>Solana variant</strong> — see the{' '}
            <a
              href="https://github.com/QuantOracledev/quantoracle/blob/main/integrations/agentkit/example-agent-solana.ts"
              target="_blank"
              rel="noopener"
              className="text-accent"
            >
              example-agent-solana.ts
            </a>{' '}
            in the repo to run on Solana mainnet instead.
          </li>
          <li>
            <strong>Chained workflows</strong> — <code>assess_portfolio_risk</code> then{' '}
            <code>recommend_hedge</code> is a natural pair. See the{' '}
            <Link
              href="/writing/chaining-x402-paid-tool-calls"
              className="text-accent"
            >
              chained x402 workflow tutorial
            </Link>{' '}
            for the full multi-call pattern.
          </li>
          <li>
            <strong>LangChain Python</strong> — if you&apos;re on Python instead of TS,{' '}
            <code>pip install langchain-quantoracle</code> gets you all 73 endpoints.{' '}
            <a
              href="https://dev.to/quantoracle/how-to-give-your-langchain-agent-reliable-quant-finance-math-in-10-minutes-5fki"
              target="_blank"
              rel="noopener"
              className="text-accent"
            >
              See the LangChain tutorial on dev.to.
            </a>
          </li>
        </ul>
        <p>
          The repo is at{' '}
          <a
            href="https://github.com/QuantOracledev/quantoracle"
            target="_blank"
            rel="noopener"
            className="text-accent"
          >
            github.com/QuantOracledev/quantoracle
          </a>
          . The upstream PR to coinbase/agentkit is{' '}
          <a href="https://github.com/coinbase/agentkit/pull/1179" target="_blank" rel="noopener" className="text-accent">
            #1179
          </a>{' '}
          if you&apos;d rather wait for it to merge before integrating.
        </p>

        <h2>Related</h2>
        <ul>
          <li>
            <Link href="/compare/sharpe-vs-sortino-vs-calmar" className="text-accent">
              Sharpe vs Sortino vs Calmar
            </Link>{' '}
            — the risk metrics inside <code>assess_portfolio_risk</code>
          </li>
          <li>
            <Link href="/compare/kelly-vs-fixed-fractional-vs-optimal-f" className="text-accent">
              Kelly vs Fixed Fractional vs Optimal-f
            </Link>{' '}
            — what <code>calculate_kelly</code> actually does
          </li>
          <li>
            <Link href="/compare/var-vs-cvar-vs-max-drawdown" className="text-accent">
              VaR vs CVaR vs Max Drawdown
            </Link>{' '}
            — three downside metrics the composite audits return
          </li>
          <li>
            <Link href="/pricing" className="text-accent">
              Pricing
            </Link>{' '}
            — full breakdown of free tier + x402 paid composites
          </li>
        </ul>
      </article>

      <div className="mt-12">
        <AffiliateCta subId="writing-agentkit-tutorial" category="compare" />
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [articleJsonLd, breadcrumbJsonLd],
          }),
        }}
      />
    </div>
  );
}
