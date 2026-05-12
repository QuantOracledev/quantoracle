import Link from 'next/link';
import { Faq } from '@/components/FAQ';
import { buildMetadata, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/compare/var-vs-cvar-vs-max-drawdown',
  title: 'VaR vs CVaR vs Max Drawdown: Three Ways to Measure Downside Risk',
  description:
    'Three downside risk metrics that answer different questions. Where VaR lies, why CVaR was invented, and why drawdown is what allocators actually use.',
  keywords: [
    'var vs cvar',
    'cvar vs expected shortfall',
    'downside risk metrics',
    'max drawdown vs var',
    'value at risk vs conditional var',
    'tail risk measures compared',
  ],
});

const LAST_UPDATED = 'May 11, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'VaR vs CVaR vs Max Drawdown: Three Ways to Measure Downside Risk',
  description:
    'Practitioner comparison of the three most-used downside risk metrics. Formulas, where each one lies, and which one allocators actually use for capital decisions.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-05-11',
  dateModified: '2026-05-11',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/compare/var-vs-cvar-vs-max-drawdown',
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
      name: 'VaR vs CVaR vs Max Drawdown',
      item: 'https://quantoracle.dev/compare/var-vs-cvar-vs-max-drawdown',
    },
  ],
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>{' '}
        /{' '}
        <Link href="/compare" className="hover:text-accent">
          Compare
        </Link>{' '}
        / VaR vs CVaR vs Max Drawdown
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          VaR vs CVaR vs Max Drawdown: Three Ways to Measure Downside Risk
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          Three downside metrics that answer fundamentally different questions about how a strategy
          can hurt you. Pick the wrong one and you systematically under-estimate the risk you
          actually carry.
        </p>
        <p className="mt-3 text-xs text-slate-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">The 30-second answer</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Metric</th>
                <th className="px-4 py-3 font-semibold">Answers</th>
                <th className="px-4 py-3 font-semibold">Misses</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">VaR</td>
                <td className="px-4 py-3">
                  How often do I lose more than X in a single period?
                </td>
                <td className="px-4 py-3">
                  How bad it gets when I exceed X. Cross-period clustering.
                </td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">CVaR</td>
                <td className="px-4 py-3">
                  How bad is the AVERAGE loss when I exceed VaR?
                </td>
                <td className="px-4 py-3">
                  Cross-period correlation (still single-period). Worst case.
                </td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Max Drawdown</td>
                <td className="px-4 py-3">
                  What is the worst peak-to-trough loss this has ACTUALLY had?
                </td>
                <td className="px-4 py-3">
                  Probability of future drawdowns. Anchored on one data point.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Three different conceptual frameworks. Report all three — they catch each other&apos;s
          blind spots.
        </p>
      </section>

      <article className="prose-soft">
        <h2>What each metric actually measures</h2>

        <h3>VaR: a quantile of the return distribution</h3>
        <p>
          <code>VaR_α = −Q_α(returns)</code> where <code>Q_α</code> is the α-quantile (e.g., 5th percentile)
        </p>
        <p>
          Value at Risk asks: &quot;what loss am I exceeding only α% of the time?&quot; A 95% VaR
          of -2% means: on 95% of days, losses are within -2%; on the bad 5% of days, losses are
          larger than -2%. VaR is a single point on the distribution. It says nothing about the
          shape beyond that point.
        </p>

        <h3>CVaR: the expected loss beyond VaR</h3>
        <p>
          <code>CVaR_α = E[loss | loss &gt; VaR_α]</code>
        </p>
        <p>
          Conditional VaR (also called Expected Shortfall) is the AVERAGE loss given that a loss
          exceeds VaR. Where VaR tells you the threshold, CVaR tells you the average depth of the
          tail. CVaR is always at least as large as VaR — for normal distributions about 25%
          larger, for fat-tailed distributions 2-5x larger. CVaR satisfies the mathematical property
          of subadditivity (combining portfolios never increases risk), which makes it a
          &quot;coherent risk measure&quot; in the sense of Artzner et al. (1999). VaR is not.
        </p>

        <h3>Max Drawdown: the worst path-dependent realized loss</h3>
        <p>
          <code>MaxDD = max over t of (peak_to_t − value_t) / peak_to_t</code>
        </p>
        <p>
          Maximum drawdown is the largest peak-to-trough decline ever observed in the equity
          curve. Unlike VaR and CVaR, drawdown is path-dependent — it requires an actual sequence
          of returns and captures correlation across time. A strategy that loses 1% per day for 30
          straight days has a max drawdown of ~26% but a daily VaR of only ~1%. VaR is blind to
          that clustering.
        </p>

        <h2>A concrete example: three strategies, three rankings</h2>
        <p>
          Same expected return (10% annualized), same volatility (15%), but very different tail
          behaviors:
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-3 py-2">Strategy</th>
                <th className="px-3 py-2">Profile</th>
                <th className="px-3 py-2">VaR_95 (1-day)</th>
                <th className="px-3 py-2">CVaR_95 (1-day)</th>
                <th className="px-3 py-2">Max Drawdown</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">A. Normal returns</td>
                <td className="px-3 py-2">Symmetric, thin tails</td>
                <td className="px-3 py-2">-1.5%</td>
                <td className="px-3 py-2">-1.9%</td>
                <td className="px-3 py-2">-18%</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">B. Fat-tailed</td>
                <td className="px-3 py-2">Symmetric, kurtosis 8</td>
                <td className="px-3 py-2">-1.4%</td>
                <td className="px-3 py-2 text-chart-loss">-3.5%</td>
                <td className="px-3 py-2 text-chart-loss">-35%</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">C. Negative skew</td>
                <td className="px-3 py-2">Small wins, rare big losses</td>
                <td className="px-3 py-2">-1.1%</td>
                <td className="px-3 py-2 text-chart-loss">-4.2%</td>
                <td className="px-3 py-2 text-chart-loss">-42%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          By VaR alone, Strategy C looks SAFER than A and B — it has the lowest VaR. That&apos;s
          wrong. CVaR immediately exposes the problem: when C goes bad, it goes much worse than A
          or B. Max drawdown confirms: C had a -42% drawdown. The single VaR number missed this
          entirely.
        </p>
        <p>
          This is the canonical reason CVaR was developed and why drawdown is reported alongside
          VaR in every serious risk system. <strong>VaR alone systematically under-rates the risk
          of negatively-skewed and fat-tailed strategies</strong> — which is most real strategies.
        </p>

        <h2>When each one lies</h2>

        <h3>VaR lies on fat tails and negative skew</h3>
        <p>
          VaR is just a quantile. It says nothing about distribution shape beyond the threshold.
          Worst cases:
        </p>
        <ul>
          <li>
            <strong>Option-selling strategies</strong> have tiny daily VaR (small losses on most
            days) but enormous CVaR when the rare large loss arrives. VaR will make them look
            safer than long-only equity.
          </li>
          <li>
            <strong>Crypto strategies</strong> have fat tails — parametric normal VaR routinely
            understates real loss potential by 2-3x. Use historical VaR or Cornish-Fisher VaR with
            skew and kurtosis corrections.
          </li>
          <li>
            <strong>Carry trades</strong> classically have small VaR for years and catastrophic
            losses on the few bad days. VaR completely misses the structure.
          </li>
        </ul>

        <h3>CVaR lies less, but still single-period</h3>
        <p>
          CVaR fixes VaR&apos;s tail-blindness but is still computed per-period. It does not
          capture clustering of bad periods. A strategy can have CVaR_95 of -3% per day and still
          experience a -50% drawdown if the bad days cluster. CVaR &amp; VaR together do not
          replace looking at drawdown.
        </p>

        <h3>Max Drawdown is anchored on one data point</h3>
        <p>
          The denominator of Calmar (max drawdown) is the single worst observed peak-to-trough.
          That makes it:
        </p>
        <ul>
          <li>
            Sensitive to one bad period — a strategy can go from MDD -15% to MDD -35% overnight
          </li>
          <li>
            Optimistic for short track records — a strategy that hasn&apos;t had a real drawdown
            yet shows artificially low MDD
          </li>
          <li>
            Blind to frequency — one -30% drawdown and three years of recovery looks the same as
            five -30% drawdowns and consistent re-recoveries
          </li>
        </ul>
        <p>
          Many shops report MDD alongside &quot;average drawdown&quot; (mean of all drawdowns) and
          &quot;pain index&quot; (time-weighted average of underwater values) for a fuller
          picture.
        </p>

        <h2>The Cornish-Fisher fix for VaR/CVaR on fat tails</h2>
        <p>
          Standard parametric VaR assumes normal returns. For real strategies with skew and
          excess kurtosis, this systematically understates VaR. The Cornish-Fisher expansion
          corrects the quantile estimate using the third and fourth moments of the return
          distribution:
        </p>
        <p>
          <code>
            z_CF = z + (z² − 1)·γ/6 + (z³ − 3z)·κ/24 − (2z³ − 5z)·γ²/36
          </code>
        </p>
        <p>
          Where z is the standard normal quantile, γ is skewness, and κ is excess kurtosis. The
          QuantOracle{' '}
          <Link href="/value-at-risk-calculator" className="text-accent">
            Value at Risk Calculator
          </Link>{' '}
          uses Cornish-Fisher by default for parametric VaR and CVaR.
        </p>

        <h2>What good values look like (rough ranges)</h2>
        <p>
          Annualized strategy with daily returns, 95% confidence:
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-3 py-2">Strategy class</th>
                <th className="px-3 py-2">Daily VaR_95</th>
                <th className="px-3 py-2">CVaR/VaR ratio</th>
                <th className="px-3 py-2">Max DD</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Long-only equity</td>
                <td className="px-3 py-2">-1.5 to -2.5%</td>
                <td className="px-3 py-2">1.3 - 1.5x</td>
                <td className="px-3 py-2">-25 to -55%</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">60/40 balanced</td>
                <td className="px-3 py-2">-0.8 to -1.2%</td>
                <td className="px-3 py-2">1.3 - 1.4x</td>
                <td className="px-3 py-2">-15 to -30%</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Market-neutral</td>
                <td className="px-3 py-2">-0.4 to -0.8%</td>
                <td className="px-3 py-2">1.5 - 2.0x</td>
                <td className="px-3 py-2">-5 to -15%</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Trend-following CTA</td>
                <td className="px-3 py-2">-1.5 to -2.0%</td>
                <td className="px-3 py-2">1.2 - 1.4x</td>
                <td className="px-3 py-2">-15 to -25%</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Crypto</td>
                <td className="px-3 py-2">-4 to -7%</td>
                <td className="px-3 py-2">1.8 - 3.0x</td>
                <td className="px-3 py-2">-50 to -85%</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Option-selling</td>
                <td className="px-3 py-2">-0.5 to -1.0%</td>
                <td className="px-3 py-2 text-chart-loss">2.5 - 5.0x</td>
                <td className="px-3 py-2">-30 to -60%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">
          The CVaR/VaR ratio is the most useful single tail-fatness indicator. Anything above 2.0
          means VaR is dramatically understating the risk and you should NOT use VaR alone for
          decisions about that strategy.
        </p>

        <h2>The decision rule</h2>
        <ol>
          <li>
            <strong>Compute VaR_95 (historical and parametric)</strong> with the{' '}
            <Link href="/value-at-risk-calculator" className="text-accent">
              VaR calculator
            </Link>
            . Always include CVaR_95 in the same call — it costs nothing extra and immediately
            reveals tail fatness.
          </li>
          <li>
            <strong>Check the CVaR/VaR ratio</strong>. Under 1.5: probably near-normal tails,
            VaR is reliable. Over 2.0: fat tails or negative skew, VaR systematically understates
            risk, prefer CVaR for decisions.
          </li>
          <li>
            <strong>Compute max drawdown</strong> with the{' '}
            <Link href="/drawdown-calculator" className="text-accent">
              drawdown calculator
            </Link>
            . This catches cross-period clustering that VaR/CVaR miss.
          </li>
          <li>
            <strong>For capital allocation, weight all three</strong>. A strategy that looks good
            on all three is rare and worth allocating to. A strategy that looks good on VaR but
            bad on CVaR or max drawdown is a tail-risk strategy in disguise.
          </li>
        </ol>

        <h2>Related calculators</h2>
        <ul>
          <li>
            <Link href="/value-at-risk-calculator" className="text-accent">
              Value at Risk Calculator
            </Link>{' '}
            — parametric and historical VaR + CVaR with Cornish-Fisher correction
          </li>
          <li>
            <Link href="/drawdown-calculator" className="text-accent">
              Drawdown Calculator
            </Link>{' '}
            — max drawdown, average drawdown, underwater fraction
          </li>
          <li>
            <Link href="/sharpe-ratio-calculator" className="text-accent">
              Sharpe Ratio Calculator
            </Link>{' '}
            — pair with VaR/CVaR for full risk picture
          </li>
          <li>
            <Link href="/monte-carlo-simulation-calculator" className="text-accent">
              Monte Carlo Simulation Calculator
            </Link>{' '}
            — forward-projects drawdown distribution under different return / vol assumptions
          </li>
          <li>
            <Link href="/compare/sharpe-vs-sortino-vs-calmar" className="text-accent">
              Related: Sharpe vs Sortino vs Calmar
            </Link>{' '}
            — Calmar uses max drawdown as the denominator
          </li>
        </ul>

        <h2>References</h2>
        <ul className="text-sm">
          <li>
            J.P. Morgan/Reuters (1994). &quot;RiskMetrics — Technical Document.&quot; — introduced
            parametric VaR as industry standard.
          </li>
          <li>
            Artzner, P., Delbaen, F., Eber, J.-M., &amp; Heath, D. (1999). &quot;Coherent measures
            of risk.&quot; Mathematical Finance 9(3), 203-228. — formal VaR critique, CVaR
            motivation.
          </li>
          <li>
            Rockafellar, R. T. &amp; Uryasev, S. (2000). &quot;Optimization of Conditional
            Value-at-Risk.&quot; Journal of Risk 2, 21-41. — CVaR computation.
          </li>
          <li>
            Acerbi, C. &amp; Tasche, D. (2002). &quot;On the coherence of Expected Shortfall.&quot;
            Journal of Banking &amp; Finance 26(7), 1487-1503. — CVaR = ES equivalence.
          </li>
          <li>
            Magdon-Ismail, M. &amp; Atiya, A. F. (2004). &quot;Maximum drawdown.&quot; Risk
            Magazine, October.
          </li>
        </ul>
      </article>

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
