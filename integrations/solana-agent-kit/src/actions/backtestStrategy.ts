import type { Action } from "solana-agent-kit";
import { z } from "zod";
import { callQuantOracle } from "../tools/client";

export const quantBacktestStrategyAction: Action = {
  name: "QUANT_BACKTEST_STRATEGY",
  similes: [
    "backtest a trading strategy",
    "run sma crossover backtest",
    "test rsi strategy",
    "momentum backtest",
    "bollinger breakout backtest",
    "evaluate trading strategy",
  ],
  description:
    "Deterministic backtest of a trading strategy on price history. Supports SMA crossover, RSI mean reversion, momentum, and Bollinger breakout. Returns total return, Sharpe, Calmar, max drawdown, num trades, win rate, and vs buy-and-hold. PAID-ONLY — $0.10 per call via x402. Replaces 10+ individual indicator + risk calls.",
  examples: [
    [
      {
        input: {
          prices: [100, 101, 102, 103, 104, 105, 106, 105, 104, 103, 102, 101, 100],
          strategy: "sma_crossover",
          params: { fast: 5, slow: 10 },
        },
        output: {
          status: "success",
          performance: { sharpe: 1.85, max_drawdown: -0.05, total_return: 0.12 },
          num_trades: 3,
        },
        explanation: "SMA(5,10) crossover on 13 bars: Sharpe 1.85, 3 trades, 12% return",
      },
    ],
  ],
  schema: z.object({
    prices: z
      .array(z.number())
      .min(30)
      .describe("Price history (daily closes, oldest first). Min 30 bars."),
    strategy: z
      .enum(["sma_crossover", "rsi_mean_reversion", "momentum", "bollinger_breakout"])
      .default("sma_crossover")
      .describe("Strategy type"),
    params: z
      .record(z.union([z.number(), z.string()]))
      .default({})
      .describe(
        "Strategy params. SMA: {fast, slow}. RSI: {period, oversold, overbought}. Momentum: {lookback}. Bollinger: {period, std}."
      ),
    initial_capital: z.number().positive().default(10000),
    commission_bps: z.number().min(0).default(5).describe("Round-trip commission (bps)"),
    slippage_bps: z.number().min(0).default(5).describe("One-way slippage (bps)"),
  }),
  handler: async (_agent, input) => {
    const data = await callQuantOracle("/v1/backtest/strategy", input);
    return { status: "success", ...data };
  },
};
