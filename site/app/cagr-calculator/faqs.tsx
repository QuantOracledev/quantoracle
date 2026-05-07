import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is CAGR?',
    plainAnswer:
      'CAGR (Compound Annual Growth Rate) is the smoothed annualized rate of return that would take a starting value to an ending value over a given period if the rate were constant. It removes the volatility of actual year-by-year returns and gives a single comparable number.',
    answer:
      'CAGR (Compound Annual Growth Rate) is the smoothed annualized rate of return that would take a starting value to an ending value over a given period if the rate were constant. It removes the volatility of actual year-by-year returns and gives a single comparable number. CAGR is the standard way to summarize the long-run performance of a portfolio, fund, business revenue, or any other compounding metric.',
  },
  {
    question: 'How is CAGR calculated?',
    plainAnswer:
      'CAGR = (end_value / start_value)^(1 / years) - 1. So $10,000 growing to $50,000 over 10 years gives (50000/10000)^(1/10) - 1 = 5^0.1 - 1 = 17.46%.',
    answer: (
      <>
        <code>CAGR = (end_value / start_value)<sup>1/years</sup> − 1</code>. So $10,000 growing to
        $50,000 over 10 years: (50000/10000)<sup>0.1</sup> − 1 = 5<sup>0.1</sup> − 1 = 17.46%
        annualized. Multiply by 100 to express as a percentage.
      </>
    ),
  },
  {
    question: 'How is CAGR different from average return?',
    plainAnswer:
      'CAGR (geometric mean) accounts for compounding; arithmetic average does not. If a stock returns +50% one year and -50% the next, the arithmetic average is 0% but the actual outcome is a -25% loss (1.5 × 0.5 = 0.75). CAGR captures this compounding correctly. For multi-period investment analysis, always use CAGR, not arithmetic mean.',
    answer:
      'CAGR (geometric mean) accounts for compounding; arithmetic average does not. If a stock returns +50% one year and -50% the next, the arithmetic average is 0% but the actual outcome is a -25% loss (1.5 × 0.5 = 0.75). CAGR captures this compounding correctly. For multi-period investment analysis, always use CAGR, not arithmetic mean. The gap between arithmetic mean and CAGR widens as volatility increases — high-vol assets have CAGRs much lower than their arithmetic averages.',
  },
  {
    question: 'What does "doubling time" mean?',
    plainAnswer:
      'Doubling time is how many years it takes for an investment to double at the given CAGR. The Rule of 72 approximates this as 72 / CAGR_percent (so 7.2 years to double at 10% CAGR, 4.8 years at 15%). The exact formula is ln(2) / ln(1 + CAGR), which the calculator uses.',
    answer: (
      <>
        Doubling time is how many years it takes for an investment to double at the given CAGR.
        The Rule of 72 approximates this as <code>72 / CAGR_percent</code> (so 7.2 years to double
        at 10% CAGR, 4.8 years at 15%). The exact formula is{' '}
        <code>ln(2) / ln(1 + CAGR)</code>, which this calculator uses.
      </>
    ),
  },
  {
    question: 'What is a "good" CAGR?',
    plainAnswer:
      'For US large-cap equities long-term: ~10% nominal CAGR (1928-2023 historical). For 60/40 portfolios: ~7%. For Treasury bonds: ~5%. For S&P 500 over the last 30 years: ~10.5% nominal, ~7% real. Anything sustained above ~15% over 10+ years is exceptional. Anything above ~25% over 10+ years is essentially unheard of outside of single-stock outliers and brief bubble periods.',
    answer:
      'For US large-cap equities long-term: ~10% nominal CAGR (1928-2023 historical). For 60/40 portfolios: ~7%. For Treasury bonds: ~5%. For S&P 500 over the last 30 years: ~10.5% nominal, ~7% real. Anything sustained above ~15% over 10+ years is exceptional. Anything above ~25% over 10+ years is essentially unheard of outside of single-stock outliers and brief bubble periods. Hedge fund managers who claim 30%+ CAGRs over decades almost always have hidden leverage, survivorship bias, or fraud.',
  },
  {
    question: 'Should I use nominal or real (inflation-adjusted) CAGR?',
    plainAnswer:
      'Depends on the question. For comparing investment options head-to-head, nominal is fine — both options face the same inflation. For estimating future purchasing power (retirement planning), use real CAGR (subtract long-run inflation, ~3% historically). To convert: real CAGR ≈ nominal CAGR - inflation rate.',
    answer:
      'Depends on the question. For comparing investment options head-to-head, nominal is fine — both options face the same inflation. For estimating future purchasing power (retirement planning), use real CAGR (subtract long-run inflation, ~3% historically). To convert: real CAGR ≈ nominal CAGR − inflation rate, or more precisely real = (1 + nominal) / (1 + inflation) − 1.',
  },
  {
    question: 'Why do hedge fund CAGRs look so different from my own portfolio?',
    plainAnswer:
      'Three reasons: (1) high-water marks and fee structures hide losses; (2) survivorship bias — failed funds disappear from the dataset; (3) leverage compounds CAGR unevenly — 2x leverage on a strategy with 10% return and 20% vol gives ~16% CAGR (because vol drag eats the multiple). Be skeptical of any reported CAGR without seeing the full distribution and net-of-fees data.',
    answer:
      'Three reasons: (1) high-water marks and fee structures hide losses; (2) survivorship bias — failed funds disappear from the dataset; (3) leverage compounds CAGR unevenly — 2x leverage on a strategy with 10% return and 20% vol gives ~16% CAGR (not 20%) because vol drag eats some of the multiple. Be skeptical of any reported CAGR without seeing the full distribution, net-of-fees data, and a sufficiently long track record (10+ years).',
  },
  {
    question: 'How is CAGR different from IRR?',
    plainAnswer:
      'CAGR assumes a single starting value and a single ending value with no cash flows in between. IRR (Internal Rate of Return) handles arbitrary cash flows over time — investments, withdrawals, dividends. For a buy-and-hold portfolio, CAGR and IRR are equal. For anything with periodic contributions, withdrawals, or distributions, use IRR instead.',
    answer:
      'CAGR assumes a single starting value and a single ending value with no cash flows in between. IRR (Internal Rate of Return) handles arbitrary cash flows over time — investments, withdrawals, dividends. For a buy-and-hold portfolio with no contributions, CAGR and IRR are equal. For anything with periodic contributions, withdrawals, or distributions (most real portfolios, especially retirement accounts), use IRR instead. The QuantOracle API has IRR at /v1/tvm/irr.',
  },
  {
    question: 'What about negative CAGR?',
    plainAnswer:
      'CAGR can be negative — it just means the investment lost value on average. The math handles negative CAGR the same way (end_value < start_value just produces a negative result). Doubling time is undefined for negative CAGR (the investment is shrinking, not doubling); the calculator returns null or N/A in that case.',
    answer:
      'CAGR can be negative — it just means the investment lost value on average. The math handles negative CAGR the same way (end_value < start_value just produces a negative result). Doubling time is undefined for negative CAGR (the investment is shrinking, not doubling); the calculator returns N/A in that case.',
  },
  {
    question: 'Is this calculator free?',
    plainAnswer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
    answer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
  },
];
