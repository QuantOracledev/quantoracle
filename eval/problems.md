# Quantitative computation problems

Conventions used throughout (assume these unless an input says otherwise):
- INPUT rates, volatilities and yields are DECIMALS, not percents (0.20 means 20%).
- OUTPUT scaling follows the requested field's name:
    * a field ending in `_pct` is in PERCENTAGE POINTS  (12.747 means 12.747%)
    * a field ending in `_bps` is in BASIS POINTS        (100.0 means 100bps)
    * every other field is a plain decimal / currency amount
- Time `T` and maturities are in YEARS. Periods `n` are in the unit implied by the rate.
- Volatility is annualised. Returns series are simple periodic returns unless named otherwise.
- Option pricing is Black-Scholes-Merton, European exercise, continuous compounding,
  with `q` the continuous dividend yield (0 if absent).
- Dotted paths index into nested output: `greeks.delta` is the `delta` key inside the
  `greeks` object; `coefficients.0` is the first element of the `coefficients` array;
  `retracement_levels.50.0%` is the key "50.0%" inside `retracement_levels`.
- Give the raw numeric value and do not round beyond what the calculation warrants.

If a unit convention still seems ambiguous, state your assumption and answer anyway —
answers that are numerically right but scaled by 100 are scored separately from wrong ones,
so an honest attempt is never worse than a null.

Answer every problem. Show whatever working you like, but end with a single
JSON object mapping each problem id to your numeric answer, e.g.
`{"P001": 4.76, "P002": 0.7791}`. Use `null` if you cannot compute one.

## P001  [Crypto]
```
Compute: crypto / impermanent loss
Definition: Impermanent loss calculator for Uniswap v2/v3 AMM positions.
Inputs (JSON): {"current_price_ratio": 2.0, "initial_investment": 10000, "initial_price_ratio": 1.0}
Return this value: impermanent_loss_pct
```

## P002  [Crypto]
```
Compute: crypto / impermanent loss
Definition: Impermanent loss calculator for Uniswap v2/v3 AMM positions.
Inputs (JSON): {"current_price_ratio": 0.5, "initial_investment": 10000, "initial_price_ratio": 1.0}
Return this value: impermanent_loss_pct
```

## P003  [Crypto]
```
Compute: crypto / apy apr convert
Definition: Convert between APY and APR with configurable compounding frequency.
Inputs (JSON): {"compounding": "daily", "from_type": "apr", "rate": 0.12}
Return this value: apy_pct
```

## P004  [Crypto]
```
Compute: crypto / apy apr convert
Definition: Convert between APY and APR with configurable compounding frequency.
Inputs (JSON): {"compounding": "continuous", "from_type": "apr", "rate": 0.1}
Return this value: apy_pct
```

## P005  [Crypto]
```
Compute: crypto / liquidation price
Definition: Liquidation price calculator for leveraged positions.
Inputs (JSON): {"collateral": 5000, "direction": "long", "entry_price": 50000, "leverage": 10, "maintenance_margin_rate": 0.005, "position_size": 50000}
Return this value: liquidation_price
```

## P006  [Crypto]
```
Compute: crypto / dex slippage
Definition: DEX slippage estimator for constant-product AMM (x*y=k).
Inputs (JSON): {"fee_bps": 30, "reserve_a": 1000, "reserve_b": 1000, "trade_amount": 100, "trade_direction": "a_to_b"}
Return this value: price_impact_pct
```

## P007  [Derivatives]
```
Compute: derivatives / binomial tree
Definition: CRR binomial tree pricing for American and European options.
Inputs (JSON): {"K": 40, "S": 42, "T": 0.5, "exercise": "european", "r": 0.1, "sigma": 0.2, "steps": 500, "type": "call"}
Return this value: price
```

