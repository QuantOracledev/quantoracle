import { createToolParameters } from "@goat-sdk/core";
import {
  AssessPortfolioRiskSchema,
  BinomialTreeSchema,
  CalculateKellySchema,
  CorrelationSchema,
  ImpermanentLossSchema,
  ImpliedVolatilitySchema,
  LiquidationPriceSchema,
  PayoffDiagramSchema,
  PriceOptionSchema,
  PutCallParitySchema,
  RecommendHedgeSchema,
  SharpeRatioSchema,
  SimulatePortfolioSchema,
  VarParametricSchema,
  ZScoreSchema,
} from "./schemas";

/**
 * GOAT's `@Tool` decorator extracts the parameter schema from the class
 * passed as the method's parameter type. `createToolParameters(zodSchema)`
 * is the official helper that bridges a Zod schema to a TypeScript class
 * the decorator can introspect.
 *
 * All 15 parameter classes are exported here, one per tool, in the same
 * bundle order as schemas.ts.
 */

// Core bundle
export class PriceOptionParameters extends createToolParameters(PriceOptionSchema) {}
export class CalculateKellyParameters extends createToolParameters(CalculateKellySchema) {}
export class SimulatePortfolioParameters extends createToolParameters(
  SimulatePortfolioSchema,
) {}
export class AssessPortfolioRiskParameters extends createToolParameters(
  AssessPortfolioRiskSchema,
) {}
export class RecommendHedgeParameters extends createToolParameters(RecommendHedgeSchema) {}

// Options bundle
export class ImpliedVolatilityParameters extends createToolParameters(
  ImpliedVolatilitySchema,
) {}
export class BinomialTreeParameters extends createToolParameters(BinomialTreeSchema) {}
export class PayoffDiagramParameters extends createToolParameters(PayoffDiagramSchema) {}
export class PutCallParityParameters extends createToolParameters(PutCallParitySchema) {}

// Risk bundle
export class VarParametricParameters extends createToolParameters(VarParametricSchema) {}
export class CorrelationParameters extends createToolParameters(CorrelationSchema) {}
export class SharpeRatioParameters extends createToolParameters(SharpeRatioSchema) {}
export class ZScoreParameters extends createToolParameters(ZScoreSchema) {}

// DeFi bundle
export class ImpermanentLossParameters extends createToolParameters(ImpermanentLossSchema) {}
export class LiquidationPriceParameters extends createToolParameters(LiquidationPriceSchema) {}
