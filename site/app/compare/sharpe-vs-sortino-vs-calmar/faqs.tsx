import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'Which is best: Sharpe, Sortino, or Calmar?',
    plainAnswer:
      'No single metric is best — they measure different things. Sharpe is the industry default and best for comparing across funds. Sortino is better for strategies with asymmetric (skewed) returns. Calmar is best for capital-allocation decisions where surviving large drawdowns matters more than smooth returns. Sophisticated allocators report all three.',
    answer:
      'No single metric is best — they measure different things. Sharpe is the industry default and best for comparing across funds. Sortino is better for strategies with asymmetric (skewed) returns because it does not penalize upside volatility. Calmar is best for capital-allocation decisions where surviving large drawdowns matters more than smooth returns. Sophisticated allocators report all three; using just one in isolation usually misleads.',
  },
  {
    question: 'Why is Sortino almost always higher than Sharpe?',
    plainAnswer:
      'Sortino only counts downside volatility in the denominator while Sharpe counts both upside and downside. Since most strategies have some upside volatility, removing it from the denominator shrinks it, which raises the ratio. The gap is largest for strategies with positive skew (occasional big wins) like trend-following.',
    answer:
      'Sortino only counts downside volatility (returns below a target, usually zero or the risk-free rate) in the denominator, while Sharpe counts both upside and downside volatility. Since most strategies have some upside volatility, removing it shrinks the denominator, which mechanically raises the ratio. The gap between Sortino and Sharpe is largest for strategies with positive skew (occasional big wins, frequent small losses) — trend-following and long-volatility strategies often score 1.5-2x higher on Sortino than on Sharpe. The gap is smallest for strategies with symmetric or negatively skewed returns.',
  },
  {
    question: 'When does Sharpe lie?',
    plainAnswer:
      'Sharpe lies when returns are non-normal — specifically when there is significant negative skew or fat tails. Strategies like option selling, carry trades, and short-volatility can show beautiful Sharpe ratios in calm periods because their few wins are small but consistent. The blowup that defines them is invisible until it happens. Calmar and Sortino partially correct this; the probabilistic Sharpe ratio (PSR) corrects it explicitly.',
    answer:
      'Sharpe lies when returns are non-normal — specifically when there is significant negative skew or fat tails. Strategies like option selling, carry trades, and short-volatility can show beautiful Sharpe ratios in calm periods because their few wins are small but consistent. The blowup that defines them is invisible in the Sharpe number until it happens. Calmar partially corrects this by using the worst observed drawdown rather than volatility, so a strategy that has experienced a real drawdown shows it. The probabilistic Sharpe ratio (PSR) corrects it explicitly by adjusting for skewness and kurtosis in the return distribution.',
  },
  {
    question: 'What Sharpe / Sortino / Calmar values are considered good?',
    plainAnswer:
      'Rough rules of thumb (annualized, after fees): Sharpe above 1.0 is good, above 2.0 is excellent, above 3.0 is suspect. Sortino above 1.5 is good (usually 1.3-1.7x the Sharpe). Calmar above 0.5 is acceptable for long-only equity, above 1.0 is good, above 3.0 is excellent and rare. These vary by asset class — bond strategies routinely show higher Sharpes than equity; crypto strategies often have lower Calmars due to deeper drawdowns.',
    answer:
      'Rough rules of thumb (annualized, after fees, computed on at least 3 years of monthly returns): Sharpe above 1.0 is good for an active strategy, above 2.0 is excellent, above 3.0 is suspect (often a data error or short sample). Sortino above 1.5 is good (typically 1.3-1.7x the Sharpe). Calmar above 0.5 is acceptable for long-only equity, above 1.0 is good, above 3.0 is excellent and rare. These vary substantially by asset class — bond strategies routinely show higher Sharpes than equity because vol is lower; crypto strategies often have lower Calmars due to deeper drawdowns even when Sharpe looks healthy.',
  },
  {
    question: 'What is the formula difference?',
    plainAnswer:
      'Sharpe = (mean return − risk-free rate) / standard deviation of returns. Sortino = (mean return − risk-free rate) / downside deviation (only returns below a threshold contribute). Calmar = annualized return / |maximum drawdown|. All three are annualized for comparison.',
    answer:
      'Sharpe = (mean return − risk-free rate) / standard deviation of returns. Sortino = (mean return − risk-free rate) / downside deviation (only returns below a target threshold — usually 0 or the risk-free rate — contribute to the denominator). Calmar = annualized return / absolute value of maximum drawdown. All three are typically annualized for comparison: Sharpe and Sortino by multiplying by √(periods per year), Calmar is already in annualized form.',
  },
  {
    question: 'Why do some strategies have negative Sortino but positive Calmar?',
    plainAnswer:
      'Sortino measures recent return-per-downside-vol; Calmar measures lifetime return-per-worst-loss. A strategy that has been bleeding recently (negative Sortino) can still have a positive Calmar if its long-term return is positive — the drawdown denominator was set long ago and the cumulative return is still net positive. Watch when these diverge: it usually means the strategy has degraded but the historical track record is masking it.',
    answer:
      'Sortino measures recent return-per-downside-vol while Calmar measures lifetime return-per-worst-loss. A strategy that has been bleeding recently (negative Sortino over the trailing window) can still have a positive Calmar if its long-term return is positive — the drawdown denominator was set long ago and the cumulative return is still net positive. Watch when these diverge: it usually means the strategy has degraded but the historical track record is masking it. Many allocators screen for strategies where rolling 12-month Sortino is positive AND lifetime Calmar > 0.5; if Sortino goes negative they de-allocate even if Calmar still looks fine.',
  },
  {
    question: 'Can I use these for crypto and FX, not just stocks?',
    plainAnswer:
      'Yes. The formulas are asset-class agnostic. The interpretive ranges differ: crypto strategies often show Sortino 0.8-1.5 and Calmar 0.5-1.0 due to higher tail risk, while a "good" equity long-short might show Sortino 1.5-2.0 and Calmar 1.5-2.5. Whatever asset, compute on at least 3 years of returns and use the same risk-free rate convention across strategies you compare.',
    answer:
      'Yes. The formulas are asset-class agnostic. The interpretive ranges differ: crypto strategies often show Sortino 0.8-1.5 and Calmar 0.5-1.0 due to higher tail risk in the underlying, while a "good" equity long-short might show Sortino 1.5-2.0 and Calmar 1.5-2.5. FX strategies (especially carry trades) require extra care because negative skew dominates — Sharpe will overstate edge dramatically vs Sortino or Calmar. Whatever asset, compute on at least 3 years of returns and use the same risk-free rate convention across strategies you compare.',
  },
  {
    question: 'Which one do allocators actually use?',
    plainAnswer:
      'Allocators report Sharpe for comparability (it is the industry default), but the metric that drives capital allocation decisions is usually Calmar — because drawdown tolerance, not volatility tolerance, is what kills funds. Many quant funds publish all three plus Sortino in monthly tearsheets. Modern shops also add the probabilistic Sharpe ratio (PSR) for statistical significance.',
    answer:
      'Allocators report Sharpe ratio for comparability (it is the industry default and lets LPs compare across managers), but the metric that drives capital allocation decisions is usually Calmar — because drawdown tolerance, not volatility tolerance, is what causes funds to be redeemed or closed. Many quant funds publish all three (Sharpe + Sortino + Calmar) in monthly tearsheets, plus the maximum drawdown itself. Modern shops also add the probabilistic Sharpe ratio (PSR, Bailey & Lopez de Prado 2012) to communicate statistical significance — a Sharpe of 1.5 over 6 months is not the same as Sharpe of 1.5 over 5 years.',
  },
  {
    question: 'Where does Treynor / Information Ratio fit in?',
    plainAnswer:
      'Different family of metrics. Treynor and Information Ratio use systematic risk (beta) or active tracking error in the denominator instead of total volatility. They are best for relative-return strategies measured against a benchmark. Sharpe / Sortino / Calmar measure absolute return risk and are more useful for absolute-return strategies (most hedge funds, crypto, long-short).',
    answer:
      'Treynor and Information Ratio are a different family of risk-adjusted return metrics. Treynor uses systematic risk (beta to a benchmark) in the denominator instead of total volatility. Information Ratio uses tracking error (volatility of excess returns vs a benchmark). Both are best for relative-return strategies measured against a benchmark — e.g., a US large-cap equity manager measured against the S&P 500. Sharpe / Sortino / Calmar measure absolute return risk and are more useful for absolute-return strategies (most hedge funds, crypto, long-short, market-neutral, futures CTAs).',
  },
  {
    question: 'Is there a calculator for all three?',
    plainAnswer:
      'Yes. The QuantOracle Sharpe Ratio Calculator computes Sharpe with a confidence interval. The Drawdown Calculator gives you max drawdown for Calmar. A standalone Sortino calculator is on the roadmap; in the meantime, the Probabilistic Sharpe Ratio Calculator surfaces the same higher-moment information (skewness, kurtosis) that motivates using Sortino.',
    answer:
      'Yes. The QuantOracle Sharpe Ratio Calculator computes Sharpe with a 95% confidence interval. The Drawdown Calculator gives you max drawdown for the Calmar denominator. A standalone Sortino calculator is on the roadmap; in the meantime, the Probabilistic Sharpe Ratio Calculator surfaces the same higher-moment information (skewness, kurtosis) that motivates using Sortino in the first place — if your strategy has notably negative skew or fat tails, PSR will flag it and you should also compute Sortino externally.',
  },
];
