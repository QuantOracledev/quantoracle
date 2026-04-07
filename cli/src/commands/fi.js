import { formatBond, formatGeneric } from "../format.js";

export default [
  {
    name: "fi bond",
    aliases: ["bond"],
    description: "Bond pricing, duration, convexity",
    endpoint: "/v1/fixed-income/bond",
    flags: {
      coupon: { api: "coupon_rate", type: "number", required: true,  desc: "Annual coupon rate" },
      ytm:    { api: "ytm",        type: "number", required: true,  desc: "Yield to maturity" },
      years:  { api: "years",      type: "number", required: true,  desc: "Years to maturity" },
      face:   { api: "face",       type: "number", required: false, desc: "Face value (default 1000)" },
      freq:   { api: "frequency",  type: "number", required: false, desc: "Coupon frequency (default 2)" },
    },
    format: formatBond,
  },
  {
    name: "fi amort",
    aliases: ["amort"],
    description: "Amortization schedule",
    endpoint: "/v1/fixed-income/amortization",
    flags: {
      principal: { api: "principal",     type: "number", required: true,  desc: "Loan amount" },
      rate:      { api: "annual_rate",   type: "number", required: true,  desc: "Annual rate" },
      years:     { api: "years",         type: "number", required: true,  desc: "Loan term (years)" },
      extra:     { api: "extra_payment", type: "number", required: false, desc: "Extra payment per period" },
    },
    format: (d) => formatGeneric("Amortization", d),
  },
  {
    name: "fi yieldcurve",
    description: "Yield curve interpolation",
    endpoint: "/v1/fi/yield-curve-interpolate",
    flags: {
      tenors:  { api: "tenors",        type: "data", required: true, desc: "Known tenors" },
      rates:   { api: "rates",         type: "data", required: true, desc: "Known rates" },
      targets: { api: "target_tenors", type: "data", required: true, desc: "Target tenors to interpolate" },
    },
    format: (d) => formatGeneric("Yield Curve", d),
  },
  {
    name: "fi credit",
    description: "Credit spread analysis",
    endpoint: "/v1/fi/credit-spread",
    flags: {
      "bond-price": { api: "bond_price",      type: "number", required: true, desc: "Bond price" },
      coupon:       { api: "coupon_rate",      type: "number", required: true, desc: "Coupon rate" },
      years:        { api: "maturity_years",   type: "number", required: true, desc: "Years to maturity" },
      curve:        { api: "risk_free_curve",  type: "json",   required: true, desc: "Risk-free curve JSON [{tenor,rate}]" },
    },
    format: (d) => formatGeneric("Credit Spread", d),
  },
];
