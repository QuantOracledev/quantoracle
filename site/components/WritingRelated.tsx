import Link from 'next/link';
import { getCalculator } from '@/lib/calculators';
import { getRelatedTutorials, getRelatedCalculators } from '@/lib/writing-cross-links';

/**
 * Discovery footer for native `/writing/*` tutorials.
 *
 * Renders two blocks: sibling tutorials (keeps a developer inside the
 * tutorial cluster) and the calculators the tutorial's tools map onto
 * (routes them to the live product). See writing-cross-links.ts for the
 * rationale — the tutorials are the agentic conversion funnel and were
 * previously poorly interconnected.
 *
 * Drop one into each /writing page, after the closing </article>:
 *   <WritingRelated slug="vercel-ai-sdk-quant-tools" />
 */
export function WritingRelated({ slug }: { slug: string }) {
  const tutorials = getRelatedTutorials(slug);
  const calculators = getRelatedCalculators(slug)
    .map((s) => getCalculator(s))
    .filter((c): c is NonNullable<ReturnType<typeof getCalculator>> => c !== undefined);

  if (tutorials.length === 0 && calculators.length === 0) return null;

  return (
    <>
      {tutorials.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-semibold mb-1">Keep building</h2>
          <p className="text-sm text-slate-500 mb-4">
            More tutorials on wiring deterministic quant tools into AI agents.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {tutorials.map((t) => (
              <Link
                key={t.slug}
                href={`/writing/${t.slug}`}
                className="card hover:border-accent/40 transition"
              >
                <div className="text-xs uppercase tracking-wide text-accent mb-1">Tutorial</div>
                <div className="font-semibold text-sm mb-1">{t.title}</div>
                <div className="text-xs text-slate-400">{t.blurb}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {calculators.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-1">Try the calculators</h2>
          <p className="text-sm text-slate-500 mb-4">
            The same computations this tutorial wires into an agent, runnable in the browser.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {calculators.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="card hover:border-accent/40 transition"
              >
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                  {c.category}
                </div>
                <div className="font-semibold text-sm mb-1">{c.title}</div>
                <div className="text-xs text-slate-400">{c.short}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
