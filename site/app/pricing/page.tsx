import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/pricing',
  title: 'Pricing — Free Tier + x402 Micropayments for Agents',
  description:
    'QuantOracle API pricing: 1,000 free calls per IP per day (no signup, no API key), then $0.002–$0.10 USDC per call via x402 micropayments on Base or Solana. 10 composite workflows, a /v1/batch endpoint, QuantOracle Live (real-time crypto volatility + funding rates), and QuantOracle Watch — 24/7 position monitoring at $5 per position per 30 days.',
  keywords: [
    'quantoracle pricing',
    'quant api pricing',
    'x402 api pricing',
    'pay per call quant',
    'free quant api',
    'batch quant api',
  ],
});

interface Tier {
  endpoints: string[];
  priceLabel: string;
  examples: string;
}

const FREE_FEATURES = [
  '1,000 calls/IP/day on the core calculators, no signup, no API key',
  'All 63 calculator endpoints (Black-Scholes, Kelly, Monte Carlo, Sharpe, VaR, GARCH, Hurst, etc.)',
  '15 free interactive calculators at quantoracle.dev',
  'OpenAPI spec, MCP HTTP server, LangChain toolkit, AgentKit action provider',
  'No tier negotiation, no billing system, no credit card on file',
];

const PRICED_TIERS: Tier[] = [
  {
    endpoints: ['stats/zscore', 'tvm/present-value', 'tvm/future-value', 'stats/normal-distribution', 'tvm/cagr', 'tvm/npv'],
    priceLabel: '$0.002 USDC',
    examples: 'Simple formulas — z-score, present/future value, normal distribution PDF/CDF, CAGR, NPV',
  },
  {
    endpoints: ['options/price', 'options/implied-vol', 'risk/kelly', 'risk/position-size', 'options/payoff-diagram', 'crypto/impermanent-loss'],
    priceLabel: '$0.005 USDC',
    examples: 'Medium computation — Black-Scholes, implied vol solver, Kelly Criterion, position sizing, IL',
  },
  {
    endpoints: ['risk/portfolio', 'risk/var-parametric', 'risk/stress-test', 'derivatives/binomial-tree', 'derivatives/barrier-option', 'stats/hurst-exponent', 'fixed-income/bond'],
    priceLabel: '$0.008 USDC',
    examples: 'Complex computation — portfolio risk, parametric VaR, stress tests, binomial trees, barrier options, Hurst',
  },
  {
    endpoints: ['simulate/montecarlo', 'portfolio/optimize', 'stats/garch-forecast', 'derivatives/volatility-surface', 'stats/correlation-matrix'],
    priceLabel: '$0.015 USDC',
    examples: 'Heavy optimization — Monte Carlo (1000+ paths), portfolio optimization, GARCH, vol surface',
  },
];

