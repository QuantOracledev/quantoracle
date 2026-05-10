# quantoracle-mcp

[![npm](https://img.shields.io/npm/v/quantoracle-mcp?label=npm&color=cb3837)](https://www.npmjs.com/package/quantoracle-mcp)
[![MIT License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![x402](https://img.shields.io/badge/x402-USDC%20on%20Base%20%2B%20Solana-0052FF)](https://x402.org)

**Model Context Protocol (MCP) server exposing 73 deterministic quant finance calculators** to AI agents — Claude, ChatGPT, Cursor, Cline, or any MCP-compatible client. Every tool accepts JSON and returns JSON. Same inputs always produce the same outputs.

The math runs on the QuantOracle API; this package is the thin MCP transport layer that lets your agent call those endpoints as native tools.

> **Try the calculators in your browser first:** the same engine powers 12 free interactive calculators at **[quantoracle.dev](https://quantoracle.dev)** — useful for verifying outputs before wiring the MCP server into your agent.

## What's included

73 deterministic financial computation tools across 8 categories:

| Category | Examples |
|---|---|
| **Options pricing** | Black-Scholes, implied vol, payoff diagrams, multi-leg strategies |
| **Derivatives** | Binomial trees, barrier, Asian, lookback, volatility surface |
| **Risk metrics** | Sharpe, Sortino, VaR, CVaR, drawdown, Kelly, position sizing |
| **Portfolio** | Mean-variance optimization, risk parity, rebalancing, health scoring |
| **Statistics** | Regression, cointegration, Hurst, GARCH, distribution fits |
| **Crypto / DeFi** | Impermanent loss, liquidation price, funding rate, DEX slippage |
| **FX** | Interest rate parity, PPP, carry trade, forwards |
| **Macro / TVM** | Taylor Rule, real yield, NPV, IRR, CAGR |

Plus 10 composite workflows that bundle 5-15 calculator calls in a single response: backtest, hedging recommendations, full risk analysis, rebalance planning, options strategy optimizer, etc.

## Install

```bash
npx quantoracle-mcp
```

Or install globally:

```bash
npm install -g quantoracle-mcp
quantoracle-mcp
```

## Configure (Claude Desktop)

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "quantoracle": {
      "command": "npx",
      "args": ["-y", "quantoracle-mcp"]
    }
  }
}
```

## Configure (Cursor / Cline / Continue)

In your MCP settings, add:

- **Command:** `npx`
- **Arguments:** `-y quantoracle-mcp`
- **Environment:** none required for the free tier

## Pricing

| Tier | What you get | What it costs |
|---|---|---|
| **Free** | All 73 endpoints, 1,000 calls per IP per day, no signup, no API key | **$0** |
| **Paid (x402)** | Beyond the free tier; required for the 10 paid composite endpoints | **$0.002–$0.10 USDC per call** depending on complexity |

Paid calls settle automatically via the [x402 protocol](https://x402.org) on **Base mainnet** or **Solana mainnet**. The MCP client (or wrapping framework) is responsible for handling the 402 Payment Required response and retrying with payment headers.

**Default behavior:** the package never spends money on its own. If a paid endpoint is called and no x402-capable wallet is wired into the client, the call returns a 402 error and exits cleanly. No automatic billing, no surprise charges.

**Free-tier endpoints** (calculator-only): every endpoint priced $0.002–$0.015. These are the bulk of the 73 endpoints and cover almost any quant-finance use case.

**Paid-only endpoints** (composites): `/v1/risk/full-analysis`, `/v1/hedging/recommend`, `/v1/backtest/strategy`, `/v1/portfolio/rebalance-plan`, `/v1/options/strategy-optimizer`, `/v1/options/spread-scan`, `/v1/trade/evaluate`, `/v1/portfolio/health`, `/v1/pairs/signal`, `/v1/indicators/regime-classify`. These wrap many calculator calls and are priced $0.04–$0.10.

## Optional environment variables

| Variable | Default | Purpose |
|---|---|---|
| `QUANTORACLE_API_URL` | `https://api.quantoracle.dev` | Override the API endpoint (e.g. for staging or self-hosted) |
| `QUANTORACLE_X402_WALLET` | _(none)_ | If set, the server enables x402 payment for paid endpoints. Without this variable, paid endpoints return 402 and the agent receives a clean error |

No `QUANTORACLE_API_KEY` is required for the free tier. The free tier is rate-limited per source IP, not per account.

## Example — Claude Desktop session

After installing, ask Claude:

> _"Price a 30-day NVDA call with strike $185, spot $180, IV 28%."_

Claude calls the `options/price` tool. Response:

```
Price: $4.92
Greeks: Δ 0.43, Γ 0.043, ν 0.21, Θ -0.034, ρ 0.12
Breakeven: $189.92
```

Or:

> _"Run a Monte Carlo simulation: $100K portfolio, 30 years, 7% return, 16% vol, 4% withdrawal. What's the success rate?"_

Claude calls `simulate/montecarlo`. Response includes terminal-value distribution (P5/P25/median/P75/P95), probability of loss, probability of ruin, and CAGR.

## Resources

- **Browser calculators:** https://quantoracle.dev (12 free calculators)
- **Full API documentation:** https://api.quantoracle.dev/openapi.json
- **Endpoint catalog:** https://api.quantoracle.dev/tools
- **Source repository:** https://github.com/QuantOracledev/quantoracle
- **x402 protocol:** https://x402.org
- **Issues:** https://github.com/QuantOracledev/quantoracle/issues

## License

MIT. See [LICENSE](./LICENSE).
