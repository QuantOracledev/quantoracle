import Link from 'next/link';
import { AffiliateCta } from '@/components/AffiliateCta';
import { WritingRelated } from '@/components/WritingRelated';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/writing/crypto-liquidation-alerts-for-agents',
  title: '24/7 Crypto Liquidation Alerts for Your Agent — QuantOracle Watch',
  description:
    'QuantOracle Watch: register a perp position once and get HMAC-signed webhook alerts on liquidation distance (funding-adjusted), funding flips, and vol-regime changes — checked every 60 seconds, 24/7. Free 48h trial with zero infrastructure, then $5 per position per 30 days via x402.',
  keywords: [
    'crypto liquidation alerts',
    'liquidation alert webhook',
    'perp position monitoring api',
    'crypto position monitoring for agents',
    'funding rate alerts',
    'liquidation price monitor',
    'x402 subscription',
  ],
});

const LAST_UPDATED = 'June 11, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '24/7 Crypto Liquidation Alerts for Your Agent — QuantOracle Watch',
  description:
    'Register a crypto perp position once and get webhook alerts on funding-adjusted liquidation distance, funding flips, and vol-regime changes — evaluated every 60 seconds.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-06-11',
  dateModified: '2026-06-11',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/writing/crypto-liquidation-alerts-for-agents',
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
      name: 'Crypto Liquidation Alerts for Agents',
      item: 'https://quantoracle.dev/writing/crypto-liquidation-alerts-for-agents',
    },
  ],
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> /{' '}
        <Link href="/writing" className="hover:text-accent">Writing</Link>{' '}
        / Crypto Liquidation Alerts for Agents
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          24/7 crypto liquidation alerts for your agent, in one registration
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          The most common pattern in our API logs: an agent calls{' '}
          <code>/v1/crypto/liquidation-price</code> and <code>/v1/risk/var-parametric</code> on a
          timer, all day, rebuilding the same monitoring loop out of one-shot math calls.{' '}
          <strong>QuantOracle Watch</strong> replaces the loop: register a perp position once and
          we re-evaluate it every 60 seconds — funding-adjusted liquidation distance, funding-rate
          flips, vol-regime changes — and send an HMAC-signed webhook when something crosses a
          threshold. You stop polling; we stand watch.
        </p>
        <p className="mt-3 text-xs text-slate-500">Published {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft">
        <h2>What it watches</h2>
        <ul>
          <li>
            <strong>Liquidation distance</strong> — recomputed every 60s against the live mark
            price, with your accumulated funding cost folded into effective collateral (funding
            quietly drags your liquidation price toward the market; most DIY monitors miss this).
            Two bands: <code>liq_warn</code> and <code>liq_critical</code>, with hysteresis so a
            position oscillating on a threshold doesn&apos;t spam you, and a 6-hour re-alert while
            you remain in breach.
          </li>
          <li>
            <strong>Funding flips</strong> — <code>funding_flip</code> fires when the perp funding
            rate changes sign: your carry just flipped from earning to paying (or back).
          </li>
          <li>
            <strong>Vol regime</strong> — <code>vol_regime</code> fires when realized volatility
            shifts regime (checked hourly from fresh daily candles).
          </li>
          <li>
            <strong>Expiry</strong> — <code>expiry_warning</code> before your monitor lapses, then{' '}
            <code>expired</code>.
          </li>
        </ul>

        <h2>Try it in 30 seconds (free, no webhook needed)</h2>
        <p>
          The 48-hour trial (one per IP per 30 days) works with <em>zero infrastructure</em> —
          alerts are recorded server-side and readable by polling, so you don&apos;t need a public
          endpoint just to evaluate:
        </p>
        <pre><code className="language-bash">{`curl -X POST https://api.quantoracle.dev/v1/watch/trial \\
  -H "Content-Type: application/json" \\
  -d '{
    "asset": "BTC",
    "direction": "long",
    "entry_price": 62000,
    "position_size": 5000,
    "collateral": 1000,
    "thresholds": {"warn_pct": 15, "critical_pct": 7}
  }'

# → {
#   "monitor_id": "w_7tIxfwKc",
#   "token": "q-HX-...",
#   "tier": "trial",
#   "status": "active",
#   "liquidation_price": 49910,
#   "distance_pct": 19.5,
#   "expires_at": "2026-06-13T02:44:38Z",
#   "check_interval_seconds": 60,
#   "status_url": "https://api.quantoracle.dev/v1/watch/w_7tIxfwKc"
# }`}</code></pre>
        <p>Then poll status with the token — live snapshot plus everything that has fired:</p>
        <pre><code className="language-bash">{`curl "https://api.quantoracle.dev/v1/watch/w_7tIxfwKc?token=q-HX-..."

# → {
#   "status": "active",
#   "current": {
#     "mark": 61973.3,
#     "liquidation_price": 49909.99,
#     "distance_pct": 19.4653,
#     "funding_accum_est": -0.0005
#   },
#   "alerts": [
#     {"ts": "2026-06-11T02:44:45Z", "type": "liq_warn",
#      "payload": {"mark": 61995, "liquidation_price": 49910,
#                  "distance_pct": 19.49, "threshold_pct": 25}}
#   ],
#   ...
# }`}</code></pre>
        <p>
          (Those are real responses — that <code>liq_warn</code> is the first alert the watcher
          ever fired, on its first 60-second tick, against a monitor registered with a deliberately
          tight 25% warn threshold.)
        </p>

        <h2>Webhooks: signed, retried, SSRF-safe</h2>
        <p>
          Provide a <code>webhook_url</code> (any public http(s) endpoint) and alerts POST to you
          as JSON with two headers: <code>X-QO-Monitor</code> (the monitor id) and{' '}
          <code>X-QO-Signature</code> — an HMAC-SHA256 of the raw body, keyed with your monitor
          token. Verify in a few lines:
        </p>
        <pre><code className="language-typescript">{`import crypto from "node:crypto";

function verifyWatchWebhook(rawBody: string, signature: string, token: string) {
  const expected = crypto.createHmac("sha256", token).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}`}</code></pre>
        <p>A delivered alert body looks like:</p>
        <pre><code className="language-json">{`{
  "monitor_id": "w_7tIxfwKc",
  "type": "liq_warn",
  "ts": 1781145885.81,
  "asset": "BTC",
  "direction": "long",
  "mark": 61995,
  "liquidation_price": 49910,
  "distance_pct": 19.49,
  "threshold_pct": 25,
  "funding_accum_est": -0.0001
}`}</code></pre>
        <p>
          Failed deliveries retry with backoff, and every alert is recorded server-side regardless
          — the status endpoint is the source of truth. Webhook targets are SSRF-guarded
          (public-unicast hosts only, re-checked at send time, redirects refused).
        </p>

        <h2>Production: $5 per position per 30 days, settled by your agent</h2>
        <p>
          <code>POST /v1/watch/position</code> is identical to the trial endpoint but runs 30 days.
          It&apos;s paid-only via{' '}
          <a href="https://www.x402.org/" target="_blank" rel="noopener" className="text-accent">x402</a>:
          calling it unpaid returns a standard <code>402</code> quoting <strong>$5.00 USDC</strong>{' '}
          on Base or Solana, and any x402-capable client (Coinbase AgentKit, AgentCash, x402-fetch)
          completes payment automatically — no signup, no API key, no card. Renewal is the same
          motion: <code>POST /v1/watch/extend</code> with your <code>{`{monitor_id, token}`}</code>{' '}
          adds 30 days (it&apos;s also how a trial upgrades without re-registering).
        </p>
        <p>
          The economics are deliberately lopsided: a DIY loop polling{' '}
          <code>liquidation-price</code> once a minute past the free tier costs ~$7.20/day in
          per-call fees. Watch is $5 for 30 days, checks just as often, folds in funding drift, and
          you don&apos;t babysit a scheduler.
        </p>

        <h2>The API surface</h2>
        <ul>
          <li><code>POST /v1/watch/trial</code> — free 48h monitor, one per IP per 30 days</li>
          <li><code>POST /v1/watch/position</code> — <strong>$5.00</strong> / position / 30 days (x402)</li>
          <li><code>POST /v1/watch/extend</code> — <strong>$5.00</strong>, +30 days, also upgrades a trial</li>
          <li><code>GET /v1/watch/{'{monitor_id}'}</code> — free status + alert history (token auth)</li>
          <li><code>DELETE /v1/watch/{'{monitor_id}'}</code> — free cancel</li>
        </ul>
        <p>
          All of it is exposed over MCP too — the hosted server at{' '}
          <code>https://mcp.quantoracle.dev/mcp</code> includes <code>watch_trial</code>,{' '}
          <code>watch_position</code>, and <code>watch_extend</code> alongside the other 76 tools,
          so an MCP agent can register a monitor as a tool call.
        </p>

        <h2>Design notes (what Watch deliberately is not)</h2>
        <p>
          Watch reads public market data and sends webhooks. It holds <strong>no exchange keys, no
          custody, no execution path</strong> — the worst possible failure is a missed alert, and a
          watcher heartbeat is published at{' '}
          <a href="https://api.quantoracle.dev/health" rel="noopener">/health</a>{' '}
          (<code>watcher_heartbeat_age_s</code>) so you can verify the loop is alive before
          trusting it. Capacity is capped (200 active monitors, 5 per IP) so check cadence
          never degrades. Alerts are informational, not financial advice.
        </p>

        <h2>Related</h2>
        <ul>
          <li>
            <Link href="/writing/live-crypto-data-for-agents" className="text-accent">
              Live crypto volatility &amp; funding for agents
            </Link>{' '}
            — the data tier Watch is built on (fetch fresh vol/funding yourself, one call)
          </li>
          <li>
            <Link href="/writing/chaining-x402-paid-tool-calls" className="text-accent">
              Chaining x402 paid tool calls
            </Link>{' '}
            — how agents settle the $5 payment automatically
          </li>
          <li>
            <Link href="/crypto-liquidation-calculator" className="text-accent">
              Crypto liquidation calculator
            </Link>{' '}
            — the one-shot version of the math Watch runs on a loop
          </li>
          <li>
            <Link href="/pricing" className="text-accent">Pricing</Link> — Watch, the live data
            tier, and the x402 settlement model in full
          </li>
        </ul>
      </article>

      <WritingRelated slug="crypto-liquidation-alerts-for-agents" />

      <div className="mt-12">
        <AffiliateCta subId="writing-crypto-liquidation-alerts" category="compare" />
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
