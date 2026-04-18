import type { Action } from "@elizaos/core";
import { callQuantOracle, getConfig } from "../client";

export const pairsSignalAction: Action = {
  name: "QUANT_PAIRS_SIGNAL",
  similes: ["PAIRS_TRADING_SIGNAL", "COINTEGRATION_TEST", "STAT_ARB_SIGNAL", "HEDGE_RATIO"],
  description:
    "Generate a complete pairs trading signal from two price series: cointegration (Engle-Granger), Hurst exponent, z-score, half-life, hedge ratio, actionable signal (LONG/SHORT/WAIT/CLOSE/NO_TRADE). PAID-ONLY — $0.025 via x402.",
  validate: async () => true,
  handler: async (runtime, _message, _state, options, callback) => {
    try {
      const data = await callQuantOracle("/v1/pairs/signal", options ?? {}, getConfig(runtime));
      const text = `Pairs Signal: ${data.signal}\nCointegrated: ${data.cointegrated} | Hurst: ${data.hurst} | z-score: ${data.zscore}\nHedge ratio: ${data.hedge_ratio} | Half-life: ${data.half_life} periods`;
      callback?.({ text, content: data });
      return true;
    } catch (err: any) {
      callback?.({ text: `QuantOracle error: ${err.message}`, content: { error: err.message } });
      return false;
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Check pairs trading signal for these two price series" } },
      { user: "{{user2}}", content: { text: "Pairs Signal: LONG_X_SHORT_Y (z=-2.1, cointegrated)", action: "QUANT_PAIRS_SIGNAL" } },
    ],
  ],
};
