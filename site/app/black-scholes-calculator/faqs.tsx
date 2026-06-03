import type { FaqItem } from '@/components/FAQ';

/**
 * Hand-written FAQ for the Black-Scholes calculator page.
 * `plainAnswer` is the text-only version emitted in JSON-LD for Google rich snippets;
 * `answer` is the React-rendered version (can include links/formatting).
 */
export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is the Black-Scholes formula?',
    plainAnswer:
      'Black-Scholes is a closed-form mathematical model published in 1973 that prices European options. It takes five inputs (stock price, strike, time to expiry, risk-free rate, and volatility) and returns the theoretical fair value of a call or put.',
    answer:
      'Black-Scholes is a closed-form mathematical model published in 1973 that prices European options. It takes five inputs (stock price, strike, time to expiry, risk-free rate, and volatility) and returns the theoretical fair value of a call or put. It earned Robert Merton and Myron Scholes the Nobel Prize in 1997 (Fischer Black had passed away).',
  },
  {
    question: 'What is the difference between a call and a put?',
    plainAnswer:
      'A call option gives the holder the right (but not the obligation) to buy the underlying at the strike price; a put gives the right to sell. Calls profit when the underlying rises; puts profit when it falls.',
    answer:
      'A call option gives the holder the right (but not the obligation) to buy the underlying at the strike price; a put gives the right to sell. Calls profit when the underlying rises above the strike (plus premium paid); puts profit when it falls below the strike (minus premium paid).',
  },
  {
    question: 'What does volatility (sigma) mean in this calculator?',
    plainAnswer:
      'Volatility is the annualized standard deviation of the log returns of the underlying stock. A value of 0.20 means the stock has a 20% annualized volatility, which is roughly the historical average for a major US equity index.',
    answer:
      'Volatility is the annualized standard deviation of the log returns of the underlying. 0.20 means 20% annualized volatility — roughly typical for a major US equity index. High-volatility names like single-name biotech or speculative tech can run 50-100%+; low-volatility names like utilities run 12-18%.',
  },
  {
    question: 'Can this calculator handle dividends?',
    plainAnswer:
      'Yes. Enter the continuous annualized dividend yield in the "Dividend yield" field (e.g. 0.03 for 3%); use 0 for a non-dividend-paying stock. The calculator uses the Black-Scholes-Merton extension, which discounts the spot price by the dividend yield. A positive dividend yield lowers call prices and raises put prices, because holding the option means forgoing the dividend stream.',
    answer: (
      <>
        Yes. Enter the continuous annualized dividend yield in the{' '}
        <strong>Dividend yield</strong> field (e.g. <code>0.03</code> for 3%); use <code>0</code> for
        a non-dividend-paying stock. The calculator uses the Black-Scholes-<em>Merton</em> extension,
        which discounts the spot price by the dividend yield. A positive dividend yield lowers call
        prices and raises put prices, because holding the option means forgoing the dividend stream.
        For discrete dividends or American-style early exercise around an ex-date, use the{' '}
        <a href="/american-option-calculator" className="text-accent underline">
          American Option Calculator
        </a>{' '}
        instead.
      </>
    ),
  },
  {
    question: 'How accurate are the Greeks?',
    plainAnswer:
      'The Greeks returned by this calculator are exact analytical derivatives of the Black-Scholes formula, computed in closed form. They are accurate to about six decimal places. The model itself, however, is an approximation of real markets — see the explainer below for when Black-Scholes breaks down.',
    answer:
      'The Greeks here are exact analytical derivatives of the Black-Scholes formula, computed in closed form (no numerical differentiation). They are accurate to about six decimal places. The model itself, however, is an approximation of real markets — see the long-form explainer below for when Black-Scholes breaks down.',
  },
  {
    question: 'Why are call and put prices different?',
    plainAnswer:
      'Put-call parity links them: C - P = S - K * exp(-r * T). When the strike equals the discounted forward price, calls and puts have equal value. When the strike is below the forward, calls cost more; when above, puts cost more.',
    answer: (
      <>
        Put-call parity links them: <code>C − P = S − K · exp(−r · T)</code>. When the strike
        equals the discounted forward price, calls and puts have equal value. When the strike is
        below the forward, calls cost more; when above, puts cost more.
      </>
    ),
  },
  {
    question: 'Does this calculator handle American options?',
    plainAnswer:
      'No. Black-Scholes is for European options (exerciseable only at expiration). For American options (early exerciseable), use a binomial tree — the QuantOracle API exposes one at /v1/derivatives/binomial-tree. For most US-listed equity options, the difference is small for calls on non-dividend stocks, larger for puts.',
    answer: (
      <>
        No. Black-Scholes is for European options (exerciseable only at expiration). For American
        options (early exerciseable), use a binomial tree — the QuantOracle API exposes one at{' '}
        <code>/v1/derivatives/binomial-tree</code>. For most US-listed equity options, the
        difference is small for calls on non-dividend stocks, larger for puts.
      </>
    ),
  },
  {
    question: 'How do I find the implied volatility instead of the price?',
    plainAnswer:
      'Use the Implied Volatility Calculator. You give it the option price you observe in the market, and it solves for the volatility input that produces that price.',
    answer: (
      <>
        Use the{' '}
        <a href="/implied-volatility-calculator" className="text-accent underline">
          Implied Volatility Calculator
        </a>
        . Give it the market option price, and it solves for the volatility input that produces
        that price.
      </>
    ),
  },
  {
    question: 'What does "probability ITM" mean?',
    plainAnswer:
      'Probability ITM is the risk-neutral probability that the option finishes in-the-money at expiration. It is N(d2) for a call and N(-d2) for a put. This is NOT the real-world probability — it assumes the stock drifts at the risk-free rate.',
    answer: (
      <>
        Probability ITM is the <em>risk-neutral</em> probability that the option finishes
        in-the-money at expiration. It is <code>N(d2)</code> for a call and <code>N(−d2)</code> for
        a put. This is <strong>not</strong> the real-world probability — it assumes the stock
        drifts at the risk-free rate, not at the actual expected return.
      </>
    ),
  },
  {
    question: 'Is this calculator free? Are there usage limits?',
    plainAnswer:
      'Yes, the calculator is free for unlimited human use. Behind the scenes it calls the QuantOracle API, which has a free tier of 1,000 calls per IP per day with no signup or API key. If you need higher limits for your own application, see the API docs for paid tiers.',
    answer: (
      <>
        Yes, completely free. Behind the scenes it calls the QuantOracle API, which has a free tier
        of 1,000 calls per IP per day with no signup or API key. If you need higher limits for your
        own application, see the <a href="/api-docs">API docs</a> for paid tiers.
      </>
    ),
  },
  {
    question: 'Can I use this calculator on my own website?',
    plainAnswer:
      'Yes, by calling the underlying API directly. The endpoint /v1/options/price accepts a JSON POST and returns the same data shown here. See the API documentation for the full spec.',
    answer: (
      <>
        Yes, by calling the underlying API directly. The endpoint{' '}
        <code>/v1/options/price</code> accepts a JSON POST and returns the same data shown here.
        See the <a href="/api-docs">API documentation</a> for the full spec, including code samples
        in Python and JavaScript.
      </>
    ),
  },
];
