import Link from 'next/link';
import { Faq } from '@/components/FAQ';
import { CompareRelated } from '@/components/CompareRelated';
import { AffiliateCta } from '@/components/AffiliateCta';
import { buildMetadata, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/compare/sharpe-vs-information-ratio-vs-treynor',
  title: 'Sharpe vs Information Ratio vs Treynor: Three Risk-Adjusted Return Metrics',
  description:
    'Sharpe scales return by total volatility. Information Ratio scales benchmark-relative return by tracking error. Treynor scales return by beta. Each is right for a different question — and getting it wrong means crediting (or dismissing) a strategy for the wrong reason.',
  keywords: [
    'sharpe vs information ratio',
    'information ratio vs treynor',
    'risk adjusted return metrics',
    'sharpe vs treynor',
    'active management metrics',
    'tracking error vs beta',
  ],
});

const LAST_UPDATED = 'May 15, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline:
    'Sharpe vs Information Ratio vs Treynor: Three Risk-Adjusted Return Metrics That Look Similar But Aren&apos;t',
  description:
    'Three risk-adjusted return metrics that look similar but answer fundamentally different questions. When each is right, when each lies, what good values look like, and which one allocators actually use.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-05-15',
  dateModified: '2026-05-15',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/compare/sharpe-vs-information-ratio-vs-treynor',
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
      name: 'Sharpe vs Information Ratio vs Treynor',
      item: 'https://quantoracle.dev/compare/sharpe-vs-information-ratio-vs-treynor',
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
        / Sharpe vs Information Ratio vs Treynor
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Sharpe vs Information Ratio vs Treynor: Three Risk-Adjusted Return Metrics
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          Three numbers that all claim to measure &quot;return per unit of risk&quot; — and all
          mean different things. The same strategy can look great on Sharpe and mediocre on
          Information Ratio. A position can look terrible on Sharpe and excellent on Treynor.
          Picking the wrong one means crediting a strategy for the wrong reason.
        </p>
        <p className="mt-3 text-xs text-slate-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft">
        <h2 id="short-answer">The 30-second decision rule</h2>
        <ul>
          <li>
            <strong>&quot;Is this strategy worth holding by itself?&quot;</strong> → Sharpe.
            Total return per unit of total volatility.
          </li>
          <li>
            <strong>&quot;Is this active manager beating their benchmark efficiently?&quot;</strong>{' '}
            → Information Ratio. Benchmark-relative return per unit of tracking error.
          </li>
          <li>
            <strong>&quot;Is this position adding value in a diversified portfolio?&quot;</strong>{' '}
            → Treynor. Excess return per unit of beta (systematic risk only).
          </li>
        </ul>

        <h2 id="side-by-side">Side-by-side</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">Metric</th>
                <th className="text-left p-2">Sharpe</th>
                <th className="text-left p-2">Information Ratio</th>
                <th className="text-left p-2">Treynor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2">Numerator</td>
                <td className="p-2">r_p − r_f</td>
                <td className="p-2">r_p − r_b</td>
                <td className="p-2">r_p − r_f</td>
              </tr>
              <tr>
                <td className="p-2">Denominator</td>
                <td className="p-2">σ_p (total vol)</td>
                <td className="p-2">σ(r_p − r_b) (tracking error)</td>
                <td className="p-2">β_p (beta)</td>
              </tr>
              <tr>
                <td className="p-2">Risk being penalized</td>
                <td className="p-2">All volatility</td>
                <td className="p-2">Active-bet volatility</td>
                <td className="p-2">Systematic only</td>
              </tr>
              <tr>
                <td className="p-2">Right when…</td>
                <td className="p-2">Held stand-alone</td>
                <td className="p-2">Compared to benchmark</td>
                <td className="p-2">Part of diversified portfolio</td>
              </tr>
              <tr>
                <td className="p-2">&quot;Good&quot; value</td>
                <td className="p-2">1.0+ (2.0 excellent)</td>
                <td className="p-2">0.5+ (1.0 exceptional)</td>
                <td className="p-2">Match the market&apos;s</td>
              </tr>
              <tr>
                <td className="p-2">Penalty for benchmark-hugging</td>
                <td className="p-2">None — could match index</td>
                <td className="p-2">Severe — near zero</td>
                <td className="p-2">None directly</td>
              </tr>
              <tr>
                <td className="p-2">Penalty for idiosyncratic risk</td>
                <td className="p-2">Full</td>
                <td className="p-2">Full</td>
                <td className="p-2">None (assumed diversified away)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="sharpe">Sharpe ratio — the universal default</h2>
        <p>
          The Sharpe ratio (William Sharpe, 1966) is the most widely-used risk-adjusted return
          metric. The formula:
        </p>
        <pre>
          <code>{`Sharpe = (r_p - r_f) / σ_p`}</code>
        </pre>
        <ul>
          <li>
            <strong>r_p</strong> = portfolio return (annualized)
          </li>
          <li>
            <strong>r_f</strong> = risk-free rate (typically 3-month T-bill or SOFR)
          </li>
          <li>
            <strong>σ_p</strong> = standard deviation of portfolio returns (annualized)
          </li>
        </ul>
        <p>
          The numerator measures excess return — how much you earned above just sitting in cash.
          The denominator measures total volatility — every wiggle of your equity curve, whether
          it came from your own positioning or just being long the market.
        </p>
        <p>
          Sharpe is the right metric when you&apos;re evaluating a strategy as a stand-alone
          investment. The classic use cases: a hedge fund LP comparing two managers offered as
          replacements for cash, a retail investor picking between two ETFs, a quant comparing
          backtested strategies in isolation.
        </p>
        <p>
          Where Sharpe lies: it cannot tell whether a manager is beating their benchmark by
          skill or simply holding the benchmark with leverage. A long-only equity manager at 95%
          beta to S&P 500 will have almost exactly the index&apos;s Sharpe, because the
          index volatility dominates the manager volatility. The Sharpe ratio doesn&apos;t care
          where the volatility comes from.
        </p>

        <h2 id="ir">Information Ratio — the active-management metric</h2>
        <p>
          Information Ratio (IR) is what allocators actually use to evaluate active managers:
        </p>
        <pre>
          <code>{`IR = (r_p - r_b) / σ(r_p - r_b)`}</code>
        </pre>
        <ul>
          <li>
            <strong>r_p − r_b</strong> = active return (excess over benchmark, annualized)
          </li>
          <li>
            <strong>σ(r_p − r_b)</strong> = tracking error — the std deviation of the active
            return series (annualized)
          </li>
        </ul>
        <p>
          The crucial move: instead of comparing to cash, IR compares the portfolio to its
          declared benchmark. Instead of penalizing total volatility, IR penalizes only the
          volatility of the <em>active bets</em>. A manager who runs 100% S&P 500 with no
          deviations has an IR of zero — there is no active return to scale, no matter how
          high their absolute Sharpe.
        </p>
        <p>
          This is exactly the question an LP cares about: &quot;If I&apos;m paying for active
          management, is the manager actually doing active management efficiently?&quot; A
          manager with IR = 0.5 is genuinely adding alpha to the benchmark. A manager with the
          same Sharpe as the benchmark but IR = 0.05 is selling index exposure at active prices.
        </p>
        <p>
          Where IR lies: it assumes the benchmark is the right reference. A small-cap manager
          benchmarked to large-cap will look brilliant on IR for cap reasons, not skill. A
          long/short fund benchmarked to cash will look brilliant because tracking error is
          effectively just the fund&apos;s standalone volatility. Always check what benchmark
          IR is computed against, and whether that benchmark genuinely represents the
          investable alternative.
        </p>

        <h2 id="treynor">Treynor ratio — the diversified-portfolio metric</h2>
        <p>
          The Treynor ratio (Jack Treynor, 1965) scales excess return by beta instead of total
          volatility:
        </p>
        <pre>
          <code>{`Treynor = (r_p - r_f) / β_p`}</code>
        </pre>
        <p>
          Where β_p is the portfolio&apos;s beta to the market — the slope from regressing
          portfolio excess returns on market excess returns. Beta measures only systematic
          risk; the idiosyncratic part is assumed to be diversified away in the larger
          portfolio.
        </p>
        <p>
          The intuition: if you&apos;re adding a position to an already-diversified portfolio,
          its standalone volatility doesn&apos;t matter — only the part that survives
          diversification (the beta exposure) actually contributes risk to your combined book.
          A single biotech stock might look terrible on Sharpe because of high idiosyncratic
          volatility, but be a perfectly reasonable 2% portfolio position if its beta is
          moderate.
        </p>
        <p>
          Treynor is the CAPM-native metric. In equilibrium, every asset&apos;s Treynor ratio
          should equal the market&apos;s Treynor ratio; deviations represent alpha. It&apos;s
          the standard ratio in risk-budgeting frameworks at institutional asset managers and
          insurance company general accounts where everything is held in a much bigger pool.
        </p>
        <p>
          Where Treynor lies: when the position isn&apos;t actually being held in a diversified
          portfolio. A retail investor putting 50% of their net worth into one tech stock
          cannot count on idiosyncratic risk diversifying away — for them, Sharpe is the right
          metric. Also: beta estimates are noisy (point estimate ±0.1-0.2 from sampling noise
          alone), so small differences in Treynor ratios should not drive allocation decisions.
        </p>

        <h2 id="example">Worked example: the same strategy under three lenses</h2>
        <p>
          Consider a long-only US equity manager with these annualized statistics:
        </p>
        <ul>
          <li>Portfolio return: 12%</li>
          <li>Benchmark (S&P 500) return: 10%</li>
          <li>Risk-free rate: 4%</li>
          <li>Portfolio volatility: 16%</li>
          <li>Tracking error: 4%</li>
          <li>Beta to S&P 500: 1.05</li>
        </ul>
        <ul>
          <li>
            <strong>Sharpe</strong> = (12% − 4%) / 16% = <strong>0.50</strong> — looks
            comparable to the S&P 500 itself (also around 0.4-0.5 historically).
          </li>
          <li>
            <strong>Information Ratio</strong> = (12% − 10%) / 4% = <strong>0.50</strong> —
            this is genuine, sustained alpha for an equity manager. LPs would consider this
            very good.
          </li>
          <li>
            <strong>Treynor</strong> = (12% − 4%) / 1.05 = <strong>7.6%</strong> per unit of
            beta. The market&apos;s Treynor is (10% − 4%) / 1.0 = 6.0%, so this manager
            adds about 1.6% per unit of beta over the market — that&apos;s alpha.
          </li>
        </ul>
        <p>
          Same strategy. Three numbers. Sharpe says &quot;okay, similar to the index.&quot; IR
          says &quot;genuinely good active manager.&quot; Treynor says &quot;adding alpha per
          unit of systematic risk.&quot; All three are technically correct; they just answer
          different questions about the same returns.
        </p>

        <h2 id="when">Which one does an allocator actually use?</h2>
        <p>
          In practice, allocators compute all three and check that they tell a consistent
          story. A manager with high Sharpe but low IR is selling index exposure; the
          conversation gets harder. A manager with low Sharpe but high IR is a high-tracking-
          error strategy that still adds genuine value relative to benchmark — the IR justifies
          the fees.
        </p>
        <p>
          The honest practitioner reports all three. Mutual fund prospectuses are required to
          report Sharpe but rarely do IR voluntarily because most active managers don&apos;t
          beat their benchmarks on a tracking-error-adjusted basis. Hedge funds quote both
          because they want to show absolute performance (Sharpe) and skill-relative-to-
          benchmark (IR). Pension funds compute Treynor for their factor-based portfolios.
        </p>

        <h2 id="related">Related calculators and articles</h2>
        <ul>
          <li>
            <Link href="/sharpe-ratio-calculator" className="text-accent">
              Sharpe Ratio Calculator
            </Link>{' '}
            — standalone Sharpe with Lo (2002) confidence intervals
          </li>
          <li>
            <Link href="/probabilistic-sharpe-ratio-calculator" className="text-accent">
              Probabilistic Sharpe Ratio Calculator
            </Link>{' '}
            — is the observed Sharpe statistically significant given skew + kurtosis?
          </li>
          <li>
            <Link href="/compare/sharpe-vs-sortino-vs-calmar" className="text-accent">
              Sharpe vs Sortino vs Calmar
            </Link>{' '}
            — three risk-adjusted metrics that emphasize different aspects of risk
          </li>
          <li>
            <Link href="/value-at-risk-calculator" className="text-accent">
              Value at Risk Calculator
            </Link>{' '}
            — parametric and historical VaR for the same return series
          </li>
          <li>
            <Link href="/drawdown-calculator" className="text-accent">
              Drawdown Calculator
            </Link>{' '}
            — the metric investors actually feel
          </li>
        </ul>

        <h2 id="references">References</h2>
        <ul className="text-sm">
          <li>
            Sharpe, W. F. (1966). &quot;Mutual fund performance.&quot; Journal of Business
            39(1), 119-138. — original Sharpe ratio paper.
          </li>
          <li>
            Treynor, J. L. (1965). &quot;How to rate management of investment funds.&quot;
            Harvard Business Review 43(1), 63-75.
          </li>
          <li>
            Goodwin, T. H. (1998). &quot;The Information Ratio.&quot; Financial Analysts
            Journal 54(4), 34-43. — IR as the right metric for active management.
          </li>
          <li>
            Grinold, R. C. &amp; Kahn, R. N. (1999). &quot;Active Portfolio Management.&quot;
            McGraw-Hill. — the bible of information-ratio-based active management.
          </li>
          <li>
            Lo, A. W. (2002). &quot;The statistics of Sharpe ratios.&quot; Financial Analysts
            Journal 58(4), 36-52. — sampling distribution of Sharpe estimates.
          </li>
        </ul>
      </article>

      <div className="mt-12">
        <AffiliateCta subId="compare-sharpe-vs-ir-vs-treynor" category="compare" />
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">Frequently asked questions</h2>
        <Faq items={faqs} />
      </section>

      <CompareRelated slug="sharpe-vs-information-ratio-vs-treynor" />

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
