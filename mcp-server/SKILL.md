---
name: quantoracle
description: 63 deterministic quantitative finance calculations via MCP. Options pricing, Greeks, implied volatility, exotic derivatives, risk metrics, portfolio optimization, Monte Carlo simulation, statistics, crypto/DeFi, macro/FX, time value of money.
version: 2.1.1
metadata:
  openclaw:
    requires:
      bins:
        - node
    emoji: "\U0001F4CA"
    homepage: https://github.com/QuantOracledev/quantoracle
---

# QuantOracle

63 deterministic quant computation tools for AI agents. Every tool accepts JSON and returns JSON. Same inputs always produce same outputs.

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

## Pricing

1,000 free calls per day. After that, pay-per-call via x402 (USDC on Base):

- $0.002 — Simple formulas (z-score, APY convert, TVM)
- $0.005 — Medium computation (Black-Scholes, Kelly, indicators)
- $0.008 — Complex computation (exotic derivatives, regression, GARCH)
- $0.015 — Heavy optimization (Monte Carlo, portfolio optimize, vol surface)

## Usage

Ask the agent to use QuantOracle tools for any quantitative finance calculation. Examples:

- "Price a call option on AAPL at strike $200, spot $195, 30 days to expiry, 25% vol"
- "Calculate the optimal Kelly fraction for a strategy with 55% win rate, 1.2:1 reward-to-risk"
- "Run a Monte Carlo simulation of a $100 stock with 20% vol over 1 year"
- "What's the implied volatility if this option is trading at $5.50?"
- "Calculate impermanent loss for an ETH/USDC v3 position between $2000-$4000"
