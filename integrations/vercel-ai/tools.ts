import { tool } from "ai";
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
import { QUANTORACLE_BASE_URL, USER_AGENT } from "./constants";

/**
 * Optional callback for handling x402 payment for paid composite endpoints.
 *
 * When QuantOracle returns 402 Payment Required, this callback is invoked
 * with the 402 response (which contains the payment requirements). Your
 * implementation should sign and return the X-PAYMENT header value, then
 * we'll retry the request.
 *
 * Only the two core "paid composite" tools (`assess_portfolio_risk`,
 * `recommend_hedge`) return 402 on first call. All other tools work
 * inside the 1,000 calls/IP/day free tier.
 *
 * See https://github.com/coinbase/x402 for the wallet integration.
 */
export type X402PayHandler = (
  paymentRequirements: Record<string, unknown>,
) => Promise<string>;

/**
 * Bundle keys recognized by the `include` option on `quantoracleTools`.
 *
 * - `core` — 5 always-shipped tools: price_option, calculate_kelly,
 *   simulate_portfolio, assess_portfolio_risk, recommend_hedge.
 * - `options` — 4 options-focused tools: implied_vol, binomial_tree,
 *   payoff_diagram, put_call_parity.
 * - `risk` — 4 standalone risk/stats tools: var_parametric,
 *   correlation, sharpe_ratio, zscore.
 * - `defi` — 2 crypto-specific tools: impermanent_loss,
 *   liquidation_price.
 *
 * Pass `'all'` to include every bundle. The default is `['core']`.
 */
export type QuantOracleBundle = "core" | "options" | "risk" | "defi";

export interface ToolsOptions {
  /**
   * Base URL for the QuantOracle API. Defaults to the public production
   * endpoint. Set this when proxying through a private gateway.
   */
  baseUrl?: string;
  /**
   * Handler for x402 payments on paid composite endpoints. Required for
   * `assess_portfolio_risk` and `recommend_hedge` (in the core bundle).
   * Other tools work inside the free tier without it.
   */
  x402PayHandler?: X402PayHandler;
  /**
   * Which tool bundles to include. Defaults to `['core']` — the 5
   * highest-leverage tools. Use `'all'` to include every bundle.
   *
   * @example
   * ```ts
   * quantoracleTools({ include: ['core', 'options'] })
   * quantoracleTools({ include: 'all' })
   * ```
   */
  include?: readonly QuantOracleBundle[] | "all";
}

