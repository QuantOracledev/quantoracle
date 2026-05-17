import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'Z-score, Bollinger Bands, or RSI — which mean-reversion indicator should I use?',
    plainAnswer:
      'Z-score for cross-asset comparison or pairs trading (it normalizes by standard deviation so different assets are comparable). Bollinger Bands for single-asset overbought/oversold flagging with a visual chart overlay. RSI for momentum-overlay use cases where you want a 0-100 bounded indicator. Z-score is the most statistically defensible; Bollinger Bands and RSI are popular because they\'re easier to eyeball on a chart.',
    answer:
      'Pick by your use case: (1) Cross-asset comparison or pairs trading → Z-score, because it normalizes returns by their own standard deviation so a "2-sigma move" means the same thing for a 5%-vol bond and a 50%-vol crypto. (2) Single-asset overbought/oversold with visual chart overlay → Bollinger Bands, because they plot directly on price and traders intuitively read "price touching the upper band" as overbought. (3) Bounded 0-100 momentum-style overlay (often combined with trend filters) → RSI. All three are essentially "is this asset N standard deviations from its mean?" with different framings. Z-score is the most statistically defensible (clear distributional interpretation, scale-invariant); Bollinger Bands are popular because they overlay on price; RSI is popular because the 0-100 scale is intuitive even though the math is more opaque.',
  },
  {
    question: 'How is a Z-score calculated?',
    plainAnswer:
      'Z = (current value − rolling mean) / rolling standard deviation. The "rolling" window is typically 20-60 periods. A Z-score of +2 means the current value is 2 standard deviations above its recent mean; -2 means 2 standard deviations below. By convention, |Z| > 2 is "extreme" and |Z| > 3 is "very extreme" — those are the same thresholds used in statistics generally.',
    answer:
      'Z = (x − μ) / σ where x is the current observation, μ is the rolling mean over a chosen window, and σ is the rolling standard deviation over the same window. Typical windows: 20 periods for short-term signals, 60 for medium-term, 252 for annual benchmarks. A Z-score of +2.0 means the current value is 2 standard deviations above its recent mean — under a normal-distribution assumption this happens about 2.5% of the time, so it\'s a meaningful outlier signal. Thresholds: |Z| > 2 is "extreme," |Z| > 3 is "very extreme." For trading signals, classic mean-reversion entries trigger at |Z| > 2 and exit when |Z| approaches 0. The choice of window matters: a too-short window over-flags noise as signal; a too-long window misses regime changes.',
  },
  {
    question: 'What are Bollinger Bands and how are they computed?',
    plainAnswer:
      'Bollinger Bands plot three lines: a 20-period simple moving average (middle band), and two bands at ±2 standard deviations from that average (upper and lower bands). When price touches the upper band, the asset is "overbought" in standard-deviation terms; touching the lower band is "oversold." The interpretation is identical to Z-scores at ±2.0 — Bollinger Bands are just the visual chart overlay version.',
    answer:
      'John Bollinger\'s 1980s invention: three lines plotted on a price chart. (1) Middle band = N-period simple moving average of close prices (default N=20). (2) Upper band = middle + K standard deviations (default K=2). (3) Lower band = middle − K standard deviations. The 20/2 default came from empirical work but any window/multiplier works. When price touches the upper band, the close is 2 SD above its 20-day mean — statistically the same as a Z-score of +2.0. When price touches the lower band, Z = −2. Bollinger himself recommended using the bands as "envelopes for normal trading activity" rather than trade signals — moves outside the bands are unusual but not automatically reversal signals. The "Bollinger band squeeze" (bands narrowing) is also popular as a volatility-contraction signal preceding breakouts.',
  },
  {
    question: 'What is RSI and how does it differ from a Z-score?',
    plainAnswer:
      'RSI (Relative Strength Index) compares average gains to average losses over a window (typically 14 periods) and outputs a 0-100 bounded value. RSI > 70 is conventionally "overbought," RSI < 30 is "oversold." Unlike Z-score, RSI doesn\'t directly normalize by standard deviation — it\'s closer to a smoothed momentum indicator. Two prices with the same Z-score can have very different RSI values depending on path.',
    answer:
      'Welles Wilder\'s 1978 indicator. The formula: RSI = 100 − [100 / (1 + RS)], where RS = (average gain over N periods) / (average loss over N periods). N is typically 14. The output is bounded 0-100: 100 means all gains, 0 means all losses, 50 means equal. Convention: RSI > 70 is overbought, RSI < 30 is oversold. The bounded scale is easier to read than Z-scores or Bollinger Bands, which is why retail traders prefer it. The key technical difference from Z-score: RSI uses absolute values of gains/losses, not standard deviations. Two paths arriving at the same current price with the same recent volatility can have very different RSI values depending on the sequence of moves. RSI is closer to a smoothed momentum indicator than a true overbought/oversold measure — under most market conditions the three indicators (Z, BB, RSI) flash similar signals, but they disagree most often during sharp directional moves.',
  },
  {
    question: 'Which is the best for pairs trading?',
    plainAnswer:
      'Z-score, with very few exceptions. Pairs trading requires normalized comparison of two assets\' spread, and Z-score is built for that. Bollinger Bands work on a single price series, so applying them to a pairs spread requires extra computation that\'s effectively a Z-score anyway. RSI doesn\'t directly model spread mean reversion. For statistical-arbitrage / pairs work, Z-score is the standard.',
    answer:
      'Z-score, essentially always. Pairs trading rests on the idea that two cointegrated assets have a mean-reverting spread — when the spread is far from its mean (measured in standard deviations), trade against the deviation expecting reversion. Z-score is exactly this measurement: (current spread − rolling mean) / rolling SD. Bollinger Bands can technically be applied to a spread series (subtract the two prices, then plot BB on the resulting series), but the math is identical to Z-score with a 2-sigma trigger — just rendered differently. RSI applied to a spread is unusual and not well-justified theoretically; the bounded 0-100 transformation obscures the standard-deviation interpretation. For statistical-arbitrage work, build everything on Z-score (or its more sophisticated cousins: Kalman-filter rolling beta, Engle-Granger error-correction terms). Bollinger Bands and RSI are visual / retail tools; Z-score is the institutional one.',
  },
  {
    question: 'What is a reasonable window size?',
    plainAnswer:
      'Z-score: 20 periods for fast signals, 60 for medium-term, 252 for annual baselines. Bollinger Bands: standard is 20 periods (preserves Bollinger\'s original convention). RSI: 14 periods (Wilder\'s original). Short windows are noisier but more responsive; long windows lag but are smoother. For systematic strategies, parameter-tune the window on out-of-sample data rather than blindly using defaults.',
    answer:
      'Standard defaults reflect different design philosophies: (1) Z-score windows are case-by-case. 20 periods for intraday and short-term swing signals, 60 for medium-term mean reversion, 252 (one trading year) for annual baselines and statistical-significance estimates. (2) Bollinger Bands almost always 20 periods because that\'s John Bollinger\'s original convention and trading charts default to it. (3) RSI almost always 14 periods because Wilder\'s 1978 default. Shorter windows are more responsive to regime change but noisier; longer windows lag but smooth out single-event spikes. For systematic strategies, the right move is to walk-forward optimize the window on held-out data. Common findings: 14-period RSI is sub-optimal for most markets and 25-30 is often better; 20-period Bollinger is roughly correct for daily equity bars but too long for intraday; Z-score windows of 60-100 outperform 20 for cross-sectional pairs trading because they better capture true cointegration vs noise.',
  },
  {
    question: 'When do these indicators disagree?',
    plainAnswer:
      'Most often during sharp trending moves. Z-score and Bollinger Bands will quickly hit ±2 during a strong trend (because price keeps making new highs or lows), but RSI can lag or even decline during the late stages of an uptrend (called "bearish divergence"). Conversely, RSI can show overbought during a sustained rally that hasn\'t yet hit the Z-score / Bollinger threshold. The disagreement is informative — when three different mean-reversion measures disagree about a regime, momentum is usually dominating.',
    answer:
      'The three diverge most during sharp trending moves. (1) Z-score and Bollinger Bands quickly hit ±2 / band-touch during strong trends because both are scale-free measures of "how far from the rolling mean." So they flash overbought repeatedly during uptrends, often falsely from a mean-reversion-strategy perspective. (2) RSI, because of its smoothed-momentum construction, can lag during the early phase of a trend and even decline during the late stage (the classic "bearish divergence" where price keeps making new highs but RSI lower-highs). When the three indicators disagree about regime — Z-score says overbought but RSI says neutral, or vice versa — that disagreement is itself useful information. The standard interpretation: when momentum-style indicators (RSI) lag standard-deviation indicators (Z, BB), trend strength is high and mean-reversion signals are likely to be wrong. When all three agree, the signal is strong.',
  },
  {
    question: 'Are these indicators backed by any statistical theory?',
    plainAnswer:
      'Z-score is — directly. Under any distribution assumption you can interpret Z = ±2 as a tail event. Bollinger Bands inherit this when prices are roughly normal. RSI has no clean distributional interpretation and is empirically motivated. For statistical arbitrage and formal mean-reversion testing, only Z-score gives you the p-values and confidence intervals you can defend in a quant pitch.',
    answer:
      'Z-score is directly statistical: under any distributional assumption you choose, |Z| = 2 is interpretable as a tail event. Under normal-distribution assumption, |Z| > 2 happens 4.6% of the time (two-sided); under Student-t with 5 degrees of freedom, about 9%; under empirical fat-tail observations, somewhere in between. Bollinger Bands inherit this interpretation when prices are roughly normal. RSI has no clean distributional theory — it was constructed empirically by Wilder based on what he saw work in practice. For formal mean-reversion testing (Augmented Dickey-Fuller, variance-ratio tests, Hurst exponent under R/S analysis) you work with the residual series, not with RSI. For pitch deck statistical-arbitrage strategies, Z-score lets you defend "p < 0.05 at entry" claims; RSI does not. This is part of why institutional shops use Z-score and retail traders use RSI.',
  },
  {
    question: 'Can I combine them?',
    plainAnswer:
      'Yes, common stack: require BOTH Bollinger band touch AND RSI confirmation (e.g., enter mean-reversion long when price touches lower BB AND RSI < 30). This filters false signals during strong trends because the three indicators rarely all flash at the same time during sustained directional moves. For systematic backtesting, just remember each filter cuts roughly half the signals — combining three can leave you with very few trade events per year.',
    answer:
      'Common stack: require multiple indicators to agree before entering a mean-reversion trade. Examples: (1) Enter long when price touches the lower Bollinger Band AND RSI < 30 — this filters out the false signals you get during sharp downtrends where price keeps making new lows but RSI doesn\'t yet confirm oversold conditions. (2) Enter short when Z-score > 2 AND RSI > 70 AND volume contracts — adds a volume confirmation. The math behind why this works: each indicator has a false-positive rate during strong trends; requiring multiple to agree compounds the trend-filter effect because the indicators are correlated but not perfectly. The cost: each filter cuts roughly half the signal events, so combining three can leave you with only ~5-15 trades per year. For systematic backtesting that\'s often too few to evaluate; you\'d need decades of data. For discretionary trading the lower frequency is actually preferred.',
  },
  {
    question: 'Which QuantOracle calculators implement these?',
    plainAnswer:
      'Z-score: /stats/zscore endpoint with rolling-window support. Bollinger Bands: /indicators/bollinger-bands endpoint. RSI: included in /indicators/technical (which returns the full standard indicator set). For mean-reversion regime classification across these signals, use /indicators/regime-classify (paid composite, $0.015). For deeper detection: /stats/hurst-exponent and the Hurst Exponent Calculator on the site.',
    answer:
      'Direct endpoints: (1) /v1/stats/zscore — static and rolling Z-scores with extreme-value detection. Accepts a series and window, returns Z values plus indices of |Z| > threshold. (2) /v1/indicators/bollinger-bands — middle/upper/lower bands plus current position. (3) /v1/indicators/technical — composite that returns RSI alongside the full standard indicator set (SMA, EMA, MACD, ATR, stochastic). For mean-reversion regime detection that combines these and other signals, the paid /v1/indicators/regime-classify composite ($0.015) returns a regime label (trending / mean-reverting / random walk) using Hurst, autocorrelation, and momentum factors together. Also relevant: the Hurst Exponent Calculator and the underlying /v1/stats/hurst-exponent endpoint for the more theoretically-grounded version of "is this series mean-reverting?"',
  },
];
