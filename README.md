<p align="center">
  <h1 align="center">QuantOracle</h1>
  <p align="center"><strong>The quantitative computation API for autonomous financial agents</strong></p>
  <p align="center">63 deterministic, citation-verified calculators. 1,000 free calls/day. No signup.</p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/quantoracle-mcp"><img src="https://img.shields.io/npm/v/quantoracle-mcp?label=npm&color=cb3837" alt="npm"></a>
  <a href="https://smithery.ai/server/QuantOracle/quantoracle"><img src="https://smithery.ai/badge/QuantOracle/quantoracle" alt="Smithery"></a>
  <a href="https://clawhub.ai"><img src="https://img.shields.io/badge/ClawHub-quantoracle-blueviolet" alt="ClawHub"></a>
  <a href="https://x402.org/ecosystem"><img src="https://img.shields.io/badge/x402-USDC%20on%20Base-0052FF" alt="x402"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
</p>

<p align="center">
  <a href="https://quantoracle.dev">quantoracle.dev</a> &nbsp;|&nbsp;
  <a href="#mcp-server">MCP Server</a> &nbsp;|&nbsp;
  <a href="#x402-payments">x402 Payments</a> &nbsp;|&nbsp;
  <a href="#free-tier">Free Tier</a> &nbsp;|&nbsp;
  <a href="#full-endpoint-reference">All 63 Endpoints</a> &nbsp;|&nbsp;
  <a href="#integrations">Integrations</a>
</p>

---

## Why QuantOracle?

**Every financial agent needs math. QuantOracle is that math.**

- **63 pure calculators** across options, derivatives, risk, portfolio, statistics, crypto/DeFi, FX/macro, and TVM
- **Zero dependencies** on market data, accounts, or third-party APIs -- send numbers in, get numbers out
- **Deterministic** -- same inputs always produce the same outputs, so agents can cache, verify, and chain calls
- **Citation-verified** -- every formula tested against published textbook values (Hull, Wilmott, Bailey & Lopez de Prado)
- **120 accuracy benchmarks** passing with analytical solutions
- **Sub-millisecond** response times on most endpoints
- **Free tier** -- 1,000 calls/IP/day, no API key, no signup, zero friction

QuantOracle is designed to be called repeatedly. An agent running a backtest might call 10+ endpoints per iteration. That's the model -- be the calculator agents reach for every time they need quant math.

---

## Quick Start

```bash
# Call any endpoint -- no setup required
curl -X POST https://api.quantoracle.dev/v1/options/price \
  -H "Content-Type: application/json" \
  -d '{"S": 100, "K": 105, "T": 0.5, "r": 0.05, "sigma": 0.2, "type": "call"}'
```

```json
{
  "call_price": 3.6862,
  "delta": 0.4467,
  "gamma": 0.0281,
  "theta": -0.0113,
  "vega": 0.2653,
  "rho": 0.1989,
  "d1": -0.1331,
  "d2": -0.2745,
  "ms": 0.04
}
```

### Python

```python
import requests

# Black-Scholes pricing
r = requests.post("https://api.quantoracle.dev/v1/options/price", json={
    "S": 100, "K": 105, "T": 0.5, "r": 0.05, "sigma": 0.2, "type": "call"
})
print(r.json()["call_price"])  # 3.6862

# Portfolio risk metrics (22 metrics from a returns series)
r = requests.post("https://api.quantoracle.dev/v1/risk/portfolio", json={
    "returns": [0.01, -0.005, 0.008, -0.003, 0.012, -0.001, 0.006, -0.009, 0.004, 0.002]
})
print(r.json()["sharpe_ratio"])  # Annualized Sharpe

# Kelly Criterion
r = requests.post("https://api.quantoracle.dev/v1/risk/kelly", json={
    "win_prob": 0.55, "win_loss_ratio": 1.5
})
print(r.json()["kelly_fraction"])  # Optimal bet size

# Monte Carlo simulation
r = requests.post("https://api.quantoracle.dev/v1/simulate/montecarlo", json={
    "S0": 10000, "mu": 0.08, "sigma": 0.15, "T": 10, "simulations": 1000
})
print(r.json()["median_terminal"])  # Median portfolio value at year 10
```

