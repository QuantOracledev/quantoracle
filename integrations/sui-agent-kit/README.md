# QuantOracle — Sui / Talus Agent Integration

Deterministic quant-finance tools for AI agents on **Sui** — Black-Scholes pricing, liquidation price, impermanent loss, Monte Carlo, full risk analysis, and hedging — usable from the [Sui AI Agent Kit](https://sui.io), [Talus / Nexus](https://talus.network/), or any MCP-capable agent.

> **Browser preview:** the same math runs as free interactive calculators at **[quantoracle.dev](https://quantoracle.dev)** — including [crypto liquidation](https://quantoracle.dev/crypto-liquidation-calculator) and [impermanent loss](https://quantoracle.dev/impermanent-loss-calculator), which pair naturally with Sui DeFi agents (Suilend, Cetus, etc.).

LLMs that compute Black-Scholes, VaR, or liquidation prices in-context drift silently. These tools ground every number in a deterministic, citation-verified engine — same inputs always produce the same output.

---

## Two ways to use it

### Route A — MCP (recommended, zero code)

The Sui agent ecosystem is MCP-native. QuantOracle runs a hosted MCP server exposing **all 74 tools** (73 calculators + batch). Point your agent at it — no install, no build, chain-agnostic:

```jsonc
// MCP client config (Sui AI Agent Kit, Claude Desktop, Cursor, any MCP host)
{
  "mcpServers": {
    "quantoracle": {
      "url": "https://mcp.quantoracle.dev/mcp"
    }
  }
}
```

Or run it over stdio:

```bash
npx quantoracle-mcp
```

That's the whole integration for any MCP-capable Sui or Talus agent. The free tier (1,000 calls/IP/day) needs no wallet or API key.

### Route B — native tool-pack

If your agent isn't MCP-based (a custom TypeScript agent, a framework that takes its own tool objects), install the portable tool-pack:

```bash
npm install @quantoracle/sui-agent-kit zod
```

Each tool is a plain `{ name, description, schema (zod), execute }` object, so it adapts to any TS agent framework in a few lines.

**Use a tool directly:**

```ts
import { quantOracleTools } from "@quantoracle/sui-agent-kit";

const liq = quantOracleTools.find((t) => t.name === "quant_liquidation_price")!;
const result = await liq.execute({
  entry_price: 3.5,        // SUI perp entry
  collateral: 500,
  position_size: 2500,
  leverage: 5,
  direction: "long",
});
console.log(result.liquidation_price);
```

**Adapt to a LangChain-style agent** (the common bridge — Talus/Nexus offchain tools and many Sui kits accept these). zod schemas plug straight in:

```ts
import { DynamicStructuredTool } from "@langchain/core/tools";
import { quantOracleTools } from "@quantoracle/sui-agent-kit";

const tools = quantOracleTools.map(
  (t) =>
    new DynamicStructuredTool({
      name: t.name,
      description: t.description,
      schema: t.schema,
      func: async (args) => JSON.stringify(await t.execute(args)),
    })
);
// pass `tools` to your agent executor
```

**Adapt to a Vercel AI SDK agent:**

```ts
import { tool } from "ai";
import { quantOracleTools } from "@quantoracle/sui-agent-kit";

const tools = Object.fromEntries(
  quantOracleTools.map((t) => [
    t.name,
    tool({ description: t.description, parameters: t.schema, execute: t.execute }),
  ])
);
```

---

## Tools included

| Tool | Description | Price |
|------|-------------|-------|
| `quant_options_price` | Black-Scholes-Merton + full Greeks | Free tier / $0.005 |
| `quant_liquidation_price` | Liquidation price for leveraged longs/shorts | Free tier / $0.002 |
| `quant_impermanent_loss` | Uniswap v2/v3-style LP impermanent loss | Free tier / $0.005 |
| `quant_monte_carlo` | GBM portfolio simulation (terminal distribution, prob of loss/double) | Free tier / $0.015 |
| `quant_portfolio_optimize` | Max-Sharpe / min-var / risk-parity weights | Free tier / $0.015 |
| `quant_risk_full_analysis` | Full risk tearsheet: Sharpe, Sortino, VaR, CVaR, Kelly, drawdown, Hurst, CAGR | $0.04 (paid-only) |
| `quant_hedging_recommend` | Rank cheapest hedges (put, collar, futures, partial) | $0.04 (paid-only) |

Need more? The hosted MCP server (Route A) exposes all 74 endpoints; this pack curates the 7 most useful for Sui DeFi agents.

## Payments

- **Free tier:** 1,000 calls/IP/day, no wallet, no API key. Covers development and most production loads.
- **Paid:** past the free tier (and for the paid-only composites), endpoints return HTTP 402 with [x402](https://www.x402.org/) payment requirements. x402 settles in USDC on **Base** or **Solana** today — a Sui agent can pay with a Base/Solana wallet via any x402-capable client. Native Sui settlement will be added as the x402-on-Sui rail matures.

## Why QuantOracle

- **73 underlying calculators** across options, derivatives, risk, portfolio, statistics, crypto/DeFi, FX/macro, TVM
- **Deterministic** and **citation-verified** (Hull, Wilmott, Bailey & López de Prado)
- **15–70 ms** compute per call
- Open: [quantoracle.dev](https://quantoracle.dev) · [API docs](https://api.quantoracle.dev/docs)
