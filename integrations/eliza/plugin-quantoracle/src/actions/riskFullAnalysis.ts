import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { callQuantOracle, getConfig } from "../client";

export const riskFullAnalysisAction: Action = {
  name: "QUANT_RISK_FULL_ANALYSIS",
  similes: ["FULL_RISK_ANALYSIS", "RISK_TEARSHEET", "PORTFOLIO_RISK_REPORT", "SHARPE_SORTINO_VAR"],
  description:
    "Compute a complete risk tearsheet (Sharpe, Sortino, Calmar, VaR, CVaR, Kelly leverage, max drawdown, Hurst, CAGR) from a return series in a single call. PAID-ONLY — $0.04 per call via x402 USDC on Base or Solana.",
  validate: async (_runtime, message) => {
    // Requires at least 10 numbers in the message
    const nums = Array.from((message.content.text ?? "").matchAll(/-?\d+\.?\d*/g));
    return nums.length >= 10;
  },
  handler: async (runtime, message, _state, options, callback) => {
    // Accept structured returns in options first, fall back to parsing message
    const returns =
      (options?.returns as number[]) ??
      Array.from((message.content.text ?? "").matchAll(/-?0?\.\d+/g)).map((m) => Number(m[0]));
    if (returns.length < 10) {
      callback?.({
        text: "QuantOracle risk/full-analysis requires at least 10 return observations.",
        content: { error: "insufficient_data" },
      });
      return false;
    }
    try {
      const data = await callQuantOracle(
        "/v1/risk/full-analysis",
        { returns, portfolio_value: (options?.portfolio_value as number) ?? 100000 },
        getConfig(runtime)
      );
      const text = `Risk Tearsheet (${returns.length} periods):
Sharpe: ${data.risk.sharpe} | Sortino: ${data.risk.sortino} | Calmar: ${data.risk.calmar}
VaR(95%): ${data.risk.var_95} | Max DD: ${data.risk.max_drawdown}
Kelly leverage: ${data.kelly.full_kelly_leverage}x
Hurst: ${data.hurst.exponent} (${data.hurst.interpretation})
CAGR: ${(data.returns.cagr * 100).toFixed(2)}%`;
      callback?.({ text, content: data });
      return true;
    } catch (err: any) {
      callback?.({ text: `QuantOracle error: ${err.message}`, content: { error: err.message } });
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Run full risk analysis on these returns: 0.01, -0.02, 0.03, 0.005, -0.01, 0.02, -0.015, 0.025, 0.01, -0.005, 0.015" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "Risk Tearsheet (11 periods): Sharpe: 2.8303, Sortino: 4.5943, ...",
          action: "QUANT_RISK_FULL_ANALYSIS",
        },
      },
    ],
  ],
};
