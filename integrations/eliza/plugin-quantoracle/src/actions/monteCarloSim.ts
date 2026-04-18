import type { Action } from "@elizaos/core";
import { callQuantOracle, getConfig } from "../client";

export const monteCarloSimAction: Action = {
  name: "QUANT_MONTE_CARLO_SIM",
  similes: ["MONTE_CARLO_SIMULATION", "PORTFOLIO_PROJECTION", "RETIREMENT_SIMULATION", "GBM_PATHS"],
  description:
    "Run a Monte Carlo simulation of portfolio value using Geometric Brownian Motion with contributions/withdrawals. Returns terminal distribution (p5/p25/p50/p75/p95), probability of loss, probability of doubling, CAGR. $0.015 via x402 past free tier.",
  validate: async () => true,
  handler: async (runtime, _message, _state, options, callback) => {
    try {
      const data = await callQuantOracle(
        "/v1/simulate/montecarlo",
        {
          initial_value: (options?.initial_value as number) ?? 100000,
          annual_return: (options?.annual_return as number) ?? 0.08,
          annual_vol: (options?.annual_vol as number) ?? 0.15,
          years: (options?.years as number) ?? 30,
          simulations: (options?.simulations as number) ?? 1000,
          contributions: (options?.contributions as number) ?? 0,
          withdrawal_rate: (options?.withdrawal_rate as number) ?? 0,
        },
        getConfig(runtime)
      );
      const t = data.terminal;
      const text = `Monte Carlo (${data.cagr ? (data.cagr * 100).toFixed(2) + "% CAGR" : ""}):\nP5: $${t.p5?.toFixed(0)} | P50: $${t.median?.toFixed(0)} | P95: $${t.p95?.toFixed(0)}\nProb of loss: ${(data.prob_loss * 100).toFixed(1)}% | Prob of double: ${(data.prob_double * 100).toFixed(1)}%`;
      callback?.({ text, content: data });
      return true;
    } catch (err: any) {
      callback?.({ text: `QuantOracle error: ${err.message}`, content: { error: err.message } });
      return false;
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Run a Monte Carlo: $100k, 8% return, 15% vol, 30 years" } },
      { user: "{{user2}}", content: { text: "Monte Carlo: P50: $764033, P95: $3079865", action: "QUANT_MONTE_CARLO_SIM" } },
    ],
  ],
};
