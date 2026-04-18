import type { Action } from "solana-agent-kit";
import { z } from "zod";
import { callQuantOracle } from "../tools/client";

export const quantLiquidationPriceAction: Action = {
  name: "QUANT_LIQUIDATION_PRICE",
  similes: [
    "liquidation price",
    "leverage liquidation",
    "margin call price",
    "where would i get liquidated",
    "perpetual liquidation price",
  ],
  description:
    "Calculate the liquidation price of a leveraged position given entry, collateral, leverage, and direction. Supports longs and shorts on perps, futures, and margin. Free tier eligible ($0.002 past 1000/day).",
  examples: [
    [
      {
        input: {
          entry_price: 50000,
          collateral: 1000,
          position_size: 5000,
          leverage: 5,
          direction: "long",
        },
        output: { status: "success", liquidation_price: 40000, distance_pct: 20 },
        explanation: "5x long BTC at $50k gets liquidated at $40k (20% drop).",
      },
    ],
  ],
  schema: z.object({
    entry_price: z.number().positive(),
    collateral: z.number().positive(),
    position_size: z.number().positive(),
    leverage: z.number().positive(),
    direction: z.enum(["long", "short"]),
    maintenance_margin: z.number().default(0.005).describe("Maintenance margin as fraction"),
  }),
  handler: async (_agent, input) => {
    const data = await callQuantOracle("/v1/crypto/liquidation-price", input);
    return { status: "success", ...data };
  },
};
