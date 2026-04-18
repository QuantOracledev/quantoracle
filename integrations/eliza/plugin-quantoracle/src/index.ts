import type { Plugin } from "@elizaos/core";

import { optionsPriceAction } from "./actions/optionsPrice";
import { riskFullAnalysisAction } from "./actions/riskFullAnalysis";
import { backtestStrategyAction } from "./actions/backtestStrategy";
import { optionsStrategyOptimizerAction } from "./actions/optionsStrategyOptimizer";
import { hedgingRecommendAction } from "./actions/hedgingRecommend";
import { rebalancePlanAction } from "./actions/rebalancePlan";
import { portfolioOptimizeAction } from "./actions/portfolioOptimize";
import { monteCarloSimAction } from "./actions/monteCarloSim";
import { pairsSignalAction } from "./actions/pairsSignal";
import { impermanentLossAction } from "./actions/impermanentLoss";
import { liquidationPriceAction } from "./actions/liquidationPrice";

export const quantoraclePlugin: Plugin = {
  name: "quantoracle",
  description:
    "QuantOracle — 63 deterministic quant finance calculators + 10 composite workflows. Options pricing, Greeks, risk metrics, Monte Carlo, strategy backtests, rebalance planning, hedging. x402 USDC payments on Base or Solana; 1000 free calls/day.",
  actions: [
    optionsPriceAction,
    riskFullAnalysisAction,
    backtestStrategyAction,
    optionsStrategyOptimizerAction,
    hedgingRecommendAction,
    rebalancePlanAction,
    portfolioOptimizeAction,
    monteCarloSimAction,
    pairsSignalAction,
    impermanentLossAction,
    liquidationPriceAction,
  ],
  providers: [],
  evaluators: [],
};

export default quantoraclePlugin;
export { callQuantOracle } from "./client";
