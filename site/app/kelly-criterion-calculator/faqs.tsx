import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is the Kelly criterion?',
    plainAnswer:
      'The Kelly criterion is a formula for sizing bets or positions to maximize the long-term geometric growth rate of capital. It tells you what fraction of your bankroll to risk on each bet given the edge and the payoff ratio. Larger fractions grow faster on average but go bust more often; smaller fractions grow slower but more reliably.',
    answer:
      'The Kelly criterion is a formula for sizing bets or positions to maximize the long-term geometric growth rate of capital. It was derived by John Kelly Jr. at Bell Labs in 1956. The formula tells you what fraction of your bankroll to risk on each bet given the edge and the payoff ratio. Larger fractions grow faster on average but go bust more often; smaller fractions grow slower but more reliably.',
  },
  {
    question: 'What is the Kelly formula?',
    plainAnswer:
      'For a discrete bet: f* = p - (1 - p) / b, where p is the probability of winning, (1 - p) is the probability of losing, and b is the win-to-loss ratio (average win divided by average loss). The result f* is the fraction of bankroll to bet.',
    answer: (
      <>
        For a discrete bet: <code>f* = p − (1 − p) / b</code>, where <code>p</code> is the
        probability of winning, <code>(1 − p)</code> is the probability of losing, and{' '}
        <code>b</code> is the win-to-loss ratio (average win divided by average loss). The result{' '}
        <code>f*</code> is the fraction of bankroll to bet. For continuous returns (a strategy), the
        Kelly fraction is mean / variance.
      </>
    ),
  },
  {
    question: 'What is half-Kelly and why use it?',
    plainAnswer:
      'Half-Kelly means betting half the size the full Kelly formula recommends. It produces about 75% of the long-term growth rate with substantially lower volatility and a much lower probability of large drawdowns. Quarter-Kelly is even more conservative. Most professional traders use half- or quarter-Kelly because the full Kelly formula assumes you know your edge exactly, which you almost never do.',
    answer:
      'Half-Kelly means betting half the size the full Kelly formula recommends. It produces about 75% of the long-term growth rate with substantially lower volatility and a much lower probability of large drawdowns. Quarter-Kelly is even more conservative — about 50% of full-Kelly growth with a much smoother equity curve. Most professional traders use half- or quarter-Kelly because the full Kelly formula assumes you know your edge exactly, which you almost never do — overestimating your edge by 20% can cause severe overbetting.',
  },
  {
    question: 'When does Kelly recommend a negative number?',
    plainAnswer:
      'When you have a negative edge — i.e., your expected value is negative. The formula then recommends betting against yourself, which in practice means: do not take this bet. If you are computing Kelly for a strategy and getting negative numbers, the strategy is unprofitable in expectation.',
    answer:
      'When you have a negative edge — i.e., your expected value is negative. The formula then recommends betting against yourself, which in practice means: do not take this bet. If you are computing Kelly for a strategy and getting negative numbers, the strategy is unprofitable in expectation given the parameters you provided.',
  },
  {
    question: 'How accurate are my inputs likely to be?',
    plainAnswer:
      'Probably not very. Win rate and average win/loss are usually estimated from past trades, but small samples are unreliable. With 30 trades, your true win rate could differ from the observed one by 10-15 percentage points. This is why half- or quarter-Kelly is safer in practice — it gives you headroom for parameter estimation error.',
    answer:
      'Probably not very. Win rate and average win/loss are usually estimated from past trades, but small samples are unreliable. With 30 trades, your true win rate could differ from the observed one by 10-15 percentage points. With 100 trades, the error is still 5-8 points. This is why half- or quarter-Kelly is safer in practice — it gives you headroom for parameter estimation error.',
  },
  {
    question: 'Does Kelly work for trading or only gambling?',
    plainAnswer:
      'It works for both, but trading has more complications. The discrete-bet version assumes binary outcomes (win or lose) with fixed amounts, which fits some option strategies and event-driven bets. For continuous-return trading strategies, use the continuous Kelly formula: f* = mean(returns) / variance(returns). Real trading also has correlated bets and changing edge, which the simple formula does not handle.',
    answer:
      'It works for both, but trading has more complications. The discrete-bet version assumes binary outcomes (win or lose) with fixed amounts, which fits some option strategies and event-driven bets. For continuous-return trading strategies, use the continuous Kelly formula: f* = mean(returns) / variance(returns) — the QuantOracle API supports this via the same endpoint with mode="continuous". Real trading also has correlated bets and changing edge, which the simple formula does not handle directly.',
  },
  {
    question: 'What is the difference between edge and payoff ratio?',
    plainAnswer:
      'Edge is your expected value as a percentage: (win_rate × avg_win) - (loss_rate × avg_loss), expressed as a fraction of the amount risked. Payoff ratio is just the average win divided by the average loss — it tells you how favorable each individual win is. Kelly weighs both: high edge with high payoff ratio means bet bigger; high edge with low payoff ratio means bet smaller despite the edge.',
    answer:
      'Edge is your expected value as a percentage: (win_rate × avg_win) − (loss_rate × avg_loss), expressed as a fraction of the amount risked. Payoff ratio is just the average win divided by the average loss — it tells you how favorable each individual win is. Kelly weighs both: high edge with high payoff ratio means bet bigger; high edge with low payoff ratio means bet smaller despite the edge.',
  },
  {
    question: 'What if I am already taking many trades simultaneously?',
    plainAnswer:
      'Single-bet Kelly assumes one bet at a time. If you take multiple bets simultaneously, you should size each one smaller because losses can compound. A rough rule: if you have N uncorrelated bets running at once, divide each Kelly fraction by N. For correlated bets, divide by even more. This is one of several reasons most professionals use a fraction of Kelly rather than full Kelly.',
    answer:
      'Single-bet Kelly assumes one bet at a time. If you take multiple bets simultaneously, you should size each one smaller because losses can compound. A rough rule: if you have N uncorrelated bets running at once, divide each Kelly fraction by N. For correlated bets, divide by even more. This is one of several reasons most professionals use a fraction of Kelly rather than full Kelly.',
  },
  {
    question: 'What is the difference between this calculator and a position-size calculator?',
    plainAnswer:
      'A position-size calculator answers "how many shares should I buy given a fixed risk-per-trade rule" — it works backward from a stop loss. Kelly answers a different question: "given my edge and win/loss profile, what fraction of my bankroll should I risk?" Most traders use both: Kelly to determine the risk percentage, then a position-size calculator to translate that into shares.',
    answer: (
      <>
        A{' '}
        <a href="/position-size-calculator" className="text-accent underline">
          position-size calculator
        </a>{' '}
        answers &quot;how many shares should I buy given a fixed risk-per-trade rule&quot; — it
        works backward from a stop loss. Kelly answers a different question: &quot;given my edge
        and win/loss profile, what fraction of my bankroll should I risk?&quot; Most traders use
        both: Kelly to determine the risk percentage, then a position-size calculator to translate
        that into shares.
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
