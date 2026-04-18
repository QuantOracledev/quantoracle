import type { Action } from "solana-agent-kit";
import { z } from "zod";
import { callQuantOracle } from "../tools/client";

export const quantPairsSignalAction: Action = {
  name: "QUANT_PAIRS_SIGNAL",
  similes: [
    "pairs trading signal",
    "cointegration test",
    "statistical arbitrage signal",
    "hedge ratio",
    "mean reversion pair",
  ],
  description:
    "Generate a complete pairs trading signal from two price series: cointegration test (Engle-Granger), Hurst exponent, z-score, half-life, hedge ratio, and actionable signal (LONG/SHORT/WAIT/CLOSE/NO_TRADE). PAID-ONLY — $0.025 per call via x402.",
  examples: [
    [
      {
        input: {
          prices_x: [100, 101, 99, 102, 103, 100, 98, 101, 104, 102, 99, 101, 100, 103, 105],
          prices_y: [50, 51, 49, 52, 53, 51, 49, 51, 53, 52, 50, 51, 50, 52, 53],
        },
        output: {
          status: "success",
          cointegrated: true,
          signal: "LONG_X_SHORT_Y",
          hedge_ratio: 0.5,
          zscore: -1.9,
        },
      },
    ],
  ],
  schema: z.object({
    prices_x: z.array(z.number()).min(15).describe("Price series for asset X"),
    prices_y: z.array(z.number()).min(15).describe("Price series for asset Y (same length as X)"),
    entry_z: z.number().default(2.0).describe("Entry z-score threshold"),
    exit_z: z.number().default(0.5).describe("Exit z-score threshold"),
  }),
  handler: async (_agent, input) => {
    const data = await callQuantOracle("/v1/pairs/signal", input);
    return { status: "success", ...data };
  },
};
