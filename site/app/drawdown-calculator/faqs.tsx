import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is drawdown?',
    plainAnswer:
      'Drawdown is the peak-to-trough decline of an investment or portfolio value during a specific period, expressed as a percentage from the previous high. If your portfolio peaked at $100K and fell to $80K before recovering, that is a 20% drawdown.',
    answer:
      'Drawdown is the peak-to-trough decline of an investment or portfolio value during a specific period, expressed as a percentage from the previous high. If your portfolio peaked at $100K and fell to $80K before recovering, that is a 20% drawdown. Drawdowns are tracked because losses compound asymmetrically with gains: a 50% drawdown requires a 100% gain to recover, not a 50% gain.',
  },
  {
    question: 'What is "max drawdown" and why does it matter?',
    plainAnswer:
      'Max drawdown is the largest peak-to-trough decline in the equity curve over the entire period analyzed. It represents the worst loss an investor would have experienced. Max drawdown matters more than volatility for investors who care about loss tolerance — a strategy with 10% volatility but 50% max drawdown is psychologically different from one with 10% volatility but 15% max drawdown.',
    answer:
      'Max drawdown is the largest peak-to-trough decline in the equity curve over the entire period analyzed. It represents the worst loss an investor would have experienced. Max drawdown matters more than volatility for investors who care about loss tolerance — a strategy with 10% volatility but 50% max drawdown is psychologically different from one with 10% volatility but 15% max drawdown, even though the volatility numbers look similar.',
  },
  {
    question: 'What is recovery time?',
    plainAnswer:
      'Recovery time is the number of periods between the peak (start of drawdown) and the next equal-or-higher peak (end of recovery). A drawdown of 30% with a 24-month recovery time means the strategy lost 30% from its peak and took 24 months to get back to the previous high. Long recovery times often matter more than the drawdown depth for investor patience.',
    answer:
      'Recovery time is the number of periods between the peak (start of drawdown) and the next equal-or-higher peak (end of recovery). A drawdown of 30% with a 24-month recovery time means the strategy lost 30% from its peak and took 24 months to get back to the previous high. Long recovery times often matter more than the drawdown depth for investor patience — many investors will tolerate a deep but short drawdown but abandon a strategy that grinds sideways for years recovering.',
  },
  {
    question: 'What does this calculator need as input?',
    plainAnswer:
      'An equity curve — a series of portfolio values over time (e.g. daily, weekly, or monthly closing values). If you only have returns, multiply them cumulatively starting from a base value (commonly 100 or 1) to convert to an equity curve. The calculator finds the peaks, troughs, and durations from the curve.',
    answer:
      'An equity curve — a series of portfolio values over time (e.g. daily, weekly, or monthly closing values). If you only have returns, multiply them cumulatively starting from a base value (commonly 100 or 1) to convert to an equity curve. The calculator finds the peaks, troughs, and durations from the curve.',
  },
  {
    question: 'How is drawdown different from volatility?',
    plainAnswer:
      'Volatility measures the dispersion of returns (standard deviation). Drawdown measures the worst peak-to-trough decline. A strategy can have low volatility but a single large drawdown (fat-tailed losses), or high volatility but no large drawdowns (oscillating but recovering quickly). Most investors care more about drawdown than volatility because losses are felt more painfully than upside is enjoyed.',
    answer:
      'Volatility measures the dispersion of returns (standard deviation). Drawdown measures the worst peak-to-trough decline. A strategy can have low volatility but a single large drawdown (fat-tailed losses), or high volatility but no large drawdowns (oscillating but recovering quickly). Most investors care more about drawdown than volatility because losses are felt more painfully than upside is enjoyed (loss aversion in behavioral finance).',
  },
  {
    question: 'What is the Calmar ratio?',
    plainAnswer:
      'Calmar ratio = annualized return / absolute max drawdown. It measures return per unit of downside risk, where downside is defined as the worst loss rather than as volatility (which is what Sharpe uses). Higher is better. Above 0.5 is decent for trading strategies; above 1.0 is good; above 3.0 is excellent.',
    answer: (
      <>
        Calmar ratio = <code>annualized return / absolute max drawdown</code>. It measures return
        per unit of downside risk, where downside is defined as the worst loss rather than as
        volatility (which is what{' '}
        <a href="/sharpe-ratio-calculator" className="text-accent">
          Sharpe ratio
        </a>{' '}
        uses). Higher is better. Above 0.5 is decent for trading strategies; above 1.0 is good;
        above 3.0 is excellent.
      </>
    ),
  },
  {
    question: 'How do I avoid drawdowns?',
    plainAnswer:
      'You cannot eliminate them entirely — every strategy with positive expected return will experience drawdowns, especially during regime changes. You can reduce them via: (1) lower position sizing (smaller bets = smaller drawdowns), (2) stop-loss rules, (3) diversification across uncorrelated strategies, (4) trend-following filters that exit during prolonged downturns. Each comes with a cost in expected return.',
    answer:
      'You cannot eliminate them entirely — every strategy with positive expected return will experience drawdowns, especially during regime changes. You can reduce them via: (1) lower position sizing (smaller bets = smaller drawdowns), (2) stop-loss rules, (3) diversification across uncorrelated strategies, (4) trend-following filters that exit during prolonged downturns. Each comes with a cost in expected return — you cannot have both high returns and zero drawdowns.',
  },
  {
    question: 'What max drawdown is "acceptable" for a strategy?',
    plainAnswer:
      'Depends on the strategy and the investor. Long-only equity strategies typically experience 30-50% max drawdowns historically (S&P 500 had 56% in 2008). Trend-following CTA funds typically operate with 15-25% max drawdowns. Market-neutral strategies aim for under 10%. Pick a strategy whose drawdown profile you can stomach behaviorally; the math does not matter if you exit at the trough.',
    answer:
      'Depends on the strategy and the investor. Long-only equity strategies typically experience 30-50% max drawdowns historically (S&P 500 had 56% in 2008). Trend-following CTA funds typically operate with 15-25% max drawdowns. Market-neutral strategies aim for under 10%. Pick a strategy whose drawdown profile you can stomach behaviorally; the math does not matter if you exit at the trough.',
  },
  {
    question: 'How many data points do I need?',
    plainAnswer:
      'Mathematically, two. Practically, at least 60-100 data points to capture meaningful drawdown patterns. For long-term strategy evaluation, 250+ daily values (one trading year) or 60+ monthly values (5 years) is preferred.',
    answer:
      'Mathematically, two. Practically, at least 60-100 data points to capture meaningful drawdown patterns. For long-term strategy evaluation, 250+ daily values (one trading year) or 60+ monthly values (5 years) is preferred.',
  },
  {
    question: 'Is this calculator free?',
    plainAnswer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
    answer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
  },
];
