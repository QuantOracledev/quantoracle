import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'Black-Scholes or binomial tree — which should I use?',
    plainAnswer:
      'European vanilla options on a single asset → Black-Scholes (it is the closed-form answer, microseconds, exact within its assumptions). American options with possible early exercise → binomial tree. For most equity-options work the rule is: use BS when you can, use binomial when you must.',
    answer:
      'European vanilla calls and puts on a single asset under Black-Scholes assumptions → use Black-Scholes. It is the closed-form analytical answer, computes in microseconds, exact within its assumptions. American options with possible early exercise (most US equity options, especially on dividend-paying stocks and most puts) → binomial tree. The lattice naturally handles the early-exercise decision at each node. For most equity-options work the rule is: use BS when you can, use binomial when you must. The binomial tree converges to BS as the number of steps grows, so they agree on European options at sufficient resolution.',
  },
  {
    question: 'Why does Black-Scholes still dominate after 50+ years?',
    plainAnswer:
      'Under its assumptions, BS gives the EXACT answer in closed form. The assumptions (constant vol, log-normal returns, no jumps, continuous trading) are wrong in detail but close enough for short-dated liquid options. Every working options trader thinks in BS-implied terms (delta, gamma, vega, theta) even when they know the underlying isn\'t log-normal. The fixes (stochastic vol, jumps) layer on top of BS, not replace it.',
    answer:
      'Black-Scholes is the global lingua franca of options because under its assumptions it gives the EXACT analytical answer in milliseconds. The assumptions (constant volatility, log-normal returns, no jumps, continuous trading, no dividends or simple yield) are wrong in detail but close enough for short-dated liquid options. Every working options trader thinks in BS-implied terms — delta, gamma, vega, theta, rho — even when they know the underlying is not log-normal. The well-known fixes (stochastic vol models like Heston, jump-diffusion like Merton or Bates, local vol surfaces) are corrections layered on top of BS, not replacements. The framework is too entrenched and too useful to abandon.',
  },
  {
    question: 'What is a binomial tree?',
    plainAnswer:
      'A binomial tree discretizes the future into N steps where the stock goes up by factor u or down by factor d at each step. You compute the option value at the expiry leaves and work backward through the tree, at each node taking the discounted risk-neutral expected value. For American options you also check at each node whether early exercise beats holding.',
    answer:
      'A binomial tree (Cox-Ross-Rubinstein, 1979) discretizes the future into N time steps. At each step the stock price moves up by factor u = exp(σ√Δt) or down by factor d = 1/u with risk-neutral probabilities p = (exp(rΔt) − d)/(u − d) and 1-p. You compute the option payoff at the expiry leaves of the tree, then work backward step by step — at each node, the option value is the risk-neutral expected value of the next step, discounted by exp(-rΔt). For American options you check at each node whether early exercise beats holding. As N → infinity and Δt → 0 the lattice converges to geometric Brownian motion, and the binomial price converges to Black-Scholes.',
  },
  {
    question: 'How many steps does the binomial tree need?',
    plainAnswer:
      'Standard CRR binomial converges at order O(1/N). With 50 steps you get a few cents of error vs BS on vanilla European options. With 200 steps you get pennies. With 500 steps you get sub-cent accuracy. For most production use 500 steps is plenty. The convergence is oscillatory (error alternates sign as N grows), which lets Richardson extrapolation give effectively O(1/N²) convergence by combining N and 2N prices.',
    answer:
      'Standard CRR binomial tree converges at order O(1/N), so halving the error requires doubling the number of steps. With 50 steps you typically get $0.05-0.10 error vs BS on vanilla European options. With 200 steps about $0.01. With 500 steps sub-cent accuracy. For most production options pricing 500 steps is plenty. The convergence is oscillatory — the error alternates sign as you add steps, especially for options near critical strike values. Richardson extrapolation (combining the prices from N and 2N steps) eliminates the leading error term and gives effectively O(1/N²) convergence. Alternative tree constructions (Tilley smoothed trees, Broadie-Detemple) converge faster than the original CRR but the CRR is what you find in most textbooks and libraries.',
  },
  {
    question: 'When does Black-Scholes break?',
    plainAnswer:
      'When any of its assumptions fails enough to matter: (1) American options with possible early exercise — BS has no closed form for American puts or American calls on dividend-paying stocks. (2) Stochastic volatility, where σ varies over time. (3) Jumps in the underlying. (4) Discrete dividends (BS assumes continuous yield). (5) Path-dependent payoffs. (6) Multi-asset options. In each case you go to binomial trees, finite-difference PDE solvers, or Monte Carlo.',
    answer:
      'Black-Scholes breaks when any of its assumptions fails enough to matter. (1) American options with possible early exercise — BS has no closed form for American puts or American calls on dividend-paying stocks; the binomial tree handles these natively by checking exercise vs holding at each node. (2) Stochastic volatility — Heston model, SABR, etc. — where σ varies over time. (3) Jumps in the underlying (Merton 1976, Kou 2002). (4) Discrete dividends (BS handles only continuous yield cleanly). (5) Path-dependent payoffs (Asian, lookback, barrier). (6) Multi-asset options. For (1) and (4), use binomial trees. For (2), (3), (5), (6), you need finite-difference PDE solvers, Monte Carlo, or specialized models.',
  },
  {
    question: 'What about American options on non-dividend stocks?',
    plainAnswer:
      'For American CALLS on non-dividend stocks, early exercise is never optimal, so the American price equals the European price — Black-Scholes works directly. For American PUTS, early exercise can be optimal at any time, and BS systematically under-prices. Always use the binomial tree for American puts.',
    answer:
      'For American CALLS on non-dividend stocks, a classic result (Merton 1973) shows that early exercise is never optimal — exercising early forfeits time value with no offsetting benefit. So the American call price equals the European call price, and Black-Scholes works directly. For American PUTS, early exercise can be optimal whenever the stock falls far enough below the strike (you might want to lock in the gain before interest costs erode it). BS systematically under-prices American puts. Always use the binomial tree for American puts; for American calls on non-dividend stocks BS is fine, but if there are dividends use the binomial tree.',
  },
  {
    question: 'Do the Greeks transfer cleanly between BS and binomial?',
    plainAnswer:
      'Conceptually yes; computationally different. For BS the Greeks have closed forms. For binomial, Greeks come from finite differences across adjacent lattice nodes — delta from the spread between up-node and down-node prices at step 1, gamma from second differences. Vega and rho require re-running the tree with σ or r perturbed. For consistent Greeks at production speed, binomial with finite differences is the standard.',
    answer:
      'Conceptually yes — the same Greeks (delta, gamma, vega, theta, rho, vanna, charm, etc.) apply. Computationally different. For Black-Scholes the Greeks have closed-form formulas: delta = N(d1), gamma = φ(d1)/(Sσ√T), vega = S·φ(d1)·√T, theta has a longer closed-form expression. For the binomial tree, Greeks come from finite differences across adjacent lattice nodes — delta from the spread between up-node and down-node prices at step 1, gamma from second differences across the three nodes at step 2. Vega and rho require re-running the tree with σ or r perturbed by a small amount. The QuantOracle Black-Scholes Calculator returns closed-form Greeks; the American Option Calculator computes Greeks via finite differences on the tree.',
  },
  {
    question: 'What about the Black-Scholes PDE?',
    plainAnswer:
      'The Black-Scholes equation can be solved numerically via finite-difference methods on a discretized (stock price, time) grid — explicit, implicit, or Crank-Nicolson schemes. PDE methods are fast for single-asset options and handle early exercise via constrained relaxation. They compete with binomial trees for one-dimensional problems but lose on multi-asset because the grid grows exponentially in dimensions.',
    answer:
      'The Black-Scholes PDE (∂V/∂t + ½σ²S²·∂²V/∂S² + rS·∂V/∂S − rV = 0) can be solved numerically via finite-difference methods on a discretized (stock price, time) grid. Standard schemes: explicit, implicit, or Crank-Nicolson. PDE methods are fast, second-order accurate with Crank-Nicolson, and handle American exercise natively via constrained relaxation or penalty methods. They are competitive with binomial trees for single-asset options. The major drawback is the "curse of dimensionality": a 5-asset basket option requires a 5-dimensional grid, which becomes computationally infeasible. For single-asset options, PDE is a fine alternative to binomial; for multi-asset problems, Monte Carlo wins because it scales linearly with dimension.',
  },
  {
    question: 'What if I want to handle stochastic volatility or jumps?',
    plainAnswer:
      'You need extensions beyond standard BS and binomial. The two main families: stochastic-volatility models (Heston, SABR) — capture the volatility smile observed in real options markets; jump-diffusion models (Merton, Kou, Bates) — capture sudden price gaps. These can be priced via Fourier transform methods, simulation, or specialized PDE solvers. Standard binomial trees don\'t handle either elegantly.',
    answer:
      'You need extensions beyond standard BS and binomial. The two main families: (1) Stochastic volatility models — Heston (1993), SABR, GARCH-based models — these let σ vary over time and capture the volatility smile observed in real options markets. Pricing typically via Fourier transform methods (Carr-Madan), or simulation, or specialized PDE solvers. (2) Jump-diffusion models — Merton 1976, Kou 2002, Bates (combines stochastic vol with jumps) — capture sudden price gaps that BS misses. Closed-form solutions exist for some of these (Merton has a series expansion). Standard binomial trees do not handle either family elegantly; you would extend to trinomial trees, implied trees, or move to PDE/Monte Carlo methods. For practical work most desks use BS as a benchmark and add corrections (vol smile interpolation, jump-diffusion adjustments) on top.',
  },
  {
    question: 'Which QuantOracle calculators do these?',
    plainAnswer:
      'Black-Scholes Calculator: closed-form European vanilla pricing with all Greeks, instant. American Option Calculator: CRR binomial tree, handles early exercise, dividends, and arbitrary depth (default 200 steps). Implied Volatility Calculator: solves for σ given a market price using the BS formula via Brent\'s method.',
    answer:
      'Three relevant calculators: (1) Black-Scholes Calculator — closed-form European vanilla pricing with all Greeks (delta, gamma, vega, theta, rho), microsecond compute. (2) American Option Calculator — Cox-Ross-Rubinstein binomial tree handling early exercise, dividends, and arbitrary tree depth (default 200 steps; configurable). Returns Greeks via finite differences on the tree. (3) Implied Volatility Calculator — solves for σ given a market option price using the BS formula via Brent root-finding. All three are free, no signup, return JSON from the same deterministic QuantOracle API.',
  },
];
