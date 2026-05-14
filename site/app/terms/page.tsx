import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/terms',
  title: 'Terms of Service',
  description:
    'Terms of service for QuantOracle. The big disclaimer: outputs are mathematically correct but not financial advice; you\'re responsible for your own trades; the free API is governed by usage rules.',
});

const LAST_UPDATED = 'May 14, 2026';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> / Terms
      </nav>
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-4 text-slate-300 text-lg">
          The short version: use it freely, don&apos;t abuse the free API, and remember the
          calculator outputs are math — not financial advice. Full terms below.
        </p>
        <p className="mt-3 text-xs text-slate-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft space-y-8">
        <section>
          <h2>1. Acceptance of terms</h2>
          <p>
            By using quantoracle.dev (the &quot;Site&quot;) or api.quantoracle.dev (the &quot;API&quot;), you
            agree to these terms. If you don&apos;t agree, don&apos;t use the Site or API.
          </p>
        </section>

        <section>
          <h2>2. What QuantOracle provides</h2>
          <p>
            QuantOracle is a free toolkit that provides:
          </p>
          <ul>
            <li>15 interactive quant finance calculators on the Site, free for human use</li>
            <li>An HTTP API with 63 calculator endpoints + 10 paid composite endpoints</li>
            <li>Free tier: 1,000 calls per IP per day, no signup or API key required</li>
            <li>Paid tier: per-call USDC payments via x402 on Base or Solana for usage beyond the free tier or for paid composite endpoints</li>
            <li>Open-source integrations (LangChain, Coinbase AgentKit, MCP server)</li>
            <li>Editorial content (comparison articles, tutorials, technical documentation)</li>
          </ul>
        </section>

        <section>
          <h2>3. THE BIG DISCLAIMER — Not financial advice</h2>
          <p>
            <strong>This is the most important section. Read it.</strong>
          </p>
          <p>
            QuantOracle outputs are <strong>mathematical computations</strong>. They are correct
            within the assumptions of the underlying models (Black-Scholes, Kelly Criterion, Monte
            Carlo, etc.) and verified against 120 published-textbook benchmarks. <strong>They are
            not financial advice.</strong>
          </p>
          <p>Specifically:</p>
          <ul>
            <li>
              <strong>Calculator outputs depend on your inputs.</strong> Garbage in, garbage out. If
              your volatility estimate is wrong, your Black-Scholes price will be wrong. The calculator
              has no way to know that.
            </li>
            <li>
              <strong>Model assumptions can be wrong for your situation.</strong> Black-Scholes assumes
              log-normal returns. Real markets have fat tails. Kelly assumes you know your true edge.
              You usually don&apos;t. The calculator returns the formula-correct answer; it
              can&apos;t tell you whether the formula applies.
            </li>
            <li>
              <strong>Past performance doesn&apos;t predict future returns.</strong> Backtests and
              Monte Carlo projections are scenarios, not forecasts.
            </li>
            <li>
              <strong>You are responsible for any decisions you make using these tools.</strong> The
              operator of QuantOracle is not your financial advisor, broker, or fiduciary.
            </li>
          </ul>
          <p>
            If you are trading real money based on QuantOracle outputs, you should consult a
            licensed financial advisor, understand the underlying math yourself, and accept that
            <strong> you alone bear the risk of your trades</strong>.
          </p>
        </section>

        <section>
          <h2>4. No warranty</h2>
          <p>
            QuantOracle is provided <strong>&quot;as is&quot;</strong> with no warranty of any kind,
            express or implied. We don&apos;t warrant that:
          </p>
          <ul>
            <li>The Site or API will be available at any specific time (no uptime SLA on the free tier)</li>
            <li>Calculations will be appropriate for your specific use case</li>
            <li>The Site or API will be free of bugs or errors</li>
            <li>Any specific financial outcome will result from using the tools</li>
          </ul>
          <p>
            We test the math against textbook values (the{' '}
            <a href="https://github.com/QuantOracledev/quantoracle/blob/main/tests/accuracy_benchmarks.py" target="_blank" rel="noopener" className="text-accent">accuracy_benchmarks.py</a>
            {' '}suite has 120 verified tests). If you find a bug,{' '}
            <a href="https://github.com/QuantOracledev/quantoracle/issues/new" target="_blank" rel="noopener" className="text-accent">file an issue</a>
            {' '}and we&apos;ll fix it. But there&apos;s no guarantee.
          </p>
        </section>

        <section>
          <h2>5. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, the operator of QuantOracle is <strong>not
            liable for any damages</strong> arising from use of the Site or API, including:
          </p>
          <ul>
            <li>Trading losses, missed opportunities, or any other financial losses</li>
            <li>Data loss</li>
            <li>Service interruptions</li>
            <li>Consequential, incidental, or punitive damages</li>
          </ul>
          <p>
            If a court finds this limitation unenforceable, the operator&apos;s total aggregate
            liability is limited to <strong>the amount you paid to QuantOracle in the 12 months
            preceding the claim</strong>. For free-tier users, that&apos;s zero. For x402 paid
            users, that&apos;s the sum of the USDC settlements your wallet sent us.
          </p>
        </section>

        <section>
          <h2>6. Acceptable use</h2>
          <p>The following are prohibited:</p>
          <ul>
            <li><strong>Abuse of the free tier.</strong> Don&apos;t try to evade the 1,000/IP/day limit via rotating IPs, proxies, or distributed scrapers. We will rate-limit or IP-block abusers.</li>
            <li><strong>Resale of free-tier output as a paid service.</strong> If you want to build a paid product on top of QuantOracle, use the paid tier — it&apos;s priced at $0.002-$0.10/call specifically so you can resell at a markup.</li>
            <li><strong>Denial of service.</strong> No coordinated traffic attacks, no oversized requests intended to consume server resources.</li>
            <li><strong>Misrepresentation.</strong> Don&apos;t claim QuantOracle endorses any specific trading strategy, fund, or product. We don&apos;t.</li>
            <li><strong>Reverse engineering / cloning the math + reselling without attribution.</strong> The API outputs themselves aren&apos;t copyrighted (mathematical formulas can&apos;t be), but copying the entire API surface to compete on price is bad form. We&apos;d prefer you contribute upstream.</li>
          </ul>
          <p>
            Violations may result in IP blocks, rate-limit reduction, or being added to a public
            list of bad actors. Severe abuse may result in legal action.
          </p>
        </section>

        <section>
          <h2>7. x402 paid endpoints</h2>
          <p>
            Paid composite endpoints settle via the x402 protocol. Specific terms:
          </p>
          <ul>
            <li>Pricing is per-call and on-chain. You see the price quote before signing.</li>
            <li>Settlement is final once on-chain confirmation occurs. No refunds for changing your mind after settlement.</li>
            <li>If the API errors before returning data, settlement does not occur (this is enforced at the protocol level, not our discretion).</li>
            <li>The x402 protocol and the Coinbase CDP facilitator are third parties. QuantOracle is not responsible for blockchain issues (e.g., chain forks, facilitator downtime).</li>
          </ul>
          <p>
            Detailed pricing is at <Link href="/pricing" className="text-accent">/pricing</Link>.
          </p>
        </section>

        <section>
          <h2>8. Intellectual property</h2>
          <p>
            The source code of QuantOracle is open source (MIT license) and available at{' '}
            <a href="https://github.com/QuantOracledev/quantoracle" target="_blank" rel="noopener" className="text-accent">
              github.com/QuantOracledev/quantoracle
            </a>
            . The mathematical formulas implemented are not copyrightable; the specific implementation
            and documentation are licensed under MIT terms.
          </p>
          <p>
            The QuantOracle name and logo are not licensed for commercial use without permission. If
            you fork the code, please don&apos;t market your fork as &quot;QuantOracle.&quot;
          </p>
        </section>

        <section>
          <h2>9. Affiliate links</h2>
          <p>
            Some links on the Site are affiliate links — when you click them and complete a purchase
            on the destination site, QuantOracle may earn a commission. These are always clearly
            marked with a <strong>Sponsored</strong> badge and use the <code>rel=&quot;sponsored
            nofollow noopener&quot;</code> HTML attributes. Full details at{' '}
            <Link href="/affiliate-disclosure" className="text-accent">/affiliate-disclosure</Link>.
          </p>
        </section>

        <section>
          <h2>10. Privacy</h2>
          <p>
            Data we collect and how we use it is described at{' '}
            <Link href="/privacy" className="text-accent">/privacy</Link>. The short version: we
            collect very little, we don&apos;t sell what we do collect, and there&apos;s no signup.
          </p>
        </section>

        <section>
          <h2>11. Changes to these terms</h2>
          <p>
            We may update these terms at any time. Material changes are announced via the{' '}
            <Link href="/rss.xml" className="text-accent">QuantOracle RSS feed</Link>. The change
            history is visible in{' '}
            <a href="https://github.com/QuantOracledev/quantoracle/commits/main/site/app/terms" target="_blank" rel="noopener" className="text-accent">
              git
            </a>
            . Continued use after material changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2>12. Governing law</h2>
          <p>
            These terms are governed by the laws of the operator&apos;s primary jurisdiction. Any
            disputes will be resolved in the courts of that jurisdiction. If you&apos;re a consumer
            in a jurisdiction with mandatory consumer-protection law, those laws apply to the
            extent they cannot be waived by contract.
          </p>
        </section>

        <section>
          <h2>13. Contact</h2>
          <p>
            Questions about these terms:{' '}
            <a href="https://github.com/QuantOracledev/quantoracle/issues/new" target="_blank" rel="noopener" className="text-accent">
              GitHub Issues
            </a>
            . See the{' '}
            <Link href="/contact" className="text-accent">contact page</Link> for current channels.
          </p>
        </section>
      </article>
    </div>
  );
}
