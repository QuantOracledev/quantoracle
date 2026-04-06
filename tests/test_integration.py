"""
QuantOracle Integration Test Suite
===================================
Hits every endpoint on the live API with realistic inputs,
validates HTTP 200 and checks response structure.

Usage:
    python tests/test_integration.py                     # test production
    python tests/test_integration.py http://localhost:8000  # test local

Catches: wrong param names, missing response fields, broken endpoints,
schema mismatches between docs and reality.
"""

import sys
import json
import time
import requests

API = sys.argv[1] if len(sys.argv) > 1 else "https://api.quantoracle.dev"

# Sample data reused across tests
PRICES = [100, 102, 101, 105, 103, 107, 106, 110, 108, 112,
          111, 115, 113, 117, 116, 120, 118, 122, 121, 125,
          123, 127, 126, 130, 128, 132, 131, 135, 133, 137,
          136, 140, 138, 142, 141, 145, 143, 147, 146, 150]

RETURNS = [0.02, -0.01, 0.04, -0.02, 0.04, -0.01, 0.04, -0.02, 0.04,
           -0.01, 0.04, -0.02, 0.04, -0.01, 0.04, -0.02, 0.04, -0.02,
           0.04, -0.01, 0.04, -0.02, 0.04, -0.02, 0.04, -0.01, 0.03,
           -0.01, 0.02, -0.01, 0.03, -0.02, 0.01, 0.02, -0.01, 0.03,
           -0.02, 0.04, -0.01, 0.02]

RETURNS_B = [0.01, -0.02, 0.03, -0.01, 0.02, -0.02, 0.03, -0.01, 0.02,
             -0.02, 0.03, -0.01, 0.02, -0.02, 0.03, -0.01, 0.02, -0.01,
             0.03, -0.02, 0.02, -0.01, 0.03, -0.01, 0.02, -0.02, 0.01,
             -0.01, 0.02, -0.02, 0.01, -0.01, 0.02, 0.01, -0.02, 0.03,
             -0.01, 0.02, -0.01, 0.01]

HIGH = [p + 2 for p in PRICES]
LOW = [p - 2 for p in PRICES]

passed = 0
failed = 0
errors = []


def test(name, path, payload, required_fields):
    """Call endpoint, check status and required fields in response."""
    global passed, failed
    try:
        r = requests.post(f"{API}{path}", json=payload, timeout=15)
        if r.status_code != 200:
            failed += 1
            err = f"FAIL {name}: HTTP {r.status_code} - {r.text[:200]}"
            errors.append(err)
            print(f"  X {name} - HTTP {r.status_code}")
            return None

        data = r.json()

        missing = []
        for field in required_fields:
            # Support nested field checks like "greeks.delta"
            parts = field.split(".")
            obj = data
            for part in parts:
                if isinstance(obj, dict) and part in obj:
                    obj = obj[part]
                else:
                    missing.append(field)
                    break

        if missing:
            failed += 1
            err = f"FAIL {name}: missing fields {missing}"
            errors.append(err)
            print(f"  X {name} - missing: {missing}")
        else:
            passed += 1
            ms = data.get("ms", "?")
            print(f"  OK {name} ({ms}ms)")

        return data

    except Exception as e:
        failed += 1
        err = f"FAIL {name}: {e}"
        errors.append(err)
        print(f"  X {name} - {e}")
        return None


# ═══════════════════════════════════════════════════════════════════
print(f"\nQuantOracle Integration Tests")
print(f"API: {API}")
print(f"{'=' * 60}\n")

# ── OPTIONS ───────────────────────────────────────────────────────
print("[Options]")

test("options/price (call)", "/v1/options/price",
     {"S": 100, "K": 105, "T": 0.25, "sigma": 0.2, "r": 0.05, "type": "call"},
     ["price", "greeks.delta", "greeks.gamma", "greeks.theta", "greeks.vega",
      "greeks.rho", "greeks.vanna", "greeks.charm", "greeks.volga", "greeks.speed",
      "intrinsic", "time_value", "d1", "d2", "ms"])

