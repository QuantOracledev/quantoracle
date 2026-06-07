import type { Action } from "solana-agent-kit";
import { z } from "zod";
import { callQuantOracle } from "../tools/client";

export const quantLiveVolatilityAction: Action = {
  name: "QUANT_LIVE_VOLATILITY",
  similes: [
    "current volatility",
    "live realized vol",
    "how volatile is bitcoin right now",
    "crypto volatility now",
    "fresh volatility data",
  ],
  description:
    "Get LIVE realized volatility (7d/30d/90d) + regime for a crypto asset, computed from FRESH market data. You pass only the ticker; QuantOracle fetches the candles and runs the math. Use this for current volatility — do NOT estimate it yourself. PAID: $0.02 per call via x402 (3 free trial calls/IP/day). Uses QuantOracle's /v1/live/volatility endpoint.",
  examples: [
    [
      {
        input: { asset: "BTC" },
        output: {
          status: "success",
          asset: "BTC",
          spot: 61728.7,
          realized_vol_30d: 0.31,
          regime: "NORMAL",
          source: "kraken",
        },
        explanation: "Fresh BTC realized vol: 31% annualized over 30 days, normal regime.",
      },
    ],
  ],
  schema: z.object({
    asset: z.string().describe("Crypto asset symbol, e.g. BTC, ETH, SOL"),
  }),
  handler: async (_agent, input) => {
    const data = await callQuantOracle("/v1/live/volatility", input);
    return { status: "success", ...data };
  },
};
