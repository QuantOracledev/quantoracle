import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'Which position sizing method should I actually use?',
    plainAnswer:
      'For most people: fixed-fractional at 1-2% risk per trade. For systematic strategies with well-estimated edge: half-Kelly. Full Kelly and Optimal-f are theoretically optimal but punishing in practice because they assume your inputs are exactly right. They aren\'t.',
    answer:
      'For most people: fixed-fractional at 1-2% risk per trade. It is robust, predictable, and your worst case is bounded. For systematic strategies where you have a well-estimated edge backed by hundreds of trades: half-Kelly (50% of full Kelly fraction) — this captures most of the geometric growth advantage with about a quarter of the drawdown pain. Full Kelly and Optimal-f are theoretically optimal but punishing in practice because they assume your inputs are exactly right. They almost never are. Overestimate the edge by 20% and Kelly/Optimal-f will recommend 40-60% of capital per trade. That kills accounts.',
  },
  {
    question: 'What is the Kelly criterion?',
    plainAnswer:
      'Kelly (1956) is the bet sizing rule that maximizes the long-run growth rate of capital. For a discrete bet: f* = (p·b − q) / b, where p is win probability, q is loss probability, b is the odds (win/loss ratio). For continuous returns: f* = μ/σ². The intuition: bet more when edge is bigger, less when variance is bigger.',
    answer:
      'Kelly (1956) is the bet sizing rule that maximizes the long-run geometric growth rate of capital. For a discrete bet with two outcomes: f* = (p·b − q) / b, where p is win probability, q = 1-p is loss probability, b is the odds ratio (avg win / avg loss). For continuous returns: f* = μ/σ², where μ is the expected excess return and σ² is the variance. The intuition: bet more when edge is bigger, less when variance is bigger. Kelly is provably optimal in the limit of infinite trials, but the path to that infinity includes drawdowns that most investors cannot stomach.',
  },
  {
    question: 'What is Optimal-f and how is it different from Kelly?',
    plainAnswer:
      'Optimal-f (Vince, 1990) is the bet size that maximizes terminal wealth assuming the WORST historical loss is the bound on a single trade. Where Kelly uses probability distributions, Optimal-f uses one extreme observation. This makes it more aggressive than Kelly — and more dangerous if the worst loss in your sample isn\'t actually the worst possible loss.',
    answer:
      'Optimal-f (Ralph Vince, "Portfolio Management Formulas", 1990) is the bet size that maximizes terminal wealth assuming the WORST historical loss is the binding constraint on a single trade. Where Kelly uses the probability distribution of returns, Optimal-f anchors on one extreme observation — the largest single loss in your sample. This makes it more aggressive than Kelly in most cases (sometimes recommending 40-60% of capital per trade) — and more dangerous, because you are betting that the worst loss in your sample is actually the worst possible loss. It almost never is. A new larger loss arrives at some point, and Optimal-f over-bets exactly then.',
  },
  {
    question: 'What is fixed-fractional position sizing?',
    plainAnswer:
      'Fixed-fractional risks a constant percentage of account equity on every trade — typically 1% to 2%. Position size = (account × risk%) / |entry − stop|. Simple, robust, and the worst-case loss is bounded at the percentage you chose. The standard recommendation for non-quantitative traders.',
    answer:
      'Fixed-fractional risks a constant percentage of account equity on every trade — typically 1% to 2% (the "1% rule" popularized by Van Tharp). Position size = (account_value × risk_percent) / |entry_price − stop_loss_price|. The worst-case loss per trade is bounded at the percentage you chose; over time, the account compounds because risk scales with equity. It does not optimize geometric growth — it just trades off return for predictable drawdown behavior. For most retail and discretionary traders this is the right tool because edge estimates are noisy, position-by-position win rate varies, and the math of Kelly assumes things humans rarely have.',
  },
  {
    question: 'Why is full Kelly considered too aggressive?',
    plainAnswer:
      'Full Kelly is optimal IF your edge estimate is exactly right. If you overestimate edge by 20% (very common with real strategies), full Kelly bets ~40% more than it should. The result: drawdowns of 30-50% are routine, drawdowns of 70%+ happen occasionally, and recovery from those is psychologically devastating even when mathematically possible.',
    answer:
      'Full Kelly is provably optimal in expectation IF your edge estimate is exactly right. In real strategies, estimated edge is almost always biased upward by overfitting and survivorship bias. If you overestimate edge by 20% (very common), full Kelly bets ~40% more than it should and the realized growth rate becomes NEGATIVE. Drawdowns of 30-50% are routine even under correct Kelly; drawdowns of 70%+ happen occasionally over long horizons. Recovery from those is psychologically devastating even when mathematically possible. Most quant practitioners use half-Kelly (50% of f*) or even quarter-Kelly — capturing ~75-90% of the growth advantage with dramatically less drawdown.',
  },
  {
    question: 'What is the practical decision rule for choosing between them?',
    plainAnswer:
      'Discretionary trading or untested system → fixed-fractional 1-2%. Systematic strategy with 200+ live trades and Sharpe > 1.0 → half-Kelly. Allocator-level portfolio with multiple uncorrelated strategies → Kelly-per-strategy capped at fractional Kelly aggregate. Optimal-f → almost never; use only with explicit overrides on the worst-loss assumption.',
    answer:
      'A practical decision tree: (1) Discretionary trader or untested system → fixed-fractional at 1-2% risk per trade. (2) Systematic strategy with 200+ live trades, Sharpe > 1.0, and well-defined edge → half-Kelly fraction at the strategy level. (3) Allocator-level portfolio with multiple low-correlation strategies → Kelly per strategy capped at a fractional-Kelly aggregate (so the portfolio total never exceeds full Kelly even when all sub-strategies say "bet more"). (4) Optimal-f → almost never use directly; it is best used as an upper bound to sanity-check Kelly recommendations. If Optimal-f says 40% and Kelly says 25%, you have a fat-tail underestimation problem in your model.',
  },
  {
    question: 'Can Kelly recommend a NEGATIVE bet?',
    plainAnswer:
      'Yes. If your edge is negative (expected loss per trade), Kelly returns a negative fraction. The correct action is f* = 0 — do not bet. Some practitioners interpret negative Kelly as "bet against this strategy" (short it), which is correct in symmetric markets but dangerous because the strategy you discovered is losing might be losing for non-stationary reasons that flip.',
    answer:
      'Yes. If your edge is negative (expected loss per trade), Kelly returns a negative fraction. The correct action is f* = 0 — do not bet. Some practitioners interpret negative Kelly as "bet against this strategy" (short it), which is mathematically correct in symmetric markets but dangerous in practice because the strategy you discovered is losing might be losing for non-stationary reasons that flip when you reverse positions. Fixed-fractional does not have this property — if you have no edge, you simply have no trades to size. Optimal-f also gives undefined/negative values for negative-edge strategies.',
  },
  {
    question: 'How does correlation affect Kelly when sizing multiple strategies?',
    plainAnswer:
      'Kelly was derived for a single bet. For a portfolio of correlated strategies, naive Kelly per strategy aggregates to over-betting. The correct multivariate form solves f* = Σ⁻¹·μ (covariance matrix inverse times expected returns). Practically: compute Kelly per strategy independently, then scale ALL strategies by a single fractional-Kelly factor so the aggregate position never exceeds your risk budget.',
    answer:
      'Kelly was derived for a single bet. For a portfolio of correlated strategies, naive Kelly per strategy aggregates to over-betting because correlated positions stack risk. The correct multivariate form is f* = Σ⁻¹·μ where Σ is the covariance matrix and μ is the vector of expected excess returns. In practice this is sensitive to estimation error in Σ⁻¹. Most quant shops use a simpler heuristic: compute Kelly per strategy independently, then scale ALL strategies by a single fractional-Kelly factor (e.g., 0.25 to 0.5) so the aggregate gross exposure never exceeds your risk budget. This loses some theoretical optimality but is dramatically more robust to estimation error.',
  },
  {
    question: 'What about flat percent position sizing — like "always 10% of account per trade"?',
    plainAnswer:
      'That is fixed-PERCENT position sizing (a.k.a. fixed-dollar-percent), NOT fixed-fractional. The difference: fixed-percent doesn\'t account for the stop distance, so a 10% position with a 50% stop is risking 5% of account while a 10% position with a 5% stop is risking 0.5%. Always use fixed-FRACTIONAL (risk-based) not fixed-percent (notional-based) unless you have specific reasons.',
    answer:
      'That is fixed-PERCENT position sizing (a.k.a. fixed-notional-percent), NOT fixed-fractional. The difference matters: fixed-percent doesn\'t account for the stop distance, so a 10% position with a 50% stop is risking 5% of account while a 10% position with a 5% stop is risking 0.5%. Two trades with the same nominal exposure can have 10x different risk-of-loss. Always use fixed-FRACTIONAL (risk-based, accounting for stop distance) not fixed-percent (notional-based) unless you have specific reasons — like portfolio construction constraints, or assets without a sensible stop-loss concept.',
  },
  {
    question: 'Is there a calculator for these?',
    plainAnswer:
      'Yes. The QuantOracle Kelly Criterion Calculator gives full Kelly, half-Kelly, and quarter-Kelly fractions for any win rate and payoff ratio. The Position Size Calculator does fixed-fractional sizing given account size, risk %, entry, and stop. Optimal-f isn\'t separately calculated because most practitioners avoid it; if you want it, run Kelly and Optimal-f is approximately 1.0 - (1 - Kelly)^k for some scaling factor depending on your loss distribution.',
    answer:
      'Yes. The QuantOracle Kelly Criterion Calculator gives full Kelly, half-Kelly, and quarter-Kelly fractions for any win rate and payoff ratio. The Position Size Calculator does fixed-fractional sizing given account size, risk percent, entry, and stop. Optimal-f is not separately calculated because most practitioners avoid it; if you want it, it is approximately equal to Kelly when worst-case loss equals one standard deviation, and grows larger as worst-loss becomes more extreme.',
  },
];