### TypeScript

```typescript
const res = await fetch("https://api.quantoracle.dev/v1/options/price", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ S: 100, K: 105, T: 0.5, r: 0.05, sigma: 0.2, type: "call" })
});
const { call_price, delta, gamma, vega } = await res.json();
```

---

## Free Tier

**1,000 free calls per IP per day. No signup. No API key. Just call the API.**

| | Free | Paid (x402) |
|---|---|---|
| **Calls** | 1,000/day | Unlimited |
| **Auth** | None | x402 micropayment header |
| **Endpoints** | All 63 | All 63 |
| **Rate headers** | Yes | Yes |

Every response includes rate limit headers so agents can self-manage:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 2025-01-15T00:00:00Z
```

Check usage anytime:
```bash
curl https://api.quantoracle.dev/usage
```

After 1,000 calls, the API returns `402 Payment Required` with an x402 payment header. Any x402-compatible agent automatically pays and continues:

```
HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: <base64-encoded payment instructions>
```

| Tier | Price | Endpoints |
|------|-------|-----------|
| **Simple** | $0.002 | Z-score, APY/APR, Fibonacci, Bollinger, ATR, Taylor rule, inflation, real yield, PV, FV, NPV, CAGR, normal distribution, Sharpe ratio, liquidation price, put-call parity |
| **Medium** | $0.005 | Black-Scholes, implied vol, Kelly, position sizing, drawdown, regime, crossover, bond amortization, carry trade, IRP, PPP, funding rate, slippage, vesting, rebalance, IRR, realized vol, PSR, transaction cost |
| **Complex** | $0.008 | Portfolio risk, binomial tree, barrier/Asian/lookback options, credit spread, VaR, stress test, regression, cointegration, Hurst, distribution fit, risk parity |
| **Heavy** | $0.015 | Monte Carlo, GARCH, portfolio optimization, option chain analysis, vol surface, yield curve, correlation matrix |

---

## x402 Payments

QuantOracle uses the [x402 protocol](https://x402.org) for pay-per-call micropayments. When an agent exhausts its free tier, the API returns a standard `402` response with payment instructions. x402-compatible agents (Coinbase AgentKit, OpenClaw, etc.) handle this automatically:

1. Agent calls endpoint, gets `402` with `PAYMENT-REQUIRED` header
2. Agent signs a gasless USDC transfer authorization (EIP-3009)
3. Agent resends request with `PAYMENT-SIGNATURE` header
4. Server verifies via CDP facilitator, serves the response, settles on-chain

**No API keys. No subscriptions. No accounts. Just math and micropayments.**

- **Currency**: USDC on Base (chain ID 8453)
- **Settlement**: Via Coinbase Developer Platform facilitator
- **Wallet**: `0xC94f5F33ae446a50Ce31157db81253BfddFE2af6`

---

## MCP Server

QuantOracle is available as a native MCP server with 63 tools. Works with Claude Desktop, Cursor, Windsurf, and any MCP-compatible client.

### Install via npm

```bash
npx quantoracle-mcp
```

### Claude Desktop / Claude Code

Add as a connector in Settings, or add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "quantoracle": {
      "url": "https://mcp.quantoracle.dev/mcp"
    }
  }
}
```

Or run locally via npx:

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

### Remote MCP (Streamable HTTP)

Connect directly to the hosted server — no install required:

```
https://mcp.quantoracle.dev/mcp
```

### Smithery

```bash
npx @smithery/cli mcp add https://server.smithery.ai/QuantOracle/quantoracle
```

### OpenClaw / ClawHub

```bash
clawhub install quantoracle
```

---

## Integrations

QuantOracle is available across multiple agent ecosystems:

