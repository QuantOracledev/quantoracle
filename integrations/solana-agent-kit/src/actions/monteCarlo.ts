import type { Action } from "solana-agent-kit";
import { z } from "zod";
import { callQuantOracle } from "../tools/client";

export const quantMonteCarloAction: Action = {
  name: "QUANT_MONTE_CARLO_SIM",
  similes: [
    "monte carlo simulation",
    "portfolio projection",
    "retirement simulation",
    "gbm paths",
    "probability of ruin",
  ],
  description:
    "Run a Monte Carlo simulation of portfolio value using Geometric Brownian Motion with contributions/withdrawals. Returns terminal distribution (mean, p5/p25/p50/p75/p95), probability of loss, probability of doubling, CAGR. Costs $0.015 via x402 past free tier. Keep simulations ≤ 1000 and years ≤ 30 for fastest response via MCP.",
  examples: [
    [
      {
        input: { initial_value: 100000, annual_return: 0.08, annual_vol: 0.15, years: 30, simulations: 1000 },
        output: {
          status: "success",
          terminal: { mean: 1075981, median: 764033, p5: 203883 },
          prob_loss: 0.003,
          prob_double: 0.952,
        },
      },
    ],
  ],
  schema: z.object({
    initial_value: z.number().positive().default(100000),
    annual_return: z.number().default(0.1),
    annual_vol: z.number().positive().default(0.2),
    years: z.number().positive().max(100).default(5),
    simulations: z.number().int().min(1).max(5000).default(1000),
    contributions: z.number().default(0).describe("Annual contribution amount"),
    withdrawal_rate: z.number().default(0).describe("Annual withdrawal as fraction"),
  }),
  handler: async (_agent, input) => {
    const data = await callQuantOracle("/v1/simulate/montecarlo", input);
    return { status: "success", ...data };
  },
};
