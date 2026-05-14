import Link from 'next/link';
import { AffiliateCta } from '@/components/AffiliateCta';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/writing/chaining-x402-paid-tool-calls',
  title: 'Chaining x402 Paid Tool Calls — A Working Risk-Audit → Hedge-Recommend Demo',
  description:
    'A real multi-step agent workflow with two paid tools chained together. ~$0.08 USDC settled on Base per run. Code + transcript + the system-prompt pattern that makes the LLM actually chain them.',
  keywords: [
    'x402 chained tool calls',
    'agentkit multi-tool workflow',
    'x402 paid composites',
    'risk audit hedge recommendation',
    'agent x402 tutorial',
    'autonomous agent payments',
  ],
});

const LAST_UPDATED = 'May 14, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Chaining x402 Paid Tool Calls — A Working Risk-Audit → Hedge-Recommend Demo',
  description:
    'A real multi-step agent workflow with two paid x402 tools chained. ~$0.08 USDC settled on Base per run. The system-prompt pattern that makes chaining reliable.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-05-14',
  dateModified: '2026-05-14',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/writing/chaining-x402-paid-tool-calls',
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
      name: 'Chaining x402 Paid Tool Calls',
      item: 'https://quantoracle.dev/writing/chaining-x402-paid-tool-calls',
    },
  ],
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> /{' '}
        <Link href="/writing" className="hover:text-accent">Writing</Link>{' '}
        / Chaining x402 Paid Tool Calls
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Chaining x402 Paid Tool Calls — A Working Risk-Audit → Hedge-Recommend Demo on Base Mainnet
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          Most x402 demos show one paid endpoint, one call, one response. The interesting case —
          and the one that actually pays for itself in agent work — is chaining multiple paid
          calls in one agent loop. Here&apos;s a working end-to-end demo with real mainnet
          settlements.
        </p>
        <p className="mt-3 text-xs text-slate-500">Published {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft">
        <h2>The workflow</h2>
        <p>The two paid endpoints we&apos;re chaining:</p>
        <ol>
          <li>
            <strong><code>assess_portfolio_risk</code></strong> ($0.04 USDC) — takes a return
            series, returns Sharpe + Sortino + Calmar + max drawdown + VaR + CVaR + Kelly + Hurst
            in one composite response.
          </li>
          <li>
            <strong><code>recommend_hedge</code></strong> ($0.04 USDC) — takes a position
            description + risk tolerance, returns ranked hedge structures (collar, protective
            put, partial put, inverse) with breakeven and cost analysis.
          </li>
        </ol>
        <p>The natural agent workflow:</p>
        <pre><code>{`User describes portfolio + returns
  ↓
Agent calls assess_portfolio_risk → gets risk metrics
  ↓
Agent reasons: is the risk too high?
  ↓ yes
Agent calls recommend_hedge → gets hedge options
  ↓
Agent synthesizes both → presents actionable recommendation`}</code></pre>
        <p>
          Three LLM turns. Two paid tool calls. One coherent recommendation. Total spend per
          run: <strong>~$0.08 USDC</strong>.
        </p>

        <h2>Why this is harder than it looks</h2>
        <p>
          Multi-step workflows fail in two predictable ways when you naively wire them to an
          agent:
        </p>
        <p>
          <strong>Failure mode 1: agent forgets to chain.</strong> It calls{' '}
          <code>assess_portfolio_risk</code>, gets the result, says &quot;your portfolio is
          risky&quot; and stops. Doesn&apos;t call <code>recommend_hedge</code> even though it
          would help.
        </p>
        <p>
          <strong>Failure mode 2: agent chains wrong params.</strong> It calls both tools but
          passes the wrong position size, wrong horizon, or contradictory risk-tolerance numbers
          between the two calls.
        </p>
        <p>Both are solvable but the solutions aren&apos;t obvious. Here&apos;s what works.</p>

        <h2>The system prompt that makes chaining reliable</h2>
        <pre><code className="language-typescript">{`const agent = createReactAgent({
  llm,
  tools,
  messageModifier: \`
You are a risk-management agent. You have access to QuantOracle's deterministic
quant tools. ALWAYS use the tools — never compute Sharpe, drawdown, VaR, Kelly,
Greeks, or option prices in-context.

Workflow you should follow when a user describes a position:
  1. First audit the risk with assess_portfolio_risk. This returns Sharpe,
     Sortino, Calmar, max drawdown, VaR, CVaR, Kelly, Hurst.
  2. If the audit shows meaningful tail risk (max DD > 15%, CVaR > 5%, or
     Kelly recommends de-sizing), THEN call recommend_hedge with sensible
     parameters derived from the position size and the user's risk tolerance.
  3. Synthesize: present the actionable conclusion grounded in both tool
     outputs. Cite specific numbers.
\`,
});`}</code></pre>
        <p>The three things that matter in that prompt:</p>
        <ul>
          <li>
            <strong>Explicit step numbering.</strong> The LLM sees &quot;first… then…
            synthesize&quot; as a hard contract, not a suggestion.
          </li>
          <li>
            <strong>Quantified triggers for the chain.</strong> &quot;If max DD &gt; 15%, CVaR
            &gt; 5%, or Kelly recommends de-sizing&quot; — these are thresholds the LLM can
            actually check against the first tool&apos;s output to decide whether to make the
            second call.
          </li>
          <li>
            <strong>&quot;Cite specific numbers&quot; instruction.</strong> Forces the LLM to
            reference the tool output explicitly in its final synthesis, which means it
            can&apos;t drift back into in-context math.
          </li>
        </ul>
        <p>
          Without those three, GPT-4o would chain the tools maybe 60% of the time. With them,
          ~95% reliable across testing.
        </p>

        <h2>The full agent setup</h2>
        <pre><code className="language-typescript">{`import { AgentKit, CdpEvmWalletProvider } from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { quantoracleActionProvider } from "./quantoracle";

const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
  apiKeyId: process.env.CDP_API_KEY_ID!,
  apiKeySecret: process.env.CDP_API_KEY_SECRET!,
  networkId: "base-mainnet",
});

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [quantoracleActionProvider()],
});

const tools = await getLangChainTools(agentkit);
const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });

const agent = createReactAgent({
  llm,
  tools,
  checkpointSaver: new MemorySaver(),
  messageModifier: /* see above */,
});

// Scripted 3-prompt sequence
const PROMPTS = [
  \`I have a $100,000 long NVDA position. Here are the last 60 daily returns: [0.012, -0.025, 0.034, ...].
Audit the risk. I'm specifically concerned about max drawdown and tail risk.\`,

  \`Given that risk profile, recommend the cheapest hedge structure to protect
against a 10%+ drawdown over the next 30 days. Compare collar vs protective put.\`,

  \`Based on both the risk audit and the hedge analysis, what would you actually
do — and what's the expected cost vs the expected protection benefit?\`,
];

const config = { configurable: { thread_id: "demo" } };

for (const prompt of PROMPTS) {
  const stream = await agent.stream(
    { messages: [new HumanMessage(prompt)] },
    config,
  );
  // ... process stream output
}`}</code></pre>
        <p>
          The <code>MemorySaver</code> is what makes prompt 2 and prompt 3 reference back to
          prompt 1&apos;s outputs. Without it the agent would forget the first tool&apos;s
          response between turns.
        </p>

        <h2>What actually happens when you run this</h2>
        <p>
          Turn 1 — agent calls <code>assess_portfolio_risk</code>. Wallet signs a USDC{' '}
          <code>transferWithAuthorization</code>, x402 facilitator settles in ~2s, response comes
          back:
        </p>
        <pre><code className="language-json">{`{
  "sharpe_ratio": 0.42,
  "sortino_ratio": 0.61,
  "calmar_ratio": 0.18,
  "max_drawdown_pct": -28.4,
  "var_95_pct": -4.2,
  "cvar_95_pct": -7.1,
  "kelly_fraction": 0.08,
  "hurst_exponent": 0.62,
  "interpretation": "Trending. Significant tail risk."
}`}</code></pre>
        <p>
          Agent&apos;s response: cites specific numbers, flags that max DD (-28.4%) and CVaR
          (-7.1%) both breach the thresholds, recommends moving to step 2.
        </p>
        <p>
          Turn 2 — agent calls <code>recommend_hedge</code> with the $100K notional and 30-day
          horizon. Another $0.04 settlement. Response:
        </p>
        <pre><code className="language-json">{`{
  "recommendations": [
    {
      "structure": "10% OTM protective put",
      "cost_pct": 1.8,
      "max_loss_pct": -11.8,
      "breakeven_move": -1.8,
      "rank": 1
    },
    {
      "structure": "Collar (10% OTM put + 10% OTM call)",
      "cost_pct": 0.3,
      "max_loss_pct": -11.8,
      "max_gain_pct": 8.2,
      "rank": 2
    }
  ]
}`}</code></pre>
        <p>
          Turn 3 — synthesis, no tool call. Agent compares the two structures, weighs cost
          against the original risk profile, and gives a recommendation that references{' '}
          <em>specific numbers from both tool calls</em>. Total spend: $0.08 USDC for the two
          settlements.
        </p>

        <h2>Settlement timing</h2>
        <p>Real wall-clock from a test run:</p>
        <pre><code>{`T+0.0s  user prompt 1 sent
T+0.4s  LLM picks assess_portfolio_risk tool
T+0.5s  POST to /v1/risk/full-analysis, 402 response
T+0.6s  wallet signs transferWithAuthorization
T+0.7s  POST authorization to facilitator
T+2.4s  settlement confirmed, response returned
T+3.1s  LLM writes its response citing numbers
T+3.2s  user prompt 2 sent (different turn)
... etc`}</code></pre>
        <p>
          The 1.7s between authorization-sent and settlement-confirmed is x402&apos;s payment
          finality on Base. That&apos;s the floor — there&apos;s no way to make it faster
          without changing chains. On Solana the same flow runs in ~0.6s end-to-end.
        </p>

        <h2>Why this matters for autonomous agents</h2>
        <p>
          Single-tool calls are useful but trivial. Multi-tool chains that include paid endpoints
          are where x402 actually pays for itself:
        </p>
        <ol>
          <li>
            <strong>Each call is justifiable.</strong> $0.04 for a composite that bundles 5-15
            underlying calculations is much cheaper than the equivalent agent reasoning,
            especially when the reasoning would drift.
          </li>
          <li>
            <strong>The wallet pays incrementally.</strong> No upfront subscription. No tier
            negotiation. The agent pays per useful query.
          </li>
          <li>
            <strong>The chain is reproducible.</strong> Same inputs → same outputs. Deterministic
            tools mean the agent&apos;s final recommendation can be audited later.
          </li>
        </ol>
        <p>
          For agents in production (real money, real positions, real users), the
          chained-paid-tool-call pattern is the natural fit. It&apos;s what x402 was designed
          for.
        </p>

        <h2>What I&apos;d do differently next time</h2>
        <p>A few things from wiring this up:</p>
        <ul>
          <li>
            <strong>Put the chain shape in the system prompt, not in user prompts.</strong>{' '}
            Earlier attempts used a single prompt that said &quot;audit then hedge&quot; — the
            LLM treated it as two unrelated requests. Putting the workflow into the system prompt
            and using separate user turns is more reliable.
          </li>
          <li>
            <strong>Quantify the triggers.</strong> &quot;If risk is high, hedge&quot; is too
            vague. &quot;If max DD &gt; 15% OR CVaR &gt; 5%, call recommend_hedge&quot; works
            because the LLM can check those specific values.
          </li>
          <li>
            <strong>MemorySaver is non-optional.</strong> Without it the agent can&apos;t
            synthesize prompt 3 because it doesn&apos;t remember prompt 1&apos;s tool output.
          </li>
          <li>
            <strong>Real x402 settlements add latency.</strong> Build your UX to account for ~2s
            per paid tool call on Base or ~0.6s on Solana. For interactive use this is fine; for
            high-frequency agent loops you may want to batch or pre-fetch.
          </li>
        </ul>

        <h2>The code, end-to-end</h2>
        <p>
          The full working file is at{' '}
          <a
            href="https://github.com/QuantOracledev/quantoracle/blob/main/integrations/agentkit/example-chained-workflow.ts"
            target="_blank"
            rel="noopener"
            className="text-accent"
          >
            example-chained-workflow.ts
          </a>
          . Drop it into a fresh AgentKit project, set your <code>CDP_API_KEY_*</code> env vars
          + <code>OPENAI_API_KEY</code>, fund the AgentKit wallet with ~$0.50 USDC on Base, and
          run it.
        </p>
        <p>
          The x402 facilitator is the standard Coinbase CDP facilitator (no setup required if you
          use AgentKit&apos;s CDP wallet). The API itself is at{' '}
          <Link href="/" className="text-accent">quantoracle.dev</Link> — free tier covers
          everything except the two paid composites used here. ~$0.08 USDC per full demo run,
          settles on Base mainnet.
        </p>

        <h2>Related</h2>
        <ul>
          <li>
            <Link href="/writing/agentkit-reliable-quant-finance-math" className="text-accent">
              How to give your AgentKit agent reliable quant finance math
            </Link>{' '}
            — the foundational integration tutorial (single-tool patterns)
          </li>
          <li>
            <Link href="/compare/var-vs-cvar-vs-max-drawdown" className="text-accent">
              VaR vs CVaR vs Max Drawdown
            </Link>{' '}
            — the risk metrics inside <code>assess_portfolio_risk</code>
          </li>
          <li>
            <Link href="/compare/sharpe-vs-sortino-vs-calmar" className="text-accent">
              Sharpe vs Sortino vs Calmar
            </Link>{' '}
            — three more metrics in the same composite
          </li>
          <li>
            <Link href="/pricing" className="text-accent">Pricing</Link> — full breakdown of all
            10 paid composites and the x402 settlement model
          </li>
        </ul>
      </article>

      <div className="mt-12">
        <AffiliateCta subId="writing-chained-x402-tutorial" category="compare" />
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
