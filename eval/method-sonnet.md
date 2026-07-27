# Method — Sonnet

## Overall approach

Almost entirely code, not mental arithmetic. I read `problems.md`, then wrote and ran a
series of Python scripts (Python 3.14, numpy/scipy/statsmodels, plus the `arch` package
which I installed via pip specifically for the GARCH problem) in a scratch directory,
verifying each formula against known textbook values before trusting it. I did not open
`problems.json`, `cases.json`, `tests/accuracy_benchmarks.py`, `bench_output.txt`,
`api/quantoracle.py`, or any file under `tests/`, and made no calls to any QuantOracle
endpoint. I also deliberately did not look at the sibling `answers-haiku.json` /
`answers-opus.json` / `method-haiku.md` / `method-opus.md` files that already exist in
`eval/` (visible in a directory listing) — reading another model's submitted answers
before doing my own independent work would defeat the point of the exercise even though
it wasn't on the explicit forbidden list, so I treated it as in-scope for the same
prohibition.

Rough split: ~90% code (every formula was implemented and executed, including two
from-scratch closed-form derivations I worked out by hand first — geometric Asian and
floating-strike lookback — which I then verified numerically), ~10% mental (deciding
which convention/formula variant to implement, and interpreting ambiguous field names).
I switched to writing code immediately for anything beyond one-line arithmetic, and used
Monte Carlo cross-checks for the two option-pricing closed-forms I wasn't 100% sure I'd
derived correctly (geometric Asian, floating lookback) and for the GBM terminal
distribution (P031/P032).

For every formula I could sanity-check against a known reference point, I did:
P033/P034 reproduce Hull's textbook example (c≈4.759, delta≈0.7791) exactly; P007's
500-step CRR tree converges to the same Black-Scholes price to 4 decimal places;
P035/P036 implied-vol solves recover ~0.20 and ~0.25 respectively (confirming the market
prices given were generated from BS at those vols, and confirming my BS pricer is
correct); the geometric-Asian formula reduces to full volatility at N=1 and to the known
continuous-limit formula (σ/√3) as N→∞, both checked numerically; the lookback formula
was checked against a discretized Monte Carlo simulation at five step counts (100 through
25,600) and the MC price converged monotonically toward my closed-form value with error
shrinking ∝ 1/√steps — the expected rate for discrete-monitoring bias — which is strong
evidence the closed form is right.

## Hard / uncertain problems, flagged explicitly

**P053 (GARCH persistence) — genuinely unreliable, my least confident answer.**
I noticed the 100-point "returns" series is not noisy at all: it is explained to R²>99.7%
by a pure sine wave (amplitude ≈0.01, period ≈21). Fitting a GARCH(1,1) by maximum
likelihood to what is essentially deterministic data is an ill-posed exercise — the
likelihood surface is flat/ridge-like rather than having one clean optimum. I confirmed
this empirically: the `arch` package gave persistence 0.83 (Zero mean) but 0.89–0.97
(Constant mean, unstable across rescalings — a sign the optimizer wasn't reliably finding
a global optimum); my own from-scratch Gaussian QMLE, run from 5+ starting points,
converged consistently to persistence≈0.780 with a *better* (lower) negative
log-likelihood than any `arch` run, but a second initialization scheme for the variance
recursion (sample variance vs. the theoretically-correct stationary-variance start) moved
that to 0.849. I reported 0.7804 (the best log-likelihood I found across all trials,
using the more principled stationary-variance initialization) but you should treat this
as "somewhere in the 0.7–0.9 range depending on arbitrary implementation choices," not a
precise number. If the reference implementation used a different optimizer, mean spec, or
initialization, I would not expect an exact match here even with a completely correct
GARCH implementation.

**P032 (Monte Carlo CAGR) — real ambiguity in what "cagr" means.**
With years=1, there are two defensible definitions that differ substantially: (a) the
volatility-drag-adjusted / geometric-mean growth rate, CAGR = exp(μ − ½σ²) − 1 = 0.06184
(what I submitted), matching the median simulated outcome; or (b) the naive
mean-terminal-value-based rate, (E[S_T]/S_0) − 1 = e^μ − 1 ≈ 0.08329, which is what
"terminal.mean" in P031 measures for a similar setup. I went with (a) because "CAGR"
specifically as a term of art exists to distinguish compounded/geometric growth from
arithmetic mean return — the entire reason a tool would report both `terminal.mean` and
`cagr` as separate fields is presumably to illustrate that distinction — but I would not
be surprised if the reference used (b) instead. Flagging this as a coin-flip.

**P031 (Monte Carlo terminal mean).** I reported the theoretical E[S_T] = S₀e^(μT) =
110517.09 rather than a single simulated draw, since I have no way to match whatever RNG
seed a reference implementation used, and the theoretical value is the unbiased estimate
any large-enough simulation converges to. Running the same simulation with ten different
seeds at 5000 paths gave sample means ranging ~110,070–111,240, i.e., true 5000-path MC
noise on this problem is roughly ±0.5%, so don't expect exact agreement even from a
"correct" simulator.

