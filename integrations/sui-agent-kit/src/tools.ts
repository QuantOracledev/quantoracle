/**
 * QuantOracle quant-finance tools as framework-agnostic definitions.
 *
 * Each tool is a plain object: { name, description, schema (zod), execute }.
 * This is deliberately NOT bound to any single Sui agent framework's tool
 * type — the Sui agent ecosystem is fragmented (Sui AI Agent Kit, Talus
 * Nexus, custom MCP agents), so these portable defs adapt to all of them in
 * a few lines. See the README for adapters (LangChain-style, MCP, raw).
 *
 * Schemas/endpoints are ported verbatim from the production-proven
 * solana-agent-kit integration, so behaviour is identical and correct.
 */
import { z } from "zod";
import { callQuantOracle, type QuantOracleOpts } from "./client.js";

export interface QuantTool {
  /** Tool name exposed to the agent/LLM. */
  name: string;
  /** Natural-language description the model uses to decide when to call it. */
  description: string;
  /** Zod schema for the tool arguments (plugs into LangChain, Vercel AI SDK, etc.). */
  schema: z.ZodTypeAny;
  /** Run the tool. Returns the parsed QuantOracle JSON response. */
  execute: (args: any) => Promise<any>;
}

/** Build the tool set, optionally overriding the API base URL / timeout. */
export function createQuantOracleTools(opts?: QuantOracleOpts): QuantTool[] {
  const call = (endpoint: string, args: any) => callQuantOracle(endpoint, args, opts);

  return [
    {
      name: "quant_options_price",
      description:
        "Price a European option with Black-Scholes-Merton and all Greeks (delta, gamma, theta, vega, rho + second-order). Deterministic. Free tier eligible.",
      schema: z.object({
        S: z.number().positive().describe("Spot price of underlying"),
        K: z.number().positive().describe("Strike price"),
        T: z.number().positive().describe("Time to expiration in years"),
        sigma: z.number().positive().describe("Annualized implied volatility (0.20 = 20%)"),
        r: z.number().default(0.05).describe("Risk-free rate (annualized)"),
        q: z.number().default(0).describe("Continuous dividend yield"),
        type: z.enum(["call", "put"]).default("call"),
      }),
      execute: (a) => call("/v1/options/price", a),
    },
    {
      name: "quant_liquidation_price",
      description:
        "Liquidation price of a leveraged position (long or short) on perps/futures/margin, given entry, collateral, size, and leverage. Ideal for Sui lending/perp agents (Suilend, etc.). Free tier eligible.",
      schema: z.object({
        entry_price: z.number().positive(),
        collateral: z.number().positive(),
        position_size: z.number().positive(),
        leverage: z.number().positive(),
        direction: z.enum(["long", "short"]),
        maintenance_margin: z
          .number()
          .default(0.005)
          .describe("Maintenance margin as fraction"),
      }),
      execute: (a) => call("/v1/crypto/liquidation-price", a),
    },
    {
      name: "quant_impermanent_loss",
      description:
        "Impermanent loss for a Uniswap v2/v3-style LP position given the price-ratio change. For v3, pass the concentrated range. Ideal for Sui AMM/DEX LP agents. Free tier eligible.",
      schema: z.object({
        current_price_ratio: z
          .number()
          .positive()
          .describe("Current price / initial price (2.0 = price doubled)"),
        initial_value: z.number().positive().default(10000).describe("Initial LP value"),
        pool_type: z.enum(["v2", "v3"]).default("v2"),
        range_low: z.number().optional().describe("v3 only: lower price bound"),
        range_high: z.number().optional().describe("v3 only: upper price bound"),
      }),
      execute: (a) => call("/v1/crypto/impermanent-loss", a),
    },
    {
      name: "quant_monte_carlo",
      description:
        "Monte Carlo portfolio simulation (Geometric Brownian Motion) with contributions/withdrawals. Returns the terminal distribution (mean, p5/p25/p50/p75/p95), probability of loss, probability of doubling, and CAGR. Costs $0.015 past the free tier.",
      schema: z.object({
        initial_value: z.number().positive().default(100000),
        annual_return: z.number().default(0.1),
        annual_vol: z.number().positive().default(0.2),
        years: z.number().positive().max(100).default(5),
        simulations: z.number().int().min(1).max(5000).default(1000),
        contributions: z.number().default(0).describe("Annual contribution amount"),
        withdrawal_rate: z.number().default(0).describe("Annual withdrawal as fraction"),
      }),
      execute: (a) => call("/v1/simulate/montecarlo", a),
    },
    {
      name: "quant_portfolio_optimize",
      description:
        "Mean-variance portfolio optimization — optimal weights for max Sharpe, min variance, target return, or risk parity. Returns weights, expected return, volatility, Sharpe. Costs $0.015 past the free tier.",
      schema: z.object({
        returns: z
          .record(z.array(z.number()))
          .describe("Dict of asset symbol -> return series (all arrays same length)"),
        objective: z
          .enum(["max_sharpe", "min_variance", "target_return", "risk_parity"])
          .default("max_sharpe"),
        target_return: z.number().optional().describe("Required if objective=target_return"),
        risk_free_rate: z.number().default(0.045),
      }),
      execute: (a) => call("/v1/portfolio/optimize", a),
    },
    {
      name: "quant_risk_full_analysis",
      description:
        "Complete risk tearsheet in one call: Sharpe, Sortino, Calmar, VaR, CVaR, Kelly leverage, max drawdown, Hurst exponent, CAGR. Replaces ~7 individual calls. PAID-ONLY (no free tier) — $0.04 per call via x402.",
      schema: z.object({
        returns: z
          .array(z.number())
          .min(10)
          .describe("Daily return series as decimals (0.01 = 1%)"),
        portfolio_value: z
          .number()
          .positive()
          .default(100000)
          .describe("Current portfolio value"),
        risk_free_rate: z.number().default(0.045).describe("Annual risk-free rate"),
      }),
      execute: (a) => call("/v1/risk/full-analysis", a),
    },
    {
      name: "quant_hedging_recommend",
      description:
        "Rank the cheapest effective hedges for a position (long stock, long crypto, etc.): protective put, collar, futures short, partial hedge — each with cost, protection level, and affordability. PAID-ONLY — $0.04 per call via x402.",
      schema: z.object({
        position_type: z.enum(["long_stock", "short_stock", "long_crypto", "long_options"]),
        position_value: z.number().positive(),
        asset_price: z.number().positive(),
        volatility: z.number().positive().describe("Annualized volatility"),
        time_horizon_days: z.number().int().positive().default(30),
        max_hedge_cost_pct: z.number().positive().default(0.05),
        r: z.number().default(0.05),
      }),
      execute: (a) => call("/v1/hedging/recommend", a),
    },
  ];
}

/** Default tool set against the public API (https://api.quantoracle.dev). */
export const quantOracleTools: QuantTool[] = createQuantOracleTools();
