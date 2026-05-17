import Link from 'next/link';
import { Faq } from '@/components/FAQ';
import { AffiliateCta } from '@/components/AffiliateCta';
import { buildMetadata, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/compare/sharpe-vs-sortino-vs-calmar',
  title: 'Sharpe vs Sortino vs Calmar Ratio: When Each Lies and Which One Allocators Use',
  description:
    'Three risk-adjusted return ratios that all claim to measure the same thing — and the one allocators actually use to compare managers. Formulas, when each one mis-prices, what good values look like (Sharpe 1.0 vs 2.0), and the half-Sharpe trick.',
  keywords: [
    'sharpe vs sortino',
    'sharpe vs calmar',
    'sortino vs calmar',
    'risk adjusted return metrics',
    'sharpe ratio comparison',
    'which sharpe ratio to use',
    'sortino ratio vs calmar ratio',
  ],
});

const LAST_UPDATED = 'May 11, 2026';

// Schema.org Article JSON-LD — gives Google a rich-result hint that this is
// editorial/explainer content (distinct from the SoftwareApplication schema
// used for calculator pages).
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Sharpe vs Sortino vs Calmar: Which Risk-Adjusted Return Metric Should You Use?',
  description:
    'Side-by-side comparison of the three most-used risk-adjusted return metrics with formulas, edge cases, allocator practice, and decision rules.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: {
    '@type': 'Organization',
    name: 'QuantOracle',
    url: 'https://quantoracle.dev',
  },
  datePublished: '2026-05-11',
  dateModified: '2026-05-11',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/compare/sharpe-vs-sortino-vs-calmar',
  },
};

