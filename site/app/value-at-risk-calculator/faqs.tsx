import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is Value at Risk (VaR)?',
    plainAnswer:
      'Value at Risk is the maximum loss you would expect a portfolio to suffer over a given holding period at a chosen confidence level. A 1-day 95% VaR of 2% means: on 95% of days, you should lose less than 2%. On 5% of days, you should lose more.',
    answer:
      'Value at Risk is the maximum loss you would expect a portfolio to suffer over a given holding period at a chosen confidence level. A 1-day 95% VaR of 2% means: on 95 of 100 days, you should lose less than 2%. On the remaining 5 days, you should lose more — and VaR does not tell you how much more.',
  },
  {
    question: 'What is the difference between VaR and CVaR?',
    plainAnswer:
      'VaR is the threshold loss at the chosen confidence level. CVaR (also called Expected Shortfall, or ES) is the average loss given that you are in the tail beyond VaR. CVaR is always larger than VaR and is the answer to "if it is a bad day, how bad on average?"',
    answer:
      'VaR is the threshold loss at the chosen confidence level. CVaR (also called Expected Shortfall, or ES) is the average loss given that you are in the tail beyond VaR. CVaR is always larger than VaR and is the answer to "if it is a bad day, how bad on average?" Banks have largely moved from VaR to CVaR for regulatory capital because CVaR captures tail severity.',
  },
  {
    question: 'What is parametric VaR?',
    plainAnswer:
      'Parametric VaR assumes returns follow a known distribution (usually normal) and computes VaR analytically from the mean and standard deviation: VaR = z * sigma * sqrt(holding_period), where z is the standard-normal quantile at your confidence level. It is fast and simple but understates tail risk for fat-tailed assets.',
    answer: (
      <>
        Parametric VaR assumes returns follow a known distribution (usually normal) and computes
        VaR analytically from the mean and standard deviation:{' '}
        <code>VaR = z · σ · √holding_period</code>, where <code>z</code> is the standard-normal
        quantile at your confidence level (1.65 for 95%, 2.33 for 99%). It is fast and simple but
        understates tail risk for fat-tailed assets.
      </>
    ),
  },
  {
    question: 'What confidence level should I use?',
    plainAnswer:
      'For routine risk monitoring, 95% is standard. For regulatory capital and stress scenarios, 99% or even 99.5% is used. Some firms also report 90% for a less conservative view. The calculator returns both 95% and 99% by default; you can change them.',
    answer:
      'For routine risk monitoring, 95% is standard. For regulatory capital and stress scenarios, 99% or even 99.5% is used. Some firms also report 90% for a less conservative view. The calculator returns both 95% and 99% by default; you can change them by editing the confidence levels input.',
  },
  {
    question: 'What is the holding period for?',
    plainAnswer:
      'Holding period is how long you assume the portfolio is held before you can rebalance. A 1-day VaR is for active intraday or daily-marked positions; a 10-day VaR is the Basel regulatory standard for banks; longer horizons (30, 252 days) are used for less-liquid portfolios. VaR scales with the square root of the holding period.',
    answer: (
      <>
        Holding period is how long you assume the portfolio is held before you can rebalance. A
        1-day VaR is for active intraday or daily-marked positions; a 10-day VaR is the Basel
        regulatory standard for banks; longer horizons (30, 252 days) are used for less-liquid
        portfolios. VaR scales with the square root of the holding period:{' '}
        <code>VaR(T) = VaR(1) × √T</code>.
      </>
    ),
  },
  {
    question: 'Should I trust VaR for fat-tailed assets?',
    plainAnswer:
      'Cautiously. Parametric VaR assumes normal returns, but real-world assets like equities (especially in crisis), single-name stocks, and crypto have much fatter tails than normal. Their actual large-loss days are 2-10x more frequent than parametric VaR predicts. For these, use historical-simulation VaR or Monte Carlo with a fat-tailed distribution. The QuantOracle API has Monte Carlo at /v1/simulate/montecarlo for fatter-tail modeling.',
    answer:
      'Cautiously. Parametric VaR assumes normal returns, but real-world assets like equities (especially in crisis), single-name stocks, and crypto have much fatter tails than normal. Their actual large-loss days are 2-10x more frequent than parametric VaR predicts. For these, use historical-simulation VaR or Monte Carlo with a fat-tailed distribution. The skewness and kurtosis returned by this calculator give you a sense of how non-normal your data is.',
  },
  {
    question: 'What do skewness and kurtosis tell me?',
    plainAnswer:
      'Skewness measures asymmetry. Negative skew (most equity strategies) means the left tail is longer — big losses are more common than big gains of equivalent size. Kurtosis measures fatness of tails. Excess kurtosis above 0 means tails are fatter than normal — large moves of either direction are more common than the normal distribution predicts. High kurtosis is a warning sign that parametric VaR is understating risk.',
    answer:
      'Skewness measures asymmetry. Negative skew (most equity strategies) means the left tail is longer — big losses are more common than big gains of equivalent size. Kurtosis measures fatness of tails. Excess kurtosis above 0 means tails are fatter than normal — large moves of either direction are more common than the normal distribution predicts. High kurtosis is a warning sign that parametric VaR is understating risk.',
  },
  {
    question: 'How many returns do I need?',
    plainAnswer:
      'Mathematically, two. Practically, at least 60 daily returns for the parametric calculation to be meaningful, and ideally 252+ (one trading year). The accuracy of the volatility estimate, which dominates the VaR calculation, improves with sample size.',
    answer:
      'Mathematically, two. Practically, at least 60 daily returns for the parametric calculation to be meaningful, and ideally 252+ (one trading year). The accuracy of the volatility estimate, which dominates the VaR calculation, improves with sample size.',
  },
  {
    question: 'Why is my dollar VaR not shown?',
    plainAnswer:
      'It only appears if you supply a portfolio value. Enter your total position value in dollars and the calculator will multiply VaR percentages by that to give dollar amounts.',
    answer:
      'It only appears if you supply a portfolio value. Enter your total position value in dollars and the calculator will multiply VaR percentages by that to give dollar amounts.',
  },
  {
    question: 'Is this calculator free?',
    plainAnswer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
    answer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
  },
];
