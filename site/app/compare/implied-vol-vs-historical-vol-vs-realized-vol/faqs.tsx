import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What\'s the difference between IV, HV, and RV?',
    plainAnswer:
      'Implied volatility (IV) is the market\'s expectation of future volatility, derived from option prices. Historical volatility (HV) is the standard deviation of past returns, computed from closing prices over a window. Realized volatility (RV) is also backward-looking but uses high-frequency intraday data and specialized estimators (Parkinson, Garman-Klass, Yang-Zhang) to capture more vol than close-to-close prices can see.',
    answer:
      'Implied volatility (IV) is the market\'s expectation of future volatility, derived by solving Black-Scholes (or a similar model) backward from the option\'s market price. It\'s forward-looking — what the market thinks vol WILL be. Historical volatility (HV) is the standard deviation of past returns, computed from closing prices over a window (typically 20-60 days). It\'s backward-looking and uses one observation per day. Realized volatility (RV) is also backward-looking but uses high-frequency intraday data and specialized estimators (Parkinson, Garman-Klass, Yang-Zhang) to capture more volatility information than close-to-close prices can see. RV is typically more accurate than HV for short-horizon forecasting.',
  },
  {
    question: 'Why is implied volatility usually higher than historical volatility?',
    plainAnswer:
      'The gap is called the "volatility risk premium" (VRP). Option sellers demand compensation for taking on volatility risk, which prices into options as a premium over realized vol. Across long histories of S&P 500 options, IV averages 2-5 percentage points higher than realized vol. That spread is the source of edge for systematic option-selling strategies (and the source of pain when vol spikes unexpectedly).',
    answer:
      'The gap is called the "volatility risk premium" (VRP) and it\'s persistent. Option sellers demand compensation for taking on volatility risk — both the realized variance over time and the tail risk of vol spikes. Across long histories of S&P 500 options, IV averages 2-5 percentage points higher than realized vol. That spread is the source of edge for systematic option-selling strategies (straddle selling, iron condors, vol-targeted writing) — and the source of pain when vol spikes unexpectedly, because the seller is short the asymmetric leg. The VRP exists for theoretical reasons (Bollerslev, Tauchen, Zhou 2009) and survives across most equity index markets globally.',
  },
  {
    question: 'When should I use IV vs HV vs RV?',
    plainAnswer:
      'Pricing an option → IV (it\'s embedded in the market price you trade against). Computing Sharpe, VaR, or risk metrics → HV (the standard time-series stdev). Forecasting tomorrow\'s vol or intraday risk → RV (Yang-Zhang outperforms close-to-close at short horizons). Backtesting an options strategy → both IV (for entry pricing) and HV (for what you actually realized in returns).',
    answer:
      'Pricing an option or evaluating an option\'s implied volatility surface → IV (it\'s the parameter embedded in the option\'s market price). Computing portfolio metrics like Sharpe, Sortino, VaR, or CVaR → HV (the standard time-series standard deviation of returns is what those formulas assume). Forecasting tomorrow\'s vol for intraday risk management → RV with Yang-Zhang or Parkinson estimators, which outperform close-to-close at short horizons. Backtesting an options strategy → both: IV for entry pricing, HV for what you actually realized in returns over the holding period. The "right" vol depends on the question.',
  },
  {
    question: 'What is Parkinson vs Garman-Klass vs Yang-Zhang?',
    plainAnswer:
      'These are realized volatility estimators that use intraday data (high, low, open, close) instead of just close prices. Parkinson (1980) uses high-low range only. Garman-Klass (1980) adds open/close. Yang-Zhang (2000) handles overnight gaps + drift bias and is the most accurate. Each captures more vol info than close-to-close stdev because intraday range encodes more about realized volatility than two daily closes.',
    answer:
      'These are realized volatility estimators that use intraday OHLC data instead of just close prices, each more sophisticated than the last. Parkinson (1980) uses just the daily high-low range, assuming continuous trading and no drift — about 5x more efficient than close-to-close. Garman-Klass (1980) adds open and close prices, handling drift slightly better. Rogers-Satchell (1991) is drift-independent. Yang-Zhang (2000) is the gold standard — handles overnight gaps + drift bias + is the minimum-variance unbiased estimator across all OHLC estimators. Each captures more vol info than close-to-close stdev because intraday range encodes the volatility you can\'t see from two daily closes. For production vol forecasting, Yang-Zhang is the default choice.',
  },
  {
    question: 'What is the "volatility smile" in implied vol?',
    plainAnswer:
      'In Black-Scholes theory, all options on the same underlying should have the same implied volatility. In reality, IV varies by strike — typically forming a "smile" (high at deep ITM and OTM strikes, low at ATM) or a "smirk" (high at OTM puts, low at OTM calls). The smile exists because real return distributions have fat tails and skew that BS doesn\'t capture. The IV surface is the 2D extension of this across strikes AND expiries.',
    answer:
      'In Black-Scholes theory, all options on the same underlying should have the same implied volatility regardless of strike or expiry. In reality, IV varies systematically across strikes — typically forming a "smile" (high IV at deep ITM and OTM strikes, lower at ATM) for currency options, or a "smirk" (high IV at OTM puts, low at OTM calls) for equity options, reflecting the market\'s pricing of crash risk. The IV surface is the 2D extension of this across strikes AND expiries. The smile/smirk exists because real return distributions have fat tails and negative skew that the log-normal assumption in Black-Scholes can\'t capture. Local volatility models (Dupire) and stochastic volatility models (Heston, SABR) explicitly model this surface; in practice most traders just calibrate to the observed surface and price relative to it.',
  },
  {
    question: 'Is implied volatility a prediction of future volatility?',
    plainAnswer:
      'Not directly. IV is the market\'s pricing of vol risk, which includes both an expected future vol component AND a risk premium. Empirically, IV is a biased predictor of realized vol — it overshoots most of the time (the volatility risk premium) but undershoots before regime breaks. The "predictive" interpretation works on average; for any specific window, IV minus RV is a tradable signal, not a forecast.',
    answer:
      'Not directly. IV is the market\'s pricing of vol risk, which includes both an expected future vol component AND a risk premium that option sellers demand. Empirically, IV is a biased predictor of realized vol — it overshoots most of the time (the volatility risk premium accounts for that 2-5pp average gap) but undershoots dramatically before regime breaks (2008, March 2020). The "predictive" interpretation works on average; for any specific window, IV minus realized RV (after the fact) is a tradable signal, not a forecast. Some practitioners use the VIX term structure (front-month vs longer-dated IV) as a regime-detection signal — backwardation typically indicates near-term stress.',
  },
  {
    question: 'Why use 30-day HV vs 60-day vs 252-day?',
    plainAnswer:
      'Window size trades off responsiveness vs noise. 30-day HV reacts quickly to regime changes but has noisy estimates. 252-day (1 year) HV is smoother but slow to update. The "right" window depends on use case: pricing 1-month options → 30-day. Pricing 1-year options → 252-day. Strategy backtest → match window to holding period. Many practitioners use multiple windows and weight them (e.g., 30/60/252 with descending weights).',
    answer:
      'Window size trades off responsiveness vs estimation noise. 30-day HV reacts quickly to regime changes (good for short-dated options) but has noisier estimates due to fewer observations. 252-day (1 year) HV is smoother and more reliable but slow to update — won\'t capture a regime change that happened 3 weeks ago. The "right" window depends on use case: pricing 1-month options → 30-day HV. Pricing 1-year options → 252-day HV. Strategy backtest → match the HV window to the strategy\'s holding period. Many practitioners use multiple windows (e.g., 30/60/252 days) with descending weights, or use GARCH-style models that adaptively weight recent observations more heavily.',
  },
  {
    question: 'How is HV computed for the Sharpe ratio?',
    plainAnswer:
      'For Sharpe: take daily returns, compute sample standard deviation (n-1 denominator), then annualize by multiplying by sqrt(252). For monthly returns, multiply by sqrt(12). The Sharpe formula uses this annualized HV as the denominator. Some practitioners use log returns instead of simple returns; the difference is small for normal-vol regimes but meaningful for high-vol assets like crypto.',
    answer:
      'For Sharpe ratio computation: take periodic returns (usually daily or monthly), compute the sample standard deviation (n-1 denominator for unbiased estimation), then annualize by multiplying by √(periods per year). For daily returns, multiply by √252. For monthly, √12. The Sharpe formula uses this annualized historical volatility as the denominator: Sharpe = (annualized excess return) / (annualized HV). Some practitioners use log returns instead of simple returns; the difference is small for normal-vol regimes but meaningful for high-vol assets like crypto where geometric vs arithmetic distinction matters. The QuantOracle Sharpe ratio calculator uses the standard sample-stdev approach with daily annualization.',
  },
  {
    question: 'Does QuantOracle have calculators for all three?',
    plainAnswer:
      'Implied volatility — yes, /implied-volatility-calculator solves for IV given a market option price using Newton-Raphson. Historical volatility — yes, indirectly via the Sharpe ratio calculator (which computes annualized stdev as part of Sharpe) and the VaR calculator. Realized volatility — yes, the API has /v1/stats/realized-volatility supporting Parkinson + Yang-Zhang + close-to-close. A standalone realized-vol calculator page is on the roadmap.',
    answer:
      'Implied volatility — yes, the /implied-volatility-calculator solves for IV given a market option price using Newton-Raphson iteration on the Black-Scholes formula. Historical volatility — yes indirectly, via the /sharpe-ratio-calculator (which computes annualized stdev as part of Sharpe) and the /value-at-risk-calculator (which uses HV for parametric VaR). Realized volatility — yes, the API endpoint /v1/stats/realized-volatility supports Parkinson, Yang-Zhang, and close-to-close estimators. A standalone realized-vol calculator page is on the roadmap; for now you can call the endpoint directly via the OpenAPI spec.',
  },
  {
    question: 'What about VVIX, GARCH, and other vol-of-vol concepts?',
    plainAnswer:
      'VVIX measures the IV of VIX options — "vol of vol" — and is useful for detecting regime stress. GARCH models the time-varying volatility process itself, treating today\'s vol as a function of past vol and past returns. Both are extensions beyond the IV/HV/RV trio: VVIX adds a higher-moment dimension; GARCH adds a time-series structure. For most practitioners, IV/HV/RV is enough; GARCH and VVIX matter mainly for vol-targeting strategies and risk-parity portfolios.',
    answer:
      'VVIX (the CBOE\'s "vol of vol" index) measures the implied volatility of VIX options — it\'s a higher-moment volatility signal useful for detecting regime stress before it shows up in vanilla IV. GARCH models the time-varying volatility process itself, treating today\'s vol as a function of past vol and past returns; useful for forecasting vol persistence and asymmetric responses to negative vs positive shocks. Both are extensions beyond the IV/HV/RV trio: VVIX adds a higher-moment dimension; GARCH adds a time-series structure. For most practitioners, IV/HV/RV is enough; GARCH and VVIX matter mainly for vol-targeting strategies, risk-parity portfolios, and academic vol-forecasting research. The QuantOracle API has /v1/stats/garch-forecast for fitting GARCH(1,1) to a return series.',
  },
];
