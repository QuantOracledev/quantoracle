import Link from 'next/link';
import { getRelatedCompare } from '@/lib/compare-cross-links';

/**
 * "Related comparisons" block for `/compare/*` articles.
 *
 * Renders 3 conceptually-adjacent sibling articles so the /compare cluster
 * is fully interconnected. This routes ranking authority around the cluster
 * and gives Google a topical-authority signal — see compare-cross-links.ts
 * for the rationale and the cross-link graph.
 *
 * Drop one of these into each /compare page, after the FAQ section:
 *   <CompareRelated slug="sharpe-vs-sortino-vs-calmar" />
 */
export function CompareRelated({ slug }: { slug: string }) {
  const related = getRelatedCompare(slug);
  if (related.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold mb-1">Related comparisons</h2>
      <p className="text-sm text-slate-500 mb-4">
        Other head-to-head breakdowns in the same corner of quant finance.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {related.map((a) => (
          <Link
            key={a.slug}
            href={`/compare/${a.slug}`}
            className="card hover:border-accent/40 transition"
          >
            <div className="text-xs uppercase tracking-wide text-accent mb-1">Compare</div>
            <div className="font-semibold text-sm mb-1">{a.title}</div>
            <div className="text-xs text-slate-400">{a.blurb}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
