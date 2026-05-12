import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'Which test should I use to detect mean reversion or trending?',
    plainAnswer:
      'Quick read of regime → Hurst exponent (one number, easy to interpret). Designing trades at a specific frequency → autocorrelation at the relevant lag. Formal statistical test / publication-grade evidence → variance ratio test (gives a z-statistic and p-value). For real strategy work, run all three and check they agree.',
    answer:
      'Quick read of the overall regime → Hurst exponent. One number between 0 and 1, easy to interpret (>0.5 trending, <0.5 mean-reverting, ≈0.5 random walk). Designing trades at a specific frequency (e.g., 5-day mean reversion) → autocorrelation at the relevant lag. The lag-by-lag picture is what you actually trade on. Formal statistical test or publication-grade evidence → variance ratio test (Lo &amp; MacKinlay, 1988). It gives a z-statistic and p-value for the null hypothesis of random walk. For real strategy work, run all three — if they agree, you have a real signal; if they disagree, you have noise.',
  },
  {
    question: 'How is the Hurst exponent related to autocorrelation?',
    plainAnswer:
      'Loosely: autocorrelation measures one lag at a time, Hurst integrates across all lags. For an exactly self-similar process, the Hurst exponent H relates to autocorrelation as H = 1 - (slope of ln(autocorr) vs ln(lag))/2. In practice they often agree — strongly mean-reverting series have H < 0.5 AND negative lag-1 autocorrelation. They can disagree when the autocorrelation structure is non-monotonic across lags.',
    answer:
      'Autocorrelation measures the correlation between observations at a specific lag — lag-1, lag-2, etc. — each independently. The Hurst exponent integrates across all lags simultaneously: a series that is mean-reverting at every lag will have H < 0.5; one that is persistent at every lag will have H > 0.5. For a self-similar fractional Brownian motion, the Hurst exponent H relates to autocorrelation as H = 1 - (slope of log(autocorr) vs log(lag))/2. In practice they often agree — strongly mean-reverting series have both H < 0.5 and negative lag-1 autocorrelation. They can disagree when the autocorrelation structure is non-monotonic across lags (e.g., strongly mean-reverting at lag 1 but mildly persistent at lag 20). Hurst can smooth over this.',
  },
  {
    question: 'What is the variance ratio test?',
    plainAnswer:
      'VR(k) = Var(k-period returns) / (k × Var(1-period returns)). Under random walk this equals 1. VR > 1 = trending (variance grows faster than k); VR < 1 = mean-reverting. The test (Lo & MacKinlay 1988) compares the observed VR to a z-statistic for statistical significance.',
    answer:
      'The variance ratio test computes VR(k) = Var(k-period returns) / (k × Var(1-period returns)). Under the random-walk null hypothesis, this equals 1 exactly: variance scales linearly with the time horizon. VR > 1 means k-period variance grows faster than k, which is the signature of positive autocorrelation (trending). VR < 1 means variance grows slower than k, signature of negative autocorrelation (mean reversion). Lo &amp; MacKinlay (1988) developed the formal hypothesis test, including a heteroskedasticity-robust version. The test produces a z-statistic and p-value, making it the natural choice when you need to defend a finding statistically.',
  },
  {
    question: 'Which one is the most statistically rigorous?',
    plainAnswer:
      'Variance ratio test. It explicitly gives you a p-value for "is this series random walk vs mean-reverting/trending?" Hurst is more of a descriptive statistic — useful but harder to interpret statistically. Lag-by-lag autocorrelation can be tested with Ljung-Box or Box-Pierce statistics. For academic / hedge-fund publication purposes, variance ratio is the cleanest.',
    answer:
      'The variance ratio test is the most statistically rigorous of the three. It explicitly gives you a z-statistic and p-value for the null hypothesis &quot;this series is a random walk.&quot; You can reject the null at a chosen significance level (e.g., 5%) with a documented procedure. Hurst is more of a descriptive statistic — the value carries information but the confidence interval is sensitive to sample size and there is no universally accepted hypothesis test built around it. Lag-by-lag autocorrelations can be jointly tested using Ljung-Box or Box-Pierce statistics (test whether the first k lags are jointly different from zero). For academic publication or hedge-fund pitch decks, variance ratio is the cleanest.',
  },
  {
    question: 'When does the Hurst exponent mislead?',
    plainAnswer:
      'Three failure modes. (1) Small samples (< 100 observations) — Hurst values can be off by ±0.1 or more. (2) Non-stationary series — strong trends or regime breaks inflate Hurst above 1.0. (3) Aggregated data — daily returns aggregated from intraday can show a Hurst that doesn\'t match either frequency. Always check R-squared of the log-log fit; if it\'s below 0.85, treat the Hurst value with caution.',
    answer:
      'Three common failure modes. (1) Small samples — fewer than ~100 observations and the Hurst estimate has standard error ±0.1 or more. (2) Non-stationarity — strong trends, regime breaks, or structural changes can inflate Hurst above 1.0 (which is theoretically impossible but practically common). Always compute Hurst on returns rather than price levels. (3) Aggregation effects — daily returns computed from intraday data may have a different Hurst than tick-level data because aggregation smooths out short-term mean reversion. Always check the R-squared of the log(R/S) vs log(window) fit; if below 0.85, the Hurst value is unreliable and you should use variance ratio or autocorrelation instead.',
  },
  {
    question: 'When does autocorrelation mislead?',
    plainAnswer:
      'Autocorrelation at a single lag can hide long-memory structure. A series can have near-zero lag-1 autocorrelation but still be strongly trending or mean-reverting at longer horizons — the signal is in the slow decay across many lags, not in any one. Autocorrelation also assumes stationarity; if the underlying mean shifts (regime change), the computed autocorr is a mix of within-regime and across-regime effects.',
    answer:
      'Autocorrelation at a single lag can hide long-memory structure. A series can have near-zero lag-1 autocorrelation but still be strongly trending or mean-reverting at longer horizons — the signal is in the slow decay of autocorrelation across many lags, not in any one. Always compute autocorrelations for multiple lags (10, 20, 50, 100, 200) and look at the full picture. Autocorrelation also assumes stationarity; if the underlying mean shifts during the sample (regime change), the computed autocorr is a confused mix of within-regime and across-regime effects. Best to either: split the sample at suspected regime breaks, or use rolling autocorrelation windows.',
  },
  {
    question: 'When does the variance ratio test mislead?',
    plainAnswer:
      'VR is sensitive to the choice of k. VR(2) might say "random walk" while VR(20) says "trending" — this is real information about the time scale of the autocorrelation but easy to misread. Also: VR assumes a constant-variance underlying. Heteroskedastic series (which is most financial data) need the robust variant of the test. Pure VR also doesn\'t distinguish between mean-reverting and trending — only between random walk and not-random-walk. Sign of (VR-1) tells you which.',
    answer:
      'VR is sensitive to the choice of horizon k. VR(2) might say &quot;random walk&quot; while VR(20) says &quot;trending&quot; — this is real information about the time scale of autocorrelation but easy to misread as inconsistency. Always compute VR at multiple horizons (2, 5, 10, 20, 50) and look at the trajectory. Also: standard VR assumes the underlying has constant variance, which is rarely true for financial data. Use the heteroskedasticity-robust version (Lo &amp; MacKinlay&apos;s second-form test statistic) for real data. Finally, VR alone doesn&apos;t distinguish between mean-reverting and trending — only between random walk and not-random-walk. The sign of (VR - 1) tells you which: positive = trending, negative = mean-reverting.',
  },
  {
    question: 'Can I use these on crypto?',
    plainAnswer:
      'Yes, and crypto is often the most interesting case. Bitcoin shows H ≈ 0.55-0.70 on daily data (strongly trending). Altcoins vary widely. The risk is non-stationarity — crypto has had multiple regime breaks (2017 mania, 2018 crash, 2020-2021 surge, 2022 winter). Always compute these on rolling windows, not lifetime aggregates.',
    answer:
      'Yes, and crypto is often the most interesting case because the underlying processes are dramatically different from equities. Bitcoin shows H ≈ 0.55-0.70 on daily data historically (strongly trending). Major altcoins vary widely. The risk is non-stationarity — crypto has had multiple major regime breaks (2017 mania, 2018 crash, 2020-2021 surge, 2022 winter, 2024-2025 institutional adoption). A lifetime aggregate Hurst is the wrong metric; always compute these on rolling windows (250-day, 500-day) and chart the trajectory. The regime indicator that says &quot;trade momentum&quot; in late 2024 is the regime indicator that said &quot;trade mean-reversion&quot; in mid-2022.',
  },
  {
    question: 'How do these connect to specific trading strategies?',
    plainAnswer:
      'H > 0.55 or VR > 1.0 (significant): favor momentum / breakout / moving-average crossover strategies. H < 0.45 or VR < 1.0 (significant): favor mean-reversion / Bollinger / RSI strategies. H near 0.5 or VR ≈ 1: neither — look for carry, fundamentals, or other alpha sources. The lag-by-lag autocorrelation pattern tells you the time scale to trade at.',
    answer:
      'A practical mapping: H > 0.55 or significantly positive VR → favor momentum, breakout, moving-average crossover, MACD strategies. The series has structural trending and these strategies capture it. H < 0.45 or significantly negative VR → favor mean-reversion strategies like Bollinger band fades, RSI extremes, pairs trading. The series reverts and these capture that. H near 0.5 or VR ≈ 1 → neither structural edge exists in this asset; look for carry, fundamentals, event-driven, or other alpha sources. Within the autocorrelation picture, the lag at which autocorrelation is most negative tells you the optimal mean-reversion horizon to trade (e.g., strong negative lag-5 autocorr → 5-day mean reversion strategy).',
  },
  {
    question: 'Is there a calculator for these?',
    plainAnswer:
      'The Hurst Exponent Calculator computes H via R/S analysis with R-squared fit-quality readout. Autocorrelation and the variance ratio test aren\'t standalone calculators on QuantOracle yet (likely additions to the roadmap). For now, you can build either from raw returns: autocorr is just Pearson correlation between r_t and r_{t-k}; VR is the ratio of period-k variance to k × period-1 variance.',
    answer:
      'The QuantOracle Hurst Exponent Calculator computes H via R/S analysis with R-squared fit-quality readout. Standalone autocorrelation and variance-ratio-test calculators are not yet on the site (likely future additions). For now you can compute both directly: autocorrelation at lag k is just Pearson correlation between r_t and r_{t-k}; variance ratio is the ratio of period-k variance to k × period-1 variance. Both are 5-line numpy/scipy snippets.',
  },
];
