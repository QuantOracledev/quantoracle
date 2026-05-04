import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is the Sharpe ratio?',
    plainAnswer:
      'The Sharpe ratio measures risk-adjusted return: how much excess return a strategy generates per unit of volatility. It is the mean of the strategy returns minus the risk-free rate, all divided by the standard deviation of the returns. Higher is better.',
    answer:
      'The Sharpe ratio measures risk-adjusted return: how much excess return a strategy generates per unit of volatility. It is the mean of the strategy returns minus the risk-free rate, all divided by the standard deviation of the returns. Higher is better. It was introduced by William Sharpe in 1966 and earned him the Nobel Prize in 1990.',
  },
  {
    question: 'What is a "good" Sharpe ratio?',
    plainAnswer:
      'For a long-only equity strategy or fund, a Sharpe of 0.5-1.0 is typical, 1.0-1.5 is good, and above 1.5 is excellent. Quant funds with diversified, market-neutral strategies often run Sharpes of 1.5-3.0. Sharpes above 3 over long periods are rare and usually reflect either undisclosed leverage, infrequent rebalancing (which understates volatility), or short track records (luck).',
    answer:
      'For a long-only equity strategy or fund, a Sharpe of 0.5-1.0 is typical, 1.0-1.5 is good, and above 1.5 is excellent. Quant funds with diversified, market-neutral strategies often run Sharpes of 1.5-3.0. Sharpes above 3 over long periods are rare and usually reflect either undisclosed leverage, infrequent rebalancing (which understates volatility), or short track records (luck).',
  },
  {
    question: 'How does the annualization factor work?',
    plainAnswer:
      'The Sharpe ratio scales with the square root of the number of periods per year. For daily returns, multiply by sqrt(252). For weekly returns, sqrt(52). For monthly, sqrt(12). The annualization factor in this calculator is the number of periods per year (e.g. 252 for daily) — the calculator does the square-root scaling internally.',
    answer: (
      <>
        The Sharpe ratio scales with the square root of the number of periods per year. For daily
        returns, multiply by <code>√252</code>. For weekly returns, <code>√52</code>. For monthly,{' '}
        <code>√12</code>. The annualization factor in this calculator is the number of periods per
        year (e.g. 252 for daily) — the calculator does the square-root scaling internally.
      </>
    ),
  },
  {
    question: 'What confidence interval should I trust?',
    plainAnswer:
      'The Sharpe ratio has a standard error that depends on the number of observations and the Sharpe value itself. With only 30 daily returns, the 95% confidence interval is so wide it is almost useless — a sample Sharpe of 2.0 might really be anywhere from -1 to 5. You usually need 2-3 years of daily data (500-750 observations) to estimate a Sharpe with reasonable precision. The CI in the results tells you the range.',
    answer:
      'The Sharpe ratio has a standard error that depends on the number of observations and the Sharpe value itself. With only 30 daily returns, the 95% confidence interval is so wide it is almost useless — a sample Sharpe of 2.0 might really be anywhere from -1 to 5. You usually need 2-3 years of daily data (500-750 observations) to estimate a Sharpe with reasonable precision. The CI in the results tells you the range.',
  },
  {
    question: 'Should I use simple or log returns?',
    plainAnswer:
      'Either, but be consistent within a series. For daily data they are nearly identical because the values are small. For longer-period returns, log returns are generally preferred because they sum across periods, but Sharpe is most often quoted on simple returns by convention. Whatever you pick, do not mix.',
    answer:
      'Either, but be consistent within a series. For daily data they are nearly identical because the values are small. For longer-period returns, log returns are generally preferred because they sum across periods, but Sharpe is most often quoted on simple returns by convention. Whatever you pick, do not mix.',
  },
  {
    question: 'What is the Probabilistic Sharpe Ratio?',
    plainAnswer:
      'The Probabilistic Sharpe Ratio (PSR), introduced by Marcos Lopez de Prado, is the probability that the true Sharpe is above a benchmark (e.g. zero, or 1.0) given the observed sample. It accounts for non-normal return distributions. The QuantOracle API exposes it at /v1/stats/probabilistic-sharpe.',
    answer: (
      <>
        The Probabilistic Sharpe Ratio (PSR), introduced by Marcos Lopez de Prado, is the
        probability that the true Sharpe is above a benchmark (e.g. zero, or 1.0) given the
        observed sample. It accounts for non-normal return distributions. The QuantOracle API
        exposes it at <code>/v1/stats/probabilistic-sharpe</code>.
      </>
    ),
  },
  {
    question: 'What about Sortino ratio? Calmar ratio?',
    plainAnswer:
      'The Sortino ratio uses downside deviation instead of total standard deviation, so it does not penalize upside volatility. The Calmar ratio uses max drawdown instead of standard deviation. Both are alternatives to Sharpe that are more relevant for asymmetric strategies. They are computed by the QuantOracle composite endpoint /v1/risk/full-analysis.',
    answer: (
      <>
        The Sortino ratio uses downside deviation instead of total standard deviation, so it does
        not penalize upside volatility. The Calmar ratio uses max drawdown instead of standard
        deviation. Both are alternatives to Sharpe that are more relevant for asymmetric strategies.
        Both are returned by the QuantOracle composite endpoint{' '}
        <code>/v1/risk/full-analysis</code>.
      </>
    ),
  },
  {
    question: 'Why is my Sharpe so high — is something wrong?',
    plainAnswer:
      'Implausibly high Sharpes (above 4-5 from real strategies) usually indicate one of: (1) a sample period too short to be meaningful; (2) returns that are autocorrelated (smoothed via infrequent valuations), which understates volatility; (3) survivorship bias in the data; or (4) an actual bug in the return calculation, like double-counting or missing dividends. Check these before celebrating.',
    answer:
      'Implausibly high Sharpes (above 4-5 from real strategies) usually indicate one of: (1) a sample period too short to be meaningful; (2) returns that are autocorrelated (smoothed via infrequent valuations), which understates volatility; (3) survivorship bias in the data; or (4) an actual bug in the return calculation, like double-counting or missing dividends. Check these before celebrating.',
  },
  {
    question: 'How many returns do I need to enter?',
    plainAnswer:
      'Mathematically, two. Practically, you want at least 30-60 for the calculation to mean anything. For statistical significance you want 250+ (one trading year of daily data). The calculator works with any positive count; the results just become less reliable with fewer observations.',
    answer:
      'Mathematically, two. Practically, you want at least 30-60 for the calculation to mean anything. For statistical significance you want 250+ (one trading year of daily data). The calculator works with any positive count; the results just become less reliable with fewer observations.',
  },
  {
    question: 'Is this calculator free?',
    plainAnswer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
    answer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
  },
];