test("options/price (put)", "/v1/options/price",
     {"S": 100, "K": 95, "T": 0.5, "sigma": 0.3, "type": "put"},
     ["price", "greeks.delta", "ms"])

test("options/implied-vol", "/v1/options/implied-vol",
     {"S": 100, "K": 100, "T": 0.25, "market_price": 5.0, "type": "call"},
     ["implied_volatility", "annualized_pct", "model_price", "iterations", "ms"])

test("options/strategy", "/v1/options/strategy",
     {"legs": [
         {"type": "call", "K": 100, "premium": 5.0, "quantity": 1},
         {"type": "call", "K": 110, "premium": 2.0, "quantity": -1},
     ]},
     ["max_profit", "max_loss", "breakevens", "payoff_curve", "ms"])

test("options/payoff-diagram", "/v1/options/payoff-diagram",
     {"legs": [
         {"type": "call", "strike": 100, "premium": 5.0, "quantity": 1},
     ], "spot": 100},
     ["ms"])

# ── RISK ──────────────────────────────────────────────────────────
print("\n[Risk]")

test("risk/portfolio", "/v1/risk/portfolio",
     {"returns": RETURNS},
     ["returns", "risk", "risk.sharpe", "risk.sortino", "risk.max_drawdown",
      "risk.var_95", "risk.cvar_95", "distribution", "n", "ms"])

test("risk/kelly (discrete)", "/v1/risk/kelly",
     {"mode": "discrete", "win_rate": 0.55, "avg_win": 1.5, "avg_loss": 1.0},
     ["full_kelly", "half_kelly", "quarter_kelly", "edge", "ms"])

test("risk/kelly (continuous)", "/v1/risk/kelly",
     {"mode": "continuous", "returns": RETURNS},
     ["full_kelly_leverage", "half_kelly", "ms"])

test("risk/position-size", "/v1/risk/position-size",
     {"account_size": 100000, "entry_price": 50, "stop_loss": 47},
     ["ms"])

test("risk/drawdown", "/v1/risk/drawdown",
     {"equity_curve": [100, 105, 103, 110, 108, 115, 112, 120]},
     ["ms"])

test("risk/correlation", "/v1/risk/correlation",
     {"series": {"SPY": RETURNS, "QQQ": RETURNS_B}},
     ["ms"])

test("risk/var-parametric", "/v1/risk/var-parametric",
     {"returns": RETURNS},
     ["ms"])

test("risk/stress-test", "/v1/risk/stress-test",
     {"positions": [{"asset": "SPY", "value": 50000, "beta": 1.0},
                    {"asset": "TLT", "value": 30000, "duration": 17}],
      "scenarios": [{"name": "crash", "market_shock_pct": -20, "rate_shock_bps": -50}]},
     ["ms"])

test("risk/transaction-cost", "/v1/risk/transaction-cost",
     {"trade_value": 10000, "shares": 100, "spread_bps": 5},
     ["ms"])

# ── INDICATORS ────────────────────────────────────────────────────
print("\n[Indicators]")

test("indicators/technical", "/v1/indicators/technical",
     {"prices": PRICES},
     ["rsi", "sma", "ms"])

test("indicators/regime", "/v1/indicators/regime",
     {"prices": PRICES},
     ["trend", "vol_regime", "ms"])

test("indicators/crossover", "/v1/indicators/crossover",
     {"prices": PRICES, "fast": 5, "slow": 15},
     ["signal", "ms"])

test("indicators/bollinger-bands", "/v1/indicators/bollinger-bands",
     {"prices": PRICES, "window": 10, "num_std": 2},
     ["upper_band", "middle_band", "lower_band", "bandwidth", "ms"])

test("indicators/fibonacci-retracement", "/v1/indicators/fibonacci-retracement",
     {"swing_high": 150, "swing_low": 100},
     ["ms"])

test("indicators/atr", "/v1/indicators/atr",
     {"high": HIGH, "low": LOW, "close": PRICES, "period": 14},
     ["current_atr", "ms"])

