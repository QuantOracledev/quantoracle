import { formatTechnical, formatGeneric } from "../format.js";

export default [
  {
    name: "indicators technical",
    aliases: ["ta"],
    description: "13 technical indicators (RSI, MACD, Bollinger, ATR...)",
    endpoint: "/v1/indicators/technical",
    flags: {
      prices: { api: "prices", type: "data",   required: true,  desc: "Price series" },
      period: { api: "period", type: "number", required: false, desc: "Lookback period (default 14)" },
    },
    format: formatTechnical,
  },
  {
    name: "indicators regime",
    description: "Trend & volatility regime detection",
    endpoint: "/v1/indicators/regime",
    flags: {
      prices: { api: "prices",     type: "data",   required: true,  desc: "Price series (30+ points)" },
      sma:    { api: "sma_period", type: "number", required: false, desc: "SMA period (default 50)" },
    },
    format: (d) => formatGeneric("Regime", d),
  },
  {
    name: "indicators crossover",
    description: "Golden/death cross detection",
    endpoint: "/v1/indicators/crossover",
    flags: {
      prices: { api: "prices",      type: "data",   required: true,  desc: "Price series (30+ points)" },
      fast:   { api: "fast_period", type: "number", required: false, desc: "Fast period (default 10)" },
      slow:   { api: "slow_period", type: "number", required: false, desc: "Slow period (default 50)" },
    },
    format: (d) => formatGeneric("Crossover", d),
  },
  {
    name: "indicators bollinger",
    description: "Bollinger Bands & squeeze detection",
    endpoint: "/v1/indicators/bollinger-bands",
    flags: {
      prices: { api: "prices",  type: "data",   required: true,  desc: "Price series" },
      period: { api: "window",  type: "number", required: false, desc: "Window (default 20)" },
      std:    { api: "num_std", type: "number", required: false, desc: "Std deviations (default 2)" },
    },
    format: (d) => formatGeneric("Bollinger Bands", d),
  },
  {
    name: "indicators fibonacci",
    description: "Fibonacci retracement levels",
    endpoint: "/v1/indicators/fibonacci-retracement",
    flags: {
      high:      { api: "swing_high", type: "number", required: true, desc: "Swing high" },
      low:       { api: "swing_low",  type: "number", required: true, desc: "Swing low" },
      direction: { api: "direction",  type: "string", required: false, desc: "up or down" },
    },
    format: (d) => formatGeneric("Fibonacci Retracement", d),
  },
  {
    name: "indicators atr",
    description: "Average True Range",
    endpoint: "/v1/indicators/atr",
    flags: {
      high:   { api: "high",   type: "data",   required: true,  desc: "High prices" },
      low:    { api: "low",    type: "data",   required: true,  desc: "Low prices" },
      close:  { api: "close",  type: "data",   required: true,  desc: "Close prices" },
      period: { api: "period", type: "number", required: false, desc: "Period (default 14)" },
    },
    format: (d) => formatGeneric("ATR", d),
  },
];
