# How I actually worked — Opus 5

## Integrity

I read only `eval/problems.md`. I did not open, grep, or list `problems.json`, `cases.json`,
`tests/`, `bench_output.txt`, `api/quantoracle.py`, or any other repo file, and I called no
QuantOracle endpoint. Every number came from a formula I wrote myself in a scratch directory
outside the project (`%TEMP%\claude\...\scratchpad\solve1..5.py`), run with the repo's venv
Python 3.14 / numpy 2.4 / scipy 1.17. Nothing was written into the project except these two
deliverables.

## Mental vs. executed code

Roughly **90% executed code, 10% mental**. I derived every formula in my head first (that part
is unavoidable — the hard work here is picking the right formula and the right convention, not
the arithmetic), then wrote a single script implementing all of them and let Python produce the
digits. I did the mental arithmetic anyway for about 20 of the easy ones (TVM, bond prices,
Fisher, Taylor, Fibonacci, put/call ratio) as a sanity check against the script; all agreed.

I switched to code for four reasons, in order of importance:

1. **Precision.** The task asks for several significant figures. Mental `N(d1)` is good to ~4
   decimals; `scipy.stats.norm.cdf` is good to 15. Anything Black-Scholes-shaped had to be code.
2. **Iteration.** Implied vol (P035/P036), bond YTM (P022), IRR (P058) are root-finds. I used
   Brent rather than Newton-Raphson — same root, no derivative, no convergence risk.
3. **Bulk.** A 500-step CRR tree (P007) and a 2M-path Monte Carlo are not mental work.
4. **Verification.** This is the one that actually mattered — see below.

## The one place verification saved me

**P011 (floating-strike lookback call).** I wrote out Goldman-Sosin-Gatto from memory and got
**19.1316**. I then cross-checked with a 400k-path Monte Carlo using a Brownian-bridge correction
for the continuously-monitored minimum, which said **16.93 ± 0.05**. That is a 13% disagreement,
far outside MC error, so one of them was wrong.

I settled it without either: for a floating lookback, price = `S − e^{-rT}·E[min]`, and `E[min]`
can be computed exactly by integrating the known law of the running minimum of drifted Brownian
motion, `P(M_T ≤ x) = N((x−νT)/σ√T) + e^{2νx/σ²}·N((x+νT)/σ√T)`. Numerical quadrature gives
`E[min] = 85.1939` and price = **16.9095281**. I had the last bracket's arguments un-negated;
the correct form uses `N(−a1 + 2b√T/σ)` and `−e^{bT}N(−a1)`. The corrected closed form reproduces
the quadrature to 1e-14. A quick Jensen bound also kills the old answer outright: for zero drift
`E[min] ≥ 100·e^{−σ√(2T/π)} = 84.4`, and 19.13 implies `E[min] = 82.9`, which is impossible.

**Lesson worth recording: my recalled closed forms are ~90% reliable, and the 10% failure is
silent.** I also MC-checked the geometric Asian (P008: closed form 5.9402 vs MC 5.9434 ± 0.0114 —
consistent) and the 500-step binomial against Black-Scholes (4.75934 vs 4.75942 — correct O(1/n)
convergence).

## Problems I found genuinely hard or that I actively doubt

Flagged worst-first. For the convention calls, the answer is right *given* the reading; the risk
is entirely in the reading.

### Tier 1 — I doubt these; treat as coin flips

- **P053 (GARCH persistence) — lowest confidence of anything here.** The input is a deterministic
  sinusoid, not a return series, so the likelihood surface is pathological. I did a full 99×99
  grid over (α, β) with ω profiled out, then polished with Nelder-Mead. The global MLE sits on the
  **boundary β = 0**, α ≈ 0.7879, persistence ≈ **0.788**. But this moves a lot with harmless
  implementation choices: demeaning the returns gives 0.794; initialising h₁ at the sample variance
  instead of the unconditional variance gives 0.84 (and pushes α to the 0.9999 bound in a
  local run); Nelder-Mead from the common (0.1, 0.85) start gets stuck at 0.884. Anything in
  **0.78–0.99** is defensible, and a library that hard-codes a fallback would say 0.95. I reported
  my honest global MLE. I considered `null` and decided a computed number with this caveat is more
  useful, but do not read the digits past the first as meaningful.
- **P041 (min-vol `vol`) — annualisation is the whole answer.** Weights are unambiguous (analytic
  and long-only SLSQP both give SPY 0.2690 / TLT 0.7310; the two series are −99.2% correlated).
  Per-period vol is **0.00029483**; I reported **0.0046802** (×√252). I chose annualised because a
  `max_sharpe` mode in the same endpoint is meaningless without annualisation. If the reference
  doesn't annualise, I'm wrong by 15.87×. Uses sample covariance (ddof=1); ddof=0 would give
  0.0044401.
- **P032 (`cagr`)** — I used the mean terminal value: `e^0.08 − 1 = 0.083287`. If it's derived from
  the *median* path (very common in MC projection tools) it's `e^{0.08−σ²/2} − 1 = 0.061837`. No
  way to distinguish from the problem text.
- **P051 (Hurst)** — the true value for a perfect linear ramp is exactly 1.0 (R/S ∝ n·√3/8·... → slope 1),
  so I reported **1.0**. But every real R/S implementation has finite-size bias, and the *sign* of
  that bias depends on one line: chunk std with ddof=1 gives 1.016–1.055, ddof=0 gives 0.966–0.999,
  across eight different window-set choices I tried. So the honest interval is **0.97–1.05**. Note
  the popular `polyfit(log(lag), log(std(diff)))` variant of "Hurst" would return NaN here, since
  the differences are constant.

