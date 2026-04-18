import type { Action } from "solana-agent-kit";
import { z } from "zod";
import { callQuantOracle } from "../tools/client";

export const quantHedgingRecommendAction: Action = {
  name: "QUANT_HEDGING_RECOMMEND",
  similes: [
    "hedge my position",
    "protect my holdings",
    "cheapest hedge",
    "options hedge for stock",
    "how to hedge",
  ],
  description:
    "Rank the cheapest effective hedges for a given position (long stock, long crypto, etc.). Compares protective puts, collars, futures shorts, and partial hedges with cost, protection level, and affordability flag. PAID-ONLY — $0.04 per call via x402.",
  examples: [
    [
      {
        input: {
          position_type: "long_stock",
          position_value: 50000,
          asset_price: 100,
          volatility: 0.25,
          time_horizon_days: 30,
        },
        output: {
          status: "success",
          recommended: "collar",
          hedges: [
            { type: "collar", cost_usd: 258, protection: "floor at 95, cap at 110" },
            { type: "protective_put", cost_usd: 439 },
          ],
        },
      },
    ],
  ],
  schema: z.object({
    position_type: z.enum(["long_stock", "short_stock", "long_crypto", "long_options"]),
    position_value: z.number().positive(),
    asset_price: z.number().positive(),
    volatility: z.number().positive().describe("Annualized volatility"),
    time_horizon_days: z.number().int().positive().default(30),
    max_hedge_cost_pct: z.number().positive().default(0.05),
    r: z.number().default(0.05),
  }),
  handler: async (_agent, input) => {
    const data = await callQuantOracle("/v1/hedging/recommend", input);
    return { status: "success", ...data };
  },
};
