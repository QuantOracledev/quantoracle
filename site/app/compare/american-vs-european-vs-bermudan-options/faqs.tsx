import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What\'s the difference between American, European, and Bermudan options?',
    plainAnswer:
      'European options can only be exercised at expiration. American options can be exercised any time before expiration. Bermudan options are in between — they can be exercised on a set of specific dates before expiry, not continuously. The exercise right matters because the option holder can choose the optimal moment.',
    answer:
      'European options can only be exercised at expiration — one chance, on the expiry date. American options can be exercised any time between purchase and expiration — continuous exercise right. Bermudan options are the middle ground: they can be exercised on a specific schedule of dates (e.g., once a month, or on the first business day of each quarter) before expiry, not continuously. The exercise right matters because the option holder gets to choose the optimal moment to exercise (or not), and more flexibility is always worth at least as much as less flexibility — so American ≥ Bermudan ≥ European in price for the same underlying parameters.',
  },
  {
    question: 'Which type is more valuable?',
    plainAnswer:
      'For the same parameters: American ≥ Bermudan ≥ European. More exercise flexibility is never worse for the holder, sometimes strictly better. The price difference is called the "early exercise premium." For calls on non-dividend stocks the premium is zero (Merton 1973 proved early exercise is never optimal). For puts and calls on dividend-paying stocks, the premium is positive.',
    answer:
      'For the same underlying parameters (spot, strike, time, rate, vol): American ≥ Bermudan ≥ European in price. More exercise flexibility is never worse for the holder, sometimes strictly better. The price difference is called the "early exercise premium." Three rules: (1) For American calls on non-dividend-paying stocks, the early exercise premium is zero (Merton 1973 proved early exercise is never optimal — you forfeit time value with no offsetting benefit). So American calls on non-dividend stocks = European calls. (2) For American puts on any stock, early exercise can be optimal when the stock falls far enough below strike — locking in the gain beats waiting for further decline. (3) For American calls on dividend-paying stocks, early exercise just before a large dividend can be optimal to capture the dividend. In cases (2) and (3), American > European, and the gap is the early exercise premium.',
  },
  {
    question: 'Why do American puts have an early exercise premium?',
    plainAnswer:
      'When a stock falls far below the put\'s strike, the put becomes deep ITM. The holder can either exercise now and earn (strike − spot) immediately, or wait. Waiting risks the stock recovering — and the time value of the put is limited because the maximum payout is capped at the strike. Below a critical "exercise boundary," exercising now beats holding. The boundary depends on time-to-expiry, rate, vol, and dividends.',
    answer:
      'When a stock falls far below the put\'s strike, the put becomes deep ITM. The holder has two options: exercise now and earn (strike − spot) immediately, or wait and hold. Waiting risks the stock recovering, which would reduce the payoff. Critically, the time value of a put is bounded — the maximum the put can be worth is the strike price (when the stock goes to zero), so unlike a call, there\'s a ceiling on what time value can add. Below a critical "exercise boundary" (which moves over time and depends on rate, vol, dividends), exercising now beats holding. The mathematical proof of this involves comparing the immediate exercise payoff (strike − spot) to the present value of the optimal future exercise; when the former exceeds the latter, exercise is optimal. Binomial trees handle this naturally by checking at each node whether max(immediate, continuation) is the holding value.',
  },
  {
    question: 'How are Bermudan options used in practice?',
    plainAnswer:
      'Bermudan exercise structures show up most often in interest rate derivatives — swaptions with multiple exercise dates, callable bonds with a schedule of call dates, mortgage prepayment options (effectively Bermudan because borrowers can refinance at any monthly payment date). Equity Bermudans exist but are less common; ETFs and indexes are typically American or European depending on the listing exchange.',
    answer:
      'Bermudan exercise structures show up most often in interest rate derivatives. Specifically: (1) Swaptions on multiple potential exercise dates (a Bermudan swaption gives the holder the right to enter a swap on any of several dates, often a key feature in pension and insurance ALM portfolios). (2) Callable bonds with a schedule of call dates rather than a continuous call right — the issuer\'s right to call back the bond is Bermudan. (3) Mortgage prepayment options — borrowers can refinance at any monthly payment date, which is structurally a Bermudan call on the loan from the borrower\'s perspective and a Bermudan short call from the lender\'s. Equity Bermudans exist but are rare; listed equity options are typically American on US exchanges, European on European indices.',
  },
  {
    question: 'How do you price Bermudan options?',
    plainAnswer:
      'Binomial trees or finite-difference PDE solvers, with the exercise check applied only at the Bermudan exercise dates rather than every node. At Bermudan dates, take max(immediate exercise, continuation value). At non-Bermudan dates, just take continuation value. Monte Carlo with Longstaff-Schwartz regression also works and scales better for high-dimensional Bermudans.',
    answer:
      'Three standard approaches: (1) Binomial trees (or trinomial) with the exercise check applied only at the Bermudan exercise dates. At Bermudan dates: take max(immediate exercise payoff, continuation value computed by discounted-expected-value backward induction). At non-Bermudan dates: just continuation value. (2) Finite-difference PDE solvers — similar logic on a discretized space-time grid, exercise check at Bermudan timesteps only. (3) Monte Carlo with Longstaff-Schwartz regression (2001) — for high-dimensional Bermudans (multi-asset, multi-factor) where trees become infeasible, simulate paths and use regression on basis functions to estimate the continuation value at each exercise date, then make exercise decisions backward through the simulated paths. Each method has its sweet spot: binomial for single-asset, FD for accuracy on single-asset with sharp boundaries, MC for high dimension.',
  },
  {
    question: 'Are listed US stock options American or European?',
    plainAnswer:
      'Listed US single-stock options are American. Index options (SPX, NDX) on US exchanges are European. ETF options (SPY, QQQ) are American. European options trade on European exchanges (Eurex, Euronext) — the FTSE 100 options for example are European-style. Always check the contract specs; the difference materially affects pricing.',
    answer:
      'Listed US single-stock options (AAPL, NVDA, MSFT, etc.) are American — exercisable any time before expiry. Index options on US exchanges are mixed: SPX, NDX, RUT are European (only at expiry). VIX options are European but cash-settled. ETF options (SPY, QQQ, IWM) are American despite tracking the same indices, because they\'re structured as options on shares of the ETF, not on the index itself. European exchanges (Eurex for DAX, Euronext for CAC) typically list European-style. Always check the contract specs in the OCC product specs or the exchange\'s listing document; the American/European difference materially affects pricing for any option with a meaningful dividend or where the underlying could fall deep ITM on a put.',
  },
  {
    question: 'What\'s the impact on Greeks?',
    plainAnswer:
      'Same conceptual Greeks (delta, gamma, vega, theta, rho), different magnitudes. American options have higher delta when deep ITM (because exercise is on the table), different theta near the exercise boundary, and slightly different vega/rho due to the exercise option. For options far from any exercise boundary, American and European Greeks are nearly identical. For options near the boundary, differences can be 5-15%.',
    answer:
      'Same conceptual Greeks (delta, gamma, vega, theta, rho, lambda, vanna, charm, volga), different magnitudes. American options have higher delta when deep ITM (the exercise option absorbs some delta exposure), different theta dynamics near the exercise boundary (theta accelerates as exercise becomes more attractive), and slightly different vega/rho due to the exercise option being an asset itself. For options far from any exercise boundary (deep OTM or shortly after issuance), American and European Greeks are nearly identical. For options near the boundary — deep ITM puts, dividend-paying stock options just before ex-date — Greek differences can be 5-15% and matter for hedging. Trees and FD methods compute American Greeks via finite differences across adjacent nodes; closed-form approximations (Bjerksund-Stensland) are also common.',
  },
  {
    question: 'Why does QuantOracle use binomial trees for American options?',
    plainAnswer:
      'Binomial trees handle the early-exercise decision natively at every node — just compare the immediate exercise payoff against the discounted continuation value. They converge to Black-Scholes for European options as steps increase, so they validate against BS for European-styled inputs. And they\'re fast: 200-500 steps produces sub-cent accuracy in 10-30ms. Other methods work (Longstaff-Schwartz MC, FD PDE) but binomial is the simplest production-grade tool for American single-asset options.',
    answer:
      'Binomial trees (Cox-Ross-Rubinstein 1979) handle the early-exercise decision natively at every node — just compare the immediate exercise payoff against the discounted continuation value, take the max. They converge to Black-Scholes for European options as the number of steps increases, so they validate against BS for European-styled inputs (a useful sanity check). And they\'re fast: 200-500 steps produces sub-cent accuracy in 10-30ms of compute. Other methods work — Longstaff-Schwartz Monte Carlo handles high-dimensional Bermudans, finite-difference PDE handles single-asset American with sharp boundaries — but binomial is the simplest production-grade tool for American single-asset options, which covers ~95% of practical needs.',
  },
  {
    question: 'How do dividends interact with early exercise?',
    plainAnswer:
      'Dividends create the main reason American calls might be exercised early: just before a dividend payment, the stock drops by approximately the dividend amount. An ITM call holder can exercise to capture the dividend (by becoming a shareholder), then either hold or sell. Discrete dividends specifically — small continuous yield rarely justifies early exercise. The binomial tree handles discrete dividends by adjusting the lattice at ex-div dates.',
    answer:
      'Dividends are the main reason American calls might be exercised early. The mechanism: just before a dividend payment, the stock drops by approximately the dividend amount (in efficient markets). An ITM call holder, if not exercised, will see the underlying drop and the option value drop accordingly. By exercising before the ex-date, the holder becomes a shareholder, captures the dividend, and can either hold or sell. Three nuances: (1) Only discrete dividends create this dynamic — continuous yield (assumed in BS) doesn\'t. (2) Exercise is only optimal when the dividend exceeds the remaining time value of the option. (3) Tax considerations matter — exercise crystallizes a different tax basis than waiting. Binomial trees handle discrete dividends by adjusting the lattice at ex-div dates (drop all node prices by the dividend amount, recompute backward).',
  },
  {
    question: 'Which QuantOracle calculator should I use?',
    plainAnswer:
      'European vanilla → /black-scholes-calculator (closed-form, instant). American (single-asset, with or without dividends) → /american-option-calculator (binomial tree, 200 steps default). Bermudan and exotic American features are not yet on the site; the underlying API has /v1/derivatives/binomial-tree which accepts a custom exercise schedule for Bermudan use cases. Implied volatility for either type → /implied-volatility-calculator.',
    answer:
      'European vanilla options → use the Black-Scholes Calculator (/black-scholes-calculator) — closed-form, microsecond compute. American options (single-asset, with optional dividend yield) → use the American Option Calculator (/american-option-calculator) — Cox-Ross-Rubinstein binomial tree, 200 steps by default, configurable. For Bermudan options or American options with exotic features (lookback, barrier), the underlying API endpoint /v1/derivatives/binomial-tree accepts a custom exercise schedule and additional payoff parameters; a dedicated Bermudan calculator page is on the roadmap. For implied volatility on either type, use the Implied Volatility Calculator (/implied-volatility-calculator) which solves via Newton-Raphson.',
  },
];
