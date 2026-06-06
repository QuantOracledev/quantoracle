import Link from 'next/link';
import { AffiliateCta } from '@/components/AffiliateCta';
import { WritingRelated } from '@/components/WritingRelated';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/writing/sui-talus-quant-agent',
  title: 'Add Reliable Quant Math to Your Sui / Talus Agent',
  description:
    'Wire deterministic quant-finance tools — Black-Scholes, liquidation price, impermanent loss, Monte Carlo, full risk analysis — into a Sui AI agent (Talus/Nexus, Sui AI Agent Kit, or any MCP host). Two routes: zero-code MCP, or a portable TypeScript tool-pack. Free tier, no API key.',
  keywords: [
    'sui ai agent',
    'talus nexus agent',
    'sui agent kit',
    'quant tools sui',
    'sui defi agent',
    'mcp sui agent',
    'liquidation price agent',
    'deterministic quant tools',
  ],
});

const LAST_UPDATED = 'June 5, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Add Reliable Quant Math to Your Sui / Talus Agent',
  description:
    'Two ways to give a Sui AI agent deterministic quant-finance tools (Black-Scholes, liquidation price, impermanent loss, risk analysis): a zero-code MCP route and a portable TypeScript tool-pack.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-06-05',
  dateModified: '2026-06-05',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/writing/sui-talus-quant-agent',
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
      name: 'Quant Math for Sui / Talus Agents',
      item: 'https://quantoracle.dev/writing/sui-talus-quant-agent',
    },
  ],
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> /{' '}
        <Link href="/writing" className="hover:text-accent">Writing</Link>{' '}
        / Quant Math for Sui / Talus Agents
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Add reliable quant math to your Sui / Talus agent
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          Sui&apos;s agent stack is maturing fast — Talus has verifiable agents live on mainnet via
          its Nexus framework, Atoma runs decentralized inference, and the Sui AI Agent Kit wires
          agents into DeFi protocols over MCP. These agents are great at <em>onchain actions</em>.
          What they&apos;re bad at is <em>math</em>: an LLM asked to price an option or compute a
          liquidation level will produce a confident, wrong number. Here are two ways to ground that
          math in a deterministic engine — one of them takes zero code.
        </p>
        <p className="mt-3 text-xs text-slate-500">Published {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft">
        <h2>The problem: agents that hallucinate numbers</h2>
        <p>
          A Sui DeFi agent that manages a leveraged position on Suilend, or rebalances an LP on
          Cetus, has to answer quantitative questions: <em>Where do I get liquidated? What&apos;s my
          impermanent loss if SUI doubles? What&apos;s the cheapest hedge?</em> If the agent lets the
          LLM do that arithmetic in-context, it drifts — Black-Scholes Greeks routinely come out
          5–30% off, and the model can&apos;t tell. On a position with real money, that&apos;s not a
          rounding error; it&apos;s a liquidation.
        </p>
        <p>
          The fix is the same one every serious agent uses: don&apos;t let the model compute, let it
          call a tool. QuantOracle exposes 73 deterministic quant calculators (plus a batch
          endpoint) behind a plain HTTP API — same inputs, same outputs, every time, citation-tested
          against Hull and Wilmott. The only question is how to wire it into a Sui agent.
        </p>

        <h2>Route A — MCP (recommended, zero code)</h2>
        <p>
          The Sui agent ecosystem is MCP-native — the Sui AI Agent Kit standardizes DeFi tool access
          over the Model Context Protocol, and most agent hosts speak it. QuantOracle runs a hosted
          MCP server that exposes <strong>all 74 tools</strong>. Point your agent at it and you&apos;re
          done — no install, no build, no wallet:
        </p>
        <pre><code className="language-json">{`{
  "mcpServers": {
    "quantoracle": {
      "url": "https://mcp.quantoracle.dev/mcp"
    }
  }
}`}</code></pre>
        <p>
          Or run it over stdio with <code>npx quantoracle-mcp</code>. Either way the agent can now
          call <code>options_price</code>, <code>crypto_liquidation-price</code>,{' '}
          <code>risk_full-analysis</code>, and the rest. The free tier — 1,000 calls per IP per day
          — needs no API key, so this works for any Sui or Talus agent immediately, regardless of
          chain.
        </p>

        <h2>Route B — the portable tool-pack</h2>
        <p>
          If your agent isn&apos;t MCP-based — a custom TypeScript agent, or a framework that wants
          its own tool objects — install the tool-pack instead:
        </p>
        <pre><code>{`npm install @quantoracle/sui-agent-kit zod`}</code></pre>
        <p>
          Every tool is a plain <code>{`{ name, description, schema, execute }`}</code> object (zod
          schema), so it adapts to any TypeScript agent framework in a few lines. Call one directly:
        </p>
        <pre><code className="language-typescript">{`import { quantOracleTools } from "@quantoracle/sui-agent-kit";

const liq = quantOracleTools.find((t) => t.name === "quant_liquidation_price")!;

const result = await liq.execute({
  entry_price: 3.5,      // SUI perp entry
  collateral: 500,
  position_size: 2500,
  leverage: 5,
  direction: "long",
});

console.log(result.liquidation_price);  // deterministic, every time`}</code></pre>
        <p>
          To hand the whole set to a LangChain-style executor (the common bridge for Talus/Nexus
          offchain tools and several Sui kits), the zod schemas plug straight in:
        </p>
        <pre><code className="language-typescript">{`import { DynamicStructuredTool } from "@langchain/core/tools";
import { quantOracleTools } from "@quantoracle/sui-agent-kit";

const tools = quantOracleTools.map(
  (t) =>
    new DynamicStructuredTool({
      name: t.name,
      description: t.description,
      schema: t.schema,
      func: async (args) => JSON.stringify(await t.execute(args)),
    })
);`}</code></pre>

        <h2>A worked example: a Sui DeFi risk agent</h2>
        <p>
          Say your agent watches a leveraged SUI position and an LP. The three questions it needs
          answered map cleanly onto three tools:
        </p>
        <ol>
          <li>
            <strong><code>quant_liquidation_price</code></strong> — how close is the perp to
            liquidation? (free)
          </li>
          <li>
            <strong><code>quant_impermanent_loss</code></strong> — what&apos;s the LP losing vs
            holding as SUI moves? (free)
          </li>
          <li>
            <strong><code>quant_risk_full_analysis</code></strong> — the full tearsheet (Sharpe,
            VaR, CVaR, Kelly leverage, max drawdown) on the strategy&apos;s return series, in one
            call. ($0.04 via x402)
          </li>
        </ol>
        <p>
          The agent calls the two free tools every tick, and the paid composite when it needs a full
          risk read before sizing up. Each number is grounded — when the agent says &quot;you&apos;re
          18% from liquidation and Kelly says de-size,&quot; those are computed values it can defend,
          not vibes.
        </p>

        <h2>Payments: free first, x402 when you scale</h2>
        <p>
          Most of what an agent does fits the free tier (1,000 calls/IP/day, no wallet). Past that,
          and for the paid-only composites, endpoints return an HTTP 402 with{' '}
          <a href="https://www.x402.org/" target="_blank" rel="noopener" className="text-accent">x402</a>{' '}
          payment requirements. x402 settles in USDC on <strong>Base</strong> or{' '}
          <strong>Solana</strong> today — a Sui agent can pay with a Base or Solana wallet through any
          x402-capable client. Native Sui settlement will follow as the x402-on-Sui rail (gasless
          stablecoin transfers) matures. The point: you never pay until you&apos;ve outgrown free,
          and there&apos;s no signup in the way.
        </p>

        <h2>Why deterministic tools beat in-context math</h2>
        <p>
          The whole reason Talus emphasizes <em>verifiable</em> agentic actions is that onchain
          systems need outputs you can trust and reproduce. In-context LLM arithmetic is the
          opposite — non-deterministic and unauditable. Routing the math through a deterministic API
          gives you the same property offchain: the agent&apos;s recommendation is a pure function of
          its inputs, so it can be logged, replayed, and audited later. That&apos;s the bar for an
          agent touching real positions.
        </p>

        <h2>Get started</h2>
        <p>
          The fastest path is Route A — drop the MCP URL into your agent config and start calling.
          The tool-pack source, the curated tool list, and adapter snippets live in the{' '}
          <a
            href="https://github.com/QuantOracledev/quantoracle/tree/main/integrations/sui-agent-kit"
            target="_blank"
            rel="noopener"
            className="text-accent"
          >
            integration on GitHub
          </a>
          . Spot-check any tool&apos;s output against the free{' '}
          <Link href="/crypto-liquidation-calculator" className="text-accent">liquidation</Link> and{' '}
          <Link href="/impermanent-loss-calculator" className="text-accent">impermanent-loss</Link>{' '}
          calculators on the site before you wire it into anything that moves money.
        </p>

        <h2>Related</h2>
        <ul>
          <li>
            <Link href="/writing/quant-tools-mcp-server" className="text-accent">
              Add 73 quant tools to your agent with MCP
            </Link>{' '}
            — the MCP server this integration uses, in depth
          </li>
          <li>
            <Link href="/writing/chaining-x402-paid-tool-calls" className="text-accent">
              Chaining x402 paid tool calls
            </Link>{' '}
            — how the paid composites settle in an agent loop
          </li>
          <li>
            <Link href="/writing/batch-quant-api-calls" className="text-accent">
              Batch API calls for speed
            </Link>{' '}
            — price a whole option chain or scan many positions in one request
          </li>
          <li>
            <Link href="/crypto-liquidation-calculator" className="text-accent">
              Crypto liquidation calculator
            </Link>{' '}
            — the browser version of the tool your agent calls
          </li>
        </ul>
      </article>

      <WritingRelated slug="sui-talus-quant-agent" />

      <div className="mt-12">
        <AffiliateCta subId="writing-sui-talus-quant-agent" category="compare" />
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
