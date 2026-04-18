import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { callQuantOracle, getConfig } from "../client";

export const optionsPriceAction: Action = {
  name: "QUANT_OPTIONS_PRICE",
  similes: ["PRICE_OPTION", "BLACK_SCHOLES", "COMPUTE_GREEKS", "OPTION_VALUATION"],
  description:
    "Price a European option with Black-Scholes and all 10 Greeks (delta, gamma, theta, vega, rho, vanna, charm, volga, speed, color). Requires: spot price (S), strike (K), time to expiry (T, years), implied volatility (sigma).",
  validate: async (_runtime: IAgentRuntime, _message: Memory) => true,
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: Record<string, unknown>,
    callback?: HandlerCallback
  ) => {
    const text = message.content.text ?? "";
    // Very simple numeric extraction — production would use an LLM template
    const numbers = Array.from(text.matchAll(/-?\d+\.?\d*/g)).map((m) => Number(m[0]));
    const params = {
      S: numbers[0] ?? 100,
      K: numbers[1] ?? 105,
      T: numbers[2] ?? 0.5,
      sigma: numbers[3] ?? 0.2,
      r: numbers[4] ?? 0.05,
      type: text.toLowerCase().includes("put") ? "put" : "call",
    };
    try {
      const data = await callQuantOracle<{ price: number; greeks: Record<string, number> }>(
        "/v1/options/price",
        params,
        getConfig(runtime)
      );
      const msg = `Option ${params.type} S=${params.S} K=${params.K} T=${params.T}y σ=${params.sigma}:\nPrice: $${data.price.toFixed(4)}\nDelta: ${data.greeks.delta.toFixed(4)}, Gamma: ${data.greeks.gamma.toFixed(4)}, Theta: ${data.greeks.theta.toFixed(4)}, Vega: ${data.greeks.vega.toFixed(4)}`;
      callback?.({ text: msg, content: data });
      return true;
    } catch (err: any) {
      callback?.({ text: `QuantOracle error: ${err.message}`, content: { error: err.message } });
      return false;
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Price a call option: spot 100, strike 105, 6 months, 20% vol" } },
      {
        user: "{{user2}}",
        content: {
          text: "Option call S=100 K=105 T=0.5y σ=0.2:\nPrice: $4.5817\nDelta: 0.4612, Gamma: 0.0281, Theta: -0.0211, Vega: 0.2808",
          action: "QUANT_OPTIONS_PRICE",
        },
      },
    ],
  ],
};
