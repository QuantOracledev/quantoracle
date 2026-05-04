import Link from 'next/link';
import type { ReactNode } from 'react';
import { CALCULATORS, getRelated } from '@/lib/calculators';

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
  /** Inline JSON-LD blob for FAQ + SoftwareApplication schema. */
  jsonLd: string;
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

      {/* Affiliate / premium CTA strip — replace placeholders with real tracking links once approved */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <PremiumCta />
        <AffiliateCta calculatorSlug={slug} />
      </div>

      {/* FAQ */}
      <section className="mt-16 max-w-3xl">
        <h2 className="text-2xl font-semibold mb-4">Frequently asked questions</h2>
        {faq}
      </section>

      {/* Long-form explainer — boosts word count for SEO and serves real users who want depth */}
      {longform && (
        <section className="mt-16 max-w-3xl prose-soft">{longform}</section>
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

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
    </div>
  );
}

function PremiumCta() {
  return (
    <div className="card border-accent/30 bg-gradient-to-br from-ink-900 to-ink-800">
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs uppercase tracking-wider text-accent">Premium</div>
        <span className="text-[10px] uppercase tracking-wider bg-ink-800 text-slate-500 px-2 py-0.5 rounded">
          Coming soon
        </span>
      </div>
      <div className="font-semibold mb-1">Save and revisit your analyses</div>
      <p className="text-sm text-slate-400">
        Track positions over time, get IV-crush alerts, run multi-leg strategies. $9/mo when it
        ships.
      </p>
    </div>
  );
}

function AffiliateCta({ calculatorSlug }: { calculatorSlug: string }) {
  // TODO(monetization): replace href with real tracking links once affiliate
  // accounts are approved (tastytrade for options, IBKR for general, Coinbase for crypto pages).
  // Pick the broker by category to maximize relevance + conversion.
  const cat = CALCULATORS.find((c) => c.slug === calculatorSlug)?.category;
  const isCrypto = cat === 'crypto';
  return (
    <a
      href="#"
      className="card border-ink-700 hover:border-accent/40 transition block"
      // Keep nofollow until the affiliate disclosure flow is in place.
      rel="nofollow sponsored noopener"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs uppercase tracking-wider text-slate-400">Sponsored</div>
        <span className="text-[10px] uppercase tracking-wider bg-ink-800 text-slate-500 px-2 py-0.5 rounded">
          Placeholder
        </span>
      </div>
      <div className="font-semibold mb-1">
        {isCrypto ? 'Trade with low fees' : 'Trade options commission-free'}
      </div>
      <p className="text-sm text-slate-400">
        {isCrypto
          ? 'Open a crypto account in under 5 minutes. (Affiliate link — to be wired post-launch.)'
          : 'Open a brokerage account and trade the strategies you analyze here. (Affiliate link — to be wired post-launch.)'}
      </p>
    </a>
  );
}