## P008  [Derivatives]
```
Compute: derivatives / asian option
Definition: Asian option pricing: geometric closed-form or arithmetic approximation.
Inputs (JSON): {"K": 100, "S": 100, "T": 1.0, "averaging": "geometric", "observations": 12, "r": 0.05, "sigma": 0.2}
Return this value: price
```

## P009  [Derivatives]
```
Compute: derivatives / asian option
Definition: Asian option pricing: geometric closed-form or arithmetic approximation.
Inputs (JSON): {"K": 100, "S": 100, "T": 1.0, "averaging": "geometric", "observations": 12, "r": 0.05, "sigma": 0.2}
Return this value: geometric_price
```

## P010  [Derivatives]
```
Compute: derivatives / put call parity
Definition: Put-call parity check and arbitrage detection.
Inputs (JSON): {"K": 100, "S": 100, "T": 1.0, "call_price": 10.45, "put_price": 5.57, "r": 0.05}
Return this value: deviation
```

## P011  [Derivatives]
```
Compute: derivatives / lookback option
Definition: Lookback option pricing (floating/fixed strike).
Inputs (JSON): {"S": 100, "T": 0.5, "lookback_type": "floating", "r": 0.05, "sigma": 0.3, "type": "call"}
Return this value: price
```

## P012  [Derivatives]
```
Compute: derivatives / option chain analysis
Definition: Option chain analytics: skew, max pain, put-call ratios.
Inputs (JSON): {"chain": [{"call_ask": 8, "call_bid": 7, "call_oi": 500, "call_volume": 200, "put_ask": 1.0, "put_bid": 0.5, "put_oi": 200, "put_volume": 100, "strike": 95}, {"call_ask": 5, "call_bid": 4, "call_oi": 1000, "call_volume": 400, "put_ask": 4, "put_bid": 3, "put_oi": 800, "put_volume": 200, "strike": 100}, {"call_ask": 2, "call_bid": 1, "call_oi": 300, "call_volume": 100, "put_ask": 8, "put_bid": 7, "put_oi": 600, "put_volume": 200, "strike": 105}], "spot": 100}
Return this value: put_call_ratio_volume
```

## P013  [FX/Macro]
```
Compute: fx / interest rate parity
Definition: Interest rate parity calculator with arbitrage detection.
Inputs (JSON): {"domestic_rate": 0.05, "foreign_rate": 0.03, "spot_rate": 1.1, "time_years": 1}
Return this value: theoretical_forward
```

## P014  [FX/Macro]
```
Compute: fx / purchasing power parity
Definition: Purchasing power parity fair value estimation.
Inputs (JSON): {"base_spot_rate": 1.2, "domestic_inflation": 0.03, "foreign_inflation": 0.02, "time_years": 1}
Return this value: ppp_rate
```

## P015  [FX/Macro]
```
Compute: fx / carry trade
Definition: Currency carry trade P&L decomposition.
Inputs (JSON): {"borrow_currency_rate": 0.01, "holding_period_days": 90, "invest_currency_rate": 0.08, "spot_entry": 150, "spot_exit": 148}
Return this value: carry_return_pct
```

## P016  [FX/Macro]
```
Compute: fx / carry trade
Definition: Currency carry trade P&L decomposition.
Inputs (JSON): {"borrow_currency_rate": 0.01, "holding_period_days": 90, "invest_currency_rate": 0.08, "spot_entry": 150, "spot_exit": 148}
Return this value: spot_return_pct
```

## P017  [FX/Macro]
```
Compute: macro / inflation adjusted
Definition: Convert nominal returns to real returns using Fisher equation.
Inputs (JSON): {"inflation_rate_pct": 3, "nominal_return_pct": 10}
Return this value: real_return_pct
```

## P018  [FX/Macro]
```
Compute: macro / taylor rule
Definition: Taylor Rule interest rate prescription.
Inputs (JSON): {"current_inflation": 4.0, "inflation_weight": 0.5, "neutral_real_rate": 2.0, "output_gap_pct": 2.0, "output_weight": 0.5, "target_inflation": 2.0}
Return this value: prescribed_rate
```

