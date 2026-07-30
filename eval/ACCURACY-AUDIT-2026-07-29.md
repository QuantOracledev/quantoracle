# QuantOracle accuracy audit — 2026-07-29

> **STATUS: all 8 defects and all 5 contract issues fixed, verified, guarded by new
> tests, and DEPLOYED to production 2026-07-30 03:53 UTC.** Verified on the live public
> endpoint `api.quantoracle.dev` (which fronts the Worker, and which the MCP server
> proxies to — so REST, MCP and x402 all serve the corrected maths). See §F for what
> changed and §G for the breaking-change list.

Full independent re-verification of the live calculators, prompted by the earlier LLM
cross-solve eval that exposed two real pricing bugs (lookback, Asian) plus one wrong
expected value hidden behind a ±80% tolerance.

## Method

The shipped suite (`tests/accuracy_benchmarks.py`) **passes 120/120** — and passed
120/120 while the lookback bug was live. So it was treated as evidence of nothing. Every
reference below was derived independently:

| Technique | Used for |
|---|---|
| `scipy.stats.norm` instead of the API's hand-rolled `ncdf`/`npdf` | Black-Scholes, greeks, VaR, PSR |
| Analytic greeks written from the BSM derivatives | all 9 greeks, incl. `q > 0` |
| Continuous-monitoring Monte Carlo, Brownian-bridge hit probability | barrier options |
| Exact Brownian-bridge extreme sampling | lookback options |
| Discrete-fixing Monte Carlo | Asian options |
| Numerical `dP/dy`, `d²P/dy²` of an explicit cashflow sum | bond duration, convexity, DV01 |
| `scipy.optimize.brentq` / `minimize` | IRR, YTM, min-vol optimisation |
| Structural identities | put-call parity, in/out parity, American ≥ European |
| Repeat-call determinism | every MC-backed endpoint |

Roughly 570 checks across 8 suites. Scripts in the session scratchpad
(`xcheck_options.py`, `xcheck_greeks.py`, `xcheck_barrier.py`, `xcheck_path.py`,
`xcheck_rest.py`, `xcheck_composites*.py`, `xcheck_final.py`, `audit_tolerances.py`).

Two of my own references were wrong first and were corrected before drawing conclusions —
a barrier MC that set the hit probability to 0 instead of 1 when a path visibly crossed,
and finite-difference greeks poisoned by the API's 4-dp response rounding. Both are noted
because the corrected versions are what the findings rest on.

---

## A. Confirmed wrong output

### A1 — Barrier options: wrong exponent on the strike term  ★ most severe
`api/quantoracle.py` t17. All four closed-form branches use `(H/S)**(2*lam)` on the
strike term where the standard Reiner-Rubinstein / Hull formula requires
`(H/S)**(2*lam - 2)`. Six code sites.

Proof: substituting `2*lam - 2` into the API's own expression reproduces the verified
value to 5 decimals; the shipped `2*lam` reproduces the API's wrong number exactly.

