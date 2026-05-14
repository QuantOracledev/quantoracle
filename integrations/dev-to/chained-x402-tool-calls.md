---
title: Chaining x402 paid tool calls — a working risk-audit → hedge-recommend demo on Base mainnet
published: false
description: A real multi-step agent workflow with two paid tools chained together. ~$0.08 USDC settled on Base per run. Code + transcript + the system-prompt pattern that makes the LLM actually chain them.
tags: web3, ai, tutorial, typescript
cover_image:
canonical_url:
---

Most x402 demos show one paid endpoint, one call, one response. That's the demo. The interesting case — and the one that actually pays for itself in agent work — is **chaining multiple paid calls in one agent loop**.

I built a working end-to-end demo of this against a real x402 API (mainnet, real USDC, ~$0.08 per run). Here's what it looks like, what makes it work, and the system-prompt pattern that gets the LLM to reliably chain the calls.

## The workflow

The two paid endpoints I'm chaining:

1. **`assess_portfolio_risk`** ($0.04 USDC) — takes a return series, returns Sharpe + Sortino + Calmar + max drawdown + VaR + CVaR + Kelly + Hurst in one composite response.
2. **`recommend_hedge`** ($0.04 USDC) — takes a position description + risk tolerance, returns ranked hedge structures (collar, protective put, partial put, inverse) with breakeven and cost analysis.

The natural agent workflow:

```
User describes portfolio + returns
  ↓
Agent calls assess_portfolio_risk → gets risk metrics
  ↓
Agent reasons: is the risk too high?
  ↓ yes
Agent calls recommend_hedge → gets hedge options
  ↓
Agent synthesizes both → presents actionable recommendation
```

Three LLM turns. Two paid tool calls. One coherent recommendation.

## Why this is harder than it looks

Multi-step workflows fail in two predictable ways when you naively wire them to an agent:

**Failure mode 1: agent forgets to chain.** It calls `assess_portfolio_risk`, gets the result, says "your portfolio is risky" and stops. Doesn't call `recommend_hedge` even though it would help.

**Failure mode 2: agent chains wrong params.** It calls both tools but passes the wrong position size, wrong horizon, or contradictory risk-tolerance numbers between the two calls.

Both are solvable but the solutions aren't obvious. Here's what works.

## The system prompt that makes chaining reliable

```ts
const agent = createReactAgent({
  llm,
  tools,
  messageModifier: `
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
`,
});
```

The three things that matter in that prompt:

- **Explicit step numbering.** The LLM sees "first… then… synthesize" as a hard contract, not a suggestion.
- **Quantified triggers for the chain.** "If max DD > 15%, CVaR > 5%, or Kelly recommends de-sizing" — these are thresholds the LLM can actually check against the first tool's output to decide whether to make the second call.
- **"Cite specific numbers" instruction.** Forces the LLM to reference the tool output explicitly in its final synthesis, which means it can't drift back into in-context math.

Without those three, GPT-4o would chain the tools maybe 60% of the time. With them, ~95% reliable across my testing.

## The full agent setup

```ts
import { AgentKit, CdpEvmWalletProvider } from "@coinbase/agentkit";
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
  `I have a $100,000 long NVDA position. Here are the last 60 daily returns: [0.012, -0.025, 0.034, ...].
Audit the risk. I'm specifically concerned about max drawdown and tail risk.`,

  `Given that risk profile, recommend the cheapest hedge structure to protect
against a 10%+ drawdown over the next 30 days. Compare collar vs protective put.`,

  `Based on both the risk audit and the hedge analysis, what would you actually
do — and what's the expected cost vs the expected protection benefit?`,
];

const config = { configurable: { thread_id: "demo" } };

