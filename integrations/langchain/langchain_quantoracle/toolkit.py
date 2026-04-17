"""QuantOracle toolkit for LangChain — auto-generates tools from OpenAPI spec."""

from __future__ import annotations

import json
from typing import Any, Optional

import requests
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field, create_model


DEFAULT_API_URL = "https://api.quantoracle.dev"

# Usage guidelines — tells agents WHEN to use each tool
USAGE_GUIDELINES: dict[str, str] = {
    "options_price": "Use for European option pricing and Greeks (delta, gamma, theta, vega, rho).",
    "options_implied_vol": "Use when you know market price and need implied volatility.",
    "options_strategy": "Use for multi-leg strategy P&L (spreads, straddles, condors).",
    "options_payoff_diagram": "Use for payoff/P&L data points for charting.",
    "risk_portfolio": "Use for 22 risk metrics from a returns series (Sharpe, Sortino, VaR, CVaR, drawdown).",
    "risk_kelly": "Use for optimal position sizing via Kelly Criterion.",
    "risk_position_size": "Use for fixed fractional position sizing.",
    "risk_drawdown": "Use for drawdown decomposition from returns.",
    "risk_correlation": "Use for N×N correlation matrix from return series.",
    "risk_var_parametric": "Use for Value-at-Risk and CVaR.",
    "risk_stress_test": "Use for multi-scenario portfolio stress testing.",
    "risk_transaction_cost": "Use for commission + spread + market impact estimation.",
    "indicators_technical": "Use for 13 technical indicators (SMA, EMA, RSI, MACD, Bollinger, etc.).",
    "indicators_regime": "Use for trend + volatility regime classification.",
    "indicators_crossover": "Use for moving average crossover detection.",
    "indicators_bollinger_bands": "Use for Bollinger Bands with squeeze detection.",
    "indicators_fibonacci_retracement": "Use for Fibonacci retracement and extension levels.",
    "indicators_atr": "Use for Average True Range and volatility regime.",
    "simulate_montecarlo": "Use for Monte Carlo simulation (up to 5,000 paths).",
    "portfolio_optimize": "Use for portfolio optimization (max Sharpe, min vol, risk parity).",
    "portfolio_risk_parity_weights": "Use for equal risk contribution weights.",
    "fixed_income_bond": "Use for bond pricing, duration, convexity, DV01.",
    "fixed_income_amortization": "Use for loan amortization schedules.",
    "stats_linear_regression": "Use for OLS regression with R², t-stats, confidence intervals.",
    "stats_cointegration": "Use for Engle-Granger cointegration test.",
    "stats_hurst_exponent": "Use for mean-reversion detection via R/S analysis.",
    "stats_garch_forecast": "Use for GARCH(1,1) volatility forecasting.",
    "stats_zscore": "Use for z-score computation and extreme detection.",
    "stats_distribution_fit": "Use for fitting data to standard distributions.",
    "stats_correlation_matrix": "Use for correlation matrix with eigenvalue decomposition.",
    "crypto_impermanent_loss": "Use for IL calculation on Uniswap v2/v3 positions.",
    "crypto_liquidation_price": "Use for leveraged position liquidation price.",
    "crypto_funding_rate": "Use for funding rate analysis and annualization.",
    "crypto_dex_slippage": "Use for AMM slippage estimation (x*y=k).",
    "fx_interest_rate_parity": "Use for covered/uncovered interest rate parity.",
    "fx_carry_trade": "Use for carry trade P&L decomposition.",
    "macro_taylor_rule": "Use for Taylor Rule interest rate prescription.",
    "macro_inflation_adjusted": "Use for nominal to real returns (Fisher equation).",
    "tvm_npv": "Use for net present value of cash flows.",
    "tvm_irr": "Use for internal rate of return.",
    "tvm_cagr": "Use for compound annual growth rate.",
    "options_spread_scan": "Use to scan and rank vertical spreads by risk/reward in one call. Paid only.",
    "indicators_regime_classify": "Use for combined regime classification (trend + vol + RSI). Paid only.",
    "risk_full_analysis": "Use for complete risk tearsheet in one call. Paid only.",
    "trade_evaluate": "Use for full trade evaluation with go/no-go verdict. Paid only.",
    "portfolio_health": "Use for portfolio health check (risk + correlation + stress test). Paid only.",
    "pairs_signal": "Use for pairs trading signal (cointegration + Hurst + z-score). Paid only.",
}


def _resolve_ref(schema: dict, components: dict) -> dict:
    """Resolve $ref pointers in OpenAPI schema."""
    if not schema:
        return schema
    if "$ref" in schema:
        ref_name = schema["$ref"].replace("#/components/schemas/", "")
        resolved = components.get(ref_name, schema)
        return _resolve_ref({**resolved}, components)
    result = {**schema}
    if "properties" in result:
        result["properties"] = {
            k: _resolve_ref(v, components)
            for k, v in schema["properties"].items()
        }
    if "items" in result:
        result["items"] = _resolve_ref(result["items"], components)
    if "anyOf" in result:
        non_null = [s for s in result["anyOf"] if s.get("type") != "null"]
        if len(non_null) == 1 and any(s.get("type") == "null" for s in result["anyOf"]):
            flat = _resolve_ref(non_null[0], components)
            if "description" in result:
                flat["description"] = result["description"]
            return flat
        result["anyOf"] = [_resolve_ref(s, components) for s in result["anyOf"]]
    return result


