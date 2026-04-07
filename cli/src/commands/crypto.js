import { formatGeneric } from "../format.js";

export default [
  {
    name: "crypto il",
    aliases: ["il"],
    description: "Impermanent loss calculator",
    endpoint: "/v1/crypto/impermanent-loss",
    flags: {
      ratio:   { api: "current_price_ratio",  type: "number", required: true,  desc: "Current price ratio" },
      invest:  { api: "initial_investment",    type: "number", required: false, desc: "Initial investment" },
      type:    { api: "amm_type",              type: "string", required: false, desc: "v2 or v3" },
    },
    format: (d) => formatGeneric("Impermanent Loss", d),
  },
  {
    name: "crypto apy",
    description: "APY/APR conversion",
    endpoint: "/v1/crypto/apy-apr-convert",
    flags: {
      rate:        { api: "rate",        type: "number", required: true,  desc: "Rate as decimal (0.12 = 12%)" },
      from:        { api: "from_type",   type: "string", required: false, desc: "apr or apy (default apr)" },
      compounding: { api: "compounding", type: "string", required: false, desc: "daily/weekly/monthly/continuous" },
    },
    format: (d) => formatGeneric("APY/APR", d),
  },
  {
    name: "crypto liquidation",
    aliases: ["liq"],
    description: "Liquidation price calculator",
    endpoint: "/v1/crypto/liquidation-price",
    flags: {
      entry:     { api: "entry_price",   type: "number", required: true, desc: "Entry price" },
      collateral: { api: "collateral",   type: "number", required: true, desc: "Collateral amount" },
      size:      { api: "position_size", type: "number", required: true, desc: "Position size" },
      leverage:  { api: "leverage",      type: "number", required: true, desc: "Leverage" },
      direction: { api: "direction",     type: "string", required: true, desc: "long or short" },
    },
    format: (d) => formatGeneric("Liquidation Price", d),
  },
  {
    name: "crypto funding",
    description: "Funding rate analysis",
    endpoint: "/v1/crypto/funding-rate",
    flags: {
      rates: { api: "funding_rates", type: "json", required: true, desc: 'Rates JSON [{"rate":0.0001}]' },
      size:  { api: "position_size", type: "number", required: false, desc: "Position size for P&L" },
    },
    format: (d) => formatGeneric("Funding Rate", d),
  },
  {
    name: "crypto slippage",
    description: "DEX slippage estimator",
    endpoint: "/v1/crypto/dex-slippage",
    flags: {
      "reserve-a": { api: "reserve_a",    type: "number", required: true, desc: "Reserve A" },
      "reserve-b": { api: "reserve_b",    type: "number", required: true, desc: "Reserve B" },
      amount:      { api: "trade_amount",  type: "number", required: true, desc: "Trade amount" },
    },
    format: (d) => formatGeneric("DEX Slippage", d),
  },
  {
    name: "crypto vesting",
    description: "Token vesting schedule",
    endpoint: "/v1/crypto/vesting-schedule",
    flags: {
      total: { api: "total_tokens",    type: "number", required: true,  desc: "Total tokens" },
      tge:   { api: "tge_pct",         type: "number", required: false, desc: "TGE unlock %" },
      cliff: { api: "cliff_months",    type: "number", required: false, desc: "Cliff months" },
      vest:  { api: "vesting_months",  type: "number", required: false, desc: "Vesting months" },
    },
    format: (d) => formatGeneric("Vesting Schedule", d),
  },
  {
    name: "crypto rebalance",
    description: "Portfolio rebalance analyzer",
    endpoint: "/v1/crypto/rebalance-threshold",
    flags: {
      holdings: { api: "holdings", type: "json", required: true, desc: 'Holdings JSON [{asset,current_value,target_weight}]' },
    },
    format: (d) => formatGeneric("Rebalance", d),
  },
];
