import Link from 'next/link';
import { AffiliateCta } from '@/components/AffiliateCta';
import { buildMetadata } from '@/lib/seo';
import { COMPARE_ARTICLES as articles } from '@/lib/compare-cross-links';

export const metadata = buildMetadata({
  path: '/compare',
  title: 'Compare — Quant Finance Concepts Side-by-Side',
  description:
    'Head-to-head explainers of commonly-confused quant finance concepts: which to use, when each one lies, and decision rules from real practitioners.',
  keywords: ['quant finance comparisons', 'risk metric comparison', 'quant concepts explained'],
});

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>{' '}
        / Compare
      </nav>
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Compare</h1>
        <p className="mt-4 text-slate-300 text-lg">
          Head-to-head explainers of commonly-confused quant finance concepts. Each article picks
          a real decision a practitioner has to make and walks through how to make it.
        </p>
      </header>
      <div className="space-y-3">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/compare/${a.slug}`}
            className="card hover:border-accent/40 transition block"
          >
            <div className="font-semibold text-slate-100 mb-1">{a.title}</div>
            <div className="text-sm text-slate-400">{a.blurb}</div>
          </Link>
        ))}
      </div>

      {/* Monetization — this index page gets organic traffic but had no
          revenue surface. Trader/practitioner audience aligns with the
          TradingView affiliate. */}
      <div className="mt-10">
        <AffiliateCta subId="compare-index" category="compare" />
      </div>
    </div>
  );
}
