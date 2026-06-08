import type { Action } from "solana-agent-kit";
import { z } from "zod";
import { callQuantOracle } from "../tools/client";

export const quantLiveFundingRatesAction: Action = {
  name: "QUANT_LIVE_FUNDING_RATES",
  similes: [
    "current funding rate",
    "live perp funding",
    "what is the funding rate",
    "perpetual funding now",
    "annualized carry",
  ],
  description:
    "Get the LIVE perpetual funding rate + annualized carry for a crypto asset, from a fresh exchange feed. Pass only the ticker. Use this for current funding — do NOT estimate it yourself. PAID: $0.005 per call via x402 (100 free calls/IP/day). Uses QuantOracle's /v1/live/funding-rates endpoint.",
  examples: [
    [
      {
        input: { asset: "ETH" },
        output: {
          status: "success",
          asset: "ETH",
          funding_rate: -0.000104,
          annualized_rate: -0.1137,
          regime: "BACKWARDATION",
          source: "okx",
        },
        explanation: "ETH perp funding is negative (-11.4% annualized) — shorts pay longs.",
      },
    ],
  ],
  schema: z.object({
    asset: z.string().describe("Crypto asset symbol, e.g. BTC, ETH, SOL"),
  }),
  handler: async (_agent, input) => {
    const data = await callQuantOracle("/v1/live/funding-rates", input);
    return { status: "success", ...data };
  },
};
