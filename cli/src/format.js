// Pretty terminal output — zero deps, ANSI escape codes

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

let noColor = false;
export function setNoColor(v) { noColor = v; }

function c(color, text) {
  return noColor ? text : `${color}${text}${C.reset}`;
}

// Format a number with commas
function fmt(n, decimals = 2) {
  if (n === null || n === undefined) return "—";
  if (typeof n === "string") return n;
  const fixed = Number(n).toFixed(decimals);
  const [int, dec] = fixed.split(".");
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${withCommas}.${dec}` : withCommas;
}

function pct(n, decimals = 1) {
  if (n === null || n === undefined) return "—";
  return `${(Number(n) * 100).toFixed(decimals)}%`;
}

function dollar(n, decimals = 2) {
  if (n === null || n === undefined) return "—";
  const neg = n < 0;
  const abs = Math.abs(n);
  return `${neg ? "-" : ""}$${fmt(abs, decimals)}`;
}

function line(width = 40) {
  return c(C.dim, "\u2500".repeat(width));
}

function header(title) {
  return `\n  ${c(C.cyan + C.bold, `QuantOracle`)} ${c(C.dim, "\u00b7")} ${c(C.bold, title)}`;
}

function row(label, value, width = 18) {
  const pad = " ".repeat(Math.max(1, width - label.length));
  return `  ${c(C.dim, label)}${pad}${c(C.white, value)}`;
}

function footer(ms) {
  const timing = ms !== undefined ? `${ms}ms` : "";
  return `  ${c(C.gray, `\u23f1 ${timing} \u00b7 api.quantoracle.dev`)}`;
}

// ── Category Formatters ─────────────────────────────────────────

export function formatOptionsPrice(d) {
  const g = d.greeks || {};
  const lines = [
    header(`Black-Scholes (${d.type || "call"})`),
    line(),
    row("Price", dollar(d.price)),
    row("Intrinsic", dollar(d.intrinsic)),
    row("Time Value", dollar(d.time_value)),
    row("Breakeven", dollar(d.breakeven)),
    row("Prob ITM", pct(d.prob_itm)),
    "",
    `  ${c(C.bold, "Greeks")}`,
    line(),
    row("Delta", fmt(g.delta, 4)),
    row("Gamma", fmt(g.gamma, 4)),
    row("Theta", `${fmt(g.theta, 4)}/day`),
    row("Vega", fmt(g.vega, 4)),
    row("Rho", fmt(g.rho, 4)),
    row("Vanna", fmt(g.vanna, 4)),
    row("Charm", fmt(g.charm, 4)),
    row("Volga", fmt(g.volga, 4)),
    row("Speed", fmt(g.speed, 6)),
    line(),
    footer(d.ms),
  ];
  return lines.join("\n");
}

export function formatImpliedVol(d) {
  return [
    header("Implied Volatility"),
    line(),
    row("IV", pct(d.implied_volatility)),
    row("Annualized", `${d.annualized_pct}%`),
    row("Model Price", dollar(d.model_price)),
    row("Market Price", dollar(d.market_price)),
    row("Iterations", String(d.iterations)),
    line(),
    footer(d.ms),
  ].join("\n");
}

export function formatStrategy(d) {
  return [
    header("Options Strategy"),
    line(),
    row("Max Profit", dollar(d.max_profit)),
    row("Max Loss", dollar(d.max_loss)),
    row("Breakevens", (d.breakevens || []).map(b => dollar(b)).join(", ")),
    line(),
    footer(d.ms),
  ].join("\n");
}

export function formatKelly(d) {
  const lines = [header("Kelly Criterion"), line()];
  if (d.full_kelly !== undefined) {
    lines.push(row("Full Kelly", pct(d.full_kelly)));
    lines.push(row("Half Kelly", `${pct(d.half_kelly)}  ${c(C.green, "\u25C2 recommended")}`));
    lines.push(row("Quarter Kelly", pct(d.quarter_kelly)));
    lines.push(row("Edge", fmt(d.edge, 4)));
    if (d.payoff_ratio) lines.push(row("Payoff Ratio", `${fmt(d.payoff_ratio, 2)}x`));
  } else {
    lines.push(row("Full Kelly", `${fmt(d.full_kelly_leverage, 2)}x`));
    lines.push(row("Half Kelly", `${fmt(d.half_kelly, 2)}x  ${c(C.green, "\u25C2 recommended")}`));
    if (d.quarter_kelly) lines.push(row("Quarter Kelly", `${fmt(d.quarter_kelly, 2)}x`));
  }
  lines.push(line(), footer(d.ms));
  return lines.join("\n");
}

export function formatPortfolioRisk(d) {
  const r = d.returns || {};
  const risk = d.risk || {};
  const dist = d.distribution || {};
  return [
    header("Portfolio Risk"),
    line(),
    row("Ann. Return", pct(r.annualized)),
    row("Ann. Vol", pct(r.vol)),
    row("Sharpe", fmt(risk.sharpe)),
    row("Sortino", fmt(risk.sortino)),
    row("Calmar", fmt(risk.calmar)),
    row("Max Drawdown", pct(risk.max_drawdown)),
    row("VaR (95%)", pct(risk.var_95)),
    row("CVaR (95%)", pct(risk.cvar_95)),
    row("Win Rate", pct(r.win_rate)),
    row("Skewness", fmt(dist.skewness)),
    row("Kurtosis", fmt(dist.excess_kurtosis)),
    line(),
    footer(d.ms),
  ].join("\n");
}

export function formatMonteCarlo(d) {
  const t = d.terminal || {};
  return [
    header(`Monte Carlo (${d.simulations || "?"} paths)`),
    line(),
    "",
    `  ${c(C.bold, "Terminal Distribution")}`,
    row("5th %ile", dollar(t.p5)),
    row("25th %ile", dollar(t.p25)),
    row("Median", dollar(t.median)),
    row("75th %ile", dollar(t.p75)),
    row("95th %ile", dollar(t.p95)),
    "",
    row("Mean", dollar(t.mean)),
    row("Prob Loss", t.prob_loss !== undefined ? pct(t.prob_loss) : "—"),
    line(),
    footer(d.ms),
  ].join("\n");
}

export function formatBond(d) {
  return [
    header("Bond Pricing"),
    line(),
    row("Price", dollar(d.price)),
    row("Yield", d.ytm !== undefined ? pct(d.ytm) : "—"),
    row("Duration", d.macaulay_duration !== undefined ? fmt(d.macaulay_duration) : "—"),
    row("Mod Duration", d.modified_duration !== undefined ? fmt(d.modified_duration) : "—"),
    row("Convexity", d.convexity !== undefined ? fmt(d.convexity) : "—"),
    row("DV01", d.dv01 !== undefined ? dollar(d.dv01, 4) : "—"),
    line(),
    footer(d.ms),
  ].join("\n");
}

export function formatTechnical(d) {
  const lines = [header("Technical Indicators"), line()];
  if (d.rsi !== undefined) lines.push(row("RSI", fmt(d.rsi)));
  if (d.sma !== undefined) lines.push(row("SMA", fmt(d.sma)));
  if (d.ema !== undefined) lines.push(row("EMA", fmt(d.ema)));
  if (d.macd) {
    lines.push(row("MACD", fmt(d.macd.macd_line || d.macd)));
  }
  if (d.atr !== undefined) lines.push(row("ATR", fmt(d.atr)));
  if (d.adx !== undefined) lines.push(row("ADX", fmt(d.adx)));
  lines.push(line(), footer(d.ms));
  return lines.join("\n");
}

export function formatOptimize(d) {
  const lines = [header("Portfolio Optimization"), line()];
  if (d.weights) {
    for (const [asset, w] of Object.entries(d.weights)) {
      lines.push(row(asset, pct(w)));
    }
  }
  if (d.expected_return !== undefined) lines.push(row("Exp. Return", pct(d.expected_return)));
  if (d.volatility !== undefined) lines.push(row("Volatility", pct(d.volatility)));
  if (d.sharpe_ratio !== undefined) lines.push(row("Sharpe", fmt(d.sharpe_ratio)));
  lines.push(line(), footer(d.ms));
  return lines.join("\n");
}

export function formatSharpe(d) {
  return [
    header("Sharpe Ratio"),
    line(),
    row("Sharpe Ratio", fmt(d.sharpe_ratio)),
    row("Ann. Return", d.annualized_return !== undefined ? pct(d.annualized_return) : "—"),
    row("Ann. Vol", d.annualized_vol !== undefined ? pct(d.annualized_vol) : "—"),
    line(),
    footer(d.ms),
  ].join("\n");
}

// ── Generic key-value formatter for everything else ──────────────

export function formatGeneric(title, d) {
  const lines = [header(title), line()];

  for (const [key, val] of Object.entries(d)) {
    if (key === "ms") continue;
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      lines.push(`  ${c(C.bold, key)}`);
      for (const [k2, v2] of Object.entries(val)) {
        if (typeof v2 === "number") {
          lines.push(row(`  ${k2}`, fmt(v2, 4)));
        } else {
          lines.push(row(`  ${k2}`, String(v2)));
        }
      }
    } else if (Array.isArray(val)) {
      if (val.length <= 10) {
        lines.push(row(key, val.map(v => typeof v === "number" ? fmt(v, 4) : v).join(", ")));
      } else {
        lines.push(row(key, `[${val.length} items]`));
      }
    } else if (typeof val === "number") {
      lines.push(row(key, fmt(val, 4)));
    } else {
      lines.push(row(key, String(val)));
    }
  }

  lines.push(line(), footer(d.ms));
  return lines.join("\n");
}
