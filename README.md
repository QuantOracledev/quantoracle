# QuantOracle

53 deterministic quant computation tools for autonomous financial agents.

**quantoracle.dev** | x402 micropayments on Base (USDC)

## Categories

- **Options** (4) — Black-Scholes, implied vol, multi-leg strategy, payoff diagrams
- **Derivatives** (7) — Binomial tree, barrier/Asian/lookback options, chain analysis, put-call parity, vol surface
- **Risk** (6) — Portfolio metrics, Kelly, position sizing, drawdown, VaR, stress test
- **Indicators** (6) — Technical (13 indicators), regime, crossover, Bollinger, Fibonacci, ATR
- **Simulation** (1) — Monte Carlo (GBM, up to 5000 paths)
- **Fixed Income** (4) — Bond pricing, amortization, yield curve interpolation, credit spread
- **Portfolio** (2) — Optimization, risk parity weights
- **Statistics** (8) — Regression, cointegration, Hurst, GARCH, z-score, distribution fit, correlation matrix
- **Crypto/DeFi** (7) — Impermanent loss, APY/APR, liquidation, funding rates, slippage, vesting, rebalance
- **Macro/FX** (7) — Interest rate parity, PPP, forward rates, carry trade, inflation, Taylor rule, real yield

## Quick Start

```bash
pip install fastapi uvicorn
cd api && python quantoracle.py
# API running at http://localhost:8000
# Docs at http://localhost:8000/docs
```

## Pricing

| Tier | Price | Examples |
|------|-------|---------|
| Simple | $0.002 | Z-score, APY converter, Fibonacci, Taylor rule |
| Medium | $0.005 | Black-Scholes, RSI, Kelly, position sizing |
| Complex | $0.008 | Portfolio risk, binomial tree, regression, VaR |
| Heavy | $0.015 | Monte Carlo, GARCH, portfolio optimization |

## Deploy

```bash
# DigitalOcean
bash deploy/deploy.sh

# Cloudflare Worker
cd worker && npm install && npx wrangler deploy
```
