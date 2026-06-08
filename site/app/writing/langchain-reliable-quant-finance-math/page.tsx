import Link from 'next/link';
import { AffiliateCta } from '@/components/AffiliateCta';
import { WritingRelated } from '@/components/WritingRelated';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/writing/langchain-reliable-quant-finance-math',
  title: 'Reliable Quant Finance Math for Your LangChain Agent (in 10 Minutes)',
  description:
    'LLMs hallucinate on Black-Scholes and the Greeks. Wire 73 deterministic quant-finance tools into any LangChain agent with one import — options pricing, risk metrics, Monte Carlo, backtests. 1,000 free calls/day, no API key.',
  keywords: [
    'langchain quant finance',
    'langchain tools finance',
    'langchain black scholes',
    'langchain agent math',
    'quantoracle langchain',
    'deterministic quant api',
    'langchain options pricing',
  ],
});

const LAST_UPDATED = 'April 20, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Give Your LangChain Agent Reliable Quant Finance Math (in 10 Minutes)',
  description:
    'Wire 73 deterministic quant-finance endpoints into a LangChain agent with one import. Deterministic options pricing, Greeks, risk metrics, Monte Carlo, and backtests — no hallucinated math.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-04-20',
  dateModified: '2026-06-07',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/writing/langchain-reliable-quant-finance-math',
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
      name: 'Reliable Quant Math for LangChain Agents',
      item: 'https://quantoracle.dev/writing/langchain-reliable-quant-finance-math',
    },
  ],
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> /{' '}
        <Link href="/writing" className="hover:text-accent">Writing</Link>{' '}
        / Reliable Quant Math for LangChain Agents
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          How to give your LangChain agent reliable quant finance math (in 10 minutes)
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          LLMs are great at reasoning about finance and noticeably unreliable at <em>doing</em>{' '}
          finance math. Ask one to price an option and the number drifts run-to-run; ask for the
          higher-order Greeks and they come back wrong. The fix is standard engineering: call a
          dedicated calculator. Here&apos;s how to give any LangChain agent 73 deterministic
          quant-finance endpoints with one import.
        </p>
        <p className="mt-3 text-xs text-slate-500">Published {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft">
        <h2>The problem in 30 seconds</h2>
        <pre><code className="language-python">{`# What you hope happens
response = llm.invoke("Price a European call: spot=100, strike=105, 6 months, 20% vol, 5% rate")
# "$4.58" ✓

# What actually happens in production
# - Price may land close, but drifts run-to-run
# - Delta/gamma/vega often reasonable; vanna, charm, speed, color frequently wrong
# - Anything that needs chained reasoning (IV solver, barrier options) degrades further`}</code></pre>
        <p>
          The math is deterministic. The model isn&apos;t. For anything agent-driven — backtests,
          risk management, paper trading, analysis pipelines — you need{' '}
          <strong>same-input-same-output</strong> calculations.
        </p>

        <h2>The fix: QuantOracle</h2>
        <p>
          <Link href="/" className="text-accent">QuantOracle</Link> is a REST API with 63 pure quant
          calculators plus 10 composite workflows (strategy backtests, portfolio rebalance plans,
          options strategy optimizers, hedging recommendations, full risk tearsheets). Every formula
          is citation-verified against Hull, Wilmott, and Bailey &amp; López de Prado.
        </p>
        <ul>
          <li>1,000 free calls/IP/day, no API key</li>
          <li>
            Paid tier uses{' '}
            <a href="https://www.x402.org/" target="_blank" rel="noopener" className="text-accent">
              x402 micropayments
            </a>{' '}
            in USDC on Base or Solana ($0.002–$0.10/call)
          </li>
          <li>Deterministic: same inputs always produce the same outputs</li>
          <li>MCP server, LangChain toolkit, OpenAI GPT, and plain REST all supported</li>
        </ul>

        <h2>Hook it into LangChain in one line</h2>
        <pre><code className="language-bash">{`pip install langchain-quantoracle langchain-openai langchain`}</code></pre>
        <pre><code className="language-python">{`from langchain_quantoracle import QuantOracleToolkit
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate

# Load every QuantOracle tool — all 73 endpoints become LangChain tools
tools = QuantOracleToolkit().get_tools()

llm = ChatOpenAI(model="gpt-4o")
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a quant analyst. Use QuantOracle tools for all financial "
               "math — never compute in-context."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)`}</code></pre>
        <p>
          That&apos;s it. Your agent now has Black-Scholes, 22 portfolio risk metrics, Kelly sizing,
          13 technical indicators, Monte Carlo, strategy backtests, and 60+ others.
        </p>

        <h2>Example 1: price an option with Greeks</h2>
        <pre><code className="language-python">{`result = executor.invoke({
    "input": "Price a European call with spot=100, strike=105, 6 months to expiry, "
             "20% annualized vol, 5% risk-free. I want price, delta, gamma, vega, theta."
})`}</code></pre>
        <p>The agent picks the right tool (<code>options_price</code>), calls it, and returns:</p>
        <pre><code>{`Price: $4.58
Greeks:
  Delta: 0.4612
  Gamma: 0.0281
  Theta: -0.0211 (daily)
  Vega:  0.2808`}</code></pre>
        <p>These are the <em>exact</em> Black-Scholes values. Reproducible across runs.</p>

        <h2>Example 2: full risk analysis from a returns series</h2>
        <pre><code className="language-python">{`result = executor.invoke({
    "input": "Here are daily returns: [0.01, -0.02, 0.03, 0.005, -0.01, 0.02, -0.015, "
             "0.025, 0.01, -0.005, 0.015]. Give me a complete risk breakdown."
})`}</code></pre>
        <p>
          The agent calls the <code>risk_full-analysis</code> composite (one API call that replaces
          seven individual ones) and returns:
        </p>
        <pre><code>{`Risk Tearsheet (11 periods):
  Sharpe: 2.83
  Sortino: 4.59
  VaR (95%): -0.03
  Max Drawdown: -0.03
  Kelly leverage: 10.65x
  Hurst: 0.50 (neutral — random walk)
  CAGR: 122.98%`}</code></pre>
        <p>Same inputs always produce the same output. No drift, no flaky Sharpe calculations.</p>

        <h2>Example 3: backtest a strategy</h2>
        <pre><code className="language-python">{`result = executor.invoke({
    "input": "Backtest a 20/50 SMA crossover on this price series: [100, 101, 102, ...]. "
             "Initial capital $10000, 5 bps commission."
})`}</code></pre>
        <p>
          The agent calls <code>backtest_strategy</code> (a composite that replaces ~10 individual
          calls) and gets back Sharpe, Calmar, max drawdown, win rate, the trade list, the equity
          curve, and a buy-and-hold benchmark comparison.
        </p>

        <h2>Composites vs individual calculators vs batch</h2>
        <p>The toolkit exposes three tiers, each for a different situation:</p>
        <ul>
          <li>
            <strong>Individual calculators</strong> (<code>options_price</code>,{' '}
            <code>risk_portfolio</code>, <code>stats_hurst-exponent</code>…) — fine-grained control,
            one concept per call. Free tier.
          </li>
          <li>
            <strong>Composite workflows</strong> (<code>backtest_strategy</code>,{' '}
            <code>portfolio_rebalance-plan</code>, <code>hedging_recommend</code>,{' '}
            <code>risk_full-analysis</code>…) — bundle 5–15 calculator calls into one round trip with
            a purpose-built output. Paid-only ($0.015–$0.10), but far cheaper and faster than
            hand-chaining the pieces.
          </li>
          <li>
            <strong>Batch endpoint</strong> (<code>POST /v1/batch</code>) — run up to 100 calculator
            calls in a single HTTP request. Ideal for parameter sweeps and walk-forward backtests.
            Price is the sum of the individual prices, no markup. See{' '}
            <Link href="/writing/batch-quant-api-calls" className="text-accent">the batch deep-dive</Link>.
          </li>
        </ul>
        <p>
          Rule of thumb: one calculation → individual calculator; a named workflow → composite; many
          small calculations at once → batch. A backtest run that would be 200 calls one at a time
          becomes 2 batch calls.
        </p>

        <h2>Filter by category to keep tool lists small</h2>
        <p>
          A common LangChain pitfall: 73 tools in the prompt confuses smaller models. Filter by
          category:
        </p>
        <pre><code className="language-python">{`# Options-only agent
tools = QuantOracleToolkit(categories=["options", "derivatives"]).get_tools()

# Risk/portfolio-only agent
tools = QuantOracleToolkit(categories=["risk", "portfolio", "stats"]).get_tools()

# Crypto-focused agent
tools = QuantOracleToolkit(categories=["crypto", "simulate"]).get_tools()`}</code></pre>

        <h2>Past the free tier</h2>
        <p>
          After 1,000 calls/day per IP, the API returns HTTP 402 with x402 payment requirements. If
          you&apos;re using an x402-capable client (AgentCash, Coinbase AgentKit), payment is
          automatic — USDC on Base or Solana, $0.002–$0.10/call. Otherwise the toolkit raises an
          exception and you add a payment layer yourself.
        </p>

        <h2>Why this matters for agentic systems</h2>
        <p>
          When an agent makes 50 tool calls during a backtest, <strong>every calculation has to be
          right</strong>. An LLM that&apos;s 85% accurate on Black-Scholes doesn&apos;t produce a
          backtest — it produces noise. Moving all math to a deterministic calculator makes results
          reproducible, cacheable (memoize by input hash), auditable (replay any step), fast, and far
          cheaper than the equivalent LLM tokens.
        </p>
        <p>
          This pattern — <strong>LLM for reasoning + deterministic APIs for compute</strong> — is the
          one thing that actually works for production agent systems. Pick it up before your agent
          starts taking real actions, not after.
        </p>

        <h2>Links</h2>
        <ul>
          <li><a href="https://api.quantoracle.dev/docs" rel="noopener" className="text-accent">API docs</a> · <Link href="/api-docs" className="text-accent">overview</Link></li>
          <li><a href="https://pypi.org/project/langchain-quantoracle/" target="_blank" rel="noopener" className="text-accent">langchain-quantoracle on PyPI</a></li>
          <li>MCP server: <code>npx quantoracle-mcp</code></li>
          <li><a href="https://github.com/QuantOracledev/quantoracle" target="_blank" rel="noopener" className="text-accent">GitHub</a></li>
        </ul>
        <p>
          Free tier is generous, no signup, MIT licensed. If you&apos;re building an agent that
          touches financial math, try it before rolling your own.
        </p>

        <h2>Related</h2>
        <ul>
          <li>
            <Link href="/writing/vercel-ai-sdk-quant-tools" className="text-accent">
              The same tools for a Vercel AI SDK agent
            </Link>
          </li>
          <li>
            <Link href="/writing/quant-tools-mcp-server" className="text-accent">
              Add the tools via MCP (Claude Desktop, Cursor, any MCP client)
            </Link>
          </li>
          <li>
            <Link href="/writing/agent-framework-comparison-2026" className="text-accent">
              Which agent framework for quant tools? (AgentKit vs LangChain vs …)
            </Link>
          </li>
          <li>
            <Link href="/black-scholes-calculator" className="text-accent">Black-Scholes calculator</Link>{' '}
            — the browser version of <code>options_price</code>
          </li>
        </ul>
      </article>

      <WritingRelated slug="langchain-reliable-quant-finance-math" />

      <div className="mt-12">
        <AffiliateCta subId="writing-langchain-quant" category="compare" />
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