def _path_to_name(path: str) -> str:
    """Convert /v1/options/price to options_price."""
    return path.replace("/v1/", "").replace("/", "_").replace("-", "_")


_JSON_TO_PYTHON = {
    "string": str,
    "integer": int,
    "number": float,
    "boolean": bool,
}


def _build_pydantic_model(name: str, schema: dict) -> type[BaseModel]:
    """Build a Pydantic model from a resolved OpenAPI schema."""
    props = schema.get("properties", {})
    required = set(schema.get("required", []))
    fields: dict[str, Any] = {}

    for field_name, field_schema in props.items():
        field_type = field_schema.get("type", "string")
        description = field_schema.get("description", "")
        default = field_schema.get("default")

        if field_type == "array":
            item_type = field_schema.get("items", {}).get("type", "number")
            py_item = _JSON_TO_PYTHON.get(item_type, float)
            py_type: Any = list[py_item]  # type: ignore
        elif field_type == "object":
            py_type = dict
        else:
            py_type = _JSON_TO_PYTHON.get(field_type, str)

        if field_name not in required and default is not None:
            fields[field_name] = (Optional[py_type], Field(default=default, description=description))
        elif field_name not in required:
            fields[field_name] = (Optional[py_type], Field(default=None, description=description))
        else:
            fields[field_name] = (py_type, Field(description=description))

    return create_model(name, **fields)


def _make_tool(
    tool_name: str,
    path: str,
    description: str,
    input_model: type[BaseModel],
    api_url: str,
    timeout: int,
) -> StructuredTool:
    """Create a StructuredTool that calls a QuantOracle endpoint."""

    def _call(**kwargs: Any) -> str:
        resp = requests.post(
            f"{api_url}{path}",
            json=kwargs,
            timeout=timeout,
            headers={
                "User-Agent": "langchain-quantoracle/0.1.0",
                "X-Source": "langchain",
            },
        )
        resp.raise_for_status()
        return json.dumps(resp.json())

    return StructuredTool.from_function(
        func=_call,
        name=tool_name,
        description=description,
        args_schema=input_model,
    )


class QuantOracleToolkit:
    """Toolkit that auto-generates LangChain tools from the QuantOracle OpenAPI spec.

    Usage:
        from langchain_quantoracle import QuantOracleToolkit

        # All tools
        tools = QuantOracleToolkit().get_tools()

        # Filter by category
        tools = QuantOracleToolkit(categories=["options", "risk"]).get_tools()

        # Custom backend
        tools = QuantOracleToolkit(api_url="http://localhost:8000").get_tools()
    """

    def __init__(
        self,
        api_url: str = DEFAULT_API_URL,
        categories: Optional[list[str]] = None,
        timeout: int = 30,
    ):
        self.api_url = api_url.rstrip("/")
        self.categories = categories
        self.timeout = timeout
        self._tools: Optional[list[StructuredTool]] = None

    def get_tools(self) -> list[StructuredTool]:
        """Fetch OpenAPI spec and generate tools. Cached after first call."""
        if self._tools is not None:
            return self._tools

        resp = requests.get(f"{self.api_url}/openapi.json", timeout=self.timeout)
        resp.raise_for_status()
        spec = resp.json()
        schemas = spec.get("components", {}).get("schemas", {})

        tools: list[StructuredTool] = []
        for path, methods in spec.get("paths", {}).items():
            if not path.startswith("/v1/"):
                continue
            post_op = methods.get("post")
            if not post_op:
                continue

            # Category filter
            if self.categories:
                category = path.split("/")[2]  # /v1/{category}/...
                if category not in self.categories:
                    continue

            tool_name = _path_to_name(path)
            raw_schema = (
                post_op.get("requestBody", {})
                .get("content", {})
                .get("application/json", {})
                .get("schema", {})
            )
            if not raw_schema:
                continue

            resolved = _resolve_ref(raw_schema, schemas)
            resolved.pop("title", None)

            model_name = "".join(
                w.capitalize() for w in tool_name.split("_")
            ) + "Input"
            input_model = _build_pydantic_model(model_name, resolved)

            base_desc = post_op.get("description") or post_op.get("summary") or tool_name
            guideline = USAGE_GUIDELINES.get(tool_name, "")
            description = f"{base_desc} {guideline}".strip()

            tools.append(
                _make_tool(tool_name, path, description, input_model, self.api_url, self.timeout)
            )

        self._tools = tools
        return tools


def get_tools(
    api_url: str = DEFAULT_API_URL,
    categories: Optional[list[str]] = None,
) -> list[StructuredTool]:
    """Convenience function to get QuantOracle tools.

    Args:
        api_url: QuantOracle API base URL.
        categories: Filter by category (e.g., ["options", "risk"]).

    Returns:
        List of LangChain StructuredTool instances.
    """
    return QuantOracleToolkit(api_url=api_url, categories=categories).get_tools()