| Platform | How to connect |
|----------|---------------|
| **Claude Desktop / Claude Code** | Connector URL: `https://mcp.quantoracle.dev/mcp` |
| **Cursor / Windsurf** | MCP config: `npx quantoracle-mcp` |
| **Smithery** | `npx @smithery/cli mcp add QuantOracle/quantoracle` |
| **OpenClaw / ClawHub** | `clawhub install quantoracle` |
| **npm** | `npx quantoracle-mcp` |
| **x402 ecosystem** | [x402.org/ecosystem](https://x402.org/ecosystem) |
| **REST API** | `https://api.quantoracle.dev/v1/...` |
| **OpenAPI spec** | `https://api.quantoracle.dev/openapi.json` |
| **Swagger UI** | `https://api.quantoracle.dev/docs` |

### Tool Discovery

```bash
# List all 63 tools with paths and pricing
curl https://api.quantoracle.dev/tools

# Health check
curl https://api.quantoracle.dev/health

# Usage check
curl https://api.quantoracle.dev/usage

# MCP server card
curl https://mcp.quantoracle.dev/.well-known/mcp/server-card.json
```

---

## Full Endpoint Reference

### Options (4 endpoints)

| Endpoint | Description | Price |
|----------|-------------|-------|
| `POST /v1/options/price` | Black-Scholes pricing with 10 Greeks (delta through color) | $0.005 |
| `POST /v1/options/implied-vol` | Newton-Raphson implied volatility solver | $0.005 |
| `POST /v1/options/strategy` | Multi-leg options strategy P&L, breakevens, max profit/loss | $0.008 |
| `POST /v1/options/payoff-diagram` | Multi-leg options payoff diagram data generation | $0.005 |

### Derivatives (7 endpoints)

| Endpoint | Description | Price |
|----------|-------------|-------|
| `POST /v1/derivatives/binomial-tree` | CRR binomial tree pricing for American and European options | $0.008 |
| `POST /v1/derivatives/barrier-option` | Barrier option pricing using analytical formulas | $0.008 |
| `POST /v1/derivatives/asian-option` | Asian option pricing: geometric closed-form or arithmetic approximation | $0.008 |
| `POST /v1/derivatives/lookback-option` | Lookback option pricing (floating/fixed strike, Goldman-Sosin-Gatto) | $0.008 |
| `POST /v1/derivatives/option-chain-analysis` | Option chain analytics: skew, max pain, put-call ratios | $0.015 |
| `POST /v1/derivatives/put-call-parity` | Put-call parity check and arbitrage detection | $0.002 |
| `POST /v1/derivatives/volatility-surface` | Build implied volatility surface from market data | $0.015 |

### Risk (8 endpoints)

| Endpoint | Description | Price |
|----------|-------------|-------|
| `POST /v1/risk/portfolio` | 22 risk metrics: Sharpe, Sortino, Calmar, Omega, VaR, CVaR, drawdown | $0.008 |
| `POST /v1/risk/kelly` | Kelly Criterion: discrete (win/loss) or continuous (returns series) | $0.005 |
| `POST /v1/risk/position-size` | Fixed fractional position sizing with risk/reward targets | $0.005 |
| `POST /v1/risk/drawdown` | Drawdown decomposition with underwater curve | $0.005 |
| `POST /v1/risk/correlation` | N x N correlation and covariance matrices from return series | $0.008 |
| `POST /v1/risk/var-parametric` | Parametric Value-at-Risk and Conditional VaR | $0.008 |
| `POST /v1/risk/stress-test` | Portfolio stress test across multiple scenarios | $0.008 |
| `POST /v1/risk/transaction-cost` | Transaction cost model: commission + spread + Almgren market impact | $0.005 |

### Indicators (6 endpoints)

| Endpoint | Description | Price |
|----------|-------------|-------|
| `POST /v1/indicators/technical` | 13 technical indicators (SMA, EMA, RSI, MACD, etc.) + composite signals | $0.005 |
| `POST /v1/indicators/regime` | Trend + volatility regime + composite risk classification | $0.005 |
| `POST /v1/indicators/crossover` | Golden/death cross detection with signal history | $0.005 |
| `POST /v1/indicators/bollinger-bands` | Bollinger Bands with %B, bandwidth, and squeeze detection | $0.002 |
| `POST /v1/indicators/fibonacci-retracement` | Fibonacci retracement and extension levels | $0.002 |
| `POST /v1/indicators/atr` | Average True Range with normalized ATR and volatility regime | $0.002 |

### Statistics (10 endpoints)

| Endpoint | Description | Price |
|----------|-------------|-------|
| `POST /v1/stats/linear-regression` | OLS linear regression with R-squared, t-stats, standard errors | $0.008 |
| `POST /v1/stats/polynomial-regression` | Polynomial regression of degree n with goodness-of-fit metrics | $0.008 |
| `POST /v1/stats/cointegration` | Engle-Granger cointegration test with hedge ratio and half-life | $0.008 |
| `POST /v1/stats/hurst-exponent` | Hurst exponent via rescaled range (R/S) analysis | $0.008 |
| `POST /v1/stats/garch-forecast` | GARCH(1,1) volatility forecast using maximum likelihood estimation | $0.015 |
| `POST /v1/stats/zscore` | Rolling and static z-scores with extreme value detection | $0.002 |
| `POST /v1/stats/distribution-fit` | Fit data to common distributions and rank by goodness of fit | $0.008 |
| `POST /v1/stats/correlation-matrix` | Correlation and covariance matrices with eigenvalue decomposition | $0.015 |
| `POST /v1/stats/realized-volatility` | Realized vol: close-to-close, Parkinson, Garman-Klass, Yang-Zhang | $0.005 |
| `POST /v1/stats/normal-distribution` | Normal distribution: CDF, PDF, quantile, confidence intervals | $0.002 |
| `POST /v1/stats/sharpe-ratio` | Standalone Sharpe ratio with Lo (2002) standard error and 95% CI | $0.002 |
| `POST /v1/stats/probabilistic-sharpe` | Probabilistic Sharpe Ratio (Bailey & Lopez de Prado 2012) | $0.005 |

### Portfolio (2 endpoints)

| Endpoint | Description | Price |
|----------|-------------|-------|
| `POST /v1/portfolio/optimize` | Portfolio optimization: max Sharpe, min vol, or risk parity | $0.015 |
| `POST /v1/portfolio/risk-parity-weights` | Equal risk contribution portfolio weights (Spinu 2013) | $0.008 |

### Fixed Income (4 endpoints)

| Endpoint | Description | Price |
|----------|-------------|-------|
| `POST /v1/fixed-income/bond` | Bond price, Macaulay/modified duration, convexity, DV01 | $0.008 |
| `POST /v1/fixed-income/amortization` | Full amortization schedule with extra payment savings analysis | $0.005 |
| `POST /v1/fi/yield-curve-interpolate` | Yield curve interpolation: linear, cubic spline, Nelson-Siegel | $0.015 |
| `POST /v1/fi/credit-spread` | Credit spread and Z-spread from bond price vs risk-free curve | $0.008 |

### Crypto / DeFi (7 endpoints)

| Endpoint | Description | Price |
|----------|-------------|-------|
| `POST /v1/crypto/impermanent-loss` | Impermanent loss calculator for Uniswap v2/v3 AMM positions | $0.005 |
| `POST /v1/crypto/apy-apr-convert` | Convert between APY and APR with configurable compounding | $0.002 |
| `POST /v1/crypto/liquidation-price` | Liquidation price calculator for leveraged positions | $0.002 |
| `POST /v1/crypto/funding-rate` | Funding rate analysis with annualization and regime detection | $0.005 |
| `POST /v1/crypto/dex-slippage` | DEX slippage estimator for constant-product AMM (x*y=k) | $0.005 |
| `POST /v1/crypto/vesting-schedule` | Token vesting schedule with cliff, linear/graded unlock, TGE | $0.005 |
| `POST /v1/crypto/rebalance-threshold` | Portfolio rebalance analyzer: drift detection and trade sizing | $0.005 |

### FX / Macro (7 endpoints)

| Endpoint | Description | Price |
|----------|-------------|-------|
| `POST /v1/fx/interest-rate-parity` | Interest rate parity calculator with arbitrage detection | $0.005 |
| `POST /v1/fx/purchasing-power-parity` | Purchasing power parity fair value estimation | $0.005 |
| `POST /v1/fx/forward-rate` | Bootstrap forward rates from a spot yield curve | $0.005 |
| `POST /v1/fx/carry-trade` | Currency carry trade P&L decomposition | $0.005 |
| `POST /v1/macro/inflation-adjusted` | Nominal to real returns using Fisher equation | $0.002 |
| `POST /v1/macro/taylor-rule` | Taylor Rule interest rate prescription | $0.002 |
| `POST /v1/macro/real-yield` | Real yield and breakeven inflation from nominal yields | $0.002 |

### Time Value of Money (5 endpoints)

| Endpoint | Description | Price |
|----------|-------------|-------|
| `POST /v1/tvm/present-value` | Present value of a future lump sum and/or annuity stream | $0.002 |
| `POST /v1/tvm/future-value` | Future value of a present lump sum and/or annuity stream | $0.002 |
| `POST /v1/tvm/irr` | Internal rate of return via Newton-Raphson | $0.005 |
| `POST /v1/tvm/npv` | Net present value with profitability index and payback period | $0.002 |
| `POST /v1/tvm/cagr` | Compound annual growth rate with forward projections | $0.002 |

### Simulation (1 endpoint)

| Endpoint | Description | Price |
|----------|-------------|-------|
| `POST /v1/simulate/montecarlo` | GBM Monte Carlo with contributions/withdrawals, up to 5000 paths | $0.015 |

---

## Example: Agent Backtest Workflow

A typical agent backtest chains multiple QuantOracle calls per iteration:

```
1. /v1/indicators/technical    -- generate signals (SMA, RSI, MACD)
2. /v1/risk/position-size      -- size the trade (fixed fractional)
3. /v1/risk/transaction-cost   -- estimate execution costs
4. /v1/options/price            -- price the hedge (Black-Scholes)
5. /v1/risk/portfolio           -- compute running Sharpe, drawdown, VaR
6. /v1/stats/probabilistic-sharpe -- is the Sharpe statistically significant?
7. /v1/tvm/cagr                 -- compute CAGR of the equity curve
```

Each call is a pure calculator -- no state, no side effects, no API keys.

---

## Self-Hosting

```bash
# Clone and run locally
git clone https://github.com/QuantOracledev/quantoracle.git
cd quantoracle
pip install fastapi uvicorn
uvicorn api.quantoracle:app --host 0.0.0.0 --port 8000

# Docker
docker compose up -d

# Docs at http://localhost:8000/docs
```

---

## Accuracy

Every endpoint is tested against published analytical solutions:

- **120 citation-backed benchmarks** (Hull, Wilmott, Bailey & Lopez de Prado, Goldman-Sosin-Gatto, Taylor, Fisher, Markowitz)
- **65 integration tests** covering all 63 endpoints
- Pure Python math -- no numpy/scipy, zero native dependencies
- Deterministic: same inputs always produce the same outputs

Run the verification suite yourself:
```bash
python tests/accuracy_benchmarks.py https://api.quantoracle.dev
```

---

## Architecture

```
quantoracle/
  api/quantoracle.py        -- FastAPI app, 63 endpoints, pure Python math
  worker/src/index.ts        -- Cloudflare Worker: rate limiting + x402 payments
  mcp-server/src/index.ts    -- MCP server: 63 tools over Streamable HTTP
  mcp-server/SKILL.md        -- ClawHub skill definition
  openapi.json               -- OpenAPI 3.0 spec
  tests/
    test_all.py              -- 65 integration tests
    accuracy_benchmarks.py   -- 120 citation-backed accuracy tests
```

**Stack**: FastAPI + Pydantic | Cloudflare Workers + KV | MCP (Streamable HTTP) | x402 + CDP Facilitator | USDC on Base

---

## License

[MIT](LICENSE) -- use QuantOracle however you want.
