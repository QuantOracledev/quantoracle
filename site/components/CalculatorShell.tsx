import Link from 'next/link';
import type { ReactNode } from 'react';
import { AdSlot } from './AdSlot';
import { AffiliateCta } from './AffiliateCta';
import { getRelated, getCalculator } from '@/lib/calculators';
import { getCrossLinks, getCompositeUpsell } from '@/lib/calculator-cross-links';
import { howToJsonLd, organizationJsonLd, breadcrumbJsonLd } from '@/lib/seo';

interface Props {
  slug: string;
  title: string;
  subtitle: string;
  /** The actual calculator UI (left column on desktop). */
  inputs: ReactNode;
  /** The result display (right column on desktop). */
  results: ReactNode;
  /** Plain-English interpretation of the current result. */
  interpretation?: ReactNode;
  /** Hand-written FAQ section (for SEO + user education). */
  faq: ReactNode;
  /**
   * Array of Schema.org objects to emit as JSON-LD. CalculatorShell wraps
   * them in a single `<script type="application/ld+json">` tag as a valid
   * JSON array. Each object should be a result of faqJsonLd/calculatorJsonLd
   * from lib/seo.ts.
   */
  jsonLd: object[];
  /** Markup for the long-form explainer rendered below the FAQ. */
  longform?: ReactNode;
}