# ── SIMULATE ──────────────────────────────────────────────────────
print("\n[Simulate]")

test("simulate/montecarlo", "/v1/simulate/montecarlo",
     {"initial_value": 100000, "annual_return": 0.10, "annual_vol": 0.20,
      "years": 1, "simulations": 100},
     ["terminal", "terminal.median", "terminal.p5", "terminal.p95", "ms"])

# ── FIXED INCOME ──────────────────────────────────────────────────
print("\n[Fixed Income]")

test("fixed-income/bond", "/v1/fixed-income/bond",
     {"coupon_rate": 0.05, "ytm": 0.04, "years": 10, "face": 1000, "frequency": 2},
     ["price", "ms"])

test("fixed-income/amortization", "/v1/fixed-income/amortization",
     {"principal": 300000, "annual_rate": 0.065, "years": 30},
     ["payment", "total_interest", "schedule", "ms"])

test("fi/yield-curve-interpolate", "/v1/fi/yield-curve-interpolate",
     {"tenors": [0.25, 0.5, 1, 2, 5, 10, 30],
      "rates": [0.04, 0.042, 0.045, 0.043, 0.04, 0.042, 0.045],
      "target_tenors": [3, 7, 20]},
     ["ms"])

test("fi/credit-spread", "/v1/fi/credit-spread",
     {"bond_price": 950, "coupon_rate": 0.05, "maturity_years": 5,
      "risk_free_curve": [{"tenor": 1, "rate": 0.04}, {"tenor": 5, "rate": 0.042},
                          {"tenor": 10, "rate": 0.045}]},
     ["ms"])

# ── PORTFOLIO ─────────────────────────────────────────────────────
print("\n[Portfolio]")

test("portfolio/optimize", "/v1/portfolio/optimize",
     {"returns": {"SPY": RETURNS, "TLT": RETURNS_B, "GLD": [r * 0.5 for r in RETURNS]}},
     ["weights", "ms"])

test("portfolio/risk-parity-weights", "/v1/portfolio/risk-parity-weights",
     {"volatilities": [0.15, 0.10, 0.20],
      "correlation_matrix": [[1, 0.3, 0.1], [0.3, 1, -0.2], [0.1, -0.2, 1]]},
     ["weights", "ms"])

# ── DERIVATIVES ───────────────────────────────────────────────────
print("\n[Derivatives]")

test("derivatives/binomial-tree", "/v1/derivatives/binomial-tree",
     {"S": 100, "K": 105, "T": 0.25, "sigma": 0.2, "steps": 50},
     ["price", "ms"])

test("derivatives/barrier-option", "/v1/derivatives/barrier-option",
     {"S": 100, "K": 105, "H": 90, "T": 0.5, "sigma": 0.25, "barrier_type": "down-out"},
     ["price", "ms"])

test("derivatives/asian-option", "/v1/derivatives/asian-option",
     {"S": 100, "K": 100, "T": 0.5, "sigma": 0.2, "observations": 12},
     ["price", "ms"])

test("derivatives/lookback-option", "/v1/derivatives/lookback-option",
     {"S": 100, "T": 0.5, "sigma": 0.25, "lookback_type": "floating", "type": "call"},
     ["price", "ms"])

test("derivatives/option-chain-analysis", "/v1/derivatives/option-chain-analysis",
     {"chain": [
         {"strike": 90, "call_bid": 12, "call_ask": 13, "put_bid": 0.5, "put_ask": 0.8,
          "call_oi": 1000, "put_oi": 500, "call_volume": 200, "put_volume": 100},
         {"strike": 100, "call_bid": 5, "call_ask": 6, "put_bid": 3, "put_ask": 4,
          "call_oi": 2000, "put_oi": 1500, "call_volume": 500, "put_volume": 400},
         {"strike": 110, "call_bid": 1, "call_ask": 1.5, "put_bid": 9, "put_ask": 10,
          "call_oi": 800, "put_oi": 2000, "call_volume": 150, "put_volume": 600},
     ], "spot": 100, "T": 0.0833},
     ["max_pain_strike", "ms"])

