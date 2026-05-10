import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is the probabilistic Sharpe ratio (PSR)?',
    plainAnswer:
      'The probabilistic Sharpe ratio (PSR) is the probability that the true long-run Sharpe ratio of a strategy exceeds a benchmark Sharpe (often 0). It accounts for sample size, skewness, and kurtosis — three things the regular Sharpe ratio ignores. PSR was introduced by Marcos López de Prado in 2012.',
    answer:
      'The probabilistic Sharpe ratio (PSR) is the probability that the true long-run Sharpe ratio of a strategy exceeds a benchmark Sharpe (often 0). It accounts for sample size, skewness, and kurtosis — three things the regular Sharpe ratio ignores. PSR was introduced by Marcos López de Prado in 2012 ("The Sharpe Ratio Efficient Frontier") to address the problem that a high reported Sharpe on short non-normal data is often statistical noise. PSR turns Sharpe into a probability, which is a more honest representation of the uncertainty.',
  },
  {
    question: 'How do I interpret the PSR value?',
    plainAnswer:
      'PSR ranges from 0 to 1 (read as a probability). PSR > 0.95 means there is a 95% probability the strategy genuinely beats the benchmark Sharpe — convincing evidence. PSR > 0.99 is strong. Below 0.50 means the apparent Sharpe is more likely sampling noise than real edge. Most academic papers use 0.95 as the publication threshold.',
    answer:
      'PSR ranges from 0 to 1 (read as a probability). PSR > 0.95 means there is a 95% probability the strategy genuinely beats the benchmark Sharpe — convincing evidence of edge. PSR > 0.99 is strong. PSR between 0.50 and 0.95 means the strategy MIGHT have edge but the data is not yet conclusive. Below 0.50 means the apparent Sharpe is more likely sampling noise than real signal. Most academic papers use PSR > 0.95 as the publication-significance threshold, equivalent to the standard 5% statistical significance test.',
  },
  {
    question: 'Why not just use the regular Sharpe ratio?',
    plainAnswer:
      'A high Sharpe ratio on a short or non-normal sample is often misleading. A 6-month strategy with Sharpe 3.0 looks great but, given so few observations, the true Sharpe could be anywhere from -1 to +5. Sharpe also assumes returns are normally distributed; strategies with negative skew (e.g. selling options) inflate their reported Sharpe relative to true edge. PSR fixes both.',
    answer:
      'A high Sharpe ratio on a short or non-normal sample is often misleading. A 6-month strategy with Sharpe 3.0 looks great in isolation, but given the small number of observations, the true long-run Sharpe could realistically be anywhere from -1 to +5 — not a publishable result. Sharpe also assumes returns are normally distributed; strategies with negative skew and high kurtosis (selling options, carry trades, short-vol) inflate their reported Sharpe relative to their actual long-run edge because the sample missed the rare blowup events. PSR adjusts for both sample size and the higher moments, giving you a probability of edge rather than a point estimate.',
  },
  {
    question: 'What is the minimum track record length (MTRL)?',
    plainAnswer:
      'The minimum track record length is the smallest number of observations you would need before the strategy\'s observed Sharpe could plausibly indicate real edge at 95% confidence. If MTRL is 600 days and you only have 200, you literally do not have enough data to claim significance — even if the point Sharpe looks great.',
    answer:
      'The minimum track record length (MTRL) is the smallest number of observations you would need before the strategy\'s observed Sharpe could plausibly indicate real edge at 95% confidence (PSR > 0.95). If MTRL is 600 days and you only have 200, you literally do not have enough data to claim significance — even if the point Sharpe looks great. MTRL is one of the most useful outputs of PSR analysis: it tells you "come back when you have N more months." Strategies with low Sharpes or high kurtosis need much longer track records to prove themselves.',
  },
  {
    question: 'What input does the calculator expect?',
    plainAnswer:
      'A series of periodic returns (decimal form, not percentages — use 0.012 for 1.2%). Plus the benchmark Sharpe to test against (default 0 = "any positive long-run Sharpe"), the risk-free rate, and the annualization factor (252 for daily, 52 weekly, 12 monthly).',
    answer:
      'A series of periodic returns (decimal form, not percentages — use 0.012 for 1.2%). Plus three optional knobs: the benchmark Sharpe to test against (default 0 — i.e. "is there any positive long-run Sharpe?"), the risk-free rate (annualized), and the annualization factor (252 for daily returns, 52 for weekly, 12 for monthly). For comparing strategies, set the benchmark to a market benchmark Sharpe (e.g. 0.4 for the S&P 500\'s long-run Sharpe).',
  },
  {
    question: 'What is z-score in the output?',
    plainAnswer:
      'The z-score is the standardized distance between the observed Sharpe and the benchmark Sharpe, accounting for skewness and kurtosis. PSR is just the cumulative normal distribution applied to this z-score. A z-score above 1.96 corresponds to PSR > 0.975; above 2.33 to PSR > 0.99.',
    answer:
      'The z-score is the standardized distance between the observed Sharpe and the benchmark Sharpe, accounting for sample size, skewness, and kurtosis. PSR is just the cumulative normal distribution applied to this z-score. A z-score above 1.96 corresponds to PSR > 0.975; above 2.33 to PSR > 0.99. The z-score is the more interpretable number for cross-strategy comparison because it is on a fixed scale rather than bounded between 0 and 1.',
  },
  {
    question: 'How do skewness and kurtosis affect PSR?',
    plainAnswer:
      'Negative skew (more frequent small gains, occasional large losses — typical of option-selling strategies) PENALIZES PSR: the strategy may have a high reported Sharpe but the true edge is overstated because the sample missed large negative tails. High kurtosis (fat tails on both sides) also penalizes PSR by widening the uncertainty around the true Sharpe.',
    answer:
      'Negative skew (more frequent small gains, occasional large losses — typical of option-selling and carry strategies) PENALIZES PSR: the strategy may have a high reported Sharpe in-sample but the true edge is overstated because the sample missed large negative tails. High kurtosis (fat tails on both sides) also penalizes PSR by widening the uncertainty around the true Sharpe. This is exactly why PSR exists: a "high-Sharpe" carry strategy with negative skew may look better than a "lower-Sharpe" trend strategy with positive skew, but PSR will (correctly) show the trend strategy has more reliable evidence of long-run edge.',
  },
  {
    question: 'When should I use PSR instead of regular Sharpe?',
    plainAnswer:
      'Always, ideally. Specifically: when comparing two strategies with different sample lengths, when evaluating short backtests, when the returns are clearly non-normal (negative skew, fat tails), when allocating capital between strategies, and when publishing results. Regular Sharpe is fine for back-of-envelope work; PSR is the right metric for capital allocation decisions.',
    answer:
      'Always, ideally. Specifically: when comparing two strategies with different sample lengths (PSR normalizes for that, raw Sharpe does not), when evaluating short backtests (under 5 years), when the returns are clearly non-normal (negative skew, fat tails — most real strategies), when allocating capital between strategies, and when publishing results. Regular Sharpe is fine for back-of-envelope work; PSR is the right metric for capital allocation decisions because it tells you the probability of repeated edge rather than a point estimate.',
  },
  {
    question: 'What does "significant at 95%" mean?',
    plainAnswer:
      'PSR exceeds 0.95 — meaning there is at least a 95% probability the true Sharpe exceeds the benchmark. This is the standard threshold for publication-grade evidence. "Significant at 99%" is a stricter test (PSR > 0.99) typically used for capital allocation decisions where false positives are costly.',
    answer:
      'PSR exceeds 0.95 — meaning there is at least a 95% probability the true Sharpe exceeds the benchmark. This is the standard threshold for publication-grade evidence in academic papers. "Significant at 99%" is a stricter test (PSR > 0.99) typically used for capital allocation decisions where false positives are costly. A strategy that fails the 95% test should NOT be deployed with significant capital regardless of how good the point Sharpe looks.',
  },
  {
    question: 'Is this calculator free?',
    plainAnswer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
    answer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
  },
];
