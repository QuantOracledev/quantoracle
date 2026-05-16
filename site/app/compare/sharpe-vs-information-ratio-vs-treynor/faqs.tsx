import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'Sharpe, Information Ratio, or Treynor — which should I use?',
    plainAnswer:
      'Sharpe measures total return per unit of total risk and is right when you can hold the strategy as a stand-alone investment. Information Ratio measures excess return over a benchmark per unit of tracking error and is right for active managers benchmarked to an index. Treynor measures excess return per unit of systematic (market) risk and is right when the position is one piece of a well-diversified portfolio.',
    answer:
      'The three ratios answer three different questions. Use Sharpe when the question is "is this strategy worth holding by itself?" — it scales excess return by total volatility (idiosyncratic + market). Use Information Ratio when the question is "is this active manager beating their benchmark efficiently?" — it scales benchmark-relative excess return by tracking error (the volatility of the active bets). Use Treynor when the question is "is this position adding value in a diversified portfolio?" — it scales excess return by beta (sensitivity to the market only), assuming idiosyncratic risk gets diversified away. The same strategy can look great on one metric and mediocre on another, which is exactly the point — they isolate different aspects of risk-adjusted return.',
  },
  {
    question: 'What is the formula for each?',
    plainAnswer:
      'Sharpe = (r_p − r_f) / σ_p, where r_p is portfolio return, r_f is risk-free rate, σ_p is total volatility. Information Ratio = (r_p − r_b) / σ_(p−b), where r_b is benchmark return and σ_(p−b) is tracking error (std of the active return series). Treynor = (r_p − r_f) / β_p, where β_p is the portfolio beta to the market.',
    answer:
      'Sharpe ratio: (r_p − r_f) / σ_p. The numerator is the excess return over the risk-free rate; the denominator is the standard deviation of portfolio returns (total volatility). Information Ratio: (r_p − r_b) / σ_active where σ_active = std(r_p − r_b) is the tracking error. The numerator is the active return (excess over benchmark); the denominator is the volatility of that active return. Treynor ratio: (r_p − r_f) / β_p. Same numerator as Sharpe (excess return over risk-free), but the denominator is beta — the portfolio&apos;s systematic risk loading on the market — rather than total volatility. All three are typically annualized (multiply by √252 for daily data, √12 for monthly).',
  },
  {
    question: 'When does Sharpe lie about an active manager?',
    plainAnswer:
      'When the manager is benchmarked to an index but holds positions correlated with it. A long-only equity manager who runs at 95% beta to S&P 500 will have a Sharpe similar to the index itself even if they add zero alpha — the index volatility dominates the manager volatility. Information Ratio strips out the benchmark exposure and tells you whether the active bets are adding value.',
    answer:
      'Sharpe ratio treats the entire portfolio volatility as risk to be penalized, including the part that comes from being long the benchmark. For a long-only equity manager benchmarked to S&P 500, most of their portfolio variance comes from being long equities — which the investor wants. The manager&apos;s active bets (sector overweights, stock selection) might be excellent, but their total Sharpe is dominated by the benchmark Sharpe. Information Ratio fixes this by removing the benchmark contribution: only the volatility of the active return (excess over benchmark) is penalized. A manager with IR = 0.5 is genuinely adding alpha; the same manager might have Sharpe = 0.6 looking nearly identical to the index Sharpe of 0.55.',
  },
  {
    question: 'When does Sharpe lie about a position in a portfolio?',
    plainAnswer:
      'When the position has high idiosyncratic volatility but low market correlation. A single biotech stock might have Sharpe = 0.3 because of high total vol, but a diversified portfolio holding it as 2% of NAV doesn&apos;t see most of that idiosyncratic risk — it averages out. Treynor uses only beta, which captures the part of the position&apos;s risk that doesn&apos;t diversify away.',
    answer:
      'Sharpe penalizes total volatility (systematic + idiosyncratic). For a single position you&apos;re considering adding to a larger diversified portfolio, the idiosyncratic part will be diversified away — only the systematic exposure (beta to the market) actually contributes risk to the combined portfolio. A high-vol single name like a biotech might look terrible on Sharpe (0.2-0.4) but be a perfectly reasonable 2% portfolio position if its beta is moderate, because most of its standalone volatility doesn&apos;t survive diversification. Treynor recognizes this by dividing by beta, not total vol — it gives you "excess return per unit of risk that actually matters to the portfolio." This is the standard ratio in CAPM-style risk-budgeting frameworks.',
  },
  {
    question: 'What is a "good" value for each ratio?',
    plainAnswer:
      'Sharpe: 1.0 is good, 2.0 is excellent, 3.0+ is suspicious and likely overfit. Information Ratio: 0.5 is good for an active equity manager, 0.75 is strong, 1.0+ is exceptional and rare. Treynor: harder to anchor without market context; in equilibrium Treynor of every asset should equal the market Treynor.',
    answer:
      'Sharpe ratio: 1.0 is genuinely good, 2.0 is excellent and rare, 3.0+ should make you check for survivorship bias or overfitting before believing. The S&P 500 historical Sharpe is about 0.4-0.5. A long-only US equity strategy with Sharpe 0.8 is doing real work. Information Ratio: 0.5 is good for an active equity manager, 0.75 is strong, 1.0+ is exceptional and rare for sustained periods. Hedge funds quote IR in their pitches; bench it against their actual benchmark, not the easy one they cite. Treynor ratio: harder to anchor in absolute terms because beta is in the denominator. In CAPM equilibrium every asset&apos;s Treynor should equal the market Treynor; deviation positive means alpha. The right benchmark for Treynor is the same number computed on the market index.',
  },
  {
    question: 'Can a strategy have great Sharpe but bad Information Ratio?',
    plainAnswer:
      'Yes, easily. A buy-and-hold S&P 500 fund has Sharpe near 0.5 (matching the market) but Information Ratio near zero — by construction it doesn&apos;t deviate from its benchmark, so there&apos;s no active return to scale. Anyone charging active-management fees for that profile is selling index exposure at active prices.',
    answer:
      'Easily. A passive index fund has Sharpe equal to the index Sharpe (around 0.5 for US equities historically), which sounds fine, but the Information Ratio is effectively zero by construction — there&apos;s no active return to scale because the fund is the benchmark. Closet indexers (active managers who hug the benchmark) have similar profiles: respectable Sharpe but near-zero IR. The investor question becomes "am I getting active management for active fees, or index exposure for active fees?" — IR is the metric that separates the two. Conversely, a market-neutral long/short equity manager can have a stellar IR (zero benchmark sensitivity, all returns are active) but a modest Sharpe because the absolute return level is small.',
  },
  {
    question: 'What is "tracking error" exactly?',
    plainAnswer:
      'Tracking error is the standard deviation of the active return series — the daily / monthly differences between portfolio return and benchmark return. An index fund has tracking error under 0.5% per year. A core active fund: 2-4%. An aggressive active fund: 5-10%. A long/short hedge fund vs cash: 10-20%. Higher tracking error means more concentrated active bets, not necessarily worse — IR normalizes for this.',
    answer:
      'Tracking error is the annualized standard deviation of the active return series, where active return = portfolio return − benchmark return. For an index fund pure replicating the S&P 500, tracking error should be under 0.5% per year (any larger and the fund is failing its mandate). For a core active fund running ±2% sector tilts against a benchmark, 2-4%. For aggressive active funds making concentrated stock picks, 5-10%. For long/short hedge funds benchmarked to cash, 10-20% (since the benchmark contributes near-zero variance). Higher tracking error isn&apos;t inherently worse — it just means more concentrated active bets, which IR normalizes for: a manager with 4% TE and 2% active return has the same IR as one with 8% TE and 4% active return (IR = 0.5 in both cases).',
  },
  {
    question: 'How do I compute beta for the Treynor ratio?',
    plainAnswer:
      'Run a simple linear regression: portfolio_excess_return = α + β · market_excess_return + ε. Beta is the slope. With daily data over a year (~252 obs) the standard error is meaningful — point estimates wobble by 0.1-0.2 just from sampling noise. Use rolling windows or shrinkage estimators for production.',
    answer:
      'Standard approach: regress the portfolio&apos;s excess returns over the risk-free rate against the market&apos;s excess returns. The slope β captures how much the portfolio moves per 1% market move. With daily data over a year (~252 observations) the standard error of the beta estimate is meaningful — point estimates can wobble by 0.1-0.2 just from sampling noise, so beta of "1.05" might really be 0.85-1.25 with 95% confidence. For production use rolling-window betas with 6-12 month windows, or Bayesian shrinkage estimators that pull all betas toward 1.0 by an amount inversely proportional to sample size. Be careful about benchmarks: a US large-cap fund&apos;s beta to S&P 500 is meaningful; a global macro fund&apos;s beta to S&P 500 is largely noise.',
  },
  {
    question: 'What about Sortino, Calmar, and the other ratios?',
    plainAnswer:
      'Sortino is Sharpe but divides by downside deviation instead of total volatility. Calmar is annualized return divided by max drawdown. These complement Sharpe rather than replace it. See the separate Sharpe vs Sortino vs Calmar comparison for that detail.',
    answer:
      'Sortino, Calmar, Omega, and the others are alternative answers to "how should we measure risk?" Sortino divides by downside deviation (volatility of negative returns only), arguing that upside volatility shouldn&apos;t be penalized. Calmar uses max drawdown instead of any volatility measure, since drawdown is what investors actually feel. Omega looks at the ratio of upside probability-weighted returns to downside. Each emphasizes a different facet of risk. For the head-to-head on Sharpe vs Sortino vs Calmar, see the dedicated comparison; for active-management-specific metrics, this article (Sharpe vs IR vs Treynor) is the right reference.',
  },
  {
    question: 'Which QuantOracle calculators do these?',
    plainAnswer:
      'Sharpe Ratio Calculator does standalone Sharpe with confidence intervals. The full Probabilistic Sharpe Ratio calculator extends to "is the Sharpe estimate statistically significant given skew/kurtosis/sample size." Information Ratio and Treynor are computable via the API but no dedicated calculator yet — request via GitHub.',
    answer:
      'Direct calculator: the QuantOracle Sharpe Ratio Calculator handles standalone Sharpe with confidence intervals via Lo (2002) standard errors. The Probabilistic Sharpe Ratio Calculator extends this to test whether an observed Sharpe is statistically significant given the sample skew, kurtosis, and length. Information Ratio and Treynor are computable from the underlying API endpoints (you can pass the active return series to the Sharpe endpoint to get IR, or supply beta-adjusted returns for Treynor), but there isn&apos;t a dedicated calculator page for either yet — open a GitHub issue at quantoracle.dev if you&apos;d use them.',
  },
];
