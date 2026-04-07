#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";

const USE_STDIO = process.argv.includes("--stdio");

// ── Config ─────────────────────────────────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL || "https://api.quantoracle.dev";
const PORT = parseInt(process.env.PORT || "8002");
const DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || "1000");
const WALLET = process.env.WALLET_ADDRESS || "0xC94f5F33ae446a50Ce31157db81253BfddFE2af6";

// ── Rate limiter (in-memory, resets daily) ─────────────────────────────
const callCounts = new Map<string, { count: number; date: string }>();

function getRateLimit(ip: string): { count: number; remaining: number; limited: boolean } {
  const today = new Date().toISOString().slice(0, 10);
  const entry = callCounts.get(ip);

  if (!entry || entry.date !== today) {
    callCounts.set(ip, { count: 0, date: today });
    return { count: 0, remaining: DAILY_LIMIT, limited: false };
  }

  return {
    count: entry.count,
    remaining: Math.max(0, DAILY_LIMIT - entry.count),
    limited: entry.count >= DAILY_LIMIT,
  };
}

function incrementCount(ip: string): void {
  const today = new Date().toISOString().slice(0, 10);
  const entry = callCounts.get(ip);
  if (!entry || entry.date !== today) {
    callCounts.set(ip, { count: 1, date: today });
  } else {
    entry.count++;
  }
}

// Clean stale entries daily
setInterval(() => {
  const today = new Date().toISOString().slice(0, 10);
  for (const [ip, entry] of callCounts) {
    if (entry.date !== today) callCounts.delete(ip);
  }
}, 3600_000);

// ── Types ──────────────────────────────────────────────────────────────
interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  path: string;
}

interface OpenAPISpec {
  paths: Record<string, Record<string, {
    summary?: string;
    description?: string;
    requestBody?: {
      content: {
        "application/json": {
          schema: { $ref?: string } & Record<string, any>;
        };
      };
    };
  }>>;
  components?: {
    schemas?: Record<string, any>;
  };
}

// ── Resolve $ref ───────────────────────────────────────────────────────
function resolveRef(schema: any, components: Record<string, any>): any {
  if (!schema) return schema;
  if (schema.$ref) {
    const refName = schema.$ref.replace("#/components/schemas/", "");
    const resolved = components[refName];
    if (!resolved) return schema;
    return resolveRef({ ...resolved }, components);
  }
  const result: any = { ...schema };
  if (result.properties) {
    result.properties = {};
    for (const [key, val] of Object.entries(schema.properties)) {
      result.properties[key] = resolveRef(val, components);
    }
  }
  if (result.items) {
    result.items = resolveRef(result.items, components);
  }
  if (result.anyOf) {
    // Flatten Optional[T] patterns: anyOf: [{type: T}, {type: "null"}] → just {type: T}
    const nonNull = result.anyOf.filter((s: any) => s.type !== "null");
    if (nonNull.length === 1 && result.anyOf.some((s: any) => s.type === "null")) {
      const flat = resolveRef(nonNull[0], components);
      // Preserve description/title from parent
      if (result.description) flat.description = result.description;
      if (result.title) flat.title = result.title;
      return flat;
    }
    result.anyOf = result.anyOf.map((s: any) => resolveRef(s, components));
  }
  if (result.oneOf) {
    result.oneOf = result.oneOf.map((s: any) => resolveRef(s, components));
  }
  if (result.allOf) {
    result.allOf = result.allOf.map((s: any) => resolveRef(s, components));
  }
  return result;
}

