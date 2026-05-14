# QuantOracle for Coinbase AgentKit

Deterministic quant finance math for autonomous agents built with [Coinbase AgentKit](https://github.com/coinbase/agentkit).

> 📖 **Read the full integration comparison:** [AgentKit vs LangChain vs Direct HTTP — picking the right integration for paid agent APIs](https://dev.to/quantoracle/agentkit-vs-langchain-vs-direct-http-picking-the-right-integration-for-paid-agent-apis-2582) (dev.to, May 2026)

> **Why this exists:** AI agents trying to compute Black-Scholes prices, Kelly fractions, or Monte Carlo simulations in-context drift. The numbers are wrong, the Greeks are hallucinated, and the agent can't tell. QuantOracle is grounded math: same inputs, same outputs, every time. Free tier covers calculator endpoints; paid composites (full risk audit, hedge recommendations) settle automatically via your AgentKit wallet using x402 micropayments on Base or Solana.

## What this provides

5 high-leverage actions covering the financial decisions an autonomous trading or finance agent typically faces:

| Action | What it does | Cost |
|---|---|---|
| `price_option` | Black-Scholes pricing with full Greeks (delta, gamma, vega, theta, rho) | Free |
| `calculate_kelly` | Kelly Criterion optimal sizing (full / half / quarter Kelly) | Free |
| `simulate_portfolio` | Monte Carlo simulation with contributions, withdrawals, probability of ruin | Free |
| `assess_portfolio_risk` | Composite audit: Sharpe, Sortino, Calmar, max DD, VaR, CVaR, Kelly, Hurst | $0.04 USDC via x402 |
| `recommend_hedge` | Ranked hedge structures (collar, protective put, partial put, inverse) for any position | $0.04 USDC via x402 |

The full QuantOracle API has 73 endpoints; this provider exposes a curated subset. For the long tail (exotic options, FX models, technical indicators, etc.), agents can call the raw API at `https://api.quantoracle.dev/v1/*` directly.

## Free tier

- **1,000 calls per IP per day**, no signup, no API key
- Covers `price_option`, `calculate_kelly`, `simulate_portfolio` for almost any agent
- Resets daily at 00:00 UTC

## Paid endpoints (x402)

`assess_portfolio_risk` and `recommend_hedge` are composite endpoints that wrap 5-15 calculator calls into a single response. They cost $0.04 USDC each, settled on-chain via the [x402 protocol](https://github.com/coinbase/x402) on Base mainnet or Solana mainnet.

**Your AgentKit wallet handles payment automatically.** No API key, no signup, no billing setup. The wallet just needs to hold a small amount of USDC on Base or Solana.

## Installation

The action provider files live alongside your AgentKit project:

```bash
# 1. Create a new AgentKit project (or use an existing one)
npx create-onchain-agent

# 2. Copy the QuantOracle action provider files into your project
mkdir -p src/quantoracle
curl -sL https://raw.githubusercontent.com/QuantOracledev/quantoracle/main/integrations/agentkit/quantoracleActionProvider.ts -o src/quantoracle/quantoracleActionProvider.ts
curl -sL https://raw.githubusercontent.com/QuantOracledev/quantoracle/main/integrations/agentkit/schemas.ts -o src/quantoracle/schemas.ts
curl -sL https://raw.githubusercontent.com/QuantOracledev/quantoracle/main/integrations/agentkit/constants.ts -o src/quantoracle/constants.ts
curl -sL https://raw.githubusercontent.com/QuantOracledev/quantoracle/main/integrations/agentkit/index.ts -o src/quantoracle/index.ts
```

Or clone the QuantOracle repo and copy the directory:

```bash
git clone https://github.com/QuantOracledev/quantoracle
cp -r quantoracle/integrations/agentkit ./src/quantoracle
```

## Usage

```ts
import { AgentKit, CdpEvmWalletProvider } from "@coinbase/agentkit";
import { quantoracleActionProvider } from "./quantoracle";

const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
  apiKeyId: process.env.CDP_API_KEY_ID!,
  apiKeySecret: process.env.CDP_API_KEY_SECRET!,
  networkId: "base-mainnet",
});

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [quantoracleActionProvider()],
});

// The agent now has 5 new actions:
//   price_option, calculate_kelly, simulate_portfolio,
//   assess_portfolio_risk, recommend_hedge
```

A complete runnable example is at [`example-agent.ts`](./example-agent.ts). Additional examples:

- [`example-agent-solana.ts`](./example-agent-solana.ts) — Same agent but routes x402 payments through a Solana mainnet wallet (SPL USDC) instead of Base. Useful for agents already operating in the Solana ecosystem.
- [`example-chained-workflow.ts`](./example-chained-workflow.ts) — Scripted demo showing the natural `assess_portfolio_risk` → `recommend_hedge` chained workflow. Pre-baked prompts walk the agent through risk audit → hedge analysis → final recommendation. Spends ~$0.08 USDC per run on real x402 settlements.

For a side-by-side comparison of integration patterns (direct HTTP vs AgentKit vs LangChain Python), see [`COMPARISONS.md`](./COMPARISONS.md).

## Example agent prompts

Try these in your AgentKit chat:

- _"Price a 30-day NVDA call with strike $185, spot $180, 28% IV"_ → uses `price_option`
- _"I have 55% win rate, $150 avg win, $100 avg loss — what's my Kelly?"_ → uses `calculate_kelly`
- _"Simulate $100K over 30 years with 7% return, 16% vol, 4% withdrawal"_ → uses `simulate_portfolio`
- _"Audit risk on my last 252 daily returns: [...]"_ → uses `assess_portfolio_risk` (paid)
- _"Recommend hedges for my $100K long NVDA position over 30 days"_ → uses `recommend_hedge` (paid)

## Try without code

15 free interactive calculators backed by the same engine are at **[quantoracle.dev](https://quantoracle.dev)** — useful for verifying outputs before wiring the action provider into your agent.

## Why deterministic finance math matters for agents

Three failure modes when LLMs do financial math in-context:

1. **Black-Scholes calculations drift.** GPT-4o's Greeks are wrong by 5-30% depending on moneyness. The agent can't tell.
2. **Compound interest computations skip steps.** A 30-year projection at 8% loses meaningful precision over many tokens.
3. **Kelly and VaR formulas are mis-applied.** LLMs often confuse arithmetic vs geometric returns or fail to annualize correctly.

Grounded tools fix all three: the API is bytes-exact against textbook implementations (Hull, Wilmott, Lopez de Prado), tested across 120 accuracy benchmarks, and returns the same value for the same inputs every time. The agent can cite a specific tool call as the source for any number it presents.

## Repository

Source: [github.com/QuantOracledev/quantoracle](https://github.com/QuantOracledev/quantoracle)
API: [api.quantoracle.dev](https://api.quantoracle.dev)
Calculators: [quantoracle.dev](https://quantoracle.dev)
OpenAPI spec: [api.quantoracle.dev/openapi.json](https://api.quantoracle.dev/openapi.json)

## License

MIT — same as the rest of QuantOracle.
