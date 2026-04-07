import { formatGeneric } from "../format.js";

export default [
  {
    name: "fx irp",
    description: "Interest rate parity",
    endpoint: "/v1/fx/interest-rate-parity",
    flags: {
      spot:     { api: "spot_rate",      type: "number", required: true, desc: "Spot exchange rate" },
      domestic: { api: "domestic_rate",  type: "number", required: true, desc: "Domestic interest rate" },
      foreign:  { api: "foreign_rate",   type: "number", required: true, desc: "Foreign interest rate" },
      years:    { api: "time_years",     type: "number", required: false, desc: "Time in years (default 1)" },
    },
    format: (d) => formatGeneric("Interest Rate Parity", d),
  },
  {
    name: "fx ppp",
    description: "Purchasing power parity",
    endpoint: "/v1/fx/purchasing-power-parity",
    flags: {
      spot:              { api: "base_spot_rate",      type: "number", required: true, desc: "Base spot rate" },
      "domestic-inflation": { api: "domestic_inflation", type: "number", required: true, desc: "Domestic inflation" },
      "foreign-inflation":  { api: "foreign_inflation",  type: "number", required: true, desc: "Foreign inflation" },
    },
    format: (d) => formatGeneric("Purchasing Power Parity", d),
  },
  {
    name: "fx forward",
    description: "Forward rate bootstrap",
    endpoint: "/v1/fx/forward-rate",
    flags: {
      curve:   { api: "yield_curve",    type: "json",   required: true, desc: "Yield curve JSON [{tenor_years,spot_rate}]" },
      start:   { api: "forward_start",  type: "number", required: true, desc: "Forward start (years)" },
      end:     { api: "forward_end",    type: "number", required: true, desc: "Forward end (years)" },
    },
    format: (d) => formatGeneric("Forward Rate", d),
  },
  {
    name: "fx carry",
    description: "Carry trade P&L analysis",
    endpoint: "/v1/fx/carry-trade",
    flags: {
      "borrow-rate": { api: "borrow_currency_rate", type: "number", required: true, desc: "Borrow currency rate" },
      "invest-rate": { api: "invest_currency_rate", type: "number", required: true, desc: "Invest currency rate" },
      "spot-entry":  { api: "spot_entry",           type: "number", required: true, desc: "Entry spot rate" },
      "spot-exit":   { api: "spot_exit",            type: "number", required: true, desc: "Exit spot rate" },
      days:          { api: "holding_period_days",   type: "number", required: true, desc: "Holding period (days)" },
      notional:      { api: "notional",              type: "number", required: false, desc: "Notional (default 100000)" },
    },
    format: (d) => formatGeneric("Carry Trade", d),
  },
];
