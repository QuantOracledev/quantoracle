# @quantoracle/plugin-quantoracle

QuantOracle plugin for [elizaOS](https://github.com/elizaOS/eliza) — 63 deterministic quant finance calculators + 10 composite workflows. Black-Scholes pricing with Greeks, risk metrics, Monte Carlo, strategy backtests, rebalance planning, hedging recommendations, and more.

> **Try without code:** the same engine powers free interactive calculators at **[quantoracle.dev](https://quantoracle.dev)** — useful for verifying outputs before wiring into an Eliza agent.

## Install

```bash
npm install @quantoracle/plugin-quantoracle
# or
pnpm add @quantoracle/plugin-quantoracle
```

## Usage

```ts
import { AgentRuntime } from "@elizaos/core";
import quantoraclePlugin from "@quantoracle/plugin-quantoracle";

const runtime = new AgentRuntime({
  // ...your config
  plugins: [quantoraclePlugin],
});
```

## Actions shipped in v1 (10 composites + options pricing)

| Action | Description | Price |
|--------|-------------|-------|
| `QUANT_OPTIONS_PRICE` | Black-Scholes + 10 Greeks | Free / $0.005 |
| `QUANT_RISK_FULL_ANALYSIS` | Complete risk tearsheet (Sharpe, VaR, Kelly, DD, Hurst, CAGR) | $0.04 (paid-only) |
| `QUANT_BACKTEST_STRATEGY` | SMA / RSI / momentum / Bollinger backtest | $0.10 (paid-only) |
| `QUANT_OPTIONS_STRATEGY_OPTIMIZER` | Rank options strategies by outlook + vol view | $0.08 (paid-only) |
| `QUANT_HEDGING_RECOMMEND` | Compare cheapest hedges for a position | $0.04 (paid-only) |
| `QUANT_PORTFOLIO_REBALANCE_PLAN` | Exact trades to hit target weights + cost | $0.05 (paid-only) |
| `QUANT_PORTFOLIO_OPTIMIZE` | Max Sharpe / min vol / risk parity | Free / $0.015 |
| `QUANT_MONTE_CARLO_SIM` | GBM portfolio simulation | Free / $0.015 |
| `QUANT_PAIRS_SIGNAL` | Cointegration + Hurst + z-score pairs signal | $0.025 (paid-only) |
| `QUANT_IMPERMANENT_LOSS` | Uniswap v2/v3 IL calculator | Free / $0.005 |
| `QUANT_LIQUIDATION_PRICE` | Leveraged position liquidation price | Free / $0.002 |

## Configuration

Set these in your character config or env:

```json
{
  "settings": {
    "QUANTORACLE_API_URL": "https://api.quantoracle.dev",
    "QUANTORACLE_TIMEOUT_MS": "30000"
  }
}
```

## Pricing & free tier

- **Free tier**: 1,000 calls/IP/day (no auth required)
- **Paid**: x402 micropayments in USDC on **Base** (`eip155:8453`) or **Solana** (`solana:5eykt4...`). This plugin does not auto-pay; pair it with an x402-capable HTTP client (e.g. `x402-fetch`, `x402-axios`, or [AgentCash](https://agentcash.dev)) if you want transparent payments past the free tier.

## Links

- QuantOracle API: https://api.quantoracle.dev
- API docs: https://api.quantoracle.dev/docs
- x402 discovery: https://api.quantoracle.dev/.well-known/x402
- Source: https://github.com/QuantOracledev/quantoracle
- License: MIT