for (const prompt of PROMPTS) {
  const stream = await agent.stream(
    { messages: [new HumanMessage(prompt)] },
    config,
  );
  for await (const chunk of stream) {
    if ("agent" in chunk) {
      const last = chunk.agent.messages[chunk.agent.messages.length - 1];
      if (last?.content) console.log(`\nAgent:\n${last.content}\n`);
    } else if ("tools" in chunk) {
      for (const msg of chunk.tools.messages || []) {
        console.log(`  [tool ${msg.name}]:`, msg.content.slice(0, 200));
      }
    }
  }
}
```

The `MemorySaver` is what makes prompt 2 and prompt 3 reference back to prompt 1's outputs. Without it the agent would forget the first tool's response between turns.

## What actually happens when you run this

Turn 1 — agent calls `assess_portfolio_risk`. Wallet signs a USDC `transferWithAuthorization`, x402 facilitator settles in ~2s, response comes back:

```json
{
  "sharpe_ratio": 0.42,
  "sortino_ratio": 0.61,
  "calmar_ratio": 0.18,
  "max_drawdown_pct": -28.4,
  "var_95_pct": -4.2,
  "cvar_95_pct": -7.1,
  "kelly_fraction": 0.08,
  "hurst_exponent": 0.62,
  "interpretation": "Trending. Significant tail risk."
}
```

Agent's response: cites specific numbers, flags that max DD (-28.4%) and CVaR (-7.1%) both breach the thresholds, recommends moving to step 2.

Turn 2 — agent calls `recommend_hedge` with the $100K notional and 30-day horizon. Another $0.04 settlement. Response:

```json
{
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
    },
    { ... }
  ]
}
```

Turn 3 — synthesis, no tool call. Agent compares the two structures, weighs cost against the original risk profile, and gives a recommendation that references *specific numbers from both tool calls*. Total spend: $0.08 USDC for the two settlements.

## Settlement timing

Real wall-clock from my test run:

```
T+0.0s  user prompt 1 sent
T+0.4s  LLM picks assess_portfolio_risk tool
T+0.5s  POST to /v1/risk/full-analysis, 402 response
T+0.6s  wallet signs transferWithAuthorization
T+0.7s  POST authorization to facilitator
T+2.4s  settlement confirmed, response returned
T+3.1s  LLM writes its response citing numbers
T+3.2s  user prompt 2 sent (different turn)
... etc
```

The 1.7s between authorization-sent and settlement-confirmed is x402's payment finality on Base. That's the floor — there's no way to make it faster without changing chains. On Solana the same flow runs in ~0.6s end-to-end (different test, different facilitator).

## Why this matters for autonomous agents

Single-tool calls are useful but trivial. Multi-tool chains that include paid endpoints are where x402 actually pays for itself:

1. **Each call is justifiable.** $0.04 for a composite that bundles 5-15 underlying calculations is much cheaper than the equivalent agent reasoning, especially when the reasoning would drift.
2. **The wallet pays incrementally.** No upfront subscription. No tier negotiation. The agent pays per useful query.
3. **The chain is reproducible.** Same inputs → same outputs. Deterministic tools mean the agent's final recommendation can be audited later.

For agents in production (real money, real positions, real users), the chained-paid-tool-call pattern is the natural fit. It's what x402 was designed for.

## What I'd do differently next time

A few things I learned wiring this up:

- **Put the chain shape in the system prompt, not in user prompts.** Earlier I tried to be cute by having a single prompt that said "audit then hedge" — the LLM treated it as two unrelated requests. Putting the workflow into the system prompt and using separate user turns is more reliable.
- **Quantify the triggers.** "If risk is high, hedge" is too vague. "If max DD > 15% OR CVaR > 5%, call recommend_hedge" works because the LLM can check those specific values.
- **MemorySaver is non-optional.** Without it the agent can't synthesize prompt 3 because it doesn't remember prompt 1's tool output.
- **Real x402 settlements add latency.** Build your UX to account for ~2s per paid tool call on Base or ~0.6s on Solana. For interactive use this is fine; for high-frequency agent loops you may want to batch or pre-fetch.

## The code, end-to-end

The full working file is at [example-chained-workflow.ts](https://github.com/QuantOracledev/quantoracle/blob/main/integrations/agentkit/example-chained-workflow.ts). Drop it into a fresh AgentKit project, set your `CDP_API_KEY_*` env vars + `OPENAI_API_KEY`, fund the AgentKit wallet with ~$0.50 USDC on Base, and run it.

The x402 facilitator is the standard Coinbase CDP facilitator (no setup required if you use AgentKit's CDP wallet). The API itself is at [quantoracle.dev](https://quantoracle.dev) — free tier covers everything except the two paid composites we used here. ~$0.08 USDC per full demo run, settles on Base mainnet.

What chained workflows have you been building? Curious what other paid-tool combinations make sense — I'm thinking pricing → execution, sentiment → sizing, KYB → onramp are all promising pairs but I haven't seen many actually shipped yet.
