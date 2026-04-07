import { formatOptimize, formatGeneric } from "../format.js";

export default [
  {
    name: "portfolio optimize",
    aliases: ["optimize"],
    description: "Mean-variance portfolio optimization",
    endpoint: "/v1/portfolio/optimize",
    flags: {
      file: { api: "_file", type: "csv",    required: true,  desc: "CSV with asset return columns" },
      mode: { api: "mode",  type: "string", required: false, desc: "max_sharpe, min_vol, or risk_parity" },
      rf:   { api: "risk_free_rate", type: "number", required: false, desc: "Risk-free rate" },
    },
    buildPayload(flags) {
      const payload = { returns: flags._file };
      if (flags.mode) payload.mode = flags.mode;
      if (flags.rf) payload.risk_free_rate = flags.rf;
      return payload;
    },
    format: formatOptimize,
  },
  {
    name: "portfolio riskparity",
    description: "Risk parity weights",
    endpoint: "/v1/portfolio/risk-parity-weights",
    flags: {
      vols:   { api: "volatilities",       type: "data", required: true, desc: "Asset volatilities" },
      corr:   { api: "correlation_matrix", type: "json", required: true, desc: "Correlation matrix JSON" },
      names:  { api: "asset_names",        type: "json", required: false, desc: "Asset names JSON" },
    },
    format: (d) => formatGeneric("Risk Parity", d),
  },
];
