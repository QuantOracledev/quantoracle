import type { Action } from "@elizaos/core";
import { callQuantOracle, getConfig } from "../client";

export const backtestStrategyAction: Action = {
  name: "QUANT_BACKTEST_STRATEGY",
  similes: ["BACKTEST_TRADING_STRATEGY", "TEST_SMA_STRATEGY", "RSI_BACKTEST", "MOMENTUM_BACKTEST", "BOLLINGER_BACKTEST"],
  description:
    "Backtest a trading strategy (SMA crossover, RSI mean reversion, momentum, Bollinger breakout) on a price series. Returns Sharpe, Calmar, max drawdown, num trades, win rate, and vs buy-and-hold comparison. PAID-ONLY — $0.10 via x402.",
  validate: async () => true,
  handler: async (runtime, _message, _state, options, callback) => {
    try {
      const data = await callQuantOracle("/v1/backtest/strategy", options ?? {}, getConfig(runtime));
      const text = `Backtest (${data.strategy}, ${data.bars} bars):\nSharpe: ${data.performance.sharpe} | Total Return: ${(data.performance.total_return * 100).toFixed(2)}%\nMax DD: ${data.performance.max_drawdown} | Trades: ${data.num_trades}\nvs Buy&Hold: ${(data.vs_buy_hold.excess_return * 100).toFixed(2)}% excess`;
      callback?.({ text, content: data });
      return true;
    } catch (err: any) {
      callback?.({ text: `QuantOracle error: ${err.message}`, content: { error: err.message } });
      return false;
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Backtest a 20/50 SMA crossover on this price series" } },
      { user: "{{user2}}", content: { text: "Backtest (sma_crossover, 252 bars): Sharpe: 1.85 | Total Return: 12.5%", action: "QUANT_BACKTEST_STRATEGY" } },
    ],
  ],
};