async function callApi(
  path: string,
  body: Record<string, unknown>,
  options: ToolsOptions,
): Promise<Record<string, unknown>> {
  const baseUrl = options.baseUrl ?? QUANTORACLE_BASE_URL;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": USER_AGENT,
    "X-Source": "vercel-ai-sdk",
  };

  let res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (res.status === 402 && options.x402PayHandler) {
    const requirements = (await res.clone().json()) as Record<string, unknown>;
    const paymentHeader = await options.x402PayHandler(requirements);
    res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { ...headers, "X-PAYMENT": paymentHeader },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = JSON.stringify(j).slice(0, 200);
    } catch {
      // body may not be JSON
    }
    throw new Error(`QuantOracle ${path} returned ${res.status}: ${detail}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════
// CORE BUNDLE
// ═══════════════════════════════════════════════════════════════════════

function makeCoreTools(options: ToolsOptions) {
  return {
    price_option: tool({
      description:
        "Price a European call or put option using Black-Scholes. Returns the theoretical price, breakeven, probability ITM, and all first-order Greeks (delta, gamma, vega, theta, rho). Use this whenever the user asks about option pricing, fair value, or Greeks. Deterministic — same inputs always produce the same outputs. For American options use binomial_tree instead.",
      parameters: PriceOptionSchema,
      execute: async (args) => {
        const data = await callApi("/v1/options/price", args, options);
        const greeks = (data.greeks ?? {}) as Record<string, number>;
        return {
          summary: `${args.option_type.toUpperCase()} on $${args.S} underlying, $${args.K} strike, ${(args.T * 365).toFixed(0)}d to expiry, ${(args.sigma * 100).toFixed(1)}% IV`,
          price: data.price as number,
          breakeven: data.breakeven as number,
          probability_itm: data.prob_itm as number,
          greeks: {
            delta: greeks.delta,
            gamma: greeks.gamma,
            vega: greeks.vega,
            theta_per_day: greeks.theta,
            rho: greeks.rho,
          },
          computed_ms: data.ms as number,
          source: "QuantOracle Black-Scholes",
        };
      },
    }),

    calculate_kelly: tool({
      description:
        "Calculate Kelly Criterion optimal bet sizing from a strategy's win rate and average win/loss. Returns full-, half-, and quarter-Kelly fractions plus the edge per dollar risked and payoff ratio. Use this when the user asks how much to risk per trade, how to size a position, or wants to validate a strategy is positive-EV. Most professionals use half- or quarter-Kelly because edge estimates are noisy.",
      parameters: CalculateKellySchema,
      execute: async (args) => {
        const data = await callApi(
          "/v1/risk/kelly",
          { mode: "discrete", ...args },
          options,
        );
        return {
          summary: `Kelly sizing for ${(args.win_rate * 100).toFixed(1)}% win rate, $${args.avg_win} avg win, $${args.avg_loss} avg loss`,
          full_kelly_pct: (data.full_kelly as number) * 100,
          half_kelly_pct: (data.half_kelly as number) * 100,
          quarter_kelly_pct: (data.quarter_kelly as number) * 100,
          edge_pct: data.edge as number,
          payoff_ratio: data.payoff_ratio as number,
          recommendation: (data.recommended as string)?.replace(/_/g, " ").toLowerCase(),
          negative_edge: (data.full_kelly as number) < 0,
          source: "QuantOracle Kelly Criterion",
        };
      },
    }),

    simulate_portfolio: tool({
      description:
        "Run a Monte Carlo simulation projecting the distribution of portfolio outcomes over a chosen time horizon. Returns terminal-value percentiles (P5/median/P95), CAGR, probability of loss, and probability of ruin under withdrawals. Use this for long-term outcome distributions, retirement scenarios, sequence-of-returns risk, or 'what's the chance my portfolio survives X years'. Uses geometric Brownian motion.",
      parameters: SimulatePortfolioSchema,
      execute: async (args) => {
        const data = await callApi("/v1/simulate/montecarlo", args, options);
        const t = data.terminal as Record<string, number>;
        return {
          summary: `Monte Carlo: $${args.initial_value.toLocaleString()} over ${args.years}y, ${(args.annual_return * 100).toFixed(1)}% return, ${(args.annual_vol * 100).toFixed(1)}% vol`,
          terminal: { p5: t.p5, p25: t.p25, median: t.median, p75: t.p75, p95: t.p95 },
          median_cagr_pct: (data.cagr as number) * 100,
          prob_loss_pct: (data.prob_loss as number) * 100,
          prob_ruin_pct: (data.prob_ruin as number) * 100,
          simulations_run: args.simulations,
          computed_ms: data.ms as number,
          source: "QuantOracle Monte Carlo",
        };
      },
    }),

    assess_portfolio_risk: tool({
      description:
        "Run a comprehensive risk audit on a return series. Returns Sharpe, Sortino, Calmar, max drawdown, VaR (95%/99%), CVaR / Expected Shortfall, Kelly fraction, and Hurst exponent in a single response. Use this when the user wants a full risk profile, a one-page summary, or to compare strategies on multiple dimensions. PAID composite endpoint — $0.04 per call settled in USDC via x402. Requires x402PayHandler. Minimum 30 return observations; 252+ recommended. For VaR or Sharpe alone, use var_parametric or sharpe_ratio instead (free tier).",
      parameters: AssessPortfolioRiskSchema,
      execute: async (args) => {
        const data = await callApi("/v1/risk/full-analysis", args, options);
        const sharpe = (data.sharpe as Record<string, number>)?.sharpe_ratio ?? 0;
        const sortino = (data.sortino as Record<string, number>)?.sortino_ratio ?? 0;
        const calmar = (data.calmar as Record<string, number>)?.calmar_ratio ?? 0;
        const maxDd = (data.drawdown as Record<string, number>)?.max_drawdown ?? 0;
        const varBlock = data.var as Record<string, Record<string, Record<string, number>>>;
        const var95 = varBlock?.var_results?.["95"]?.var_pct ?? 0;
        const cvar95 = varBlock?.var_results?.["95"]?.cvar_pct ?? 0;
        const kelly = (data.kelly as Record<string, number>)?.kelly_fraction ?? 0;
        const hurst = (data.hurst as Record<string, number>)?.hurst_exponent ?? 0;
        return {
          summary: `Risk audit on ${args.returns.length} observations (paid via x402, $0.04 USDC)`,
          sharpe_ratio: sharpe,
          sortino_ratio: sortino,
          calmar_ratio: calmar,
          max_drawdown_pct: maxDd * 100,
          var_95_pct: var95,
          cvar_95_pct: cvar95,
          kelly_fraction_pct: kelly * 100,
          hurst_exponent: hurst,
          regime: hurst > 0.6 ? "trending" : hurst < 0.4 ? "mean-reverting" : "random walk",
          paid: true,
          source: "QuantOracle composite risk audit",
        };
      },
    }),

    recommend_hedge: tool({
      description:
        "Recommend ranked hedge structures (collar, protective put, partial put, inverse) for an existing long or short position. Each recommendation includes cost % of position, downside floor, upside cap (if any), and option legs. Use when the user has a position they want to protect ahead of an event without selling, or wants to compare hedge structures. PAID composite endpoint — $0.04 per call settled in USDC via x402.",
      parameters: RecommendHedgeSchema,
      execute: async (args) => {
        const data = await callApi("/v1/hedging/recommend", args, options);
        const structures = (data.structures as Array<Record<string, unknown>>) ?? [];
        return {
          summary: `Hedge recommendations for $${args.position_value.toLocaleString()} ${args.position_type} over ${args.time_horizon_days}d (paid via x402, $0.04 USDC)`,
          structures: structures.map((s) => ({
            name: s.name as string,
            cost_pct: (s.cost_pct as number) * 100,
            cost_dollars: s.cost_dollars as number,
            downside_floor_pct: (s.downside_floor as number) * 100,
            upside_cap_pct: s.upside_cap ? (s.upside_cap as number) * 100 : null,
            legs: s.legs,
          })),
          paid: true,
          source: "QuantOracle hedge recommender",
        };
      },
    }),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// OPTIONS BUNDLE
// ═══════════════════════════════════════════════════════════════════════

function makeOptionsTools(options: ToolsOptions) {
  return {
    implied_vol: tool({
      description:
        "Solve for implied volatility given an observed market option price. Newton-Raphson solver, converges in 5-8 iterations. Use when the user has a market price for an option and wants to know what volatility the market is pricing in (often called 'IV'). Returns the implied volatility as both a decimal and a percentage.",
      parameters: ImpliedVolatilitySchema,
      execute: async (args) => {
        const data = await callApi("/v1/options/implied-vol", args, options);
        return {
          summary: `Implied vol for ${args.type} @ $${args.K} strike, market price $${args.market_price}: ${(data.annualized_pct as number).toFixed(2)}%`,
          implied_volatility: data.implied_volatility as number,
          annualized_pct: data.annualized_pct as number,
          model_price: data.model_price as number,
          market_price: data.market_price as number,
          iterations: data.iterations as number,
          computed_ms: data.ms as number,
          source: "QuantOracle IV solver (Newton-Raphson)",
        };
      },
    }),

    binomial_tree: tool({
      description:
        "Price an American or European option via the Cox-Ross-Rubinstein binomial tree. Use this for American options (early exercise) instead of Black-Scholes. Returns the binomial price, the European Black-Scholes equivalent for comparison, the early-exercise premium (positive when early exercise has value), the steps used, and delta. 100-300 steps typical for production.",
      parameters: BinomialTreeSchema,
      execute: async (args) => {
        const data = await callApi("/v1/derivatives/binomial-tree", args, options);
        return {
          summary: `${args.exercise.toUpperCase()} ${args.type} via binomial tree (${args.steps} steps): $${(data.price as number).toFixed(4)}`,
          price: data.price as number,
          bs_price_european: data.bs_price as number,
          early_exercise_premium: data.early_exercise_premium as number,
          delta: data.delta as number,
          steps: data.steps as number,
          exercise: data.exercise as string,
          computed_ms: data.ms as number,
          source: "QuantOracle CRR binomial tree",
        };
      },
    }),

    payoff_diagram: tool({
      description:
        "Generate payoff-diagram data for a multi-leg options strategy: single put, vertical spread, iron condor, straddle, etc. Returns price/PnL arrays for plotting, breakeven points, max profit, and max loss. Use this when the user wants to visualize or analyze the payoff profile of a defined strategy.",
      parameters: PayoffDiagramSchema,
      execute: async (args) => {
        const data = await callApi("/v1/options/payoff-diagram", args, options);
        return {
          summary: `Payoff: ${args.legs.length} legs around $${args.spot} spot, ±${args.price_range_pct}% range`,
          prices: data.prices as number[],
          pnl: data.pnl as number[],
          breakeven_points: data.breakeven_points as number[],
          max_profit: data.max_profit as number,
          max_loss: data.max_loss as number,
          computed_ms: data.ms as number,
          source: "QuantOracle payoff engine",
        };
      },
    }),

    put_call_parity: tool({
      description:
        "Check put-call parity (C - P = S·e^(-qT) - K·e^(-rT)) and detect arbitrage. Use when comparing observed call and put prices at the same strike and expiry to flag mispricing. Returns whether parity holds, the deviation, theoretical fair prices for the call and put, the arbitrage signal (SELL_CALL_BUY_PUT_BUY_STOCK / BUY_CALL_SELL_PUT_SELL_STOCK / NONE), and the arbitrage profit.",
      parameters: PutCallParitySchema,
      execute: async (args) => {
        const data = await callApi("/v1/derivatives/put-call-parity", args, options);
        return {
          summary: `Parity ${data.parity_holds ? "holds" : "VIOLATED"} — deviation $${(data.deviation as number).toFixed(4)}`,
          parity_holds: data.parity_holds as boolean,
          deviation: data.deviation as number,
          deviation_pct: data.deviation_pct as number,
          theoretical_call: data.theoretical_call as number,
          theoretical_put: data.theoretical_put as number,
          arbitrage_signal: data.arbitrage_signal as string,
          arbitrage_profit: data.arbitrage_profit as number,
          computed_ms: data.ms as number,
          source: "QuantOracle put-call parity",
        };
      },
    }),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// RISK BUNDLE
// ═══════════════════════════════════════════════════════════════════════

function makeRiskTools(options: ToolsOptions) {
  return {
    var_parametric: tool({
      description:
        "Parametric Value-at-Risk and Conditional VaR (Expected Shortfall) using the normal-distribution closed form. Use when the user wants VaR specifically. Faster and cheaper than the full risk audit. Returns VaR/CVaR at each requested confidence level (default 95% and 99%), in percentage and optionally dollar terms.",
      parameters: VarParametricSchema,
      execute: async (args) => {
        const data = await callApi("/v1/risk/var-parametric", args, options);
        return {
          summary: `${args.holding_period_days}-day parametric VaR on ${args.returns.length} returns`,
          var_results: data.var_results,
          holding_period_days: data.holding_period_days as number,
          volatility_daily: data.volatility_daily as number,
          volatility_annual: data.volatility_annual as number,
          skewness: data.skewness as number,
          kurtosis: data.kurtosis as number,
          n: data.n as number,
          computed_ms: data.ms as number,
          source: "QuantOracle parametric VaR",
        };
      },
    }),

    correlation: tool({
      description:
        "Compute the N×N correlation matrix from multiple return series. Use this for portfolio construction, pair-trade signal generation, hedge selection, or whenever the user asks how two or more assets move together. Input is a named dict of return arrays (series will be truncated to the shortest length).",
      parameters: CorrelationSchema,
      execute: async (args) => {
        const data = await callApi("/v1/risk/correlation", args, options);
        return {
          summary: `Correlation matrix on ${(data.assets as string[]).length} assets, ${data.n} observations`,
          assets: data.assets as string[],
          correlation: data.correlation as number[][],
          volatilities: data.volatilities as Record<string, number>,
          n: data.n as number,
          computed_ms: data.ms as number,
          source: "QuantOracle correlation",
        };
      },
    }),

    sharpe_ratio: tool({
      description:
        "Compute the standalone Sharpe ratio from a return series, with a 95% confidence interval (Lo 2002). Use when the user asks specifically for Sharpe — cheaper and faster than assess_portfolio_risk. Returns the Sharpe ratio, annualized return, annualized vol, excess return, standard error, and CI bounds.",
      parameters: SharpeRatioSchema,
      execute: async (args) => {
        const data = await callApi("/v1/stats/sharpe-ratio", args, options);
        return {
          summary: `Sharpe ${(data.sharpe_ratio as number).toFixed(2)} on ${args.returns.length} returns (95% CI: ${(data.ci_95_lower as number).toFixed(2)} – ${(data.ci_95_upper as number).toFixed(2)})`,
          sharpe_ratio: data.sharpe_ratio as number,
          annualized_return: data.annualized_return as number,
          annualized_vol: data.annualized_vol as number,
          excess_return: data.excess_return as number,
          se_sharpe: data.se_sharpe as number,
          ci_95_lower: data.ci_95_lower as number,
          ci_95_upper: data.ci_95_upper as number,
          n: data.n as number,
          computed_ms: data.ms as number,
          source: "QuantOracle Sharpe ratio",
        };
      },
    }),

    zscore: tool({
      description:
        "Compute static and (optionally) rolling z-scores with extreme-value detection. Use for anomaly detection, mean-reversion signals, and pairs-trade entry rules. If `window` is provided, returns a rolling z-score series. Returns extreme indices where |z| exceeds the threshold.",
      parameters: ZScoreSchema,
      execute: async (args) => {
        const data = await callApi("/v1/stats/zscore", args, options);
        return {
          summary: `Z-score: current ${(data.current_zscore as number).toFixed(2)}, ${data.extreme_count} extremes (|z| > ${args.threshold})`,
          z_scores: data.z_scores as number[],
          rolling_z: data.rolling_z as number[] | null,
          mean: data.mean as number,
          std_dev: data.std_dev as number,
          current_zscore: data.current_zscore as number,
          extreme_indices: data.extreme_indices as number[],
          extreme_count: data.extreme_count as number,
          computed_ms: data.ms as number,
          source: "QuantOracle z-score",
        };
      },
    }),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// DEFI BUNDLE
// ═══════════════════════════════════════════════════════════════════════

function makeDefiTools(options: ToolsOptions) {
  return {
    impermanent_loss: tool({
      description:
        "Calculate impermanent loss for a Uniswap v2 or v3 LP position. Use when the user is deciding whether to LP, evaluating an existing LP position, or asking whether trading fees offset IL. Returns IL %, hold value (50/50 HODL), LP value, the dollar loss vs HODL, and the fee APY required to break even. v3 requires lower_tick and upper_tick.",
      parameters: ImpermanentLossSchema,
      execute: async (args) => {
        const data = await callApi("/v1/crypto/impermanent-loss", args, options);
        return {
          summary: `${args.amm_type.toUpperCase()} IL: ${(data.impermanent_loss_pct as number).toFixed(2)}% on $${args.initial_investment.toLocaleString()} LP position`,
          impermanent_loss_pct: data.impermanent_loss_pct as number,
          hold_value: data.hold_value as number,
          lp_value: data.lp_value as number,
          loss_amount: data.loss_amount as number,
          fee_breakeven_apy: data.fee_breakeven_apy as number,
          price_ratio: data.price_ratio as number,
          amm_type: data.amm_type as string,
          computed_ms: data.ms as number,
          source: "QuantOracle impermanent loss",
        };
      },
    }),

    liquidation_price: tool({
      description:
        "Compute the liquidation price for a leveraged perp or margin position. Use when the user is opening a leveraged position, evaluating an existing one, or asking 'how far can the price move before I get liquidated'. Returns the liquidation price, distance from entry as a percentage, current margin ratio, and max loss before liquidation. Accepts accumulated funding to refine the calculation for perps.",
      parameters: LiquidationPriceSchema,
      execute: async (args) => {
        const data = await callApi("/v1/crypto/liquidation-price", args, options);
        return {
          summary: `${args.direction.toUpperCase()} liquidation at $${(data.liquidation_price as number).toFixed(2)} (${(data.distance_pct as number).toFixed(2)}% from entry)`,
          liquidation_price: data.liquidation_price as number,
          distance_pct: data.distance_pct as number,
          effective_leverage: data.effective_leverage as number,
          margin_ratio_current: data.margin_ratio_current as number,
          max_loss_before_liq: data.max_loss_before_liq as number,
          direction: data.direction as string,
          safe_price_range: data.safe_price_range,
          computed_ms: data.ms as number,
          source: "QuantOracle liquidation price",
        };
      },
    }),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════

/**
 * Build the QuantOracle tools as a Vercel AI SDK tools record.
 *
 * The default `quantoracleTools()` call ships the 5-tool core bundle —
 * Black-Scholes, Kelly, Monte Carlo, risk audit, hedge recommender. Add
 * bundles via the `include` option:
 *
 * @example Default — 5 core tools
 * ```ts
 * const tools = quantoracleTools();
 * ```
 *
 * @example Add the options bundle (9 tools total)
 * ```ts
 * const tools = quantoracleTools({ include: ['core', 'options'] });
 * ```
 *
 * @example All 15 tools
 * ```ts
 * const tools = quantoracleTools({ include: 'all' });
 * ```
 *
 * @example DeFi-focused agent
 * ```ts
 * const tools = quantoracleTools({ include: ['core', 'defi'] });
 * ```
 */
export function quantoracleTools(options: ToolsOptions = {}) {
  const include = options.include ?? ["core"];
  const wantAll = include === "all";
  const wants = (b: QuantOracleBundle) =>
    wantAll || (Array.isArray(include) && include.includes(b));

  // Inline conditional spreads let TypeScript infer the union return type
  // without tripping the AI SDK's contravariant `Tool<ToolParameters>`
  // index-signature check. Explicit `Record<string, ReturnType<typeof tool>>`
  // typing here fails because each tool's parameters schema is distinct.
  return {
    ...(wants("core") ? makeCoreTools(options) : {}),
    ...(wants("options") ? makeOptionsTools(options) : {}),
    ...(wants("risk") ? makeRiskTools(options) : {}),
    ...(wants("defi") ? makeDefiTools(options) : {}),
  };
}

/**
 * Convenience alias when wiring the paid-only flow. Functionally identical
 * to `quantoracleTools` but requires that `x402PayHandler` is set.
 */
export function quantoraclePaidTools(options: ToolsOptions) {
  if (!options.x402PayHandler) {
    throw new Error(
      "quantoraclePaidTools requires options.x402PayHandler — see https://github.com/coinbase/x402 for wallet integration.",
    );
  }
  return quantoracleTools(options);
}
