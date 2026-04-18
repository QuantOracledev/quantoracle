import type { Action } from "solana-agent-kit";
import { z } from "zod";
import { callQuantOracle } from "../tools/client";

export const quantOptionsPriceAction: Action = {
  name: "QUANT_OPTIONS_PRICE",
  similes: [
    "price an option",
    "black scholes",
    "calculate option greeks",
    "option pricing",
    "compute delta gamma theta vega",
  ],
  description:
    "Price a European option using Black-Scholes with all 10 Greeks (delta, gamma, theta, vega, rho, vanna, charm, volga, speed, color). Deterministic — same inputs always produce same outputs. Uses QuantOracle's /v1/options/price endpoint.",
  examples: [
    [
      {
        input: { S: 100, K: 105, T: 0.5, sigma: 0.2, r: 0.05, type: "call" },
        output: {
          status: "success",
          price: 4.5817,
          greeks: { delta: 0.4612, gamma: 0.0281, theta: -0.0211, vega: 0.2808 },
        },
        explanation:
          "A 6-month call at K=105 with spot=100 and 20% vol prices at $4.58 with delta 0.46",
      },
    ],
  ],
  schema: z.object({
    S: z.number().positive().describe("Spot price of underlying"),
    K: z.number().positive().describe("Strike price"),
    T: z.number().positive().describe("Time to expiration in years"),
    sigma: z.number().positive().describe("Annualized implied volatility (0.20 = 20%)"),
    r: z.number().default(0.05).describe("Risk-free rate (annualized)"),
    q: z.number().default(0).describe("Continuous dividend yield"),
    type: z.enum(["call", "put"]).default("call"),
  }),
  handler: async (_agent, input) => {
    const data = await callQuantOracle("/v1/options/price", input);
    return { status: "success", ...data };
  },
};
