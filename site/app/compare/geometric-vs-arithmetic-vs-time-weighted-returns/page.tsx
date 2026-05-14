import Link from 'next/link';
import { Faq } from '@/components/FAQ';
import { AffiliateCta } from '@/components/AffiliateCta';
import { buildMetadata, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/compare/geometric-vs-arithmetic-vs-time-weighted-returns',
  title: 'Geometric vs Arithmetic vs Time-Weighted Return: Which to Report',
  description:
    'Three ways to compute mean return, three different answers. The arithmetic-geometric gap (volatility drag) is real money. CAGR, Sharpe inputs, manager comparison — each demands a different one.',
  keywords: [
    'geometric vs arithmetic return',
    'time weighted return vs IRR',
    'volatility drag',
    'CAGR vs arithmetic',
    'arithmetic mean return',
    'compound annual growth rate',
  ],
});

const LAST_UPDATED = 'May 14, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Geometric vs Arithmetic vs Time-Weighted Return: Which to Report',
  description:
    'Practitioner comparison of geometric, arithmetic, and time-weighted return calculations. Volatility drag explained, when each one is correct, and the gotcha that breaks Markowitz vs CAGR projections.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-05-14',
  dateModified: '2026-05-14',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/compare/geometric-vs-arithmetic-vs-time-weighted-returns',
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'QuantOracle', item: 'https://quantoracle.dev' },
    { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://quantoracle.dev/compare' },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Geometric vs Arithmetic vs Time-Weighted Returns',
      item: 'https://quantoracle.dev/compare/geometric-vs-arithmetic-vs-time-weighted-returns',
    },
  ],
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> /{' '}
        <Link href="/compare" className="hover:text-accent">Compare</Link>{' '}
        / Geometric vs Arithmetic vs Time-Weighted Returns
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Geometric vs Arithmetic vs Time-Weighted Return: Three Means, Three Answers
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          One of the most common quant mistakes: using arithmetic mean where geometric belongs, or
          vice versa. The gap between them (volatility drag) is real money. Here&apos;s when each
          one is correct and the gotcha that breaks long-term wealth projections.
        </p>
        <p className="mt-3 text-xs text-slate-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">The 30-second answer</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Mean</th>
                <th className="px-4 py-3 font-semibold">Formula</th>
                <th className="px-4 py-3 font-semibold">Use for</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Arithmetic</td>
                <td className="px-4 py-3"><code>Σrᵢ / n</code></td>
                <td className="px-4 py-3">Sharpe input, Markowitz, single-period expected return</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Geometric</td>
                <td className="px-4 py-3"><code>(∏(1+rᵢ))^(1/n) − 1</code></td>
                <td className="px-4 py-3">CAGR, realized growth, long-term wealth projection</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Time-weighted</td>
                <td className="px-4 py-3">Geometric of sub-period returns</td>
                <td className="px-4 py-3">Manager skill comparison (strips cash flows)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Always: <strong className="text-slate-200">arithmetic ≥ geometric</strong>. The gap is
          volatility drag, approximately σ²/2 per period. Substituting one for the other gives
          wrong answers.
        </p>
      </section>

      <article className="prose-soft">
        <h2>The 50% loss / 100% gain asymmetry</h2>
        <p>
          The starting intuition. A portfolio loses 50% in year 1, then gains 50% in year 2. What
          was its average annual return?
        </p>
        <ul>
          <li>
            <strong>Arithmetic mean</strong>: (−50% + 50%) / 2 = <strong>0%</strong>. Looks fine.
          </li>
          <li>
            <strong>Geometric mean (CAGR)</strong>: √(0.5 × 1.5) − 1 = <strong>−13.4%</strong>.
            You lost money.
          </li>
        </ul>
        <p>
          The geometric mean is right. If you start with $100, lose 50% (down to $50), then gain
          50% (up to $75) — you ended at $75, a 25% loss, which over 2 years is −13.4% CAGR.
          The arithmetic mean ignores the compounding asymmetry: it takes more than a 50% gain to
          recover from a 50% loss, because the gain compounds off a smaller base.
        </p>
        <p>
          This isn&apos;t a contrived example. For any volatile return series, arithmetic mean ≥
          geometric mean (AM-GM inequality). For investments with meaningful vol, the gap is real
          money over time. The gap has a name: <strong>volatility drag</strong>.
        </p>

        <h2>Volatility drag: the σ²/2 rule</h2>
        <p>
          A precise approximation: for a return series with arithmetic mean μ and standard
          deviation σ, the geometric mean is approximately:
        </p>
        <p>
          <code>geometric ≈ arithmetic − σ²/2</code>
        </p>
        <p>
          (in continuous compounding; for discrete returns it&apos;s a tiny variation but the
          intuition is identical). So:
        </p>
        <ul>
          <li>
            <strong>10% return, 10% vol</strong>: drag = 0.5%, geometric ≈ 9.5%. Modest.
          </li>
          <li>
            <strong>10% return, 20% vol</strong>: drag = 2%, geometric ≈ 8%. Noticeable.
          </li>
          <li>
            <strong>15% return, 40% vol</strong>: drag = 8%, geometric ≈ 7%. The strategy looks
            great on arithmetic mean and mediocre on geometric.
          </li>
          <li>
            <strong>20% return, 70% vol</strong> (crypto-style): drag = 24.5%, geometric ≈
            −4.5%. The arithmetic mean is positive, the compounded reality is negative.
          </li>
        </ul>
        <p>
          This is why high-vol strategies often underperform their backtest expectations.
          Backtests often display arithmetic means; real compounded performance follows geometric.
        </p>

        <h2>What is arithmetic mean used for?</h2>
        <p>
          Three things specifically:
        </p>
        <h3>1. Expected single-period return</h3>
        <p>
          &quot;What return should I expect next month?&quot; The arithmetic mean is the correct
          answer in expectation. If past monthly returns averaged 1.2% arithmetically, your best
          unbiased estimate for next month is 1.2%.
        </p>
        <h3>2. Sharpe ratio numerator</h3>
        <p>
          The standard Sharpe ratio formula uses arithmetic excess return:{' '}
          <code>Sharpe = (arithmetic mean excess return) / (stdev of excess return)</code>. Some
          practitioners report &quot;geometric Sharpe&quot; (using CAGR in the numerator), but
          it&apos;s nonstandard and not directly comparable to published Sharpes.
        </p>
        <h3>3. Markowitz mean-variance optimization</h3>
        <p>
          Markowitz portfolio theory derives its optimal weights from arithmetic means of asset
          returns. Substituting geometric means produces sub-optimal portfolios — the math
          explicitly requires arithmetic inputs. (This is a subtle gotcha that has produced lots
          of academically wrong but practically deployed portfolios.)
        </p>

        <h2>What is geometric mean used for?</h2>
        <p>
          Two things:
        </p>
        <h3>1. CAGR — actual realized growth</h3>
        <p>
          <code>CAGR = (end_value / start_value)^(1/years) − 1</code>
        </p>
        <p>
          This is the constant annual growth rate that would have produced the actual end value
          from the actual start value. It&apos;s what your portfolio actually grew at. It equals
          the geometric mean of annualized returns. Use the{' '}
          <Link href="/cagr-calculator" className="text-accent">
            CAGR Calculator
          </Link>{' '}
          to compute directly.
        </p>
        <h3>2. Long-term wealth projection</h3>
        <p>
          If you&apos;re projecting wealth N years out, use geometric mean (or run a Monte Carlo
          simulation with median path — which approximates geometric). Arithmetic mean
          systematically overshoots long-term wealth by σ²T/2 over horizon T. For a 20-year
          projection at 20% vol, that&apos;s 4% — non-trivial.
        </p>
        <p>
          The QuantOracle{' '}
          <Link href="/monte-carlo-simulation-calculator" className="text-accent">
            Monte Carlo Simulation Calculator
          </Link>{' '}
          shows both the mean and median terminal value across simulated paths; the median is
          closer to the geometric expected outcome and is the more useful planning figure for
          risk-aware retirees and traders.
        </p>

        <h2>What is time-weighted return?</h2>
        <p>
          Time-weighted return (TWR) is the geometric return computed in a way that strips out
          the impact of intermediate cash flows. For portfolios with no cash flows, TWR =
          geometric return = CAGR. For portfolios with deposits/withdrawals, they diverge.
        </p>
        <p>
          The mechanism: TWR chains the geometric returns of sub-periods between cash flows,
          weighting each sub-period equally regardless of how much capital was deployed at that
          time. This isolates manager skill from cash-flow timing decisions (which are usually
          outside the manager&apos;s control).
        </p>
        <p>
          Contrast with <strong>dollar-weighted return</strong> (also called IRR or money-weighted
          return), which weights periods by capital level. IRR captures the actual investor
          experience but conflates manager skill with the timing of when money was added or
          withdrawn.
        </p>
        <p>
          <strong>When to use which</strong>:
        </p>
        <ul>
          <li>
            <strong>TWR</strong> for comparing manager skill (industry standard, GIPS-compliant)
          </li>
          <li>
            <strong>IRR</strong> for measuring actual investor experience (useful for individual
            performance reporting)
          </li>
        </ul>

        <h2>A concrete example: same returns, different stories</h2>
        <p>
          A portfolio with three years of returns: +30%, −20%, +30%. What was the average?
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Calculation</th>
                <th className="px-3 py-2">Answer</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">Arithmetic</td>
                <td className="px-3 py-2 font-mono">(30 + (−20) + 30) / 3</td>
                <td className="px-3 py-2 font-mono">13.3%</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">Geometric (CAGR)</td>
                <td className="px-3 py-2 font-mono">(1.3 × 0.8 × 1.3)^(1/3) − 1</td>
                <td className="px-3 py-2 font-mono">11.0%</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">Volatility drag</td>
                <td className="px-3 py-2 font-mono">arithmetic − geometric</td>
                <td className="px-3 py-2 font-mono text-chart-loss">2.3pp</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The 2.3 percentage-point gap is the volatility drag. Both numbers are correct — they
          answer different questions. The arithmetic 13.3% is the right expected single-period
          return going forward. The geometric 11.0% is the right answer to &quot;what did the
          portfolio actually grow at over those 3 years?&quot;
        </p>
        <p>
          If you started with $100,000, after the three years you had $135,200. (CAGR check:
          100,000 × 1.11³ = 135,205 ✓.) Using arithmetic mean would project 100,000 × 1.133³ =
          145,500 — overstating reality by $10,300.
        </p>

        <h2>The decision rule</h2>
        <ol>
          <li>
            <strong>Forward-looking wealth projection over N years</strong> → geometric mean. Or
            equivalently, use the{' '}
            <Link href="/monte-carlo-simulation-calculator" className="text-accent">
              Monte Carlo Calculator
            </Link>{' '}
            and read the median terminal value.
          </li>
          <li>
            <strong>Reporting realized performance</strong> → CAGR (= annualized geometric mean).
            Use the{' '}
            <Link href="/cagr-calculator" className="text-accent">
              CAGR Calculator
            </Link>
            .
          </li>
          <li>
            <strong>Sharpe ratio, Sortino, Calmar, any risk-adjusted return ratio</strong> →
            arithmetic mean in the numerator. The{' '}
            <Link href="/sharpe-ratio-calculator" className="text-accent">
              Sharpe Ratio Calculator
            </Link>{' '}
            uses arithmetic by default.
          </li>
          <li>
            <strong>Markowitz mean-variance optimization</strong> → arithmetic means as inputs.
            Geometric inputs produce wrong portfolios.
          </li>
          <li>
            <strong>Comparing managers / strategies fairly</strong> → time-weighted return (TWR).
            For portfolios without cash flows, this is the same as CAGR.
          </li>
          <li>
            <strong>Individual investor performance reporting</strong> → either TWR or IRR
            depending on whether cash-flow timing was the investor&apos;s decision. If yes, IRR.
            If no, TWR.
          </li>
        </ol>

        <h2>Common mistakes to avoid</h2>

        <h3>Reporting arithmetic mean as &quot;average return&quot;</h3>
        <p>
          Most performance tearsheets unfortunately do this. If you see a fund advertising
          &quot;15% average return&quot; with 25% volatility, the geometric reality is around
          11.9% — the realized growth investors actually experienced. Always check whether the
          number cited is arithmetic or geometric; with high-vol strategies the gap is meaningful.
        </p>

        <h3>Using arithmetic mean in long-horizon Monte Carlo</h3>
        <p>
          GBM Monte Carlo simulations use log-normal returns parameterized by μ (drift) and σ
          (vol). Plugging in the arithmetic mean of historical returns as μ overshoots the
          terminal wealth distribution because the actual realized drift is closer to (arithmetic
          − σ²/2). For wealth projections, plug in the geometric mean directly OR use the
          arithmetic mean with σ correction.
        </p>

        <h3>Comparing Sharpe ratios computed with different conventions</h3>
        <p>
          If one manager reports Sharpe using arithmetic excess return (standard) and another
          uses geometric (nonstandard), their numbers aren&apos;t directly comparable.
          Geometric-Sharpe is always lower. Verify both use the same convention before drawing
          conclusions.
        </p>

        <h3>Confusing CAGR with arithmetic mean of returns</h3>
        <p>
          A portfolio with 10% annual returns for 5 years has CAGR = 10% (because the geometric
          mean of constant returns equals each return). But a portfolio averaging 10% with vol
          will have CAGR &lt; 10%. The two are equal only when returns are constant — which they
          aren&apos;t in any real strategy.
        </p>

        <h2>Related calculators</h2>
        <ul>
          <li>
            <Link href="/cagr-calculator" className="text-accent">
              CAGR Calculator
            </Link>{' '}
            — geometric/time-weighted annualized return from start/end values
          </li>
          <li>
            <Link href="/sharpe-ratio-calculator" className="text-accent">
              Sharpe Ratio Calculator
            </Link>{' '}
            — uses arithmetic mean by standard convention
          </li>
          <li>
            <Link href="/monte-carlo-simulation-calculator" className="text-accent">
              Monte Carlo Simulation Calculator
            </Link>{' '}
            — shows both mean and median terminal values (arithmetic vs geometric expected)
          </li>
          <li>
            <Link href="/value-at-risk-calculator" className="text-accent">
              Value at Risk Calculator
            </Link>{' '}
            — uses arithmetic mean returns + stdev (the parametric VaR model)
          </li>
        </ul>

        <h2>Related comparisons</h2>
        <ul>
          <li>
            <Link href="/compare/sharpe-vs-sortino-vs-calmar" className="text-accent">
              Sharpe vs Sortino vs Calmar
            </Link>{' '}
            — all three use arithmetic mean in their numerator
          </li>
          <li>
            <Link href="/compare/var-vs-cvar-vs-max-drawdown" className="text-accent">
              VaR vs CVaR vs Max Drawdown
            </Link>{' '}
            — risk metrics that depend on the arithmetic/geometric distinction
          </li>
          <li>
            <Link href="/compare/kelly-vs-fixed-fractional-vs-optimal-f" className="text-accent">
              Kelly vs Fixed Fractional vs Optimal-f
            </Link>{' '}
            — Kelly maximizes geometric growth specifically (not arithmetic)
          </li>
        </ul>

        <h2>References</h2>
        <ul className="text-sm">
          <li>Kelly Jr., J. L. (1956). &quot;A new interpretation of information rate.&quot; Bell System Technical Journal 35(4), 917-926. Kelly criterion explicitly maximizes the geometric growth rate, not arithmetic.</li>
          <li>Markowitz, H. (1952). &quot;Portfolio Selection.&quot; Journal of Finance 7(1), 77-91. Portfolio theory uses arithmetic means.</li>
          <li>Sharpe, W. F. (1966). &quot;Mutual fund performance.&quot; Journal of Business 39(1, Part 2), 119-138. Sharpe ratio uses arithmetic excess return.</li>
          <li>Jorion, P. (1997). &quot;Value at Risk: The New Benchmark for Managing Financial Risk.&quot; — standard reference for VaR/risk metric mathematics including mean conventions.</li>
          <li>Bodie, Kane, &amp; Marcus, &quot;Investments&quot; (any recent edition) — Chapter 5 covers arithmetic vs geometric mean in detail with worked examples.</li>
        </ul>
      </article>

      <div className="mt-12">
        <AffiliateCta subId="compare-returns-arithmetic-geometric-tw" category="compare" />
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">Frequently asked questions</h2>
        <Faq items={faqs} />
      </section>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              articleJsonLd,
              breadcrumbJsonLd,
              faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
            ],
          }),
        }}
      />
    </div>
  );
}
