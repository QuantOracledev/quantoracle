# RapidAPI listing kit — QuantOracle

Everything needed to list QuantOracle on RapidAPI (or any gateway-style API
marketplace). Prepared 2026-07-10. **Total user time: ~10 minutes.**

> **Hold until the research pass confirms marketplace health.** RapidAPI's
> post-2023 trajectory (layoffs, Nokia acquisition of its tech) makes its 2026
> buyer traffic worth verifying before spending the signup time. The Worker
> ingress below is marketplace-agnostic — any gateway that sends a static
> secret header works (adjust the header name in `worker/src/index.ts` if we
> list elsewhere).

---

## How it works (already built + deployed)

- The Worker recognizes `X-RapidAPI-Proxy-Secret` (the per-API secret from the
  provider dashboard). Matching requests **bypass x402 and the free-tier
  counters** — the marketplace bills the subscriber and enforces plan quotas
  upstream. Traffic is tagged `source=rapidapi` in our metrics automatically.
- **Inert until the secret is set.** No secret → the path never matches.
- Excluded from the marketplace (x402-only, returns 403 with a pointer):
  `watch/*` (priced per position, not per request) and `/v1/batch` (100
  computations per request = plan-quota arbitrage).
- `rapidapi/openapi.json` (76 endpoints) is the import file; regenerate with
  `scripts/gen-rapidapi-spec.py` after adding endpoints.

## Setup steps (user)

1. **Create a provider account** — rapidapi.com → "Add Your API" (GitHub SSO is
   fine). *(Account creation = you; everything else is paste.)*
2. **Add API** → "Import OpenAPI spec" → upload `rapidapi/openapi.json`.
3. **Base URL:** `https://api.quantoracle.dev`
4. Copy the **proxy secret** from *Your API → Settings → Proxy Secret*, then
   set it as a Worker secret (from `worker/`):
   ```
   npx wrangler secret put RAPIDAPI_PROXY_SECRET     # paste when prompted
   ```
   (Or paste it to Claude in chat and I'll set it. It deploys immediately —
   no code change needed.)
5. **Require the proxy secret** in the API's settings (toggle "block requests
   without proxy secret" if offered — our Worker also validates it).
6. Paste the listing copy below; configure the plans; **Publish**.
7. Tell Claude — I'll verify end-to-end with a subscribed test call and start
   tracking `source=rapidapi` in the briefings.

---

## Listing copy (paste)

**Name:** QuantOracle — Quant Finance Calculations

**Tagline (≤80 chars):** 76 deterministic quant endpoints: options, risk,
portfolio, crypto, live vol & funding.

**Category:** Finance   **Tags:** options pricing, black-scholes, risk,
value-at-risk, kelly criterion, monte carlo, portfolio optimization, technical
indicators, crypto, funding rates, implied volatility, GARCH, quant

**Long description:**

> Deterministic quantitative-finance computation for trading systems, research
> tools, and AI agents. 76 endpoints across ten domains:
>
> - **Options & derivatives** — Black-Scholes with 10 Greeks, implied vol
>   (Newton-Raphson), multi-leg strategies, binomial trees, barrier/Asian/
>   lookback exotics, vol surfaces, option-chain analytics (max pain, skew)
> - **Risk** — parametric VaR/CVaR, Kelly sizing, drawdown decomposition,
>   stress tests, transaction costs, 22-metric portfolio tearsheets
> - **Portfolio** — max-Sharpe / min-variance / risk-parity optimization,
>   rebalance planning
> - **Statistics** — GARCH(1,1) forecasts, Hurst exponent, cointegration,
>   regressions, distribution fitting, probabilistic Sharpe
> - **Crypto/DeFi** — liquidation price, impermanent loss, funding-rate
>   analysis, DEX slippage, vesting schedules
> - **Live market data** — real-time BTC/ETH/SOL realized volatility and perp
>   funding rates, each with percentile context from our proprietary
>   continuously-sampled history
> - Plus composite workflows (full risk analysis, trade evaluation, hedging
>   recommendations, strategy backtests) that replace 5–10 calls with one.
>
> Pure computation: same inputs → same outputs, every time. No login, ~70 ms
> p50. Built API-first for algorithmic consumers; also exposed as an 80-tool
> MCP server for AI agents (quantoracle.dev).

## Plans (quota-only differentiation — keep v1 simple)

| Plan | Price | Quota | Rate limit | Overage |
|---|---|---|---|---|
| **Basic** | free | 500 req/mo (hard stop) | 1 req/s | — |
| **Pro** | $9.99/mo | 25,000 req/mo | 5 req/s | $0.001/req |
| **Ultra** | $24.99/mo | 150,000 req/mo | 10 req/s | $0.0005/req |
| **Mega** | $79.99/mo | 1,000,000 req/mo | 20 req/s | $0.0003/req |

All 76 endpoints on every plan (differentiate by volume, not features — less
config, fewer support questions). Composites cost 1 request like everything
else on the marketplace; power users effectively get bulk pricing vs. x402
per-call, which is the marketplace's value proposition alongside unified
billing and SDKs.

**Honest context:** the direct API has a free tier (1,000 calls/day on core
calculators via x402/no signup). Marketplace subscribers pay for unified
billing, quota headroom, generated SDKs, and the dashboard — standard for
APIs listed both places. Don't hide the direct API; don't advertise it in the
listing either.

## Example requests (for the listing's test console)

**POST /v1/options/price** — Black-Scholes + Greeks
```json
{"spot": 100, "strike": 105, "time_to_expiry": 0.25, "rate": 0.05, "volatility": 0.2, "option_type": "call"}
```

**POST /v1/crypto/leverage-check** — one-call leveraged-position risk verdict
```json
{"entry_price": 50000, "collateral": 1000, "position_size": 10000, "leverage": 10, "direction": "long", "asset": "BTC"}
```

**POST /v1/risk/var-parametric** — VaR/CVaR
```json
{"returns": [0.01, -0.02, 0.015, -0.005, 0.02, -0.01, 0.005], "confidence": 0.95, "portfolio_value": 100000}
```
