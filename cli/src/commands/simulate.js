import { formatMonteCarlo } from "../format.js";

export default [
  {
    name: "simulate mc",
    aliases: ["mc"],
    description: "Monte Carlo simulation (GBM)",
    endpoint: "/v1/simulate/montecarlo",
    flags: {
      value:  { api: "initial_value",  type: "number", required: false, desc: "Starting value (default 100000)" },
      return: { api: "annual_return",  type: "number", required: false, desc: "Annual return (default 0.10)" },
      vol:    { api: "annual_vol",     type: "number", required: false, desc: "Annual volatility (default 0.20)" },
      years:  { api: "years",          type: "number", required: false, desc: "Years to simulate (default 5)" },
      sims:   { api: "simulations",    type: "number", required: false, desc: "Number of paths (default 1000)" },
    },
    format: formatMonteCarlo,
  },
];