const COMPOSITES = [
  { endpoint: 'options/spread-scan', price: '$0.05', what: 'Scan multiple option spread structures and rank by expected value' },
  { endpoint: 'indicators/regime-classify', price: '$0.015', what: 'Classify market regime (trending / mean-reverting / volatile) with Hurst + autocorrelation' },
  { endpoint: 'risk/full-analysis', price: '$0.04', what: 'Composite risk audit: Sharpe + Sortino + Calmar + max DD + VaR + CVaR + Kelly + Hurst in one call' },
  { endpoint: 'trade/evaluate', price: '$0.025', what: 'Evaluate a proposed trade against current position + risk profile' },
  { endpoint: 'portfolio/health', price: '$0.04', what: 'Composite portfolio health score with diversification + risk metrics' },
  { endpoint: 'pairs/signal', price: '$0.025', what: 'Generate pairs trading signal from two return series (cointegration + spread)' },
  { endpoint: 'backtest/strategy', price: '$0.10', what: 'Backtest a strategy specification against historical data' },
  { endpoint: 'portfolio/rebalance-plan', price: '$0.05', what: 'Compute optimal rebalance trades given current weights and targets' },
  { endpoint: 'options/strategy-optimizer', price: '$0.08', what: 'Find optimal option strategy structure given outlook and constraints' },
  { endpoint: 'hedging/recommend', price: '$0.04', what: 'Ranked hedge structures (collar, protective put, partial put, inverse) for any position' },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>{' '}
        / Pricing
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          Free for most use cases. Paid composites for agents that want bundled
          computation, a <code>/v1/batch</code> endpoint that dispatches up to 100
          sub-requests in one HTTP call, and QuantOracle Watch — 24/7 position
          monitoring for $5 per position per 30 days. Everything settled via x402 USDC
          micropayments on Base or Solana — no signup, no API key, no billing system.
        </p>
      </header>

      {/* Free tier — the headline feature */}
      <section className="mb-12">
        <div className="rounded-lg border border-accent/30 bg-accent/[0.04] p-6">
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-slate-100">Free tier</h2>
            <span className="text-2xl font-mono text-accent">$0</span>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-accent flex-shrink-0">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            The free tier covers nearly all human use and most agent use. The paid tiers exist
            for agents that need higher volume, for the 10 composite endpoints that bundle
            multiple calculations, or for <code>/v1/batch</code> when you want to dispatch
            many computations in one HTTP call. Two endpoint groups have a smaller free
            allowance than the 1,000/day calculator tier: the <strong>live-data</strong> endpoints
            (20/day) and the <strong>crypto-risk</strong> trio — <code>liquidation-price</code>,{' '}
            <code>var-parametric</code>, <code>kelly</code> (50/day shared, then the{' '}
            <code>leverage-check</code> bundle or per-call x402). Calls via the MCP server keep
            the full 1,000/day.
          </p>
        </div>
      </section>

      {/* Pay-per-call calculator tiers */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Calculator endpoints (above free tier)</h2>
        <p className="text-sm text-slate-400 mb-5">
          When an IP exceeds the 1,000 free calls/day, individual calculator endpoints are
          priced per call. Payment settles via x402 USDC on Base or Solana mainnets. Your
          agent wallet handles payment automatically — no API key configuration.
        </p>
        <div className="space-y-3">
          {PRICED_TIERS.map((tier) => (
            <div
              key={tier.priceLabel}
              className="rounded-lg border border-ink-700/60 p-4 hover:border-accent/30 transition"
            >
              <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
                <span className="font-mono text-lg text-accent">{tier.priceLabel}</span>
                <span className="text-xs text-slate-500">per call</span>
              </div>
              <p className="text-sm text-slate-300 mb-2">{tier.examples}</p>
              <div className="flex flex-wrap gap-1.5">
                {tier.endpoints.slice(0, 6).map((ep) => (
                  <code
                    key={ep}
                    className="text-[10px] bg-ink-800/60 border border-ink-700/40 rounded px-1.5 py-0.5 text-slate-400"
                  >
                    {ep}
                  </code>
                ))}
                {tier.endpoints.length > 6 && (
                  <span className="text-[10px] text-slate-500">+more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Composite endpoints */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Composite endpoints (always paid)</h2>
        <p className="text-sm text-slate-400 mb-5">
          10 multi-step endpoints that bundle 5-15 underlying calculations into a single
          response. These are designed for agent workflows where the agent wants the analysis
          done end-to-end rather than coordinating multiple tool calls. Priced per call,
          settled via x402.
        </p>
        <div className="overflow-x-auto rounded-lg border border-ink-700/60">
          <table className="w-full text-sm">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-4 py-2 text-xs uppercase tracking-wide text-slate-400">Endpoint</th>
                <th className="px-4 py-2 text-xs uppercase tracking-wide text-slate-400">Price</th>
                <th className="px-4 py-2 text-xs uppercase tracking-wide text-slate-400">What it does</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {COMPOSITES.map((c) => (
                <tr key={c.endpoint} className="border-t border-ink-700/40">
                  <td className="px-4 py-2 font-mono text-xs">{c.endpoint}</td>
                  <td className="px-4 py-2 font-mono text-accent text-sm">{c.price}</td>
                  <td className="px-4 py-2 text-sm">{c.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* QuantOracle Live — data tier */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">QuantOracle Live — fresh market data + compute</h2>
        <p className="text-sm text-slate-400 mb-5">
          Every other endpoint is pure math on inputs <em>you</em> supply — the 73 calculators stay
          genuinely zero-dependency (no market data, no third-party APIs). The Live tier is the
          deliberate exception: you supply just a ticker, and we fetch fresh market data and run the
          computation, so your agent never has to source or maintain a data feed. It&apos;s the one
          tier priced from the first call (it isn&apos;t part of the 1,000/day calculator free tier).
        </p>
        <div className="overflow-x-auto rounded-lg border border-ink-700/60">
          <table className="w-full text-sm">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-4 py-2 text-xs uppercase tracking-wide text-slate-400">Endpoint</th>
                <th className="px-4 py-2 text-xs uppercase tracking-wide text-slate-400">Price</th>
                <th className="px-4 py-2 text-xs uppercase tracking-wide text-slate-400">What it does</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-2 font-mono text-xs">live/volatility</td>
                <td className="px-4 py-2 font-mono text-accent text-sm">$0.01</td>
                <td className="px-4 py-2 text-sm">Realized volatility (7d / 30d / 90d) + regime for a crypto asset, from fresh daily candles</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-2 font-mono text-xs">live/funding-rates</td>
                <td className="px-4 py-2 font-mono text-accent text-sm">$0.005</td>
                <td className="px-4 py-2 text-sm">Current perpetual funding rate + annualized carry for a crypto asset</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-300">
          <strong className="text-accent">20 free calls per IP per day</strong>, then
          pay-per-call via x402 (Base or Solana). You pay for the freshness and the data pipeline —
          not the math.
        </p>
      </section>

      {/* QuantOracle Watch — recurring monitoring */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">QuantOracle Watch — 24/7 position monitoring</h2>
        <p className="text-sm text-slate-400 mb-5">
          Every other endpoint answers once. Watch is the standing service: register a crypto perp
          position and an isolated watcher re-evaluates it every 60 seconds — funding-adjusted
          liquidation distance (warn/critical bands), funding-rate flips, vol-regime changes — and
          sends HMAC-signed webhook alerts. Alerts are also recorded server-side, so the free trial
          needs zero infrastructure: just poll the status endpoint.
        </p>
        <div className="overflow-x-auto rounded-lg border border-ink-700/60">
          <table className="w-full text-sm">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-4 py-2 text-xs uppercase tracking-wide text-slate-400">Endpoint</th>
                <th className="px-4 py-2 text-xs uppercase tracking-wide text-slate-400">Price</th>
                <th className="px-4 py-2 text-xs uppercase tracking-wide text-slate-400">What it does</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-2 font-mono text-xs">watch/trial</td>
                <td className="px-4 py-2 font-mono text-accent text-sm">Free</td>
                <td className="px-4 py-2 text-sm">48-hour trial monitor — one per IP per 30 days, evaluable by polling alone</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-2 font-mono text-xs">watch/position</td>
                <td className="px-4 py-2 font-mono text-accent text-sm">$5.00</td>
                <td className="px-4 py-2 text-sm">Register a perp position for 30 days of 24/7 monitoring + webhook alerts</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-2 font-mono text-xs">watch/extend</td>
                <td className="px-4 py-2 font-mono text-accent text-sm">$5.00</td>
                <td className="px-4 py-2 text-sm">Add 30 days to a monitor (also upgrades a trial without re-registering)</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-2 font-mono text-xs">watch/{'{id}'} (GET / DELETE)</td>
                <td className="px-4 py-2 font-mono text-accent text-sm">Free</td>
                <td className="px-4 py-2 text-sm">Live status + alert history, or cancel — token auth</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-300">
          The math: a DIY loop polling <code>liquidation-price</code> once a minute past the free
          tier costs ~$7.20/day in per-call fees. Watch is{' '}
          <strong className="text-accent">$5 per position per 30 days</strong>, checks just as
          often, and folds funding drift into the liquidation estimate. No exchange keys, no
          custody — read-only market data in, webhooks out.{' '}
          <Link href="/writing/crypto-liquidation-alerts-for-agents" className="text-accent">
            Full walkthrough →
          </Link>
        </p>
      </section>

      {/* Batch endpoint */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Batch endpoint — bundle up to 100 calls</h2>
        <p className="text-sm text-slate-400 mb-5">
          <code>/v1/batch</code> accepts a JSON array of up to 100 sub-requests and returns all
          results in one response. Useful when your agent has already decided what 50+
          computations to run — multi-asset portfolio audits, option-chain sweeps, scenario
          analyses — and wants to dispatch them with one HTTP roundtrip and one x402
          settlement instead of N.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div className="rounded-lg border border-ink-700/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Pricing</div>
            <div className="text-sm text-slate-300 leading-relaxed">
              Charged as the <strong className="text-slate-100">sum of the component
              endpoint prices</strong>. A batch of 50 Black-Scholes calls costs the same as
              50 individual calls — <span className="font-mono text-accent">$0.005 × 50 =
              $0.25</span>. The savings are latency and settlement overhead, not per-call
              cost.
            </div>
          </div>
          <div className="rounded-lg border border-ink-700/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Limits</div>
            <ul className="text-sm text-slate-300 leading-relaxed space-y-1">
              <li>• <strong className="text-accent">First batch call free</strong> (one per IP, no wallet needed)</li>
              <li>• Up to <strong>100 sub-requests</strong> per call</li>
              <li>• Any mix of calculator + composite endpoints</li>
              <li>• Single x402 settlement for the entire batch</li>
              <li>• Returns all results, including per-call status codes</li>
            </ul>
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-3">Example: price an option chain in one call</p>
        <pre className="bg-ink-800 border border-ink-700 rounded-md p-4 overflow-x-auto text-xs">
          <code>{`curl -X POST https://api.quantoracle.dev/v1/batch \\
  -H "Content-Type: application/json" \\
  -d '{
    "requests": [
      {"endpoint": "options/price", "params": {"S":100,"K":95,"T":0.25,"r":0.05,"sigma":0.2}},
      {"endpoint": "options/price", "params": {"S":100,"K":100,"T":0.25,"r":0.05,"sigma":0.2}},
      {"endpoint": "options/price", "params": {"S":100,"K":105,"T":0.25,"r":0.05,"sigma":0.2}},
      {"endpoint": "options/price", "params": {"S":100,"K":110,"T":0.25,"r":0.05,"sigma":0.2}}
    ]
  }'

# → {"batch_size": 4, "total_price_usdc": 0.02,
#    "results": [
#      {"endpoint": "options/price", "status": 200, "data": {"price": 7.71, ...}},
#      {"endpoint": "options/price", "status": 200, "data": {"price": 4.62, ...}},
#      ...
#    ],
#    "ms": 142}`}</code>
        </pre>

        <p className="mt-4 text-sm text-slate-300">
          <strong className="text-accent">Your first batch call is free</strong> — one per IP,
          no wallet required. Bundle up to 100 calculations and see exactly how it works before
          paying for anything. After that, batches are charged as the{' '}
          <code>total_price_usdc</code> shown in the response (the sum of component prices). If you
          only need a handful of calls, route through the individual free endpoints instead.
        </p>
      </section>

      {/* How payment works */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">How payment actually works</h2>
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            QuantOracle uses the{' '}
            <a
              href="https://github.com/coinbase/x402"
              target="_blank"
              rel="noopener"
              className="text-accent hover:underline"
            >
              x402 protocol
            </a>{' '}
            — the HTTP-native standard for crypto micropayments. When a paid endpoint is
            called:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>The server responds with HTTP 402 and a payment requirement</li>
            <li>Your client (or AgentKit wallet) signs a USDC <code>transferWithAuthorization</code></li>
            <li>The signed authorization is posted back to the facilitator</li>
            <li>Settlement happens on-chain (~2s on Base, &lt;1s on Solana)</li>
            <li>Your actual API response is returned after settlement confirms</li>
          </ol>
          <p>
            <strong className="text-slate-200">No account required.</strong> Your wallet
            ownership is the auth. The wallet just needs USDC on Base or Solana. No API keys to
            rotate, no billing system to manage, no rate-limit overage charges — payment is
            per-call only.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">FAQ</h2>
        <div className="space-y-5 text-sm text-slate-300 leading-relaxed">
          <div>
            <h3 className="font-semibold text-slate-100 mb-1">
              Do I need to sign up to use QuantOracle?
            </h3>
            <p>
              No. The free tier requires no account, no email, no API key — just hit the
              endpoint up to 1,000 times per day per IP (a few are metered tighter: live-data at
              20/day and the crypto-risk trio at 50/day shared). The paid tier requires a wallet
              that holds USDC on Base or Solana, but no QuantOracle account.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 mb-1">
              How do I track my spending?
            </h3>
            <p>
              All x402 settlements are visible on-chain via the originating wallet&apos;s
              transaction history (etherscan.io for Base, solscan.io for Solana). QuantOracle
              also publishes aggregate settlement data at{' '}
              <a
                href="https://api.quantoracle.dev/metrics"
                target="_blank"
                rel="noopener"
                className="text-accent hover:underline"
              >
                api.quantoracle.dev/metrics
              </a>
              .
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 mb-1">
              Is there a discount for high volume?
            </h3>
            <p>
              Not currently. The pricing was designed for agent-scale usage where individual
              calls are cheap and bulk discounts add complexity. If your usage pattern would
              meaningfully benefit from a custom arrangement, reach out via{' '}
              <a
                href="https://github.com/QuantOracledev/quantoracle/issues"
                target="_blank"
                rel="noopener"
                className="text-accent hover:underline"
              >
                GitHub Issues
              </a>
              .
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 mb-1">
              What if a paid call returns an error?
            </h3>
            <p>
              Settlement only happens on a successful response. If the API errors before
              returning data, no payment is charged — the wallet&apos;s signed authorization
              is never submitted. This is enforced at the x402 protocol level.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 mb-1">
              Can I use the calculators (website) without paying?
            </h3>
            <p>
              Yes. The 15 interactive calculators at{' '}
              <Link href="/" className="text-accent hover:underline">
                quantoracle.dev
              </Link>{' '}
              are entirely free for human use. They&apos;re backed by the same API but the SSR
              renders use the free tier and never charge users.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 mb-1">
              Which chain should I use — Base or Solana?
            </h3>
            <p>
              Either works. Base settlement is ~2 seconds per call. Solana settlement is under
              1 second per call. Solana has lower per-call gas overhead, which makes it the
              better fit for high-frequency agent workflows. Base has higher liquidity and is
              the default for most agent frameworks (including Coinbase AgentKit&apos;s default
              EVM wallet provider).
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-12 pt-8 border-t border-ink-700/40">
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <Link
            href="/"
            className="btn-primary"
          >
            Try the free calculators
          </Link>
          <a
            href="https://api.quantoracle.dev/openapi.json"
            target="_blank"
            rel="noopener"
            className="btn-ghost"
          >
            OpenAPI spec →
          </a>
          <a
            href="https://github.com/QuantOracledev/quantoracle"
            target="_blank"
            rel="noopener"
            className="btn-ghost"
          >
            GitHub →
          </a>
        </div>
      </section>
    </div>
  );
}