## P019  [Fixed Income]
```
Compute: fixed income / bond
Definition: Bond price, Macaulay/modified duration, convexity, DV01.
Inputs (JSON): {"coupon_rate": 0.05, "face": 1000, "frequency": 2, "years": 10, "ytm": 0.04}
Return this value: price
```

## P020  [Fixed Income]
```
Compute: fixed income / bond
Definition: Bond price, Macaulay/modified duration, convexity, DV01.
Inputs (JSON): {"coupon_rate": 0.05, "face": 1000, "frequency": 2, "years": 5, "ytm": 0.06}
Return this value: price
```

## P021  [Fixed Income]
```
Compute: fixed income / amortization
Definition: Full amortization schedule with extra payment savings analysis.
Inputs (JSON): {"annual_rate": 0.06, "principal": 200000, "years": 30}
Return this value: payment
```

## P022  [Fixed Income]
```
Compute: fi / credit spread
Definition: Credit spread and Z-spread from bond price vs risk-free curve.
Inputs (JSON): {"bond_price": 950, "coupon_rate": 0.05, "maturity_years": 5, "risk_free_curve": [{"rate": 0.04, "tenor": 1}, {"rate": 0.042, "tenor": 2}, {"rate": 0.045, "tenor": 5}]}
Return this value: credit_spread_bps
```

## P023  [Fixed Income]
```
Compute: fi / yield curve interpolate
Definition: Yield curve interpolation: linear, cubic spline, or Nelson-Siegel.
Inputs (JSON): {"method": "linear", "rates": [0.04, 0.06], "target_tenors": [1.5], "tenors": [1.0, 2.0]}
Return this value: interpolated_rates.0
```

## P024  [Fixed Income]
```
Compute: fx / forward rate
Definition: Bootstrap forward rates from a spot yield curve.
Inputs (JSON): {"compounding": "continuous", "forward_end": 2.0, "forward_start": 1.0, "yield_curve": [{"spot_rate": 0.04, "tenor_years": 1.0}, {"spot_rate": 0.06, "tenor_years": 2.0}]}
Return this value: forward_rate
```

## P025  [Indicators]
```
Compute: indicators / fibonacci retracement
Definition: Fibonacci retracement and extension levels.
Inputs (JSON): {"direction": "up", "swing_high": 200, "swing_low": 100}
Return this value: retracement_levels.50.0%
```

## P026  [Indicators]
```
Compute: indicators / fibonacci retracement
Definition: Fibonacci retracement and extension levels.
Inputs (JSON): {"direction": "up", "swing_high": 200, "swing_low": 100}
Return this value: retracement_levels.61.8%
```

## P027  [Indicators]
```
Compute: indicators / technical
Definition: 13 technical indicators + composite signals.
Inputs (JSON): {"period": 14, "prices": [100.0, 101.0, 102.0, 103.0, 104.0, 105.0, 106.0, 107.0, 108.0, 109.0, 110.0, 111.0, 112.0, 113.0, 114.0, 115.0, 116.0, 117.0, 118.0, 119.0, 120.0, 121.0, 122.0, 123.0, 124.0, 125.0, 126.0, 127.0, 128.0, 129.0]}
Return this value: rsi
```

## P028  [Indicators]
```
Compute: indicators / bollinger bands
Definition: Bollinger Bands with %B, bandwidth, and squeeze detection.
Inputs (JSON): {"num_std": 2, "prices": [100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0], "window": 20}
Return this value: upper_band
```

## P029  [Indicators]
```
Compute: indicators / bollinger bands
Definition: Bollinger Bands with %B, bandwidth, and squeeze detection.
Inputs (JSON): {"num_std": 2, "prices": [100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0], "window": 20}
Return this value: middle_band
```

