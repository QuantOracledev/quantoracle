import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is position sizing?',
    plainAnswer:
      'Position sizing is the discipline of deciding how many shares (or contracts, or units) to buy on each trade so that a single bad outcome cannot blow up your account. The most common rule is "risk a fixed fraction of account on each trade" — typically 1-2% — and let the stop-loss distance dictate the share count.',
    answer:
      'Position sizing is the discipline of deciding how many shares (or contracts, or units) to buy on each trade so that a single bad outcome cannot blow up your account. The most common rule is "risk a fixed fraction of account on each trade" — typically 1-2% — and let the stop-loss distance dictate the share count. This calculator implements that rule.',
  },
  {
    question: 'How is the position size calculated?',
    plainAnswer:
      'Risk per share = entry price minus stop-loss price (for a long). Total risk allowed = account size times risk-per-trade fraction. Shares = total risk allowed divided by risk per share. Position value = shares times entry price. The calculator does this rounding and sanity-checks the result against the account size.',
    answer: (
      <>
        Risk per share = <code>|entry − stop|</code>. Total risk allowed ={' '}
        <code>account_size × risk_per_trade</code>. Shares ={' '}
        <code>total_risk / risk_per_share</code>. Position value = <code>shares × entry</code>. The
        calculator does this rounding and sanity-checks the result against the account size.
      </>
    ),
  },
  {
    question: 'What risk-per-trade percentage should I use?',
    plainAnswer:
      'For most retail traders, 1-2% per trade is the standard rule. At 2%, you can survive a streak of 10 consecutive losses with only a 20% drawdown. At 5%, the same streak draws you down 40%. Anything above 5% per trade significantly increases your probability of catastrophic loss. Professional discretionary traders typically run 0.5-1.5%; systematic traders running many simultaneous bets often run 0.25-1% per bet.',
    answer:
      'For most retail traders, 1-2% per trade is the standard rule. At 2%, you can survive a streak of 10 consecutive losses with only a ~18% drawdown. At 5%, the same streak draws you down ~40%. Anything above 5% per trade significantly increases your probability of catastrophic loss. Professional discretionary traders typically run 0.5-1.5%; systematic traders running many simultaneous bets often run 0.25-1% per bet because the bets compound losses when they correlate.',
  },
  {
    question: 'What does the "2R target" mean?',
    plainAnswer:
      'R is the dollar amount you risk on a trade (1R = the distance from entry to stop, in dollars). 2R is twice that distance. The 2R target is the price at which you would have made twice what you risked. Many traders manage trades by R-multiples: take half off at 1R, let the rest run to 2R or 3R. It standardizes how you compare trade quality regardless of position size or stop distance.',
    answer:
      'R is the dollar amount you risk on a trade (1R = the distance from entry to stop, in dollars). 2R is twice that distance. The 2R target is the price at which you would have made twice what you risked. Many traders manage trades by R-multiples: take half off at 1R, let the rest run to 2R or 3R. It standardizes how you compare trade quality regardless of position size or stop distance.',
  },
  {
    question: 'What if my position size exceeds my account?',
    plainAnswer:
      'If the calculated position value is larger than your account, you are using a stop-loss too tight relative to the risk you are willing to take. Either widen the stop, accept a smaller risk-per-trade fraction, or pass on the trade. With cash accounts (no leverage), you cannot buy more than you have; with margin, you can but should not — leverage multiplies position-sizing mistakes.',
    answer:
      'If the calculated position value is larger than your account, you are using a stop-loss too tight relative to the risk you are willing to take. Either widen the stop, accept a smaller risk-per-trade fraction, or pass on the trade. With cash accounts (no leverage), you cannot buy more than you have; with margin, you can but should not — leverage multiplies position-sizing mistakes.',
  },
  {
    question: 'Does this calculator work for shorts?',
    plainAnswer:
      'Yes. For a short, the stop-loss is above the entry price. The calculator uses the absolute value of (entry minus stop) for risk-per-share, so it produces the correct number of shares regardless of direction. Just enter your actual entry and your actual stop.',
    answer:
      'Yes. For a short, the stop-loss is above the entry price. The calculator uses the absolute value of (entry − stop) for risk-per-share, so it produces the correct number of shares regardless of direction. Just enter your actual entry and your actual stop.',
  },
  {
    question: 'How does this differ from the Kelly criterion?',
    plainAnswer:
      'A position-size calculator says "given that I want to risk X% of account per trade, here is how many shares to buy." It does not tell you what X% should be. The Kelly criterion answers that other question: given your edge and win/loss profile, what fraction of bankroll is optimal? Most traders use Kelly to determine the risk percentage, then this calculator to translate that into shares.',
    answer: (
      <>
        A position-size calculator says &quot;given that I want to risk X% of account per trade,
        here is how many shares to buy.&quot; It does not tell you what X% should be. The{' '}
        <a href="/kelly-criterion-calculator" className="text-accent underline">
          Kelly criterion
        </a>{' '}
        answers that other question: given your edge and win/loss profile, what fraction of
        bankroll is optimal? Most traders use Kelly to determine the risk percentage, then this
        calculator to translate that into shares.
      </>
    ),
  },
  {
    question: 'Should I count commissions?',
    plainAnswer:
      'For US equities at most retail brokers, commissions are zero, so it does not matter. For options or for brokers that still charge commissions, add the round-trip commission to your risk-per-share. For futures, commissions can be a meaningful part of the risk on small positions.',
    answer:
      'For US equities at most retail brokers, commissions are zero, so it does not matter. For options or for brokers that still charge commissions, add the round-trip commission to your risk-per-share. For futures, commissions can be a meaningful part of the risk on small positions.',
  },
  {
    question: 'What about slippage?',
    plainAnswer:
      'Slippage is the difference between the price you intend to enter or exit and the price you actually get. For liquid stocks, it is usually negligible. For thin stocks or on stop-loss exits during fast moves, slippage can be 0.5-2% beyond your stop. Conservative traders pad their stop distance by their expected slippage when sizing.',
    answer:
      'Slippage is the difference between the price you intend to enter or exit and the price you actually get. For liquid stocks, it is usually negligible. For thin stocks or on stop-loss exits during fast moves, slippage can be 0.5-2% beyond your stop. Conservative traders pad their stop distance by their expected slippage when sizing — e.g. if your stop is at $48.00, size as if it were at $47.50.',
  },
  {
    question: 'Is this calculator free?',
    plainAnswer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
    answer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
  },
];
