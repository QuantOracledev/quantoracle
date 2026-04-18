import type { Action } from "@elizaos/core";
import { callQuantOracle, getConfig } from "../client";

export const impermanentLossAction: Action = {
  name: "QUANT_IMPERMANENT_LOSS",
  similes: ["IMPERMANENT_LOSS_CALC", "IL_CALCULATOR", "UNISWAP_LP_LOSS", "AMM_DIVERGENCE_LOSS"],
  description:
    "Calculate impermanent loss for Uniswap v2 or v3 LP positions given a price ratio change. $0.005 via x402 past free tier.",
  validate: async () => true,
  handler: async (runtime, _message, _state, options, callback) => {
    try {
      const data = await callQuantOracle("/v1/crypto/impermanent-loss", options ?? {}, getConfig(runtime));
      const text = `Impermanent loss: ${(data.il_pct ?? 0).toFixed(2)}% (LP value $${(data.final_value ?? 0).toFixed(2)} vs $${(data.hodl_value ?? 0).toFixed(2)} HODL)`;
      callback?.({ text, content: data });
      return true;
    } catch (err: any) {
      callback?.({ text: `QuantOracle error: ${err.message}`, content: { error: err.message } });
      return false;
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "What's my impermanent loss if ETH doubled?" } },
      { user: "{{user2}}", content: { text: "Impermanent loss: -5.72%", action: "QUANT_IMPERMANENT_LOSS" } },
    ],
  ],
};
