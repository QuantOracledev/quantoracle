# @quantoracle/ai-tools

Deterministic quant finance tools for the [Vercel AI SDK](https://sdk.vercel.ai/).

LLMs hallucinate Black-Scholes prices. Greeks drift 5-30% in-context and the
model can't tell. This package gives your AI SDK agent grounded, deterministic
quant math via the free QuantOracle API — same inputs always produce the same
outputs, every value tested against Hull / Wilmott / Lopez de Prado.

- **15 tools across 4 opt-in bundles** — start with 5 core tools, add options /
  risk / DeFi as your agent needs them
- **Free tier**: 1,000 calls/IP/day covers 13 of 15 tools — no signup, no API key
- **Paid composites** ($0.04 USDC each) settle via [x402](https://github.com/coinbase/x402)
  on Base or Solana mainnet
- **Drop-in compatible** with `generateText`, `streamText`, `generateObject`,
  and `useChat`. Tools return structured JSON for clean UI rendering.

## Install

```bash
pnpm add @quantoracle/ai-tools ai zod
# plus a model provider, e.g.:
pnpm add @ai-sdk/openai
```

## Quick start (default 5-tool core bundle)

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { quantoracleTools } from "@quantoracle/ai-tools";

const result = await generateText({
  model: openai("gpt-4o"),
  tools: quantoracleTools(),
  maxSteps: 5,
  prompt: "Price a 30-day SPY $500 call with vol=18%, spot=$498, rate=5%.",
});

console.log(result.text);
```

The model picks `price_option`, fills in the parameters, gets a deterministic
response from QuantOracle, and summarises the result.

## Tool bundles

The default ships 5 highest-leverage tools. Opt into more via the `include`
option — bundle keys are `core`, `options`, `risk`, `defi`, or `'all'`.

### `core` (5 tools — always shipped)

| Tool | What it does | Tier |
|---|---|---|
| `price_option` | Black-Scholes call/put with full Greeks | free |
| `calculate_kelly` | Kelly Criterion bet sizing (full / half / quarter) | free |
| `simulate_portfolio` | Monte Carlo terminal distribution + ruin probability | free |
| `assess_portfolio_risk` | Sharpe + Sortino + Calmar + drawdown + VaR + CVaR + Kelly + Hurst in one call | **paid $0.04** |
| `recommend_hedge` | Ranked hedge structures (collar, protective put, partial put, inverse) | **paid $0.04** |

### `options` (+4)

| Tool | What it does |
|---|---|
| `implied_vol` | Newton-Raphson IV solver |
| `binomial_tree` | American/European options via CRR tree |
| `payoff_diagram` | Multi-leg strategy P&L curves + breakevens |
| `put_call_parity` | Parity check + arbitrage detection |

### `risk` (+4)

| Tool | What it does |
|---|---|
| `var_parametric` | Standalone VaR + CVaR (faster than full audit) |
| `correlation` | N×N correlation matrix |
| `sharpe_ratio` | Standalone Sharpe + 95% CI (Lo 2002) |
| `zscore` | Static + rolling z-scores with extreme-value detection |

### `defi` (+2)

| Tool | What it does |
|---|---|
| `impermanent_loss` | Uniswap v2/v3 IL + fee breakeven APY |
| `liquidation_price` | Liquidation price for leveraged perps / margin |

### Bundle selection examples

```ts
// Default — 5 core tools
quantoracleTools()

// Options-focused agent — 9 tools
quantoracleTools({ include: ["core", "options"] })

// DeFi onchain agent — 7 tools
quantoracleTools({ include: ["core", "defi"] })

// Quant research / risk dashboard — 13 tools
quantoracleTools({ include: ["core", "risk", "options"] })

// All 15 tools
quantoracleTools({ include: "all" })
```

The bundle picker is the difference between a focused agent that picks the
right tool every time and a confused agent drowning in 15 descriptions. Pick
the bundles your agent actually needs.

## Paid composite tools (x402)

The two paid tools (`assess_portfolio_risk`, `recommend_hedge`) cost $0.04
USDC per call and settle via x402 on Base or Solana. Wire an `x402PayHandler`
that signs the payment header:

```ts
import { quantoraclePaidTools } from "@quantoracle/ai-tools";
import { signX402Header } from "x402"; // your wallet integration

const tools = quantoraclePaidTools({
  include: "all",
  x402PayHandler: async (requirements) => signX402Header(requirements),
});
```

See the [x402 reference implementation](https://github.com/coinbase/x402) for
wallet-side signing on Base (viem) and Solana (`@solana/web3.js`).

## With `useChat` (Next.js)

```ts
// app/api/chat/route.ts
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
}
```

Tool results stream to the client as structured JSON, so you can render them
directly in your UI instead of re-parsing markdown.

## Why deterministic math matters

LLMs computing Black-Scholes in-context get the price within ~5% but the
Greeks drift 5-30% — and the model can't tell when it's wrong. If your agent
makes trading decisions based on those Greeks, that drift compounds into bad
sizing, bad hedges, and PnL that doesn't match the agent's expectations.

QuantOracle's endpoints are pure-function HTTP: same inputs, same outputs.
Citation-tested against textbook values. Sub-70ms per call.

## Need all 73 endpoints?

This package exposes 15 curated tools across 4 bundles. The full QuantOracle
API has 73 endpoints (FX/macro, fixed income, technicals, derivatives
exotics, TVM, etc.) plus a `/v1/batch` endpoint for bulk computation. For
full coverage:

- **REST API directly**: every endpoint accepts JSON, returns JSON,
  CORS-enabled. Browse <https://quantoracle.dev/api-docs>.
- **`/v1/batch` for bulk computation**: wraps up to 100 sub-requests (any
  mix of endpoints) into one HTTP call. Charged as the sum of the component
  endpoint prices — same per-call cost, but one HTTP roundtrip and one x402
  settlement instead of N. Useful when you've already decided what 50+
  computations to run and want to dispatch them in one shot.
- **QuantOracle MCP server**: dynamic tool discovery — the model only sees
  tool definitions for the tools it actually needs per call. Best for
  general-purpose agents that need breadth.

## Related packages

- [`@quantoracle/agentkit`](https://github.com/QuantOracledev/quantoracle/tree/main/integrations/agentkit) — Coinbase AgentKit ActionProvider
- [`@quantoracle/goat-plugin`](https://github.com/QuantOracledev/quantoracle/tree/main/integrations/goat) — GOAT SDK plugin (multi-chain onchain agents)
- [`langchain-quantoracle`](https://pypi.org/project/langchain-quantoracle/) — LangChain (Python)

## License

MIT.
