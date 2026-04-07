import { formatGeneric } from "../format.js";

export default [
  {
    name: "macro inflation",
    description: "Inflation-adjusted returns",
    endpoint: "/v1/macro/inflation-adjusted",
    flags: {
      nominal:   { api: "nominal_return_pct",  type: "number", required: true, desc: "Nominal return %" },
      inflation: { api: "inflation_rate_pct",  type: "number", required: true, desc: "Inflation rate %" },
    },
    format: (d) => formatGeneric("Inflation Adjusted", d),
  },
  {
    name: "macro taylor",
    description: "Taylor Rule interest rate",
    endpoint: "/v1/macro/taylor-rule",
    flags: {
      inflation:        { api: "current_inflation", type: "number", required: true,  desc: "Current inflation" },
      "target-inflation": { api: "target_inflation", type: "number", required: false, desc: "Target inflation (default 2)" },
      "gdp-gap":        { api: "output_gap_pct",    type: "number", required: false, desc: "Output gap %" },
    },
    format: (d) => formatGeneric("Taylor Rule", d),
  },
  {
    name: "macro realyield",
    description: "Real yield & breakeven inflation",
    endpoint: "/v1/macro/real-yield",
    flags: {
      nominal: { api: "nominal_yield",         type: "number", required: true,  desc: "Nominal yield" },
      tips:    { api: "tips_yield",             type: "number", required: false, desc: "TIPS yield" },
      inflation: { api: "inflation_expectation", type: "number", required: false, desc: "Inflation expectation" },
    },
    format: (d) => formatGeneric("Real Yield", d),
  },
];