### Tier 2 — a definitional fork, I picked the more common branch

- **P006 (`price_impact_pct`) = 9.3389.** Two natural formulations agree on this: "you received
  9.34% less than spot value" and `(spot − executed)/spot` with executed = out/in. But inverting
  the price convention (`in/out` per unit) gives **10.3009**, and computing impact *excluding* the
  30bp fee gives exactly **10.0**. Fee is included in my number.
- **P047 (`var_pct`) = 1.6531** using **sample** std (ddof=1). Population std gives 1.64485 — which
  is suspiciously exactly z₀.₉₅, so if the reference used `np.std()` bare, that's the answer.
- **P049 (`current_zscore`) = 1.41421** using **population** std (ddof=0, scipy.stats.zscore's
  default). ddof=1 gives 1.26491. Note I deliberately chose *different* ddof for P047 and P049 —
  each follows its own field's dominant convention rather than being internally consistent. That's
  a real risk I'm taking on both.
- **P048 (`coefficients.0`) = 2.0**, reading `coefficients` as the slope array with the intercept
  reported separately (sklearn/polyfit style). If the array is `[intercept, slope]` (statsmodels
  with a constant), the answer is **0.0**. Genuinely 50/50 and the two answers are maximally far apart.
- **P008/P009 (geometric Asian) = 5.9402**, using the **discrete** 12-observation closed form
  (σ_G² = σ²(n+1)(2n+1)/6n², drift factor (n+1)/2n), MC-verified. If the implementation ignores
  `observations` and uses the continuous Kemna-Vorst limit, it's **5.5468**. I went discrete because
  `observations` is an input and would otherwise be dead.
- **P016 (`spot_return_pct`) = −1.3333** as `(exit − entry)/entry`. If the quote is inverted for the
  carry direction it's **+1.35135**. P015 uses ACT/365 (1.72603); ACT/360 would give 1.75.
- **P005 (liquidation) = 45250**, from `entry·(1 − 1/L + mmr)`. The variant that puts maintenance
  margin on the post-move position value, `entry·(1 − 1/L)/(1 − mmr)`, gives 45226.13.
- **P013 (IRP forward) = 1.121359** using discrete compounding `S(1+rd)/(1+rf)`. Continuous
  `S·e^{(rd−rf)T}` gives 1.1222215.
- **P022 (credit spread) = 169.32 bps** = YTM(950, 5% annual coupon, 5y) − 4.5% curve point.
  Annual coupon assumed (frequency not given); semiannual gives 167.76. A true Z-spread solved
  against the linearly-interpolated curve gives 171.44 discrete / 153.02 continuous.
- **P040 (`risk_contributions.A`) = 0.5**, i.e. the normalised share. The absolute risk contribution
  `wᵢ(Σw)ᵢ/σₚ` is 0.070711.
- **P045 (`risk`) = 2000** (dollar risk = 2% of account). If the field means risk per share it's 2.
- **P043 (`edge`) = 0.21**, which is both `p·b − q` and `(p·W − q·L)/L`. The dollar EV reading is 21.
- **P031 (Monte Carlo mean)** — this one is *stochastic and unknowable*. I reported the analytic
  expectation 100000·e^0.1 = **110517.09**. With 5000 paths the realised sample mean has a standard
  error of ~285, so even a correct implementation lands anywhere in ±0.5% depending on seed. If the
  drift convention is `exp(μT + …)` rather than `exp((μ−σ²/2)T + …)`, the mean is 112749.69 instead.

### Sign conventions I guessed
- **P038 `max_loss` = −3.0** and **P046 `max_dd` = −0.25** — reported as negatives (the minimum of
  the payoff array / of `equity/peak − 1`). Both could plausibly be reported as positive magnitudes.
- **P010 `deviation` = +0.0029425** — two different natural formulations
  (`(C + Ke^{-rT}) − (P + S)` and `call − theoretical_call`) both give this sign, so I'm fairly
  comfortable here.

## Things that were unambiguous and that I'm confident in

P001–P004, P007, P012, P014, P017–P021, P023–P030, P033–P037, P039, P042, P044, P050, P052,
P054–P059. These are either closed forms with no convention freedom or degenerate-by-construction
inputs (constant price series → Bollinger bands collapse to 100, monotone series → RSI = 100,
constant ranges → ATR = 2, y = 2x exactly → slope 2, R² = 1).

Two small notes in that set: **P002 = P001** exactly, because impermanent loss is symmetric in
k ↔ 1/k — the worked example in the task prompt shows `P002: 0.0`, which is wrong if taken
literally, and I assumed it was illustrative rather than a hint. **P052** hedge ratio 2.0003333 is
OLS of y on x *with* an intercept (Engle-Granger step 1); without a constant it's 2.0000854, and
the reverse regression gives 0.4999146.

## Summary of confidence

| Band | Problems |
|---|---|
| High (formula-forced) | 40 of 59 |
| Medium (one convention call, common branch chosen) | 14 |
| Low (coin flip or stochastic) | P032, P041, P047/P049, P048, P051 |
| Very low | P053, P031 (irreducibly random) |
