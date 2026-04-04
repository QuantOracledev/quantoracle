"""Test all 53 QuantOracle endpoints. Usage: python tests/test_all.py [base_url]"""
import requests, sys, json

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
HEADERS = {}  # Add {"X-Api-Key": "your-key"} if auth is enabled

tests = [
    # Health + discovery
    ("GET",  "/health", None),
    ("GET",  "/tools", None),
    # Original 15
    ("POST", "/v1/options/price", {"S": 185, "K": 190, "T": 0.25, "sigma": 0.25}),
    ("POST", "/v1/options/implied-vol", {"S": 185, "K": 190, "T": 0.25, "market_price": 5.5}),
    ("POST", "/v1/options/strategy", {"legs": [{"type": "call", "K": 190, "premium": 5.5, "quantity": 1}]}),
    ("POST", "/v1/risk/portfolio", {"returns": [0.01, -0.005, 0.008, -0.012, 0.015, 0.003, -0.007, 0.011, -0.002, 0.006, -0.009, 0.013, -0.004, 0.007]}),
    ("POST", "/v1/risk/kelly", {"mode": "discrete", "win_rate": 0.55, "avg_win": 120, "avg_loss": 100}),
    ("POST", "/v1/risk/position-size", {"account_size": 80000, "entry_price": 185, "stop_loss": 178}),
    ("POST", "/v1/risk/drawdown", {"equity_curve": [100, 102, 105, 103, 98, 95, 92, 96, 99, 101]}),
    ("POST", "/v1/risk/correlation", {"series": {"A": [0.01, -0.005, 0.008, -0.012, 0.015], "B": [0.012, -0.008, 0.01, -0.015, 0.018]}}),
    ("POST", "/v1/indicators/technical", {"prices": [180, 182, 181, 183, 185, 184, 186, 188, 187, 189, 191, 190, 192, 188, 186]}),
    ("POST", "/v1/indicators/regime", {"prices": [float(180 + i * 0.3) for i in range(50)]}),
    ("POST", "/v1/indicators/crossover", {"prices": [float(150 + i * 0.5) for i in range(60)]}),
    ("POST", "/v1/simulate/montecarlo", {"initial_value": 100000, "annual_return": 0.10, "annual_vol": 0.20, "years": 3, "simulations": 100}),
    ("POST", "/v1/fixed-income/bond", {"coupon_rate": 0.05, "ytm": 0.04, "years": 10}),
    ("POST", "/v1/fixed-income/amortization", {"principal": 350000, "annual_rate": 0.065, "years": 30}),
    ("POST", "/v1/portfolio/optimize", {"returns": {"SPY": [0.01, -0.005, 0.008, -0.012, 0.015, 0.003, -0.007, 0.011], "TLT": [-0.002, 0.004, -0.001, 0.006, -0.003, 0.001, 0.005, -0.002]}, "mode": "risk_parity"}),
    # Derivatives expanded
    ("POST", "/v1/derivatives/binomial-tree", {"S": 100, "K": 105, "T": 0.5, "sigma": 0.25, "exercise": "american", "type": "put", "steps": 50}),
    ("POST", "/v1/derivatives/barrier-option", {"S": 100, "K": 95, "H": 80, "T": 0.5, "sigma": 0.25, "barrier_type": "down-out", "type": "call"}),
    ("POST", "/v1/derivatives/asian-option", {"S": 100, "K": 100, "T": 1, "sigma": 0.2, "averaging": "geometric", "observations": 12}),
    ("POST", "/v1/derivatives/lookback-option", {"S": 100, "T": 0.5, "sigma": 0.3, "type": "call", "lookback_type": "floating"}),
    ("POST", "/v1/derivatives/option-chain-analysis", {"chain": [{"strike": 90, "call_bid": 12, "call_ask": 13, "put_bid": 0.5, "put_ask": 0.8, "call_oi": 500, "put_oi": 200, "call_volume": 100, "put_volume": 50}, {"strike": 100, "call_bid": 5, "call_ask": 6, "put_bid": 3, "put_ask": 4, "call_oi": 1000, "put_oi": 800, "call_volume": 300, "put_volume": 250}, {"strike": 110, "call_bid": 1, "call_ask": 1.5, "put_bid": 9, "put_ask": 10, "call_oi": 300, "put_oi": 600, "call_volume": 80, "put_volume": 200}], "spot": 100}),
    ("POST", "/v1/derivatives/put-call-parity", {"call_price": 5.5, "put_price": 3.2, "S": 100, "K": 100, "T": 0.5, "r": 0.05}),
    ("POST", "/v1/derivatives/volatility-surface", {"market_data": [{"strike": 90, "expiry_days": 30, "implied_vol": 0.28}, {"strike": 100, "expiry_days": 30, "implied_vol": 0.22}, {"strike": 110, "expiry_days": 30, "implied_vol": 0.25}, {"strike": 90, "expiry_days": 60, "implied_vol": 0.27}, {"strike": 100, "expiry_days": 60, "implied_vol": 0.21}, {"strike": 110, "expiry_days": 60, "implied_vol": 0.24}], "spot": 100}),
    # Statistics
    ("POST", "/v1/stats/linear-regression", {"x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "y": [2.1, 4.0, 5.9, 8.1, 10.0, 11.9, 14.1, 16.0, 17.9, 20.1]}),
    ("POST", "/v1/stats/polynomial-regression", {"x": [1, 2, 3, 4, 5, 6, 7, 8], "y": [1, 4, 9, 16, 25, 36, 49, 64], "degree": 2}),
    ("POST", "/v1/stats/cointegration", {"series_x": [float(100 + i * 0.5 + (i % 3) * 0.2) for i in range(50)], "series_y": [float(200 + i * 1.0 + (i % 3) * 0.3) for i in range(50)]}),
    ("POST", "/v1/stats/hurst-exponent", {"series": [float(100 + i * 0.1 + ((-1) ** i) * 0.5) for i in range(100)]}),
    ("POST", "/v1/stats/garch-forecast", {"returns": [0.01 * ((-1) ** i) + 0.002 * (i % 5) for i in range(60)], "forecast_periods": 5}),
    ("POST", "/v1/stats/zscore", {"series": [10, 12, 11, 13, 15, 14, 12, 11, 30, 13, 14], "threshold": 2.0}),
    ("POST", "/v1/stats/distribution-fit", {"data": [2.1, 3.5, 2.8, 3.1, 2.9, 3.3, 2.7, 3.0, 2.6, 3.2, 2.4, 3.4, 2.5, 3.6, 2.3]}),
    ("POST", "/v1/stats/correlation-matrix", {"series": {"SPY": [0.01, -0.005, 0.008, -0.012, 0.015], "QQQ": [0.012, -0.008, 0.01, -0.015, 0.018], "TLT": [-0.003, 0.006, -0.002, 0.008, -0.005]}, "method": "pearson", "include_eigenvalues": True}),
    # Crypto
    ("POST", "/v1/crypto/impermanent-loss", {"current_price_ratio": 1.5, "initial_investment": 10000}),
    ("POST", "/v1/crypto/apy-apr-convert", {"rate": 0.12, "from_type": "apr", "compounding": "daily"}),
    ("POST", "/v1/crypto/liquidation-price", {"entry_price": 50000, "collateral": 5000, "position_size": 50000, "leverage": 10, "direction": "long"}),
    ("POST", "/v1/crypto/funding-rate", {"funding_rates": [{"rate": 0.0001}, {"rate": 0.00015}, {"rate": -0.00005}, {"rate": 0.0002}, {"rate": 0.00012}]}),
    ("POST", "/v1/crypto/dex-slippage", {"reserve_a": 1000000, "reserve_b": 2000000, "trade_amount": 10000}),
    ("POST", "/v1/crypto/vesting-schedule", {"total_tokens": 1000000, "tge_pct": 10, "cliff_months": 6, "vesting_months": 24}),
    ("POST", "/v1/crypto/rebalance-threshold", {"holdings": [{"asset": "BTC", "current_value": 6000, "target_weight": 50}, {"asset": "ETH", "current_value": 3000, "target_weight": 30}, {"asset": "USDC", "current_value": 1000, "target_weight": 20}]}),
    # FX / Macro
    ("POST", "/v1/fx/interest-rate-parity", {"spot_rate": 1.10, "domestic_rate": 0.05, "foreign_rate": 0.03}),
    ("POST", "/v1/fx/purchasing-power-parity", {"base_spot_rate": 1.10, "domestic_inflation": 0.03, "foreign_inflation": 0.02}),
    ("POST", "/v1/fx/forward-rate", {"yield_curve": [{"tenor_years": 0.25, "spot_rate": 0.04}, {"tenor_years": 1, "spot_rate": 0.045}, {"tenor_years": 2, "spot_rate": 0.05}, {"tenor_years": 5, "spot_rate": 0.055}], "forward_start": 1, "forward_end": 2}),
    ("POST", "/v1/fx/carry-trade", {"borrow_currency_rate": 0.01, "invest_currency_rate": 0.08, "spot_entry": 150, "spot_exit": 148, "holding_period_days": 90}),
    ("POST", "/v1/macro/inflation-adjusted", {"nominal_return_pct": 10, "inflation_rate_pct": 3, "periods": 10, "initial_value": 100000}),
    ("POST", "/v1/macro/taylor-rule", {"current_inflation": 3.5, "target_inflation": 2.0, "output_gap_pct": 1.0, "current_policy_rate": 5.25}),
    ("POST", "/v1/macro/real-yield", {"nominal_yield": 4.5, "tips_yield": 2.0, "tenor_years": 10}),
    # Additional
    ("POST", "/v1/risk/var-parametric", {"returns": [0.01, -0.005, 0.008, -0.012, 0.015, 0.003, -0.007, 0.011, -0.002, 0.006, -0.009, 0.013, -0.004, 0.007], "portfolio_value": 1000000}),
    ("POST", "/v1/risk/stress-test", {"positions": [{"asset": "Equities", "value": 600000, "beta": 1.2}, {"asset": "Bonds", "value": 300000, "duration": 7}, {"asset": "Cash", "value": 100000, "beta": 0}], "scenarios": [{"name": "2008 Crisis", "market_shock_pct": -40, "rate_shock_bps": -200}, {"name": "Rate Hike", "market_shock_pct": -10, "rate_shock_bps": 200}]}),
    ("POST", "/v1/options/payoff-diagram", {"legs": [{"type": "call", "strike": 100, "premium": 5, "quantity": 1, "direction": "long"}, {"type": "call", "strike": 110, "premium": 2, "quantity": 1, "direction": "short"}], "spot": 105}),
    ("POST", "/v1/fi/yield-curve-interpolate", {"tenors": [0.25, 0.5, 1, 2, 5, 10, 30], "rates": [4.8, 4.7, 4.5, 4.3, 4.1, 4.2, 4.5], "target_tenors": [0.75, 3, 7, 20], "method": "cubic"}),
    ("POST", "/v1/fi/credit-spread", {"bond_price": 950, "coupon_rate": 0.05, "maturity_years": 5, "risk_free_curve": [{"tenor": 1, "rate": 0.04}, {"tenor": 2, "rate": 0.042}, {"tenor": 5, "rate": 0.045}, {"tenor": 10, "rate": 0.048}]}),
    ("POST", "/v1/indicators/bollinger-bands", {"prices": [180, 182, 181, 183, 185, 184, 186, 188, 187, 189, 191, 190, 192, 188, 186, 184, 185, 187, 189, 191]}),
    ("POST", "/v1/indicators/fibonacci-retracement", {"swing_high": 200, "swing_low": 150, "direction": "up"}),
    ("POST", "/v1/indicators/atr", {"high": [185, 187, 186, 188, 190, 189, 191, 193, 192, 194], "low": [180, 182, 181, 183, 185, 184, 186, 188, 187, 189], "close": [183, 185, 184, 186, 188, 187, 189, 191, 190, 192]}),
    ("POST", "/v1/portfolio/risk-parity-weights", {"volatilities": [0.15, 0.20, 0.05], "correlation_matrix": [[1, 0.6, -0.2], [0.6, 1, -0.1], [-0.2, -0.1, 1]], "asset_names": ["SPY", "QQQ", "TLT"]}),
]

print(f"\nTesting {BASE}\n{'=' * 60}")
ok = fail = 0
for method, path, body in tests:
    try:
        r = requests.request(method, f"{BASE}{path}", json=body, headers=HEADERS, timeout=30)
        if r.status_code == 200:
            ok += 1
            data = r.json()
            ms = data.get("ms", "?")
            print(f"  OK  {method:4} {path:45} {ms}ms")
        else:
            fail += 1
            detail = ""
            try:
                detail = r.json().get("detail", "")[:60]
            except Exception:
                detail = r.text[:60]
            print(f"  FAIL {method:4} {path:45} {r.status_code} {detail}")
    except Exception as e:
        fail += 1
        print(f"  ERR  {method:4} {path:45} {e}")

print(f"\n{'=' * 60}")
print(f"  {ok} passed, {fail} failed out of {ok + fail} tests")
print(f"{'=' * 60}\n")
sys.exit(1 if fail else 0)
