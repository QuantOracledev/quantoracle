import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is an American option?',
    plainAnswer:
      'An American option can be exercised at any time before expiration, not only at expiration. Almost all US-listed equity and ETF options are American-style. Most index options (SPX, NDX) are European.',
    answer:
      'An American option can be exercised at any time before expiration, not only at expiration. Almost all US-listed equity and ETF options (AAPL, NVDA, SPY, QQQ) are American-style. Cash-settled index options like SPX and NDX are European-style — for those, use the Black-Scholes calculator instead.',
  },
  {
    question: 'Why does early exercise matter?',
    plainAnswer:
      'Early exercise gives the holder optionality the European version does not have. For dividend-paying stocks, it can be optimal to exercise a call early to capture the dividend; for puts, deep-in-the-money puts can be worth more if exercised early to lock in the payoff. The binomial tree finds the optimal exercise boundary numerically.',
    answer:
      'Early exercise gives the holder optionality the European version does not have. For dividend-paying stocks, it can be optimal to exercise a call early to capture the dividend; for deep-in-the-money puts, exercising early can be optimal to lock in the payoff and earn interest on the proceeds. The binomial tree finds the optimal exercise boundary numerically.',
  },
  {
    question: 'What is the early exercise premium?',
    plainAnswer:
      'The early exercise premium is the extra value an American option has over an otherwise-identical European option. It is shown in the results as the difference between the binomial price and the Black-Scholes price. For non-dividend-paying calls it is approximately zero; for puts and dividend-paying calls it can be meaningful.',
    answer:
      'The early exercise premium is the extra value an American option has over an otherwise-identical European option. It is shown in the results as the difference between the binomial price and the Black-Scholes price. For non-dividend-paying calls it is approximately zero (it is never optimal to exercise an American call on a non-dividend-paying stock early); for puts and dividend-paying calls it can be meaningful, sometimes 5-20% of the option price.',
  },
  {
    question: 'How does the binomial tree work?',
    plainAnswer:
      'The Cox-Ross-Rubinstein binomial tree discretizes the stock price evolution into a tree of up and down moves over a chosen number of time steps. At each node, it computes the exercise value and the continuation value, taking the maximum. Working backward from expiration to today gives the option price.',
    answer:
      'The Cox-Ross-Rubinstein (CRR) binomial tree discretizes the stock price evolution into a tree of up and down moves over a chosen number of time steps. At each terminal node, the option payoff is known. Working backward, at each interior node the model computes both the exercise value (intrinsic value) and the continuation value (discounted expected value of holding), then takes the maximum. The price at the root is the option value today. As the number of steps increases, the binomial price converges to the true continuous-time price.',
  },
  {
    question: 'How many steps should I use?',
    plainAnswer:
      'For most options, 50-100 steps gives accuracy to within a cent. For very short-dated or near-the-money options where convergence is slower, 200-500 steps is safer. This calculator defaults to 100 steps.',
    answer:
      'For most options, 50-100 steps gives accuracy to within a cent of the true price. For very short-dated or near-the-money options where binomial convergence is slower (it oscillates), 200-500 steps is safer. This calculator defaults to 100 steps which balances speed and accuracy. Increasing steps roughly linearly increases compute time.',
  },
  {
    question: 'How do I model dividends?',
    plainAnswer:
      'Use the dividend yield input (q). It is treated as a continuous yield: 0.02 means 2% annual dividend yield. For a stock paying a known discrete dividend, divide the expected dividend by the stock price and the time to expiry to approximate. For more accurate discrete-dividend modeling, use a tree with explicit dividend dates.',
    answer:
      'Use the dividend yield input (q). It is treated as a continuous yield: 0.02 means 2% annual dividend yield. For a stock paying a known discrete dividend, you can approximate by setting q ≈ (expected dividend) / (stock price × time to expiry). For more accurate discrete-dividend modeling at known ex-dates, you would need a tree with explicit dividend dates — out of scope for this calculator.',
  },
  {
    question: 'Why is this slower than Black-Scholes?',
    plainAnswer:
      'Binomial tree pricing is O(steps²) — the tree has roughly steps² nodes that must be evaluated. With 100 steps that is 10,000 node evaluations. Black-Scholes is closed-form: a single formula evaluation. Both are fast enough that you would not notice in interactive use.',
    answer:
      'Binomial tree pricing is O(steps²) — the tree has roughly steps² nodes that must be evaluated. With 100 steps that is 10,000 node evaluations. Black-Scholes is closed-form: a single formula evaluation. Both are fast enough that you would not notice in interactive use, but for batch pricing of thousands of options, Black-Scholes is preferred when its assumptions are met.',
  },
  {
    question: 'Should I always use the binomial tree instead of Black-Scholes?',
    plainAnswer:
      'No. Use Black-Scholes for European options on non-dividend-paying underlyings — it is exact and faster. Use the binomial tree when you need American exercise, when there are dividends, or when you want to verify a Black-Scholes price.',
    answer: (
      <>
        No. Use the{' '}
        <a href="/black-scholes-calculator" className="text-accent underline">
          Black-Scholes calculator
        </a>{' '}
        for European options on non-dividend-paying underlyings — it is exact and faster. Use the
        binomial tree when you need American exercise, when there are dividends, or when you want
        to verify a Black-Scholes price (the &quot;BS price&quot; field in the results lets you
        cross-check).
      </>
    ),
  },
  {
    question: 'Does this calculator handle exotic options?',
    plainAnswer:
      'No. This is a vanilla American call or put pricer. For barrier options, use /v1/derivatives/barrier-option. For Asian (average-price) options, use /v1/derivatives/asian-option. For lookback options, use /v1/derivatives/lookback-option. The QuantOracle API exposes all of these.',
    answer: (
      <>
        No. This is a vanilla American call or put pricer. For exotic options the API exposes
        dedicated endpoints: <code>/v1/derivatives/barrier-option</code>,{' '}
        <code>/v1/derivatives/asian-option</code>, and{' '}
        <code>/v1/derivatives/lookback-option</code>. See the{' '}
        <a href="/api-docs" className="text-accent underline">
          API docs
        </a>{' '}
        for details.
      </>
    ),
  },
  {
    question: 'Is this calculator free?',
    plainAnswer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
    answer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
  },
];