test("derivatives/put-call-parity", "/v1/derivatives/put-call-parity",
     {"call_price": 10, "put_price": 5, "S": 100, "K": 95, "T": 0.25, "r": 0.05},
     ["ms"])

test("derivatives/volatility-surface", "/v1/derivatives/volatility-surface",
     {"market_data": [
         {"strike": 90, "expiry_days": 30, "implied_vol": 0.25},
         {"strike": 100, "expiry_days": 30, "implied_vol": 0.20},
         {"strike": 110, "expiry_days": 30, "implied_vol": 0.22},
         {"strike": 90, "expiry_days": 60, "implied_vol": 0.24},
         {"strike": 100, "expiry_days": 60, "implied_vol": 0.19},
         {"strike": 110, "expiry_days": 60, "implied_vol": 0.21},
     ], "spot": 100},
     ["ms"])

# ── STATISTICS ────────────────────────────────────────────────────
print("\n[Statistics]")

x_data = list(range(1, len(RETURNS) + 1))

test("stats/linear-regression", "/v1/stats/linear-regression",
     {"x": x_data, "y": RETURNS},
     ["r_squared", "coefficients", "ms"])

test("stats/polynomial-regression", "/v1/stats/polynomial-regression",
     {"x": x_data, "y": RETURNS, "degree": 2},
     ["r_squared", "coefficients", "ms"])

test("stats/cointegration", "/v1/stats/cointegration",
     {"series_x": PRICES, "series_y": [p * 1.1 + 5 for p in PRICES]},
     ["cointegrated", "ms"])

test("stats/hurst-exponent", "/v1/stats/hurst-exponent",
     {"series": RETURNS},
     ["hurst_exponent", "ms"])

test("stats/garch-forecast", "/v1/stats/garch-forecast",
     {"returns": RETURNS},
     ["current_vol_annualized", "forecast_vol_annualized", "ms"])

test("stats/zscore", "/v1/stats/zscore",
     {"series": RETURNS},
     ["z_scores", "mean", "std_dev", "ms"])

test("stats/distribution-fit", "/v1/stats/distribution-fit",
     {"data": RETURNS},
     ["ms"])

test("stats/correlation-matrix", "/v1/stats/correlation-matrix",
     {"series": {"A": RETURNS, "B": RETURNS_B}},
     ["ms"])

test("stats/probabilistic-sharpe", "/v1/stats/probabilistic-sharpe",
     {"returns": RETURNS},
     ["probabilistic_sharpe_ratio", "sharpe_ratio", "ms"])

test("stats/realized-volatility", "/v1/stats/realized-volatility",
     {"close": PRICES},
     ["close_to_close", "ms"])

test("stats/normal-distribution", "/v1/stats/normal-distribution",
     {"x": 1.96, "mean": 0, "std": 1},
     ["cdf", "pdf", "ms"])

test("stats/sharpe-ratio", "/v1/stats/sharpe-ratio",
     {"returns": RETURNS},
     ["sharpe_ratio", "ms"])

# ── CRYPTO ────────────────────────────────────────────────────────
print("\n[Crypto]")

test("crypto/impermanent-loss", "/v1/crypto/impermanent-loss",
     {"current_price_ratio": 1.5},
     ["impermanent_loss_pct", "ms"])

test("crypto/apy-apr-convert", "/v1/crypto/apy-apr-convert",
     {"rate": 0.12, "from_type": "apr", "compounding": "daily"},
     ["ms"])

test("crypto/liquidation-price", "/v1/crypto/liquidation-price",
     {"entry_price": 3000, "collateral": 1000, "position_size": 10000,
      "leverage": 10, "direction": "long"},
     ["liquidation_price", "ms"])

test("crypto/funding-rate", "/v1/crypto/funding-rate",
     {"funding_rates": [{"rate": 0.0001}, {"rate": 0.0003}, {"rate": -0.0001},
                        {"rate": 0.0002}, {"rate": 0.0001}, {"rate": 0.0004}]},
     ["annualized_rate", "ms"])

