import Link from 'next/link';
import { Faq } from '@/components/FAQ';
import { AffiliateCta } from '@/components/AffiliateCta';
import { buildMetadata, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/compare/hurst-vs-autocorrelation-vs-variance-ratio',
  title: 'Hurst Exponent vs Autocorrelation vs Variance Ratio Test',
  description:
    'Three ways to detect whether a time series is trending, mean-reverting, or random walk. Which to use when, how they disagree, and what to do when they conflict.',
  keywords: [
    'hurst exponent vs autocorrelation',
    'variance ratio test',
    'mean reversion detection',
    'random walk test',
    'lo mackinlay variance ratio',
    'long memory time series',
  ],
});

const LAST_UPDATED = 'May 11, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Hurst Exponent vs Autocorrelation vs Variance Ratio Test',
  description:
    'Practitioner comparison of three persistence-detection methods. R/S analysis, lag-by-lag autocorrelation, and the Lo-MacKinlay variance ratio test.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-05-11',
  dateModified: '2026-05-11',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/compare/hurst-vs-autocorrelation-vs-variance-ratio',
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
      name: 'Hurst vs Autocorrelation vs Variance Ratio',
      item: 'https://quantoracle.dev/compare/hurst-vs-autocorrelation-vs-variance-ratio',
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
        / Hurst vs Autocorrelation vs Variance Ratio
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Hurst Exponent vs Autocorrelation vs Variance Ratio Test
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          Three ways to answer the same question: is this time series trending, mean-reverting, or
          random walk? They use different math, expose different aspects, and occasionally
          disagree. Here&apos;s how to use each and what to do when they conflict.
        </p>
        <p className="mt-3 text-xs text-slate-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">The 30-second answer</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Test</th>
                <th className="px-4 py-3 font-semibold">Best for…</th>
                <th className="px-4 py-3 font-semibold">Output</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Hurst exponent</td>
                <td className="px-4 py-3">
                  Quick regime classification (trend vs mean-revert vs random walk)
                </td>
                <td className="px-4 py-3">One number 0-1; ≈0.5 means random walk</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Autocorrelation</td>
                <td className="px-4 py-3">
                  Finding the time-scale of structure (which lag to trade on)
                </td>
                <td className="px-4 py-3">Correlations at each lag, plus the decay pattern</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Variance ratio test</td>
                <td className="px-4 py-3">
                  Formal hypothesis test (publication, allocator pitch)
                </td>
                <td className="px-4 py-3">VR(k) plus z-statistic and p-value</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          They typically agree on direction. When they disagree, it&apos;s usually because the
          series has different structure at different time scales — which is itself useful
          information.
        </p>
      </section>

      <article className="prose-soft">
        <h2>What each test actually measures</h2>

        <h3>Hurst exponent: one number across all lags</h3>
        <p>
          The Hurst exponent (Hurst, 1951) is a single number between 0 and 1 that summarizes the
          long-memory structure of a time series. Computed via R/S analysis: for each window size
          n, take the range of cumulative deviations from the mean divided by the standard
          deviation. The rescaled range R/S(n) scales as a power of n, and the exponent of that
          power-law is the Hurst exponent.
        </p>
        <p>
          <code>H = 0.5</code> → random walk (Brownian motion, no memory). <code>H &gt; 0.5</code> →
          persistent / trending. <code>H &lt; 0.5</code> → anti-persistent / mean-reverting. The
          beauty of Hurst is its compactness — one number. The cost is that you lose all
          information about which time scales the persistence operates at.
        </p>

        <h3>Autocorrelation: lag-by-lag picture</h3>
        <p>
          <code>ρ(k) = Corr(r_t, r_{`{t-k}`})</code>
        </p>
        <p>
          Autocorrelation measures linear correlation between observations separated by lag k.
          Positive lag-1 autocorrelation means an up-day tends to be followed by another up-day
          (short-term trending). Negative lag-1 autocorrelation means up-days tend to be followed
          by down-days (mean reversion). Plotting autocorrelation across many lags shows the
          structure: how fast it decays, whether it&apos;s monotonic, whether there are
          seasonal/cyclic patterns.
        </p>

        <h3>Variance ratio test: formal hypothesis test</h3>
        <p>
          <code>VR(k) = Var(k-period returns) / (k · Var(1-period returns))</code>
        </p>
        <p>
          Under random walk, returns are independent and variance scales linearly with horizon:
          Var(k-period) = k · Var(1-period), so VR = 1. The Lo &amp; MacKinlay (1988) test
          formalizes this with a z-statistic for the null hypothesis VR = 1. Significant VR &gt; 1
          means trending (positive autocorrelation accumulates); significant VR &lt; 1 means
          mean-reverting (negative autocorrelation accumulates). It&apos;s the cleanest test
          statistically — you get a p-value, you can defend the finding in a paper or pitch deck.
        </p>

        <h2>A concrete example: three series, three results</h2>
        <p>
          Three 1000-observation series, same volatility, very different memory structures:
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-3 py-2">Series</th>
                <th className="px-3 py-2">True regime</th>
                <th className="px-3 py-2">Hurst</th>
                <th className="px-3 py-2">Lag-1 autocorr</th>
                <th className="px-3 py-2">VR(10) [p-value]</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">A. Random walk</td>
                <td className="px-3 py-2">GBM</td>
                <td className="px-3 py-2">~0.51</td>
                <td className="px-3 py-2">~0.00</td>
                <td className="px-3 py-2">1.02 [p=0.48]</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">B. AR(1) trending</td>
                <td className="px-3 py-2">r_t = 0.2·r_{`{t-1}`} + ε</td>
                <td className="px-3 py-2 text-chart-gain">~0.68</td>
                <td className="px-3 py-2 text-chart-gain">~0.20</td>
                <td className="px-3 py-2 text-chart-gain">1.45 [p&lt;0.001]</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">C. OU mean-reverting</td>
                <td className="px-3 py-2">Ornstein-Uhlenbeck</td>
                <td className="px-3 py-2 text-accent">~0.30</td>
                <td className="px-3 py-2 text-accent">~-0.25</td>
                <td className="px-3 py-2 text-accent">0.55 [p&lt;0.001]</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          All three tests agree directionally in each case. The differences become visible at the
          margins — for a series that&apos;s &quot;trending at short lags, mean-reverting at long
          lags,&quot; Hurst might say ≈0.5 (averaging cancels), autocorrelation shows the structure
          lag by lag, and VR depends sharply on which k you choose.
        </p>

        <h2>When each one wins</h2>

        <h3>Hurst: when you need a single number for screening</h3>
        <p>
          Hurst&apos;s strength is compression: 5,000 returns into one number. If you&apos;re
          screening hundreds of assets for &quot;which ones are trending,&quot; Hurst gives you a
          ranked list immediately. It&apos;s also the most intuitive to communicate to
          non-quantitative stakeholders — &quot;H of 0.65 means this market is trending&quot; is
          easier than &quot;the lag-1 autocorrelation is 0.20 and the lag-5 is 0.08.&quot;
        </p>
        <p>
          Use Hurst when you need: regime classification across many assets, rolling-window
          regime detection through time, a single number for dashboards, intuitive
          communication.
        </p>

        <h3>Autocorrelation: when you need to design the trade</h3>
        <p>
          If you&apos;re going to run a 5-day mean-reversion strategy, lag-1 autocorrelation
          doesn&apos;t tell you what you need. You need the lag-5 autocorrelation. The
          autocorrelation plot across lags 1-50 is your design surface — strongly negative lag-3
          means trade 3-day reversion; near-zero lag-3 but strongly negative lag-20 means trade
          20-day reversion.
        </p>
        <p>
          Use autocorrelation when you need: lag-specific time scale of the signal, decay pattern
          shape, identification of the right trade horizon.
        </p>

        <h3>Variance ratio: when you need a p-value</h3>
        <p>
          Hurst is descriptive. Autocorrelation is descriptive. Variance ratio is a hypothesis
          test. It gives you the z-statistic and p-value for &quot;is this series random
          walk?&quot; — which is exactly what you need for academic publication, regulator
          submission, or allocator pitch deck. It&apos;s also the most robust to heteroskedasticity
          (use the Lo-MacKinlay heteroskedasticity-consistent variant).
        </p>
        <p>
          Use VR when you need: formal hypothesis test, publication-grade evidence, allocator
          pitch material, robustness to heteroskedasticity.
        </p>

        <h2>When they disagree (what it means)</h2>
        <p>
          The most common disagreement: Hurst says one thing and autocorrelation/VR say another.
          Three reasons:
        </p>
        <ol>
          <li>
            <strong>Multi-scale structure</strong>. The series is mean-reverting at short lags and
            trending at long lags. Hurst averages these and lands near 0.5; autocorrelation and
            VR at the relevant lag/horizon show the real structure. Trust the lag-specific
            metrics.
          </li>
          <li>
            <strong>Non-stationarity</strong>. The series has regime breaks or trends in its mean.
            Hurst can inflate above 1.0; autocorrelation gets contaminated. The fix: compute on
            rolling windows or split at suspected regime breaks. Don&apos;t trust any of them on
            non-stationary lifetime data.
          </li>
          <li>
            <strong>Insufficient sample size</strong>. Under 100-200 observations all three are
            noisy. Hurst is the most sample-sensitive. If they disagree on a short sample,
            don&apos;t conclude — get more data.
          </li>
        </ol>

        <h2>The decision rule</h2>
        <ol>
          <li>
            <strong>Quick regime read across many assets</strong> → compute Hurst on each. Use the{' '}
            <Link href="/hurst-exponent-calculator" className="text-accent">
              Hurst exponent calculator
            </Link>{' '}
            and rank by H.
          </li>
          <li>
            <strong>Designing a specific trade frequency</strong> → compute autocorrelation at
            multiple lags. Trade the lag where autocorrelation is strongest (most negative for
            mean-reversion, most positive for momentum).
          </li>
          <li>
            <strong>Validating a finding before deployment</strong> → run variance ratio test at
            the relevant horizon. If p &gt; 0.05 don&apos;t trust the apparent signal — it could
            be noise.
          </li>
          <li>
            <strong>For a serious research workflow</strong>: compute all three on rolling
            windows. Chart H and VR through time alongside cumulative return. Look for regime
            changes — points where these flip across 0.5 / 1.0 thresholds.
          </li>
        </ol>

        <h2>Asset class reference values</h2>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-3 py-2">Asset</th>
                <th className="px-3 py-2">Typical H (daily)</th>
                <th className="px-3 py-2">Lag-1 autocorr</th>
                <th className="px-3 py-2">Best strategy style</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">S&amp;P 500 index</td>
                <td className="px-3 py-2">0.55 - 0.60</td>
                <td className="px-3 py-2">slightly positive</td>
                <td className="px-3 py-2">Mild trend / buy-and-hold</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Major FX (EUR/USD)</td>
                <td className="px-3 py-2">0.48 - 0.52</td>
                <td className="px-3 py-2">≈ 0</td>
                <td className="px-3 py-2">Neither — look for carry</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Short-term interest rates</td>
                <td className="px-3 py-2">0.30 - 0.40</td>
                <td className="px-3 py-2">strongly negative</td>
                <td className="px-3 py-2">Mean reversion / carry</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Single equities (avg)</td>
                <td className="px-3 py-2">0.40 - 0.55</td>
                <td className="px-3 py-2">slightly negative (intraday)</td>
                <td className="px-3 py-2">Short-term reversion / mid-term momentum</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Bitcoin (daily)</td>
                <td className="px-3 py-2">0.55 - 0.70</td>
                <td className="px-3 py-2">positive</td>
                <td className="px-3 py-2">Trend-following</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2">Commodity futures</td>
                <td className="px-3 py-2">0.50 - 0.65</td>
                <td className="px-3 py-2">positive at multi-day</td>
                <td className="px-3 py-2">Trend-following / CTA</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Related calculators</h2>
        <ul>
          <li>
            <Link href="/hurst-exponent-calculator" className="text-accent">
              Hurst Exponent Calculator
            </Link>{' '}
            — R/S analysis with R-squared fit-quality readout
          </li>
          <li>
            <Link href="/sharpe-ratio-calculator" className="text-accent">
              Sharpe Ratio Calculator
            </Link>{' '}
            — confirm that whatever strategy you pick has real edge
          </li>
          <li>
            <Link href="/probabilistic-sharpe-ratio-calculator" className="text-accent">
              Probabilistic Sharpe Ratio Calculator
            </Link>{' '}
            — significance test for that edge, parallels VR test for return-distribution
            properties
          </li>
          <li>
            <Link href="/monte-carlo-simulation-calculator" className="text-accent">
              Monte Carlo Simulation Calculator
            </Link>{' '}
            — generate synthetic series with known H to validate your test pipeline
          </li>
        </ul>

        <h2>References</h2>
        <ul className="text-sm">
          <li>
            Hurst, H. E. (1951). &quot;Long-term storage capacity of reservoirs.&quot; Transactions
            of the American Society of Civil Engineers 116, 770-808.
          </li>
          <li>
            Mandelbrot, B. (1972). &quot;Statistical methodology for non-periodic cycles: from the
            covariance to R/S analysis.&quot; Annals of Economic and Social Measurement 1,
            259-290.
          </li>
          <li>
            Lo, A. W. &amp; MacKinlay, A. C. (1988). &quot;Stock market prices do not follow random
            walks: evidence from a simple specification test.&quot; Review of Financial Studies
            1(1), 41-66.
          </li>
          <li>
            Box, G. E. P. &amp; Pierce, D. A. (1970). &quot;Distribution of residual
            autocorrelations in autoregressive-integrated moving average time series models.&quot;
            Journal of the American Statistical Association 65(332), 1509-1526.
          </li>
          <li>
            Ljung, G. M. &amp; Box, G. E. P. (1978). &quot;On a measure of lack of fit in time
            series models.&quot; Biometrika 65(2), 297-303.
          </li>
        </ul>
      </article>

      <div className="mt-12">
        <AffiliateCta subId="compare-hurst-vs-autocorrelation-vs-variance-ratio" category="compare" />
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