| case | API | truth | error |
|---|---|---|---|
| down-out call K=95 H=90 σ=.25 | 5.9578 | 9.2298 | **−35%** |
| down-out call K=95 H=95 σ=.25 | 2.3696 | 5.9286 | **−60%** |
| down-in call K=95 H=90 σ=.25 | 5.1197 | 1.8477 | **+177%** |
| up-in put K=105 H=110 σ=.25 | 6.3927 | 1.9254 | **+232%** |
| down-out call H=50 (*the suite's only case*) | 8.2600 | 8.2600 | 0.00% |

Fresh closed form and bridge MC agree with each other within MC error; both disagree with
the API. **Why it was never caught:** the single shipped test puts the barrier at H=50
against S=100, where the barrier term is ~0 — so the test cannot distinguish a correct
implementation from `return vanilla`. In/out parity holds in the API only because it
computes `in = vanilla − out`, making parity structurally guaranteed and worthless as a
check; both legs are wrong together.

### A2 — Linear regression: output arrays misaligned by one
`coefficients` is `beta[1:]` (intercept dropped) but `standard_errors`, `t_statistics`
and `p_values` all still start at index 0 — the intercept's. Lengths disagree
(1 vs 2 simple; 2 vs 3 with two predictors) and nothing documents the offset.

Every value is individually correct; the pairing is wrong. Impact is a **reversed
inference**: asking "is my predictor significant?" via `p_values[0]` returns `1.0`
(the intercept's) when the slope's true p is `5.2e-14`.

### A3 — Lookback fixed-strike: 4–6% biased low
Priced by a 252-step discrete Monte Carlo. The source comment five lines above, added
during the earlier fix, states that discrete monitoring understates the running extreme
and is not valid here — then the fixed-strike branch does exactly that.

| case | API | continuous MC | error |
|---|---|---|---|
| fixed call σ=.3 K=100 | 18.294 | 19.115 ± .070 | −4.3% |
| fixed call σ=.2 K=105 | 14.271 | 14.859 ± .066 | −4.0% |
| fixed put σ=.3 K=100 | 13.609 | 14.423 ± .044 | −5.6% |

### A4 — MC-backed endpoints are non-deterministic
`bm()` uses unseeded `random.random()`; 5,000 paths; no standard error reported. Identical
request, six calls:

| endpoint | spread |
|---|---|
| barrier down-out **put** (no closed form) | **13.7%** |
| barrier up-out **call** (no closed form) | **8.4%** |
| lookback fixed-strike | **4.1%** |
| asian geometric (closed form) | 0.00% ✓ |

Compounding this: only 4 of 8 barrier type/direction combinations have a closed form at
all. Up-out call, up-in call, down-out put and down-in put — including the widely traded
up-and-out call — fall to the MC path, despite closed forms existing for all of them.

### A5 — Implied vol returns the seed on failure, silently
The solver breaks out when vega < 1e-12 and returns `sig` unchanged — which on the first
iteration is the literal seed `0.3`. There is no `converged` field in the response.

| input | returns | reality |
|---|---|---|
| deep ITM S=100 K=5 | `0.3`, `iterations: 1` | the seed |
| price 1e-6 | `0.3` | the seed |
| price below intrinsic (arbitrage) | `0.001` | no valid IV exists |
| price above spot (impossible) | `5.0` after 50 iters | no valid IV exists |
| normal case | `0.25` ✓ | solver core is fine |

This is the exact silent-failure mode the eval identified as the product's one real
selling point.

### A6 — `charm` wrong whenever `q > 0`
Omits the `q·e^{-qT}·N(±d1)` term and returns the **same value for calls and puts**, which
is only true at q=0. Sign flip observed: `charm call q=.05 S=250 K=240 T=2` returns
−2.95e-05 against a true +4.66e-05. All 8 greek failures out of 160 checks were charm, and
every one required q>0. The other 8 greeks are correct including with dividends.

### A7 — RSI is not Wilder's RSI
Both implementations (`technical` inline, and `_rsi` used by `regime-classify`) take a
simple arithmetic mean of the last *n* gains/losses. Standard RSI — Wilder 1978, and what
TradingView / StockCharts / MetaTrader compute — uses smoothed averages.

Over 40 random series: mean absolute difference **6.64 RSI points**, max 18.6. The
`trend` field is literally `"BULLISH" if price > sma and rsi > 50` — that label **flips in
3 of 40 cases**, and the overbought/oversold zone differs in **4 of 40**. The 30/70
thresholds the endpoint applies are calibrated for Wilder's version.

### A8 — `portfolio/optimize` min_vol never reaches the minimum
Across 12 datasets the returned portfolio was **more volatile than the true constrained
optimum in 12 of 12** — mean +1.89%, max +2.87% excess volatility. Systematic, not noise.
Weights sum to 1 and the reported `vol` does match `√(wᵀΣw)` for the weights given; the
optimiser simply stops short.

---

## B. Contract / consistency issues (values right, presentation wrong)

- **B1** `macro/inflation-adjusted` mixes units in one response: `real_return_pct` =
  6.7961 and `fisher_exact_real_return` = 0.067961 are the *same quantity* 100× apart,
  while `approximate_real_return` = 7.0 is a percentage.
- **B2** `risk_free_rate` defaults disagree across endpoints — `full-analysis` 0.045,
  `sharpe-ratio` 0.05. Two endpoints both reporting "sharpe" on identical returns differ
  by ~10% for a caller who omits the field.
- **B3** Two different ATRs ship in one codebase: `/v1/indicators/atr` is correct Wilder
  ATR, while `technical.atr` is `mean(|Δclose|)` — it ignores high and low entirely.
- **B4** `fixed-income/amortization` truncates `schedule` (36 of 360 rows) with no flag or
  count telling the caller it was cut.
- **B5** 4-dp rounding erases small values: a genuinely-worth-$0.00248 put returns
  `0.0025`, and a deep-OTM option worth 1.09e-06 returns `0`.

---

## C. Verified correct

Independently confirmed, not merely suite-passing:

- **Black-Scholes price** and **delta, gamma, theta, vega, rho, vanna, volga, speed** —
  152/160 checks across 8 parameter sets including `q > 0` (only charm failed)
- **Implied vol** core solver on well-posed inputs; **put-call parity** both directions
- **Binomial tree** — European → BS convergence, American ≥ European, American call =
  European call with no dividends, never below intrinsic
- **Asian options** — geometric *and* arithmetic, 10/10 vs Monte Carlo, n = 4…26, q > 0.
  The Turnbull-Wakeman branch is accurate to <0.5% despite reusing the geometric variance
- **Lookback floating-strike** — 4/4 vs continuous-monitoring MC including q > 0; the
  earlier fix holds
- **Bond** price, Macaulay/modified duration, convexity, DV01 vs numerical derivatives of
  an explicit cashflow sum, 4 parameter sets
- **Amortization** payment formula and first-row interest/principal split
- **TVM** — present value, future value, NPV, IRR, CAGR, all exact
- **ATR** (canonical Wilder, SMA-seeded), **Bollinger**, **Fibonacci**, **realized vol**,
  **SMA**, **EMA**
- **z-score**, **normal distribution**, **Sharpe**, **parametric VaR** (correctly
  *mean-adjusted*), **correlation matrix**
- **Kelly**, **position sizing**, **drawdown**, **transaction cost** (correctly charges
  half the spread)
- **Risk parity** — weights sum to 1 with equal risk contributions
- **Crypto** — impermanent loss, APY/APR, DEX slippage (constant product w/ fee),
  liquidation price, funding annualisation, vesting conservation
- **FX / macro** — interest-rate parity, PPP, carry decomposition, Taylor rule, real
  yield, Fisher
- **Fixed income** — yield-curve interpolation passes through its knots, forward rate
  satisfies no-arbitrage, credit-spread YTM (the 167.76 bps correction holds)
- **Monte Carlo** terminal mean within 0.06% of `V₀·e^{μ}`
- **Composites** — `pairs/signal` hedge ratio and half-life match `cointegration` exactly;
  `trade/evaluate` shares match `position-size`; 5 previously untested composites respond
  correctly on valid input

## D. Tolerance health

The disease that hid the original bugs is largely cured: median tolerance is now **0.257%**
and 76 of 114 numeric checks sit at ≤1%. No citation in the suite is self-referential any
more.

Still worth tightening, because these are *exactly computable* quantities carrying loose
bands: `tvm/npv` ±9.5%, `risk/var-parametric` ±6.1%, `put-call-parity` deviation ±667% of
its expected value.

## E. Coverage gaps that let A1/A3 survive

- **19 of 81 endpoints have no accuracy check at all** — mostly the paid composites
  (`trade/evaluate`, `portfolio/health`, `risk/full-analysis`, `hedging/recommend`,
  `options/strategy-optimizer`, `backtest/strategy`, `pairs/signal`, `batch`, `watch/*`).
- **27 endpoints are covered by exactly one check** — including `barrier-option` and
  `lookback-option`, the two with confirmed bugs.
- Degenerate test inputs that cannot fail: the barrier at H=50, flat 100.0 price series
  for Bollinger, identical highs/lows for ATR.

**The generalisable lesson, and the one that cost the most here:** a test whose inputs put
the feature under test outside its own operating range is not a test. `H=50` against
`S=100` exercised the vanilla path and reported success for a barrier pricer that was
wrong by up to 232% everywhere the barrier mattered.

---

## F. Fixes applied (2026-07-29)

| # | Fix | Verification |
|---|---|---|
| A1 | Barrier pricer replaced with the full Reiner-Rubinstein A/B/C/D/E/F decomposition. Correct `(H/S)^(2mu)` on the strike term vs `(H/S)^(2mu+2)` on the spot term, and **all 8 type×direction combinations now closed-form** — the 5,000-path MC fallback is gone. | **35/35 cases match bridge MC**, all 8 combos, incl. `q>0`; in/out parity holds with **independently priced legs** |
| A2 | Regression per-parameter stats now start at the first slope, aligned with `coefficients`. Intercept stats moved to `intercept_std_error` / `intercept_t_statistic` / `intercept_p_value`. | lengths 1/1/1 and 2/2/2; slope se and p correct at index 0 |
| A3 | Fixed-strike lookback replaced with the Conze-Viswanathan closed form (was a 252-step discrete MC). | 3/3 now inside MC error; was 4–6% low |
| A4 | Barrier and lookback no longer use Monte Carlo at all, so the non-determinism is removed at the source rather than papered over with a seed. | same request ×6 → **0.00% spread** on all four previously-random probes |
| A5 | IV solver checks the no-arbitrage bounds up front, returns `converged: false` with `implied_volatility: null`, an `error` reason, and a clearly-labelled `best_effort_volatility`. Never returns the seed as an answer. | seed/clamp cases now flagged; normal cases unchanged |
| A6 | `charm` carries the `±q·e^{-qT}·N(±d1)` term and is computed separately for calls and puts. | **greeks 160/160, 0 deviations** (was 8, all charm) |
| A7 | RSI moved to Wilder smoothing via one shared `_wilder_rsi` helper, so `technical` and `regime-classify` cannot drift apart. | mean error vs Wilder **6.64 → 0.0025 points** |
| A8 | min_vol/max_sharpe solved exactly by active set on `Sigma^-1·rhs` (uses the existing `mat_inv`, no new dependency), replacing fixed-step gradient descent. Singular-Sigma fallback is inverse-variance, not equal weights. | excess vol vs true optimum **1.89% → −0.002%**; suboptimal datasets **12/12 → 0/12** |
| B1 | `fisher_exact_real_return` split into `_pct` and `_decimal`. | no two same-named quantities 100× apart |
| B2 | `risk_free_rate` default standardised to 0.05 across all six endpoints (two were 0.045). | two "sharpe" figures now agree |
| B3 | `technical.atr` labelled a close-only proxy (`mean_abs_change` + `atr_note`); `atr` kept as a deprecated alias. | no longer claims to be ATR |
| B4 | Amortization advertises its sampling: `schedule_is_sampled`, `schedule_rows`, `schedule_total_months`, `schedule_sampling`. | caller can no longer mistake 36 rows for 360 |
| B5 | Left as-is deliberately — 4-dp rounding is a display convention, and widening it would change every response. Documented rather than changed. | — |

### Test coverage added
15 regression guards appended to `tests/accuracy_benchmarks.py`, one per defect,
each written to fail if the defect returns. **Suite: 135 passed, 0 failed** (was 120).

Every expected value in the new block comes from an independent implementation
cross-agreed with Monte Carlo — never from QuantOracle's own output, which is the trap
that let the Asian-option error survive with a citation attached. The barrier cases
deliberately sit at H=90/95/110/115 against S=100, where the barrier binds.

### Independent-suite deltas

| suite | before | after |
|---|---|---|
| greeks (incl. q>0) | 8 deviations | **0 of 160** |
| barrier vs closed form + MC | 10 of 11 off | **0 of 11**, and 0/35 in the extended sweep |
| lookback vs continuous MC | 3 off | **0** |
| MC determinism | 3 endpoints random | **0** |
| optimizer | 12/12 suboptimal | **0/12** |
| deterministic calculators | 16 deviations | 13, all documented harness artifacts |
| final pass | 3 deviations | 2, both convention differences |

Residual deviations are known artifacts of the *checking* harness, not the API: finite
difference greeks are limited by the API's 4-dp response rounding; a $0.0025 option
price cannot round-trip at 4 dp; my transaction-cost reference omitted the standard
half-spread; my ATR references were both non-canonical. Each is annotated in the
scripts.

## G. Breaking changes — read before deploying

Three fixes change response shape. All are deliberate, and in each case the old
behaviour was returning something wrong:

1. **`/v1/options/implied-vol`** — `implied_volatility` is now `null` when the solver
   cannot converge, with `converged: false` and an `error`. Callers that read the field
   unconditionally will now see `null` instead of a fabricated `0.3` / `0.001` / `5.0`.
2. **`/v1/stats/linear-regression`** — `standard_errors`, `t_statistics` and `p_values`
   are one element shorter and now align with `coefficients`. A caller that had
   compensated by reading index 1 must read index 0.
3. **`/v1/macro/inflation-adjusted`** — `fisher_exact_real_return` is replaced by
   `fisher_exact_real_return_pct` and `fisher_exact_real_return_decimal`.

Additive only: `method` on barrier/lookback/optimize, `intercept_*` stats,
`mean_abs_change` + `atr_note`, and the `schedule_*` metadata.
