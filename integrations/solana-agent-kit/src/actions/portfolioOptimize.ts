import type { Action } from "solana-agent-kit";
import { z } from "zod";
import { callQuantOracle } from "../tools/client";

export const quantPortfolioOptimizeAction: Action = {
  name: "QUANT_PORTFOLIO_OPTIMIZE",
  similes: [
    "optimize portfolio",
    "max sharpe weights",
    "min variance portfolio",
    "mean variance optimization",
    "efficient frontier",
  ],
  description:
    "Mean-variance portfolio optimization — finds optimal weights for max Sharpe, min variance, or target return. Returns weights, expected return, volatility, and Sharpe ratio. Costs $0.015 via x402 past free tier.",
  examples: [
    [
      {
        input: {
          returns: {
            AAPL: [0.01, 0.02, -0.01, 0.015, 0.005, -0.008],
            GOOG: [0.015, -0.01, 0.02, 0.01, -0.005, 0.012],
            TSLA: [0.03, -0.025, 0.04, 0.02, -0.015, 0.025],
          },
          objective: "max_sharpe",
        },
        output: {
          status: "success",
          weights: { AAPL: 0.42, GOOG: 0.35, TSLA: 0.23 },
          sharpe: 1.87,
        },
      },
    ],
  ],
  schema: z.object({
    returns: z
      .record(z.array(z.number()))
      .describe("Dict of asset symbol to return series (all arrays same length)"),
    objective: z
      .enum(["max_sharpe", "min_variance", "target_return", "risk_parity"])
      .default("max_sharpe"),
    target_return: z.number().optional().describe("Required if objective=target_return"),
    risk_free_rate: z.number().default(0.045),
  }),
  handler: async (_agent, input) => {
    const data = await callQuantOracle("/v1/portfolio/optimize", input);
    return { status: "success", ...data };
  },
};
