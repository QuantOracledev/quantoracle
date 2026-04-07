import { formatGeneric } from "../format.js";

export default [
  {
    name: "tvm pv",
    description: "Present value calculator",
    endpoint: "/v1/tvm/present-value",
    flags: {
      rate:    { api: "rate",           type: "number", required: true, desc: "Discount rate per period" },
      periods: { api: "periods",        type: "number", required: true, desc: "Number of periods" },
      fv:      { api: "future_value",   type: "number", required: false, desc: "Future value" },
      pmt:     { api: "payment",        type: "number", required: false, desc: "Periodic payment" },
    },
    format: (d) => formatGeneric("Present Value", d),
  },
  {
    name: "tvm fv",
    description: "Future value calculator",
    endpoint: "/v1/tvm/future-value",
    flags: {
      rate:    { api: "rate",           type: "number", required: true, desc: "Rate per period" },
      periods: { api: "periods",        type: "number", required: true, desc: "Number of periods" },
      pv:      { api: "present_value",  type: "number", required: false, desc: "Present value" },
      pmt:     { api: "payment",        type: "number", required: false, desc: "Periodic payment" },
    },
    format: (d) => formatGeneric("Future Value", d),
  },
  {
    name: "tvm irr",
    aliases: ["irr"],
    description: "Internal rate of return",
    endpoint: "/v1/tvm/irr",
    flags: {
      cashflows: { api: "cash_flows", type: "data", required: true, desc: "Cash flows (first negative)" },
    },
    format: (d) => formatGeneric("IRR", d),
  },
  {
    name: "tvm npv",
    description: "Net present value",
    endpoint: "/v1/tvm/npv",
    flags: {
      cashflows: { api: "cash_flows",    type: "data",   required: true, desc: "Future cash flows" },
      rate:      { api: "discount_rate", type: "number", required: true, desc: "Discount rate" },
    },
    format: (d) => formatGeneric("NPV", d),
  },
  {
    name: "tvm cagr",
    aliases: ["cagr"],
    description: "Compound annual growth rate",
    endpoint: "/v1/tvm/cagr",
    flags: {
      start: { api: "start_value", type: "number", required: true, desc: "Starting value" },
      end:   { api: "end_value",   type: "number", required: true, desc: "Ending value" },
      years: { api: "years",       type: "number", required: true, desc: "Number of years" },
    },
    format: (d) => formatGeneric("CAGR", d),
  },
];
