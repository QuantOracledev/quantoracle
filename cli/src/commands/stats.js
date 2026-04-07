import { formatSharpe, formatGeneric } from "../format.js";

export default [
  {
    name: "stats regression",
    description: "Linear regression (OLS)",
    endpoint: "/v1/stats/linear-regression",
    flags: {
      x: { api: "x", type: "data", required: true, desc: "Independent variable(s)" },
      y: { api: "y", type: "data", required: true, desc: "Dependent variable" },
    },
    format: (d) => formatGeneric("Linear Regression", d),
  },
  {
    name: "stats poly",
    description: "Polynomial regression",
    endpoint: "/v1/stats/polynomial-regression",
    flags: {
      x:      { api: "x",      type: "data",   required: true, desc: "X values" },
      y:      { api: "y",      type: "data",   required: true, desc: "Y values" },
      degree: { api: "degree", type: "number", required: true, desc: "Polynomial degree (1-10)" },
    },
    format: (d) => formatGeneric("Polynomial Regression", d),
  },
  {
    name: "stats cointegration",
    description: "Engle-Granger cointegration test",
    endpoint: "/v1/stats/cointegration",
    flags: {
      x: { api: "series_x", type: "data", required: true, desc: "First series" },
      y: { api: "series_y", type: "data", required: true, desc: "Second series" },
    },
    format: (d) => formatGeneric("Cointegration", d),
  },
  {
    name: "stats hurst",
    description: "Hurst exponent (mean-reversion vs trending)",
    endpoint: "/v1/stats/hurst-exponent",
    flags: {
      series: { api: "series", type: "data", required: true, desc: "Time series (20+ points)" },
    },
    format: (d) => formatGeneric("Hurst Exponent", d),
  },
  {
    name: "stats garch",
    description: "GARCH(1,1) volatility forecast",
    endpoint: "/v1/stats/garch-forecast",
    flags: {
      returns: { api: "returns",          type: "data",   required: true,  desc: "Return series (30+)" },
      horizon: { api: "forecast_periods", type: "number", required: false, desc: "Forecast periods (default 5)" },
    },
    format: (d) => formatGeneric("GARCH Forecast", d),
  },
  {
    name: "stats zscore",
    description: "Z-score analysis",
    endpoint: "/v1/stats/zscore",
    flags: {
      series:    { api: "series",    type: "data",   required: true,  desc: "Data series" },
      window:    { api: "window",    type: "number", required: false, desc: "Rolling window" },
      threshold: { api: "threshold", type: "number", required: false, desc: "Extreme threshold (default 2)" },
    },
    format: (d) => formatGeneric("Z-Score", d),
  },
  {
    name: "stats distfit",
    description: "Distribution fitting",
    endpoint: "/v1/stats/distribution-fit",
    flags: {
      data: { api: "data", type: "data", required: true, desc: "Data to fit (10+)" },
    },
    format: (d) => formatGeneric("Distribution Fit", d),
  },
  {
    name: "stats corrmatrix",
    description: "Correlation & covariance matrix",
    endpoint: "/v1/stats/correlation-matrix",
    flags: {
      file: { api: "_file", type: "csv", required: true, desc: "CSV with named series" },
    },
    buildPayload(flags) { return { series: flags._file }; },
    format: (d) => formatGeneric("Correlation Matrix", d),
  },
  {
    name: "stats realvol",
    description: "Realized volatility estimators",
    endpoint: "/v1/stats/realized-volatility",
    flags: {
      close: { api: "close", type: "data", required: true,  desc: "Close prices" },
      high:  { api: "high",  type: "data", required: false, desc: "High prices (for Parkinson)" },
      low:   { api: "low",   type: "data", required: false, desc: "Low prices" },
      open:  { api: "open",  type: "data", required: false, desc: "Open prices (for Yang-Zhang)" },
    },
    format: (d) => formatGeneric("Realized Volatility", d),
  },
  {
    name: "stats normal",
    description: "Normal distribution (CDF, PDF, quantile)",
    endpoint: "/v1/stats/normal-distribution",
    flags: {
      x:    { api: "x",    type: "number", required: false, desc: "Evaluation point" },
      p:    { api: "p",    type: "number", required: false, desc: "Quantile probability" },
      mean: { api: "mean", type: "number", required: false, desc: "Mean (default 0)" },
      std:  { api: "std",  type: "number", required: false, desc: "Std dev (default 1)" },
    },
    format: (d) => formatGeneric("Normal Distribution", d),
  },
  {
    name: "stats sharpe",
    description: "Sharpe ratio",
    endpoint: "/v1/stats/sharpe-ratio",
    flags: {
      returns: { api: "returns",        type: "data",   required: true,  desc: "Returns" },
      rf:      { api: "risk_free_rate", type: "number", required: false, desc: "Risk-free rate" },
    },
    format: formatSharpe,
  },
  {
    name: "stats psharpe",
    description: "Probabilistic Sharpe ratio",
    endpoint: "/v1/stats/probabilistic-sharpe",
    flags: {
      returns:   { api: "returns",          type: "data",   required: true,  desc: "Returns (10+)" },
      rf:        { api: "risk_free_rate",   type: "number", required: false, desc: "Risk-free rate" },
      benchmark: { api: "benchmark_sharpe", type: "number", required: false, desc: "Benchmark Sharpe" },
    },
    format: (d) => formatGeneric("Probabilistic Sharpe", d),
  },
];
