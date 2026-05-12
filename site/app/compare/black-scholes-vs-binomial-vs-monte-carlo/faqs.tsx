import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'Which option pricing method should I use?',
    plainAnswer:
      'European vanilla → Black-Scholes (it is the closed-form answer, milliseconds, exact). American option with early exercise → Binomial tree. Exotic / path-dependent / multi-asset → Monte Carlo. For accuracy on European with stochastic vol or jumps, you also need Monte Carlo or a PDE solver.',
    answer:
      'Decision tree: (1) European vanilla call/put on a single asset under Black-Scholes assumptions → use Black-Scholes. It is the closed-form analytical answer, computes in microseconds, and is exact within its assumptions. (2) American option with possible early exercise (most equity options, especially on dividend-paying stocks) → Binomial tree. The lattice naturally handles the early-exercise decision at each node. (3) Path-dependent options (Asian, lookback, barrier), basket/multi-asset options, or options under stochastic vol or jump-diffusion models → Monte Carlo. It is slower but flexible enough to handle any payoff structure.',
  },
  {
    question: 'Why do we still use Black-Scholes if it has known flaws?',
    plainAnswer:
      'Because under its assumptions, Black-Scholes gives the EXACT answer in closed form, and those assumptions are close enough for short-dated liquid options. The model is wrong but useful. Every working options trader thinks in BS-implied terms (vega, delta, theta) even when they know the underlying isn\'t log-normal. The fixes (stochastic vol, jumps) are corrections to BS, not replacements.',
    answer:
      'Black-Scholes is the global lingua franca of options because under its assumptions it gives the EXACT analytical answer in milliseconds. The assumptions (constant volatility, log-normal returns, no jumps, continuous trading, no dividends) are wrong in detail but close enough for short-dated liquid options. Every working options trader thinks in BS-implied terms — delta, gamma, vega, theta, rho — even when they know the underlying is not log-normal. The well-known fixes (stochastic vol models like Heston, jump-diffusion like Merton or Bates, local vol surfaces) are corrections layered on top of BS, not replacements. The framework is too well entrenched and too useful to abandon.',
  },
  {
    question: 'What is a binomial tree and how does it converge to Black-Scholes?',
    plainAnswer:
      'A binomial tree discretizes the future into N steps where the stock goes up by factor u or down by factor d at each step. You compute the option value at expiry leaves and work backward through the tree using risk-neutral probabilities. As N → infinity and the time step shrinks, the lattice converges to geometric Brownian motion and the binomial price converges to Black-Scholes.',
    answer:
      'A binomial tree (Cox-Ross-Rubinstein, 1979) discretizes the future into N time steps. At each step the stock price moves up by factor u = exp(σ√Δt) or down by factor d = 1/u with risk-neutral probabilities p = (exp(rΔt) − d)/(u − d) and 1-p. You compute the option payoff at the expiry leaves of the tree, then work backward step by step — at each node, the option value is the risk-neutral expected value of the next step, discounted by exp(-rΔt). For American options you check at each node whether early exercise beats holding. As N → infinity and Δt → 0 the lattice converges to geometric Brownian motion, and the binomial price converges to Black-Scholes. With 500 steps the convergence is usually within $0.01 of BS.',
  },
  {
    question: 'When does Monte Carlo win over binomial?',
    plainAnswer:
      'Monte Carlo wins for path-dependent options (Asian: payoff depends on average price; lookback: depends on max or min; barrier: depends on whether the path crosses a level). Binomial trees can technically handle these but the tree size explodes. Monte Carlo also handles multi-asset baskets, stochastic vol, jumps — anything where the option value isn\'t purely a function of the terminal price.',
    answer:
      'Monte Carlo wins for path-dependent options where the payoff depends on the entire price path, not just the terminal value. Examples: Asian options (payoff depends on time-averaged price), lookback options (payoff depends on the max or min along the path), barrier options (payoff depends on whether the path crosses a threshold). Binomial trees can theoretically handle these by recombining the lattice with extra state variables but the size grows exponentially. Monte Carlo also wins for multi-asset basket options (correlated paths), stochastic volatility models, jump-diffusion processes, and any custom payoff structure. The downside: Monte Carlo is much slower (typically 10,000+ paths needed for stable prices) and you need variance reduction techniques (antithetic sampling, control variates) for production use.',
  },
  {
    question: 'How many paths does Monte Carlo need?',
    plainAnswer:
      'Standard error scales as 1/√N. For a vanilla option with ~10% volatility, 10,000 paths typically gets you within $0.01 standard error. For exotic options with higher vol or longer expiries, 50,000-100,000 paths. With variance reduction (antithetic + control variates) you can often get 10-20x effective speedup, so 5,000 paths can give comparable accuracy to 50,000 naive paths.',
    answer:
      'Monte Carlo standard error scales as 1/√N — to halve the error you need 4x more paths. For a vanilla option with ~10% volatility and 1-year expiry, 10,000 paths typically gets you within $0.01 standard error of the true price. For exotic options with higher vol, longer expiries, or fatter payoffs, 50,000-100,000 paths is more typical. With variance reduction techniques (antithetic sampling, control variates, importance sampling) you can often get 10-20x effective speedup, meaning 5,000 paths with variance reduction can match 50,000 naive paths. Production options-pricing engines almost always use variance reduction.',
  },
  {
    question: 'Do Black-Scholes Greeks transfer to binomial and Monte Carlo prices?',
    plainAnswer:
      'Yes, but you compute them differently. For BS the Greeks have closed forms. For binomial trees, Greeks come from finite differences across adjacent nodes (delta from the up-down node spread, gamma from second differences). For Monte Carlo, Greeks come from "bumping" inputs and re-pricing or from pathwise derivatives. Pathwise / likelihood-ratio methods are faster than naive bumping.',
    answer:
      'Yes, but you compute them differently. For Black-Scholes the Greeks have closed forms (delta = N(d1), gamma = φ(d1)/(Sσ√T), etc.). For binomial trees, Greeks come from finite differences across adjacent nodes — delta from the spread between up and down nodes at the first step, gamma from second differences at the first three nodes. For Monte Carlo, the simplest Greek estimation is "bumping" — re-price with input perturbed by epsilon, take (price_up − price_down) / (2·epsilon). Naive bumping is slow because each Greek requires a full re-pricing. Pathwise differentiation and likelihood-ratio methods (Glasserman 2003) compute Greeks during the original simulation without re-running it. Production Monte Carlo engines use these.',
  },
  {
    question: 'Why does the binomial tree price converge so slowly to BS?',
    plainAnswer:
      'For European options, binomial converges at order O(1/N) — halving the error requires doubling steps. With 100 steps you typically get 4-5 decimal places of accuracy. The convergence is oscillatory (the error alternates sign as you add steps) which makes Richardson extrapolation effective for further speedup. Tilley and Broadie-Detemple alternative trees converge faster than CRR.',
    answer:
      'Convergence of the standard CRR binomial tree to Black-Scholes is order O(1/N), so halving the error requires doubling the number of steps. With 100 steps you typically get 4-5 decimal places of accuracy on vanilla calls; with 500 steps about 6 digits. The convergence is oscillatory — the error alternates sign as you add steps, especially for options near critical strike values. Richardson extrapolation (combining the prices from N and 2N steps) eliminates the leading error term and gives effectively O(1/N²) convergence. Alternative tree constructions (Tilley, Broadie-Detemple) converge faster than the original CRR. In practice 200-500 CRR steps is enough for most American options.',
  },
  {
    question: 'What about PDE / finite difference methods?',
    plainAnswer:
      'Black-Scholes pricing can also be solved via the BS partial differential equation using finite difference methods (explicit, implicit, Crank-Nicolson). PDE methods are fast and handle American exercise natively. They are competitive with binomial trees for one-dimensional problems but become harder to use for multi-asset (the dimensionality problem). Most production systems use trees or Monte Carlo rather than PDE for that reason.',
    answer:
      'The Black-Scholes PDE (∂V/∂t + ½σ²S²·∂²V/∂S² + rS·∂V/∂S − rV = 0) can be solved numerically via finite difference methods — explicit, implicit, or Crank-Nicolson schemes on a discretized (S, t) grid. PDE methods are fast, second-order accurate with Crank-Nicolson, and handle American exercise natively (via constrained relaxation or penalty methods). For single-asset options they are competitive with binomial trees. The major drawback is the &quot;curse of dimensionality&quot;: a 5-asset basket option requires a 5-dimensional grid, which becomes computationally infeasible. Monte Carlo scales linearly in dimension, so it wins for high-dimensional problems. Most production systems use trees or Monte Carlo rather than PDE for this reason, though PDE remains common in academia.',
  },
  {
    question: 'How do I price an American option that doesn\'t have a closed form?',
    plainAnswer:
      'Three options. (1) Binomial tree — most common, 200-500 steps usually suffice. (2) Longstaff-Schwartz Monte Carlo — uses regression to estimate continuation value, then makes exercise decisions backward. Better for high-dimensional or path-dependent American options. (3) Finite difference PDE — fast for single-asset American options. The QuantOracle American Option Calculator uses a CRR binomial tree.',
    answer:
      'Three standard approaches: (1) Binomial tree (Cox-Ross-Rubinstein 1979) — the canonical method, 200-500 steps usually suffice, easy to implement, well understood. (2) Longstaff-Schwartz Monte Carlo (Longstaff &amp; Schwartz 2001) — uses regression on basis functions to estimate the continuation value at each step, then makes exercise decisions backward. This is the standard method for high-dimensional or path-dependent American options where trees become infeasible. (3) Finite difference PDE solvers — fast for single-asset American options, handle early exercise via constrained relaxation. The QuantOracle American Option Calculator uses a CRR binomial tree.',
  },
  {
    question: 'Which calculators does QuantOracle have for these?',
    plainAnswer:
      'Black-Scholes Calculator (closed-form, vanilla European). American Option Calculator (binomial tree, handles early exercise and dividends). Monte Carlo Simulation Calculator (general-purpose simulation for any path-dependent payoff). All three are free and use the same deterministic API engine.',
    answer:
      'Black-Scholes Calculator — closed-form pricing for European vanilla calls and puts with all Greeks. American Option Calculator — Cox-Ross-Rubinstein binomial tree handling early exercise, dividends, and arbitrary tree depth. Monte Carlo Simulation Calculator — general-purpose simulation for any path-dependent payoff or distribution. The Implied Volatility Calculator also rounds out the toolkit by solving for σ given a market price. All four are free and use the same deterministic QuantOracle API.',
  },
];