// ── Path → tool name (underscore-separated for compatibility) ──────────
// /v1/options/price → options_price
// /v1/crypto/apy-apr-convert → crypto_apy-apr-convert
function pathToToolName(path: string): string {
  return path.replace("/v1/", "").replace(/\//g, "_");
}

// ── Usage guidelines — tells AI agents WHEN to use each tool ───────────
const USAGE_GUIDELINES: Record<string, string> = {
  // Options
  "options_price": "Use when you need to price a European option or compute Greeks (delta, gamma, theta, vega, rho, etc.) using the Black-Scholes model. Provide spot price, strike, time to expiry, risk-free rate, and volatility. Returns: option price, 10 Greeks, and intrinsic/time value breakdown.",
  "options_implied-vol": "Use when you know the market price of an option and need to back out the implied volatility. Uses Newton-Raphson iteration. Provide spot, strike, time to expiry, risk-free rate, market price, and option type. Returns: implied volatility, convergence info, and Greeks at that IV.",
  "options_strategy": "Use when analyzing a multi-leg options strategy (spreads, straddles, iron condors, etc.). Provide an array of legs with strike, premium, quantity, and type. Returns: net premium, max profit/loss, breakeven points, P&L at various prices, and payoff data.",
  "options_payoff-diagram": "Use when you need payoff/P&L data points for plotting an options strategy. Provide legs with strike, premium, quantity, and type. Returns: array of price/payoff pairs for charting, plus key metrics (breakevens, max profit/loss).",

  // Risk
  "risk_portfolio": "Use when you have a series of portfolio returns and need comprehensive risk analytics. Provide an array of periodic returns (e.g. daily). Returns: 22 metrics including Sharpe, Sortino, Calmar, Omega, VaR (95/99), CVaR, max drawdown, skewness, kurtosis, win rate, profit factor. Optionally provide benchmark returns for alpha, beta, tracking error, and information ratio.",
  "risk_kelly": "Use when determining optimal bet/position sizing using the Kelly Criterion. Provide win probability and win/loss ratio. Returns: full Kelly fraction, half-Kelly, quarter-Kelly, and expected growth rate.",
  "risk_position-size": "Use when calculating how many shares/contracts to buy given account size and risk tolerance. Provide account value, risk percentage, entry price, and stop-loss price. Returns: position size, dollar risk, and shares to trade.",
  "risk_drawdown": "Use when analyzing drawdown characteristics of a return series. Provide an array of returns. Returns: max drawdown, drawdown duration, recovery time, current drawdown, and all drawdown periods with start/end indices.",
  "risk_correlation": "Use when computing an N×N correlation matrix for multiple assets. Provide a 2D array of return series. Returns: Pearson correlation matrix, covariance matrix, and eigenvalues for PCA analysis.",
  "risk_var-parametric": "Use when computing Value-at-Risk and Conditional VaR using parametric methods. Provide returns and confidence level. Returns: VaR, CVaR, and distribution parameters under normal or Student-t assumptions.",
  "risk_stress-test": "Use when stress-testing a portfolio against multiple scenarios. Provide portfolio weights, asset returns, and scenario definitions (e.g. market crash, rate hike). Returns: portfolio P&L under each scenario with component-level breakdown.",
  "risk_transaction-cost": "Use when estimating total transaction costs including commissions, spread, and market impact. Provide trade size, price, spread, and commission structure. Returns: total cost, cost breakdown, and cost as percentage of trade value.",

  // Indicators
  "indicators_technical": "Use when you need multiple technical indicators computed from a price series. Provide an array of prices and optional volumes. Returns: SMA, EMA, RSI, MACD, Bollinger Bands, Stochastic %K, ATR, ROC, composite signals (overbought/oversold), and trend classification.",
  "indicators_crossover": "Use when detecting moving average crossovers (golden cross, death cross). Provide prices and two MA periods. Returns: current MA values, crossover signals, crossover history, and signal strength.",
  "indicators_regime": "Use when classifying market regime (trending vs ranging, high vs low volatility). Provide a price series. Returns: trend regime (bullish/bearish/neutral), volatility regime (high/low/normal), and regime change signals.",
  "indicators_bollinger-bands": "Use when computing Bollinger Bands with squeeze detection. Provide prices and optional period/multiplier. Returns: upper/mid/lower bands, %B, bandwidth, squeeze flag, and current position relative to bands.",
  "indicators_fibonacci-retracement": "Use when computing Fibonacci retracement and extension levels. Provide a high price and low price. Returns: retracement levels (23.6%, 38.2%, 50%, 61.8%, 78.6%) and extension levels (127.2%, 161.8%, 261.8%).",
  "indicators_atr": "Use when measuring volatility via Average True Range. Provide an array of prices. Returns: current ATR, normalized ATR (as % of price), ATR history, and volatility regime classification.",

  // Statistics
  "stats_zscore": "Use when computing z-scores for statistical analysis or detecting extremes. Provide a value or array and reference statistics. Returns: z-scores, mean, standard deviation, and flags for values beyond 2σ or 3σ.",
  "stats_sharpe-ratio": "Use when computing the Sharpe ratio from a return series. Provide returns and risk-free rate. Returns: annualized Sharpe ratio, annualized return, annualized volatility, and risk-adjusted metrics.",
  "stats_normal-distribution": "Use when computing normal distribution CDF, PDF, quantiles, or confidence intervals. Provide x (for CDF/PDF), p (for quantile), or confidence_level (for interval), with optional mean and std. Returns: CDF probability, PDF density, z-score, quantile value, and/or confidence interval bounds.",
  "stats_probabilistic-sharpe": "Use when testing whether a Sharpe ratio is statistically significant. Provide returns and a benchmark Sharpe. Returns: probabilistic Sharpe ratio (probability observed Sharpe exceeds benchmark), p-value, and required track record length.",
  "stats_realized-volatility": "Use when computing historical/realized volatility from a return series. Provide returns and optional annualization factor. Returns: realized volatility (close-to-close), annualized vol, and rolling vol series.",
  "stats_linear-regression": "Use when fitting a linear regression (OLS). Provide x and y arrays. Returns: slope, intercept, R², adjusted R², t-statistics, p-values, standard errors, confidence intervals, and residuals.",
  "stats_polynomial-regression": "Use when fitting a polynomial of degree n to data. Provide x, y arrays, and degree. Returns: coefficients, R², fitted values, and residuals.",
  "stats_cointegration": "Use when testing if two time series are cointegrated (mean-reverting pair). Provide two price series. Returns: Engle-Granger test statistic, p-value, critical values, hedge ratio, and spread series.",
  "stats_hurst-exponent": "Use when determining if a time series is mean-reverting (H<0.5), random walk (H=0.5), or trending (H>0.5). Provide a price or return series. Returns: Hurst exponent via R/S analysis, classification, and confidence.",
  "stats_garch-forecast": "Use when forecasting future volatility using a GARCH(1,1) model. Provide a return series. Returns: GARCH parameters (omega, alpha, beta), current conditional volatility, and multi-step ahead volatility forecasts.",
  "stats_distribution-fit": "Use when fitting data to standard distributions (normal, lognormal, uniform). Provide a data array. Returns: best-fit distribution, parameters (mean, std, etc.), goodness-of-fit statistics (KS test, chi-squared), and Q-Q plot data.",
  "stats_correlation-matrix": "Use when computing a correlation matrix with eigenvalue decomposition for multiple assets. Provide a 2D array of return series. Returns: Pearson and Spearman correlation matrices, eigenvalues, eigenvectors, and explained variance ratios.",

  // Derivatives
  "derivatives_binomial-tree": "Use when pricing American or European options via the CRR binomial lattice. Provide spot, strike, time, rate, volatility, steps, and exercise style. Returns: option price, early exercise boundary, and tree node values.",
  "derivatives_barrier-option": "Use when pricing knock-in or knock-out barrier options. Provide spot, strike, barrier level, barrier type, and standard option parameters. Returns: barrier option price, vanilla equivalent, and barrier adjustment factors.",
  "derivatives_asian-option": "Use when pricing Asian (average-price) options. Provide spot, strike, time, rate, volatility, and averaging type. Returns: option price via geometric closed-form or Turnbull-Wakeman approximation.",
  "derivatives_lookback-option": "Use when pricing lookback options (floating or fixed strike). Provide spot, strike, min/max price, time, rate, and volatility. Returns: lookback option price via Goldman-Sosin-Gatto formulas.",
  "derivatives_option-chain-analysis": "Use when analyzing an options chain for skew, max pain, and put-call ratios. Provide arrays of strikes, calls, puts, and open interest. Returns: max pain strike, put-call ratio, skew metrics, and implied volatility smile data.",
  "derivatives_put-call-parity": "Use when checking put-call parity or detecting arbitrage opportunities. Provide call price, put price, spot, strike, rate, and time. Returns: parity check, theoretical values, and any arbitrage amount.",
  "derivatives_volatility-surface": "Use when constructing an implied volatility surface from market data. Provide arrays of strikes, expiries, and IV values. Returns: interpolated IV surface, skew metrics, term structure, and smile parameters.",

  // Simulate
  "simulate_montecarlo": "Use when running a Monte Carlo simulation for asset price paths. Provide starting price, drift, volatility, time horizon, and number of simulations. Returns: simulated terminal prices, percentile distribution (5th/25th/50th/75th/95th), expected value, probability of profit, and path statistics.",

  // Portfolio
  "portfolio_optimize": "Use when optimizing portfolio weights for max Sharpe, min volatility, or risk parity. Provide expected returns and a covariance matrix. Returns: optimal weights, expected return, volatility, Sharpe ratio, and efficient frontier points.",
  "portfolio_risk-parity-weights": "Use when computing equal risk contribution (risk parity) portfolio weights. Provide a covariance matrix. Returns: risk parity weights and each asset's contribution to total portfolio risk.",

  // Fixed Income
  "fixed-income_bond": "Use when pricing a bond or computing yield, duration, and convexity. Provide face value, coupon rate, maturity, and yield or price. Returns: bond price (or yield), Macaulay duration, modified duration, convexity, and accrued interest.",
  "fixed-income_amortization": "Use when generating a loan amortization schedule. Provide principal, annual rate, and term in months. Returns: monthly payment, total interest, and a period-by-period schedule of principal, interest, and remaining balance.",
  "fi_credit-spread": "Use when computing Z-spread and implied default probability from a corporate bond price. Provide bond price, coupon, maturity, and risk-free curve. Returns: Z-spread, option-adjusted spread, implied default probability, and loss-given-default.",
  "fi_yield-curve-interpolate": "Use when interpolating a yield curve at arbitrary maturities. Provide observed maturities and yields, plus query maturities. Returns: interpolated yields via linear, cubic spline, or Nelson-Siegel models.",

  // Crypto
  "crypto_impermanent-loss": "Use when calculating impermanent loss for a liquidity provider position. Provide initial prices and current prices for two tokens. Returns: impermanent loss percentage, hold value vs LP value, and breakeven price ratios.",
  "crypto_apy-apr-convert": "Use when converting between APY and APR with different compounding frequencies. Provide rate and compounding periods. Returns: equivalent APY, APR, daily/weekly/monthly rates, and effective annual rate.",
  "crypto_liquidation-price": "Use when computing the liquidation price for a leveraged position. Provide entry price, leverage, position side, and maintenance margin. Returns: liquidation price, distance to liquidation, and margin call price.",
  "crypto_funding-rate": "Use when analyzing perpetual futures funding rates. Provide funding rate, position size, and holding period. Returns: annualized funding cost, projected payments, and carry trade opportunity estimate.",
  "crypto_dex-slippage": "Use when estimating slippage on a DEX trade using constant-product AMM math. Provide trade size and pool reserves. Returns: effective price, price impact percentage, and output amount after slippage.",
  "crypto_vesting-schedule": "Use when computing a token vesting schedule with cliff and linear vesting. Provide total tokens, cliff period, vesting duration, and TGE unlock percentage. Returns: period-by-period unlock schedule with cumulative totals.",
  "crypto_rebalance-threshold": "Use when checking if a crypto portfolio needs rebalancing. Provide target weights and current weights. Returns: whether rebalancing is needed, drift per asset, and trade list to restore targets.",

  // FX
  "fx_interest-rate-parity": "Use when computing covered/uncovered interest rate parity for FX pairs. Provide domestic rate, foreign rate, and spot rate. Returns: theoretical forward rate, parity-implied rate, and arbitrage opportunity if any.",
  "fx_purchasing-power-parity": "Use when estimating fair value of an FX rate using PPP. Provide domestic and foreign price indices and base-period exchange rate. Returns: PPP-implied fair value rate and over/undervaluation percentage.",
  "fx_forward-rate": "Use when bootstrapping forward rates from a yield curve. Provide spot rates at various tenors. Returns: implied forward rates between each tenor pair.",
  "fx_carry-trade": "Use when analyzing carry trade P&L decomposition. Provide high-yield and low-yield rates, entry spot rate, and exit spot rate. Returns: carry return, spot return, total return, and annualized P&L breakdown.",

  // Macro
  "macro_inflation-adjusted": "Use when converting nominal returns to real returns using the Fisher equation. Provide nominal rate and inflation rate. Returns: real return, purchasing power change, and cumulative real growth over a period.",
  "macro_taylor-rule": "Use when estimating the appropriate policy interest rate via the Taylor Rule. Provide inflation, target inflation, output gap, and neutral rate. Returns: Taylor Rule implied rate and deviation from current policy rate.",
  "macro_real-yield": "Use when computing real yield and breakeven inflation. Provide nominal yield and inflation expectation (or TIPS yield). Returns: real yield, breakeven inflation rate, and inflation risk premium estimate.",

  // TVM
  "tvm_present-value": "Use when computing the present value of a future cash flow. Provide future value, discount rate, and number of periods. Returns: present value and discount factor.",
  "tvm_future-value": "Use when computing the future value of a present sum. Provide present value, interest rate, and number of periods. Returns: future value, total interest earned, and growth factor.",
  "tvm_npv": "Use when computing net present value of a series of cash flows. Provide discount rate and an array of cash flows (first is typically negative for initial investment). Returns: NPV, profitability index, and discounted cash flow breakdown.",
  "tvm_irr": "Use when computing the internal rate of return for a cash flow series. Provide an array of cash flows. Returns: IRR (decimal), annualized IRR, and NPV at the computed IRR (should be ~0).",
  "tvm_cagr": "Use when computing compound annual growth rate. Provide beginning value, ending value, and number of years. Returns: CAGR (decimal), total return, and equivalent annual return.",
};

// ── Pricing table (mirrors worker/src/index.ts) ────────────────────────
const PRICES: Record<string, string> = {
  "/v1/stats/zscore": "0.002", "/v1/crypto/apy-apr-convert": "0.002",
  "/v1/derivatives/put-call-parity": "0.002", "/v1/indicators/fibonacci-retracement": "0.002",
  "/v1/macro/inflation-adjusted": "0.002", "/v1/macro/taylor-rule": "0.002",
  "/v1/macro/real-yield": "0.002", "/v1/crypto/liquidation-price": "0.002",
  "/v1/indicators/bollinger-bands": "0.002", "/v1/indicators/atr": "0.002",
  "/v1/tvm/present-value": "0.002", "/v1/tvm/future-value": "0.002",
  "/v1/tvm/npv": "0.002", "/v1/tvm/cagr": "0.002",
  "/v1/stats/normal-distribution": "0.002", "/v1/stats/sharpe-ratio": "0.002",
  "/v1/options/price": "0.005", "/v1/options/implied-vol": "0.005",
  "/v1/risk/kelly": "0.005", "/v1/risk/position-size": "0.005",
  "/v1/risk/drawdown": "0.005", "/v1/indicators/technical": "0.005",
  "/v1/indicators/crossover": "0.005", "/v1/indicators/regime": "0.005",
  "/v1/fx/interest-rate-parity": "0.005", "/v1/fx/purchasing-power-parity": "0.005",
  "/v1/fx/forward-rate": "0.005", "/v1/fx/carry-trade": "0.005",
  "/v1/crypto/funding-rate": "0.005", "/v1/crypto/dex-slippage": "0.005",
  "/v1/crypto/vesting-schedule": "0.005", "/v1/crypto/rebalance-threshold": "0.005",
  "/v1/fixed-income/amortization": "0.005", "/v1/options/payoff-diagram": "0.005",
  "/v1/crypto/impermanent-loss": "0.005", "/v1/risk/transaction-cost": "0.005",
  "/v1/stats/probabilistic-sharpe": "0.005", "/v1/tvm/irr": "0.005",
  "/v1/stats/realized-volatility": "0.005",
  "/v1/options/strategy": "0.008", "/v1/risk/portfolio": "0.008",
  "/v1/risk/correlation": "0.008", "/v1/risk/var-parametric": "0.008",
  "/v1/risk/stress-test": "0.008", "/v1/derivatives/binomial-tree": "0.008",
  "/v1/derivatives/barrier-option": "0.008", "/v1/derivatives/lookback-option": "0.008",
  "/v1/derivatives/asian-option": "0.008", "/v1/stats/hurst-exponent": "0.008",
  "/v1/stats/cointegration": "0.008", "/v1/stats/linear-regression": "0.008",
  "/v1/stats/polynomial-regression": "0.008", "/v1/stats/distribution-fit": "0.008",
  "/v1/fi/credit-spread": "0.008", "/v1/fixed-income/bond": "0.008",
  "/v1/portfolio/risk-parity-weights": "0.008",
  "/v1/simulate/montecarlo": "0.015", "/v1/portfolio/optimize": "0.015",
  "/v1/stats/garch-forecast": "0.015", "/v1/derivatives/volatility-surface": "0.015",
  "/v1/derivatives/option-chain-analysis": "0.015", "/v1/fi/yield-curve-interpolate": "0.015",
  "/v1/stats/correlation-matrix": "0.015",
};

// Use stderr for logs in stdio mode so stdout stays clean for JSON-RPC
const log = USE_STDIO ? (...args: any[]) => process.stderr.write(args.join(" ") + "\n") : console.log;

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
  log("QuantOracle MCP Server starting...");
  log(`Backend: ${BACKEND_URL}`);
  log(`Free tier: ${DAILY_LIMIT} calls/IP/day`);

  // Fetch OpenAPI spec
  const specResp = await fetch(`${BACKEND_URL}/openapi.json`);
  if (!specResp.ok) throw new Error(`Failed to fetch /openapi.json: ${specResp.status}`);
  const spec: OpenAPISpec = await specResp.json();
  const schemas = spec.components?.schemas || {};

  // Build tool definitions from OpenAPI paths
  const toolDefs: ToolDef[] = [];
  for (const [path, methods] of Object.entries(spec.paths)) {
    if (!path.startsWith("/v1/")) continue;
    const postOp = methods.post;
    if (!postOp) continue;

    const rawSchema = postOp.requestBody?.content?.["application/json"]?.schema;
    if (!rawSchema) continue;

    const inputSchema = resolveRef(rawSchema, schemas);
    delete inputSchema.title;

    const toolName = pathToToolName(path);
    const baseDesc = postOp.description || postOp.summary || `Compute ${toolName}`;
    const guidelines = USAGE_GUIDELINES[toolName];
    const fullDesc = guidelines ? `${baseDesc}\n\n${guidelines}` : baseDesc;

    toolDefs.push({
      name: toolName,
      description: fullDesc,
      inputSchema: { type: "object", ...inputSchema },
      path,
    });
  }

  log(`Loaded ${toolDefs.length} tool definitions`);

  const toolByName = new Map<string, ToolDef>();
  for (const t of toolDefs) toolByName.set(t.name, t);

  // ── Session → IP tracking ────────────────────────────────────────────
  const sessionIPs = new Map<string, string>();

  // ── Server factory ───────────────────────────────────────────────────
  function createServer(clientIP: string, sessionId: string): Server {
    sessionIPs.set(sessionId, clientIP);

    const server = new Server(
      { name: "quantoracle", version: "2.0.0" },
      { capabilities: { tools: {}, prompts: {}, resources: {} } }
    );

    // ── Prompts (system prompt for agents) ─────────────────────────────
    server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [{
        name: "quantoracle_usage",
        description: "How to use QuantOracle tools effectively",
      }],
    }));

    server.setRequestHandler(GetPromptRequestSchema, async () => ({
      description: "How to use QuantOracle tools effectively",
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: "QuantOracle provides 63 deterministic math tools for quantitative finance. All tools accept JSON and return JSON. Key categories: options pricing (Black-Scholes, Greeks, implied vol, exotic derivatives), risk metrics (Sharpe, Sortino, VaR, CVaR, drawdown, Kelly), portfolio optimization (max Sharpe, min variance, risk parity), technical indicators (RSI, MACD, Bollinger, ATR), Monte Carlo simulation, bond pricing and yield curves, statistical analysis (regression, cointegration, GARCH, Hurst exponent), crypto/DeFi (impermanent loss, liquidation, funding rates, DEX slippage), FX (interest rate parity, carry trade, PPP), macro (Taylor Rule, Fisher equation), and time value of money (PV, FV, IRR, NPV, CAGR). Every tool is deterministic — same inputs always produce same outputs. Use these tools whenever you need precise financial calculations instead of estimating.",
        },
      }],
    }));

    // ── Resources (empty but registered) ───────────────────────────────
    server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [],
    }));

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: toolDefs.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        annotations: {
          title: t.description.split(".")[0],
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      })),
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const tool = toolByName.get(name);

      if (!tool) {
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
      }

      // ── Rate limit check ───────────────────────────────────────────
      const ip = sessionIPs.get(sessionId) || clientIP;
      const rl = getRateLimit(ip);

      if (rl.limited) {
        const price = PRICES[tool.path] || "0.005";
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "payment_required",
              message: `Free tier limit reached (${DAILY_LIMIT}/day). Use the REST API at https://api.quantoracle.dev${tool.path} with x402 payment to continue.`,
              usage: {
                calls_today: rl.count,
                daily_limit: DAILY_LIMIT,
              },
              payment: {
                protocol: "x402",
                rest_endpoint: `https://api.quantoracle.dev${tool.path}`,
                amount: price,
                currency: "USDC",
                network: "base",
                recipient: WALLET,
              },
            }, null, 2),
          }],
          isError: true,
        };
      }

      // ── Forward to backend ─────────────────────────────────────────
      try {
        const resp = await fetch(`${BACKEND_URL}${tool.path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args || {}),
        });

        const data = await resp.json();

        if (!resp.ok) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ error: true, status: resp.status, ...data }, null, 2),
            }],
            isError: true,
          };
        }

        // Success — count this call
        incrementCount(ip);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(data, null, 2),
          }],
        };
      } catch (err: any) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: "backend_unreachable", detail: err.message }),
          }],
          isError: true,
        };
      }
    });

    return server;
  }

  // ── Stdio mode (for mcp-proxy, Glama, Claude Desktop --stdio) ────────
  if (USE_STDIO) {
    const server = createServer("stdio", "stdio-session");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    return; // blocks on stdio, never reaches Express
  }

  // ── Express app ──────────────────────────────────────────────────────
  const app = express();

  // Trust proxy for X-Forwarded-For
  app.set("trust proxy", true);

  const transports = new Map<string, StreamableHTTPServerTransport>();

  function getClientIP(req: express.Request): string {
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.headers["x-real-ip"] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown"
    );
  }

  app.post("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res);
      return;
    }

    // New session
    const clientIP = getClientIP(req);
    let capturedSid: string | undefined;

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => {
        capturedSid = crypto.randomUUID();
        return capturedSid;
      },
      onsessioninitialized: (sid: string) => {
        transports.set(sid, transport);
      },
    });

    transport.onclose = () => {
      if (capturedSid) {
        transports.delete(capturedSid);
        sessionIPs.delete(capturedSid);
      }
    };

    const server = createServer(clientIP, capturedSid || "pending");
    await server.connect(transport);
    await transport.handleRequest(req, res);

    // Update session ID mapping after transport assigns it
    if (capturedSid) {
      sessionIPs.set(capturedSid, clientIP);
    }
  });

  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports.has(sessionId)) {
      res.status(400).json({ error: "No active session. Send a POST first." });
      return;
    }
    await transports.get(sessionId)!.handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res);
      transports.delete(sessionId);
      sessionIPs.delete(sessionId);
    } else {
      res.status(404).json({ error: "Session not found" });
    }
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      server: "quantoracle-mcp",
      version: "2.0.0",
      tools: toolDefs.length,
      daily_limit: DAILY_LIMIT,
      active_sessions: transports.size,
      backend: BACKEND_URL,
    });
  });

  // Server card for Smithery discovery
  app.get("/.well-known/mcp/server-card.json", (_req, res) => {
    res.json({
      serverInfo: { name: "quantoracle", version: "2.0.0" },
      description: "63 deterministic quant computation tools for AI agents. Options pricing, exotic derivatives, risk metrics, portfolio optimization, Monte Carlo, statistics, crypto/DeFi, macro/FX, time value of money. 1,000 free calls/day — no signup required.",
      homepage: "https://quantoracle.dev",
      repository: "https://github.com/QuantOracledev/quantoracle",
      documentation: "https://api.quantoracle.dev/docs",
      license: "MIT",
      keywords: ["finance", "quantitative", "options", "derivatives", "risk", "portfolio", "statistics", "crypto", "defi", "macro", "fx", "backtesting", "deterministic", "calculator"],
      tools: toolDefs.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
      prompts: [{
        name: "quantoracle_usage",
        description: "How to use QuantOracle tools effectively",
      }],
      resources: [],
    });
  });

  // Usage check (mirrors the REST API's /usage endpoint)
  app.get("/usage", (req, res) => {
    const ip = getClientIP(req);
    const rl = getRateLimit(ip);
    res.json({
      calls_today: rl.count,
      daily_limit: DAILY_LIMIT,
      remaining: rl.remaining,
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`QuantOracle MCP server listening on port ${PORT}`);
    console.log(`MCP endpoint: http://0.0.0.0:${PORT}/mcp`);
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
