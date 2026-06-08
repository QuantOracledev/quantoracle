import Link from 'next/link';
import { CALCULATORS } from '@/lib/calculators';

/**
 * Calculators featured above the full grid. Ranked by 30-day engagement-
 * time data from GA4 (May 2026): these three pages account for the bulk
 * of total on-site reading time and each has 83-100% engagement rates.
 * Update from time to time as the data shifts.
 */
const FEATURED_SLUGS = [
  'black-scholes-calculator',
  'american-option-calculator',
  'monte-carlo-simulation-calculator',
] as const;
import { organizationJsonLd } from '@/lib/seo';

// WebSite + SearchAction JSON-LD — tells Google we're a structured site
// (sometimes shows a sitelinks search box in SERPs).
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'QuantOracle',
  url: 'https://quantoracle.dev',
  description:
    'Free quant finance calculators and a deterministic API for AI agents. 15 calculators, 73 endpoints plus a /batch endpoint for bulk computation, 120 verified accuracy benchmarks.',
};

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Organization + WebSite JSON-LD for E-E-A-T at the homepage level */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [organizationJsonLd(), websiteJsonLd],
          }),
        }}
      />

      {/* Hero */}
      <section className="py-16 sm:py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Free quant finance calculators,{' '}
          <span className="text-accent">backed by a real API</span>.
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-lg text-slate-300">
          Black-Scholes, Kelly, VaR, crypto liquidation, and more — calculated by the same
          deterministic engine that prices options for autonomous AI agents. No signup, no API key.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="#calculators" className="btn-primary">
            Browse calculators
          </Link>
          <Link href="/api-docs" className="btn-ghost">
            For developers →
          </Link>
        </div>
      </section>

      {/* QuantOracle Live — slim, dev-facing announcement of the new live-data tier.
          Kept to a single understated line so it doesn't compete with the calculator
          hero; reuses the existing card + badge tokens to stay on-brand. */}
      <section className="pb-8">
        <Link
          href="/writing/live-crypto-data-for-agents"
          className="group flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/[0.03] px-4 py-3 text-sm hover:border-accent/40 transition"
        >
          <span className="text-[10px] uppercase tracking-wider bg-accent/15 text-accent px-2 py-0.5 rounded shrink-0">
            New
          </span>
          <span className="text-slate-300">
            <strong className="text-slate-100">QuantOracle Live</strong> — real-time crypto
            volatility &amp; funding rates for agents, fetched and computed in one call.
          </span>
          <span className="text-accent ml-auto shrink-0 transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </section>

      {/* Featured calculators — surfaced based on GA4 (May 2026) showing
          these three pages drive 4-10 minute engaged sessions, 83-100%
          engagement rates, and the bulk of total on-site engagement time.
          Treating all 15 calculators equally in a flat grid was burying
          the wins — this row makes them the front door. */}
      <section className="pb-8">
        <h2 className="text-xl font-semibold mb-4">Most-used calculators</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURED_SLUGS.map((slug) => {
            const c = CALCULATORS.find((x) => x.slug === slug);
            if (!c) return null;
            return (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="card hover:border-accent/40 transition border-accent/20 bg-accent/[0.03]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wide text-accent">{c.category}</span>
                  <span className="text-[10px] uppercase tracking-wider bg-accent/15 text-accent px-2 py-0.5 rounded">
                    Featured
                  </span>
                </div>
                <h3 className="text-base font-semibold mb-1 leading-snug">{c.title}</h3>
                <p className="text-sm text-slate-300 mb-3">{c.short}</p>
                <div className="text-xs text-slate-500 font-mono">{c.endpoint}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Calculators index — full grid (incl. the featured three). */}
      <section id="calculators" className="pb-16 scroll-mt-16">
        <h2 className="text-2xl font-semibold mb-6">All calculators</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CALCULATORS.map((c) => {
            const isLive = c.status === 'live';
            return (
              <CalculatorCard key={c.slug} calc={c} isLive={isLive} />
            );
          })}
        </div>
      </section>

      {/* Why this exists */}
      <section className="pb-20 max-w-3xl mx-auto prose-soft">
        <h2>Why these calculators?</h2>
        <p>
          Every quant finance tool on the open web is either: (a) an ad-cluttered relic of 2007 with a
          form that takes 10 seconds to render, or (b) trapped behind a $99/mo paywall on a Bloomberg
          terminal. We built a fast, free alternative — and we mean fast: every calculator returns in
          under 70 ms because the math runs on the same{' '}
          <a href="https://api.quantoracle.dev/openapi.json">73-endpoint deterministic API</a>{' '}
          we built for AI agents.
        </p>
        <p>
          You don&apos;t need to know what x402 micropayments or A2A AgentCards are to use these
          calculators. They&apos;re free for humans, full stop. If you&apos;re a developer and want
          to embed any of this math in your own app, the <Link href="/api-docs">API docs</Link> are a
          click away — first 1,000 calls/IP/day are free, no signup, and{' '}
          <Link href="/pricing">paid composite workflows</Link> start at $0.015 USDC via x402 when
          you need a full risk audit or hedge recommendation in one call.
        </p>
      </section>
    </div>
  );
}

function CalculatorCard({
  calc,
  isLive,
}: {
  calc: (typeof CALCULATORS)[number];
  isLive: boolean;
}) {
  const inner = (
    <div className="card h-full hover:border-accent/40 transition">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wide text-slate-500">{calc.category}</span>
        {isLive ? (
          <span className="text-[10px] uppercase tracking-wider bg-accent/15 text-accent px-2 py-0.5 rounded">
            Live
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-wider bg-ink-800 text-slate-500 px-2 py-0.5 rounded">
            Soon
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold mb-1 leading-snug">{calc.title}</h3>
      <p className="text-sm text-slate-400 mb-3">{calc.short}</p>
      <div className="text-xs text-slate-500 font-mono">{calc.endpoint}</div>
    </div>
  );
  return isLive ? (
    <Link href={`/${calc.slug}`} className="block">
      {inner}
    </Link>
  ) : (
    <div className="opacity-60 cursor-not-allowed">{inner}</div>
  );
}
