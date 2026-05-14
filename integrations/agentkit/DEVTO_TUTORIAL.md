---
title: How to give your Coinbase AgentKit agent reliable quant finance math in 10 minutes
published: false
description: AgentKit + QuantOracle action provider = Black-Scholes, Kelly, Monte Carlo, and full risk audits as agent tools. Free tier covers the basics; paid composites settle via x402. Works on Base AND Solana.
tags: agentkit, typescript, ai, coinbase
cover_image:
canonical_url:
---

LLMs trying to compute Black-Scholes prices in-context are wrong by 5-30% depending on moneyness. Kelly fractions get flipped. Sharpe ratios get the annualization wrong. The agent can't tell.

That's a fixable problem when the agent has access to grounded tools. Let me show you how to wire 5 deterministic quant finance actions into a Coinbase AgentKit agent in under 10 minutes — Black-Scholes pricing, Kelly Criterion, Monte Carlo, and two paid composites that settle automatically via x402.

## What we're building

By the end of this you'll have an AgentKit agent that handles prompts like:

- *"Price a 30-day NVDA call with strike $185, spot $180, 28% IV"* → returns exact BS price + all Greeks
- *"I have 55% win rate, $150 avg win, $100 avg loss — what's my Kelly?"* → returns full / half / quarter Kelly fractions
- *"Audit risk on these 252 daily returns: [...]"* → returns Sharpe, Sortino, Calmar, max DD, VaR, CVaR, Kelly, Hurst (paid: $0.04 USDC)
- *"Recommend hedges for my $100K long NVDA position over 30 days"* → returns ranked hedge structures (paid: $0.04 USDC)

The free actions cover most use cases. Paid composites pay themselves via the AgentKit wallet — no API key, no signup, no billing setup.

## Why this matters

There are three failure modes when LLMs do financial math in-context:

1. **Black-Scholes drift.** GPT-4o's Greeks are wrong by 5-30% depending on moneyness. The model doesn't flag the uncertainty.
2. **Compound interest skips steps.** A 30-year projection at 8% loses meaningful precision over the token sequence.
3. **Kelly and VaR get mis-applied.** LLMs often confuse arithmetic vs geometric returns, or fail to annualize correctly.

Grounded tools fix all three. The QuantOracle API is byte-exact against textbook implementations (Hull, Lopez de Prado, Kelly, Parkinson) and verified by 120 accuracy benchmarks. Same inputs → same outputs, every time. The agent can cite the specific tool call as the source for any number it presents.

## Setup

### 1. Spin up a fresh AgentKit project

```bash
npx create-onchain-agent
cd your-agent-name
```

This gives you the standard AgentKit template with CDP wallet provisioning + LangChain ReAct loop wired in.

### 2. Drop the QuantOracle action provider into your project

```bash
mkdir -p src/quantoracle
curl -sL https://raw.githubusercontent.com/QuantOracledev/quantoracle/main/integrations/agentkit/quantoracleActionProvider.ts -o src/quantoracle/quantoracleActionProvider.ts
curl -sL https://raw.githubusercontent.com/QuantOracledev/quantoracle/main/integrations/agentkit/schemas.ts -o src/quantoracle/schemas.ts
curl -sL https://raw.githubusercontent.com/QuantOracledev/quantoracle/main/integrations/agentkit/constants.ts -o src/quantoracle/constants.ts
curl -sL https://raw.githubusercontent.com/QuantOracledev/quantoracle/main/integrations/agentkit/index.ts -o src/quantoracle/index.ts
```

Four files, ~800 lines total. No new npm dependencies — the provider uses `zod` and the AgentKit core, both already in the template.

### 3. Wire the provider into your agent

Edit `src/index.ts` (or wherever your AgentKit setup lives):

```ts
import { AgentKit, CdpEvmWalletProvider } from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { quantoracleActionProvider } from "./quantoracle";

const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
  apiKeyId: process.env.CDP_API_KEY_ID!,
  apiKeySecret: process.env.CDP_API_KEY_SECRET!,
  networkId: "base-mainnet",
});

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [quantoracleActionProvider()],   // <-- just add this
});

const tools = await getLangChainTools(agentkit);
const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });
const agent = createReactAgent({
  llm,
  tools,
  checkpointSaver: new MemorySaver(),
  messageModifier: `You are a financial analyst agent with access to deterministic
quant finance tools via QuantOracle. ALWAYS use the tools for any financial math —
never compute Black-Scholes prices, Kelly fractions, Sharpe ratios, or Monte Carlo
simulations in-context. Your computations would drift; the tools are exact.`,
});
```

That's the whole integration. The agent now has 5 new tools and the LLM will pick the right one based on the Zod schemas' `.describe()` annotations.

### 4. Try it

```ts
const response = await agent.invoke({
  messages: [{ role: "user", content: "Price a 1-year ATM call on a $100 stock at 20% vol, 5% rate" }],
});
console.log(response.messages.at(-1).content);
```

Expected output (paraphrased):

> Using the Black-Scholes pricing tool: for a 1-year European call with spot $100, strike $100, risk-free rate 5%, and volatility 20%, the price is **$10.45** with delta 0.637, gamma 0.019, vega 0.375, theta -0.018, rho 0.532. The model is using the standard Black-Scholes-Merton assumptions (log-normal returns, constant volatility, no dividends).

