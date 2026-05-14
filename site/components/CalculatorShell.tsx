import Link from 'next/link';
import type { ReactNode } from 'react';
import { AdSlot } from './AdSlot';
import { AffiliateCta } from './AffiliateCta';
import { getRelated, getCalculator } from '@/lib/calculators';
import { howToJsonLd, organizationJsonLd } from '@/lib/seo';

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

      {/* Related */}
      <section className="mt-16">
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
