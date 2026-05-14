import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/affiliate-disclosure',
  title: 'Affiliate Disclosure & How We Make Money',
  description:
    'Honest disclosure of how QuantOracle generates revenue: TradingView affiliate links, x402 API micropayments, and (eventually) display ads. Required by FTC; written to be useful rather than legalistic.',
  keywords: ['affiliate disclosure', 'quantoracle revenue', 'how quantoracle makes money'],
});

const LAST_UPDATED = 'May 14, 2026';

export default function AffiliateDisclosurePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>{' '}
        / Affiliate Disclosure
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Affiliate Disclosure &amp; How We Make Money
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          The page that exists because the FTC says it should, written so it&apos;s actually
          useful. Here&apos;s exactly how QuantOracle makes money and what that means for you as
          a user.
        </p>
        <p className="mt-3 text-xs text-slate-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft space-y-8">
        <section>
          <h2>The short version</h2>
          <p>
            QuantOracle is <strong className="text-slate-200">free to use</strong>. You don&apos;t
            pay anything for the 15 calculators on this site, the 1,000 free API calls per IP per
            day, the open-source integrations (LangChain, AgentKit, MCP), or any of the
            documentation. We&apos;d like to keep it that way.
          </p>
          <p>To do that, we have three revenue sources:</p>
          <ol>
            <li>
              <strong>TradingView affiliate links</strong> — we earn a commission if you sign up
              for TradingView Pro through a link on our site. Doesn&apos;t cost you anything extra.
            </li>
            <li>
              <strong>x402 micropayments</strong> on paid API endpoints — agents and automated
              systems that exceed the free tier pay per call in USDC. Humans don&apos;t pay; only
              programmatic high-volume users do.
            </li>
            <li>
              <strong>Display ads</strong> — not currently active. May add Google AdSense in the
              future to support the calculator content. If we do, we&apos;ll mark them clearly.
            </li>
          </ol>
          <p>
            That&apos;s the whole picture. No data sales, no email lists for rent, no upsell to a
            secret premium tier.
          </p>
        </section>

        <section>
          <h2>TradingView affiliate program (active)</h2>
          <p>
            We&apos;re a member of the{' '}
            <a
              href="https://www.tradingview.com/?aff_id=166298"
              target="_blank"
              rel="sponsored nofollow noopener"
              className="text-accent"
            >
              TradingView affiliate program
            </a>
            . If you click a sponsored TradingView link on this site and subsequently sign up for a
            TradingView paid plan, TradingView pays us a commission — usually a percentage of your
            first-year subscription.
          </p>
          <p>
            <strong className="text-slate-200">What this means for you:</strong>
          </p>
          <ul>
            <li>The price you pay for TradingView is exactly the same whether you click our link or go directly.</li>
            <li>You don&apos;t share any extra data with us by clicking the link — it&apos;s a standard affiliate parameter (<code>aff_id=166298</code>) that TradingView uses to track the referral.</li>
            <li>We earn nothing if you don&apos;t convert to a paid plan. The link is just a tracking parameter.</li>
          </ul>
          <p>
            <strong className="text-slate-200">Where you&apos;ll see these links:</strong>
          </p>
          <ul>
            <li>The <em>Sponsored</em> CTA card at the bottom of every calculator page</li>
            <li>The <em>Sponsored</em> CTA card at the bottom of comparison articles (<Link href="/compare" className="text-accent">/compare</Link>)</li>
            <li>Always clearly labeled with a <strong>Sponsored</strong> badge and tagged with the appropriate <code>rel=&quot;sponsored nofollow noopener&quot;</code> attributes (HTML standards-compliant disclosure)</li>
          </ul>
          <p>
            <strong className="text-slate-200">Why TradingView specifically?</strong> Because
            it&apos;s the chart platform most of our audience actually uses. We don&apos;t promote
            tools we wouldn&apos;t personally use, and the affiliate fits all our user
            categories — options traders, crypto traders, equity quants, and general chartists.
            We may add other affiliate partners in the future (e.g., Coinbase, IBKR) if they fit
            the audience as cleanly.
          </p>
        </section>

        <section>
          <h2>x402 micropayments on the API (active)</h2>
          <p>
            QuantOracle&apos;s API at <code>api.quantoracle.dev</code> uses the{' '}
            <a
              href="https://github.com/coinbase/x402"
              target="_blank"
              rel="noopener"
              className="text-accent"
            >
              x402 protocol
            </a>{' '}
            for paid endpoints. This is a programmatic revenue source aimed at AI agents and
            automated systems, not humans. Specifics at <Link href="/pricing" className="text-accent">/pricing</Link>.
          </p>
          <p>
            <strong className="text-slate-200">Who pays:</strong>
          </p>
          <ul>
            <li><strong>Free tier (everyone):</strong> 1,000 API calls per IP per day, all 63 calculator endpoints. No payment ever required. This covers all human use of the calculators and most agent use.</li>
            <li><strong>Paid tier (high-volume agents):</strong> When an IP exceeds 1,000/day, individual calls are priced $0.002–$0.10 USDC. Payment settles via x402 on Base or Solana mainnets through the calling wallet — no API key, no account, no signup.</li>
            <li><strong>Paid composites (anyone using them):</strong> 10 multi-step endpoints (e.g. <code>risk/full-analysis</code>, <code>hedging/recommend</code>) are priced at $0.04–$0.10 USDC each. These bundle 5-15 underlying calculations and are designed for agent workflows.</li>
          </ul>
          <p>
            All x402 settlements are on-chain and publicly visible. We publish aggregate
            settlement data at{' '}
            <a
              href="https://api.quantoracle.dev/metrics"
              target="_blank"
              rel="noopener"
              className="text-accent"
            >
              api.quantoracle.dev/metrics
            </a>
            .
          </p>
        </section>

        <section>
          <h2>Display ads (not currently active)</h2>
          <p>
            We are <em>considering</em> adding Google AdSense or a similar display-ad network to
            help offset the cost of the free calculators. As of {LAST_UPDATED}, no display ads
            are running.
          </p>
          <p>If/when we add display ads, we&apos;ll:</p>
          <ul>
            <li>Mark ad slots clearly so you can distinguish them from editorial content</li>
            <li>Keep ad density low — we&apos;d rather under-monetize than make the site annoying</li>
            <li>Disclose the addition in our commit history and update this page</li>
            <li>Not add interstitials, pop-ups, autoplay video, or anything else that degrades the calculator experience</li>
          </ul>
        </section>

        <section>
          <h2>What we&apos;ll never do</h2>
          <ul>
            <li><strong>Sell user data.</strong> We don&apos;t collect personal data to begin with — calculator inputs are processed and discarded, no accounts, no email collection.</li>
            <li><strong>Rent email lists.</strong> We don&apos;t have an email list.</li>
            <li><strong>Add affiliate parameters to outbound links that aren&apos;t marked Sponsored.</strong> If a link on this site isn&apos;t clearly labeled, it&apos;s editorial — we get no commission either way.</li>
            <li><strong>Promote tools we don&apos;t personally use.</strong> The affiliate has to pass the &quot;would we recommend this anyway&quot; test before it goes on the site.</li>
            <li><strong>Hide the disclosure.</strong> This page is linked from every Sponsored CTA, listed in the sitemap, and submitted to search engines. It&apos;s meant to be findable.</li>
          </ul>
        </section>

        <section>
          <h2>FTC / regulatory context</h2>
          <p>
            The U.S. Federal Trade Commission requires affiliate relationships to be clearly
            disclosed when content reasonably appears editorial. Our setup:
          </p>
          <ul>
            <li>Every TradingView affiliate link is rendered inside a card with a visible <strong>Sponsored</strong> badge.</li>
            <li>The HTML <code>rel</code> attribute on each affiliate link includes <code>sponsored nofollow noopener</code> — the standard machine-readable disclosure (per <a href="https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links" target="_blank" rel="noopener" className="text-accent">Google&apos;s guidance</a>).</li>
            <li>Disclosure text appears in the same card as the link (&quot;QuantOracle earns a commission if you sign up via this link. Doesn&apos;t cost you extra.&quot;).</li>
            <li>This page exists as the comprehensive disclosure, linked from every affiliate CTA and listed in our sitemap.</li>
          </ul>
          <p>
            If you find any affiliate link on this site that isn&apos;t properly disclosed,
            please <a href="https://github.com/QuantOracledev/quantoracle/issues" target="_blank" rel="noopener" className="text-accent">file an issue</a> and we&apos;ll fix it the same day.
          </p>
        </section>

        <section>
          <h2>How you can support QuantOracle (without paying)</h2>
          <p>If you find the site useful and want to support it without spending money:</p>
          <ul>
            <li><strong>Use the calculators.</strong> Engagement signals (time on page, multiple pages visited) help our SEO, which brings more users.</li>
            <li><strong>Star the GitHub repo</strong> at <a href="https://github.com/QuantOracledev/quantoracle" target="_blank" rel="noopener" className="text-accent">github.com/QuantOracledev/quantoracle</a>. GitHub stars factor into discoverability across the ecosystem (npm, MCP registries, awesome-lists).</li>
            <li><strong>Share specific posts.</strong> The <Link href="/compare" className="text-accent">comparison articles</Link> and <Link href="/writing" className="text-accent">long-form writing</Link> rank better when they get linked from other sites, social posts, or community recommendations.</li>
            <li><strong>Tell us when something&apos;s wrong.</strong> <a href="https://github.com/QuantOracledev/quantoracle/issues" target="_blank" rel="noopener" className="text-accent">GitHub Issues</a> is the fastest way to reach us.</li>
          </ul>
          <p>If you want to pay, the most direct way is to use one of our paid composite API endpoints (see <Link href="/pricing" className="text-accent">/pricing</Link>) or sign up for TradingView Pro through one of the Sponsored links if you were going to do that anyway.</p>
        </section>

        <section>
          <h2>Changes to this page</h2>
          <p>
            We update this page whenever our monetization changes. The change history is visible
            in our <a href="https://github.com/QuantOracledev/quantoracle/commits/main/site/app/affiliate-disclosure" target="_blank" rel="noopener" className="text-accent">git commit log for this file</a>. The page itself shows the &quot;Last updated&quot; date at the top.
          </p>
          <p>
            If we ever materially change the revenue model (e.g., add a subscription tier, sell
            data, change the free tier limits), it&apos;ll be reflected here first and
            announced via the <Link href="/rss.xml" className="text-accent">RSS feed</Link>.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about anything on this page: <a href="https://github.com/QuantOracledev/quantoracle/issues" target="_blank" rel="noopener" className="text-accent">open an issue on GitHub</a>. We&apos;re responsive there.
          </p>
        </section>
      </article>
    </div>
  );
}
