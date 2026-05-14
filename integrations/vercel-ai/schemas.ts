import { z } from "zod";

/**
 * Zod schemas for all 15 QuantOracle tools exposed to Vercel AI SDK
 * agents, organized by bundle. The default `quantoracleTools()` call
 * wires only the 5 "core" bundle tools; other bundles are opt-in via
 * the `include` option.
 *
 * Every schema mirrors the live API request body exactly — field names,
 * types, defaults, and constraints all match the FastAPI Pydantic
 * models in api/quantoracle.py. When the model decides to call a tool,
 * it sees the `.describe()` text on every field as part of the tool
 * description, so those are written for LLM consumption.
 *
 * The full QuantOracle API has 73 endpoints plus a /v1/batch endpoint
 * that bundles up to 100 sub-requests into one HTTP roundtrip (charged
 * as the sum of the component prices, settled in a single x402
 * transaction). We expose 15 individual tools here; for the long tail
 * or for bulk computation, agents can call the REST API directly via
 * fetch, or use the QuantOracle MCP server for full coverage with
 * dynamic tool discovery.
 */

// ═══════════════════════════════════════════════════════════════════════
// CORE BUNDLE — 5 always-included tools (free tier + 2 paid composites)
// ═══════════════════════════════════════════════════════════════════════

export const PriceOptionSchema = z
  .object({
    S: z.number().positive().describe("Spot price of the underlying"),
    K: z.number().positive().describe("Strike price"),
    T: z.number().positive().describe("Time to expiry in years (0.083 = 30 days, 0.25 = 3 months)"),
    r: z.number().describe("Risk-free interest rate as a decimal (0.05 = 5%)"),
    sigma: z.number().positive().describe("Annualized volatility as a decimal (0.28 = 28%)"),
    option_type: z
      .enum(["call", "put"])
      .default("call")
      .describe("Option type — call or put"),
  })
  .describe(
    "Black-Scholes option pricing with full Greeks. Returns price, breakeven, probability ITM, and all first-order Greeks (delta, gamma, vega, theta, rho).",
  );

export const CalculateKellySchema = z
  .object({
    win_rate: z.number().min(0.01).max(0.99).describe("Probability of winning, between 0 and 1"),
    avg_win: z.number().positive().describe("Average dollar amount won on winning trades"),
    avg_loss: z
      .number()
      .positive()
      .describe("Average dollar amount lost on losing trades (positive number)"),
  })
  .describe(
    "Kelly Criterion optimal bet sizing. Returns full-, half-, and quarter-Kelly fractions plus the edge per dollar risked and the payoff ratio.",
  );

export const SimulatePortfolioSchema = z
  .object({
    initial_value: z.number().positive().describe("Starting portfolio value in dollars"),
    annual_return: z.number().describe("Expected annual return as a decimal (0.08 = 8%)"),
    annual_vol: z.number().positive().describe("Expected annual volatility as a decimal (0.18 = 18%)"),
    years: z
      .number()
      .positive()
      .max(30)
      .describe("Time horizon in years (max 30)"),
    simulations: z
      .number()
      .int()
      .min(100)
      .max(2500)
      .default(1000)
      .describe("Number of Monte Carlo paths (100-2500; default 1000 matches industry standard)"),
    contributions: z
      .number()
      .min(0)
      .default(0)
      .describe("Annual contribution amount in dollars (0 if none)"),
    withdrawal_rate: z
      .number()
      .min(0)
      .max(0.5)
      .default(0)
      .describe("Annual withdrawal rate as a decimal (0.04 = 4%)"),
  })
  .describe(
    "Monte Carlo portfolio simulation projecting the distribution of terminal outcomes (P5/P25/median/P75/P95), CAGR, probability of loss, and probability of ruin under withdrawals. For higher-precision tail estimates use the paid /v1/risk/full-analysis composite.",
  );

export const AssessPortfolioRiskSchema = z
  .object({
    returns: z
      .array(z.number())
      .min(30)
      .max(5000)
      .describe(
        "Array of historical periodic returns as decimals (0.012 = 1.2%). Daily returns assumed; 30-5000 observations, 252+ recommended.",
      ),
    risk_free_rate: z.number().default(0.04).describe("Annual risk-free rate as a decimal"),
    annualization_factor: z
      .number()
      .int()
      .default(252)
      .describe("252 for daily, 52 for weekly, 12 for monthly"),
  })
  .describe(
    "Composite full risk audit returning Sharpe, Sortino, Calmar, max drawdown, VaR, CVaR, Hurst exponent, and Kelly fraction in one call. PAID endpoint ($0.04 per call, settled in USDC via x402).",
  );

