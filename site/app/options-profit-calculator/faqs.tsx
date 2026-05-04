import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is an options profit calculator?',
    plainAnswer:
      'An options profit calculator (also called a payoff diagram) shows the profit or loss of an options position at expiration across a range of underlying prices. It tells you exactly where you make money, where you lose money, and where the break-even points are.',
    answer:
      'An options profit calculator (also called a payoff diagram) shows the profit or loss of an options position at expiration across a range of underlying prices. It tells you exactly where you make money, where you lose money, and where the break-even points are. For multi-leg strategies (spreads, straddles, condors), the diagram shows the combined P&L of all legs at expiration.',
  },
  {
    question: 'How do I add multiple legs to a strategy?',
    plainAnswer:
      'Click "Add leg" to add another option to the strategy. Each leg has a type (call/put), strike, premium paid or received, direction (long/short), and quantity. The calculator combines all legs into a single payoff diagram. Common multi-leg strategies: vertical spread (2 legs), straddle (2 legs), iron condor (4 legs), butterfly (3 or 4 legs).',
    answer:
      'Click "Add leg" to add another option to the strategy. Each leg has a type (call/put), strike, premium paid or received, direction (long/short), and quantity. The calculator combines all legs into a single payoff diagram. Common multi-leg strategies: vertical spread (2 legs), straddle (2 legs), iron condor (4 legs), butterfly (3 or 4 legs).',
  },
  {
    question: 'What is the difference between long and short?',
    plainAnswer:
      'Long means you bought the option (paid the premium). Short means you sold it (received the premium). For a long call, you profit if the underlying rises above the strike + premium. For a short call, you profit if it stays below — but your loss is potentially unlimited.',
    answer:
      'Long means you bought the option (paid the premium). Short means you sold it (received the premium). For a long call, you profit if the underlying rises above the strike + premium. For a short call, you profit if it stays below — but your loss is potentially unlimited as the underlying rises. Selling naked options (short calls or short puts without a cover) carries unlimited or very large losses; most retail brokers require a margin account and additional approvals.',
  },
  {
    question: 'What are break-even points?',
    plainAnswer:
      'Break-even points are the underlying prices at which the strategy makes exactly zero profit at expiration. A long call has one break-even (strike + premium). A long straddle has two (strike ± total premium). A condor has two. The calculator finds these automatically and shows them in the results.',
    answer:
      'Break-even points are the underlying prices at which the strategy makes exactly zero profit at expiration. A long call has one break-even (strike + premium). A long straddle has two (strike ± total premium). A condor has two. The calculator finds these automatically and shows them in the results.',
  },
  {
    question: 'Does this account for commissions or fees?',
    plainAnswer:
      'No. The diagram shows the theoretical P&L of the option contracts themselves. For US retail equity options at most modern brokers, commissions are very low (often $0 plus exchange fees). Add your expected total commissions to your loss numbers if commissions matter for your size.',
    answer:
      'No. The diagram shows the theoretical P&L of the option contracts themselves. For US retail equity options at most modern brokers, commissions are very low (often $0 base plus a few cents in exchange fees per contract). Add your expected total commissions to your loss numbers if commissions matter for your size.',
  },
  {
    question: 'What about early exercise and assignment risk?',
    plainAnswer:
      'This calculator shows the payoff at expiration only. American-style options (most US-listed equity options) can be exercised any time before expiration, and short positions can be assigned. Short options near or in-the-money carry assignment risk — especially short calls right before ex-dividend dates and deep ITM short puts.',
    answer:
      'This calculator shows the payoff at expiration only. American-style options (most US-listed equity options) can be exercised any time before expiration, and short positions can be assigned. Short options near or in-the-money carry assignment risk — especially short calls right before ex-dividend dates and deep ITM short puts. For options on dividend-paying underlyings, the early-exercise premium can be material; see the American Option Calculator for that calculation.',
  },
  {
    question: 'Can I see what the position looks like before expiration?',
    plainAnswer:
      'This calculator shows the expiration payoff only. To see the position value at any earlier time, you need to price each leg at the current implied volatility and time-to-expiry — that requires the Black-Scholes calculator. Many traders use the expiration payoff as the worst-case visual and assume the current value will lie somewhere between current premium and expiration value depending on time decay.',
    answer:
      'This calculator shows the expiration payoff only. To see the position value at any earlier time, you need to price each leg at the current implied volatility and time-to-expiry — that requires the Black-Scholes calculator. Many traders use the expiration payoff as the worst-case visual and assume the current value will lie somewhere between current premium and expiration value depending on time decay.',
  },
  {
    question: 'How do I figure out the premium to enter?',
    plainAnswer:
      'Use the option chain on your broker. The mid of the bid-ask is a good estimate; for tight spreads on liquid options it is approximately what you will fill at. Enter that mid as the premium. For multi-leg strategies, sum the legs (long premiums positive, short premiums negative) to get the net debit (cost) or net credit (proceeds).',
    answer:
      'Use the option chain on your broker. The mid of the bid-ask is a good estimate; for tight spreads on liquid options it is approximately what you will fill at. Enter that mid as the premium. For multi-leg strategies, sum the legs (long premiums positive, short premiums negative) to get the net debit (cost) or net credit (proceeds). Real fills are often slightly worse than mid; budget for 0.5-2 cents of slippage per leg on liquid options, more on illiquid ones.',
  },
  {
    question: 'What strategies should I model first?',
    plainAnswer:
      'Common ones to learn the calculator: long call (1 leg), bull call spread (long lower-strike call + short higher-strike call), long straddle (long call + long put at the same strike), iron condor (4 legs: short put spread + short call spread). Each illustrates a different P&L shape.',
    answer:
      'Common ones to learn the calculator: long call (1 leg), bull call spread (long lower-strike call + short higher-strike call), long straddle (long call + long put at the same strike), iron condor (4 legs: short put spread + short call spread). Each illustrates a different P&L shape — the long call is unlimited upside / capped loss; the spread caps both; the straddle profits from large moves either direction; the condor profits from a narrow range.',
  },
  {
    question: 'Is this calculator free?',
    plainAnswer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
    answer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
  },
];
