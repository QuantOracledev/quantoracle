---
name: quantoracle
description: 63 deterministic quantitative finance calculators + 10 composite workflows via MCP. Options pricing, Greeks, exotic derivatives, risk metrics, portfolio optimization, Monte Carlo, statistics, crypto/DeFi, FX/macro, TVM, strategy backtesting, rebalance planning, options strategy selection, hedging. 1,000 free calls/IP/day; paid composites $0.04-$0.10 USDC via x402 on Base or Solana.
version: 2.4.1
metadata:
  openclaw:
    requires:
      bins:
        - node
      # The package itself does not require any credentials. The free tier
      # (1,000 calls/IP/day) covers all 73 calculator endpoints with no signup
      # or API key. The 10 composite endpoints are paid-only via x402; the
      # package returns a 402 error when a composite is called without an
      # x402-capable wallet, so no surprise charges or implicit signin.
      credentials: none
      # Optional: if the host environment provides an x402-capable wallet
      # (e.g. AgentKit's CDP wallet), paid endpoints will settle automatically.
      # Without this capability, paid endpoints return 402 cleanly.
      capabilities:
        - x402_wallet  # optional, only needed for paid composites
    payments:
      protocol: x402
      networks:
        - eip155:8453   # Base mainnet
        - solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp  # Solana mainnet
      free_tier:
        limit_per_ip_per_day: 1000
        endpoints: calculator-tier (63 endpoints, $0.002-$0.015 each if paid)
      paid_tier:
        endpoints: composite-only (10 endpoints, $0.04-$0.10 each)
        currency: USDC
        spending_model: per-call (no subscription, no auto-renewal)
        default_behavior: returns 402 if no wallet wired; never spends without explicit wallet capability
    emoji: "\U0001F4CA"
    homepage: https://github.com/QuantOracledev/quantoracle
---

# QuantOracle

63 deterministic quant calculators + 10 composite workflows for AI agents. Every tool accepts JSON and returns JSON. Same inputs always produce same outputs. Paid via x402 micropayments in USDC on Base or Solana.

> **Browser-friendly calculators:** the same math engine is exposed at **[quantoracle.dev](https://quantoracle.dev)** as 12 free interactive calculators (Black-Scholes, Monte Carlo, Kelly, VaR, crypto liquidation, impermanent loss, CAGR, etc.). Useful for spot-checking the API's outputs without writing code.

## Install

```bash
npx quantoracle-mcp
```

Or connect directly via MCP:

```
https://mcp.quantoracle.dev/mcp
```

## Tools

**Options Pricing**: Black-Scholes pricing with 10 Greeks (delta, gamma, theta, vega, rho, vanna, charm, volga, speed, color), implied volatility solver, multi-leg strategy builder, payoff diagrams.

**Exotic Derivatives**: Binomial tree, barrier options, lookback options, Asian options, volatility surface, option chain analysis, put-call parity.

**Risk Metrics**: Portfolio risk (Sharpe, Sortino, max drawdown, VaR, CVaR), Kelly criterion, position sizing, correlation analysis, stress testing, parametric VaR, transaction cost modeling.

**Portfolio Optimization**: Mean-variance (max Sharpe, min variance, target return), risk parity weights.

**Monte Carlo Simulation**: Geometric Brownian Motion with configurable paths, steps, and confidence intervals.

**Statistics**: Linear/polynomial regression, cointegration, Hurst exponent, GARCH forecasting, distribution fitting, correlation matrix, realized volatility, probabilistic Sharpe ratio, z-scores, normal distribution.

**Technical Indicators**: RSI, MACD, Bollinger Bands, ATR, Fibonacci retracement, crossover detection, regime detection.

**Crypto/DeFi**: Impermanent loss (v2/v3), liquidation price, funding rate analysis, DEX slippage, APY/APR conversion, vesting schedules, rebalance thresholds.

**FX**: Interest rate parity, purchasing power parity, forward rates, carry trade analysis.

**Macro**: Taylor Rule, Fisher equation, inflation-adjusted returns, real yield.

**Time Value of Money**: Present value, future value, NPV, IRR, CAGR.

**Composite Workflows (paid-only, bundles multiple calculators)**:
- `backtest/strategy` ($0.10) — SMA crossover, RSI mean reversion, momentum, Bollinger breakout backtests
- `options/spread-scan` ($0.05) — Rank vertical spreads by risk/reward
- `portfolio/rebalance-plan` ($0.05) — Trade list + cost estimate to hit target weights
- `options/strategy-optimizer` ($0.08) — Best options strategies given outlook + vol view
- `hedging/recommend` ($0.04) — Cheapest effective hedge for a position
- `risk/full-analysis` ($0.04) — Complete risk tearsheet (Sharpe, Sortino, VaR, Kelly, drawdown, Hurst, CAGR)
- `portfolio/health` ($0.04) — Risk + correlation + rebalance + stress test
- `trade/evaluate` ($0.025) — Sizing + R/R + Kelly + costs + regime + signals
- `pairs/signal` ($0.025) — Cointegration + Hurst + z-score + hedge ratio signal
- `indicators/regime-classify` ($0.015) — Trend + vol regime + direction + strategy suggestion

## Pricing

1,000 free calls per day per IP. After that, pay-per-call via x402. Payments accepted in **USDC on Base** (`eip155:8453`) or **USDC on Solana** (`solana:5eykt4...`) — every 402 advertises both.

- $0.002 — Simple formulas (z-score, APY convert, TVM)
- $0.005 — Medium computation (Black-Scholes, Kelly, indicators)
- $0.008 — Complex computation (exotic derivatives, regression, GARCH)
- $0.015 — Heavy optimization (Monte Carlo, portfolio optimize, vol surface)
- $0.015–$0.10 — Composite workflows (paid-only, no free tier)

## Usage

Ask the agent to use QuantOracle tools for any quantitative finance calculation. Examples:

- "Price a call option on AAPL at strike $200, spot $195, 30 days to expiry, 25% vol"
- "Calculate the optimal Kelly fraction for a strategy with 55% win rate, 1.2:1 reward-to-risk"
- "Run a Monte Carlo simulation of a $100 stock with 20% vol over 1 year"
- "What's the implied volatility if this option is trading at $5.50?"
- "Calculate impermanent loss for an ETH/USDC v3 position between $2000-$4000"
