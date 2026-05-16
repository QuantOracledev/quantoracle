import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'Black-Scholes or Monte Carlo — which should I use?',
    plainAnswer:
      'Vanilla European calls and puts → Black-Scholes (microseconds, closed-form, exact under its assumptions). Anything path-dependent (Asian, lookback, barrier) or with stochastic vol / jumps → Monte Carlo. American options sit in the middle: binomial tree is usually better than MC for these, but MC works if you use Longstaff-Schwartz.',
    answer:
      'For vanilla European calls and puts on a single asset with constant vol and continuous trading, use Black-Scholes — it is the closed-form analytical answer, computes in microseconds, and is exact within its assumptions. For path-dependent payoffs (Asian options averaging the underlying, lookbacks tracking the max/min, knock-in/knock-out barriers, autocallables), use Monte Carlo — there is no closed-form. For stochastic volatility models (Heston, SABR) or jump-diffusion, use Monte Carlo or Fourier methods. American options are the awkward middle ground: binomial trees usually beat Monte Carlo because of the natural early-exercise check at each node, but Longstaff-Schwartz Monte Carlo handles American options when you must use MC (e.g., American-Asian hybrids).',
  },
  {
    question: 'Why is Monte Carlo so much slower than Black-Scholes?',
    plainAnswer:
      'Black-Scholes is one formula evaluation — a few microseconds. Monte Carlo simulates N paths × M time steps, then averages — typically 10⁵ to 10⁷ random draws. Even at 100M ops/sec, that is milliseconds to seconds. The trade-off is generality: BS only works for one specific problem. MC works for any payoff you can simulate.',
    answer:
      'Black-Scholes evaluates a closed-form formula — under 10 microseconds for a single option price including all Greeks. Monte Carlo simulates N price paths × M time steps with a random draw at each step, then averages the discounted payoff across paths. Typical production runs use N = 10⁴ to 10⁶ paths and M = 50 to 250 steps per path, so 10⁵ to 10⁸ random draws plus the same number of payoff evaluations. Even with vectorized numpy or a GPU, that ranges from tens of milliseconds (small problems) to seconds (full-precision exotic pricing). The trade-off is generality: BS only solves the European-vanilla-constant-vol problem. MC handles any payoff structure you can encode, any stochastic process you can simulate, any dimensional state you can fit in memory.',
  },
  {
    question: 'How many Monte Carlo paths do I actually need?',
    plainAnswer:
      'Monte Carlo error decays as 1/√N — to halve the error you have to quadruple paths. For 0.1% relative precision on a vanilla European option you need ~10⁶ paths. For 1% precision, ~10⁴ paths. Variance reduction (antithetic variates, control variates, importance sampling) buys you 5-100× effective speedup if you implement them right.',
    answer:
      'Monte Carlo standard error decays as 1/√N where N is the number of paths. Concretely, to halve the standard error you have to quadruple the path count. For 0.1% relative precision on a vanilla European option (well within typical bid-ask spread) you need around 10⁶ paths. For 1% precision around 10⁴ paths. The actual requirement depends on the payoff variance — out-of-the-money options where most paths contribute zero need vastly more paths than at-the-money options. Variance reduction techniques (antithetic variates pairing every path with its negation, control variates using a correlated analytically-tractable variable, importance sampling concentrating paths in the contributory region, stratified sampling forcing even coverage) buy 5-100× effective speedup when implemented correctly. The QuantOracle Monte Carlo calculator defaults to 1,000 paths for fast feedback; the API allows up to 2,500. For research-grade precision you would run 10⁵ or more paths in your own code.',
  },
  {
    question: 'When does Black-Scholes lie?',
    plainAnswer:
      'When any of its assumptions matters: (1) constant vol — real markets have implied vol smiles. (2) lognormal returns — fat tails are real. (3) no jumps — earnings, FOMC, takeovers all jump. (4) continuous trading — gaps over weekends and overnight. (5) European exercise — most US equity options are American. The further your problem is from these assumptions, the more BS systematically mis-prices.',
    answer:
      'Black-Scholes is exact under its assumptions but those assumptions are wrong in detail for real markets. The five common failure modes: (1) Constant volatility — actual implied vol exhibits a smile (deep OTM options trade richer than ATM options) and a skew (puts richer than calls on equities). BS prices at a single vol cannot match both. (2) Lognormal returns — actual return distributions have fat tails (kurtosis > 3) and negative skew, so BS underprices OTM puts and OTM calls relative to ATM. (3) No jumps — earnings releases, FOMC announcements, M&A news all produce sudden gaps. BS assigns zero probability to these. (4) Continuous trading — markets are closed nights and weekends, and even during sessions liquidity is finite; you cannot rebalance continuously. (5) European exercise — most US equity options are American and have early-exercise premium that BS ignores. The corrections layer on top of BS rather than replace it: vol surfaces interpolate implied vol across strikes and tenors, jump-diffusion models add explicit jump terms, stochastic-vol models let σ evolve. Monte Carlo can natively incorporate all of these.',
  },
  {
    question: 'What is the "control variate" trick for Monte Carlo?',
    plainAnswer:
      'You price the option you care about (X) AND a correlated option with a known analytical price (Y). Adjust the X estimate by the MC error on Y: X_adjusted = X_mc + (Y_analytical − Y_mc) × β. The closer X and Y are correlated, the more variance you cancel. For an exotic option you often use the European version of the same payoff as the control.',
    answer:
      'A control variate is a related random variable whose expected value you already know analytically. To price an option X by Monte Carlo using a control variate Y: (1) Simulate paths and compute both X_mc and Y_mc estimates from the same paths. (2) Compute the optimal weight β = Cov(X, Y) / Var(Y) (empirical from your paths). (3) Return X_corrected = X_mc + β · (Y_analytical − Y_mc). The variance of X_corrected can be much smaller than X_mc — by a factor of 1/(1 − ρ²) where ρ is the correlation between X and Y. The closer the control to the target, the bigger the variance reduction. For an Asian option, the geometric Asian has a closed-form BS-like solution and is highly correlated with the arithmetic Asian you actually care about — this single control variate often cuts MC error by 50-100×. For barrier options, the corresponding European option is a natural control.',
  },
  {
    question: 'Can Monte Carlo handle American options?',
    plainAnswer:
      'Yes, via the Longstaff-Schwartz algorithm (2001). At each potential exercise date, regress the continuation value on basis functions of the state, then exercise where intrinsic > regressed continuation. It works but is harder to get right than a binomial tree, and tree methods are usually faster for single-asset Americans. Longstaff-Schwartz becomes essential for path-dependent Americans (e.g., American-Asian hybrids) where trees cannot enumerate states efficiently.',
    answer:
      'Yes, via the Longstaff-Schwartz Method (LSM, 2001). The challenge with American MC is that early-exercise requires you to know future continuation values, which is awkward in forward-simulated paths. LSM works backward: at each potential exercise date t, regress the discounted continuation value (computed from later paths) on basis functions of the current state (typically polynomials in spot, time, and other relevant state). At each path, exercise if the intrinsic value exceeds the regression-predicted continuation value. The method is consistent and converges as paths → infinity, though convergence is slower than binomial trees for single-asset American problems. LSM becomes essential when the option is path-dependent AND American (e.g., American-Asian hybrids, callable convertible bonds with path-dependent strike), or when the state dimension is high enough that trees become impractical (multi-asset Americans).',
  },
  {
    question: 'Are the Greeks computed differently?',
    plainAnswer:
      'BS Greeks are closed-form one-liners (delta = N(d₁), etc.). MC Greeks come from (a) bumping the input and re-running — slow, noisy, but works for everything; (b) pathwise derivative — exact when the payoff is differentiable; or (c) likelihood ratio — for discontinuous payoffs. For production MC, use pathwise where you can, finite difference where you must.',
    answer:
      'Black-Scholes Greeks have explicit closed-form expressions: delta = e^(-qT) N(d₁), gamma = e^(-qT) φ(d₁) / (S σ √T), vega = S e^(-qT) φ(d₁) √T, etc. — microsecond compute, exact within BS assumptions. Monte Carlo Greeks have three main methods: (1) Finite difference — bump the input by ±ε, re-run MC, compute (V₊ − V₋) / (2ε). Simple, works for any payoff, but variance is amplified because you are differencing two noisy estimates. (2) Pathwise derivative method — analytically differentiate the payoff function and the path generator, then average the derivative directly. Exact (zero discretization bias) when the payoff is differentiable, much lower variance than FD, but requires problem-specific implementation. (3) Likelihood ratio method — differentiate the path density rather than the payoff, useful for discontinuous payoffs (digitals, barriers). For production MC pricing the standard is pathwise where applicable, falling back to LR for discontinuous payoffs, with finite difference as the last-resort baseline.',
  },
  {
    question: 'What about Quasi-Monte Carlo?',
    plainAnswer:
      'Replace random numbers with low-discrepancy sequences (Sobol, Halton, Faure). These cover the unit hypercube more evenly than random, which makes the error decay closer to 1/N instead of 1/√N. For low-dimensional problems (≤ 30 dimensions) Quasi-MC can be 10-1000× faster than standard MC. Past 50 dimensions standard MC is competitive.',
    answer:
      'Quasi-Monte Carlo (QMC) replaces pseudo-random numbers with low-discrepancy sequences — Sobol, Halton, Faure, or scrambled variants. These deterministic sequences cover the unit hypercube more evenly than pseudo-random draws, which makes the numerical error decay closer to 1/N (vs the standard 1/√N for true random MC). For low-dimensional problems (effective dimension under 30 or so) QMC can be 10-1000× faster than standard MC at the same accuracy. The benefit erodes in high dimensions because low-discrepancy sequences lose their advantage as dimensionality grows. Scrambled Sobol with Brownian bridge construction is the current production-grade choice for option pricing — it gives near-perfect performance for moderately path-dependent options up to a few hundred time steps. QMC has no good convergence theory for discontinuous payoffs (barriers), so for those plain MC is still safer.',
  },
  {
    question: 'Can I just use Black-Scholes and accept the error?',
    plainAnswer:
      'For vanilla short-dated liquid equity options where BS gets you within $0.05-0.10 of the right answer and the bid-ask spread is wider, yes — BS is fine. For exotic options where the BS error can be 20-50%, no. For long-dated options or options on a basket where path dependency or correlation matters, the BS error compounds and you need MC or specialized models. The honest practitioner uses BS as a benchmark and corrects upward for the specific source of mis-pricing.',
    answer:
      'It depends entirely on how big the error is relative to the bid-ask spread and your risk tolerance. For vanilla short-dated liquid US equity options, BS typically gets you within $0.05-$0.10 of the implied-vol-fitted price, and the bid-ask spread is usually wider than that, so BS is fine for indicative pricing. For exotics — barrier options near the barrier, lookbacks, Asians far from spot — the BS approximation (or its naive analog) can be off by 20-50%, so MC or specialized models are mandatory. For long-dated options or basket options, the BS error compounds with time and dimensionality, and you cannot reliably hedge what you cannot price. The honest practitioner uses BS as the entry-level benchmark, runs MC or specialized models when the payoff structure or market conditions demand it, and trusts neither beyond what the model assumptions support.',
  },
  {
    question: 'Which QuantOracle calculators do these?',
    plainAnswer:
      'Black-Scholes Calculator: closed-form European pricing with all Greeks, microseconds. Monte Carlo Simulation Calculator: GBM path simulation for portfolio outcomes (P5/P95, prob of ruin, etc.). For American options use the American Option Calculator (binomial). The full API has /v1/options/price (BS), /v1/simulate/montecarlo (GBM MC), /v1/derivatives/binomial-tree (CRR).',
    answer:
      'Three relevant tools: (1) Black-Scholes Calculator — closed-form European vanilla pricing with full Greeks (delta, gamma, vega, theta, rho), microsecond compute. (2) Monte Carlo Simulation Calculator — GBM path simulation for portfolio outcomes with contributions and withdrawals, returning the distribution of terminal values (P5/P25/median/P75/P95), probability of loss, probability of ruin, CAGR. Not designed for option pricing specifically but uses the same MC framework. (3) American Option Calculator — CRR binomial tree for early-exercise American options, the recommended approach for single-asset American problems. The full API exposes /v1/options/price for BS, /v1/simulate/montecarlo for path simulation, /v1/derivatives/binomial-tree for the tree method, plus barrier, Asian, and lookback endpoints for the specific exotic option types where MC is the right answer.',
  },
];