## P030  [Indicators]
```
Compute: indicators / atr
Definition: Average True Range with normalized ATR and volatility regime.
Inputs (JSON): {"close": [10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0], "high": [11.0, 11.0, 11.0, 11.0, 11.0, 11.0, 11.0, 11.0, 11.0, 11.0], "low": [9.0, 9.0, 9.0, 9.0, 9.0, 9.0, 9.0, 9.0, 9.0, 9.0], "period": 9}
Return this value: current_atr
```

## P031  [Monte Carlo]
```
Compute: simulate / montecarlo
Definition: GBM Monte Carlo with contributions/withdrawals. Up to 5000 paths.
Inputs (JSON): {"annual_return": 0.1, "annual_vol": 0.2, "initial_value": 100000, "simulations": 5000, "years": 1}
Return this value: terminal.mean
```

## P032  [Monte Carlo]
```
Compute: simulate / montecarlo
Definition: GBM Monte Carlo with contributions/withdrawals. Up to 5000 paths.
Inputs (JSON): {"annual_return": 0.08, "annual_vol": 0.2, "initial_value": 100000, "simulations": 5000, "years": 1}
Return this value: cagr
```

## P033  [Options]
```
Compute: options / price
Definition: Black-Scholes pricing with 10 Greeks (delta through color).
Inputs (JSON): {"K": 40, "S": 42, "T": 0.5, "r": 0.1, "sigma": 0.2, "type": "call"}
Return this value: price
```

## P034  [Options]
```
Compute: options / price
Definition: Black-Scholes pricing with 10 Greeks (delta through color).
Inputs (JSON): {"K": 40, "S": 42, "T": 0.5, "r": 0.1, "sigma": 0.2, "type": "call"}
Return this value: greeks.delta
```

## P035  [Options]
```
Compute: options / implied vol
Definition: Newton-Raphson implied volatility solver. Converges in 5-8 iterations.
Inputs (JSON): {"K": 40, "S": 42, "T": 0.5, "market_price": 4.76, "r": 0.1, "type": "call"}
Return this value: implied_volatility
```

## P036  [Options]
```
Compute: options / implied vol
Definition: Newton-Raphson implied volatility solver. Converges in 5-8 iterations.
Inputs (JSON): {"K": 100, "S": 100, "T": 1.0, "market_price": 7.46, "r": 0.05, "type": "put"}
Return this value: implied_volatility
```

## P037  [Options]
```
Compute: options / payoff diagram
Definition: Multi-leg options payoff diagram data generation.
Inputs (JSON): {"legs": [{"direction": "long", "premium": 5, "quantity": 1, "strike": 100, "type": "call"}, {"direction": "short", "premium": 2, "quantity": 1, "strike": 110, "type": "call"}], "points": 200, "price_range_pct": 20, "spot": 105}
Return this value: max_profit
```

## P038  [Options]
```
Compute: options / payoff diagram
Definition: Multi-leg options payoff diagram data generation.
Inputs (JSON): {"legs": [{"direction": "long", "premium": 5, "quantity": 1, "strike": 100, "type": "call"}, {"direction": "short", "premium": 2, "quantity": 1, "strike": 110, "type": "call"}], "points": 200, "price_range_pct": 20, "spot": 105}
Return this value: max_loss
```

## P039  [Portfolio]
```
Compute: portfolio / risk parity weights
Definition: Equal risk contribution portfolio weights.
Inputs (JSON): {"asset_names": ["A", "B"], "correlation_matrix": [[1.0, 0.0], [0.0, 1.0]], "volatilities": [0.2, 0.2]}
Return this value: weights.A
```

## P040  [Portfolio]
```
Compute: portfolio / risk parity weights
Definition: Equal risk contribution portfolio weights.
Inputs (JSON): {"asset_names": ["A", "B"], "correlation_matrix": [[1.0, 0.0], [0.0, 1.0]], "volatilities": [0.2, 0.2]}
Return this value: risk_contributions.A
```

