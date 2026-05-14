# @quantoracle/goat-plugin

Deterministic quant finance tools for the [GOAT SDK](https://github.com/goat-sdk/goat) (Great Onchain Agent Toolkit by Crossmint).

LLMs hallucinate Black-Scholes prices. Greeks drift 5-30% in-context and the
model can't tell. This plugin gives your GOAT agent grounded, deterministic
quant math via the free QuantOracle API.

- **Multi-chain by design.** Works on every chain GOAT supports (EVM + Solana) —
  calculations are pure math, no on-chain reads.
- **15 tools across 4 opt-in bundles** — start with 5 core tools, add options
  / risk / DeFi as your agent needs them.
- **Free tier**: 1,000 calls/IP/day covers 13 of 15 tools — no signup, no
  API key.
- **Paid composites** ($0.04 USDC each) settle via [x402](https://github.com/coinbase/x402)
  on Base or Solana mainnet, using the same wallet GOAT already manages.
- **Adapter-agnostic.** Works with `@goat-sdk/adapter-vercel-ai`,
  `@goat-sdk/adapter-langchain`, `@goat-sdk/adapter-eliza`, or any other
  GOAT adapter.

## Install

```bash
pnpm add @quantoracle/goat-plugin @goat-sdk/core zod
# plus an adapter and wallet, e.g.:
pnpm add @goat-sdk/adapter-vercel-ai @goat-sdk/wallet-viem viem
```

## Quick start (Base, default 5-tool core bundle)

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { viem } from "@goat-sdk/wallet-viem";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { quantoracle } from "@quantoracle/goat-plugin";

const walletClient = createWalletClient({
  account: privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`),
  transport: http(),
  chain: base,
});

const tools = await getOnChainTools({
  wallet: viem(walletClient),
  plugins: [...quantoracle()],
});

const result = await generateText({
  model: openai("gpt-4o"),
  tools,
  maxSteps: 5,
  prompt: "Price a 30-day SPY $500 call with vol=18%, spot=$498, rate=5%.",
});
```

> **Note**: `quantoracle()` returns an array of plugin instances (one per
> bundle), so always spread it: `plugins: [...quantoracle(opts)]`.

## Quick start (Solana)

```ts
import { Keypair, Connection } from "@solana/web3.js";
import { solana } from "@goat-sdk/wallet-solana";
import { quantoracle } from "@quantoracle/goat-plugin";

const connection = new Connection(process.env.SOLANA_RPC_URL!);
const keypair = Keypair.fromSecretKey(/* ... */);

const tools = await getOnChainTools({
  wallet: solana({ keypair, connection }),
  plugins: [...quantoracle({ include: ["core", "defi"] })],
});
```

The plugin doesn't care which chain you're on — the same code works on both.

## Tool bundles

The default ships 5 highest-leverage tools. Opt into more via the `include`
option — bundle keys are `core`, `options`, `risk`, `defi`, or `'all'`.

### `core` (5 tools — always shipped)

| Tool | What it does | Tier |
|---|---|---|
| `price_option` | Black-Scholes call/put with full Greeks | free |
| `calculate_kelly` | Kelly Criterion bet sizing | free |
| `simulate_portfolio` | Monte Carlo distribution + ruin probability | free |
| `assess_portfolio_risk` | Full risk audit (Sharpe + Sortino + Calmar + VaR + CVaR + Kelly + Hurst) | **paid $0.04** |
| `recommend_hedge` | Ranked hedge structures (collar, protective put, etc.) | **paid $0.04** |

### `options` (+4)

`implied_vol`, `binomial_tree` (American options), `payoff_diagram`, `put_call_parity`

### `risk` (+4)

`var_parametric`, `correlation`, `sharpe_ratio`, `zscore`

### `defi` (+2)

`impermanent_loss`, `liquidation_price`

### Bundle selection examples

```ts
// Default — 5 core tools
plugins: [...quantoracle()]

// Options-focused agent — 9 tools
plugins: [...quantoracle({ include: ["core", "options"] })]

// Onchain DeFi trading agent — 7 tools + Uniswap + ERC20
plugins: [
  ...quantoracle({ include: ["core", "defi"] }),
  uniswap(),
  erc20(),
]

// Quant research agent — 13 tools
plugins: [...quantoracle({ include: ["core", "risk", "options"] })]

// All 15 tools
plugins: [...quantoracle({ include: "all" })]
```

The bundle picker matters: a focused tool list lets the model pick the right
tool every time. Past ~20 tools, tool-selection accuracy degrades — only
include what your agent actually needs.

## Paid composite tools (x402)

The two paid core tools (`assess_portfolio_risk`, `recommend_hedge`) cost
$0.04 USDC per call and settle via x402. Wire an `x402PayHandler` that
signs payment requirements with your wallet:

```ts
import { quantoracle } from "@quantoracle/goat-plugin";

const plugins = quantoracle({
  include: "all",
  x402PayHandler: async (paymentRequirements) => {
    // Sign with the same wallet GOAT uses elsewhere. The plugin retries
    // the request automatically with the returned X-PAYMENT header.
    return await signX402Header(walletClient, paymentRequirements);
  },
});

const tools = await getOnChainTools({
  wallet: viem(walletClient),
  plugins: [...plugins],
});
```

See [coinbase/x402](https://github.com/coinbase/x402) for wallet-side signing
on Base (EVM) and Solana.

## Why deterministic math matters for onchain agents

If your agent makes onchain trading decisions based on LLM-computed Greeks,
that 5-30% drift compounds into bad sizing, bad hedges, and on-chain PnL
that doesn't match what the agent expected. The composability is the attack
surface — one bad Greek breaks every downstream tool call.

QuantOracle's endpoints are pure-function HTTP: same inputs, same outputs.
Citation-tested against Hull / Wilmott / Lopez de Prado. Sub-70ms per call.

## Compose with other GOAT plugins

```ts
const tools = await getOnChainTools({
  wallet: viem(walletClient),
  plugins: [
    ...quantoracle({ include: ["core", "defi"] }),  // quant math
    uniswap(),                                        // DEX trades
    erc20(),                                          // token balances
    coingecko(),                                      // price data
  ],
});
```

The agent picks Black-Scholes for option fair value, Kelly for sizing,
CoinGecko for the current price, then Uniswap to execute — one loop.

## Need all 73 endpoints?

This plugin exposes 15 curated tools. The full QuantOracle API has 73
endpoints (FX/macro, fixed income, technicals, derivatives exotics, TVM,
etc.) plus a `/v1/batch` endpoint for bulk computation. For full coverage:

- **REST API directly**: every endpoint accepts JSON, returns JSON,
  CORS-enabled. Browse <https://quantoracle.dev/api-docs>.
- **`/v1/batch` for bulk computation**: wraps up to 100 sub-requests into a
  single HTTP call. Charged as the sum of the component prices — same
  per-call cost, one HTTP roundtrip, one x402 settlement. Useful for
  multi-asset portfolio audits or option-chain sweeps where you know which
  computations to run up front.
- **QuantOracle MCP server**: dynamic tool discovery — best for
  general-purpose agents that need full breadth.

## Related packages

- [`@quantoracle/agentkit`](https://github.com/QuantOracledev/quantoracle/tree/main/integrations/agentkit) — Coinbase AgentKit ActionProvider
- [`@quantoracle/ai-tools`](https://github.com/QuantOracledev/quantoracle/tree/main/integrations/vercel-ai) — Vercel AI SDK tools (non-onchain)
- [`langchain-quantoracle`](https://pypi.org/project/langchain-quantoracle/) — LangChain (Python)

## License

MIT.
