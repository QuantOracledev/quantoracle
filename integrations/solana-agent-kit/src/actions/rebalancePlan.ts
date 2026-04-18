import type { Action } from "solana-agent-kit";
import { z } from "zod";
import { callQuantOracle } from "../tools/client";

export const quantRebalancePlanAction: Action = {
  name: "QUANT_PORTFOLIO_REBALANCE_PLAN",
  similes: [
    "generate rebalance trades",
    "rebalance portfolio",
    "compute rebalance orders",
    "what trades to rebalance",
    "drift correction trades",
  ],
  description:
    "Generate the exact trade list to move a portfolio from current holdings to target weights, with transaction cost estimate. Returns buy/sell actions, total cost, drift before/after. PAID-ONLY — $0.05 per call via x402.",
  examples: [
    [
      {
        input: {
          current_holdings: { AAPL: 50000, TSLA: 30000, GLD: 20000 },
          target_weights: { AAPL: 0.4, TSLA: 0.4, GLD: 0.2 },
        },
        output: {
          status: "success",
          num_trades: 2,
          trades: [
            { asset: "AAPL", action: "sell", amount_usd: 10000 },
            { asset: "TSLA", action: "buy", amount_usd: 10000 },
          ],
          total_cost_usd: 20,
        },
      },
    ],
  ],
  schema: z.object({
    current_holdings: z
      .record(z.number())
      .describe("Dict of asset symbol to current USD value"),
    target_weights: z
      .record(z.number())
      .describe("Dict of asset symbol to target weight (must sum to ~1.0)"),
    transaction_cost_bps: z.number().min(0).default(10).describe("One-way cost in bps"),
    min_trade_usd: z.number().min(0).default(10),
  }),
  handler: async (_agent, input) => {
    const data = await callQuantOracle("/v1/portfolio/rebalance-plan", input);
    return { status: "success", ...data };
  },
};
