import { formatPortfolioRisk, formatKelly, formatGeneric } from "../format.js";

export default [
  {
    name: "risk portfolio",
    aliases: ["risk"],
    description: "22 portfolio risk metrics (Sharpe, Sortino, VaR, drawdown...)",
    endpoint: "/v1/risk/portfolio",
    flags: {
      returns:   { api: "returns",           type: "data", required: true,  desc: "Returns (CSV, @file, or inline)" },
      benchmark: { api: "benchmark_returns", type: "data", required: false, desc: "Benchmark returns" },
      rf:        { api: "risk_free_rate",    type: "number", required: false, desc: "Risk-free rate" },
    },
    format: formatPortfolioRisk,
  },
  {
    name: "risk kelly",
    aliases: ["kelly"],
    description: "Kelly criterion position sizing",
    endpoint: "/v1/risk/kelly",
    flags: {
      "win-rate": { api: "win_rate", type: "number", required: false, desc: "Win probability (0-1)" },
      "avg-win":  { api: "avg_win",  type: "number", required: false, desc: "Average win" },
      "avg-loss": { api: "avg_loss", type: "number", required: false, desc: "Average loss" },
      returns:    { api: "returns",  type: "data",   required: false, desc: "Returns for continuous mode" },
    },
    buildPayload(flags) {
      if (flags.returns) return { mode: "continuous", returns: flags.returns };
      return { mode: "discrete", win_rate: flags.win_rate, avg_win: flags.avg_win, avg_loss: flags.avg_loss };
    },
    format: formatKelly,
  },
  {
    name: "risk size",
    aliases: ["size"],
    description: "Position size calculator",
    endpoint: "/v1/risk/position-size",
    flags: {
      account: { api: "account_size", type: "number", required: true, desc: "Account size" },
      entry:   { api: "entry_price",  type: "number", required: true, desc: "Entry price" },
      stop:    { api: "stop_loss",    type: "number", required: true, desc: "Stop loss price" },
      risk:    { api: "risk_per_trade", type: "number", required: false, desc: "Risk per trade (default 0.02)" },
    },
    format: (d) => formatGeneric("Position Size", d),
  },
  {
    name: "risk drawdown",
    description: "Drawdown analysis",
    endpoint: "/v1/risk/drawdown",
    flags: {
      equity: { api: "equity_curve", type: "data", required: true, desc: "Equity curve values" },
    },
    format: (d) => formatGeneric("Drawdown", d),
  },
  {
    name: "risk correlation",
    description: "Correlation matrix",
    endpoint: "/v1/risk/correlation",
    flags: {
      file: { api: "_file", type: "csv", required: true, desc: "CSV file with return series" },
    },
    buildPayload(flags) { return { series: flags._file }; },
    format: (d) => formatGeneric("Correlation", d),
  },
  {
    name: "risk var",
    description: "Value at Risk (parametric)",
    endpoint: "/v1/risk/var-parametric",
    flags: {
      returns:    { api: "returns",           type: "data",   required: true,  desc: "Returns" },
      confidence: { api: "confidence_levels", type: "data",   required: false, desc: "Confidence levels (default 0.95,0.99)" },
      value:      { api: "portfolio_value",   type: "number", required: false, desc: "Portfolio value for dollar VaR" },
    },
    format: (d) => formatGeneric("Value at Risk", d),
  },
  {
    name: "risk stress",
    description: "Stress test / scenario analysis",
    endpoint: "/v1/risk/stress-test",
    flags: {
      positions: { api: "positions", type: "json", required: true, desc: 'Positions JSON' },
      scenarios: { api: "scenarios", type: "json", required: true, desc: 'Scenarios JSON' },
    },
    format: (d) => formatGeneric("Stress Test", d),
  },
  {
    name: "risk txcost",
    description: "Transaction cost model",
    endpoint: "/v1/risk/transaction-cost",
    flags: {
      value:  { api: "trade_value", type: "number", required: true,  desc: "Trade value in USD" },
      shares: { api: "shares",      type: "number", required: false, desc: "Number of shares" },
      spread: { api: "spread_bps",  type: "number", required: false, desc: "Bid-ask spread (bps)" },
    },
    format: (d) => formatGeneric("Transaction Cost", d),
  },
];
