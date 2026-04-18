import type { Action } from "solana-agent-kit";
import { z } from "zod";
import { callQuantOracle } from "../tools/client";

export const quantOptionsStrategyOptimizerAction: Action = {
  name: "QUANT_OPTIONS_STRATEGY_OPTIMIZER",
  similes: [
    "suggest options strategy",
    "best options play",
    "bullish bearish neutral strategy",
    "iron condor or straddle",
    "recommend options trade",
  ],
  description:
    "Rank top options strategies given a market outlook (bullish/bearish/neutral) and volatility view (rising/falling/stable). Returns Long Call, Bull Call Spread, Iron Condor, Long Straddle, etc. — each with legs, max profit/loss, breakevens, and score. PAID-ONLY — $0.08 per call via x402.",
  examples: [
    [
      {
        input: { S: 100, outlook: "bullish", vol_view: "rising", T: 0.25, sigma: 0.25 },
        output: {
          status: "success",
          top_pick: "Long Call (ATM)",
          strategies: [
            { name: "Long Call (ATM)", net_debit: 5.6, max_loss: 5.6, breakeven: [105.6] },
            { name: "Bull Call Spread", net_debit: 2.16, max_profit: 2.84 },
          ],
        },
      },
    ],
  ],
  schema: z.object({
    S: z.number().positive().describe("Spot price"),
    outlook: z.enum(["bullish", "bearish", "neutral"]),
    vol_view: z.enum(["rising", "falling", "stable"]).default("stable"),
    T: z.number().positive().describe("Time to expiration in years"),
    sigma: z.number().positive().describe("Current implied volatility"),
    r: z.number().default(0.05),
    q: z.number().default(0),
    capital: z.number().positive().default(10000),
  }),
  handler: async (_agent, input) => {
    const data = await callQuantOracle("/v1/options/strategy-optimizer", input);
    return { status: "success", ...data };
  },
};
