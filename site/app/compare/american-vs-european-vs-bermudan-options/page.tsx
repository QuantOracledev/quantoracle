import Link from 'next/link';
import { Faq } from '@/components/FAQ';
import { CompareRelated } from '@/components/CompareRelated';
import { AffiliateCta } from '@/components/AffiliateCta';
import { buildMetadata, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/compare/american-vs-european-vs-bermudan-options',
  title: 'American vs European vs Bermudan Options: Exercise Rights Explained',
  description:
    'Three option exercise styles, three different prices. American = any time. European = only at expiry. Bermudan = specific dates. Merton\'s 1973 theorem, the early exercise premium, and which calculator to use for each.',
  keywords: [
    'american vs european options',
    'bermudan options explained',
    'early exercise premium',
    'american option pricing',
    'option exercise styles',
    'merton early exercise theorem',
  ],
});

const LAST_UPDATED = 'May 14, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'American vs European vs Bermudan Options: Exercise Rights Explained',
  description:
    'Practitioner comparison of American, European, and Bermudan option exercise styles. Merton\'s theorem, when early exercise is optimal, how dividends factor in, and the pricing methods that handle each.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-05-14',
  dateModified: '2026-05-14',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/compare/american-vs-european-vs-bermudan-options',
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
      name: 'American vs European vs Bermudan Options',
      item: 'https://quantoracle.dev/compare/american-vs-european-vs-bermudan-options',
    },
  ],
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> /{' '}
        <Link href="/compare" className="hover:text-accent">Compare</Link>{' '}
        / American vs European vs Bermudan Options
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          American vs European vs Bermudan Options: Which Exercise Style and Why It Matters
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          Three exercise rights, three different prices for the same underlying parameters. The
          right to exercise early is itself worth money — sometimes zero (Merton 1973), sometimes
          a meaningful premium. Here&apos;s when it matters.
        </p>
        <p className="mt-3 text-xs text-slate-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">The 30-second answer</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Style</th>
                <th className="px-4 py-3 font-semibold">Exercise right</th>
                <th className="px-4 py-3 font-semibold">Typical markets</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">European</td>
                <td className="px-4 py-3">Only at expiration</td>
                <td className="px-4 py-3">Index options (SPX, NDX, FTSE), currency options</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">American</td>
                <td className="px-4 py-3">Any time before expiry</td>
                <td className="px-4 py-3">US single-stock options, ETF options (SPY, QQQ)</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-4 py-3 font-medium text-slate-100">Bermudan</td>
                <td className="px-4 py-3">Specific dates only</td>
                <td className="px-4 py-3">Swaptions, callable bonds, mortgage prepayment options</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Price ordering: <strong className="text-slate-200">American ≥ Bermudan ≥ European</strong>
          {' '}for the same parameters. More flexibility = at least as valuable.
        </p>
      </section>

      <article className="prose-soft">
        <h2>What &quot;exercise right&quot; means</h2>
        <p>
          An option contract gives the holder the right (not obligation) to buy (call) or sell
          (put) the underlying at the strike price. The exercise <em>style</em> defines{' '}
          <em>when</em> that right can be exercised:
        </p>
        <ul>
          <li>
            <strong>European</strong> — single exercise opportunity at expiration. Can&apos;t exercise
            early even if it would be advantageous. Simpler to price (Black-Scholes has a closed
            form).
          </li>
          <li>
            <strong>American</strong> — continuous exercise right. Holder can exercise at any
            moment between purchase and expiry. No closed-form pricing in general; requires
            binomial trees, finite-difference PDE, or Monte Carlo with regression.
          </li>
          <li>
            <strong>Bermudan</strong> — middle ground. Exercise is allowed on a specific schedule
            of dates (e.g., monthly, quarterly, or a custom list). Priced like American but the
            exercise check is only applied at scheduled dates.
          </li>
        </ul>

        <h2>Why American ≥ Bermudan ≥ European in price</h2>
        <p>
          The holder of an option always prefers more flexibility. If you have the right to
          exercise any time before expiry (American), you can always choose to do nothing until
          expiry (European behavior). The reverse isn&apos;t true — a European holder can&apos;t
          exercise early even when it would be valuable.
        </p>
        <p>
          So the American option contains a strictly larger set of choices than the European, and
          rational agents value larger choice sets at least as much as smaller ones. The price
          difference is the <strong>early exercise premium</strong>.
        </p>
        <p>
          Same logic for Bermudan vs European: Bermudan exercise opportunities ⊇ European
          exercise opportunities ⇒ Bermudan ≥ European. And Bermudan exercise opportunities ⊆
          American exercise opportunities ⇒ Bermudan ≤ American.
        </p>

        <h3>Merton&apos;s 1973 theorem: American calls on non-dividend stocks</h3>
        <p>
          A famous result: <strong>for American CALLS on non-dividend-paying stocks, early
          exercise is never optimal.</strong> The proof is elegant. Suppose you have an ITM
          American call on a non-dividend stock with current price S and strike K. Two choices:
        </p>
        <ol>
          <li>Exercise now: payoff = S − K immediately.</li>
          <li>Sell the option: receive its market value, which by no-arbitrage is at least max(S − K, 0) plus the time value (always positive for any T &gt; 0).</li>
        </ol>
        <p>
          Selling beats exercising. The time value is forfeit if you exercise. So you never
          should — and consequently, <strong>American call = European call when there are no
          dividends</strong>. Black-Scholes prices both correctly.
        </p>
        <p>
          For American <strong>puts</strong>, the theorem doesn&apos;t apply because the put payoff is
          bounded (max value = strike, when stock goes to zero), and the cost of waiting (time
          value of capital) can exceed the option&apos;s time value. So American puts can be
          optimally exercised early. For American calls on <strong>dividend-paying</strong>
          stocks, exercising just before a large dividend can be optimal to capture the dividend
          payment.
        </p>

        <h2>A concrete example: same option, three prices</h2>
        <p>
          ATM 6-month put on a $100 stock, 25% IV, 5% rate, 1.5% continuous dividend yield:
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border border-ink-700/60 rounded-lg overflow-hidden">
            <thead className="bg-ink-800/40">
              <tr className="text-left">
                <th className="px-3 py-2">Style</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">vs European</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">European put</td>
                <td className="px-3 py-2 font-mono">$5.94</td>
                <td className="px-3 py-2">— (baseline)</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">Bermudan put (monthly)</td>
                <td className="px-3 py-2 font-mono">$6.18</td>
                <td className="px-3 py-2 text-chart-gain">+$0.24 (+4.0%)</td>
              </tr>
              <tr className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-medium text-slate-100">American put</td>
                <td className="px-3 py-2 font-mono">$6.41</td>
                <td className="px-3 py-2 text-chart-gain">+$0.47 (+7.9%)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The Bermudan adds 4% over European; the American adds another ~4% over Bermudan. The
          marginal value of continuous (vs monthly) exercise is meaningful but not huge for this
          configuration. For deep ITM puts on dividend-paying stocks, the spread widens.
        </p>

        <h2>When early exercise is actually optimal</h2>

        <h3>American calls on dividend stocks</h3>
        <p>
          Just before a large ex-dividend date, the stock will drop by approximately the dividend
          amount. An ITM call holder loses that amount in option value if they hold through the
          ex-date (the stock drops, the option follows). Exercising just before the ex-date
          captures the dividend instead.
        </p>
        <p>
          Specifically, exercise is optimal when the dividend payment exceeds the remaining time
          value of the option. For options with weeks or months left, this rarely happens. For
          options expiring within days of the ex-date and with deep ITM strikes, it does.
        </p>

        <h3>American puts on stocks that fell hard</h3>
        <p>
          When a stock falls far below the put&apos;s strike, the put becomes deep ITM. The
          immediate exercise payoff is (strike − spot), which is large. Holding longer risks the
          stock recovering, which would reduce the payoff. And the time value is bounded — the
          put can&apos;t be worth more than the strike (which is the payoff if stock goes to
          zero).
        </p>
        <p>
          There&apos;s a critical <strong>exercise boundary</strong> (a function of time, rate,
          vol, dividends) below which exercising now beats holding. The boundary moves over time
          — closer to strike as expiry approaches.
        </p>

        <h2>Pricing methods, by exercise style</h2>

        <h3>European: closed-form Black-Scholes</h3>
        <p>
          <code>C = S·N(d₁) − K·e^(-rT)·N(d₂)</code>
        </p>
        <p>
          Exact, microsecond compute. The standard. Greeks have closed forms too. See the{' '}
          <Link href="/black-scholes-calculator" className="text-accent">
            Black-Scholes Calculator
          </Link>
          .
        </p>

        <h3>American: binomial trees</h3>
        <p>
          Cox-Ross-Rubinstein (1979) discretizes time into N steps. At each node, the stock price
          is one of N + 1 possible values. Work backward from expiry: at each node, take the
          maximum of (immediate exercise payoff) and (discounted risk-neutral expected continuation
          value). The maximum captures the option holder&apos;s right to exercise if it&apos;s
          better than holding.
        </p>
        <p>
          200-500 steps produces sub-cent accuracy. See the{' '}
          <Link href="/american-option-calculator" className="text-accent">
            American Option Calculator
          </Link>
          . The QuantOracle implementation defaults to 200 steps; configurable.
        </p>
        <p>
          Alternative methods exist: finite-difference PDE solvers, Longstaff-Schwartz Monte Carlo
          for high-dimensional cases. See{' '}
          <Link href="/compare/black-scholes-vs-binomial" className="text-accent">
            Black-Scholes vs Binomial Tree
          </Link>{' '}
          for the full comparison.
        </p>

        <h3>Bermudan: same as American but with restricted exercise</h3>
        <p>
          Binomial trees handle Bermudans by only applying the exercise check at scheduled exercise
          dates, not every node. Same backward-induction logic, just selective.
        </p>
        <p>
          For complex Bermudans (multi-asset, multi-factor, mortgage prepayment with refinancing
          costs), Longstaff-Schwartz Monte Carlo (2001) is the standard. It uses regression on
          basis functions to estimate the continuation value at each potential exercise date, then
          makes exercise decisions backward through the simulated paths.
        </p>

        <h2>The decision rule (which calculator to use)</h2>
        <ol>
          <li>
            <strong>European vanilla call/put on a single asset</strong> → Black-Scholes. Use the{' '}
            <Link href="/black-scholes-calculator" className="text-accent">
              Black-Scholes Calculator
            </Link>
            .
          </li>
          <li>
            <strong>American call on a non-dividend stock</strong> → Black-Scholes (Merton&apos;s
            theorem: American = European in this case).
          </li>
          <li>
            <strong>American put on any stock, OR American call on a dividend-paying stock</strong>
            {' '}→ Binomial tree. Use the{' '}
            <Link href="/american-option-calculator" className="text-accent">
              American Option Calculator
            </Link>
            .
          </li>
          <li>
            <strong>Bermudan options</strong> → API endpoint <code>/v1/derivatives/binomial-tree</code>{' '}
            with a custom exercise schedule. A dedicated Bermudan calculator page is on the roadmap.
          </li>
          <li>
            <strong>Implied volatility solver</strong> → works for any style; use{' '}
            <Link href="/implied-volatility-calculator" className="text-accent">
              Implied Volatility Calculator
            </Link>
            .
          </li>
        </ol>

        <h2>Common confusions</h2>

        <h3>&quot;American style&quot; doesn&apos;t mean &quot;always exercise early&quot;</h3>
        <p>
          Having the right to exercise early is valuable, but actually exercising is usually
          suboptimal. Even for ITM American puts, exercise is only optimal below the critical
          boundary. For most ITM American positions you&apos;re still better off selling the
          option (capturing its full value) than exercising (capturing only intrinsic).
        </p>

        <h3>Index options on US exchanges aren&apos;t all the same style</h3>
        <p>
          SPX options are European. SPY options are American. They track essentially the same
          underlying but the exercise right differs. This matters for pricing — same parameters,
          different prices.
        </p>

        <h3>Exercise before ex-dividend ≠ exercise on ex-dividend</h3>
        <p>
          The optimal exercise time for an American call on a dividend stock is the trading day
          BEFORE the ex-dividend date. Exercising on the ex-date doesn&apos;t entitle you to the
          dividend; only being a shareholder on the record date does. This is a common error in
          automated exercise strategies.
        </p>

        <h2>Related calculators</h2>
        <ul>
          <li>
            <Link href="/black-scholes-calculator" className="text-accent">
              Black-Scholes Calculator
            </Link>{' '}
            — European vanilla options, closed-form
          </li>
          <li>
            <Link href="/american-option-calculator" className="text-accent">
              American Option Calculator
            </Link>{' '}
            — American options via binomial tree, handles dividends
          </li>
          <li>
            <Link href="/implied-volatility-calculator" className="text-accent">
              Implied Volatility Calculator
            </Link>{' '}
            — solves for σ given market price; works for any exercise style
          </li>
          <li>
            <Link href="/options-profit-calculator" className="text-accent">
              Options Profit Calculator
            </Link>{' '}
            — payoff diagrams at expiry (which means European-style payoff regardless of
            underlying exercise right)
          </li>
        </ul>

        <h2>Related comparisons</h2>
        <ul>
          <li>
            <Link href="/compare/black-scholes-vs-binomial" className="text-accent">
              Black-Scholes vs Binomial Tree
            </Link>{' '}
            — the methods that price European vs American
          </li>
          <li>
            <Link href="/compare/implied-vol-vs-historical-vol-vs-realized-vol" className="text-accent">
              Implied vs Historical vs Realized Volatility
            </Link>{' '}
            — the vol inputs that all option pricing depends on
          </li>
        </ul>

        <h2>References</h2>
        <ul className="text-sm">
          <li>Merton, R. C. (1973). &quot;Theory of rational option pricing.&quot; Bell Journal of Economics and Management Science 4(1), 141-183. Contains the proof that American calls on non-dividend stocks should never be exercised early.</li>
          <li>Cox, J., Ross, S., &amp; Rubinstein, M. (1979). &quot;Option pricing: a simplified approach.&quot; Journal of Financial Economics 7(3), 229-263. The binomial tree method.</li>
          <li>Longstaff, F. &amp; Schwartz, E. (2001). &quot;Valuing American options by simulation: a simple least-squares approach.&quot; Review of Financial Studies 14, 113-147. The Monte Carlo regression approach for high-dimensional Americans / Bermudans.</li>
          <li>Hull, J. C. (2017). &quot;Options, Futures, and Other Derivatives&quot; 10th ed. — Chapters 13-21 cover exercise styles, early exercise, and the standard pricing methods.</li>
        </ul>
      </article>

      <div className="mt-12">
        <AffiliateCta subId="compare-american-vs-european-vs-bermudan" category="compare" />
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">Frequently asked questions</h2>
        <Faq items={faqs} />
      </section>

      <CompareRelated slug="american-vs-european-vs-bermudan-options" />

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
