import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is implied volatility?',
    plainAnswer:
      'Implied volatility (IV) is the volatility input that, when plugged into Black-Scholes, returns the market price of an option. It is the market\'s consensus estimate of how much the underlying will move over the option\'s life. Higher IV means the market expects bigger moves; lower IV means it expects smaller moves.',
    answer:
      'Implied volatility (IV) is the volatility input that, when plugged into Black-Scholes, returns the market price of an option. It is the market\'s consensus estimate of how much the underlying will move over the option\'s life. Higher IV means the market expects bigger moves; lower IV means it expects smaller moves.',
  },
  {
    question: 'How is IV computed?',
    plainAnswer:
      'There is no closed-form solution for IV — it must be solved numerically. The most common approach is Newton-Raphson iteration: start with a guess (typically 30%), price the option using Black-Scholes, compare to the market price, adjust the volatility input using vega, and repeat until the model price matches the market price within a tolerance. Convergence is usually 3-5 iterations.',
    answer:
      'There is no closed-form solution for IV — it must be solved numerically. The most common approach is Newton-Raphson iteration: start with a guess (typically 30%), price the option using Black-Scholes, compare to the market price, adjust the volatility input using vega, and repeat until the model price matches the market price within a tolerance. Convergence is usually 3-5 iterations. This calculator returns the iteration count alongside the result.',
  },
  {
    question: 'What is a "high" or "low" implied volatility?',
    plainAnswer:
      'It is relative. The same IV can be high for one stock and low for another. Compare to: (a) historical IV for the same name (IV percentile, IV rank), (b) realized volatility of the same underlying, and (c) IV of comparable names. As a rough orientation: SPY IV is typically 15-25%, single-name large-caps 20-40%, biotech and speculative growth 50-100%+, crypto 60-150%.',
    answer:
      'It is relative. The same IV can be high for one stock and low for another. Compare to: (a) historical IV for the same name (IV percentile, IV rank), (b) realized volatility of the same underlying, and (c) IV of comparable names. As a rough orientation: SPY IV is typically 15-25%, single-name large-caps 20-40%, biotech and speculative growth 50-100%+, crypto 60-150%.',
  },
  {
    question: 'What does "IV crush" mean?',
    plainAnswer:
      'IV crush is the rapid drop in implied volatility that often follows a known event (earnings, FDA decision, Fed announcement). Before the event, IV is elevated because the market expects a big move. After the event, the uncertainty is resolved and IV collapses. This destroys option value even when the underlying moves favorably — a common trap for novice options buyers.',
    answer:
      'IV crush is the rapid drop in implied volatility that often follows a known event (earnings, FDA decision, Fed announcement). Before the event, IV is elevated because the market expects a big move. After the event, the uncertainty is resolved and IV collapses. This destroys option value even when the underlying moves favorably — a common trap for novice options buyers who buy calls before earnings.',
  },
  {
    question: 'Why is implied volatility different for different strikes?',
    plainAnswer:
      'Because Black-Scholes is wrong about the assumption of constant volatility. In reality, far OTM puts trade at higher IV than ATM options (the "skew"), and very far OTM options on either side often trade higher than ATM (the "smile"). This is the volatility surface, and it reflects market participants pricing fat tails into their option prices.',
    answer:
      'Because Black-Scholes is wrong about the assumption of constant volatility. In reality, far OTM puts trade at higher IV than ATM options (the "volatility skew"), and very far OTM options on either side often trade higher than ATM (the "volatility smile"). This is the volatility surface, and it reflects market participants pricing fat tails into their option prices. The QuantOracle API exposes a volatility-surface endpoint at /v1/derivatives/volatility-surface.',
  },
  {
    question: 'How accurate is this IV solver?',
    plainAnswer:
      'Very accurate. The solver returns IV to 6 decimal places of precision and typically converges in 3-5 iterations. For deep ITM/OTM options where vega is small, the solver may take 10-15 iterations or fail to converge — the API returns an error in that case. For at-the-money or near-the-money options, accuracy is excellent.',
    answer:
      'Very accurate. The solver returns IV to 6 decimal places of precision and typically converges in 3-5 iterations. For deep ITM/OTM options where vega is small, the solver may take 10-15 iterations or fail to converge — the API returns an error in that case. For at-the-money or near-the-money options, accuracy is excellent.',
  },
  {
    question: 'Why might the solver fail to converge?',
    plainAnswer:
      'Two main reasons: (1) the market price is below intrinsic value (arbitrage), which has no real IV solution; (2) the option is so deep in or out of the money that vega is essentially zero, making the gradient too flat for Newton-Raphson. Bisection can solve case (2) but is much slower.',
    answer:
      'Two main reasons: (1) the market price is below intrinsic value (arbitrage opportunity, but more often a stale or wrong price), which has no real IV solution; (2) the option is so deep in or out of the money that vega is essentially zero, making the gradient too flat for Newton-Raphson. Bisection can solve case (2) but is much slower.',
  },
  {
    question: 'Should I trust IV from a single mid-price quote?',
    plainAnswer:
      'For decision-making, no. Use the mid of a tight bid-ask spread, and ideally average across several recent trades. A single stale or off-market quote can produce an IV that is meaningfully wrong. For low-volume strikes, the bid-ask is often wide enough that the IV at the bid versus the ask differs by 5-10 percentage points.',
    answer:
      'For decision-making, no. Use the mid of a tight bid-ask spread, and ideally average across several recent trades. A single stale or off-market quote can produce an IV that is meaningfully wrong. For low-volume strikes, the bid-ask is often wide enough that the IV at the bid versus the ask differs by 5-10 percentage points.',
  },
  {
    question: 'What is the relationship between IV and historical volatility?',
    plainAnswer:
      'Historical volatility (HV, or "realized vol") is what the underlying actually did over a past period. IV is what the market thinks it will do over the option\'s remaining life. When IV is much higher than recent HV, the market is pricing in elevated future risk; when much lower, the market is complacent. The ratio IV/HV is sometimes used as a "richness" indicator for selling versus buying premium.',
    answer:
      'Historical volatility (HV, or "realized vol") is what the underlying actually did over a past period. IV is what the market thinks it will do over the option\'s remaining life. When IV is much higher than recent HV, the market is pricing in elevated future risk; when much lower, the market is complacent. The ratio IV/HV is sometimes used as a "richness" indicator for selling versus buying premium.',
  },
  {
    question: 'Is this calculator free?',
    plainAnswer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
    answer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
  },
];