// Breadcrumb schema helps Google show "QuantOracle › Compare › Sharpe vs Sortino…"
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'QuantOracle', item: 'https://quantoracle.dev' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Compare',
      item: 'https://quantoracle.dev/compare',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Sharpe vs Sortino vs Calmar',
      item: 'https://quantoracle.dev/compare/sharpe-vs-sortino-vs-calmar',
    },
  ],
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>{' '}
        / Compare / Sharpe vs Sortino vs Calmar
      </nav>

      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Sharpe vs Sortino vs Calmar: Which Risk-Adjusted Return Metric Should You Use?
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          Three metrics, three different things they measure, three different ways they can mislead.
          A practitioner&apos;s guide to picking the right one — and when to use all three.
        </p>
        <p className="mt-3 text-xs text-slate-500">Last updated: {LAST_UPDATED}</p>
      </header>

      {/* TL;DR table */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">The 30-second answer</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Use…</th>
                <th className="px-4 py-3 font-semibold">When…</th>
                <th className="px-4 py-3 font-semibold">Watch out for…</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Sharpe</td>
                <td className="px-4 py-3">
                  Comparing across funds / industry default / academic publication
                </td>
                <td className="px-4 py-3">
                  Lies on non-normal returns (option selling, carry, short-vol)
                </td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Sortino</td>
                <td className="px-4 py-3">
                  Strategies with asymmetric returns (trend, long-vol, crisis alpha)
                </td>
                <td className="px-4 py-3">
                  Always higher than Sharpe — not directly comparable across managers
                </td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Calmar</td>
                <td className="px-4 py-3">
                  Capital allocation / risk-of-ruin / surviving real drawdowns
                </td>
                <td className="px-4 py-3">
                  Sensitive to one bad period — looks bad after a recent drawdown
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Sophisticated allocators report{' '}
          <strong className="text-slate-200">all three</strong>. Using just one in isolation almost
          always misleads.
        </p>
      </section>

      {/* Long-form body */}
      <article className="prose-soft">
        <h2>What each metric actually measures</h2>
        <p>
          All three answer the same question — &quot;how much return did this strategy generate per
          unit of risk?&quot; — but they disagree about what counts as risk. That disagreement is
          the entire reason multiple metrics exist.
        </p>

        <h3>Sharpe: volatility is risk</h3>
        <p>
          <code>Sharpe = (mean return − risk-free rate) / standard deviation of returns</code>
        </p>
        <p>
          The Sharpe ratio (Sharpe, 1966) treats <em>any</em> deviation from the mean as risk —
          including upside surprises. A strategy that returned +30% one month and +5% the next is
          penalized for the same total &quot;volatility&quot; as one that returned +5% and -20%.
          That matches the idea of risk used in mean-variance portfolio theory and CAPM, but it
          doesn&apos;t match how investors actually feel risk.
        </p>

        <h3>Sortino: only downside is risk</h3>
        <p>
          <code>
            Sortino = (mean return − target) / downside deviation (returns below target only)
          </code>
        </p>
        <p>
          The Sortino ratio (Sortino &amp; Price, 1994) fixes the symmetry problem. It only counts
          returns that fall below a target threshold (usually zero or the risk-free rate) toward
          the denominator. Upside volatility is no longer penalized. This matches the intuition
          that big winning months are not risk — they&apos;re the point.
        </p>

        <h3>Calmar: peak-to-trough loss is risk</h3>
        <p>
          <code>Calmar = annualized return / |maximum drawdown|</code>
        </p>
        <p>
          The Calmar ratio (Young, 1991) goes further: it doesn&apos;t care about the shape of the
          return distribution at all. It cares about one number — the worst peak-to-trough loss
          ever observed. This matches the practical question allocators ask:{' '}
          <em>&quot;What is the worst experience this strategy has put investors through?&quot;</em>
        </p>

        <h2>A concrete example: three strategies, three winners</h2>
        <p>
          Imagine three hypothetical strategies, each running for 5 years with the same average
          annualized return of 12%:
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-3 py-2">Strategy</th>
                <th className="px-3 py-2">Profile</th>
                <th className="px-3 py-2">Vol</th>
                <th className="px-3 py-2">Max DD</th>
                <th className="px-3 py-2">Sharpe</th>
                <th className="px-3 py-2">Sortino</th>
                <th className="px-3 py-2">Calmar</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">A. Carry</td>
                <td className="px-3 py-2">Smooth → one blowup</td>
                <td className="px-3 py-2">8%</td>
                <td className="px-3 py-2">35%</td>
                <td className="px-3 py-2 text-chart-gain">1.50</td>
                <td className="px-3 py-2">2.10</td>
                <td className="px-3 py-2 text-chart-loss">0.34</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">B. Long-only equity</td>
                <td className="px-3 py-2">Normal-ish</td>
                <td className="px-3 py-2">15%</td>
                <td className="px-3 py-2">25%</td>
                <td className="px-3 py-2">0.80</td>
                <td className="px-3 py-2">1.10</td>
                <td className="px-3 py-2">0.48</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">C. Trend-following</td>
                <td className="px-3 py-2">Big wins, small losses</td>
                <td className="px-3 py-2">18%</td>
                <td className="px-3 py-2">12%</td>
                <td className="px-3 py-2">0.67</td>
                <td className="px-3 py-2 text-chart-gain">1.45</td>
                <td className="px-3 py-2 text-chart-gain">1.00</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          By <strong>Sharpe</strong>, Strategy A (carry) looks best at 1.50. By{' '}
          <strong>Sortino</strong>, A is still best at 2.10 — but B and C close the gap. By{' '}
          <strong>Calmar</strong>, the ranking <em>inverts</em>: A is worst (0.34) and C is best
          (1.00).
        </p>
        <p>
          Same returns, same period, three different recommended strategies. The metric you pick
          determines the answer. That&apos;s why allocators report all three.
        </p>

        <h2>When each one lies</h2>

        <h3>Sharpe lies on non-normal returns</h3>
        <p>
          Sharpe assumes returns are roughly normal. They&apos;re not, for most real strategies.
          Three pathological cases:
        </p>
        <ul>
          <li>
            <strong>Negative skew</strong> (option selling, carry trades, short-volatility): the
            strategy has many small wins and rare large losses. Until a tail event hits, Sharpe
            looks great. Then it doesn&apos;t.
          </li>
          <li>
            <strong>Fat tails</strong> (high kurtosis): the strategy occasionally has moves much
            larger than the normal distribution would predict. Sharpe under-estimates the risk
            because standard deviation under-weights tail observations.
          </li>
          <li>
            <strong>Short sample sizes</strong>: with fewer than ~30 monthly observations, the
            sample Sharpe has a wide confidence interval. A 6-month strategy with Sharpe 3.0
            could really be anywhere from -1 to +5. The{' '}
            <Link href="/probabilistic-sharpe-ratio-calculator" className="text-accent">
              probabilistic Sharpe ratio
            </Link>{' '}
            corrects for this explicitly.
          </li>
        </ul>

        <h3>Sortino lies by always looking better than Sharpe</h3>
        <p>
          Sortino mechanically produces a higher number than Sharpe (for the same strategy) because
          the denominator is smaller. The ratio of Sortino to Sharpe is typically 1.3-1.7x.
          That&apos;s not a feature — it just means you can&apos;t directly compare a Sortino from
          one fund to a Sharpe from another. Apples-to-apples comparison requires using the same
          metric.
        </p>
        <p>
          Sortino also still uses a denominator computed from past observations. A strategy that
          had no big down months in-sample will have an artificially small downside deviation and
          therefore a sky-high Sortino. Recent crisis-alpha strategies (long-vol, tail hedges) can
          look terrible by Sortino during calm regimes for exactly this reason — they bleed
          steadily with no large up months either.
        </p>

        <h3>Calmar is dominated by one data point</h3>
        <p>
          Calmar&apos;s denominator is the single worst drawdown. That means it can change overnight
          if a new worst-ever drawdown happens. A strategy with a 5-year track record and Calmar
          1.5 can drop to Calmar 0.6 after one bad quarter. It also means a strategy that{' '}
          <em>happens not to have experienced a drawdown yet</em> (because it&apos;s only 18
          months old, or because the regime has been favorable) will show an inflated Calmar.
        </p>
        <p>
          Calmar also doesn&apos;t care how <em>frequently</em> drawdowns happen. A strategy with
          one big drawdown and three years of recovery scores the same as a strategy that
          experiences the same drawdown depth annually. Some practitioners use the{' '}
          <strong>average drawdown</strong> (Pain Index) alongside Calmar to fix this.
        </p>

        <h2>What good values look like</h2>
        <p>
          Rough ranges for what&apos;s acceptable in different contexts. Annualized, after fees,
          computed on at least 3 years of monthly returns:
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-3 py-2">Strategy class</th>
                <th className="px-3 py-2">Good Sharpe</th>
                <th className="px-3 py-2">Good Sortino</th>
                <th className="px-3 py-2">Good Calmar</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Long-only equity</td>
                <td className="px-3 py-2">0.5 – 0.8</td>
                <td className="px-3 py-2">0.7 – 1.2</td>
                <td className="px-3 py-2">0.3 – 0.6</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">60/40 balanced</td>
                <td className="px-3 py-2">0.6 – 1.0</td>
                <td className="px-3 py-2">0.9 – 1.4</td>
                <td className="px-3 py-2">0.5 – 0.9</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Hedge fund (typical)</td>
                <td className="px-3 py-2">0.8 – 1.5</td>
                <td className="px-3 py-2">1.2 – 2.0</td>
                <td className="px-3 py-2">0.7 – 1.5</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Quant CTA / trend</td>
                <td className="px-3 py-2">0.6 – 1.2</td>
                <td className="px-3 py-2">1.0 – 2.0</td>
                <td className="px-3 py-2">0.5 – 1.5</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Market-neutral</td>
                <td className="px-3 py-2">1.0 – 2.0</td>
                <td className="px-3 py-2">1.5 – 2.5</td>
                <td className="px-3 py-2">1.0 – 3.0</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Crypto strategy</td>
                <td className="px-3 py-2">0.5 – 1.5</td>
                <td className="px-3 py-2">0.8 – 1.8</td>
                <td className="px-3 py-2">0.3 – 1.0</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">
          Sharpe above 3.0 on a multi-year sample is rare and usually indicates a data error,
          look-ahead bias, or unaccounted-for transaction costs. Worth scrutinizing before
          allocating to.
        </p>

        <h2>The decision rule (use this, save the rest for context)</h2>
        <ol>
          <li>
            <strong>Always compute Sharpe</strong>. It&apos;s the industry default and the only
            metric an LP will compare to other managers without conversion. Use the{' '}
            <Link href="/sharpe-ratio-calculator" className="text-accent">
              Sharpe ratio calculator
            </Link>{' '}
            (with its 95% confidence interval) — and run the{' '}
            <Link href="/probabilistic-sharpe-ratio-calculator" className="text-accent">
              probabilistic Sharpe ratio
            </Link>{' '}
            to check whether the number is statistically meaningful.
          </li>
          <li>
            <strong>If the strategy has skewed returns, also compute Sortino</strong>. Skew{' '}
            &lt; -0.5 or &gt; +0.5 is enough to make Sharpe misleading. The PSR output gives you
            skewness as a free side-effect; check it.
          </li>
          <li>
            <strong>Always compute Calmar before allocating capital</strong>. The{' '}
            <Link href="/drawdown-calculator" className="text-accent">
              drawdown calculator
            </Link>{' '}
            gives you max drawdown, which is the Calmar denominator. If the strategy hasn&apos;t
            had a drawdown yet (under-2-year track records), assume Calmar will be lower than the
            backtest suggests.
          </li>
          <li>
            <strong>Report all three in your tearsheet</strong>. Putting just one number in front of
            an allocator who knows finance is a red flag. Putting all three with one-sentence
            interpretations is what a competent shop does.
          </li>
        </ol>

        <h2>Related calculators</h2>
        <ul>
          <li>
            <Link href="/sharpe-ratio-calculator" className="text-accent">
              Sharpe Ratio Calculator
            </Link>{' '}
            — Sharpe with a 95% confidence interval (most calculators omit the CI; it matters a
            lot for short samples)
          </li>
          <li>
            <Link href="/probabilistic-sharpe-ratio-calculator" className="text-accent">
              Probabilistic Sharpe Ratio Calculator
            </Link>{' '}
            — Lopez de Prado 2012 PSR adjusting for sample size, skew, and kurtosis
          </li>
          <li>
            <Link href="/drawdown-calculator" className="text-accent">
              Drawdown Calculator
            </Link>{' '}
            — max drawdown (the Calmar denominator), average drawdown, recovery time
          </li>
          <li>
            <Link href="/value-at-risk-calculator" className="text-accent">
              Value at Risk Calculator
            </Link>{' '}
            — parametric and historical VaR + CVaR for the same return series
          </li>
          <li>
            <Link href="/monte-carlo-simulation-calculator" className="text-accent">
              Monte Carlo Simulation Calculator
            </Link>{' '}
            — forward-projects Calmar by simulating thousands of return paths
          </li>
        </ul>

        <h2>References</h2>
        <ul className="text-sm">
          <li>Sharpe, W. F. (1966). &quot;Mutual fund performance.&quot; Journal of Business 39, 119-138.</li>
          <li>
            Sortino, F. &amp; Price, L. (1994). &quot;Performance measurement in a downside risk
            framework.&quot; Journal of Investing 3(3), 59-64.
          </li>
          <li>
            Young, T. (1991). &quot;Calmar ratio: A smoother tool.&quot; Futures Magazine.
          </li>
          <li>
            Bailey, D. H. &amp; Lopez de Prado, M. (2012). &quot;The Sharpe ratio efficient
            frontier.&quot; Journal of Risk 15(1).
          </li>
          <li>
            Magdon-Ismail, M. &amp; Atiya, A. (2004). &quot;Maximum drawdown.&quot; Risk Magazine,
            October.
          </li>
        </ul>
      </article>

      {/* Sponsored slot — single placement at article end so editorial flow
          isn't broken. Per-article aff_sub for conversion tracking. */}
      <div className="mt-12">
        <AffiliateCta subId="compare-sharpe-vs-sortino-vs-calmar" category="compare" />
      </div>

      {/* FAQ */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">Frequently asked questions</h2>
        <Faq items={faqs} />
      </section>

      {/* JSON-LD: Article + FAQPage + BreadcrumbList in a single @graph */}
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
