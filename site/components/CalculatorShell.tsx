import Link from 'next/link';
import type { ReactNode } from 'react';
import { AdSlot } from './AdSlot';
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

      {/* Affiliate / premium CTA strip — replace placeholders with real tracking links once approved */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <PremiumCta />
        <AffiliateCta calculatorSlug={slug} />
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

      {/* Schema.org JSON-LD — one tag, one valid JSON array of @graph nodes */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': jsonLd,
          }),
        }}
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

// TradingView affiliate ID. Public value (lives in every link), so safe to
// commit. The per-page sub-ID is appended by AffiliateCta so the dashboard
// shows conversion attribution per calculator.
const TRADINGVIEW_AFF_ID = '166298';

/** Builds an affiliate-tagged TradingView pricing URL with per-page tracking. */
function tradingViewUrl(calculatorSlug: string): string {
  const params = new URLSearchParams({
    aff_id: TRADINGVIEW_AFF_ID,
    aff_sub: calculatorSlug,
  });
  return `https://www.tradingview.com/pricing/?${params.toString()}`;
}

function AffiliateCta({ calculatorSlug }: { calculatorSlug: string }) {
  const cat = CALCULATORS.find((c) => c.slug === calculatorSlug)?.category;

  // Per-category copy. TradingView fits all categories — chartists across
  // options, crypto, and general quant audiences all use it. When Coinbase /
  // IBKR / etc. are wired up later, we can swap based on category here.
  const headline =
    cat === 'crypto'
      ? 'Chart and trade crypto with TradingView Pro'
      : cat === 'options'
        ? 'Visualize options strategies on TradingView Pro'
        : 'Backtest and chart with TradingView Pro';
  const body =
    cat === 'crypto'
      ? 'Multi-exchange charts, alerts, and indicators across BTC, ETH, and 100,000+ crypto pairs. Free 30-day Pro trial.'
      : cat === 'options'
        ? 'Real-time charts, custom Pine Script indicators, and multi-monitor layouts used by serious options traders. Free 30-day Pro trial.'
        : 'The chart platform used by 60M+ traders. Custom indicators, multi-timeframe analysis, alerts. Free 30-day Pro trial.';

  return (
    <a
      href={tradingViewUrl(calculatorSlug)}
      target="_blank"
      // FTC-compliant: rel='sponsored' marks this as paid; 'nofollow' tells
      // search engines not to pass link equity; 'noopener' is security.
      rel="sponsored nofollow noopener"
      className="card border-ink-700 hover:border-accent/40 transition block group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs uppercase tracking-wider text-slate-400">Sponsored</div>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          tradingview.com →
        </span>
      </div>
      <div className="font-semibold mb-1 group-hover:text-accent transition">{headline}</div>
      <p className="text-sm text-slate-400">{body}</p>
      <p className="mt-2 text-[10px] text-slate-600">
        QuantOracle earns a commission if you sign up via this link. Doesn&apos;t cost you extra.
      </p>
    </a>
  );
}
