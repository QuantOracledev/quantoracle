# Can a language model do quantitative finance without us?

**Run 2026-07-27. 59 problems, answer key from the citation-backed verification suite.**

QuantOracle was built on two premises: that its per-call price undercut the token cost of an
agent doing the maths itself, and — the stronger claim — that a deterministic implementation is
**more accurate** than a language model approximating.

This measures the second claim. It was designed to be capable of falsifying it, and it did.

## Method

Problems come from `tests/accuracy_benchmarks.py`, whose expected values are textbook results with
citations (Hull, Kemna-Vorst, Goldman-Sosin-Gatto, Bollerslev). Three models — Opus, Sonnet, Haiku —
each solved all 59 as an agent would: **with full tool access, free to write and run code.** That is
the point. The realistic alternative to calling this API is not a model doing mental arithmetic; it
is a model writing fifteen lines of Python.

Guards against a self-flattering result:

- **No answer leakage.** Many test *names* contain the answer (`"call delta = N(d1) = 0.7791"`), so
  prompts were built from endpoint + inputs + requested field only — never name or citation.
  Verified programmatically.
- **Generous conventions.** Unit rules stated up front, and answers numerically right but scaled by
  100 score as SCALE, not WRONG. That measures prompt ambiguity, not capability.
- **Sanity cases tiered out.** The suite contains deliberate degenerate checks (all prices identical
  so the Bollinger band is flat; y=2x so the slope is 2). Correct as unit tests, useless for telling
  models apart, and they would inflate every score. 54 core, 5 sanity.
- **Answer key withheld.** It lives in this repo; each solver was forbidden to read it and told a
  `null` was strictly better than a looked-up answer. All three independently reported computing
  from first principles, and Sonnet volunteered that it also avoided the other models' answer files.
- **Wrong answers bucketed by magnitude**, not counted. 0.3% off is noise; 15% off is a liquidation.

## Result

| Model | Core correct | Catastrophic (>20% off) | Sign flips |
|---|---|---|---|
| **Opus** | **51/54 — 94.4%** | **0** | 0 |
| **Sonnet** | **50/54 — 92.6%** | 1 | 0 |
| **Haiku** | 44/54 — 81.5% | **6** | 1 |

**All three wrote code. None attempted mental arithmetic.** Opus and Sonnet independently put their
split at ~90% executed code, ~10% reasoning — and both said the hard part was choosing the *formula
and convention*, not the arithmetic.

**Neither frontier model made a single arithmetic error.** Every one of Opus's three misses was a
convention choice or an ill-posed problem:

- `edge` — 0.21 vs 21: percent-vs-decimal
- `current_zscore` — 1.4142 vs 1.265: population vs sample standard deviation
- GARCH `persistence` — the input "returns" are >99.7% a pure sine wave, so the MLE sits on a
  boundary. Opus: *"anything in 0.78–0.99 is defensible."*

## What this means for the accuracy claim

**Against frontier models, it does not hold.** Not because they are secretly good at mental maths —
because they never attempt mental maths. Give Opus a Black-Scholes problem and it writes the
formula and runs it, exactly as our implementation does. Same formula, same answer.

**Against cheap models, it does hold.** Haiku produced six catastrophic errors including a lookback
price 317% too high, and a **sign-flipped** price impact — a plausible-looking number pointing the
wrong way. If the caller is a small model, deterministic computation is worth real money.

**The strongest surviving argument is Opus's own**, unprompted:

> *"my recalled closed forms are roughly 90% reliable and the 10% failure mode is **silent**."*

It recalled Goldman-Sosin-Gatto for a lookback and got 19.13. It cross-checked with Monte Carlo,
found a 13% disagreement, traced it to two un-negated arguments, and re-derived the answer by
integrating the exact law of the running minimum. It only caught that because it *chose* to verify.
An agent that doesn't verify ships the wrong number with total confidence.

That is a real argument for a deterministic service — but note it is an argument about **silent
failure**, not about accuracy per se, and a careful agent defuses it on its own.

## The finding we did not go looking for

Nine problems where the models **agree with each other and disagree with us**. Independent solvers
converging on a value that is not ours is evidence about *our* implementation.

| Problem | Ours | Models agree on | Gap | Our test tolerance |
|---|---|---|---|---|
| Lookback option price | 14.0 | **16.9095** | 20.8% | **±28.6%** |
| Asian option price | 5.5 | **5.9402** | 8.0% | **±9.1%** |
| Credit spread (bps) | 100.0 | **169.32** | 69.3% | **±80.0%** |
| Hurst exponent | 0.85 | 1.0 | 17.6% | ±23.5% |
| GARCH persistence | 0.9 | 0.788 | 12.5% | ±11.1% |
| z-score | 1.265 | 1.4142 | 11.8% | ±0.1% |
| Risk contribution | 0.5 | 0.0707 | 85.9% | convention |
| Kelly `edge` | 21.0 | 0.21 | 99.0% | convention |

**The top three are the serious ones, and the pattern is damning: in each case our own test
tolerance is wider than the disagreement.** The lookback test accepts anything from 10 to 18 — it
passes our 14.0 *and* the models' 16.91 and cannot tell them apart. A suite published as proof of
mathematical correctness does not actually constrain the answers where correctness is hardest.

On the lookback specifically, two frontier models independently derived **16.9095** — agreeing to
four decimals via different routes (exact integration of the running-minimum law; Monte Carlo
convergence verified at five step counts at the theoretical 1/√steps rate). That is stronger
verification than our own test provides. **Our implementation is more likely wrong than theirs.**

The remainder are genuine convention forks — ddof, annualisation, absolute vs fractional risk
contribution, which end a Fibonacci level is measured from. There is no single right answer; but
being the minority of one against three independent solvers is worth knowing.

## Honest conclusion

The accuracy premise **does not survive** as a general claim. It narrows to three real but much
smaller things:

1. **Cheap-model callers** — where errors are frequent, large, and sometimes sign-flipped.
2. **Silent-failure insurance** — recalled closed forms fail ~10% of the time without warning, and
   only a verifying agent catches it.
3. **Convention pinning** — consistency, not correctness. A weaker thing to sell.

None of those support per-call pricing against an agent that can run Python. They point instead at
what tokens cannot replicate at all: **persistence, live data, and elapsed time.** An agent cannot
monitor a position for thirty days by thinking harder.

**The most valuable output of this exercise was not the marketing claim it was meant to support.
It was three probable bugs in our own calculators, hidden by tolerances too loose to catch them.**

## Reproducing

```
python eval/extract_cases.py > eval/cases.json
python eval/build_problems.py --per 6
# hand eval/problems.md to a solver; collect eval/answers-<name>.json
python eval/score.py --json eval/results.json
```