**P041 (min-variance portfolio vol) — two stacked ambiguities.** First, no periodicity is
given for the SPY/TLT return series (10 points), so I reported the raw, un-annualized
portfolio volatility (0.0002948) rather than guessing daily-and-annualize-by-√252
(0.00468) or monthly-and-√12 (0.00102). Second, I used sample covariance (ddof=1, which
happens to be numpy's own default for `np.cov`). The unconstrained (allow-shorting)
minimum-variance weights [0.269, 0.731] happen to already be long-only, so at least the
long-only-vs-unconstrained question doesn't matter here.

**P040 (risk contribution) — naming-convention judgment call.** I initially assumed
"risk_contributions.A" would be the *fractional* contribution (summing to 1, like
weights) since for this symmetric 2-asset zero-correlation example that's a clean 0.5.
But the problem statement's own stated convention — fields not ending in `_pct` are
"plain decimal" amounts — argues against a fraction-of-1 value here, and the standard
textbook (Roncalli) definition of "risk contribution" is the *absolute* contribution to
portfolio vol, RC_i = w_i·(Σw)_i/σ(w), which sums to σ(w) itself, not to 1. I switched to
that and reported 0.070711 (=half of the portfolio vol 0.141421). 0.5 is a real
alternative if the field is fractional.

**P048 (regression coefficients.0) — could be intercept or slope.** For y=2x exactly
(intercept 0, slope 2), I had to guess whether the API's "coefficients" array is
`[intercept, slope]` (statsmodels' `add_constant` convention) or just `[slope]` with
intercept reported as a separate field (scikit-learn's `.coef_`/`.intercept_` split). I
went with the latter (coefficients.0 = 2.0, the slope) since "coefficients" as a
pluralized array name most naturally generalizes to multiple independent variables with
intercept held out separately, matching the far more common sklearn-style convention. If
wrong, the answer is simply 0.0.

**P046 (max drawdown) and P047 (VaR) — sign/statistic conventions.** I reported max_dd as
a signed negative fraction (−0.25, not +25). For VaR I used population std (ddof=0,
numpy's default when you don't specify ddof) rather than sample std (ddof=1); the two
differ by <1% here (1.6449 vs 1.6531) so it's a minor risk either way.

**P015/P016 (carry trade) — day-count convention.** I used Act/365 for the 90-day holding
period (giving 1.726%); Act/360 (money-market convention) would give 1.750%. Chose 365 as
the more common generic default absent an explicit basis.

**P022 (credit spread) — face value assumption.** Not given explicitly; I inferred
face=1000 from the price scale (950), which is the only assumption that makes economic
sense (face=100 would put the price at 9.5x par). Solved for YTM via a bracketed
root-finder (bisection/Brent) on the standard annual-coupon bond pricing equation, then
subtracted the exact-tenor-match 5y risk-free rate given in the curve (4.5%, no
interpolation needed since 5y is already a curve point).

**P011 (lookback option), P008/P009 (geometric Asian)** — both required deriving a
closed-form from first principles rather than recalling a memorized formula (Goldman-
Sosin-Gatto for the lookback; Kemna-Vorst discrete-observation formula for the Asian). I
was not fully confident in either derivation until I'd cross-checked them numerically (see
above), after which my confidence is fairly high on both.

**P051 (Hurst exponent).** Classical R/S analysis has real methodology variance (chunk
sizes chosen, overlapping vs. not, detrending), so I don't expect an exact match, but a
perfectly linear input series should give H very close to 1.0 under essentially any
reasonable implementation — I tried both power-of-two and integer-divisor chunk schemes
and got 0.9979 both times, so I'm confident in "very close to 1" even if the last couple
of decimal digits don't match a reference exactly.

## Judgment calls made without much hesitation (lower risk, noted for completeness)

- P003/P004 (APY/APR): used 365-day-year daily compounding (crypto-market convention).
- P005 (liquidation price): derived the long-liquidation formula from an equity/margin
  first-principles argument (maintenance margin as a fraction of *entry* notional, not
  mark-to-market notional) rather than just quoting a memorized formula; the two
  approaches agreed exactly, which gave good confidence: Liq = Entry×(1 − 1/Leverage +
  MMR) = 45,250.
- P006 (DEX slippage): verified my constant-product-with-fee formula algebraically
  reduces to Uniswap v2's actual `getAmountOut` formula; "price impact" defined as
  execution price vs. pre-trade spot price (the standard DEX-frontend definition), not
  marginal-price-before-vs-after.
- P010: "deviation" reported as (C−P) − (S − Ke^(−rT)), signed; magnitude is the same
  regardless of sign convention.
- P017: used the exact Fisher equation (1+real)=(1+nominal)/(1+inflation) as the problem
  explicitly named "Fisher equation" rather than the linear approximation
  nominal−inflation.
- P037/P038: max_profit/max_loss reported as signed P&L (loss negative).
- P027/P028/P029/P030: these all reduce to degenerate/clean cases (pure uptrend → RSI=100;
  constant price series → Bollinger bands collapse to the mean; constant high/low/close
  spread → ATR is trivially the constant true range), so there was very little
  methodology-dependence to worry about.

## What I'm most confident in

TVM block (P054–P059), bond pricing (P019–P021), Fibonacci retracement, option chain
ratio, IRP/PPP/Taylor rule/Fisher (P013–P018), Black-Scholes price/delta/implied vol
(P033–P036), Kelly and position-sizing (P042–P045) — all standard closed-form
calculations with no meaningful convention ambiguity, cross-checked by hand and by code
agreeing.

## What I'd flag for a human to double check first

In rough order of how much I'd bet against myself: P053 (GARCH, high uncertainty, see
above) > P032 (CAGR definition) > P041 (annualization/ddof) > P040 (fractional vs.
absolute) > P048 (coefficients ordering) > P015/P016 (day count) > P022 (face value
assumption, though I think this one is actually quite safe) > everything else.
