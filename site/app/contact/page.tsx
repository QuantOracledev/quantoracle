import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/contact',
  title: 'Contact',
  description:
    'How to reach QuantOracle. GitHub Issues is the primary channel — fastest path for bug reports, feature requests, and questions. A dedicated business email is being set up.',
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> / Contact
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Contact</h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          We&apos;re a small team and prefer async channels. GitHub Issues is the fastest path for
          most things.
        </p>
      </header>

      <div className="space-y-6">
        {/* Primary: GitHub */}
        <div className="rounded-lg border border-accent/30 bg-accent/[0.04] p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/30 rounded px-2 py-0.5">
              Primary
            </span>
            <h2 className="text-lg font-semibold text-slate-100">GitHub Issues</h2>
          </div>
          <p className="text-sm text-slate-300 mb-3">
            The right place for most things: bug reports, feature requests, questions about
            integration, requests for new calculators or endpoints, math errors in the
            calculators, anything that benefits from being public and searchable.
          </p>
          <a
            href="https://github.com/QuantOracledev/quantoracle/issues/new"
            target="_blank"
            rel="noopener"
            className="btn-primary inline-block"
          >
            Open an issue →
          </a>
          <p className="mt-3 text-xs text-slate-500">
            Typical response time: same day for clear bugs, 1-3 days for feature requests.
          </p>
        </div>

        {/* Business inquiries */}
        <div className="rounded-lg border border-ink-700/60 p-5">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">Business inquiries</h2>
          <p className="text-sm text-slate-300 mb-3">
            Partnerships, enterprise API access, custom endpoints, sponsorship opportunities, or
            anything that doesn&apos;t belong in a public issue thread.
          </p>
          <p className="text-sm text-slate-400">
            A dedicated business email (<code>contact@quantoracle.dev</code>) is being set up.
            Until then, please file a GitHub Issue with the title prefix <code>[business]</code>{' '}
            and we&apos;ll route it appropriately, or DM via the GitHub organization profile.
          </p>
        </div>

        {/* Security */}
        <div className="rounded-lg border border-ink-700/60 p-5">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">Security disclosures</h2>
          <p className="text-sm text-slate-300 mb-3">
            For security vulnerabilities (API issues, authentication bypasses, data exposure),
            please use GitHub&apos;s private security advisory feature rather than a public issue.
          </p>
          <a
            href="https://github.com/QuantOracledev/quantoracle/security/advisories/new"
            target="_blank"
            rel="noopener"
            className="btn-ghost inline-block"
          >
            Report a vulnerability →
          </a>
          <p className="mt-3 text-xs text-slate-500">
            We treat security reports with priority and acknowledge within 24 hours.
          </p>
        </div>

        {/* Press / media */}
        <div className="rounded-lg border border-ink-700/60 p-5">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">Press &amp; media</h2>
          <p className="text-sm text-slate-300 mb-3">
            For media coverage, interviews, or content syndication: open a GitHub Issue with the
            title prefix <code>[press]</code>. We&apos;ll respond with a usable contact channel.
          </p>
        </div>

        {/* What we don't offer */}
        <div className="rounded-lg border border-ink-700/40 p-5 bg-ink-800/20">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
            What we don&apos;t offer
          </h2>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>• No live chat or phone support — we&apos;re a small team</li>
            <li>• No DMs on Twitter / X (the @quantoracle handle doesn&apos;t exist yet)</li>
            <li>• No paid customer support tier — the API has no auth layer to attach an SLA to</li>
            <li>• No financial advice. See <Link href="/terms" className="text-accent">/terms</Link>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
