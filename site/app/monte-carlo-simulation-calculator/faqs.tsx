import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is a Monte Carlo simulation?',
    plainAnswer:
      'Monte Carlo simulation runs thousands of random scenarios for an investment to estimate the full distribution of possible outcomes. Instead of a single point estimate ("you will have $200,000 in 10 years"), it gives you a range with probabilities ("median $200K, 5th percentile $80K, 95th percentile $510K, 18% chance you end below your starting value").',
    answer:
      'Monte Carlo simulation runs thousands of random scenarios for an investment to estimate the full distribution of possible outcomes. Instead of a single point estimate ("you will have $200,000 in 10 years"), it gives you a range with probabilities ("median $200K, 5th percentile $80K, 95th percentile $510K, 18% chance you end below your starting value"). The technique is named after the Monte Carlo casino because it relies on randomness — modern variants use pseudo-random sequences for reproducibility.',
  },
  {
    question: 'Why is the median different from the mean?',
    plainAnswer:
      'In log-normal returns (the standard model for stock prices), the mean is always higher than the median because compounding is multiplicative — a few very-good outcomes pull the mean above the median. The median is what a "typical" path achieves; the mean is what you would get by averaging across all paths. For decision-making, the median is usually the more meaningful number.',
    answer:
      'In log-normal returns (the standard model for stock prices), the mean is always higher than the median because compounding is multiplicative — a few very-good outcomes pull the mean above the median. The median is what a "typical" path achieves; the mean is what you would get by averaging across all paths. For decision-making, the median is usually the more meaningful number — it answers "what should I expect?" without being distorted by outliers.',
  },
  {
    question: 'What does "probability of loss" mean here?',
    plainAnswer:
      'It is the fraction of simulated paths that end below your initial portfolio value. So if 18% of paths end below $100,000 starting capital, that means in 18% of scenarios you would have less money at the end than you started with.',
    answer:
      'It is the fraction of simulated paths that end below your initial portfolio value. So if 18% of paths end below $100,000 starting capital, that means in 18% of scenarios you would have less money at the end than you started with. This is "raw" probability of loss — no inflation adjustment, no risk-free rate comparison.',
  },
  {
    question: 'What is "probability of ruin" — when is it nonzero?',
    plainAnswer:
      'Probability of ruin is the fraction of paths where the portfolio went to zero (or near-zero) before the simulation ended. It is only meaningful when you have positive withdrawal rate — without withdrawals, even bad paths recover before hitting zero. With high withdrawal rates (5%+ of portfolio annually), ruin probability rises sharply as horizon extends.',
    answer:
      'Probability of ruin is the fraction of paths where the portfolio went to zero (or near-zero) before the simulation ended. It is only meaningful when you have positive withdrawal rate — without withdrawals, even bad paths recover before hitting zero (the model assumes log-normal returns, which can decay but not go negative). With high withdrawal rates (5%+ of portfolio annually), ruin probability rises sharply as horizon extends. The classic "4% rule" for retirement is calibrated to keep this near zero over 30 years.',
  },
  {
    question: 'How accurate is this with only a few thousand simulations?',
    plainAnswer:
      'Standard error of percentile estimates is roughly 1 / sqrt(N), so 1,000 paths gives ~3% precision on percentiles, 10,000 paths gives ~1%. For most decisions you need only 1,000-2,500 paths. Very deep-tail estimates (like 1st percentile or worse) need more paths because rare events are sampled less often.',
    answer:
      'Standard error of percentile estimates is roughly 1 / √N, so 1,000 paths gives ~3% precision on percentiles, 10,000 paths gives ~1%. For most decisions you need only 1,000-2,500 paths. Very deep-tail estimates (like 1st percentile or worse) need more paths because rare events are sampled less often.',
  },
  {
    question: 'What return and volatility numbers should I use?',
    plainAnswer:
      'For US equities long-term: 8-10% expected return, 16-20% volatility is the standard textbook assumption (rough match to S&P 500 historicals 1928-2023). For a 60/40 portfolio: 6-8% return, 10-12% vol. For bonds: 3-5% return, 5-8% vol. For crypto: 30-80% expected return, 60-100% vol — though the historical samples are short and not stationary. Whatever numbers you pick, they should be REAL (after-inflation) for retirement planning, NOMINAL otherwise.',
    answer:
      'For US equities long-term: 8-10% expected return, 16-20% volatility is the standard textbook assumption (rough match to S&P 500 historicals 1928-2023). For a 60/40 portfolio: 6-8% return, 10-12% vol. For bonds: 3-5% return, 5-8% vol. For crypto: 30-80% expected return, 60-100% vol — though the historical samples are short and not stationary. Whatever numbers you pick, they should be REAL (after-inflation) for retirement planning, NOMINAL otherwise. Forward-looking returns are usually lower than historical — current consensus for US equities is closer to 6-7% real, not 10%.',
  },
  {
    question: 'Does this assume normal returns? Are fat tails handled?',
    plainAnswer:
      'This implementation uses geometric Brownian motion — log-normal returns, a standard textbook assumption. Real returns have fatter tails than log-normal (more frequent extreme moves of either direction). The simulation will under-estimate the probability of very-large losses or gains. For institutional risk modeling, use a fat-tailed distribution; for back-of-envelope retirement or strategy planning, log-normal is fine.',
    answer:
      'This implementation uses geometric Brownian motion — log-normal returns, a standard textbook assumption. Real returns have fatter tails than log-normal (more frequent extreme moves of either direction). The simulation will under-estimate the probability of very-large losses or gains. For institutional risk modeling, use a fat-tailed distribution (Student-t, GARCH); for back-of-envelope retirement or strategy planning, log-normal is fine. The QuantOracle API exposes GARCH forecasting at /v1/stats/garch-forecast for fatter-tail modeling.',
  },
  {
    question: 'How do contributions and withdrawals affect the result?',
    plainAnswer:
      'Contributions add a fixed annual amount; withdrawals subtract a fraction of the portfolio each year. Contributions improve all percentiles. Withdrawals at high rates create "sequence-of-returns risk" — early bad years are much more damaging than late bad years because you withdraw from a depleted portfolio. This is why retirement planning requires Monte Carlo, not just a single expected-return projection.',
    answer:
      'Contributions add a fixed annual amount (so $10K/year for 10 years adds $100K total to all paths). Withdrawals subtract a fraction of the portfolio each year (so 4% withdrawal on a $1M portfolio takes out $40K/year, but if the portfolio drops to $500K, the withdrawal becomes $20K). Withdrawals at high rates create "sequence-of-returns risk" — early bad years are much more damaging than late bad years because you withdraw from a depleted portfolio. This is why retirement planning requires Monte Carlo, not just a single expected-return projection.',
  },
  {
    question: 'How is this different from a backtest?',
    plainAnswer:
      'A backtest runs your strategy on historical data — one specific past sequence of returns. Monte Carlo generates thousands of synthetic future sequences from a model. Backtests answer "how would this have done?", Monte Carlo answers "what is the range of how it could do?" Both have value; serious investors use both. Backtests are vulnerable to overfitting and survivorship bias; Monte Carlo is vulnerable to wrong distributional assumptions.',
    answer:
      'A backtest runs your strategy on historical data — one specific past sequence of returns. Monte Carlo generates thousands of synthetic future sequences from a model. Backtests answer "how would this have done?", Monte Carlo answers "what is the range of how it could do?" Both have value; serious investors use both. Backtests are vulnerable to overfitting and survivorship bias; Monte Carlo is vulnerable to wrong distributional assumptions. The QuantOracle API exposes both — backtest at /v1/backtest/strategy.',
  },
  {
    question: 'Is this calculator free?',
    plainAnswer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
    answer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
  },
];
