import Link from 'next/link';
import { AffiliateCta } from '@/components/AffiliateCta';
import { WritingRelated } from '@/components/WritingRelated';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/writing/batch-quant-api-calls',
  title: 'Batch API Calls for Speed — Price a Whole Option Chain in One Request',
  description:
    'The /v1/batch endpoint bundles up to 100 quant computations into a single HTTP round-trip. A real benchmark: 20 Black-Scholes calls dropped from 7,182 ms sequential to 1,426 ms batched — 5× faster — for the same 0.1 USDC. Request shape, response shape, pricing, and the agent-tool pattern.',
  keywords: [
    'batch api requests',
    'reduce api latency',
    'option chain pricing api',
    'bulk options pricing',
    'batch http requests',
    'batch endpoint',
    'agent api efficiency',
    'parallel api calls',
  ],
});

const LAST_UPDATED = 'June 2, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Batch API Calls for Speed — Price a Whole Option Chain in One Request',
  description:
    'The /v1/batch endpoint bundles up to 100 quant computations into one HTTP round-trip. Real benchmark: 20 Black-Scholes calls, 7,182 ms sequential → 1,426 ms batched (5× faster) for the same 0.1 USDC.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-06-02',
  dateModified: '2026-06-02',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/writing/batch-quant-api-calls',
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
      name: 'Batch API Calls for Speed',
      item: 'https://quantoracle.dev/writing/batch-quant-api-calls',
    },
  ],
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> /{' '}
        <Link href="/writing" className="hover:text-accent">Writing</Link>{' '}
        / Batch API Calls for Speed
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Batch API calls for speed: price a whole option chain in one request
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          When you need 20, 50, or 100 quant calculations at once — a full option chain, a
          parameter sweep, a multi-asset risk pass — firing them one at a time means paying the
          network round-trip tax on every single call. The <code>/v1/batch</code> endpoint bundles
          up to 100 computations into one HTTP round-trip. In a real run below, that turned{' '}
          <strong>7,182 ms into 1,426 ms — a 5× speedup</strong> — for the exact same price.
        </p>
        <p className="mt-3 text-xs text-slate-500">Published {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft">
        <h2>The problem: latency, not compute</h2>
        <p>
          Each QuantOracle calculation is fast — a Black-Scholes price computes server-side in
          roughly 15 ms. But a calculation isn&apos;t the slow part. The slow part is the round
          trip: DNS, TLS, the request crossing the internet to the API, and the response crossing
          back. That&apos;s typically <strong>200–400 ms per call</strong>, and it dwarfs the ~15 ms
          of actual math.
        </p>
        <p>
          So when you loop over an option chain calling <code>/v1/options/price</code> 20 times,
          you pay that round-trip tax 20 times in series. The compute is ~300 ms total; the
          waiting is everything else.
        </p>
        <pre><code>{`for K in strikes:          # 20 strikes
    price(S, K, T, r, sigma)  # 1 HTTP round-trip each
# 20 × ~360 ms = ~7.2 seconds, mostly spent waiting on the network`}</code></pre>

        <h2>The fix: one request, up to 100 computations</h2>
        <p>
          <code>/v1/batch</code> takes a list of sub-requests, runs them all server-side, and
          returns every result in one response. You pay the network round-trip <em>once</em>
          {' '}instead of N times. The body is a list of <code>{`{ endpoint, params }`}</code>{' '}
          objects — and the endpoints can be <strong>mixed</strong>: a few option prices, a Kelly
          sizing, a VaR, all in the same batch.
        </p>
        <pre><code className="language-json">{`POST https://api.quantoracle.dev/v1/batch
Content-Type: application/json

{
  "requests": [
    { "endpoint": "options/price", "params": { "S": 100, "K": 95,  "T": 0.25, "r": 0.05, "sigma": 0.2, "type": "call" } },
    { "endpoint": "options/price", "params": { "S": 100, "K": 100, "T": 0.25, "r": 0.05, "sigma": 0.2, "type": "call" } },
    { "endpoint": "options/price", "params": { "S": 100, "K": 105, "T": 0.25, "r": 0.05, "sigma": 0.2, "type": "call" } },
    { "endpoint": "risk/kelly",    "params": { "win_prob": 0.55, "win_loss_ratio": 1.8 } }
  ]
}`}</code></pre>
        <p>The response preserves order and reports per-item status, so a single bad input
        doesn&apos;t sink the whole batch:</p>
        <pre><code className="language-json">{`{
  "batch_size": 4,
  "total_price_usdc": 0.025,
  "ms": 64.1,
  "results": [
    { "endpoint": "options/price", "status": 200, "data": { "price": 6.58, "greeks": { ... } } },
    { "endpoint": "options/price", "status": 200, "data": { "price": 4.61, "greeks": { ... } } },
    { "endpoint": "options/price", "status": 200, "data": { "price": 3.07, "greeks": { ... } } },
    { "endpoint": "risk/kelly",    "status": 200, "data": { "kelly_fraction": 0.30, ... } }
  ]
}`}</code></pre>
        <p>
          Each result carries its own <code>status</code>. A sub-request that fails validation
          comes back as <code>{`{ "status": 422, "data": { "error": ... } }`}</code> in its slot —
          the other 99 results are unaffected. Match results to requests by index; the order out is
          the order in.
        </p>

        <h2>The benchmark (a real run)</h2>
        <p>
          Twenty Black-Scholes call prices across a strike ladder ($80–$175), measured two ways
          from the same machine against the live API:
        </p>
        <pre><code>{`N requests           : 20
Sequential wall-clock:  7,182 ms      (one HTTP round-trip per call)
Batch wall-clock     :  1,426 ms      (one round-trip total)
Speedup              :  5.0×
Batch server compute :    320 ms      (server-reported "ms" — ~16 ms/calc)
Price (both ways)    :  0.1 USDC      (20 × $0.005 — batching is not cheaper, just faster)`}</code></pre>
        <p>
          The shape of those numbers is the whole point. The batch did the same 20 calculations in
          ~320 ms of actual compute; the remaining ~1.1 s of its wall-clock is the single network
          round-trip. The sequential version spent ~6.9 s of its 7.2 s <em>waiting on the
          network</em> — paying that round-trip 20 times. Collapse 20 round-trips into 1 and the
          latency tax collapses with it.
        </p>
        <p>
          The bigger the batch, the bigger the win: at the 100-request maximum, you replace 100
          round-trips with one. The speedup scales with how network-bound your loop was.
        </p>

        <h2>When batching is the right tool</h2>
        <ul>
          <li>
            <strong>Option chains &amp; vol surfaces.</strong> Price every strike and expiry in one
            shot instead of nesting two loops over the network. Feeds straight into the{' '}
            <Link href="/black-scholes-calculator" className="text-accent">Black-Scholes calculator</Link>{' '}
            math at scale.
          </li>
          <li>
            <strong>Parameter sweeps.</strong> Sweeping volatility from 10% to 80% to plot how an
            option&apos;s Greeks move? That&apos;s 15–70 independent calls — a perfect batch.
          </li>
          <li>
            <strong>Multi-asset risk.</strong> Compute{' '}
            <Link href="/value-at-risk-calculator" className="text-accent">VaR</Link>,{' '}
            <Link href="/sharpe-ratio-calculator" className="text-accent">Sharpe</Link>, and{' '}
            <Link href="/drawdown-calculator" className="text-accent">drawdown</Link> across a book
            of 30 positions in one request rather than 90 separate ones.
          </li>
          <li>
            <strong>Backfills &amp; reports.</strong> Any time you&apos;re generating a table where
            each row is an independent calculation, batch the rows.
          </li>
        </ul>
        <p>
          When is batching <em>not</em> the right tool? When calls are <strong>dependent</strong> —
          when call 2&apos;s inputs come from call 1&apos;s output. Batches run as a set of
          independent computations; there&apos;s no data flow between sub-requests. For dependent,
          multi-step reasoning (audit risk → then recommend a hedge based on the result), you want
          a chained agent loop instead — see{' '}
          <Link href="/writing/chaining-x402-paid-tool-calls" className="text-accent">
            Chaining x402 paid tool calls
          </Link>
          .
        </p>

        <h2>Pricing: batching is about speed, not discount</h2>
        <p>
          A batch costs the <strong>sum of its sub-request prices</strong> — no more, no less.
          Twenty Black-Scholes calls at $0.005 each cost $0.10 whether you fire them sequentially or
          in one batch. Batching buys you latency, not a volume discount.
        </p>
        <p>
          And most of the time it costs nothing: the free tier covers{' '}
          <strong>1,000 calls per IP per day with no API key</strong>, and every one of the 63
          calculator endpoints is free within that quota. A 20-call batch counts as 20 calls
          against your daily free quota — well within reach for development and most production
          loads. You only pay (via x402 USDC micropayments on Base or Solana) once you exceed the
          free tier or call the paid composite endpoints. Full breakdown on the{' '}
          <Link href="/pricing" className="text-accent">pricing page</Link>.
        </p>

        <h2>The code, end to end</h2>
        <p>A runnable Python example — build the batch, send it, read the results back in order:</p>
        <pre><code className="language-python">{`import json, urllib.request

API = "https://api.quantoracle.dev"

def call(path, body):
    req = urllib.request.Request(
        API + path,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

# Price a 20-strike call chain in ONE request
strikes = range(80, 180, 5)
batch = {
    "requests": [
        {
            "endpoint": "options/price",
            "params": {
                "S": 100, "K": k, "T": 0.25,
                "r": 0.05, "sigma": 0.2, "type": "call",
            },
        }
        for k in strikes
    ]
}

out = call("/v1/batch", batch)
print(f"{out['batch_size']} prices in {out['ms']} ms, {out['total_price_usdc']} USDC")

for req, res in zip(batch["requests"], out["results"]):
    if res["status"] == 200:
        print(f"  K={req['params']['K']:>3}  ->  {res['data']['price']:.4f}")
    else:
        print(f"  K={req['params']['K']:>3}  ->  ERROR {res['status']}")`}</code></pre>
        <p>The TypeScript shape is identical — one <code>fetch</code> with a JSON body:</p>
        <pre><code className="language-typescript">{`const res = await fetch("https://api.quantoracle.dev/v1/batch", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    requests: strikes.map((K) => ({
      endpoint: "options/price",
      params: { S: 100, K, T: 0.25, r: 0.05, sigma: 0.2, type: "call" },
    })),
  }),
});
const { results, ms, total_price_usdc } = await res.json();`}</code></pre>

        <h2>Giving an agent one efficient tool instead of a loop</h2>
        <p>
          If you expose quant tools to an LLM agent, batching matters even more. An agent asked to
          &quot;price this whole chain&quot; will, by default, emit one tool call per strike — 20
          sequential round-trips, 20 reasoning steps, 20 chances to drift. Expose a single{' '}
          <code>batch_price</code> tool backed by <code>/v1/batch</code> and the agent makes{' '}
          <em>one</em> tool call that returns the entire chain. Fewer turns, lower latency, and the
          agent reasons over a complete table instead of dribbling in one row at a time.
        </p>
        <pre><code className="language-typescript">{`// A single agent tool that prices an arbitrary set of strikes in one call.
const batchPriceTool = {
  name: "batch_price_options",
  description:
    "Price many options at once. Pass an array of {K, T, sigma, type}; " +
    "returns every price + Greeks in a single response. Use this instead of " +
    "calling the single-option pricer in a loop.",
  schema: z.object({
    S: z.number(),
    r: z.number(),
    legs: z.array(z.object({
      K: z.number(), T: z.number(), sigma: z.number(),
      type: z.enum(["call", "put"]),
    })),
  }),
  func: async ({ S, r, legs }) => {
    const res = await fetch("https://api.quantoracle.dev/v1/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: legs.map((l) => ({
          endpoint: "options/price",
          params: { S, r, ...l },
        })),
      }),
    });
    return (await res.json()).results;
  },
};`}</code></pre>
        <p>
          This is the same lesson as the{' '}
          <Link href="/writing/chaining-x402-paid-tool-calls" className="text-accent">
            chained-tool-call tutorial
          </Link>{' '}
          from the other direction: chain when calls are <em>dependent</em>; batch when they&apos;re{' '}
          <em>independent</em>. Most &quot;do this calculation across a list&quot; tasks are the
          latter.
        </p>

        <h2>Gotchas worth knowing</h2>
        <ul>
          <li>
            <strong>Max 100 sub-requests per batch.</strong> Need more? Chunk into batches of 100
            and send the chunks concurrently — now you&apos;re parallelizing a handful of round
            trips instead of thousands.
          </li>
          <li>
            <strong>Endpoint paths are relative, no leading <code>/v1/</code>.</strong> Use{' '}
            <code>&quot;options/price&quot;</code>, not <code>&quot;/v1/options/price&quot;</code>{' '}
            (a leading/trailing slash is tolerated, but keep it clean). An unknown endpoint rejects
            the whole batch with a 400.
          </li>
          <li>
            <strong>Per-item failures are isolated.</strong> A bad <code>params</code> object comes
            back as a non-200 <code>status</code> in its slot; the rest still compute. Always check
            each result&apos;s <code>status</code> before reading <code>data</code>.
          </li>
          <li>
            <strong>Order is preserved.</strong> <code>results[i]</code> corresponds to{' '}
            <code>requests[i]</code>. Zip them by index.
          </li>
          <li>
            <strong>It&apos;s still N calls for billing/quota.</strong> A 50-call batch consumes 50
            of your 1,000 daily free calls and, past the free tier, costs the sum of the 50 prices.
          </li>
        </ul>

        <h2>The bottom line</h2>
        <p>
          If your code or your agent calls a quant endpoint in a loop, you&apos;re almost certainly
          paying network latency you don&apos;t need to. Collapse the loop into one{' '}
          <code>/v1/batch</code> request and the round-trip tax goes from N× to 1×. In the run above
          that was a 5× speedup on 20 calls, for the same 0.1 USDC — and the win grows with the
          batch size. Same math, same price, a fraction of the wait.
        </p>

        <h2>Related</h2>
        <ul>
          <li>
            <Link href="/writing/chaining-x402-paid-tool-calls" className="text-accent">
              Chaining x402 paid tool calls
            </Link>{' '}
            — the opposite pattern: when calls are <em>dependent</em>, chain instead of batch
          </li>
          <li>
            <Link href="/writing/quant-tools-mcp-server" className="text-accent">
              Add 73 quant tools to your agent with MCP
            </Link>{' '}
            — expose the batch endpoint (and all 73) as agent tools in one config line
          </li>
          <li>
            <Link href="/black-scholes-calculator" className="text-accent">
              Black-Scholes calculator
            </Link>{' '}
            — the per-option math a chain batch runs at scale
          </li>
          <li>
            <Link href="/api-docs" className="text-accent">API docs</Link> — the full endpoint
            catalog you can mix inside a single batch
          </li>
        </ul>
      </article>

      <WritingRelated slug="batch-quant-api-calls" />

      <div className="mt-12">
        <AffiliateCta subId="writing-batch-quant-api-calls" category="compare" />
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
