import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'Which downside risk metric should I use?',
    plainAnswer:
      'For regulatory and reporting: VaR (it is the standard). For capital allocation decisions: CVaR or max drawdown — both capture tail risk that VaR misses. Best practice is to report all three because they answer different questions: "how often I might lose more than X" (VaR), "how bad it gets when I lose more than X" (CVaR), and "what is the worst it has actually been" (drawdown).',
    answer:
      'For regulatory and reporting purposes: VaR (it is the industry and Basel standard). For capital allocation decisions: CVaR or max drawdown — both capture tail risk that VaR misses entirely. Best practice is to report all three because they answer fundamentally different questions: "how often might I lose more than X?" (VaR), "how bad is the average loss when I exceed VaR?" (CVaR), and "what is the worst peak-to-trough loss this strategy has actually experienced?" (max drawdown). A strategy with VaR_95 of -2% can have CVaR_95 of -8% if its tail is fat — and a max drawdown of -45% if it has had one bad period. All three matter.',
  },
  {
    question: 'Why is VaR criticized?',
    plainAnswer:
      'VaR tells you the threshold but says nothing about what happens beyond it. A strategy with 95% VaR of -2% might lose -3% one day or -30% — VaR doesn\'t distinguish. Worse: VaR is not "subadditive", meaning combining two portfolios can have HIGHER VaR than the sum, which makes no sense for a risk measure. CVaR fixes both problems.',
    answer:
      'VaR has two well-known problems. First, it tells you the threshold ("95% of days, losses are within -2%") but says nothing about the depth beyond that threshold. A strategy could lose -3% on the bad 5% of days, or -30% — VaR is identical in both cases. This is the "tail-blindness" critique. Second, VaR is not "subadditive" — a mathematical property required of a coherent risk measure. In some cases the VaR of a combined portfolio can exceed the sum of the individual VaRs, which violates the basic idea that diversification reduces risk. CVaR fixes both problems: it averages all losses beyond VaR, and it satisfies subadditivity. Artzner et al. (1999) formalized this critique in "Coherent Measures of Risk".',
  },
  {
    question: 'What is the relationship between VaR and CVaR?',
    plainAnswer:
      'CVaR (also called Expected Shortfall) is the EXPECTED VALUE of losses given that losses exceed VaR. Mathematically: CVaR_α = E[loss | loss > VaR_α]. CVaR is always at least as large as VaR — usually 20-50% larger for normal distributions, much larger for fat-tailed distributions. The ratio CVaR/VaR is itself a tail-fatness indicator.',
    answer:
      'CVaR (Conditional Value at Risk), also called Expected Shortfall (ES) or Expected Tail Loss (ETL), is the EXPECTED VALUE of losses given that losses exceed VaR. Mathematically: CVaR_α = E[loss | loss > VaR_α]. CVaR is always at least as large as VaR (in magnitude) — for normally-distributed returns CVaR is about 25% larger than VaR; for fat-tailed distributions CVaR can be 2-5x larger. The ratio CVaR/VaR is itself a useful tail-fatness indicator: a ratio close to 1.25 suggests near-normal tails, a ratio above 2.0 suggests dangerous fat tails. CVaR is also called Expected Shortfall in European regulatory texts; the names are interchangeable.',
  },
  {
    question: 'How is max drawdown different from VaR/CVaR?',
    plainAnswer:
      'VaR and CVaR are quantile-based probability measures computed from a return distribution. Max drawdown is a path-dependent realized loss — it tracks the actual peak-to-trough decline of the equity curve. VaR/CVaR can be computed without any history (just inputs μ, σ, etc.); max drawdown requires an actual sequence of returns. Drawdown captures correlation across time that VaR/CVaR miss entirely.',
    answer:
      'VaR and CVaR are quantile-based probability measures computed from a return distribution — they tell you "on the worst X% of single periods, you lose at least Y." Max drawdown is a path-dependent realized loss — it tracks the actual peak-to-trough decline of the equity curve over the full historical sequence. VaR/CVaR can be computed parametrically without any actual history (just inputs μ, σ, skew, kurtosis); max drawdown REQUIRES an actual sequence of returns. The critical conceptual difference: drawdown captures correlation ACROSS time. A strategy that loses 1% per day for 30 days straight has a max drawdown of ~30% but a VaR_95 of only -1%. VaR is blind to the autocorrelation that produces sustained drawdowns. This is why allocators care about max drawdown more than VaR for long-term capital decisions.',
  },
  {
    question: 'What is the right confidence level — 95% or 99%?',
    plainAnswer:
      '95% is more common in trading/portfolio management. 99% is more common in bank capital regulation. The choice depends on your loss-tolerance horizon: 95% VaR is exceeded once every 20 periods (~12 days/year for daily VaR), 99% is exceeded once every 100. For position sizing, 95% is usually sufficient. For tail risk hedging or stress testing, 99% or even 99.5% is more relevant.',
    answer:
      '95% is more common in trading and portfolio management contexts. 99% is more common in bank capital regulation (Basel framework uses 99% over a 10-day horizon for market risk capital). The choice depends on your loss-tolerance horizon: 95% VaR is exceeded once every 20 periods (about 12-13 trading days per year for daily VaR), 99% is exceeded once every 100 periods (about 2-3 days per year). For active strategy management and position sizing, 95% is usually sufficient because you want a metric that reflects the typical bad day. For tail risk hedging, regulatory capital, or stress testing, 99% or 99.5% is more relevant because you want to capture rare events. Reporting both is common.',
  },
  {
    question: 'How do I compute these for a real strategy?',
    plainAnswer:
      'For VaR: either parametric (assume normal returns, multiply σ by z-score) or historical (rank returns, pick the 5th percentile). For CVaR: average all returns below VaR. For max drawdown: walk through the equity curve tracking the running peak and current value, record the largest (peak - current)/peak. The QuantOracle calculators do all three.',
    answer:
      'For VaR: two common methods. Parametric VaR assumes a return distribution (usually normal) and computes VaR_α = z_α × σ; this is fast but wrong for fat-tailed strategies. Historical VaR ranks observed returns and takes the empirical 5th (or 1st) percentile; this captures actual tail shape but is sample-dependent. For CVaR: average all returns below VaR — typically the bottom 5% of observations for CVaR_95. For max drawdown: walk through the equity curve tracking the running peak and current value; record the largest fractional decline (peak - current)/peak across all observations. The QuantOracle Value at Risk Calculator computes VaR and CVaR (both parametric and historical); the Drawdown Calculator computes max drawdown plus average drawdown and recovery time.',
  },
  {
    question: 'Why does my VaR look low but my drawdown look terrible?',
    plainAnswer:
      'VaR is per-period; drawdown is cumulative. A strategy that loses 0.5% on the bad 5% of days has tiny VaR — but if those bad days cluster (during a crisis, say) the cumulative drawdown can easily exceed 20%. This is the autocorrelation gap: VaR assumes independence across periods; drawdown captures the path. Most real market crises have strong autocorrelation — 2008, 2020, etc. are sequences of bad days clustered, not independent draws.',
    answer:
      'VaR is per-period; drawdown is cumulative. A strategy that loses 0.5% on the bad 5% of days has small daily VaR — but if those bad days cluster (during a crisis, say) the cumulative drawdown can easily exceed 20%. This is the autocorrelation gap: VaR assumes (or computes from) independent per-period returns, while drawdown captures the actual path including correlation across time. Most real market crises feature strong positive autocorrelation in losses — 2008, March 2020, etc. were sequences of bad days clustered, not independent draws. A risk system that only reports VaR will systematically understate the magnitude of crisis-period drawdowns. This is why allocators ALWAYS look at max drawdown alongside VaR.',
  },
  {
    question: 'Which is best for retail position sizing?',
    plainAnswer:
      'Max drawdown. It is the metric that directly answers "how much would I lose if I held this strategy through the worst period?" For retail traders without sophisticated risk infrastructure, max drawdown + Calmar ratio (return / max drawdown) is more practically useful than VaR or CVaR. VaR/CVaR are valuable but operationally complex; max drawdown is just a number.',
    answer:
      'Max drawdown for most retail traders. It directly answers "how much would I lose if I held this strategy through the worst period?" — which is the question retail investors actually face. VaR and CVaR are statistically elegant but operationally complex (which method? which confidence level? rolling window? historical vs parametric?). Max drawdown is just one number with one interpretation: this is how bad it has been. Combine it with the Calmar ratio (annualized return / max drawdown) and you have a complete first-cut risk picture for retail-scale capital. Institutional users benefit from VaR/CVaR because they need consistency across many strategies; for retail, simpler is usually better.',
  },
  {
    question: 'Are there calculators for all three?',
    plainAnswer:
      'Yes. The Value at Risk Calculator computes parametric and historical VaR + CVaR with skewness and kurtosis correction. The Drawdown Calculator gives max drawdown, average drawdown, and underwater periods. Each is free and backed by the same deterministic QuantOracle API.',
    answer:
      'Yes. The QuantOracle Value at Risk Calculator computes both parametric VaR and CVaR with optional skewness and kurtosis corrections via Cornish-Fisher expansion. The Drawdown Calculator gives max drawdown (and therefore the input for Calmar), average drawdown, current drawdown, and underwater fraction. Both are free, return JSON with the same shape, and are computed server-side by the deterministic QuantOracle API.',
  },
  {
    question: 'What about Expected Shortfall — is that the same as CVaR?',
    plainAnswer:
      'Yes, Expected Shortfall (ES) = Conditional VaR (CVaR) = Expected Tail Loss (ETL) = Average VaR. These are four names for the same number. European regulators tend to say "Expected Shortfall"; US academics tend to say "CVaR"; risk management practitioners often say "ETL". Don\'t let the terminology fool you — they are mathematically identical.',
    answer:
      'Yes. Expected Shortfall (ES) and Conditional Value at Risk (CVaR) are mathematically identical concepts under different names. Expected Tail Loss (ETL) and Average VaR are also synonyms. European regulators (Basel III, EBA) prefer "Expected Shortfall"; US academics often use "CVaR"; risk practitioners use all three interchangeably. Whatever the name, the formula is E[loss | loss > VaR_α] — the expected loss conditional on exceeding the VaR threshold. Acerbi and Tasche (2002) showed the equivalence formally.',
  },
];
