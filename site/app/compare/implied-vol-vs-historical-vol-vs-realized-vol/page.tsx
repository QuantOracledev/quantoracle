import Link from 'next/link';
import { Faq } from '@/components/FAQ';
import { AffiliateCta } from '@/components/AffiliateCta';
import { buildMetadata, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/compare/implied-vol-vs-historical-vol-vs-realized-vol',
  title: 'Implied vs Historical vs Realized Volatility: Which to Use When',
  description:
    'Three volatility metrics that look similar but answer different questions. Implied (forward-looking, from option prices), historical (backward-looking, close-to-close), realized (high-frequency intraday). Decision rule + concrete formulas.',
  keywords: [
    'implied vs historical volatility',
    'realized volatility vs historical',
    'IV vs HV',
    'parkinson volatility',
    'yang zhang volatility',
    'volatility risk premium',
  ],
});

const LAST_UPDATED = 'May 14, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Implied vs Historical vs Realized Volatility: Which to Use When',
  description:
    'Practitioner comparison of the three volatility metrics — implied, historical, realized — with formulas, the volatility risk premium, when each one applies, and which estimators (Parkinson, Yang-Zhang) outperform close-to-close.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-05-14',
  dateModified: '2026-05-14',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/compare/implied-vol-vs-historical-vol-vs-realized-vol',
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
      name: 'Implied vs Historical vs Realized Volatility',
      item: 'https://quantoracle.dev/compare/implied-vol-vs-historical-vol-vs-realized-vol',
    },
  ],
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> /{' '}
        <Link href="/compare" className="hover:text-accent">Compare</Link>{' '}
        / Implied vs Historical vs Realized Volatility
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Implied vs Historical vs Realized Volatility: Which One Should You Use?
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          Three volatility metrics that look similar in name but answer different questions.
          Pick the wrong one and you systematically misprice options, misestimate risk, or
          misforecast tomorrow.
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
                <th className="px-4 py-3 font-semibold">Direction</th>
                <th className="px-4 py-3 font-semibold">Best for</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Implied (IV)</td>
                <td className="px-4 py-3">Forward-looking</td>
                <td className="px-4 py-3">Pricing options, vol surface, market sentiment</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Historical (HV)</td>
                <td className="px-4 py-3">Backward-looking, low frequency</td>
                <td className="px-4 py-3">Sharpe, VaR, longer-horizon risk metrics</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Realized (RV)</td>
                <td className="px-4 py-3">Backward-looking, high frequency</td>
                <td className="px-4 py-3">Short-horizon vol forecasting, intraday risk</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Same Greek letter (σ), three different uses. Sophisticated workflows report all three.
        </p>
      </section>

      <article className="prose-soft">
        <h2>What is implied volatility?</h2>
        <p>
          Implied volatility (IV) is the volatility parameter that makes the Black-Scholes price
          of an option equal to its observed market price. You solve the BS formula backward —
          given the market price, strike, spot, time to expiry, and risk-free rate, what σ makes
          the equation balance? That σ is the implied vol.
        </p>
        <p>
          IV is <strong>forward-looking</strong>: it represents what the market collectively
          thinks volatility will be between now and expiry. It&apos;s derived from prices people
          are actually paying, not from historical observation. That makes it useful for option
          pricing (it&apos;s embedded in the price you trade against) and for sentiment reading
          (high IV = market expects turbulence; low IV = expects calm).
        </p>

        <h3>The volatility smile</h3>
        <p>
          Black-Scholes theory says IV should be constant across strikes and expiries for the same
          underlying. In reality it varies systematically:
        </p>
        <ul>
          <li>
            <strong>Smile</strong>: high IV at deep ITM and OTM strikes, lower at ATM. Typical for
            currency options.
          </li>
          <li>
            <strong>Smirk</strong>: high IV at OTM puts, low at OTM calls. Typical for equity
            indexes — the market prices crash protection at a premium.
          </li>
          <li>
            <strong>Surface</strong>: 2D extension across strikes AND expiries. What most options
            desks calibrate to.
          </li>
        </ul>
        <p>
          The smile/smirk exists because real return distributions have fat tails and negative
          skew that the log-normal assumption in BS doesn&apos;t capture. Local-vol models
          (Dupire) and stochastic-vol models (Heston, SABR) explicitly model this surface.
        </p>

        <h2>What is historical volatility?</h2>
        <p>
          Historical volatility (HV) is the standard deviation of past returns, computed from
          close-to-close price observations over a window (typically 20, 30, 60, or 252 trading
          days).
        </p>
        <p>
          <code>HV = √(Σ(r_i − r̄)² / (n−1)) × √(periods per year)</code>
        </p>
        <p>
          Where r_i are periodic returns. HV is <strong>backward-looking</strong> and uses
          one observation per period. It&apos;s what every formula in classical portfolio theory
          assumes when it says &quot;volatility&quot; — the σ in Sharpe ratio, in Markowitz
          optimization, in parametric VaR, all refer to historical close-to-close stdev.
        </p>
        <p>
          The trade-off is window size. Short windows (20-30 days) react quickly to regime
          changes but are noisy. Long windows (252 days) are smoother but slow to update. Most
          practitioners pick the window to match their holding horizon, or use multiple windows
          weighted together.
        </p>

        <h2>What is realized volatility?</h2>
        <p>
          Realized volatility (RV) is also backward-looking but uses <strong>high-frequency
          intraday data</strong> and specialized estimators that extract more volatility
          information than close-to-close stdev can see. The intraday range encodes volatility
          information that two daily closes don&apos;t.
        </p>

        <h3>The realized vol estimator family</h3>
        <p>Four estimators in order of sophistication:</p>
        <ul>
          <li>
            <strong>Close-to-close (HV)</strong>: standard sample stdev. Uses only daily closes.
            About 1x efficient (baseline).
          </li>
          <li>
            <strong>Parkinson (1980)</strong>: uses daily high-low range. Assumes continuous
            trading and no drift. ~5x more efficient than close-to-close — captures intraday
            vol that closes miss.
          </li>
          <li>
            <strong>Garman-Klass (1980)</strong>: uses OHLC. Better than Parkinson on drift bias.
            ~7x more efficient.
          </li>
          <li>
            <strong>Yang-Zhang (2000)</strong>: handles overnight gaps + drift bias. Minimum-
            variance unbiased estimator across all OHLC estimators. ~14x more efficient. The
            production gold standard.
          </li>
        </ul>
        <p>
          For short-horizon vol forecasting (intraday risk, end-of-day position sizing), Yang-Zhang
          is the default. For longer horizons where the marginal efficiency gain doesn&apos;t
          justify the implementation complexity, close-to-close HV is fine.
        </p>

        <h2>A concrete example: same asset, three vol numbers</h2>
        <p>
          Suppose SPY is currently $480. The 30-day ATM option is trading at $8.40. The 30-day
          close-to-close HV is 13.8%. Realized vol (Yang-Zhang) over the past 30 days is 11.5%.
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-3 py-2">Metric</th>
                <th className="px-3 py-2">Value</th>
                <th className="px-3 py-2">Interpretation</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">Implied (IV)</td>
                <td className="px-3 py-2 font-mono">16.2%</td>
                <td className="px-3 py-2">Market expects 16.2% annualized vol over the next 30 days</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">Historical (HV)</td>
                <td className="px-3 py-2 font-mono">13.8%</td>
                <td className="px-3 py-2">Last 30 days of closes had 13.8% annualized stdev</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">Realized YZ</td>
                <td className="px-3 py-2 font-mono">11.5%</td>
                <td className="px-3 py-2">Same 30 days, intraday-adjusted: actually 11.5%</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100 text-chart-gain">IV − RV</td>
                <td className="px-3 py-2 font-mono text-chart-gain">+4.7pp</td>
                <td className="px-3 py-2">The volatility risk premium — options priced richer than realized</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          That +4.7pp gap between IV and RV is the volatility risk premium. Systematic option-
          selling strategies (straddle selling, iron condors, vol-targeted writing) try to capture
          this. When the premium is wide and stable, they profit. When the premium collapses or
          inverts (IV &lt; RV, which happens during regime breaks), they lose painfully — the
          short-vol blowups of 2018 and 2020 were both VRP-collapse events.
        </p>

        <h2>The decision rule</h2>
        <ol>
          <li>
            <strong>Pricing an option, or evaluating an option&apos;s &quot;richness&quot;</strong> →
            Implied volatility. Use the{' '}
            <Link href="/implied-volatility-calculator" className="text-accent">
              Implied Volatility Calculator
            </Link>{' '}
            to solve for IV given a market price.
          </li>
          <li>
            <strong>Computing Sharpe, Sortino, Calmar, VaR, CVaR, or any portfolio metric</strong>{' '}
            → Historical volatility (close-to-close stdev). The{' '}
            <Link href="/sharpe-ratio-calculator" className="text-accent">
              Sharpe ratio calculator
            </Link>{' '}
            and{' '}
            <Link href="/value-at-risk-calculator" className="text-accent">
              VaR calculator
            </Link>{' '}
            both use this.
          </li>
          <li>
            <strong>Forecasting tomorrow&apos;s vol for intraday risk or short-horizon
            execution</strong> → Realized volatility with Yang-Zhang or Parkinson estimator.
          </li>
          <li>
            <strong>Backtesting an options strategy</strong> → Both: IV for entry pricing, HV for
            what the strategy actually realized in returns.
          </li>
          <li>
            <strong>Detecting vol regime change</strong> → Compare IV to recent RV. If IV ≪ RV,
            options may be underpriced (or a vol spike is coming). If IV ≫ RV, the VRP is wide
            (option selling has edge, but tail risk is elevated).
          </li>
        </ol>

        <h2>Common confusions</h2>

        <h3>&quot;Volatility&quot; in Sharpe ratio is HV, not IV</h3>
        <p>
          When a hedge fund advertises a 1.5 Sharpe ratio, that&apos;s computed from realized
          returns and their sample stdev — historical volatility. Substituting IV gives a
          different (and theoretically incorrect) number. Don&apos;t mix the two when comparing
          strategies.
        </p>

        <h3>VIX is the IV of the SPX, not historical vol</h3>
        <p>
          The VIX index is computed from SPX options premiums via a specific formula
          (CBOE&apos;s 2003 methodology) and represents the market&apos;s implied vol expectation
          for the next 30 days. It&apos;s a forward-looking metric. The &quot;realized VIX&quot;
          (computed retroactively from actual SPX RV) almost always differs.
        </p>

        <h3>&quot;Higher vol = more risk&quot; only sometimes</h3>
        <p>
          For a single asset, HV captures most of what classical theory calls risk. But for
          strategies with skew (option selling, carry trades), HV understates risk because it
          treats upside and downside symmetrically. See{' '}
          <Link href="/compare/var-vs-cvar-vs-max-drawdown" className="text-accent">
            VaR vs CVaR vs Max Drawdown
          </Link>{' '}
          for how tail-aware risk metrics handle this.
        </p>

        <h2>Related calculators</h2>
        <ul>
          <li>
            <Link href="/implied-volatility-calculator" className="text-accent">
              Implied Volatility Calculator
            </Link>{' '}
            — solve for IV given a market option price (Newton-Raphson on Black-Scholes)
          </li>
          <li>
            <Link href="/black-scholes-calculator" className="text-accent">
              Black-Scholes Calculator
            </Link>{' '}
            — uses σ as an input; pair with IV calculator for full round-trip
          </li>
          <li>
            <Link href="/sharpe-ratio-calculator" className="text-accent">
              Sharpe Ratio Calculator
            </Link>{' '}
            — uses HV in the denominator
          </li>
          <li>
            <Link href="/value-at-risk-calculator" className="text-accent">
              Value at Risk Calculator
            </Link>{' '}
            — uses HV for parametric VaR
          </li>
          <li>
            <Link href="/monte-carlo-simulation-calculator" className="text-accent">
              Monte Carlo Simulation Calculator
            </Link>{' '}
            — uses HV as the input vol parameter for GBM paths
          </li>
        </ul>

        <h2>References</h2>
        <ul className="text-sm">
          <li>Black, F. &amp; Scholes, M. (1973). &quot;The pricing of options and corporate liabilities.&quot; Journal of Political Economy 81(3), 637-654.</li>
          <li>Parkinson, M. (1980). &quot;The extreme value method for estimating the variance of the rate of return.&quot; Journal of Business 53(1), 61-65.</li>
          <li>Garman, M. B. &amp; Klass, M. J. (1980). &quot;On the estimation of security price volatilities from historical data.&quot; Journal of Business 53(1), 67-78.</li>
          <li>Yang, D. &amp; Zhang, Q. (2000). &quot;Drift-independent volatility estimation based on high, low, open, and close prices.&quot; Journal of Business 73(3), 477-491.</li>
          <li>Bollerslev, T., Tauchen, G., &amp; Zhou, H. (2009). &quot;Expected stock returns and variance risk premia.&quot; Review of Financial Studies 22(11), 4463-4492.</li>
        </ul>
      </article>

      <div className="mt-12">
        <AffiliateCta subId="compare-iv-vs-hv-vs-rv" category="compare" />
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