## P041  [Portfolio]
```
Compute: portfolio / optimize
Definition: Portfolio optimization: max Sharpe, min vol, or risk parity weights.
Inputs (JSON): {"mode": "min_vol", "returns": {"SPY": [0.01, -0.005, 0.008, -0.012, 0.015, 0.003, -0.007, 0.011, -0.002, 0.006], "TLT": [-0.002, 0.004, -0.001, 0.006, -0.003, 0.001, 0.005, -0.002, 0.003, -0.001]}}
Return this value: vol
```

## P042  [Risk]
```
Compute: risk / kelly
Definition: Kelly Criterion: discrete (win/loss) or continuous (returns series) mode.
Inputs (JSON): {"avg_loss": 100, "avg_win": 120, "mode": "discrete", "win_rate": 0.55}
Return this value: full_kelly
```

## P043  [Risk]
```
Compute: risk / kelly
Definition: Kelly Criterion: discrete (win/loss) or continuous (returns series) mode.
Inputs (JSON): {"avg_loss": 100, "avg_win": 120, "mode": "discrete", "win_rate": 0.55}
Return this value: edge
```

## P044  [Risk]
```
Compute: risk / position size
Definition: Fixed fractional position sizing with risk/reward targets.
Inputs (JSON): {"account_size": 100000, "entry_price": 50, "risk_per_trade": 0.02, "stop_loss": 48}
Return this value: shares
```

## P045  [Risk]
```
Compute: risk / position size
Definition: Fixed fractional position sizing with risk/reward targets.
Inputs (JSON): {"account_size": 100000, "entry_price": 50, "risk_per_trade": 0.02, "stop_loss": 48}
Return this value: risk
```

## P046  [Risk]
```
Compute: risk / drawdown
Definition: Drawdown decomposition with underwater curve.
Inputs (JSON): {"equity_curve": [100, 110, 120, 115, 100, 90, 95, 105]}
Return this value: max_dd
```

## P047  [Risk]
```
Compute: risk / var parametric
Definition: Parametric Value-at-Risk and Conditional VaR.
Inputs (JSON): {"confidence_levels": [0.95], "holding_period_days": 1, "portfolio_value": 1000000, "returns": [0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01]}
Return this value: var_results.95.var_pct
```

## P048  [Statistics]
```
Compute: stats / linear regression
Definition: OLS linear regression with R-squared, t-stats, and standard errors.
Inputs (JSON): {"x": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0], "y": [2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.0, 16.0, 18.0, 20.0]}
Return this value: coefficients.0
```

## P049  [Statistics]
```
Compute: stats / zscore
Definition: Rolling and static z-scores with extreme value detection.
Inputs (JSON): {"series": [0.0, 2.0, 4.0, 6.0, 8.0], "threshold": 2.0}
Return this value: current_zscore
```

## P050  [Statistics]
```
Compute: stats / zscore
Definition: Rolling and static z-scores with extreme value detection.
Inputs (JSON): {"series": [0.0, 2.0, 4.0, 6.0, 8.0], "threshold": 2.0}
Return this value: mean
```

