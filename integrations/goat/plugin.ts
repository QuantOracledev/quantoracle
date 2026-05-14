import { Chain, PluginBase, Tool } from "@goat-sdk/core";
import { QUANTORACLE_BASE_URL, USER_AGENT } from "./constants";
import {
  AssessPortfolioRiskParameters,
  BinomialTreeParameters,
  CalculateKellyParameters,
  CorrelationParameters,
  ImpermanentLossParameters,
  ImpliedVolatilityParameters,
  LiquidationPriceParameters,
  PayoffDiagramParameters,
  PriceOptionParameters,
  PutCallParityParameters,
  RecommendHedgeParameters,
  SharpeRatioParameters,
  SimulatePortfolioParameters,
  VarParametricParameters,
  ZScoreParameters,
} from "./parameters";

/**
 * Optional callback for handling x402 payment for paid composite endpoints.
 *
 * Only the two core "paid composite" tools (`assess_portfolio_risk`,
 * `recommend_hedge`) return 402 on first call. All other tools work
 * inside the 1,000 calls/IP/day free tier.
 *
 * See https://github.com/coinbase/x402 for wallet-side signing patterns.
 */
export type X402PayHandler = (
  paymentRequirements: Record<string, unknown>,
) => Promise<string>;

/**
 * Bundle keys recognized by the `quantoracle()` factory.
 *
 * - `core` — 5 always-shipped tools: Black-Scholes, Kelly, Monte Carlo,
 *   risk audit, hedge recommender
 * - `options` — 4 options-focused tools: implied vol, binomial tree,
 *   payoff diagram, put-call parity
 * - `risk` — 4 standalone risk/stats tools: VaR, correlation, Sharpe,
 *   z-score
 * - `defi` — 2 crypto-specific tools: impermanent loss, liquidation price
 */
export type QuantOracleBundle = "core" | "options" | "risk" | "defi";

export interface QuantOraclePluginOptions {
  /** Base URL for the QuantOracle API. Defaults to production. */
  baseUrl?: string;
  /** x402 payment handler. Required for paid core composites. */
  x402PayHandler?: X402PayHandler;
  /** Which bundles to include. Defaults to `['core']`. */
  include?: readonly QuantOracleBundle[] | "all";
}

// ═══════════════════════════════════════════════════════════════════════
// Shared base — every bundle plugin extends this and reuses callApi
// ═══════════════════════════════════════════════════════════════════════

abstract class QuantOracleBasePlugin extends PluginBase {
  protected readonly baseUrl: string;
  protected readonly x402PayHandler?: X402PayHandler;

  constructor(name: string, opts: QuantOraclePluginOptions = {}) {
    super(name, []);
    this.baseUrl = opts.baseUrl ?? QUANTORACLE_BASE_URL;
    this.x402PayHandler = opts.x402PayHandler;
  }

  /**
   * QuantOracle works on every chain because the calculations are pure
   * math — no on-chain reads. x402 settlement for the 2 paid core
   * composites works on Base mainnet and Solana mainnet, but the agent
   * doesn't need to be on those chains to call the free tools.
   */
  supportsChain = (_chain: Chain): boolean => true;

