import type { Action } from "@elizaos/core";
import { callQuantOracle, getConfig } from "../client";

export const hedgingRecommendAction: Action = {
  name: "QUANT_HEDGING_RECOMMEND",
  similes: ["HEDGE_POSITION", "PROTECT_HOLDINGS", "CHEAPEST_HEDGE", "PROTECTIVE_PUT_OR_COLLAR"],
  description:
    "Rank the cheapest effective hedges (protective put, collar, futures short, partial) for a long or short position. PAID-ONLY — $0.04 via x402.",
  validate: async () => true,
  handler: async (runtime, _message, _state, options, callback) => {
    try {
      const data = await callQuantOracle("/v1/hedging/recommend", options ?? {}, getConfig(runtime));
      const top = data.hedges?.[0];
      const text = `Recommended hedge: ${top?.type}\n${top?.description}\nCost: $${top?.cost_usd} (${(top?.cost_pct * 100).toFixed(2)}% of position)\nProtection: ${top?.protection}`;
      callback?.({ text, content: data });
      return true;
    } catch (err: any) {
      callback?.({ text: `QuantOracle error: ${err.message}`, content: { error: err.message } });
      return false;
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "How should I hedge a $50k long stock position?" } },
      { user: "{{user2}}", content: { text: "Recommended hedge: collar", action: "QUANT_HEDGING_RECOMMEND" } },
    ],
  ],
};