## P051  [Statistics]
```
Compute: stats / hurst exponent
Definition: Hurst exponent via rescaled range (R/S) analysis.
Inputs (JSON): {"series": [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 27.0, 28.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0, 36.0, 37.0, 38.0, 39.0, 40.0, 41.0, 42.0, 43.0, 44.0, 45.0, 46.0, 47.0, 48.0, 49.0, 50.0, 51.0, 52.0, 53.0, 54.0, 55.0, 56.0, 57.0, 58.0, 59.0, 60.0, 61.0, 62.0, 63.0, 64.0, 65.0, 66.0, 67.0, 68.0, 69.0, 70.0, 71.0, 72.0, 73.0, 74.0, 75.0, 76.0, 77.0, 78.0, 79.0, 80.0, 81.0, 82.0, 83.0, 84.0, 85.0, 86.0, 87.0, 88.0, 89.0, 90.0, 91.0, 92.0, 93.0, 94.0, 95.0, 96.0, 97.0, 98.0, 99.0, 100.0, 101.0, 102.0, 103.0, 104.0, 105.0, 106.0, 107.0, 108.0, 109.0, 110.0, 111.0, 112.0, 113.0, 114.0, 115.0, 116.0, 117.0, 118.0, 119.0, 120.0, 121.0, 122.0, 123.0, 124.0, 125.0, 126.0, 127.0, 128.0, 129.0, 130.0, 131.0, 132.0, 133.0, 134.0, 135.0, 136.0, 137.0, 138.0, 139.0, 140.0, 141.0, 142.0, 143.0, 144.0, 145.0, 146.0, 147.0, 148.0, 149.0, 150.0, 151.0, 152.0, 153.0, 154.0, 155.0, 156.0, 157.0, 158.0, 159.0, 160.0, 161.0, 162.0, 163.0, 164.0, 165.0, 166.0, 167.0, 168.0, 169.0, 170.0, 171.0, 172.0, 173.0, 174.0, 175.0, 176.0, 177.0, 178.0, 179.0, 180.0, 181.0, 182.0, 183.0, 184.0, 185.0, 186.0, 187.0, 188.0, 189.0, 190.0, 191.0, 192.0, 193.0, 194.0, 195.0, 196.0, 197.0, 198.0, 199.0]}
Return this value: hurst_exponent
```

## P052  [Statistics]
```
Compute: stats / cointegration
Definition: Engle-Granger cointegration test with hedge ratio and half-life.
Inputs (JSON): {"series_x": [-0.1, 1.0, 2.1, 2.9, 4.0, 5.1, 5.9, 7.0, 8.1, 8.9, 10.0, 11.1, 11.9, 13.0, 14.1, 14.9, 16.0, 17.1, 17.9, 19.0, 20.1, 20.9, 22.0, 23.1, 23.9, 25.0, 26.1, 26.9, 28.0, 29.1, 29.9, 31.0, 32.1, 32.9, 34.0, 35.1, 35.9, 37.0, 38.1, 38.9, 40.0, 41.1, 41.9, 43.0, 44.1, 44.9, 46.0, 47.1, 47.9, 49.0, 50.1, 50.9, 52.0, 53.1, 53.9, 55.0, 56.1, 56.9, 58.0, 59.1], "series_y": [-0.30000000000000004, 1.95, 4.2, 5.85, 8.1, 10.1, 11.75, 14.0, 16.25, 17.900000000000002, 19.9, 22.15, 23.8, 26.05, 28.3, 29.7, 31.95, 34.2, 35.849999999999994, 38.1, 40.1, 41.75, 44.0, 46.25, 47.9, 49.9, 52.150000000000006, 53.8, 56.05, 58.300000000000004, 59.699999999999996, 61.95, 64.2, 65.85, 68.1, 70.10000000000001, 71.75, 74.0, 76.25, 77.89999999999999, 79.9, 82.15, 83.8, 86.05, 88.3, 89.7, 91.95, 94.2, 95.85, 98.1, 100.10000000000001, 101.75, 104.0, 106.25, 107.89999999999999, 109.9, 112.15, 113.8, 116.05, 118.3], "significance": "0.05"}
Return this value: hedge_ratio
```

