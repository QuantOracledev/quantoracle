import Link from 'next/link';
import { AffiliateCta } from '@/components/AffiliateCta';
import { WritingRelated } from '@/components/WritingRelated';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/writing/vercel-ai-sdk-quant-tools',
  title: 'Add Reliable Quant Finance Math to Your Vercel AI SDK Agent in 5 Minutes',
  description:
    "Wire 15 deterministic quant tools — Black-Scholes, Kelly, Monte Carlo, VaR, Sharpe, IL, liquidation price — into a Vercel AI SDK agent with a single import. Free tier for most tools, x402 USDC for paid composites. Works with generateText, streamText, and useChat.",
  keywords: [
    'vercel ai sdk quant',
    'vercel ai sdk tools',
    'vercel ai sdk tutorial',
    'ai sdk black scholes',
    'ai sdk options pricing',
    'vercel ai sdk tool calling',
    'usechat tools example',
    'streamtext tools example',
  ],
});

const LAST_UPDATED = 'May 14, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline:
    'Add Reliable Quant Finance Math to Your Vercel AI SDK Agent in 5 Minutes',
  description:
    'Tutorial: wire deterministic quant finance tools (Black-Scholes, Kelly, Monte Carlo, VaR, Sharpe, impermanent loss, liquidation price) into a Vercel AI SDK agent. Works with generateText, streamText, and useChat. Free tier + optional x402 paid composites.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: {
    '@type': 'Organization',
    name: 'QuantOracle',
    url: 'https://quantoracle.dev',
  },
  datePublished: '2026-05-14',
  dateModified: '2026-05-14',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/writing/vercel-ai-sdk-quant-tools',
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
      name: 'Vercel AI SDK Quant Tools',
      item: 'https://quantoracle.dev/writing/vercel-ai-sdk-quant-tools',
    },
  ],
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>{' '}
        /{' '}
        <Link href="/writing" className="hover:text-accent">
          Writing
        </Link>{' '}
        / Vercel AI SDK Quant Tools
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Add Reliable Quant Finance Math to Your Vercel AI SDK Agent in 5 Minutes
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          GPT-4o computing a Black-Scholes price in-context is wrong by ~5%. Greeks
          drift 5–30%. Kelly fractions get the sign right but the magnitude wrong.
          And the model doesn&apos;t know it&apos;s wrong. If your AI SDK app does
          anything quantitative — options pricing, position sizing, portfolio
          projections — it&apos;s eating that error silently.
        </p>
        <p className="mt-3 text-xs text-slate-500">Published {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft">
        <p>
          The fix is the standard pattern: don&apos;t ask the model to compute,
          give it a tool that does. The Vercel AI SDK makes this clean — define a
          tool with a Zod schema and an <code>execute</code> function and the
          model invokes it automatically when the user asks something
          quantitative.{' '}
          <a
            href="https://www.npmjs.com/package/@quantoracle/ai-tools"
            target="_blank"
            rel="noopener"
            className="text-accent hover:underline"
          >
            <code>@quantoracle/ai-tools</code>
          </a>{' '}
          is a single npm install that wires 15 of these tools into your agent.
          Black-Scholes, Kelly Criterion, Monte Carlo, VaR, Sharpe, correlation,
          impermanent loss, liquidation price — the deterministic math that LLMs
          fumble.
        </p>

        <p>
          Here&apos;s how to get it working end-to-end, including the Next.js
          <code>useChat</code> streaming pattern. No API key, no signup, free tier
          covers 13 of the 15 tools.
        </p>

        <h2 id="install">Install</h2>

        <pre><code>{`pnpm add @quantoracle/ai-tools ai zod
pnpm add @ai-sdk/openai  # or any model provider`}</code></pre>

        <p>
          Zero config beyond that. The package ships ESM + CJS + .d.ts, has zero
          runtime dependencies of its own, and the API behind it requires no auth
          for 1,000 calls/day per IP.
        </p>

        <h2 id="first-call">First tool call</h2>

        <pre><code>{`import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { quantoracleTools } from "@quantoracle/ai-tools";

const result = await generateText({
  model: openai("gpt-4o"),
  tools: quantoracleTools(),
  maxSteps: 3,
  prompt:
    "Price a 30-day SPY $500 call with vol=18%, spot=$498, rate=5%. " +
    "Then size a $50k account position with a 55% win rate, " +
    "$1,200 average win, and $800 average loss.",
});

console.log(result.text);`}</code></pre>

        <p>
          What happens: the model reads its tool list, picks{' '}
          <code>price_option</code> for the first half of the prompt, fills in the
          parameters, hits the QuantOracle API (~70ms), gets a deterministic
          response with the option price + full Greeks. Then it picks{' '}
          <code>calculate_kelly</code> for the second half. <code>maxSteps: 3</code>{' '}
          lets the model do both in one response.
        </p>

        <p>
          The output is structured JSON (not Markdown), so it streams cleanly to
          UI components and the model can reason over specific fields rather than
          re-parse strings.
        </p>

        <h2 id="bundles">The bundle picker — pick only the tools your agent needs</h2>

        <p>
          The default <code>quantoracleTools()</code> call ships 5 tools — the
          highest-leverage ones for any quantitative agent. That&apos;s deliberate:
          past ~20 tools, LLM tool selection accuracy drops noticeably. So we
          curate by default and let you opt into more.
        </p>

        <pre><code>{`// Default — 5 core tools
quantoracleTools()

// Options-focused — 9 tools
quantoracleTools({ include: ["core", "options"] })

// Quant research / risk dashboard — 13 tools
quantoracleTools({ include: ["core", "options", "risk"] })

// DeFi onchain agent — 7 tools (adds IL + liquidation price)
quantoracleTools({ include: ["core", "defi"] })

// All 15 tools
quantoracleTools({ include: "all" })`}</code></pre>

        <p>The bundles:</p>

        <ul>
          <li>
            <strong>core (5)</strong>:{' '}
            <Link href="/black-scholes-calculator" className="text-accent hover:underline">
              Black-Scholes pricing
            </Link>
            ,{' '}
            <Link href="/kelly-criterion-calculator" className="text-accent hover:underline">
              Kelly Criterion
            </Link>
            ,{' '}
            <Link
              href="/monte-carlo-simulation-calculator"
              className="text-accent hover:underline"
            >
              Monte Carlo portfolio simulation
            </Link>
            , full risk audit, hedge recommender. The last two are paid composites
            ($0.04 USDC each via x402).
          </li>
          <li>
            <strong>options (+4)</strong>:{' '}
            <Link href="/implied-volatility-calculator" className="text-accent hover:underline">
              Implied volatility solver
            </Link>
            ,{' '}
            <Link href="/american-option-calculator" className="text-accent hover:underline">
              binomial tree
            </Link>{' '}
            for American options, payoff diagram, put-call parity.
          </li>
          <li>
            <strong>risk (+4)</strong>: standalone{' '}
            <Link href="/value-at-risk-calculator" className="text-accent hover:underline">
              VaR
            </Link>
            ,{' '}
            <Link href="/sharpe-ratio-calculator" className="text-accent hover:underline">
              Sharpe
            </Link>{' '}
            with confidence intervals, correlation matrix, z-score for anomaly
            detection.
          </li>
          <li>
            <strong>defi (+2)</strong>:{' '}
            <Link href="/impermanent-loss-calculator" className="text-accent hover:underline">
              impermanent loss
            </Link>{' '}
            (Uniswap v2/v3),{' '}
            <Link href="/crypto-liquidation-calculator" className="text-accent hover:underline">
              liquidation price
            </Link>{' '}
            for leveraged perps.
          </li>
        </ul>

        <h2 id="usechat">Streaming to a Next.js <code>useChat</code> client</h2>

        <p>
          The tools work identically in an API route that streams to{' '}
          <code>useChat</code>:
        </p>

        <pre><code>{`// app/api/chat/route.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { quantoracleTools } from "@quantoracle/ai-tools";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    tools: quantoracleTools({ include: ["core", "options"] }),
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}`}</code></pre>

        <p>
          On the client side, <code>useChat</code> automatically renders tool
          invocations as separate parts of the message. Because the tools return
          structured JSON, you can render them as cards or tables instead of
          parsing markdown:
        </p>

        <pre><code>{`'use client';
import { useChat } from "ai/react";

export default function QuantChat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <strong>{m.role}:</strong>
          {m.parts.map((part, i) => {
            if (part.type === "tool-invocation") {
              const { toolName, result } = part.toolInvocation;
              // Render structured result however you want
              if (toolName === "price_option" && result) {
                return (
                  <OptionCard
                    key={i}
                    price={result.price}
                    greeks={result.greeks}
                  />
                );
              }
            }
            if (part.type === "text") return <span key={i}>{part.text}</span>;
            return null;
          })}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  );
}`}</code></pre>

        <p>
          You get the structured benefit of tool calls (typed fields, no string
          parsing) plus the streaming UX of <code>useChat</code>. The model still
          drives — it picks the tool, validates the arguments against the Zod
          schema, calls <code>execute</code>, then synthesizes a natural-language
          summary citing the structured result.
        </p>

        <h2 id="why">Why deterministic math matters here</h2>

        <p>
          The pitch isn&apos;t &quot;LLMs are bad at math, use a tool.&quot; The
          pitch is more subtle: <em>LLMs are bad at <strong>knowing when they&apos;re wrong</strong> at math</em>.
          A model that&apos;s 5% off on a Black-Scholes price will confidently
          state the price as if it&apos;s exact. A user who builds a hedge on top of
          that gets a hedge sized to the wrong delta. The error compounds.
        </p>

        <p>
          QuantOracle&apos;s endpoints are{' '}
          <a
            href="https://quantoracle.dev/api-docs"
            target="_blank"
            rel="noopener"
            className="text-accent hover:underline"
          >
            pure-function HTTP
          </a>
          : same inputs in, same outputs out, every time. Sub-70ms per call.
          Citation-tested against Hull / Wilmott / Lopez de Prado. There&apos;s no
          model behind them — just deterministic numerical methods, exactly the
          kind of code that&apos;s easy to write once and impossible to do
          reliably from inside a language model.
        </p>

        <p>
          The mental model: the LLM is the part of your agent that&apos;s good at
          choosing <em>what</em> to compute and <em>how</em> to explain the result.
          QuantOracle is the part that&apos;s good at <em>doing</em> the
          computation reliably. That&apos;s the same division of labor as
          arithmetic-via-tool-calling, just applied to quant.
        </p>

        <h2 id="paid-composites">Paid composites (x402) — optional</h2>

        <p>
          Two of the core tools are paid composites: <code>assess_portfolio_risk</code>{' '}
          (Sharpe + Sortino + Calmar + VaR + CVaR + Kelly + Hurst in one call) and{' '}
          <code>recommend_hedge</code> (ranked hedge structures with costs and
          floors). They cost $0.04 USDC each, settled via{' '}
          <a
            href="https://github.com/coinbase/x402"
            target="_blank"
            rel="noopener"
            className="text-accent hover:underline"
          >
            x402
          </a>{' '}
          on Base or Solana mainnet.
        </p>

        <p>
          You don&apos;t need these to get started — the free tier covers the 13
          non-composite tools at 1,000 calls per IP per day. If you do want them,
          wire an x402 payment handler:
        </p>

        <pre><code>{`import { quantoraclePaidTools } from "@quantoracle/ai-tools";

const tools = quantoraclePaidTools({
  include: "all",
  x402PayHandler: async (paymentRequirements) => {
    // Sign payment with your viem wallet client (Base)
    // or @solana/web3.js Keypair (Solana).
    return await signX402Header(paymentRequirements);
  },
});`}</code></pre>

        <p>
          The package retries the request automatically once the payment header
          is signed. The model sees the result as if it were a normal tool call —
          no special handling needed in your prompt.
        </p>

        <AffiliateCta subId="writing-vercel-ai-tutorial" category="compare" />

        <h2 id="bigger-picture">When you need more than 15 tools</h2>

        <p>
          The full QuantOracle API has 73 endpoints — fixed income, FX/macro,
          technical indicators, derivative exotics (barrier/Asian/lookback), TVM,
          GARCH forecasting, cointegration — plus a <code>/v1/batch</code>{' '}
          endpoint that bundles up to 100 sub-requests into one HTTP call. We
          expose 15 in this package because that&apos;s where LLM tool-selection
          still works well. For broader coverage there are three options:
        </p>

        <ul>
          <li>
            <strong>Call the REST API directly</strong>. Every endpoint accepts
            JSON, returns JSON, and is CORS-enabled. Browse the full catalogue at{' '}
            <a
              href="https://quantoracle.dev/api-docs"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener"
            >
              quantoracle.dev/api-docs
            </a>
            .
          </li>
          <li>
            <strong>Use <code>/v1/batch</code> for bulk computation</strong>.
            Charged as the sum of the included sub-request prices — same per-call
            cost as individual endpoints, but one HTTP roundtrip and one x402
            settlement instead of N. Useful when your agent has already decided
            what 50+ computations to run (multi-asset risk audit, option-chain
            sweep, etc.) and wants to dispatch them in one shot.
          </li>
          <li>
            <strong>Use the QuantOracle MCP server</strong>. Best for
            general-purpose agents that need full breadth — the model only sees
            tool definitions for the tools it actually invokes per call, so the
            context cost stays low even with 73 tools available.
          </li>
        </ul>

        <h2 id="related">Related</h2>

        <ul>
          <li>
            <Link
              href="/writing/agentkit-reliable-quant-finance-math"
              className="text-accent hover:underline"
            >
              Same idea but for Coinbase AgentKit
            </Link>{' '}
            — if your agent is built on CDP wallets instead of raw OpenAI.
          </li>
          <li>
            <Link
              href="/writing/chaining-x402-paid-tool-calls"
              className="text-accent hover:underline"
            >
              Chaining x402 paid tool calls
            </Link>{' '}
            — the system-prompt pattern that makes multi-step paid agent loops
            reliable.
          </li>
          <li>
            <Link
              href="/compare/sharpe-vs-sortino-vs-calmar"
              className="text-accent hover:underline"
            >
              Sharpe vs Sortino vs Calmar
            </Link>{' '}
            — head-to-head on the three risk-adjusted return metrics that{' '}
            <code>assess_portfolio_risk</code> returns.
          </li>
        </ul>
      </article>

      <WritingRelated slug="vercel-ai-sdk-quant-tools" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </div>
  );
}
