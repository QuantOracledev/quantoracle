import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What\'s the difference between geometric, arithmetic, and time-weighted returns?',
    plainAnswer:
      'Arithmetic mean averages periodic returns directly: (r₁ + r₂ + ... + rₙ) / n. Geometric mean compounds them: ((1+r₁)(1+r₂)...(1+rₙ))^(1/n) − 1. Time-weighted return strips out the impact of cash flows so different sub-periods can be combined fairly. Arithmetic is higher than geometric for any volatile series; time-weighted equals geometric in the absence of cash flows.',
    answer:
      'Arithmetic mean averages periodic returns directly: (r₁ + r₂ + ... + rₙ) / n. Useful for expected single-period return estimation. Geometric mean compounds them: ((1+r₁)(1+r₂)...(1+rₙ))^(1/n) − 1. Equivalent to CAGR (compound annual growth rate) and represents the actual realized growth rate. Time-weighted return is the geometric return computed in a way that strips out the impact of intermediate cash flows (deposits/withdrawals), so different sub-periods can be combined fairly across portfolios that experienced different cash-flow patterns. Without cash flows, time-weighted = geometric. With cash flows, they diverge — time-weighted reflects manager skill, dollar-weighted (IRR) reflects investor experience.',
  },
  {
    question: 'Why is arithmetic mean always higher than geometric mean?',
    plainAnswer:
      'AM-GM inequality: arithmetic mean ≥ geometric mean for any set of positive numbers, with equality only when all numbers are equal. For returns with any volatility, arithmetic > geometric. The gap (called "volatility drag") is approximately σ²/2 for the same series — higher vol means bigger gap. A series alternating between +50% and -33% has arithmetic mean of +8.5% but geometric mean of 0% (you end where you started).',
    answer:
      'The arithmetic-geometric mean inequality (AM-GM) guarantees that arithmetic mean ≥ geometric mean for any set of positive numbers, with equality only when all numbers are equal. For investment returns with any volatility, arithmetic > geometric. The gap, called "volatility drag" or "variance drain," is approximately σ²/2 for the same series — variance reduces the geometric mean below the arithmetic mean by half the variance (in the continuous compounding limit). Concrete example: a series alternating between +50% and -33% has arithmetic mean of (+50 + -33)/2 = +8.5% per period, but geometric mean of √(1.50 × 0.67) − 1 = 0% (1.50 × 0.67 = 1.00 exactly, so you end where you started). The arithmetic mean overstates the realized growth rate by 8.5pp per period due to volatility drag.',
  },
  {
    question: 'When should I use arithmetic vs geometric mean?',
    plainAnswer:
      'Arithmetic: forward-looking expected single-period return; inputs to Markowitz mean-variance optimization (theory requires arithmetic means); Sharpe ratio inputs. Geometric: backward-looking realized growth rate; CAGR; what the portfolio actually grew at; long-term wealth projection. Using the wrong one gives wrong answers — Markowitz with geometric means produces sub-optimal portfolios; long-term wealth projection with arithmetic means overshoots.',
    answer:
      'Use ARITHMETIC mean when: estimating the expected single-period return (e.g., what return should I expect next month?); computing Markowitz mean-variance optimization inputs (the theory explicitly requires arithmetic means); computing the numerator of Sharpe ratio (which uses arithmetic excess return). Use GEOMETRIC mean when: reporting realized portfolio growth (CAGR); projecting long-term wealth (compounding effects matter); calculating actual compound returns over multi-year periods; comparing actual realized performance across managers or strategies. Using the wrong one creates real errors: Markowitz with geometric means produces sub-optimal portfolios because the math wants arithmetic. Long-term wealth projection with arithmetic means overshoots reality by σ²T/2 over horizon T.',
  },
  {
    question: 'When does time-weighted return differ from geometric return?',
    plainAnswer:
      'Only when there are cash flows (deposits or withdrawals) during the period. Time-weighted return chains the geometric returns of sub-periods between cash flows, weighting each sub-period equally regardless of how much capital was in the account. This is fair to managers because they can\'t control when clients add or withdraw money. Dollar-weighted return (IRR) weights periods by capital deployed, which captures investor experience but conflates manager skill with cash-flow timing.',
    answer:
      'Time-weighted return (TWR) differs from geometric return only when there are intermediate cash flows (deposits, withdrawals, contributions, distributions). With no cash flows: TWR = geometric return = CAGR. With cash flows: TWR chains the geometric returns of sub-periods between cash flows, weighting each sub-period equally regardless of capital level. This is the standard for measuring manager skill because the manager can\'t control when clients add or withdraw money — TWR fairly compares managers who happened to face different cash-flow patterns. Contrast with dollar-weighted return (IRR), which weights periods by capital deployed: IRR captures the actual investor experience but conflates manager skill with cash-flow timing decisions (which were often outside the manager\'s control). GIPS-compliant performance reports use TWR for this reason.',
  },
  {
    question: 'What is "volatility drag" exactly?',
    plainAnswer:
      'Volatility drag is the gap between arithmetic and geometric mean returns, caused by the asymmetric compound effect of losses. A 50% loss requires a 100% gain to recover. Over time, this asymmetry compounds — a series with high arithmetic mean but high vol can have a low or negative geometric mean. The drag is approximately σ²/2 per period in continuous compounding. Higher vol = more drag.',
    answer:
      'Volatility drag (also called "variance drain") is the gap between arithmetic and geometric mean returns, caused by the asymmetric compound effect of losses. A 50% loss requires a 100% gain to recover. A 75% loss requires a 300% gain. Over time, this compound asymmetry creates a gap where the geometric (realized compound) return is always below the arithmetic (single-period expected) return. The drag is approximately σ²/2 per period in the continuous compounding limit (the exact relationship: log(1 + geometric) = log(1 + arithmetic) − σ²/(2(1+arithmetic)²) for small returns; the σ²/2 approximation is excellent). Higher vol = more drag. A 20% return with 0% vol has 0 drag. A 20% return with 40% vol has ~8pp drag (geometric ≈ 12%, arithmetic = 20%). This is one reason high-vol strategies often underperform their backtest expectations: backtests often display arithmetic means while real compounded performance follows geometric.',
  },
  {
    question: 'What is CAGR and how does it relate to these?',
    plainAnswer:
      'CAGR (compound annual growth rate) IS the annualized geometric mean return. Formula: CAGR = (end value / start value)^(1/years) − 1. It\'s what you actually realized as a long-term growth rate. Arithmetic mean overstates CAGR; geometric mean equals CAGR (when computed on annualized returns). Time-weighted return equals CAGR for portfolios with no cash flows.',
    answer:
      'CAGR (compound annual growth rate) is the annualized geometric mean return. Formula: CAGR = (end_value / start_value)^(1/years) − 1. It represents the constant annual rate that would have produced the actual realized end-value from the actual start-value over the actual time period. CAGR = annualized geometric mean of yearly returns = annualized time-weighted return when there are no cash flows. CAGR is the right metric for: reporting investment performance; comparing strategies across different durations; projecting wealth assuming a constant compounding rate. CAGR is the WRONG metric for: estimating expected next-period return (use arithmetic mean); computing risk-adjusted return ratios that assume single-period returns (Sharpe uses arithmetic). Use the QuantOracle CAGR Calculator at /cagr-calculator.',
  },
  {
    question: 'How does this affect the Sharpe ratio?',
    plainAnswer:
      'Sharpe ratio uses arithmetic mean in the numerator: (arithmetic excess return) / volatility. Substituting geometric mean would lower the ratio (because geometric is lower than arithmetic). Some practitioners report "geometric Sharpe" but it\'s not standard. For comparing strategies, stick with arithmetic Sharpe. For reporting realized performance to investors, separately report CAGR.',
    answer:
      'Sharpe ratio uses ARITHMETIC mean in the numerator: Sharpe = (annualized arithmetic mean excess return − risk-free rate) / (annualized stdev of returns). Substituting geometric mean would lower the ratio because geometric is always ≤ arithmetic. Some practitioners report "geometric Sharpe" using CAGR in the numerator — it\'s a meaningful number (represents risk-adjusted realized return) but it\'s not the industry-standard Sharpe definition. For comparing strategies fairly with industry conventions, use arithmetic Sharpe. For reporting realized performance to investors, separately report CAGR alongside Sharpe so they understand both the risk-adjusted comparison and the actual compounded growth. See /sharpe-ratio-calculator for the standard implementation.',
  },
  {
    question: 'What about log returns vs simple returns?',
    plainAnswer:
      'Log returns are time-additive (you can sum them to get cumulative log return) but simple returns are not. The arithmetic mean of log returns equals the geometric mean of (1+simple returns) − 1. This is why academic finance often uses log returns — they\'re mathematically cleaner. For practitioners, simple returns are more intuitive but require the geometric distinction.',
    answer:
      'Log returns are defined as ln(P_t / P_{t-1}) and have a key property: they are time-additive. You can sum log returns to get the cumulative log return. Simple returns (P_t / P_{t-1} − 1) are not time-additive — you have to chain them via (1+r_1)(1+r_2)... This is why academic finance and quantitative work often uses log returns: they\'re mathematically cleaner, the arithmetic mean of log returns = the geometric mean of (1+simple returns) − 1, and various distributional assumptions (normality, GARCH residuals) work better on log returns. For practitioner reporting, simple returns are more intuitive but require careful handling of the geometric distinction. Black-Scholes assumes log returns are normally distributed (the standard GBM model).',
  },
  {
    question: 'Does QuantOracle compute these correctly?',
    plainAnswer:
      'Yes. The CAGR Calculator computes geometric (time-weighted) returns from start/end values + years. The Sharpe Ratio Calculator uses arithmetic mean in the standard formula. The Monte Carlo Calculator simulates GBM paths (log-normal returns), reports both median path (closer to geometric) and mean path (arithmetic). The /v1/stats/sharpe-ratio API uses arithmetic excess return per Sharpe\'s 1966 definition.',
    answer:
      'Yes. The CAGR Calculator at /cagr-calculator computes geometric (time-weighted) returns from start_value, end_value, and years using the standard CAGR formula. The Sharpe Ratio Calculator at /sharpe-ratio-calculator uses arithmetic mean in the numerator per Sharpe\'s 1966 definition (industry standard). The Monte Carlo Simulation Calculator at /monte-carlo-simulation-calculator simulates GBM paths (log-normal returns) and reports both the median path (closer to geometric expected) and the mean path (arithmetic expected) so you can see both. The underlying API endpoint /v1/stats/sharpe-ratio uses arithmetic excess return per the standard definition; /v1/tvm/cagr is the geometric/time-weighted equivalent.',
  },
  {
    question: 'How do I think about this in practice for my own portfolio?',
    plainAnswer:
      '(1) When projecting future wealth, use geometric. (2) When estimating next month\'s return, use arithmetic. (3) When reporting how the portfolio has actually performed, use CAGR (= geometric annualized). (4) When comparing to a benchmark or another manager, use time-weighted return (= CAGR when no cash flows). (5) Always include both arithmetic and geometric on tearsheets — the gap between them shows your volatility drag.',
    answer:
      'Practical playbook: (1) When projecting future wealth over multiple years, use the GEOMETRIC mean / CAGR. Arithmetic mean systematically overestimates long-term wealth by σ²T/2. (2) When estimating the expected return over a single upcoming period, use the ARITHMETIC mean. (3) When reporting how your portfolio actually performed over a period, use CAGR (annualized geometric). (4) When comparing your portfolio to a benchmark or another manager fairly, use TIME-WEIGHTED RETURN — this equals CAGR when you had no cash flows during the period. (5) Always include both arithmetic and geometric on tearsheets — the gap between them visually displays your volatility drag, which is itself an important risk indicator (large drag = high vol = consider de-sizing). (6) Never use IRR (dollar-weighted) to compare manager skill — IRR conflates skill with the timing of when capital was deployed, which is usually outside the manager\'s control.',
  },
];
