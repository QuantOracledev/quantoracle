/**
 * @quantoracle/goat-plugin — GOAT SDK plugin for QuantOracle's
 * deterministic quant finance API.
 *
 * Quick start (default 5-tool core bundle):
 *
 * ```ts
 * import { quantoracle } from "@quantoracle/goat-plugin";
 * import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
 * import { viem } from "@goat-sdk/wallet-viem";
 *
 * const tools = await getOnChainTools({
 *   wallet: viem(walletClient),
 *   plugins: [...quantoracle()],
 * });
 * ```
 *
 * Opt into more bundles for breadth — `quantoracle()` returns an array
 * of plugins, so spread it into your GOAT `plugins`:
 *
 * ```ts
 * plugins: [...quantoracle({ include: 'all' })]  // 15 tools
 * plugins: [...quantoracle({ include: ['core', 'defi'] })]  // 7 tools
 * ```
 *
 * Available bundles: `core` (5), `options` (4), `risk` (4), `defi` (2).
 * Multi-chain by design — works on every chain GOAT supports.
 */
export {
  QuantOracleCorePlugin,
  QuantOracleOptionsPlugin,
  QuantOracleRiskPlugin,
  QuantOracleDefiPlugin,
  quantoracle,
} from "./plugin";
export type {
  X402PayHandler,
  QuantOraclePluginOptions,
  QuantOracleBundle,
} from "./plugin";
export {
  // Core
  PriceOptionSchema,
  CalculateKellySchema,
  SimulatePortfolioSchema,
  AssessPortfolioRiskSchema,
  RecommendHedgeSchema,
  // Options
  ImpliedVolatilitySchema,
  BinomialTreeSchema,
  PayoffLegSchema,
  PayoffDiagramSchema,
  PutCallParitySchema,
  // Risk
  VarParametricSchema,
  CorrelationSchema,
  SharpeRatioSchema,
  ZScoreSchema,
  // DeFi
  ImpermanentLossSchema,
  LiquidationPriceSchema,
} from "./schemas";
export {
  // Core parameters
  PriceOptionParameters,
  CalculateKellyParameters,
  SimulatePortfolioParameters,
  AssessPortfolioRiskParameters,
  RecommendHedgeParameters,
  // Options parameters
  ImpliedVolatilityParameters,
  BinomialTreeParameters,
  PayoffDiagramParameters,
  PutCallParityParameters,
  // Risk parameters
  VarParametricParameters,
  CorrelationParameters,
  SharpeRatioParameters,
  ZScoreParameters,
  // DeFi parameters
  ImpermanentLossParameters,
  LiquidationPriceParameters,
} from "./parameters";
export { QUANTORACLE_BASE_URL, FREE_TIER_DAILY_LIMIT, USER_AGENT } from "./constants";
