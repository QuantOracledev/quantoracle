import type { Action } from "@elizaos/core";
import { callQuantOracle, getConfig } from "../client";

export const liquidationPriceAction: Action = {
  name: "QUANT_LIQUIDATION_PRICE",
  similes: ["LIQUIDATION_PRICE", "LEVERAGE_LIQ_PRICE", "MARGIN_CALL_PRICE"],
  description:
    "Calculate the liquidation price of a leveraged position (long or short) given entry, collateral, leverage. $0.002 via x402 past free tier.",
  validate: async () => true,
  handler: async (runtime, _message, _state, options, callback) => {
    try {
      const data = await callQuantOracle("/v1/crypto/liquidation-price", options ?? {}, getConfig(runtime));
      const text = `Liquidation price: $${data.liquidation_price} (${data.distance_pct?.toFixed(2)}% from entry)`;
      callback?.({ text, content: data });
      return true;
    } catch (err: any) {
      callback?.({ text: `QuantOracle error: ${err.message}`, content: { error: err.message } });
      return false;
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "I'm 5x long BTC at 50k with $1000 collateral, where's my liq?" } },
      { user: "{{user2}}", content: { text: "Liquidation price: $40000 (20% from entry)", action: "QUANT_LIQUIDATION_PRICE" } },
    ],
  ],
};