export function CalculatorShell({
  slug,
  title,
  subtitle,
  inputs,
  results,
  interpretation,
  faq,
  jsonLd,
  longform,
}: Props) {
  const related = getRelated(slug, 3);
  const { compare: compareLinks, writing: writingLinks } = getCrossLinks(slug);
  const composite = getCompositeUpsell(slug);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <header className="max-w-3xl mb-8">
        <nav className="text-xs text-slate-500 mb-3">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>{' '}
          /{' '}
          <Link href="/#calculators" className="hover:text-accent">
            Calculators
          </Link>
        </nav>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-slate-300">{subtitle}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">{inputs}</div>
        <div className="lg:col-span-3 space-y-4">
          {results}
          {interpretation && (
            <div className="card border-accent/20">
              <div className="text-xs uppercase tracking-wider text-accent mb-2">
                What does this mean?
              </div>
              <div className="text-sm text-slate-300 leading-relaxed">{interpretation}</div>
            </div>
          )}
        </div>
      </div>

      {/* Affiliate CTA — single full-width slot. The 'premium tier' placeholder
          card was removed because it advertised a product that doesn't exist
          yet, which was a trust-eroding 'coming soon' dead pixel. Add it back
          (or replace with email-capture for the waitlist) when the premium
          product is real. */}
      <div className="mt-8">
        <AffiliateCta subId={slug} />
      </div>

      {/* AD SLOT 1 — post-result, highest-CTR position. Renders nothing until
          NEXT_PUBLIC_ADSENSE_CLIENT is configured; renders a dashed placeholder
          if NEXT_PUBLIC_AD_SLOTS_VISIBLE=true so you can see the layout. */}
      <AdSlot slot="POST_RESULT" format="responsive" className="max-w-3xl" />

      {/* FAQ */}
      <section className="mt-16 max-w-3xl">
        <h2 className="text-2xl font-semibold mb-4">Frequently asked questions</h2>
        {faq}
      </section>

      {/* Long-form explainer — boosts word count for SEO and serves real users who want depth */}
      {longform && (
        <section className="mt-16 max-w-3xl prose-soft">
          {longform}
          {/* AD SLOT 2 — mid-longform. Lower CTR than slot 1 but reaches engaged readers. */}
          <AdSlot slot="MID_LONGFORM" format="responsive" />
        </section>
      )}

      {/* Compare — head-to-head explainers covering the same concept.
          Surfaced here because GA4 (May 2026) shows /compare/* articles
          get 100% engagement rate when found but were getting near-zero
          discovery surface. Calculator pages have 4-10 min engaged
          sessions — exactly the captive audience that benefits most. */}
      {compareLinks.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-semibold mb-1">Compare approaches</h2>
          <p className="text-sm text-slate-500 mb-4">
            Head-to-head breakdowns of how this method compares to alternatives — when each one
            is right and when each one lies.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {compareLinks.map((c) => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="card hover:border-accent/40 transition"
              >
                <div className="text-xs uppercase tracking-wide text-accent mb-1">Compare</div>
                <div className="font-semibold text-sm mb-1">{c.title}</div>
                <div className="text-xs text-slate-400">{c.what}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Build with this — tutorials on wiring this endpoint into an
          AI agent. Same GA4 motivation: tutorials had 0 organic traffic
          in 30 days because nothing linked to them. Calc-page audiences
          are exactly the developer reader who'd integrate this. */}
      {writingLinks.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-1">Build this into your agent</h2>
          <p className="text-sm text-slate-500 mb-4">
            The same calculation, exposed as a deterministic tool for AI agents — tutorials on
            wiring it up via the QuantOracle API.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {writingLinks.map((w) => (
              <Link
                key={w.slug}
                href={`/writing/${w.slug}`}
                className="card hover:border-accent/40 transition"
              >
                <div className="text-xs uppercase tracking-wide text-accent mb-1">Tutorial</div>
                <div className="font-semibold text-sm mb-1">{w.title}</div>
                <div className="text-xs text-slate-400">{w.what}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Developer/agent bridge — converts the human calculator audience toward
          the agentic revenue surface. Composite-aware (2026-05-31 funnel work):
          when a calculator has a natural "pro version" composite, pitch that
          SPECIFIC endpoint ("the VaR user wants risk/full-analysis") instead of
          a generic pricing link — the free calculator is the funnel, the paid
          composite is the product. Falls back to the generic API bridge for
          calcs without a clean composite fit. */}
      <section className="mt-12">
        {composite ? (
          <div className="card border-accent/30 bg-accent/[0.05] border-l-4 border-l-accent">
            <div className="sm:flex sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-accent mb-1">
                  Doing this for real? The composite does more
                </div>
                <h2 className="text-lg font-semibold mb-1">
                  <code className="text-accent">{composite.endpoint}</code>{' '}
                  <span className="text-slate-400 font-normal text-sm">— {composite.price} USDC / call</span>
                </h2>
                <p className="text-sm text-slate-300 max-w-xl">{composite.pitch}</p>
                <p className="text-xs text-slate-500 mt-2">
                  One paid call instead of chaining many. Settles automatically via x402 on Base or
                  Solana — no API key, no signup. The 73 calculator endpoints stay free (1,000/day).
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex shrink-0 gap-2">
                <Link href="/pricing" className="btn-primary whitespace-nowrap">
                  See pricing
                </Link>
                <Link href="/api-docs" className="btn-ghost whitespace-nowrap">
                  API docs →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="card border-accent/20 bg-accent/[0.03] sm:flex sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-accent mb-1">
                Building something?
              </div>
              <h2 className="text-lg font-semibold mb-1">Call this from your own code or agent</h2>
              <p className="text-sm text-slate-300 max-w-xl">
                This calculator runs on the QuantOracle API — 73 endpoints, deterministic, the same
                math AI agents call directly. First 1,000 calls/day are free, no signup. Paid
                composites (full risk audit, hedge recommendations) start at $0.015 USDC via x402.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex shrink-0 gap-2">
              <Link href="/pricing" className="btn-primary whitespace-nowrap">
                See pricing
              </Link>
              <Link href="/api-docs" className="btn-ghost whitespace-nowrap">
                API docs →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Related */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Related calculators</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {related.map((c) => (
            <Link key={c.slug} href={`/${c.slug}`} className="card hover:border-accent/40 transition">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                {c.category}
              </div>
              <div className="font-semibold text-sm mb-1">{c.title}</div>
              <div className="text-xs text-slate-400">{c.short}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Schema.org JSON-LD — one tag, one valid JSON array of @graph nodes.
          We always append a generic HowTo (3 steps: enter inputs → calculate →
          review) and an Organization node for E-E-A-T, on top of whatever the
          page passed in (typically SoftwareApplication + FAQPage). Auto-derive
          the calculator name + URL from the slug so the per-page page.tsx
          doesn't have to duplicate the title. */}
      {(() => {
        const calc = getCalculator(slug);
        const calcUrl = `https://quantoracle.dev/${slug}`;
        const augmentedJsonLd = [
          ...jsonLd,
          breadcrumbJsonLd([
            { name: 'Home', url: 'https://quantoracle.dev' },
            { name: 'Calculators', url: 'https://quantoracle.dev/#calculators' },
            { name: calc?.title ?? title, url: calcUrl },
          ]),
          howToJsonLd({ name: calc?.title ?? title, url: calcUrl }),
          organizationJsonLd(),
        ];
        return (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@graph': augmentedJsonLd,
              }),
            }}
          />
        );
      })()}
    </div>
  );
}

// AffiliateCta was extracted to components/AffiliateCta.tsx so compare/* pages
// (which don't use CalculatorShell) can render the same sponsored slot.
