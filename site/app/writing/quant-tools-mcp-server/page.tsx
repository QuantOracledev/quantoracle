import Link from 'next/link';
import { AffiliateCta } from '@/components/AffiliateCta';
import { WritingRelated } from '@/components/WritingRelated';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/writing/quant-tools-mcp-server',
  title: 'Add 73 Quant Tools to Your AI Agent in 60 Seconds with MCP',
  description:
    "Wire 63 deterministic quant calculators plus 10 composite workflows into Claude Desktop, Cursor, or any MCP-capable agent in one config line. LLMs drift 5-30% on Black-Scholes Greeks — this is grounded math. Free tier covers most tools; paid composites settle via x402 USDC on Base or Solana.",
  keywords: [
    'mcp quant finance',
    'model context protocol finance',
    'claude desktop quant tools',
    'cursor mcp quant',
    'quantoracle mcp',
    'mcp black scholes',
    'agentic finance tools',
    'mcp server tutorial',
    'deterministic finance agent',
  ],
});

const LAST_UPDATED = 'May 28, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Add 73 Quant Tools to Your AI Agent in 60 Seconds with MCP',
  description:
    'Wire 63 deterministic quant calculators plus 10 composite workflows into Claude Desktop, Cursor, or any MCP-capable agent in one config line. Free tier; paid composites via x402 USDC on Base or Solana.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-05-28',
  dateModified: '2026-05-28',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/writing/quant-tools-mcp-server',
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
      name: 'Quant Tools via MCP',
      item: 'https://quantoracle.dev/writing/quant-tools-mcp-server',
    },
  ],
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> /{' '}
        <Link href="/writing" className="hover:text-accent">Writing</Link>{' '}
        / Quant Tools via MCP
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Add 73 Quant Tools to Your AI Agent in 60 Seconds with MCP
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          LLMs trying to compute Black-Scholes prices in-context are wrong by 5-30% depending on
          moneyness. Kelly fractions get flipped. Sharpe ratios fail at annualization. The agent
          can&apos;t tell. The Model Context Protocol (MCP) gives you a one-line fix.
        </p>
        <p className="mt-3 text-xs text-slate-500">Published {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft">
        <p>
          This walkthrough wires 63 deterministic quant calculators plus 10 composite workflows
          into any MCP-capable agent — Claude Desktop, Cursor, Cline, Continue, Zed, or your own
          custom MCP client — in about 60 seconds. The tools are exactly the math you&apos;d trust
          in production: Black-Scholes with full Greeks, Kelly Criterion, Monte Carlo, Sharpe /
          Sortino / Calmar, VaR / CVaR, options strategy optimization, hedging recommendations.
          Free tier handles most agentic use cases.
        </p>

        <h2>What you get</h2>
        <p>
          The QuantOracle MCP server (<code>quantoracle-mcp</code> on npm) exposes the full API
          surface as MCP tools the agent can call by name:
        </p>
        <ul>
          <li>
            <strong>Options &amp; derivatives (14 tools)</strong> — Black-Scholes, American (binomial),
            barrier, Asian, lookback options. Greeks, implied vol, payoff diagrams, option-chain
            analysis, put-call parity, strategy optimizer, spread scanner, volatility surface.
          </li>
          <li>
            <strong>Risk &amp; portfolio (12 tools)</strong> — Sharpe, Sortino, Calmar, VaR
            (historical + parametric), CVaR, max drawdown, Kelly, position sizing, correlation
            matrix, portfolio risk, stress test, transaction cost.
          </li>
          <li>
            <strong>Statistics (11 tools)</strong> — Hurst exponent, GARCH forecast, realized vol,
            cointegration, polynomial / linear regression, distribution fit, probabilistic Sharpe,
            normal distribution, z-score.
          </li>
          <li>
            <strong>Fixed income &amp; FX (8 tools)</strong> — Bond pricing, amortization, credit
            spread, yield curve interpolation, forward rate, interest rate parity, PPP, carry trade.
          </li>
          <li>
            <strong>Crypto &amp; DeFi (7 tools)</strong> — Liquidation price, impermanent loss, DEX
            slippage, funding rate, APY ↔ APR conversion, rebalance threshold, vesting schedule.
          </li>
          <li>
            <strong>TVM, macro, indicators (11 tools)</strong> — NPV, IRR, CAGR, future / present
            value, real yield, inflation-adjusted return, Taylor rule, ATR, Bollinger bands,
            Fibonacci retracement, technical indicators.
          </li>
          <li>
            <strong>Composites (10 tools, paid via x402)</strong> — Full risk audit, hedge
            recommendation, portfolio health, portfolio optimization, rebalance plan, options
            strategy optimizer, backtest strategy, pairs trading signal, trade evaluator,
            regime classifier. Each composite chains 5-15 calculators internally.
          </li>
        </ul>

        <h2>Free tier vs paid composites</h2>
        <p>
          63 calculators are free up to <strong>1,000 calls per IP per day</strong> — no signup,
          no API key. The 10 composite workflows cost <strong>$0.04 USDC each</strong>, settled
          on-chain via the <a href="https://github.com/coinbase/x402" target="_blank" rel="noopener">x402 protocol</a> on
          Base mainnet or Solana mainnet. When the agent calls a paid composite, it pays from
          the wallet you wire into the MCP client — no upstream auth, no billing dashboard.
        </p>
        <p>
          For most agent workloads (price an option, size a position, simulate a portfolio path),
          the free tier is enough. Paid composites are for the &quot;run a full risk audit on this
          return series&quot; or &quot;rank hedge structures for this position&quot; one-shots
          that would otherwise be 5-15 separate tool calls.
        </p>

        <h2>Setup — Claude Desktop</h2>
        <p>
          Add this to <code>claude_desktop_config.json</code> (location varies — on macOS it&apos;s
          {' '}<code>~/Library/Application Support/Claude/claude_desktop_config.json</code>; on
          Windows it&apos;s <code>%APPDATA%\Claude\claude_desktop_config.json</code>):
        </p>
        <pre><code>{`{
  "mcpServers": {
    "quantoracle": {
      "command": "npx",
      "args": ["-y", "quantoracle-mcp"]
    }
  }
}`}</code></pre>
        <p>
          Restart Claude Desktop. The hammer icon will show 73 new tools. Try a prompt like{' '}
          <em>&quot;Price a 30-day call on NVDA, strike $185, spot $180, 28% IV&quot;</em> — Claude
          will call <code>options_price</code> and return exact Black-Scholes math plus the full
          Greek set.
        </p>

        <h2>Setup — Cursor</h2>
        <p>
          In Cursor, open <strong>Settings → Features → MCP</strong> and add:
        </p>
        <pre><code>{`{
  "mcpServers": {
    "quantoracle": {
      "command": "npx",
      "args": ["-y", "quantoracle-mcp"]
    }
  }
}`}</code></pre>
        <p>
          Same tools, same free tier. Useful inside Cursor when you&apos;re building a quant
          backtest or wiring an API and want the model to verify formulas against a known-good
          reference implementation.
        </p>

        <h2>Setup — custom MCP client</h2>
        <p>
          If you&apos;re building your own MCP host (e.g. with the{' '}
          <a
            href="https://github.com/modelcontextprotocol/typescript-sdk"
            target="_blank"
            rel="noopener"
          >
            MCP TypeScript SDK
          </a>
          ), install the package and spawn it as a stdio child:
        </p>
        <pre><code>{`npm install quantoracle-mcp

# or run directly via npx:
npx -y quantoracle-mcp`}</code></pre>
        <p>
          Configure it like any other stdio MCP server — <code>command: &apos;npx&apos;</code>,{' '}
          <code>args: [&apos;-y&apos;, &apos;quantoracle-mcp&apos;]</code>. The server exposes
          the full toolbelt, and the agent picks the right one per request.
        </p>

        <h2>Your first call</h2>
        <p>
          Once it&apos;s wired, the agent calls tools by name with structured JSON args. A
          Black-Scholes request looks like this from the MCP server&apos;s perspective:
        </p>
        <pre><code>{`// Tool call from agent → MCP server
{
  "name": "options_price",
  "arguments": {
    "S": 180,
    "K": 185,
    "T": 0.082,    // 30 days in years
    "r": 0.05,
    "sigma": 0.28,
    "option_type": "call"
  }
}

// Response back to the agent
{
  "price": 3.2417,
  "intrinsic": 0,
  "time_value": 3.2417,
  "greeks": {
    "delta": 0.412,
    "gamma": 0.0386,
    "theta": -0.0729,
    "vega": 0.1987,
    "rho": 0.0612
  },
  "prob_itm": 0.378
}`}</code></pre>
        <p>
          The agent gets a deterministic answer it can cite — same inputs, same outputs, every
          time. Try it against an LLM&apos;s in-context Black-Scholes attempt and you&apos;ll
          see the drift firsthand.
        </p>

        <h2>Paying for composites with x402</h2>
        <p>
          When the agent calls a composite like <code>risk_full_analysis</code> or{' '}
          <code>hedging_recommend</code>, the MCP server returns an x402 payment-required object.
          The protocol is wallet-handled — you can use the{' '}
          <Link href="/writing/agentkit-reliable-quant-finance-math" className="text-accent">
            Coinbase AgentKit
          </Link>{' '}
          or any x402-aware client to settle the payment automatically. Both Base mainnet
          (EIP-3009) and Solana mainnet (SPL transfer with memo) are supported.
        </p>
        <p>
          For agents using the MCP server directly without a wallet client, the composite tools
          will return a clear 402 response and the agent can either stop and ask the user to
          wire payment, or call the underlying free calculators individually (slower, more tool
          calls, same math).
        </p>

        <h2>The full surface</h2>
        <p>
          The complete tool catalog with input schemas is at{' '}
          <a
            href="https://api.quantoracle.dev/openapi.json"
            target="_blank"
            rel="noopener"
          >
            api.quantoracle.dev/openapi.json
          </a>
          . Every MCP tool maps 1:1 to a REST endpoint, so if you ever need to bypass MCP (e.g.
          for batch processing, raw HTTP, or a non-agentic workflow), you can hit the same math
          directly. The MCP layer is sugar on top.
        </p>
        <p>
          The 15 calculators most commonly called are also live as interactive web tools on{' '}
          <Link href="/" className="text-accent">quantoracle.dev</Link> — useful for spot-checking
          an MCP response or sanity-testing inputs before wiring them into an agent.
        </p>

        <h2>Why deterministic finance math matters for MCP agents</h2>
        <p>
          MCP gives agents tools, but the tools are only as good as the math behind them. There
          are three failure modes when LLMs do financial math in-context that grounded MCP tools
          fix:
        </p>
        <ol>
          <li>
            <strong>Black-Scholes drift.</strong> GPT-4o and Claude both get the Greeks wrong by
            5-30% depending on moneyness. The model doesn&apos;t flag the uncertainty — it just
            commits to a number. With <code>options_price</code> available, the agent calls it
            instead of guessing.
          </li>
          <li>
            <strong>Compound interest skips steps.</strong> A 30-year projection at 8% loses
            meaningful precision over the token sequence. <code>tvm_future_value</code> and{' '}
            <code>simulate_montecarlo</code> are bytes-exact.
          </li>
          <li>
            <strong>Kelly and VaR are mis-applied.</strong> LLMs frequently confuse arithmetic vs
            geometric returns, fail to annualize, or apply the parametric formula to a
            non-normal distribution. The MCP tools are tested against Hull, Wilmott, and Lopez de
            Prado reference implementations across 120 accuracy benchmarks.
          </li>
        </ol>

        <h2>What&apos;s next</h2>
        <p>
          If you&apos;re building a quant agent with a specific framework, the deeper
          framework-native tutorials are linked below — Vercel AI SDK, AgentKit, and a chained
          x402 workflow that pairs <code>risk_full_analysis</code> with{' '}
          <code>hedging_recommend</code> in a single agent loop. For broader framework selection,
          the{' '}
          <Link href="/writing/agent-framework-comparison-2026" className="text-accent">
            agent framework comparison
          </Link>{' '}
          covers AgentKit vs GOAT vs Vercel AI SDK vs LangChain vs elizaOS with decision tables
          and migration paths.
        </p>
        <p>
          For one-off verification or exploration without writing any code, the live calculators
          at <Link href="/" className="text-accent">quantoracle.dev</Link> hit the same engine.
        </p>
      </article>

      <div className="mt-10">
        <AffiliateCta subId="writing-quant-tools-mcp-server" />
      </div>

      <WritingRelated slug="quant-tools-mcp-server" />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </div>
  );
}