test("crypto/dex-slippage", "/v1/crypto/dex-slippage",
     {"reserve_a": 1000000, "reserve_b": 1000000, "trade_amount": 10000},
     ["effective_price", "price_impact_pct", "ms"])

test("crypto/vesting-schedule", "/v1/crypto/vesting-schedule",
     {"total_tokens": 1000000, "tge_pct": 10, "cliff_months": 6, "vesting_months": 24},
     ["ms"])

test("crypto/rebalance-threshold", "/v1/crypto/rebalance-threshold",
     {"holdings": [
         {"asset": "BTC", "current_value": 60000, "target_weight": 0.5},
         {"asset": "ETH", "current_value": 30000, "target_weight": 0.3},
         {"asset": "USDC", "current_value": 10000, "target_weight": 0.2},
     ]},
     ["needs_rebalance", "ms"])

# ── FX ────────────────────────────────────────────────────────────
print("\n[FX]")

test("fx/interest-rate-parity", "/v1/fx/interest-rate-parity",
     {"spot_rate": 1.10, "domestic_rate": 0.05, "foreign_rate": 0.03},
     ["theoretical_forward", "ms"])

test("fx/purchasing-power-parity", "/v1/fx/purchasing-power-parity",
     {"base_spot_rate": 1.10, "domestic_inflation": 0.03, "foreign_inflation": 0.02},
     ["ppp_rate", "ms"])

test("fx/forward-rate", "/v1/fx/forward-rate",
     {"yield_curve": [{"tenor_years": 1, "spot_rate": 0.04},
                      {"tenor_years": 2, "spot_rate": 0.045},
                      {"tenor_years": 5, "spot_rate": 0.05}],
      "forward_start": 1, "forward_end": 2},
     ["forward_rate", "ms"])

test("fx/carry-trade", "/v1/fx/carry-trade",
     {"borrow_currency_rate": 0.01, "invest_currency_rate": 0.05,
      "spot_entry": 110, "spot_exit": 108, "holding_period_days": 90},
     ["carry_return_pct", "spot_return_pct", "total_return_pct", "ms"])

# ── MACRO ─────────────────────────────────────────────────────────
print("\n[Macro]")

test("macro/inflation-adjusted", "/v1/macro/inflation-adjusted",
     {"nominal_return_pct": 8, "inflation_rate_pct": 3},
     ["real_return_pct", "ms"])

test("macro/taylor-rule", "/v1/macro/taylor-rule",
     {"current_inflation": 3.5, "output_gap_pct": 1.0},
     ["prescribed_rate", "ms"])

test("macro/real-yield", "/v1/macro/real-yield",
     {"nominal_yield": 4.5, "tips_yield": 2.0},
     ["ms"])

# ── TVM ───────────────────────────────────────────────────────────
print("\n[Time Value of Money]")

test("tvm/present-value", "/v1/tvm/present-value",
     {"rate": 0.05, "periods": 10, "future_value": 1000},
     ["present_value", "ms"])

test("tvm/future-value", "/v1/tvm/future-value",
     {"rate": 0.05, "periods": 10, "present_value": 1000},
     ["future_value", "ms"])

test("tvm/irr", "/v1/tvm/irr",
     {"cash_flows": [-1000, 200, 300, 400, 500]},
     ["irr", "irr_pct", "ms"])

test("tvm/npv", "/v1/tvm/npv",
     {"cash_flows": [200, 300, 400, 500], "discount_rate": 0.10},
     ["npv", "ms"])

test("tvm/cagr", "/v1/tvm/cagr",
     {"start_value": 1000, "end_value": 1500, "years": 5},
     ["cagr", "cagr_pct", "ms"])


# ═══════════════════════════════════════════════════════════════════
print(f"\n{'=' * 60}")
print(f"  RESULTS: {passed} passed, {failed} failed, {passed + failed} total")
print(f"{'=' * 60}")

if errors:
    print(f"\n  FAILURES:")
    for e in errors:
        print(f"    {e}")

print()
sys.exit(1 if failed else 0)
