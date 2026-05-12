import Link from 'next/link';
import { Faq } from '@/components/FAQ';
import { buildMetadata, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/compare/kelly-vs-fixed-fractional-vs-optimal-f',
  title: 'Kelly vs Fixed Fractional vs Optimal-f: Which Position Sizing Method?',
  description:
    'The three position-sizing methods every systematic trader needs to know. Formulas, when each one over-bets, what real fund managers actually use, and the half-Kelly trick.',
  keywords: [
    'kelly criterion vs fixed fractional',
    'optimal f vs kelly',
    'position sizing methods compared',
    'half kelly',
    'kelly criterion calculator',
    'fixed fractional position sizing',
  ],
});

const LAST_UPDATED = 'May 11, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Kelly vs Fixed Fractional vs Optimal-f: Which Position Sizing Method?',
  description:
    'A practitioner comparison of Kelly, fixed-fractional, and Optimal-f position sizing — formulas, edge cases, and the half-Kelly trick that almost everyone actually uses.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-05-11',
  dateModified: '2026-05-11',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/compare/kelly-vs-fixed-fractional-vs-optimal-f',
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
      name: 'Kelly vs Fixed Fractional vs Optimal-f',
      item: 'https://quantoracle.dev/compare/kelly-vs-fixed-fractional-vs-optimal-f',
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
        / Kelly vs Fixed Fractional vs Optimal-f
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Kelly vs Fixed Fractional vs Optimal-f: Which Position Sizing Method Should You Use?
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          Three sizing methods with wildly different aggressiveness profiles. The right choice
          depends on how confident you are in your edge estimate — and most traders aren&apos;t as
          confident as they think.
        </p>
        <p className="mt-3 text-xs text-slate-500">Last updated: {LAST_UPDATED}</p>
      </header>

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
                <td className="px-4 py-3 font-medium text-slate-100">Fixed-fractional</td>
                <td className="px-4 py-3">
                  Discretionary trading / untested system / unknown edge
                </td>
                <td className="px-4 py-3">Doesn&apos;t optimize growth; capped upside</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Half-Kelly</td>
                <td className="px-4 py-3">
                  Systematic strategy with 200+ trades and stable edge
                </td>
                <td className="px-4 py-3">
                  Still drawdown-heavy if edge is overestimated
                </td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Full Kelly</td>
                <td className="px-4 py-3">
                  Theoretical analysis / closed-form derivations only
                </td>
                <td className="px-4 py-3">
                  30-50% drawdowns are normal even with correct inputs
                </td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Optimal-f</td>
                <td className="px-4 py-3">
                  Almost never — best used to sanity-check Kelly
                </td>
                <td className="px-4 py-3">
                  Anchors on one extreme observation; usually over-bets
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          The honest answer: most traders should use <strong className="text-slate-200">fixed-fractional</strong>{' '}
          at 1-2% risk per trade. The math of full Kelly assumes things you don&apos;t actually
          have.
        </p>
      </section>

      <article className="prose-soft">
        <h2>What each method optimizes</h2>
        <p>
          Position sizing has one job: decide how much of your account to put at risk on each
          trade. The three methods below answer the same question but with different objectives.
          The objective you pick determines how aggressive the answer is.
        </p>

        <h3>Fixed-fractional: bound the worst case</h3>
        <p>
          <code>position size = (account × risk_pct) / |entry − stop|</code>
        </p>
        <p>
          Fixed-fractional risks a constant percentage of equity per trade — usually 1% to 2%, the
          &quot;1% rule&quot; popularized by Van Tharp. It does not optimize anything in particular;
          it just guarantees that no single loss exceeds the fraction you chose. Over time the
          account compounds because the dollar risk scales with equity. Simple, robust, predictable
          drawdown behavior.
        </p>

        <h3>Kelly: maximize the long-run growth rate</h3>
        <p>
          <code>f* = (p · b − q) / b</code> (discrete) &nbsp;or&nbsp; <code>f* = μ / σ²</code> (continuous)
        </p>
        <p>
          Kelly (J. L. Kelly Jr., Bell System Technical Journal, 1956) is the fraction that
          maximizes the expected logarithm of wealth — equivalent to maximizing the long-run
          geometric growth rate of the account. It is provably optimal in the limit of infinite
          trials. The path to that infinity includes drawdowns that most investors cannot stomach.
        </p>

        <h3>Optimal-f: maximize terminal wealth assuming worst-case bound</h3>
        <p>
          <code>find f that maximizes Σ ln(1 + f · return_i / |worst_loss|)</code>
        </p>
        <p>
          Optimal-f (Ralph Vince, &quot;Portfolio Management Formulas&quot;, 1990) finds the bet
          size that maximizes terminal wealth, anchoring on the worst single loss in your sample.
          It is essentially Kelly recast to use one extreme observation rather than a distribution.
          Usually more aggressive than Kelly. Dangerous because you&apos;re betting that the worst
          loss in your sample is actually the worst possible loss. It almost never is.
        </p>

        <h2>A concrete example: 55% win rate, 1.5:1 payoff</h2>
        <p>
          A strategy wins 55% of the time. Average win is $150, average loss is $100 (1.5:1
          payoff ratio). Worst single loss in 500 historical trades was $400. What does each
          method recommend for a $100,000 account?
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Risk per trade</th>
                <th className="px-3 py-2">Position size (% of $100K)</th>
                <th className="px-3 py-2">Expected drawdown</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">Fixed-fractional (1%)</td>
                <td className="px-3 py-2">$1,000</td>
                <td className="px-3 py-2">10× position with $100 stop</td>
                <td className="px-3 py-2">~10-15%</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">Fixed-fractional (2%)</td>
                <td className="px-3 py-2">$2,000</td>
                <td className="px-3 py-2">20× position with $100 stop</td>
                <td className="px-3 py-2">~20-30%</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">Half-Kelly</td>
                <td className="px-3 py-2">~$12,500</td>
                <td className="px-3 py-2">12.5% of account</td>
                <td className="px-3 py-2">~25-35%</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">Full Kelly</td>
                <td className="px-3 py-2 text-chart-loss">~$25,000</td>
                <td className="px-3 py-2 text-chart-loss">25% of account</td>
                <td className="px-3 py-2 text-chart-loss">~45-60%</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">Optimal-f (worst=$400)</td>
                <td className="px-3 py-2 text-chart-loss">~$32,000</td>
                <td className="px-3 py-2 text-chart-loss">32% of account</td>
                <td className="px-3 py-2 text-chart-loss">~55-70%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Same strategy, dramatically different bet sizes. Kelly says bet 25% of the account on a
          trade with 55% win probability. That feels insane to most traders — and it should,
          because it is, unless your edge estimate is perfect. Which it is not.
        </p>

        <h2>When each one over-bets (and how badly)</h2>

        <h3>Full Kelly: doubles risk when edge is overestimated 20%</h3>
        <p>
          Kelly is optimal when your edge estimate is exactly right. The relationship between
          estimation error and over-bet is convex:
        </p>
        <ul>
          <li>Edge overestimated by 10% → Kelly over-bets by ~20%, growth rate halved</li>
          <li>Edge overestimated by 20% → Kelly over-bets by ~44%, growth rate goes to zero</li>
          <li>Edge overestimated by 30% → growth rate becomes <strong>negative</strong></li>
        </ul>
        <p>
          Most retail strategies overestimate edge by 30-50% due to overfitting, survivorship
          bias, and look-ahead bias in backtests. Plugging an overestimated edge into Kelly is a
          fast way to lose money fast.
        </p>

        <h3>Half-Kelly: the practical compromise</h3>
        <p>
          Half-Kelly (50% of full Kelly fraction) captures about 75% of the long-run growth
          advantage with about a quarter of the drawdown. The math: long-run growth rate is
          quadratic around the optimum, so deviating by 50% from optimal sacrifices much less
          than 50% of the growth.
        </p>
        <p>
          Most quant funds with stable edge use half-Kelly or quarter-Kelly at the strategy level.
          Renaissance Technologies famously sizes at fractional Kelly, never full. If they
          don&apos;t trust their own edge estimates that much, you shouldn&apos;t either.
        </p>

        <h3>Optimal-f: anchored on one observation</h3>
        <p>
          Optimal-f&apos;s denominator is the single worst historical loss. If the actual worst
          possible loss is 2x what your sample contains — and tail observations are routinely
          larger than sample maxes — Optimal-f recommends a bet that is too big by exactly that
          factor. When the new worst loss arrives, the over-bet eats the entire account.
        </p>
        <p>
          A common Optimal-f failure mode: the strategy ran in a calm regime for 18 months, the
          worst loss in sample was 1%, Optimal-f sized at 30% of account per trade. The first
          regime change brought a 3% loss. Account down 90%. This pattern shows up in retail
          trading forums every few years.
        </p>

        <h2>The half-Kelly trick (why almost everyone uses it)</h2>
        <p>
          Half-Kelly (f = 0.5 · f*) is the de facto industry standard for systematic strategies.
          The reasons:
        </p>
        <ol>
          <li>
            <strong>Robust to estimation error</strong>. If your edge estimate is 20% too high,
            half-Kelly is still safely sub-optimal rather than catastrophically over-betting.
          </li>
          <li>
            <strong>Captures most of the growth</strong>. Geometric growth is concave around the
            Kelly optimum — losing 50% of position size sacrifices only ~25% of long-run growth.
          </li>
          <li>
            <strong>Much smaller drawdowns</strong>. Full Kelly typically has 50%+ drawdowns;
            half-Kelly typically has 25-30%. The psychological difference is enormous.
          </li>
          <li>
            <strong>Survivorship</strong>. The trader who size with half-Kelly is still trading
            after a year. The trader who used full Kelly may not be.
          </li>
        </ol>
        <p>
          Some shops go further to quarter-Kelly (0.25 · f*) for strategies with shorter live
          history, less confidence in the input distribution, or higher fat-tail risk. The
          QuantOracle{' '}
          <Link href="/kelly-criterion-calculator" className="text-accent">
            Kelly Criterion Calculator
          </Link>{' '}
          shows full, half, and quarter-Kelly side by side for exactly this reason.
        </p>

        <h2>The decision rule</h2>
        <ol>
          <li>
            <strong>Discretionary trader or untested system</strong> → fixed-fractional 1-2% per
            trade. Use the{' '}
            <Link href="/position-size-calculator" className="text-accent">
              position size calculator
            </Link>
            . Don&apos;t complicate it.
          </li>
          <li>
            <strong>Systematic strategy with 200+ live trades and Sharpe &gt; 1.0</strong> →
            half-Kelly at the strategy level. Use the{' '}
            <Link href="/kelly-criterion-calculator" className="text-accent">
              Kelly criterion calculator
            </Link>{' '}
            to find f*, then bet 0.5·f*.
          </li>
          <li>
            <strong>Portfolio of multiple uncorrelated strategies</strong> → compute Kelly per
            strategy, then scale all strategies by a single fractional-Kelly multiplier so the
            aggregate gross exposure stays bounded.
          </li>
          <li>
            <strong>You&apos;re not sure about your edge</strong> → fixed-fractional. Default to
            robust. Move to Kelly only after live evidence justifies the upgrade.
          </li>
        </ol>

        <h2>Related calculators</h2>
        <ul>
          <li>
            <Link href="/kelly-criterion-calculator" className="text-accent">
              Kelly Criterion Calculator
            </Link>{' '}
            — full / half / quarter-Kelly fractions for any win rate and payoff
          </li>
          <li>
            <Link href="/position-size-calculator" className="text-accent">
              Position Size Calculator
            </Link>{' '}
            — fixed-fractional sizing given account, risk %, entry, and stop
          </li>
          <li>
            <Link href="/drawdown-calculator" className="text-accent">
              Drawdown Calculator
            </Link>{' '}
            — verify your sizing choice against historical drawdown
          </li>
          <li>
            <Link href="/monte-carlo-simulation-calculator" className="text-accent">
              Monte Carlo Simulation Calculator
            </Link>{' '}
            — simulate the path distribution at different position sizes before committing
          </li>
        </ul>

        <h2>References</h2>
        <ul className="text-sm">
          <li>
            Kelly Jr., J. L. (1956). &quot;A new interpretation of information rate.&quot; Bell
            System Technical Journal, 35(4), 917-926.
          </li>
          <li>
            Thorp, E. O. (1962). &quot;Beat the Dealer.&quot; Random House. — first practical
            application of Kelly.
          </li>
          <li>
            Vince, R. (1990). &quot;Portfolio Management Formulas.&quot; John Wiley &amp; Sons. —
            Optimal-f introduction.
          </li>
          <li>
            Van Tharp, V. K. (1998). &quot;Trade Your Way to Financial Freedom.&quot; McGraw-Hill.
            — popularized the 1% rule for fixed-fractional sizing.
          </li>
          <li>
            MacLean, L. C., Thorp, E. O., &amp; Ziemba, W. T. (2010). &quot;The Kelly Capital
            Growth Investment Criterion.&quot; World Scientific. — survey of fractional-Kelly
            practice.
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
