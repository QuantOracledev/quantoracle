import Link from 'next/link';
import { Faq } from '@/components/FAQ';
import { CompareRelated } from '@/components/CompareRelated';
import { AffiliateCta } from '@/components/AffiliateCta';
import { buildMetadata, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/compare/z-score-vs-bollinger-bands-vs-rsi',
  title: 'Z-Score vs Bollinger Bands vs RSI: Which Mean Reversion Indicator?',
  description:
    'Three mean-reversion indicators that all measure "how far from the mean" but produce different signals. Z-score is the statistical one. Bollinger Bands are the chart overlay. RSI is the bounded oscillator. When each fires false signals, when they disagree, and which is right for pairs trading vs single-asset.',
  keywords: [
    'z-score vs bollinger bands',
    'bollinger bands vs rsi',
    'z-score vs rsi',
    'mean reversion indicator',
    'mean reversion detection',
    'overbought oversold indicator',
    'pairs trading indicator',
    'standard deviation indicator',
  ],
});

const LAST_UPDATED = 'May 17, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline:
    'Z-Score vs Bollinger Bands vs RSI: Which Mean Reversion Indicator Should You Use?',
  description:
    'Practitioner comparison of the three most common mean-reversion indicators. When each is right, when each lies, what window size to use, and how to combine them when they disagree.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-05-17',
  dateModified: '2026-05-17',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/compare/z-score-vs-bollinger-bands-vs-rsi',
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
      name: 'Z-Score vs Bollinger Bands vs RSI',
      item: 'https://quantoracle.dev/compare/z-score-vs-bollinger-bands-vs-rsi',
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
        / Z-Score vs Bollinger Bands vs RSI
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Z-Score vs Bollinger Bands vs RSI: Which Mean Reversion Indicator Should You Use?
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          Three mean-reversion indicators that all answer some version of &quot;how far is this
          asset from its recent mean?&quot; — and produce different signals because they ask the
          question three different ways. Z-score is the statistical answer. Bollinger Bands are
          the visual chart overlay version. RSI is the bounded momentum-style oscillator. They
          mostly agree, but when they disagree, the disagreement is itself useful information.
        </p>
        <p className="mt-3 text-xs text-slate-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft">
        <h2 id="short-answer">The 30-second decision rule</h2>
        <ul>
          <li>
            <strong>Pairs trading / cross-asset comparison</strong> → Z-score. It normalizes
            spread movements in standard-deviation units, which is exactly what pairs trading
            needs.
          </li>
          <li>
            <strong>Single-asset overbought/oversold on a chart</strong> → Bollinger Bands.
            Same math as Z-score at ±2σ, but the visual overlay on price is easier to read.
          </li>
          <li>
            <strong>Momentum-style 0-100 oscillator</strong> → RSI. Easier for retail readers,
            popular in technical analysis, less statistically defensible.
          </li>
          <li>
            <strong>Statistical-arbitrage with publication-quality math</strong> → Z-score
            only. RSI and BB don&apos;t have clean distributional theory you can defend.
          </li>
        </ul>

        <h2 id="side-by-side">Side-by-side</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">Property</th>
                <th className="text-left p-2">Z-Score</th>
                <th className="text-left p-2">Bollinger Bands</th>
                <th className="text-left p-2">RSI</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2">Math</td>
                <td className="p-2">(x − μ) / σ</td>
                <td className="p-2">μ ± 2σ overlaid on price</td>
                <td className="p-2">100 − [100 / (1 + avg_gain/avg_loss)]</td>
              </tr>
              <tr>
                <td className="p-2">Output range</td>
                <td className="p-2">Unbounded, typically −3 to +3</td>
                <td className="p-2">Three lines on price chart</td>
                <td className="p-2">0 to 100, bounded</td>
              </tr>
              <tr>
                <td className="p-2">Default window</td>
                <td className="p-2">20-60 (varies)</td>
                <td className="p-2">20 (Bollinger&apos;s convention)</td>
                <td className="p-2">14 (Wilder&apos;s convention)</td>
              </tr>
              <tr>
                <td className="p-2">Statistical theory</td>
                <td className="p-2">Direct (distributional)</td>
                <td className="p-2">Inherits from Z-score</td>
                <td className="p-2">None (empirical)</td>
              </tr>
              <tr>
                <td className="p-2">Cross-asset comparable</td>
                <td className="p-2">Yes (scale-invariant)</td>
                <td className="p-2">No (price-scale dependent)</td>
                <td className="p-2">Yes (bounded 0-100)</td>
              </tr>
              <tr>
                <td className="p-2">Visual chart overlay</td>
                <td className="p-2">No (number, plot separately)</td>
                <td className="p-2">Yes (built for this)</td>
                <td className="p-2">No (sub-chart oscillator)</td>
              </tr>
              <tr>
                <td className="p-2">Pairs trading fit</td>
                <td className="p-2">Best</td>
                <td className="p-2">Possible but contrived</td>
                <td className="p-2">No</td>
              </tr>
              <tr>
                <td className="p-2">Trend filtering</td>
                <td className="p-2">Weak (fires repeatedly in trends)</td>
                <td className="p-2">Weak</td>
                <td className="p-2">Moderate (smoothing helps)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="zscore">Z-Score — the statistical one</h2>
        <p>The formula is the classic statistical one:</p>
        <pre>
          <code>{`Z = (x - μ) / σ`}</code>
        </pre>
        <p>
          Where x is the current value, μ is the rolling mean over a chosen window, and σ is the
          rolling standard deviation over the same window. A Z-score of +2 means the current
          value is 2 standard deviations above its recent mean — under any reasonable
          distributional assumption, that&apos;s a meaningful tail event.
        </p>
        <p>
          <strong>Strengths.</strong> Statistically defensible — every working quant
          understands Z-scores and can pitch p-values built on them. Scale-invariant, so a
          5%-vol bond&apos;s &quot;2-sigma move&quot; means the same thing as a 50%-vol
          crypto&apos;s. Symmetric (positive and negative thresholds are equivalent). The
          natural primitive for pairs trading, where you measure spread deviations from
          cointegration.
        </p>
        <p>
          <strong>Weaknesses.</strong> No built-in trend filter — during sustained uptrends,
          Z keeps hitting +2 because price keeps making new highs above a rolling mean that
          can&apos;t catch up. Out of the box, Z-score-based mean-reversion strategies get
          slaughtered in trending regimes unless you add a separate trend filter (often Hurst
          exponent or autocorrelation testing).
        </p>
        <p>
          <strong>Window choice matters.</strong> 20 periods for short-term signals, 60 for
          medium-term, 252 for annual baselines. The default 20 is too short for many
          cross-sectional pairs strategies — 60-100 typically works better because it captures
          true cointegration vs noise.
        </p>
        <p>
          The QuantOracle{' '}
          <Link href="/value-at-risk-calculator" className="text-accent">
            Value at Risk Calculator
          </Link>{' '}
          and{' '}
          <Link href="/sharpe-ratio-calculator" className="text-accent">
            Sharpe Ratio Calculator
          </Link>{' '}
          both implicitly use Z-score normalization. The{' '}
          <a href="https://api.quantoracle.dev/v1/stats/zscore" className="text-accent">
            /v1/stats/zscore
          </a>{' '}
          endpoint exposes static and rolling Z-scores with extreme-value detection directly.
        </p>

        <h2 id="bollinger">Bollinger Bands — the chart overlay</h2>
        <p>John Bollinger&apos;s 1980s invention. Three lines plotted on a price chart:</p>
        <ul>
          <li>
            <strong>Middle band:</strong> N-period simple moving average of close prices
            (default N=20)
          </li>
          <li>
            <strong>Upper band:</strong> middle + K standard deviations (default K=2)
          </li>
          <li>
            <strong>Lower band:</strong> middle − K standard deviations
          </li>
        </ul>
        <p>
          When the close touches the upper band, the price is 2σ above its 20-day mean — which
          is mathematically identical to a Z-score of +2.0. Bollinger Bands are essentially
          Z-scores rendered as a chart overlay.
        </p>
        <p>
          <strong>Strengths.</strong> Visual. The bands tell you immediately where the
          unusual-trading-activity envelope is without doing arithmetic. The &quot;Bollinger
          band squeeze&quot; (bands narrowing) is also popular as a volatility-contraction
          signal preceding directional breakouts. Mature trading platform support — every
          retail and institutional charting package implements them by default.
        </p>
        <p>
          <strong>Weaknesses.</strong> Same as Z-score by construction: no trend filter, false
          signals during sustained moves. Plus, the 20/2 default is just empirical convention
          — different markets benefit from different parameters and you have to walk-forward
          tune them. Single-asset only out of the box; applying Bollinger Bands to a pairs
          spread requires you to first compute the spread series and effectively reduces to
          Z-score with different visualization.
        </p>
        <p>
          Bollinger himself recommended using the bands as &quot;envelopes for normal trading
          activity&quot; rather than direct trade signals — touching the upper band doesn&apos;t
          mean &quot;sell now,&quot; it means &quot;this is at the edge of recent normal.&quot;
          The mistake retail traders make is treating band touches as automatic reversal
          signals.
        </p>

        <h2 id="rsi">RSI — the bounded oscillator</h2>
        <p>Welles Wilder&apos;s 1978 indicator. The formula:</p>
        <pre>
          <code>{`RSI = 100 - [100 / (1 + RS)]
where RS = (average gain over N periods) / (average loss over N periods)`}</code>
        </pre>
        <p>
          N is typically 14. The output is bounded 0-100: 100 means all gains in the window, 0
          means all losses, 50 means equal. Convention: RSI &gt; 70 is overbought, RSI &lt; 30
          is oversold.
        </p>
        <p>
          <strong>Strengths.</strong> Bounded scale is intuitive — traders new to indicators
          can immediately interpret &quot;30 = oversold, 70 = overbought&quot; without
          understanding standard deviations. The smoothing makes RSI lag during the early
          phase of a trend, which can be useful as a momentum confirmation when combined with
          other signals.
        </p>
        <p>
          <strong>Weaknesses.</strong> No clean statistical interpretation — you can&apos;t
          pitch &quot;RSI 75 means p &lt; 0.05&quot; in a research note. The indicator was
          constructed empirically, not derived from any distributional theory. Two paths
          arriving at the same current price with the same recent volatility can have very
          different RSI values depending on the sequence of moves, because RSI uses absolute
          gains/losses rather than standard deviations.
        </p>
        <p>
          RSI is most useful when combined with other signals. The classic combination is
          &quot;Bollinger Band touch AND RSI confirms oversold&quot; for mean-reversion long
          entries — the two indicators agreeing filters out a meaningful fraction of false
          signals during trending markets.
        </p>

        <h2 id="disagreement">When the three indicators disagree</h2>
        <p>
          Most of the time these three agree about overbought/oversold conditions because they
          all measure variants of &quot;how far from the mean.&quot; The disagreements happen
          in two contexts:
        </p>
        <ol>
          <li>
            <strong>Strong directional trends.</strong> Z-score and Bollinger Bands quickly
            hit ±2 during strong trends because price keeps making new highs/lows above the
            rolling mean. RSI smooths the trend and can stay neutral longer, then start to
            diverge from price in the late stage (the &quot;bearish divergence&quot;
            pattern). Lesson: when Z-score / BB say overbought but RSI says neutral, trend is
            dominating — mean-reversion entries are likely to fail.
          </li>
          <li>
            <strong>Sharp single-event moves.</strong> Earnings, FOMC, or M&A spikes can move
            price 3-5% in a single bar. Z-score and BB jump immediately. RSI takes a couple of
            bars to fully reflect the move because of the smoothing. For mean-reversion
            strategies entering on the spike, the indicators give different signals depending
            on which one you check.
          </li>
        </ol>
        <p>
          The honest interpretation: when the three indicators disagree, regime is changing.
          Mean-reversion strategies are most reliable when all three flash extreme readings at
          the same time and most likely to fail when they don&apos;t.
        </p>

        <h2 id="combine">Combining them</h2>
        <p>
          The standard professional approach: require two or three indicators to agree before
          entering a mean-reversion trade. Common stacks:
        </p>
        <ul>
          <li>
            <strong>Conservative long entry:</strong> price touches lower Bollinger Band AND
            RSI &lt; 30 AND Z-score &lt; −2
          </li>
          <li>
            <strong>Pairs trade entry:</strong> spread Z-score &gt; 2 AND |spread Z-score 7
            days ago| &lt; 1 (catches the actual deviation event, not lingering deviation)
          </li>
          <li>
            <strong>Mean-reversion + trend filter:</strong> Z-score signals AND Hurst
            exponent &lt; 0.5 (only trade mean reversion when the market is in a
            mean-reverting regime by Hurst). See{' '}
            <Link href="/compare/hurst-vs-autocorrelation-vs-variance-ratio" className="text-accent">
              Hurst vs Autocorrelation vs Variance Ratio
            </Link>{' '}
            for the regime-detection comparison.
          </li>
        </ul>
        <p>
          The cost of combining filters: each filter cuts roughly half the signal events. Three
          filters can leave you with only 5-15 trades per year. For discretionary trading
          that&apos;s fine. For systematic backtesting it&apos;s often too few to evaluate;
          you&apos;d need decades of clean data.
        </p>

        <h2 id="related">Related calculators and articles</h2>
        <ul>
          <li>
            <Link href="/value-at-risk-calculator" className="text-accent">
              Value at Risk (VaR) Calculator
            </Link>{' '}
            — parametric VaR + CVaR, both built on Z-score normalization
          </li>
          <li>
            <Link href="/hurst-exponent-calculator" className="text-accent">
              Hurst Exponent Calculator
            </Link>{' '}
            — the formal test for whether a series is trending, mean-reverting, or random walk
          </li>
          <li>
            <Link href="/compare/hurst-vs-autocorrelation-vs-variance-ratio" className="text-accent">
              Hurst vs Autocorrelation vs Variance Ratio
            </Link>{' '}
            — three ways to test mean reversion vs trending regimes
          </li>
          <li>
            <Link href="/sharpe-ratio-calculator" className="text-accent">
              Sharpe Ratio Calculator
            </Link>{' '}
            — risk-adjusted return measurement (uses Z-score normalization implicitly)
          </li>
        </ul>

        <h2 id="references">References</h2>
        <ul className="text-sm">
          <li>
            Bollinger, J. (1980s). The Bollinger Bands construction — described in his
            collected writings and the Bollinger on Bollinger Bands book (2001).
          </li>
          <li>
            Wilder, J. W. (1978). New Concepts in Technical Trading Systems — the original RSI
            and ATR formulations.
          </li>
          <li>
            Hurst, H. E. (1951). Long-Term Storage Capacity of Reservoirs — origin of the
            Hurst exponent.
          </li>
          <li>
            Lo, A. W. &amp; MacKinlay, A. C. (1988). Stock Market Prices Do Not Follow Random
            Walks — variance-ratio testing for mean reversion vs random walk.
          </li>
        </ul>
      </article>

      <div className="mt-12">
        <AffiliateCta subId="compare-z-vs-bb-vs-rsi" category="compare" />
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">Frequently asked questions</h2>
        <Faq items={faqs} />
      </section>

      <CompareRelated slug="z-score-vs-bollinger-bands-vs-rsi" />

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