export const RecommendHedgeSchema = z
  .object({
    position_type: z
      .enum(["long_stock", "short_stock", "long_crypto", "long_options"])
      .describe("Type of position to hedge"),
    position_value: z.number().positive().describe("Current dollar value of the position"),
    asset_price: z.number().positive().describe("Current spot price of the underlying"),
    volatility: z.number().positive().describe("Annualized vol as a decimal (0.28 = 28%)"),
    time_horizon_days: z
      .number()
      .int()
      .positive()
      .default(30)
      .describe("Hedge time horizon in days"),
    max_hedge_cost_pct: z
      .number()
      .min(0)
      .max(0.5)
      .default(0.05)
      .describe("Maximum hedge cost as fraction of position value (0.05 = 5%)"),
    r: z.number().default(0.05).describe("Risk-free rate as a decimal"),
  })
  .describe(
    "Recommend ranked hedge structures (collar, protective put, partial put, inverse) for an existing position. PAID endpoint ($0.04 per call, settled in USDC via x402).",
  );

// ═══════════════════════════════════════════════════════════════════════
// OPTIONS BUNDLE — 4 tools (implied vol, American options, payoff, parity)
// ═══════════════════════════════════════════════════════════════════════

export const ImpliedVolatilitySchema = z
  .object({
    S: z.number().positive().describe("Spot price of the underlying"),
    K: z.number().positive().describe("Strike price"),
    T: z.number().positive().describe("Time to expiry in years (0.083 = 30 days)"),
    r: z.number().default(0.05).describe("Risk-free rate as a decimal"),
    q: z.number().default(0).describe("Continuous dividend yield as a decimal"),
    market_price: z
      .number()
      .positive()
      .describe("Observed market price of the option (per share, not contract)"),
    type: z.enum(["call", "put"]).default("call").describe("Option type"),
  })
  .describe(
    "Solve for implied volatility given an observed market price. Newton-Raphson solver, converges in 5-8 iterations. Use when the user wants to know what volatility the market is pricing in for an option.",
  );

export const BinomialTreeSchema = z
  .object({
    S: z.number().positive().describe("Spot price of the underlying"),
    K: z.number().positive().describe("Strike price"),
    T: z
      .number()
      .positive()
      .max(30)
      .describe("Time to expiry in years (max 30)"),
    r: z.number().default(0.05).describe("Risk-free rate as a decimal"),
    sigma: z.number().positive().describe("Annualized volatility as a decimal"),
    q: z.number().default(0).describe("Continuous dividend yield as a decimal"),
    type: z.enum(["call", "put"]).default("call").describe("Option type"),
    exercise: z
      .enum(["american", "european"])
      .default("european")
      .describe("Exercise style — american allows early exercise"),
    steps: z
      .number()
      .int()
      .min(1)
      .max(200)
      .default(100)
      .describe("Number of tree steps (1-200; default 100, textbook standard)"),
  })
  .describe(
    "Cox-Ross-Rubinstein binomial tree pricing. Use this for American options (early exercise) instead of Black-Scholes. Returns binomial price, the Black-Scholes European-equivalent for comparison, the early-exercise premium, and delta.",
  );

export const PayoffLegSchema = z.object({
  type: z.enum(["call", "put"]).describe("Option type"),
  strike: z.number().positive().describe("Strike price"),
  premium: z.number().describe("Premium per contract (per share)"),
  quantity: z.number().int().default(1).describe("Number of contracts"),
  direction: z
    .enum(["long", "short"])
    .default("long")
    .describe("Long means bought, short means sold"),
});

export const PayoffDiagramSchema = z
  .object({
    legs: z
      .array(PayoffLegSchema)
      .min(1)
      .describe("Array of option legs that make up the strategy"),
    spot: z.number().positive().describe("Current spot price of the underlying"),
    price_range_pct: z
      .number()
      .positive()
      .default(30)
      .describe("Price range around spot for payoff calculation, as a percentage (30 = ±30%)"),
    points: z
      .number()
      .int()
      .min(1)
      .default(100)
      .describe("Number of evaluation points along the price range"),
  })
  .describe(
    "Generate the payoff diagram data for a multi-leg options strategy (single put, vertical spread, iron condor, etc.). Returns the price/PnL arrays, breakeven points, max profit, and max loss.",
  );

export const PutCallParitySchema = z
  .object({
    call_price: z.number().positive().describe("Observed call option price"),
    put_price: z.number().positive().describe("Observed put option price"),
    S: z.number().positive().describe("Spot price of the underlying"),
    K: z.number().positive().describe("Strike price (same for both options)"),
    T: z.number().positive().describe("Time to expiry in years"),
    r: z.number().default(0.05).describe("Risk-free rate as a decimal"),
    q: z.number().default(0).describe("Continuous dividend yield as a decimal"),
  })
  .describe(
    "Check put-call parity (C - P = S·e^(-qT) - K·e^(-rT)) and detect arbitrage. Use when comparing observed call and put prices at the same strike/expiry to flag mispricing.",
  );

// ═══════════════════════════════════════════════════════════════════════
// RISK BUNDLE — 4 tools (VaR, correlation, standalone Sharpe, z-score)
// ═══════════════════════════════════════════════════════════════════════

