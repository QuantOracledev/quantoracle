import type { Action } from "@elizaos/core";
import { callQuantOracle, getConfig } from "../client";

export const rebalancePlanAction: Action = {
  name: "QUANT_PORTFOLIO_REBALANCE_PLAN",
  similes: ["REBALANCE_PORTFOLIO", "GENERATE_REBALANCE_TRADES", "COMPUTE_DRIFT_TRADES"],
  description:
    "Generate exact trade list to rebalance from current holdings to target weights, with transaction cost estimate. Returns buy/sell actions, total cost, drift before/after. PAID-ONLY — $0.05 via x402.",
  validate: async () => true,
  handler: async (runtime, _message, _state, options, callback) => {
    try {
      const data = await callQuantOracle("/v1/portfolio/rebalance-plan", options ?? {}, getConfig(runtime));
      const tradeList = data.trades
        ?.map((t: any) => `${t.action.toUpperCase()} $${t.amount_usd} of ${t.asset}`)
        .join("\n  ") ?? "no trades needed";
      const text = `Rebalance Plan:\nPortfolio value: $${data.portfolio_value}\n${data.num_trades} trades needed:\n  ${tradeList}\nTotal cost: $${data.total_cost_usd} (${data.total_cost_bps} bps)`;
      callback?.({ text, content: data });
      return true;
    } catch (err: any) {
      callback?.({ text: `QuantOracle error: ${err.message}`, content: { error: err.message } });
      return false;
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Rebalance my portfolio to 40/40/20 AAPL/TSLA/GLD" } },
      { user: "{{user2}}", content: { text: "2 trades needed. Total cost: $20.", action: "QUANT_PORTFOLIO_REBALANCE_PLAN" } },
    ],
  ],
};
