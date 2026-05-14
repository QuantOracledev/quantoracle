/**
 * @quantoracle/ai-tools — Vercel AI SDK tools for QuantOracle's
 * deterministic quant finance API.
 *
 * Quick start (default 5-tool core bundle):
 *
 * ```ts
 * import { generateText } from "ai";
 * import { openai } from "@ai-sdk/openai";
 * import { quantoracleTools } from "@quantoracle/ai-tools";
 *
 * const result = await generateText({
 *   model: openai("gpt-4o"),
 *   tools: quantoracleTools(),
 *   prompt: "Price a 30-day SPY $500 call with vol=18%, spot=$498, rate=5%.",
 *   maxSteps: 3,
 * });
 * ```
 *
 * Opt into more bundles for breadth:
 *
 * ```ts
 * quantoracleTools({ include: ['core', 'options'] }) // 9 tools
 * quantoracleTools({ include: 'all' })               // 15 tools
 * ```
 *
 * Available bundles:
 * - `core` (5): price_option, calculate_kelly, simulate_portfolio,
 *   assess_portfolio_risk*, recommend_hedge*  (* = paid via x402)
 * - `options` (4): implied_vol, binomial_tree, payoff_diagram,
 *   put_call_parity
 * - `risk` (4): var_parametric, correlation, sharpe_ratio, zscore
 * - `defi` (2): impermanent_loss, liquidation_price
 *
 * The free tier covers 13 of 15 tools (1,000 calls/IP/day). Only
 * `assess_portfolio_risk` and `recommend_hedge` require an x402PayHandler.
 */
export { quantoracleTools, quantoraclePaidTools } from "./tools";
export type { X402PayHandler, ToolsOptions, QuantOracleBundle } from "./tools";
export {
  // Core bundle
  PriceOptionSchema,
  CalculateKellySchema,
  SimulatePortfolioSchema,
  AssessPortfolioRiskSchema,
  RecommendHedgeSchema,
  // Options bundle
  ImpliedVolatilitySchema,
  BinomialTreeSchema,
  PayoffLegSchema,
  PayoffDiagramSchema,
  PutCallParitySchema,
  // Risk bundle
  VarParametricSchema,
  CorrelationSchema,
  SharpeRatioSchema,
  ZScoreSchema,
  // DeFi bundle
  ImpermanentLossSchema,
  LiquidationPriceSchema,
} from "./schemas";
export { QUANTORACLE_BASE_URL, FREE_TIER_DAILY_LIMIT, USER_AGENT } from "./constants";
