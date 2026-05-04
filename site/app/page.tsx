import Link from 'next/link';
import { CALCULATORS } from '@/lib/calculators';

export default function HomePage() {
  const live = CALCULATORS.filter((c) => c.status === 'live');
  const planned = CALCULATORS.filter((c) => c.status === 'planned');

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
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

      {/* Calculators index */}
      <section id="calculators" className="pb-16 scroll-mt-16">
        <h2 className="text-2xl font-semibold mb-1">Calculators</h2>
        <p className="text-sm text-slate-400 mb-6">
          {live.length} live, {planned.length} coming soon.
        </p>
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
          click away — first 1,000 calls/IP/day are free, no signup.
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
