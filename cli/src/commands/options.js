import { formatOptionsPrice, formatImpliedVol, formatStrategy, formatGeneric } from "../format.js";

export default [
  {
    name: "options price",
    aliases: ["bs"],
    description: "Black-Scholes pricing with 10 Greeks",
    endpoint: "/v1/options/price",
    flags: {
      spot:   { api: "S",     type: "number", required: true,  desc: "Spot price" },
      strike: { api: "K",     type: "number", required: true,  desc: "Strike price" },
      expiry: { api: "T",     type: "number", required: true,  desc: "Time to expiry (years)" },
      vol:    { api: "sigma", type: "number", required: true,  desc: "Volatility (annualized)" },
      rate:   { api: "r",     type: "number", required: false, desc: "Risk-free rate", default: 0.05 },
      div:    { api: "q",     type: "number", required: false, desc: "Dividend yield", default: 0 },
      type:   { api: "type",  type: "string", required: false, desc: "call or put", default: "call" },
    },
    format: formatOptionsPrice,
  },
  {
    name: "options iv",
    aliases: ["iv"],
    description: "Implied volatility solver",
    endpoint: "/v1/options/implied-vol",
    flags: {
      spot:   { api: "S",            type: "number", required: true, desc: "Spot price" },
      strike: { api: "K",            type: "number", required: true, desc: "Strike price" },
      expiry: { api: "T",            type: "number", required: true, desc: "Time to expiry (years)" },
      price:  { api: "market_price", type: "number", required: true, desc: "Market option price" },
      rate:   { api: "r",            type: "number", required: false, desc: "Risk-free rate" },
      type:   { api: "type",         type: "string", required: false, desc: "call or put", default: "call" },
    },
    format: formatImpliedVol,
  },
  {
    name: "options strategy",
    description: "Multi-leg strategy P&L analysis",
    endpoint: "/v1/options/strategy",
    flags: {
      legs: { api: "legs", type: "json", required: true, desc: 'Legs JSON: [{"type":"call","K":100,"premium":5,"quantity":1}]' },
    },
    format: formatStrategy,
  },
  {
    name: "options payoff",
    description: "Payoff diagram data",
    endpoint: "/v1/options/payoff-diagram",
    flags: {
      legs: { api: "legs", type: "json", required: true, desc: 'Legs JSON: [{"type":"call","strike":100,"premium":5,"quantity":1}]' },
      spot: { api: "spot", type: "number", required: true, desc: "Current spot price" },
    },
    format: (d) => formatGeneric("Payoff Diagram", d),
  },
];
