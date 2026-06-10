import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/api-docs',
  title: 'API for Quant Finance — 73 Endpoints + Batch, Free Tier, No Signup',
  description:
    '73 deterministic quant finance endpoints (options, derivatives, risk, portfolio, statistics, crypto, FX, macro) plus a /batch endpoint and a new live market-data tier (real-time crypto volatility + perp funding rates). Free tier of 1,000 calls/IP/day, no API key. Pay-per-call x402 micropayments.',
  keywords: [
    'quant finance API',
    'options API',
    'risk API',
    'portfolio API',
    'x402 API',
    'batch API',
  ],
});

export default function ApiDocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 prose-soft">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100 mb-4">
        QuantOracle API
      </h1>
      <p className="text-lg text-slate-300 mb-8">
        73 deterministic quant finance endpoints plus a <code>/batch</code> endpoint that
        bundles up to 100 of them in a single HTTP roundtrip. The same engine that powers the
        calculators on this site is available as a JSON API for your own applications.
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        <Stat label="Endpoints" value="73 + batch" />
        <Stat label="Free tier" value="1,000/day" />
        <Stat label="Latency p50" value="~70 ms" />
      </div>

      <h2>Quick start</h2>
      <p>No signup, no API key for the first 1,000 calls per IP per day. Just POST JSON.</p>
      <pre className="bg-ink-800 border border-ink-700 rounded-md p-4 overflow-x-auto text-xs">
        <code>{`curl -X POST https://api.quantoracle.dev/v1/options/price \\
  -H "Content-Type: application/json" \\
  -d '{"S":100,"K":100,"T":0.25,"r":0.05,"sigma":0.2,"type":"call"}'

# → {"price":4.615,"breakeven":104.615,"prob_itm":0.5299,
#    "greeks":{"delta":0.569,"gamma":0.039,"vega":0.196,
#              "theta":-0.029,"rho":0.131}, ...}`}</code>
      </pre>

      <h2>Endpoint catalog</h2>
      <p>
        See the full machine-readable spec at{' '}
        <a href="https://api.quantoracle.dev/openapi.json" rel="noopener">
          /openapi.json
        </a>{' '}
        or the human-readable docs at{' '}
        <a href="https://api.quantoracle.dev/tools" rel="noopener">
          /tools
        </a>
        . Categories include:
      </p>
      <ul className="list-disc list-inside text-sm space-y-1 text-slate-300">
        <li>Options pricing — Black-Scholes, implied vol, payoff diagrams, multi-leg strategies</li>
        <li>Derivatives — binomial trees, barrier, Asian, lookback, volatility surface</li>
        <li>Risk metrics — Sharpe, Sortino, VaR, CVaR, drawdown, Kelly, position sizing</li>
        <li>Portfolio — mean-variance optimization, risk parity, rebalancing, health scoring</li>
        <li>Statistics — regression, cointegration, Hurst, GARCH, distribution fits</li>
        <li>Crypto / DeFi — impermanent loss, liquidation price, funding rate, DEX slippage</li>
        <li>FX — interest rate parity, PPP, carry trade, forwards</li>
        <li>Macro / TVM — Taylor Rule, real yield, NPV, IRR, CAGR</li>
        <li>
          Composite workflows — backtest, hedging recommendations, full risk analysis,
          rebalance planning
        </li>
        <li>
          <strong>Batch</strong> — <code>/v1/batch</code> wraps up to 100 sub-requests
          (any mix of the above) into a single HTTP call, returning all results in one
          response. Charged as the sum of the component endpoint prices, but settled in
          one x402 transaction with one round trip.
        </li>
        <li>
          <strong>QuantOracle Live (new)</strong> — <code>/v1/live/volatility</code> and{' '}
          <code>/v1/live/funding-rates</code> are the one tier that <em>brings the data</em>: we
          fetch fresh crypto market data and run the math, so your agent gets a computed answer
          (realized vol across 7/30/90d + regime; annualized funding carry) without sourcing or
          maintaining a data feed itself. A separate paid tier — 20 free calls/IP/day, then
          pay-per-call via x402.
        </li>
      </ul>

      <h2>Pricing</h2>
      <ul className="list-disc list-inside text-sm space-y-1 text-slate-300">
        <li>
          <strong>Free tier:</strong> 1,000 calls per IP per day across the 63 calculator
          endpoints, no signup, no API key. Composite workflows and <code>/v1/batch</code>{' '}
          are paid-only.
        </li>
        <li>
          <strong>Pay-per-call (x402):</strong> $0.002–$0.10 per individual endpoint depending
          on complexity. Settled in USDC on Base or Solana via the{' '}
          <a href="https://github.com/coinbase/x402" rel="noopener">
            x402 protocol
          </a>{' '}
          — your client wallet pays automatically when you exceed the free tier.
        </li>
        <li>
          <strong>Batch:</strong> <code>/v1/batch</code> sums the prices of the included
          sub-requests. A batch of 50 Black-Scholes calls ($0.005 × 50 = $0.25) costs the same
          as 50 individual calls, but you save 49 HTTP roundtrips and settle in one x402
          transaction. Designed for agents that need many computations at once.
        </li>
        <li>
          <strong>QuantOracle Live:</strong> <code>/v1/live/*</code> is paid (it fetches fresh
          market data, not part of the 1,000/day calculator tier). 20 free calls per IP per
          day, then $0.005–$0.01/call via x402. You pay for the freshness, not the math.
        </li>
        <li>
          <strong>High-volume / enterprise:</strong> for flat-rate billing, an API key, an SLA, or
          a higher rate limit, open an issue at{' '}
          <a
            href="https://github.com/QuantOracledev/quantoracle/issues/new"
            rel="noopener"
            className="text-accent"
          >
            github.com/QuantOracledev/quantoracle
          </a>{' '}
          with your expected volume and we&apos;ll size a plan.
        </li>
      </ul>

      <h2>SDKs and integrations</h2>
      <ul className="list-disc list-inside text-sm space-y-1 text-slate-300">
        <li>
          <strong>Python (LangChain):</strong>{' '}
          <a href="https://pypi.org/project/langchain-quantoracle/" rel="noopener">
            <code>pip install langchain-quantoracle</code>
          </a>
        </li>
        <li>
          <strong>MCP server:</strong>{' '}
          <a href="https://www.npmjs.com/package/quantoracle-mcp" rel="noopener">
            <code>npx quantoracle-mcp</code>
          </a>
        </li>
        <li>
          <strong>A2A AgentCard:</strong>{' '}
          <a href="https://api.quantoracle.dev/.well-known/agent-card.json" rel="noopener">
            <code>/.well-known/agent-card.json</code>
          </a>{' '}
          — 73 skills, schema v0.2
        </li>
        <li>
          <strong>OpenAPI spec:</strong>{' '}
          <a href="https://api.quantoracle.dev/openapi.json" rel="noopener">
            <code>/openapi.json</code>
          </a>
        </li>
      </ul>

      <div className="mt-10 card border-accent/30">
        <div className="font-semibold mb-2">Try it without writing code</div>
        <p className="text-sm">
          Use the <Link href="/#calculators">calculators on this site</Link> — every page is a thin
          wrapper around an API endpoint. View source on any calculator and you&apos;ll see the same
          POST body you can drop into your own client.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center">
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-accent">{value}</div>
    </div>
  );
}
