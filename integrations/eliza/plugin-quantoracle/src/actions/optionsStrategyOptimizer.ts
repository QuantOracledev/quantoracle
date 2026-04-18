import type { Action } from "@elizaos/core";
import { callQuantOracle, getConfig } from "../client";

export const optionsStrategyOptimizerAction: Action = {
  name: "QUANT_OPTIONS_STRATEGY_OPTIMIZER",
  similes: ["RECOMMEND_OPTIONS_STRATEGY", "BEST_OPTIONS_PLAY", "SUGGEST_IRON_CONDOR_OR_STRADDLE"],
  description:
    "Rank top options strategies (Long Call, Bull Call Spread, Iron Condor, Long Straddle, etc.) given market outlook (bullish/bearish/neutral) and volatility view (rising/falling/stable). PAID-ONLY — $0.08 via x402.",
  validate: async () => true,
  handler: async (runtime, _message, _state, options, callback) => {
    try {
      const data = await callQuantOracle("/v1/options/strategy-optimizer", options ?? {}, getConfig(runtime));
      const top = data.strategies?.slice(0, 3) ?? [];
      const text = `Top options strategies for ${data.inputs.outlook}/${data.inputs.vol_view} view:\n${top
        .map((s: any, i: number) => `${i + 1}. ${s.name} — debit $${s.net_debit}, max loss $${s.max_loss}, BE ${s.breakeven.join(" / ")}`)
        .join("\n")}\nTop pick: ${data.top_pick}`;
      callback?.({ text, content: data });
      return true;
    } catch (err: any) {
      callback?.({ text: `QuantOracle error: ${err.message}`, content: { error: err.message } });
      return false;
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "What's the best options strategy if I'm bullish and expect rising vol?" } },
      { user: "{{user2}}", content: { text: "Top pick: Long Call (ATM)", action: "QUANT_OPTIONS_STRATEGY_OPTIMIZER" } },
    ],
  ],
};
