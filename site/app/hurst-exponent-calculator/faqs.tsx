import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is the Hurst exponent?',
    plainAnswer:
      'The Hurst exponent (H) is a number between 0 and 1 that measures the long-term memory of a time series. H near 0.5 means random walk (no memory). H above 0.5 means the series is trending (persistent — past direction predicts future direction). H below 0.5 means the series is mean-reverting (anti-persistent — past direction reverses).',
    answer:
      'The Hurst exponent (H) is a number between 0 and 1 that measures the long-term memory of a time series. H near 0.5 means random walk (no memory — geometric Brownian motion, the assumption behind Black-Scholes). H above 0.5 means the series is trending (persistent — past direction predicts future direction). H below 0.5 means the series is mean-reverting (anti-persistent — past direction reverses). It was introduced by hydrologist Harold Hurst in 1951 to model the Nile river, and adopted by Mandelbrot for financial applications.',
  },
  {
    question: 'How do I interpret the Hurst exponent value?',
    plainAnswer:
      'H ≈ 0.5 → random walk (no exploitable structure). 0.5 < H < 1 → trending; the higher, the stronger. H > 0.7 is strongly trending. 0 < H < 0.5 → mean-reverting; the lower, the stronger. H < 0.3 is strongly mean-reverting. Stock indices typically score 0.5-0.6, FX pairs around 0.5, individual stocks 0.4-0.55, while range-bound assets like rates can dip below 0.4.',
    answer:
      'H ≈ 0.5 → random walk (no exploitable structure). 0.5 < H < 1 → trending; the higher, the stronger. H > 0.7 is strongly trending. 0 < H < 0.5 → mean-reverting; the lower, the stronger. H < 0.3 is strongly mean-reverting. Stock indices typically score 0.5-0.6 (slightly trending), FX pairs around 0.5 (random walk), individual stocks 0.4-0.55, while range-bound assets like short-term interest rates can dip below 0.4. Single Hurst values should be treated with caution — the metric is sample-dependent and noisy on shorter series.',
  },
  {
    question: 'What is R/S analysis?',
    plainAnswer:
      'Rescaled range (R/S) analysis is the original method for estimating the Hurst exponent. For each window size, it computes the range of cumulative deviations from the mean, divided by the standard deviation. As window size grows, the rescaled range scales as a power of window length — and that power IS the Hurst exponent. The slope of log(R/S) vs log(window size) gives H.',
    answer:
      'Rescaled range (R/S) analysis is the original method (Hurst, 1951) for estimating the Hurst exponent. For each window size n, it computes the range of cumulative deviations from the mean within that window, divided by the standard deviation of returns in the window. As n grows, this rescaled range scales as a power-law of n — and that power IS the Hurst exponent. The slope of log(R/S) vs log(n) on a log-log plot gives H. There are alternative methods (DFA, periodogram, wavelets) that may be more robust for short series but R/S is the canonical baseline.',
  },
  {
    question: 'What can I use the Hurst exponent for in trading?',
    plainAnswer:
      'Use H to choose the right strategy type for the asset. H > 0.55 favors momentum/trend-following strategies (moving-average crossovers, breakouts). H < 0.45 favors mean-reversion strategies (Bollinger band fades, pairs trading). H ≈ 0.5 means neither approach has structural edge — you need to look elsewhere (carry, fundamentals, alternative data).',
    answer:
      'Use H to choose the right strategy type for the asset. H > 0.55 favors momentum/trend-following strategies (moving-average crossovers, Donchian breakouts, MACD). H < 0.45 favors mean-reversion strategies (Bollinger band fades, pairs trading, RSI extremes). H ≈ 0.5 means neither approach has structural edge — you need to look elsewhere (carry, fundamentals, alternative data, event-driven). The exponent does not tell you the strategy will be profitable; it tells you the asset has the right structure for that style. Walk-forward your H estimates over rolling windows because the regime can change.',
  },
  {
    question: 'What input does the calculator expect?',
    plainAnswer:
      'A time series of either prices or returns (one number per period). At least 60 data points is recommended; 100+ is better for stable estimates. The calculator parses comma- or whitespace-separated numbers. Daily, weekly, or monthly all work, but pick one frequency consistently.',
    answer:
      'A time series of either prices or returns (one number per period). At least 60 data points is recommended; 100+ is better for stable estimates because R/S analysis fits a slope across multiple window sizes. The calculator parses comma- or whitespace-separated numbers. Daily, weekly, or monthly all work, but pick one frequency consistently — Hurst on a mix of frequencies is meaningless. Many practitioners run Hurst on log returns rather than prices to remove level effects.',
  },
  {
    question: 'What is the R-squared in the output?',
    plainAnswer:
      'R-squared measures how well the log(R/S) vs log(window) regression fits a straight line. Values close to 1.0 (e.g. 0.95+) mean the Hurst estimate is reliable — the data really does follow a power law. Lower R-squared (under 0.85) means the linear fit is poor and the H value should be treated cautiously.',
    answer:
      'R-squared measures how well the log(R/S) vs log(window) regression fits a straight line. Values close to 1.0 (e.g. 0.95+) mean the Hurst estimate is reliable — the data really does follow a power law as Hurst theory requires. Lower R-squared (under 0.85) means the linear fit is poor and the H value should be treated cautiously: the underlying series may have multiple regimes, structural breaks, or insufficient data points to estimate the slope robustly.',
  },
  {
    question: 'How is Hurst different from autocorrelation?',
    plainAnswer:
      'Autocorrelation measures the correlation between observations at a specific lag (lag-1, lag-2, etc). The Hurst exponent measures the persistence across ALL lags simultaneously — it captures long-memory behavior that may be invisible at any single lag. A series can have near-zero lag-1 autocorrelation but still have H > 0.5 due to slow-decaying long-term dependence.',
    answer:
      'Autocorrelation measures the correlation between observations at a specific lag (lag-1, lag-2, etc). The Hurst exponent measures the persistence across ALL lags simultaneously — it captures long-memory behavior that may be invisible at any single lag. A series can have near-zero lag-1 autocorrelation but still have H > 0.5 due to slow-decaying long-term dependence (this is exactly what fractional Brownian motion exhibits). Hurst is therefore the better metric for detecting subtle long-horizon trending or mean-reversion.',
  },
  {
    question: 'Why does Hurst sometimes return a value above 1.0?',
    plainAnswer:
      'Theoretically H is bounded between 0 and 1, but R/S analysis on small samples or non-stationary series (e.g. raw price series with strong trends) can produce estimates above 1.0. This is a sign that you should run Hurst on returns rather than prices, or use a longer series. A value above 1.0 still qualitatively indicates strong trending — just treat the exact number with skepticism.',
    answer:
      'Theoretically H is bounded between 0 and 1, but R/S analysis on small samples or non-stationary series (e.g. raw price series with strong trends) can produce estimates above 1.0. This is a sign that you should run Hurst on returns rather than prices, or use a longer series, or use a more sophisticated estimator like DFA. A value above 1.0 still qualitatively indicates strong trending — just treat the exact number with skepticism. The conventional fix is to detrend the series first.',
  },
  {
    question: 'Is the Hurst exponent stable over time?',
    plainAnswer:
      'No. Markets shift between trending and mean-reverting regimes. A stock that was strongly mean-reverting in 2010-2015 may turn into a momentum vehicle in 2020-2025. Always compute Hurst on rolling windows and watch for regime changes. A static lifetime estimate is rarely useful for live trading.',
    answer:
      'No. Markets shift between trending and mean-reverting regimes. A stock that was strongly mean-reverting in 2010-2015 may turn into a momentum vehicle in 2020-2025 (or vice versa). Always compute Hurst on rolling windows (e.g. 250-day rolling H) and watch for regime changes. A static lifetime estimate is rarely useful for live trading because it averages across multiple regimes. For systematic strategies, use the recent (last 1-2 years) Hurst as the regime indicator and switch strategy modes when it crosses 0.5.',
  },
  {
    question: 'Is this calculator free?',
    plainAnswer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
    answer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
  },
];
