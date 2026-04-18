import type { Action } from "solana-agent-kit";
import { z } from "zod";
import { callQuantOracle } from "../tools/client";

export const quantRiskFullAnalysisAction: Action = {
  name: "QUANT_RISK_FULL_ANALYSIS",
  similes: [
    "full risk analysis",
    "complete risk tearsheet",
    "portfolio risk summary",
    "compute sharpe sortino var drawdown",
    "risk metrics all at once",
  ],
  description:
    "Complete risk tearsheet in one call: Sharpe, Sortino, Calmar, VaR, CVaR, Kelly leverage, max drawdown, Hurst exponent, CAGR. Replaces 7 individual endpoint calls. PAID-ONLY — no free tier. Costs $0.04 per call via x402.",
  examples: [
    [
      {
        input: {
          returns: [0.01, -0.02, 0.03, 0.005, -0.01, 0.02, -0.015, 0.025, 0.01, -0.005, 0.015],
          portfolio_value: 10000,
        },
        output: {
          status: "success",
          risk: { sharpe: 2.83, sortino: 4.59, var_95: -0.03, max_drawdown: -0.03 },
          kelly: { full_kelly_leverage: 10.65 },
        },
        explanation: "11-period returns analyzed: Sharpe 2.83, Kelly suggests 10.6x leverage",
      },
    ],
  ],
  schema: z.object({
    returns: z
      .array(z.number())
      .min(10)
      .describe("Daily return series (as decimals, e.g. 0.01 = 1%)"),
    portfolio_value: z.number().positive().default(100000).describe("Current portfolio value"),
    risk_free_rate: z.number().default(0.045).describe("Annual risk-free rate"),
  }),
  handler: async (_agent, input) => {
    const data = await callQuantOracle("/v1/risk/full-analysis", input);
    return { status: "success", ...data };
  },
};
