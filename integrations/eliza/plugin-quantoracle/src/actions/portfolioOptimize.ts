import type { Action } from "@elizaos/core";
import { callQuantOracle, getConfig } from "../client";

export const portfolioOptimizeAction: Action = {
  name: "QUANT_PORTFOLIO_OPTIMIZE",
  similes: ["OPTIMIZE_PORTFOLIO", "MAX_SHARPE_WEIGHTS", "MIN_VOL_PORTFOLIO", "MEAN_VARIANCE_OPT"],
  description:
    "Mean-variance portfolio optimization — find optimal weights for max Sharpe, min variance, target return, or risk parity. $0.015 via x402 past free tier.",
  validate: async () => true,
  handler: async (runtime, _message, _state, options, callback) => {
    try {
      const data = await callQuantOracle("/v1/portfolio/optimize", options ?? {}, getConfig(runtime));
      const weights = Object.entries(data.weights ?? {})
        .map(([asset, w]: any) => `${asset}: ${(w * 100).toFixed(1)}%`)
        .join(", ");
      const text = `Optimal weights (${data.objective}): ${weights}\nExpected return: ${(data.expected_return * 100).toFixed(2)}% | Vol: ${(data.volatility * 100).toFixed(2)}% | Sharpe: ${data.sharpe?.toFixed(2)}`;
      callback?.({ text, content: data });
      return true;
    } catch (err: any) {
      callback?.({ text: `QuantOracle error: ${err.message}`, content: { error: err.message } });
      return false;
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Optimize my portfolio for max Sharpe" } },
      { user: "{{user2}}", content: { text: "Optimal weights: AAPL: 42%, GOOG: 35%, TSLA: 23%", action: "QUANT_PORTFOLIO_OPTIMIZE" } },
    ],
  ],
};
