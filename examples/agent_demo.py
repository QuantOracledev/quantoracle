"""
QuantOracle Agent Demo
======================
An AI agent that analyzes options strategies using QuantOracle's
pay-per-call quant API. Shows how autonomous agents chain multiple
financial calculations to produce institutional-grade analysis.

Usage:
    pip install anthropic
    export ANTHROPIC_API_KEY=your_key
    python agent_demo.py "Analyze selling a 30-day covered call on ETH at $4000 strike, spot $3500, 60% vol"
"""

import sys
import json
import requests
import anthropic

API = "https://api.quantoracle.dev"

# ── QuantOracle tools the agent can call ─────────────────────────────────

TOOLS = [
    {
        "name": "options_price",
        "description": "Black-Scholes pricing with 10 Greeks (delta, gamma, theta, vega, rho, vanna, charm, volga, speed). Use for any option pricing or Greeks calculation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "S": {"type": "number", "description": "Spot price"},
                "K": {"type": "number", "description": "Strike price"},
                "T": {"type": "number", "description": "Time to expiry in years"},
                "sigma": {"type": "number", "description": "Volatility (e.g. 0.6 = 60%)"},
                "r": {"type": "number", "description": "Risk-free rate", "default": 0.05},
                "type": {"type": "string", "enum": ["call", "put"], "default": "call"},
            },
            "required": ["S", "K", "T", "sigma"],
        },
    },
    {
        "name": "options_strategy",
        "description": "Multi-leg options strategy analysis: P&L, breakevens, max profit/loss, payoff data.",
        "input_schema": {
            "type": "object",
            "properties": {
                "legs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string", "enum": ["call", "put"]},
                            "strike": {"type": "number"},
                            "premium": {"type": "number"},
                            "position": {"type": "string", "enum": ["long", "short"]},
                            "quantity": {"type": "integer", "default": 1},
                        },
                        "required": ["type", "strike", "premium", "position"],
                    },
                },
                "underlying_price": {"type": "number"},
            },
            "required": ["legs", "underlying_price"],
        },
    },
    {
        "name": "simulate_montecarlo",
        "description": "Monte Carlo simulation: GBM price paths with confidence intervals and terminal statistics.",
        "input_schema": {
            "type": "object",
            "properties": {
                "initial_value": {"type": "number", "description": "Starting portfolio value (e.g. 100000)"},
                "annual_return": {"type": "number", "description": "Expected annual return (e.g. 0.10 = 10%)"},
                "annual_vol": {"type": "number", "description": "Annual volatility (e.g. 0.20 = 20%)"},
                "years": {"type": "number", "description": "Time horizon in years"},
                "simulations": {"type": "integer", "description": "Number of paths", "default": 1000},
            },
            "required": ["initial_value", "annual_return", "annual_vol", "years"],
        },
    },
    {
        "name": "risk_portfolio",
        "description": "22 portfolio risk metrics from a returns series: Sharpe, Sortino, max drawdown, VaR, CVaR, and more.",
        "input_schema": {
            "type": "object",
            "properties": {
                "returns": {
                    "type": "array",
                    "items": {"type": "number"},
                    "description": "Array of period returns (e.g. daily)",
                },
            },
            "required": ["returns"],
        },
    },
    {
        "name": "risk_kelly",
        "description": "Kelly Criterion for optimal position sizing. Discrete mode (win_rate + avg_win/loss) or continuous mode (returns series).",
        "input_schema": {
            "type": "object",
            "properties": {
                "mode": {"type": "string", "enum": ["discrete", "continuous"]},
                "win_rate": {"type": "number", "description": "Probability of winning (0-1)"},
                "avg_win": {"type": "number", "description": "Average win amount"},
                "avg_loss": {"type": "number", "description": "Average loss amount (positive)"},
                "returns": {"type": "array", "items": {"type": "number"}},
            },
            "required": ["mode"],
        },
    },
    {
        "name": "stats_realized_volatility",
        "description": "Realized volatility: close-to-close, Parkinson, Garman-Klass, Yang-Zhang estimators.",
        "input_schema": {
            "type": "object",
            "properties": {
                "close": {
                    "type": "array",
                    "items": {"type": "number"},
                    "description": "Closing prices",
                },
            },
            "required": ["close"],
        },
    },
]

# Map tool names to API paths
TOOL_PATHS = {
    "options_price": "/v1/options/price",
    "options_strategy": "/v1/options/strategy",
    "simulate_montecarlo": "/v1/simulate/montecarlo",
    "risk_portfolio": "/v1/risk/portfolio",
    "risk_kelly": "/v1/risk/kelly",
    "stats_realized_volatility": "/v1/stats/realized-volatility",
}


def call_quantoracle(tool_name: str, args: dict) -> dict:
    """Call a QuantOracle endpoint and return the result."""
    path = TOOL_PATHS[tool_name]
    resp = requests.post(f"{API}{path}", json=args, timeout=10)
    resp.raise_for_status()
    return resp.json()


def run_agent(query: str):
    """Run the agent loop: Claude reasons, calls tools, produces analysis."""
    client = anthropic.Anthropic()

    messages = [{"role": "user", "content": query}]

    system = """You are a quantitative finance analyst powered by QuantOracle — 63 deterministic computation endpoints.

Your job: analyze the user's request by calling the right QuantOracle tools, then synthesize the results into a clear, actionable analysis. Chain multiple tool calls when needed.

Always include:
1. The key numbers (price, Greeks, risk metrics)
2. What the numbers mean in plain English
3. Risk/reward assessment
4. A recommendation

Be concise. Show your work through the tool calls, not verbose explanations."""

    print(f"\n{'='*60}")
    print(f"  QuantOracle Agent")
    print(f"{'='*60}")
    print(f"\n  Query: {query}\n")
    print(f"  Calling QuantOracle API...\n")

    # Agent loop
    while True:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=system,
            tools=TOOLS,
            messages=messages,
        )

        # Collect tool calls and results
        tool_results = []
        has_tool_use = False

        for block in response.content:
            if block.type == "text":
                print(block.text)
            elif block.type == "tool_use":
                has_tool_use = True
                print(f"  -> {block.name}({json.dumps(block.input, separators=(',', ':'))})")
                try:
                    result = call_quantoracle(block.name, block.input)
                    print(f"     OK")
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result),
                    })
                except Exception as e:
                    print(f"     Error: {e}")
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps({"error": str(e)}),
                        "is_error": True,
                    })

        if not has_tool_use:
            break

        # Feed results back to Claude
        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})

    print(f"\n{'='*60}\n")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        query = "Analyze selling a 30-day covered call on ETH at $4000 strike, current spot $3500, implied vol 60%. Include Greeks, P&L analysis, and a Monte Carlo projection."
    else:
        query = " ".join(sys.argv[1:])

    run_agent(query)