  protected async callApi(
    path: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      "X-Source": "goat-sdk",
    };
    let res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (res.status === 402 && this.x402PayHandler) {
      const requirements = (await res.clone().json()) as Record<string, unknown>;
      const paymentHeader = await this.x402PayHandler(requirements);
      res = await fetch(`${this.baseUrl}${path}`, {
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
        // ignore — body may not be JSON
      }
      throw new Error(`QuantOracle ${path} returned ${res.status}: ${detail}`);
    }
    return (await res.json()) as Record<string, unknown>;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CORE BUNDLE — 5 always-shipped tools
// ═══════════════════════════════════════════════════════════════════════

export class QuantOracleCorePlugin extends QuantOracleBasePlugin {
  constructor(opts: QuantOraclePluginOptions = {}) {
    super("quantoracle-core", opts);
  }

  @Tool({
    description:
      "Price a European call or put option using Black-Scholes. Returns the theoretical price, breakeven, probability ITM, and full first-order Greeks (delta, gamma, vega, theta, rho). Use whenever the user asks about option pricing, fair value, or Greeks. Deterministic — same inputs always produce the same outputs. For American options use binomial_tree instead.",
  })
  async priceOption(parameters: PriceOptionParameters) {
    const args = parameters as unknown as {
      S: number; K: number; T: number; r: number; sigma: number;
      option_type: "call" | "put";
    };
    const data = await this.callApi("/v1/options/price", args);
    const greeks = (data.greeks ?? {}) as Record<string, number>;
    return {
      summary: `${args.option_type.toUpperCase()} on $${args.S}, $${args.K} strike, ${(args.T * 365).toFixed(0)}d, ${(args.sigma * 100).toFixed(1)}% IV`,
      price: data.price as number,
      breakeven: data.breakeven as number,
      probability_itm: data.prob_itm as number,
      greeks: {
        delta: greeks.delta, gamma: greeks.gamma, vega: greeks.vega,
        theta_per_day: greeks.theta, rho: greeks.rho,
      },
      computed_ms: data.ms as number,
      source: "QuantOracle Black-Scholes",
    };
  }

  @Tool({
    description:
      "Calculate Kelly Criterion optimal bet sizing from a strategy's win rate and average win/loss. Returns full-, half-, and quarter-Kelly fractions plus edge and payoff ratio. Use when the user asks how much to risk per trade or wants to validate a strategy is positive-EV.",
  })
  async calculateKelly(parameters: CalculateKellyParameters) {
    const args = parameters as unknown as { win_rate: number; avg_win: number; avg_loss: number };
    const data = await this.callApi("/v1/risk/kelly", { mode: "discrete", ...args });
    return {
      summary: `Kelly for ${(args.win_rate * 100).toFixed(1)}% win rate`,
      full_kelly_pct: (data.full_kelly as number) * 100,
      half_kelly_pct: (data.half_kelly as number) * 100,
      quarter_kelly_pct: (data.quarter_kelly as number) * 100,
      edge_pct: data.edge as number,
      payoff_ratio: data.payoff_ratio as number,
      recommendation: (data.recommended as string)?.replace(/_/g, " ").toLowerCase(),
      negative_edge: (data.full_kelly as number) < 0,
      source: "QuantOracle Kelly Criterion",
    };
  }

  @Tool({
    description:
      "Run a Monte Carlo simulation projecting the distribution of portfolio outcomes. Returns terminal-value percentiles (P5/median/P95), CAGR, probability of loss, probability of ruin under withdrawals. Use for long-term outcome distributions, retirement scenarios, sequence-of-returns risk.",
  })
  async simulatePortfolio(parameters: SimulatePortfolioParameters) {
    const args = parameters as unknown as {
      initial_value: number; annual_return: number; annual_vol: number;
      years: number; simulations: number; contributions: number; withdrawal_rate: number;
    };
    const data = await this.callApi("/v1/simulate/montecarlo", args);
    const t = data.terminal as Record<string, number>;
    return {
      summary: `Monte Carlo: $${args.initial_value.toLocaleString()} over ${args.years}y`,
      terminal: { p5: t.p5, p25: t.p25, median: t.median, p75: t.p75, p95: t.p95 },
      median_cagr_pct: (data.cagr as number) * 100,
      prob_loss_pct: (data.prob_loss as number) * 100,
      prob_ruin_pct: (data.prob_ruin as number) * 100,
      simulations_run: args.simulations,
      computed_ms: data.ms as number,
      source: "QuantOracle Monte Carlo",
    };
  }

  @Tool({
    description:
      "Comprehensive risk audit on a return series: Sharpe, Sortino, Calmar, max drawdown, VaR (95%/99%), CVaR, Kelly fraction, Hurst exponent — all in one call. Use when the user wants a full risk profile or to compare strategies on many dimensions. PAID composite — $0.04 USDC via x402 on Base or Solana. Requires plugin to be configured with x402PayHandler. Min 30 observations.",
  })
  async assessPortfolioRisk(parameters: AssessPortfolioRiskParameters) {
    const args = parameters as unknown as {
      returns: number[]; risk_free_rate: number; annualization_factor: number;
    };
    const data = await this.callApi("/v1/risk/full-analysis", args);
    const varBlock = data.var as Record<string, Record<string, Record<string, number>>>;
    return {
      summary: `Risk audit on ${args.returns.length} observations (paid via x402, $0.04 USDC)`,
      sharpe_ratio: (data.sharpe as Record<string, number>)?.sharpe_ratio ?? 0,
      sortino_ratio: (data.sortino as Record<string, number>)?.sortino_ratio ?? 0,
      calmar_ratio: (data.calmar as Record<string, number>)?.calmar_ratio ?? 0,
      max_drawdown_pct: ((data.drawdown as Record<string, number>)?.max_drawdown ?? 0) * 100,
      var_95_pct: varBlock?.var_results?.["95"]?.var_pct ?? 0,
      cvar_95_pct: varBlock?.var_results?.["95"]?.cvar_pct ?? 0,
      kelly_fraction_pct: ((data.kelly as Record<string, number>)?.kelly_fraction ?? 0) * 100,
      hurst_exponent: (data.hurst as Record<string, number>)?.hurst_exponent ?? 0,
      paid: true,
      source: "QuantOracle composite risk audit",
    };
  }

  @Tool({
    description:
      "Recommend ranked hedge structures (collar, protective put, partial put, inverse) for an existing position. Each includes cost %, downside floor, upside cap, and option legs. Use when the user wants to protect a position ahead of an event without selling. PAID composite — $0.04 USDC via x402.",
  })
  async recommendHedge(parameters: RecommendHedgeParameters) {
    const args = parameters as unknown as {
      position_type: "long_stock" | "short_stock" | "long_crypto" | "long_options";
      position_value: number; asset_price: number; volatility: number;
      time_horizon_days: number; max_hedge_cost_pct: number; r: number;
    };
    const data = await this.callApi("/v1/hedging/recommend", args);
    const structures = (data.structures as Array<Record<string, unknown>>) ?? [];
    return {
      summary: `Hedge for $${args.position_value.toLocaleString()} ${args.position_type} (paid via x402, $0.04)`,
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
  }
}

// ═══════════════════════════════════════════════════════════════════════
// OPTIONS BUNDLE
// ═══════════════════════════════════════════════════════════════════════

export class QuantOracleOptionsPlugin extends QuantOracleBasePlugin {
  constructor(opts: QuantOraclePluginOptions = {}) {
    super("quantoracle-options", opts);
  }

  @Tool({
    description:
      "Solve for implied volatility given an observed market option price. Newton-Raphson, converges in 5-8 iterations. Use when the user has a market price and wants to know what volatility the market is pricing in (often called 'IV').",
  })
  async impliedVol(parameters: ImpliedVolatilityParameters) {
    const args = parameters as unknown as {
      S: number; K: number; T: number; r: number; q: number;
      market_price: number; type: "call" | "put";
    };
    const data = await this.callApi("/v1/options/implied-vol", args);
    return {
      summary: `IV for ${args.type} @ $${args.K}: ${(data.annualized_pct as number).toFixed(2)}%`,
      implied_volatility: data.implied_volatility as number,
      annualized_pct: data.annualized_pct as number,
      model_price: data.model_price as number,
      iterations: data.iterations as number,
      computed_ms: data.ms as number,
      source: "QuantOracle IV solver",
    };
  }

  @Tool({
    description:
      "Price American or European options via the Cox-Ross-Rubinstein binomial tree. Use this for American options instead of Black-Scholes. Returns binomial price, Black-Scholes European equivalent for comparison, early-exercise premium, and delta.",
  })
  async binomialTree(parameters: BinomialTreeParameters) {
    const args = parameters as unknown as {
      S: number; K: number; T: number; r: number; sigma: number; q: number;
      type: "call" | "put"; exercise: "american" | "european"; steps: number;
    };
    const data = await this.callApi("/v1/derivatives/binomial-tree", args);
    return {
      summary: `${args.exercise.toUpperCase()} ${args.type}: $${(data.price as number).toFixed(4)}`,
      price: data.price as number,
      bs_price_european: data.bs_price as number,
      early_exercise_premium: data.early_exercise_premium as number,
      delta: data.delta as number,
      steps: data.steps as number,
      exercise: data.exercise as string,
      computed_ms: data.ms as number,
      source: "QuantOracle CRR binomial tree",
    };
  }

  @Tool({
    description:
      "Generate payoff-diagram data for a multi-leg options strategy: spread, condor, straddle, etc. Returns price/PnL arrays for plotting, breakevens, max profit, max loss. Use when the user wants to visualize or analyze a defined strategy's payoff profile.",
  })
  async payoffDiagram(parameters: PayoffDiagramParameters) {
    const args = parameters as unknown as {
      legs: Array<unknown>; spot: number; price_range_pct: number; points: number;
    };
    const data = await this.callApi("/v1/options/payoff-diagram", args);
    return {
      summary: `Payoff: ${args.legs.length} legs around $${args.spot}`,
      prices: data.prices as number[],
      pnl: data.pnl as number[],
      breakeven_points: data.breakeven_points as number[],
      max_profit: data.max_profit as number,
      max_loss: data.max_loss as number,
      computed_ms: data.ms as number,
      source: "QuantOracle payoff engine",
    };
  }

  @Tool({
    description:
      "Check put-call parity (C - P = S·e^(-qT) - K·e^(-rT)) and detect arbitrage. Use when comparing call/put prices at the same strike/expiry to flag mispricing. Returns whether parity holds, deviation, theoretical fair prices, arbitrage signal, and profit.",
  })
  async putCallParity(parameters: PutCallParityParameters) {
    const args = parameters as unknown as {
      call_price: number; put_price: number; S: number; K: number;
      T: number; r: number; q: number;
    };
    const data = await this.callApi("/v1/derivatives/put-call-parity", args);
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
  }
}

// ═══════════════════════════════════════════════════════════════════════
// RISK BUNDLE
// ═══════════════════════════════════════════════════════════════════════

export class QuantOracleRiskPlugin extends QuantOracleBasePlugin {
  constructor(opts: QuantOraclePluginOptions = {}) {
    super("quantoracle-risk", opts);
  }

  @Tool({
    description:
      "Parametric Value-at-Risk and Conditional VaR (Expected Shortfall) via the normal closed form. Use when the user wants VaR specifically. Faster and cheaper than the full risk audit. Returns VaR/CVaR at each confidence level in percentage and optionally dollar terms.",
  })
  async varParametric(parameters: VarParametricParameters) {
    const args = parameters as unknown as {
      returns: number[]; confidence_levels: number[];
      holding_period_days: number; portfolio_value?: number;
    };
    const data = await this.callApi("/v1/risk/var-parametric", args);
    return {
      summary: `${args.holding_period_days}d parametric VaR on ${args.returns.length} returns`,
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
  }

  @Tool({
    description:
      "N×N correlation matrix from multiple return series. Use for portfolio construction, pair-trade signal generation, hedge selection, or comparing how assets move together. Input is a named dict of return arrays.",
  })
  async correlation(parameters: CorrelationParameters) {
    const args = parameters as unknown as { series: Record<string, number[]> };
    const data = await this.callApi("/v1/risk/correlation", args);
    return {
      summary: `Correlation matrix on ${(data.assets as string[]).length} assets`,
      assets: data.assets as string[],
      correlation: data.correlation as number[][],
      volatilities: data.volatilities as Record<string, number>,
      n: data.n as number,
      computed_ms: data.ms as number,
      source: "QuantOracle correlation",
    };
  }

  @Tool({
    description:
      "Standalone Sharpe ratio with 95% confidence interval (Lo 2002). Use when the user asks specifically for Sharpe — cheaper than assess_portfolio_risk. Returns Sharpe, annualized return/vol, excess return, standard error, CI bounds.",
  })
  async sharpeRatio(parameters: SharpeRatioParameters) {
    const args = parameters as unknown as {
      returns: number[]; risk_free_rate: number; annualization_factor: number;
    };
    const data = await this.callApi("/v1/stats/sharpe-ratio", args);
    return {
      summary: `Sharpe ${(data.sharpe_ratio as number).toFixed(2)} (95% CI: ${(data.ci_95_lower as number).toFixed(2)} – ${(data.ci_95_upper as number).toFixed(2)})`,
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
  }

  @Tool({
    description:
      "Static and rolling z-scores with extreme-value detection. Use for anomaly detection, mean-reversion signals, and pairs-trade entry rules. If `window` is set, returns rolling z-score series. Returns indices of extreme values.",
  })
  async zscore(parameters: ZScoreParameters) {
    const args = parameters as unknown as {
      series: number[]; window?: number; threshold: number;
    };
    const data = await this.callApi("/v1/stats/zscore", args);
    return {
      summary: `Z-score: current ${(data.current_zscore as number).toFixed(2)}, ${data.extreme_count} extremes`,
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
  }
}

// ═══════════════════════════════════════════════════════════════════════
// DEFI BUNDLE
// ═══════════════════════════════════════════════════════════════════════

export class QuantOracleDefiPlugin extends QuantOracleBasePlugin {
  constructor(opts: QuantOraclePluginOptions = {}) {
    super("quantoracle-defi", opts);
  }

  @Tool({
    description:
      "Impermanent loss for a Uniswap v2 or v3 LP position. Use when the user is deciding whether to LP, evaluating an existing LP position, or asking whether fees offset IL. Returns IL %, hold value, LP value, dollar loss vs HODL, and fee APY required to break even.",
  })
  async impermanentLoss(parameters: ImpermanentLossParameters) {
    const args = parameters as unknown as {
      initial_price_ratio: number; current_price_ratio: number;
      amm_type: "v2" | "v3"; lower_tick?: number; upper_tick?: number;
      initial_investment: number;
    };
    const data = await this.callApi("/v1/crypto/impermanent-loss", args);
    return {
      summary: `${args.amm_type.toUpperCase()} IL: ${(data.impermanent_loss_pct as number).toFixed(2)}%`,
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
  }

  @Tool({
    description:
      "Liquidation price for a leveraged perp or margin position. Use when opening a leveraged position or asking 'how far can the price move before I get liquidated'. Returns liquidation price, distance from entry %, margin ratio, max loss before liquidation. Accepts accumulated funding for accurate perp calculations.",
  })
  async liquidationPrice(parameters: LiquidationPriceParameters) {
    const args = parameters as unknown as {
      entry_price: number; collateral: number; position_size: number;
      leverage: number; direction: "long" | "short";
      maintenance_margin_rate: number; funding_accumulated: number;
    };
    const data = await this.callApi("/v1/crypto/liquidation-price", args);
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
  }
}

// ═══════════════════════════════════════════════════════════════════════
// FACTORY — returns the array of plugin instances for the chosen bundles
// ═══════════════════════════════════════════════════════════════════════

/**
 * Factory function — returns the array of QuantOracle plugin instances
 * for the chosen bundles. Spread it into your GOAT `plugins` array.
 *
 * @example Default — core bundle (5 tools)
 * ```ts
 * import { quantoracle } from "@quantoracle/goat-plugin";
 *
 * const tools = await getOnChainTools({
 *   wallet: viem(walletClient),
 *   plugins: [...quantoracle()],
 * });
 * ```
 *
 * @example Core + DeFi bundle (7 tools) — typical onchain trading agent
 * ```ts
 * plugins: [
 *   ...quantoracle({ include: ['core', 'defi'] }),
 *   uniswap(),
 *   erc20(),
 * ]
 * ```
 *
 * @example All 15 tools
 * ```ts
 * plugins: [...quantoracle({ include: 'all' })]
 * ```
 */
export function quantoracle(options: QuantOraclePluginOptions = {}): QuantOracleBasePlugin[] {
  const include = options.include ?? ["core"];
  const wantAll = include === "all";
  const wants = (b: QuantOracleBundle) =>
    wantAll || (Array.isArray(include) && include.includes(b));

  const plugins: QuantOracleBasePlugin[] = [];
  if (wants("core")) plugins.push(new QuantOracleCorePlugin(options));
  if (wants("options")) plugins.push(new QuantOracleOptionsPlugin(options));
  if (wants("risk")) plugins.push(new QuantOracleRiskPlugin(options));
  if (wants("defi")) plugins.push(new QuantOracleDefiPlugin(options));
  return plugins;
}