The price is bytes-exact against the analytical formula. The Greeks are similarly exact. No drift, no hallucination.

## How the paid composites work

`assess_portfolio_risk` and `recommend_hedge` are two endpoints that wrap 5-15 calculator calls into a single response. They cost $0.04 USDC each, settled on-chain via x402 on Base mainnet.

**Your AgentKit wallet pays automatically.** You don't write any payment code. When the LLM picks one of these tools, the action provider:

1. POSTs to the endpoint with `Accept: application/x-x402-v2`
2. Receives a 402 response with the payment requirement
3. Asks AgentKit's wallet to sign a USDC `transferWithAuthorization`
4. POSTs the signed authorization back to the facilitator
5. Receives the actual response after settlement (~2 seconds on Base)

The wallet needs ~$0.50 USDC to cover many calls. No API key needed; no signup; no billing setup.

## Bonus: same agent, but on Solana

If you're already in the Solana ecosystem (Jupiter, Drift, Marginfi, etc.), you don't need to bridge to Base. The same QuantOracle action provider works with `SolanaKeypairWalletProvider`:

```ts
import { AgentKit, SolanaKeypairWalletProvider } from "@coinbase/agentkit";
import { quantoracleActionProvider } from "./quantoracle";

const walletProvider = await SolanaKeypairWalletProvider.fromBase58PrivateKey(
  process.env.SOLANA_PRIVATE_KEY!,
  "solana-mainnet",
);

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [quantoracleActionProvider()],
});
// ...rest identical
```

x402 settlement on Solana is sub-second (vs ~2s on Base), which makes Solana the better fit for high-frequency agent workflows. Same exact API, just routed differently. Real settlement evidence: QuantOracle has processed real on-chain x402 transactions on both chains.

## What's actually in those 5 actions

For reference — these are the schemas the LLM sees:

| Action | Cost | What it does |
|---|---|---|
| `price_option` | Free | Black-Scholes pricing for European calls/puts with full Greeks (delta, gamma, vega, theta, rho) |
| `calculate_kelly` | Free | Kelly Criterion: full / half / quarter fractions for given win rate + payoff ratio |
| `simulate_portfolio` | Free | Monte Carlo simulation: thousands of GBM paths, terminal distribution, prob of ruin |
| `assess_portfolio_risk` | $0.04 USDC | Composite audit: Sharpe + Sortino + Calmar + max DD + VaR + CVaR + Kelly + Hurst in one call |
| `recommend_hedge` | $0.04 USDC | Ranked hedge structures (collar, protective put, partial put, inverse) for any position |

The free tier covers 1,000 calls/IP/day, which is enough for most agents. The paid composites are designed for agents making consequential financial decisions where bundling 5-15 calculator calls behind one tool call simplifies the agent's reasoning.

## Verification

If you want to confirm the math before trusting it in production, every endpoint is verified against published textbook values (Hull's "Options, Futures and Other Derivatives", Lopez de Prado's "Advances in Financial Machine Learning", Kelly's 1956 paper, Parkinson 1980, etc.). The full benchmark suite is at [tests/accuracy_benchmarks.py](https://github.com/QuantOracledev/quantoracle/blob/main/tests/accuracy_benchmarks.py) — 120 tests, all green against the live API.

You can also use the 15 free interactive calculators at [quantoracle.dev](https://quantoracle.dev) to verify any agent output by hand. Same engine, same answers.

## Useful prompts to test with

Drop these into your agent's chat to verify everything works:

```
"Price a 30-day put on a $180 stock at strike $175, 25% IV, 5% rate"
"My strategy: 55% win rate, $200 avg win, $100 avg loss. What's the optimal position size?"
"Simulate $100K invested at 7% return / 15% vol over 25 years with $1K/mo contributions"
"Audit risk on these monthly returns: [0.02, -0.01, 0.03, 0.01, -0.04, 0.02, 0.05, -0.01, 0.02, 0.03, -0.02, 0.04]"
"I'm long $50K SOL. Recommend the cheapest 30-day hedge to protect against a 10% drop."
```

The first three are free; the last two will trigger an x402 settlement of $0.04 USDC each.

## What's next

If this pattern works for you, the same approach extends to:

- **Solana variant** — see the `example-agent-solana.ts` file in the repo if you want to run on Solana mainnet instead
- **Chained workflows** — `assess_portfolio_risk` then `recommend_hedge` is a natural pair; the [`example-chained-workflow.ts`](https://github.com/QuantOracledev/quantoracle/blob/main/integrations/agentkit/example-chained-workflow.ts) shows the full multi-call pattern
- **LangChain Python** — if you're on Python instead of TS, `pip install langchain-quantoracle` gets you all 73 endpoints (free tier only by default; opt in to paid composites separately)

The repo is at [github.com/QuantOracledev/quantoracle](https://github.com/QuantOracledev/quantoracle). The upstream PR to coinbase/agentkit is [#1179](https://github.com/coinbase/agentkit/pull/1179) if you'd rather wait for it to merge before integrating.

Questions or feedback? Drop them below — happy to help anyone wiring this into a real agent.
