# QuantOracle — Solana Agent Kit Integration

Deterministic quantitative finance tools for agents built with [Solana Agent Kit](https://github.com/sendaifun/solana-agent-kit).

## What this provides

11 high-value quant finance actions for Solana Agent Kit agents:

| Action | Description | Price |
|--------|-------------|-------|
| `QUANT_OPTIONS_PRICE` | Black-Scholes + 10 Greeks | Free tier / $0.005 |
| `QUANT_RISK_FULL_ANALYSIS` | Complete risk tearsheet (Sharpe, Sortino, VaR, Kelly, DD, Hurst, CAGR) | $0.04 (paid-only) |
| `QUANT_BACKTEST_STRATEGY` | SMA / RSI / momentum / Bollinger backtest | $0.10 (paid-only) |
| `QUANT_PORTFOLIO_OPTIMIZE` | Max Sharpe / min vol / risk parity weights | Free tier / $0.015 |
| `QUANT_PORTFOLIO_REBALANCE_PLAN` | Exact trades to hit target weights + cost | $0.05 (paid-only) |
| `QUANT_OPTIONS_STRATEGY_OPTIMIZER` | Rank options strategies by outlook + vol view | $0.08 (paid-only) |
| `QUANT_HEDGING_RECOMMEND` | Compare cheapest hedges (protective put, collar, futures, partial) | $0.04 (paid-only) |
| `QUANT_PAIRS_SIGNAL` | Cointegration + Hurst + z-score pairs signal | $0.025 (paid-only) |
| `QUANT_IMPERMANENT_LOSS` | Uniswap v2/v3 IL calculator | Free tier / $0.005 |
| `QUANT_MONTE_CARLO_SIM` | GBM portfolio simulation with contributions/withdrawals | Free tier / $0.015 |
| `QUANT_LIQUIDATION_PRICE` | Liquidation price for leveraged longs/shorts | Free tier / $0.002 |

## Why QuantOracle?

- **63 underlying calculators** across options, derivatives, risk, portfolio, statistics, crypto, FX/macro, TVM
- **Deterministic** — same inputs always produce same outputs
- **Citation-verified** against Hull, Wilmott, Bailey & Lopez de Prado
- **Sub-millisecond to 70ms compute time** per call
- **Free tier**: 1,000 calls/IP/day, no signup
- **Paid tier**: x402 micropayments in USDC on **Base** or **Solana**

## Install

If this is merged into the Solana Agent Kit monorepo under `plugin-misc`, it's enabled automatically with the plugin. To use standalone:

```bash
pnpm add solana-agent-kit zod
```

Copy the files from `src/actions/` and `src/tools/` into your project, or import directly.

## Usage

```ts
import { SolanaAgentKit } from "solana-agent-kit";
import {
  quantOptionsPriceAction,
  quantBacktestStrategyAction,
  quantRiskFullAnalysisAction,
} from "./quantoracle/actions";

const agent = new SolanaAgentKit(
  process.env.SOLANA_PRIVATE_KEY!,
  process.env.RPC_URL!,
  { OPENAI_API_KEY: process.env.OPENAI_API_KEY! }
);

// Register actions and use via LangChain/Vercel AI SDK/OpenAI tool wrappers
const result = await quantOptionsPriceAction.handler(agent, {
  S: 100,
  K: 105,
  T: 0.5,
  sigma: 0.2,
  r: 0.05,
  type: "call",
});
console.log(result);
// { status: "success", price: 4.5817, greeks: {...}, ... }
```

## Payments

Past the 1000 free calls/day per IP, paid endpoints return 402 with x402 payment requirements. This integration does **not** auto-pay — pair it with an x402-capable HTTP client (like `x402-fetch`) to handle payments transparently. All paid-only composites require payment.

## Links

- QuantOracle API: https://api.quantoracle.dev
- API docs: https://api.quantoracle.dev/docs
- x402 discovery: https://api.quantoracle.dev/.well-known/x402 (Base + Solana)
- Source: https://github.com/QuantOracledev/quantoracle