export const VarParametricSchema = z
  .object({
    returns: z
      .array(z.number())
      .min(10)
      .max(5000)
      .describe("Array of historical returns as decimals (10-5000 observations)"),
    confidence_levels: z
      .array(z.number())
      .min(1)
      .max(5)
      .default([0.95, 0.99])
      .describe("Confidence levels for VaR — typically [0.95, 0.99] (max 5 levels)"),
    holding_period_days: z
      .number()
      .int()
      .min(1)
      .max(252)
      .default(1)
      .describe("VaR holding period in days (1-252; 1 for daily VaR)"),
    portfolio_value: z
      .number()
      .positive()
      .optional()
      .describe("Optional portfolio value in dollars to also return dollar VaR"),
  })
  .describe(
    "Parametric Value-at-Risk and Conditional VaR (Expected Shortfall) using the normal-distribution closed form. Faster than the full risk audit; use this when the user wants VaR specifically.",
  );

export const CorrelationSchema = z
  .object({
    series: z
      .record(z.string(), z.array(z.number()))
      .describe(
        'Named return series as a dict: {"AAPL": [0.01, -0.02, ...], "MSFT": [...]}. Series will be truncated to the shortest length.',
      ),
  })
  .describe(
    "N×N correlation matrix from a set of return series. Use this for portfolio construction, pairs-trade signal generation, or before making a hedging decision. Returns the correlation matrix and annualized volatilities.",
  );

export const SharpeRatioSchema = z
  .object({
    returns: z
      .array(z.number())
      .min(5)
      .max(5000)
      .describe("Array of periodic returns as decimals (5-5000 observations)"),
    risk_free_rate: z.number().default(0.05).describe("Annual risk-free rate as a decimal"),
    annualization_factor: z
      .number()
      .int()
      .default(252)
      .describe("252 for daily, 52 for weekly, 12 for monthly"),
  })
  .describe(
    "Standalone Sharpe ratio with confidence interval (Lo 2002). Use when the user asks specifically for Sharpe; for a full risk profile use assess_portfolio_risk instead.",
  );

export const ZScoreSchema = z
  .object({
    series: z
      .array(z.number())
      .min(3)
      .max(5000)
      .describe("Numeric data series (3-5000 observations: price, return, or any time series)"),
    window: z
      .number()
      .int()
      .min(2)
      .max(5000)
      .optional()
      .describe("Rolling window size (2-5000); omit for static z-scores over the whole series"),
    threshold: z
      .number()
      .positive()
      .default(2.0)
      .describe("Z-score absolute value above which a point is flagged as extreme"),
  })
  .describe(
    "Z-scores (static and optionally rolling) with extreme-value detection. Use for anomaly detection, mean-reversion signals, and pairs-trade entry rules.",
  );

// ═══════════════════════════════════════════════════════════════════════
// DEFI BUNDLE — 2 crypto-specific tools (IL, liquidation price)
// ═══════════════════════════════════════════════════════════════════════

export const ImpermanentLossSchema = z
  .object({
    initial_price_ratio: z
      .number()
      .positive()
      .default(1.0)
      .describe("Initial price ratio of token A to token B at deposit time"),
    current_price_ratio: z
      .number()
      .positive()
      .describe("Current price ratio of token A to token B"),
    amm_type: z
      .enum(["v2", "v3"])
      .default("v2")
      .describe("AMM type — v2 (full-range Uniswap-style) or v3 (concentrated liquidity)"),
    lower_tick: z
      .number()
      .positive()
      .optional()
      .describe("Lower price bound for v3 concentrated liquidity (required if amm_type=v3)"),
    upper_tick: z
      .number()
      .positive()
      .optional()
      .describe("Upper price bound for v3 concentrated liquidity (required if amm_type=v3)"),
    initial_investment: z
      .number()
      .positive()
      .default(1000)
      .describe("Initial investment value in USD"),
  })
  .describe(
    "Impermanent loss calculator for Uniswap v2/v3 LP positions. Returns IL percentage, hold value, LP value, and fee breakeven APY. Use when the user is deciding whether to LP or whether their LP position is still earning enough to offset IL.",
  );

export const LiquidationPriceSchema = z
  .object({
    entry_price: z.number().positive().describe("Position entry price"),
    collateral: z.number().positive().describe("Collateral amount in USD"),
    position_size: z.number().positive().describe("Total position size in USD (notional)"),
    leverage: z.number().positive().describe("Leverage multiplier (e.g. 5 for 5×)"),
    direction: z.enum(["long", "short"]).describe("Position direction"),
    maintenance_margin_rate: z
      .number()
      .positive()
      .default(0.005)
      .describe("Maintenance margin rate as decimal (0.005 = 0.5%)"),
    funding_accumulated: z
      .number()
      .default(0)
      .describe("Accumulated funding payments in USD (negative if paid out)"),
  })
  .describe(
    "Liquidation price for a leveraged perp / margin position. Returns the liquidation price, distance from entry as a percentage, current margin ratio, and max loss before liquidation. Use before opening a leveraged position or to evaluate an existing one.",
  );