## P053  [Statistics]
```
Compute: stats / garch forecast
Definition: GARCH(1,1) volatility forecast using maximum likelihood estimation.
Inputs (JSON): {"forecast_periods": 5, "returns": [0.0, 0.0029552020666133954, 0.005646424733950354, 0.007833269096274834, 0.009320390859672264, 0.009974949866040545, 0.009738476308781953, 0.008632093666488738, 0.00675463180551151, 0.004273798802338301, 0.001411200080598672, -0.0015774569414324822, -0.004425204432948521, -0.006877661591839738, -0.008715757724135883, -0.00977530117665097, -0.009961646088358407, -0.009258146823277325, -0.007727644875559877, -0.005506855425976376, -0.0027941549819892587, 0.00016813900484349714, 0.0031154136351337785, 0.005784397643881995, 0.007936678638491526, 0.00937999976774739, 0.00998543345374605, 0.009698898108450864, 0.008545989080882806, 0.006629692300821833, 0.004121184852417566, 0.0012445442350706348, -0.0017432678122297966, -0.0045753589377532135, -0.006998746875935423, -0.008796957599716701, -0.009809362300664912, -0.009945525882039893, -0.009193285256646757, -0.007619835839190334, -0.00536572918000435, -0.0026323179136580267, 0.000336230472211367, 0.0032747443913769304, 0.00592073514707223, 0.00803784426551621, 0.009436956694441043, 0.009993093887479177, 0.00965657776549278, 0.008457468311429343, 0.006502878401571169, 0.0039674057313061365, 0.0010775365229944405, -0.0019085858137418764, -0.004724219863984662, -0.007117853423691231, -0.008875670335815046, -0.009840650050816427, -0.009926593804706332, -0.009125824497911845, -0.007509872467716762, -0.005223085896267315, -0.0024697366173662434, 0.0005042268780681122, 0.003433149288198954, 0.006055398697196011, 0.008136737375071054, 0.009491245536478935, 0.009997929001426693, 0.009611527245021165, 0.00836655638536056, 0.006374225961502389, 0.003812504916549435, 0.0009102241619984787, -0.0020733642060675878, -0.004871745124605096, -0.00723494756044245, -0.008951873678196802, -0.009869155581206488, -0.009904855208971565, -0.009055783620066237, -0.007397785850778934, -0.005078965903906252, -0.002306457059273957, 0.0006720807252547492, 0.003590583540221683, 0.006188350221200393, 0.008233330007380794, 0.00954285094492697, 0.009999937428570208, 0.00956375928404503, 0.008273279005953786, 0.006243771354163942, 0.0036565262028262135, 0.0007426544558436131, -0.002237556401867964, -0.005017893010205711, -0.0073499961804877525, -0.009025546082101854, -0.009894870832545352]}
Return this value: persistence
```

## P054  [TVM]
```
Compute: tvm / present value
Definition: Present value of a future lump sum and/or annuity stream.
Inputs (JSON): {"future_value": 10000, "periods": 10, "rate": 0.05}
Return this value: present_value
```

## P055  [TVM]
```
Compute: tvm / present value
Definition: Present value of a future lump sum and/or annuity stream.
Inputs (JSON): {"payment": 1000, "periods": 10, "rate": 0.08}
Return this value: pv_of_annuity
```

## P056  [TVM]
```
Compute: tvm / future value
Definition: Future value of a present lump sum and/or annuity stream.
Inputs (JSON): {"periods": 10, "present_value": 10000, "rate": 0.05}
Return this value: future_value
```

## P057  [TVM]
```
Compute: tvm / future value
Definition: Future value of a present lump sum and/or annuity stream.
Inputs (JSON): {"payment": 1000, "periods": 10, "rate": 0.08}
Return this value: fv_of_annuity
```

## P058  [TVM]
```
Compute: tvm / irr
Definition: Internal rate of return via Newton-Raphson. First cash flow is typically negative (investment).
Inputs (JSON): {"cash_flows": [-1000, 300, 400, 500, 200]}
Return this value: irr_pct
```

## P059  [TVM]
```
Compute: tvm / npv
Definition: Net present value of a cash flow series at a given discount rate.
Inputs (JSON): {"cash_flows": [-1000, 400, 400, 400], "discount_rate": 0.1}
Return this value: npv
```
