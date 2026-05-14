import { z } from "zod";

/**
 * Zod schemas for all 15 QuantOracle tools exposed to GOAT SDK agents,
 * organized by bundle. GOAT's `@Tool` decorator generates the tool
 * description from the docstring it's given; these schemas only describe
 * the parameter shape. Per-field `.describe()` text still flows through
 * to the LLM as the parameter documentation in the generated tool spec.
 *
 * Schemas mirror the live FastAPI Pydantic models in api/quantoracle.py
 * exactly. The full API has 73 endpoints plus a /v1/batch endpoint that
 * bundles up to 100 sub-requests into a single HTTP call (charged as the
 * sum of component prices, one x402 settlement). This plugin exposes 15
 * individual tools across 4 bundles (core, options, risk, defi). For full
 * coverage or for bulk computation, use the REST API directly or the
 * QuantOracle MCP server.
 */

// ═══════════════════════════════════════════════════════════════════════
// CORE BUNDLE
// ═══════════════════════════════════════════════════════════════════════

export const PriceOptionSchema = z.object({
  S: z.number().positive().describe("Spot price of the underlying"),
  K: z.number().positive().describe("Strike price"),
  T: z.number().positive().describe("Time to expiry in years (0.083 = 30 days)"),
  r: z.number().describe("Risk-free rate as decimal (0.05 = 5%)"),
  sigma: z.number().positive().describe("Annualized volatility as decimal"),
  option_type: z.enum(["call", "put"]).default("call").describe("Option type"),
});

export const CalculateKellySchema = z.object({
  win_rate: z.number().min(0.01).max(0.99).describe("Probability of winning, between 0 and 1"),
  avg_win: z.number().positive().describe("Average dollar amount won on winning trades"),
  avg_loss: z.number().positive().describe("Average dollar amount lost on losing trades"),
});

export const SimulatePortfolioSchema = z.object({
  initial_value: z.number().positive().describe("Starting portfolio value"),
  annual_return: z.number().describe("Expected annual return as decimal"),
  annual_vol: z.number().positive().describe("Expected annual volatility as decimal"),
  years: z.number().positive().max(30).describe("Time horizon in years (max 30)"),
  simulations: z.number().int().min(100).max(2500).default(1000).describe("Monte Carlo paths (100-2500)"),
  contributions: z.number().min(0).default(0),
  withdrawal_rate: z.number().min(0).max(0.5).default(0),
});

export const AssessPortfolioRiskSchema = z.object({
  returns: z.array(z.number()).min(30).max(5000).describe("Historical returns (30-5000 obs)"),
  risk_free_rate: z.number().default(0.04),
  annualization_factor: z.number().int().default(252),
});

export const RecommendHedgeSchema = z.object({
  position_type: z.enum(["long_stock", "short_stock", "long_crypto", "long_options"]),
  position_value: z.number().positive(),
  asset_price: z.number().positive(),
  volatility: z.number().positive(),
  time_horizon_days: z.number().int().positive().default(30),
  max_hedge_cost_pct: z.number().min(0).max(0.5).default(0.05),
  r: z.number().default(0.05),
});

// ═══════════════════════════════════════════════════════════════════════
// OPTIONS BUNDLE
// ═══════════════════════════════════════════════════════════════════════

export const ImpliedVolatilitySchema = z.object({
  S: z.number().positive().describe("Spot price of the underlying"),
  K: z.number().positive().describe("Strike price"),
  T: z.number().positive().describe("Time to expiry in years"),
  r: z.number().default(0.05).describe("Risk-free rate as decimal"),
  q: z.number().default(0).describe("Continuous dividend yield"),
  market_price: z.number().positive().describe("Observed market price per share"),
  type: z.enum(["call", "put"]).default("call").describe("Option type"),
});

export const BinomialTreeSchema = z.object({
  S: z.number().positive().describe("Spot price"),
  K: z.number().positive().describe("Strike price"),
  T: z.number().positive().max(30).describe("Time to expiry in years (max 30)"),
  r: z.number().default(0.05),
  sigma: z.number().positive().describe("Annualized volatility"),
  q: z.number().default(0),
  type: z.enum(["call", "put"]).default("call"),
  exercise: z.enum(["american", "european"]).default("european"),
  steps: z.number().int().min(1).max(200).default(100).describe("Tree steps (1-200, default 100)"),
});

export const PayoffLegSchema = z.object({
  type: z.enum(["call", "put"]),
  strike: z.number().positive(),
  premium: z.number(),
  quantity: z.number().int().default(1),
  direction: z.enum(["long", "short"]).default("long"),
});

export const PayoffDiagramSchema = z.object({
  legs: z.array(PayoffLegSchema).min(1).describe("Array of option legs"),
  spot: z.number().positive().describe("Current spot price"),
  price_range_pct: z.number().positive().default(30),
  points: z.number().int().min(1).default(100),
});

export const PutCallParitySchema = z.object({
  call_price: z.number().positive().describe("Observed call price"),
  put_price: z.number().positive().describe("Observed put price"),
  S: z.number().positive().describe("Spot price"),
  K: z.number().positive().describe("Strike price (same for both)"),
  T: z.number().positive().describe("Time to expiry in years"),
  r: z.number().default(0.05),
  q: z.number().default(0),
});

// ═══════════════════════════════════════════════════════════════════════
// RISK BUNDLE
// ═══════════════════════════════════════════════════════════════════════

export const VarParametricSchema = z.object({
  returns: z.array(z.number()).min(10).max(5000).describe("Historical returns (10-5000 obs)"),
  confidence_levels: z.array(z.number()).min(1).max(5).default([0.95, 0.99]),
  holding_period_days: z.number().int().min(1).max(252).default(1),
  portfolio_value: z.number().positive().optional().describe("Optional, for dollar VaR"),
});

export const CorrelationSchema = z.object({
  series: z
    .record(z.string(), z.array(z.number()))
    .describe('Named return series, e.g. {"AAPL": [...], "MSFT": [...]}'),
});

export const SharpeRatioSchema = z.object({
  returns: z.array(z.number()).min(5).max(5000).describe("Periodic returns (5-5000 obs)"),
  risk_free_rate: z.number().default(0.05),
  annualization_factor: z.number().int().default(252),
});

export const ZScoreSchema = z.object({
  series: z.array(z.number()).min(3).max(5000).describe("Numeric data series (3-5000 obs)"),
  window: z.number().int().min(2).max(5000).optional().describe("Rolling window (2-5000)"),
  threshold: z.number().positive().default(2.0),
});

// ═══════════════════════════════════════════════════════════════════════
// DEFI BUNDLE
// ═══════════════════════════════════════════════════════════════════════

export const ImpermanentLossSchema = z.object({
  initial_price_ratio: z.number().positive().default(1.0),
  current_price_ratio: z.number().positive(),
  amm_type: z.enum(["v2", "v3"]).default("v2"),
  lower_tick: z.number().positive().optional().describe("v3 only"),
  upper_tick: z.number().positive().optional().describe("v3 only"),
  initial_investment: z.number().positive().default(1000),
});

export const LiquidationPriceSchema = z.object({
  entry_price: z.number().positive(),
  collateral: z.number().positive(),
  position_size: z.number().positive().describe("Notional position size in USD"),
  leverage: z.number().positive(),
  direction: z.enum(["long", "short"]),
  maintenance_margin_rate: z.number().positive().default(0.005),
  funding_accumulated: z.number().default(0),
});
