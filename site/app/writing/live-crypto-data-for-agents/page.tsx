import Link from 'next/link';
import { AffiliateCta } from '@/components/AffiliateCta';
import { WritingRelated } from '@/components/WritingRelated';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/writing/live-crypto-data-for-agents',
  title: 'Live Crypto Volatility & Funding for Your Agent — Data + Compute in One Call',
  description:
    'QuantOracle Live: give your agent fresh crypto realized volatility and perpetual funding rates with one API call. We fetch the live market data and run the math — no exchange integrations, rate limits, or geo-blocks to manage. 20 free calls/IP/day, then pay-per-call via x402.',
  keywords: [
    'live crypto volatility api',
    'realized volatility api',
    'perp funding rate api',
    'crypto market data for agents',
    'ai agent market data',
    'x402 data api',
    'crypto trading agent data',
  ],
});

const LAST_UPDATED = 'June 7, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Live Crypto Volatility & Funding for Your Agent — Data + Compute in One Call',
  description:
    'QuantOracle Live gives an AI agent fresh crypto realized volatility and perp funding rates in one call — the API fetches the market data and runs the math.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-06-07',
  dateModified: '2026-06-07',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/writing/live-crypto-data-for-agents',
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
      name: 'Live Crypto Data for Agents',
      item: 'https://quantoracle.dev/writing/live-crypto-data-for-agents',
    },
  ],
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> /{' '}
        <Link href="/writing" className="hover:text-accent">Writing</Link>{' '}
        / Live Crypto Data for Agents
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Live crypto volatility &amp; funding for your agent, in one call
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          Most of QuantOracle is pure math: you bring the numbers, we compute. That&apos;s
          deliberate — the 73 calculators have zero data dependencies, so they&apos;re fast,
          deterministic, and cacheable. But a trading agent often needs the <em>data itself</em>:
          what&apos;s BTC&apos;s realized vol right now? What&apos;s the funding rate on the ETH
          perp? <strong>QuantOracle Live</strong> answers those in a single call — we fetch the
          fresh market data and run the math, so your agent doesn&apos;t have to.
        </p>
        <p className="mt-3 text-xs text-slate-500">Published {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft">
        <h2>The gap: agents need current data, not just formulas</h2>
        <p>
          A risk or trading agent reasoning about a position needs live inputs. &quot;Should I
          size down?&quot; depends on <em>today&apos;s</em> volatility. &quot;Is this perp
          expensive to hold?&quot; depends on the <em>current</em> funding rate. An LLM can&apos;t
          produce those numbers — they&apos;re facts about the market right now, and the model will
          confidently hallucinate them if asked.
        </p>
        <p>
          The usual fix is to build a data pipeline: integrate an exchange API, handle auth and
          rate limits, dodge geo-blocks, cache responses, then compute the metric. That&apos;s real
          work to build and keep alive — and it&apos;s the same work for every agent. QuantOracle
          Live collapses it into one HTTP call.
        </p>

        <h2>Two endpoints to start</h2>
        <p>
          <strong><code>/v1/live/volatility</code></strong> — realized volatility over 7d / 30d /
          90d windows, plus a regime read, computed from fresh daily candles. You pass a ticker:
        </p>
        <pre><code className="language-json">{`POST https://api.quantoracle.dev/v1/live/volatility
{ "asset": "BTC" }

# →
{
  "asset": "BTC",
  "spot": 61728.7,
  "realized_vol_7d": 0.4534,
  "realized_vol_30d": 0.3108,
  "realized_vol_90d": 0.3157,
  "vol_ratio_30d_90d": 0.9845,
  "regime": "NORMAL",
  "as_of_age_seconds": 0.0,
  "stale": false,
  "source": "kraken"
}`}</code></pre>
        <p>
          <strong><code>/v1/live/funding-rates</code></strong> — the current perpetual funding
          rate and its annualized carry:
        </p>
        <pre><code className="language-json">{`POST https://api.quantoracle.dev/v1/live/funding-rates
{ "asset": "ETH" }

# →
{
  "asset": "ETH",
  "instrument": "ETH-USDT-SWAP",
  "funding_rate": -0.000104,
  "interval_hours": 8,
  "annualized_rate": -0.1137,
  "regime": "BACKWARDATION",
  "source": "okx"
}`}</code></pre>
        <p>
          That&apos;s a computed answer — annualized carry, vol regime — not raw ticks the agent
          would have to post-process. Pass a ticker, get a decision-ready number.
        </p>

        <h2>How it&apos;s built (and why it stays up)</h2>
        <p>
          Each call checks a short-lived cache first; on a miss it fetches from a public exchange
          feed (<strong>Kraken</strong> for candles, <strong>OKX</strong> for funding — chosen
          because they&apos;re reachable where the big US-blocked venues like Binance and Bybit
          aren&apos;t), runs the same realized-vol and funding math as the deterministic
          calculators, and caches the result (vol ~5 min, funding ~1 min). If an upstream is
          briefly down, the API serves the last good value with a <code>stale: true</code> flag
          rather than failing. The <code>as_of_age_seconds</code> field tells your agent exactly how
          fresh the answer is.
        </p>

        <h2>Pricing: this is the one tier you pay for from call one</h2>
        <p>
          The 73 calculators are free up to 1,000 calls/IP/day because they&apos;re pure compute —
          you could run the same math locally. Live is different: the value is the <em>fresh data
          and the pipeline</em>, which you can&apos;t replicate with a local library. So it&apos;s
          priced from the first call, separate from the calculator free tier:
        </p>
        <ul>
          <li><code>/v1/live/volatility</code> — <strong>$0.01</strong>/call</li>
          <li><code>/v1/live/funding-rates</code> — <strong>$0.005</strong>/call</li>
        </ul>
        <p>
          You get <strong>20 free calls per IP per day</strong> to evaluate the data, then it
          settles per-call via <a href="https://www.x402.org/" target="_blank" rel="noopener" className="text-accent">x402</a>{' '}
          (USDC on Base or Solana) — no API key, no signup. You&apos;re paying for freshness, not
          arithmetic.
        </p>

        <h2>Wiring it into an agent</h2>
        <p>
          It&apos;s a plain POST, so it drops into any agent as a tool. Expose it over MCP — the
          hosted server at <code>https://mcp.quantoracle.dev/mcp</code> already lists{' '}
          <code>live_volatility</code> and <code>live_funding-rates</code> alongside the other 74
          tools — or wrap it directly:
        </p>
        <pre><code className="language-typescript">{`const liveVol = {
  name: "live_volatility",
  description:
    "Get FRESH realized volatility (7/30/90d) + regime for a crypto asset. " +
    "Use this for current market vol — do not estimate it yourself.",
  schema: z.object({ asset: z.string() }),
  func: async ({ asset }) => {
    const r = await fetch("https://api.quantoracle.dev/v1/live/volatility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asset }),
    });
    return JSON.stringify(await r.json());
  },
};`}</code></pre>
        <p>
          The description line — &quot;do not estimate it yourself&quot; — matters: it tells the
          model this is a fact to fetch, not compute. That&apos;s the whole point of grounding an
          agent in real data.
        </p>

        <h2>Where this goes</h2>
        <p>
          Volatility and funding are the first two. The pattern — fetch fresh data, run
          QuantOracle&apos;s verified math, return a decision-ready metric — extends to liquidation
          heatmaps, live option-implied vol, cross-venue funding spreads, and more. If there&apos;s
          a live metric your agent needs, that&apos;s the roadmap.
        </p>

        <h2>Related</h2>
        <ul>
          <li>
            <Link href="/writing/batch-quant-api-calls" className="text-accent">
              Batch API calls for speed
            </Link>{' '}
            — price a whole option chain or scan many positions in one request
          </li>
          <li>
            <Link href="/writing/quant-tools-mcp-server" className="text-accent">
              Add 73 quant tools to your agent with MCP
            </Link>{' '}
            — the MCP server that now exposes the live tools too
          </li>
          <li>
            <Link href="/crypto-liquidation-calculator" className="text-accent">
              Crypto liquidation calculator
            </Link>{' '}
            — the pure-compute companion (you bring the inputs)
          </li>
          <li>
            <Link href="/pricing" className="text-accent">Pricing</Link> — the Live tier and the
            x402 settlement model in full
          </li>
        </ul>
      </article>

      <WritingRelated slug="live-crypto-data-for-agents" />

      <div className="mt-12">
        <AffiliateCta subId="writing-live-crypto-data" category="compare" />
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
