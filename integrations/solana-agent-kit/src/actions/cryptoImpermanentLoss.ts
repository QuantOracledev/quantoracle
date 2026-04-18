import type { Action } from "solana-agent-kit";
import { z } from "zod";
import { callQuantOracle } from "../tools/client";

export const quantImpermanentLossAction: Action = {
  name: "QUANT_IMPERMANENT_LOSS",
  similes: [
    "impermanent loss",
    "il calculator",
    "uniswap lp loss",
    "amm liquidity provider loss",
    "lp divergence loss",
  ],
  description:
    "Calculate impermanent loss for Uniswap v2/v3 LP positions given price ratio change. For v3, provide the concentrated range. Free tier eligible ($0.005 past 1000/day).",
  examples: [
    [
      {
        input: { current_price_ratio: 2.0, initial_value: 10000, pool_type: "v2" },
        output: { status: "success", il_pct: -5.72, final_value: 9428 },
        explanation: "When price doubles, Uniswap v2 LP loses 5.72% vs holding.",
      },
    ],
  ],
  schema: z.object({
    current_price_ratio: z
      .number()
      .positive()
      .describe("Current price / initial price (e.g. 2.0 = price doubled)"),
    initial_value: z.number().positive().default(10000).describe("Initial LP value"),
    pool_type: z.enum(["v2", "v3"]).default("v2"),
    range_low: z.number().optional().describe("v3 only: lower price bound"),
    range_high: z.number().optional().describe("v3 only: upper price bound"),
  }),
  handler: async (_agent, input) => {
    const data = await callQuantOracle("/v1/crypto/impermanent-loss", input);
    return { status: "success", ...data };
  },
};
