import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/privacy',
  title: 'Privacy Policy',
  description:
    'Honest privacy policy for QuantOracle. What we collect (very little), what we don\'t (no email, no accounts, no PII), and your rights under GDPR + CCPA.',
});

const LAST_UPDATED = 'May 14, 2026';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> / Privacy
      </nav>
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-slate-300 text-lg">
          The honest version: we collect very little, we don&apos;t sell anything we do collect, and
          most of what&apos;s here is required disclosure for GDPR/CCPA whether we like it or not.
        </p>
        <p className="mt-3 text-xs text-slate-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft space-y-8">
        <section>
          <h2>The short version</h2>
          <ul>
            <li><strong>No accounts, no emails, no sign-ups</strong> required to use anything on this site.</li>
            <li>We use <strong>Google Analytics 4</strong> (cookies, anonymous usage data) to understand traffic patterns.</li>
            <li>The API at <code>api.quantoracle.dev</code> logs your IP address for rate limiting (1,000 calls/IP/day free tier).</li>
            <li>Calculator inputs you type are sent to the API to compute the result, then discarded — <strong>not stored, not associated with you</strong>.</li>
            <li>We don&apos;t sell any data we collect. We don&apos;t rent it. We don&apos;t have a marketing email list.</li>
          </ul>
        </section>

        <section>
          <h2>What we collect</h2>
          <h3>Via Google Analytics (cookies)</h3>
          <p>
            When you visit quantoracle.dev, Google Analytics 4 sets cookies and tracks:
          </p>
          <ul>
            <li>Pages visited, time on page, navigation flow</li>
            <li>Approximate location (city-level, derived from IP — never stored at the IP level)</li>
            <li>Device type, browser, OS</li>
            <li>Referral source (what site or search engine you came from)</li>
          </ul>
          <p>
            We use this in aggregate to understand which calculators are popular and which content
            performs. We never look at individual users.
          </p>
          <p>
            <strong>To opt out:</strong> use any ad blocker (uBlock Origin, Brave shields, Safari ITP)
            or Google&apos;s{' '}
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" className="text-accent">
              official GA opt-out browser extension
            </a>
            . The site continues to work normally with GA blocked.
          </p>

          <h3>Via the API (IP + request data)</h3>
          <p>
            When the site (or your agent) calls our backend API, the server logs:
          </p>
          <ul>
            <li>IP address (used to enforce the 1,000-calls/IP/day free-tier limit)</li>
            <li>Endpoint called, timestamp, response time</li>
            <li>User-Agent header (to attribute traffic — see e.g. which AI assistant is calling)</li>
            <li>Request body content is processed for the calculation and discarded — not logged, not stored</li>
          </ul>
          <p>
            IP addresses are retained for 90 days for rate-limit enforcement, then auto-deleted. We
            do not associate IPs with names, emails, or any other identifying data because we
            don&apos;t collect those to begin with.
          </p>

          <h3>Via x402 payments (on-chain only)</h3>
          <p>
            If your agent uses a paid composite endpoint, the USDC payment settles on-chain via the
            x402 protocol. The wallet address that signs the payment is publicly visible on the
            blockchain (Base or Solana). QuantOracle records:
          </p>
          <ul>
            <li>Transaction hash</li>
            <li>Payer wallet address</li>
            <li>Endpoint called, amount paid</li>
            <li>Network (Base mainnet or Solana mainnet)</li>
          </ul>
          <p>
            This is the same data the blockchain itself records publicly. We aggregate it for our{' '}
            <a href="https://api.quantoracle.dev/metrics" target="_blank" rel="noopener" className="text-accent">
              public /metrics endpoint
            </a>{' '}
            but never associate it with any off-chain identity.
          </p>
        </section>

        <section>
          <h2>What we don&apos;t collect</h2>
          <ul>
            <li><strong>No email addresses</strong> — we don&apos;t have a signup form or marketing list.</li>
            <li><strong>No names</strong> — there&apos;s nowhere to enter one.</li>
            <li><strong>No phone numbers, no addresses</strong>.</li>
            <li><strong>No financial information</strong> — the API doesn&apos;t accept credit cards. Payment is via on-chain crypto (x402) which is fully wallet-based.</li>
            <li><strong>No fingerprinting</strong> beyond what GA4 collects by default.</li>
            <li><strong>No social media tracking pixels</strong> — no Facebook Pixel, no LinkedIn Insight Tag, none of those.</li>
          </ul>
        </section>

        <section>
          <h2>Third parties</h2>
          <p>The third-party services QuantOracle relies on, and what each receives:</p>
          <ul>
            <li><strong>Google Analytics 4</strong> — usage analytics. Receives cookie-based session data. Subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-accent">Google&apos;s Privacy Policy</a>.</li>
            <li><strong>Cloudflare</strong> — CDN, DDoS protection, and the x402 facilitator. Receives all HTTP requests (IP, headers, body). Subject to <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener" className="text-accent">Cloudflare&apos;s Privacy Policy</a>.</li>
            <li><strong>Vercel</strong> — hosting the quantoracle.dev frontend. Receives standard hosting logs. Subject to <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener" className="text-accent">Vercel&apos;s Privacy Policy</a>.</li>
            <li><strong>DigitalOcean</strong> — hosting the backend API. Standard server logs. Subject to <a href="https://www.digitalocean.com/legal/privacy-policy" target="_blank" rel="noopener" className="text-accent">DigitalOcean&apos;s Privacy Policy</a>.</li>
            <li><strong>Coinbase Developer Platform (CDP)</strong> — x402 payment facilitator on Base mainnet. Receives transaction signing data. Subject to <a href="https://www.coinbase.com/legal/privacy" target="_blank" rel="noopener" className="text-accent">Coinbase&apos;s Privacy Policy</a>.</li>
          </ul>
          <p>
            We don&apos;t share data with these services beyond what&apos;s technically necessary
            for them to perform their function (e.g., Cloudflare needs to see the request to deliver
            it; Vercel needs to see logs to run the site).
          </p>
        </section>

        <section>
          <h2>Cookies</h2>
          <p>The cookies used on quantoracle.dev:</p>
          <ul>
            <li><strong>Google Analytics cookies</strong> (<code>_ga</code>, <code>_ga_*</code>) — anonymous usage tracking, 2-year retention by default, settable to anything from no-track to full tracking via your browser.</li>
            <li><strong>Cloudflare cookies</strong> (<code>__cf_bm</code>, <code>cf_clearance</code>) — bot management and security challenge cookies, set when Cloudflare needs to verify the request isn&apos;t automated abuse.</li>
          </ul>
          <p>
            No advertising cookies. No third-party tracking pixels. If you block all cookies, the
            calculators still work — they don&apos;t depend on client-side storage.
          </p>
        </section>

        <section>
          <h2>Your rights (GDPR, CCPA, et al.)</h2>
          <p>
            If you&apos;re in the EU/UK (GDPR), California (CCPA), or any jurisdiction with similar
            privacy law, you have the right to:
          </p>
          <ul>
            <li><strong>Access</strong> any personal data we hold about you (likely: none, because we don&apos;t collect identifying data)</li>
            <li><strong>Deletion</strong> of any personal data (same caveat — there&apos;s almost nothing to delete)</li>
            <li><strong>Portability</strong> — receive a machine-readable copy</li>
            <li><strong>Opt out of sale</strong> — we don&apos;t sell data, but the right exists</li>
            <li><strong>Withdraw consent</strong> for analytics cookies at any time</li>
          </ul>
          <p>
            To exercise any of these rights, contact us via{' '}
            <a href="https://github.com/QuantOracledev/quantoracle/issues/new" target="_blank" rel="noopener" className="text-accent">
              GitHub Issues
            </a>{' '}
            (a contact email is being set up — see the{' '}
            <Link href="/contact" className="text-accent">contact page</Link> for current channels).
            Be specific about what data you want to access or delete; we&apos;ll respond within 30
            days as required by law.
          </p>
        </section>

        <section>
          <h2>Children</h2>
          <p>
            QuantOracle is not directed at children under 13. We don&apos;t knowingly collect data
            from anyone under 13. If you believe we&apos;ve inadvertently collected data from a
            child, contact us via GitHub Issues and we&apos;ll delete it.
          </p>
        </section>

        <section>
          <h2>Changes to this policy</h2>
          <p>
            We update this page when our data practices change. The change history is visible in
            the{' '}
            <a href="https://github.com/QuantOracledev/quantoracle/commits/main/site/app/privacy" target="_blank" rel="noopener" className="text-accent">
              git commit log for this file
            </a>
            . Material changes are announced via the{' '}
            <Link href="/rss.xml" className="text-accent">QuantOracle RSS feed</Link>.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions or requests:{' '}
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
