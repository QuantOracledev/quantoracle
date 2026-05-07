import Link from 'next/link';
import { CalculatorShell } from '@/components/CalculatorShell';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/cagr-calculator',
  title: 'CAGR Calculator (Compound Annual Growth Rate, with Projections)',
  description:
    'Free CAGR calculator. Enter a starting value, ending value, and time period — get the compound annual growth rate, doubling time, and forward projections.',
  keywords: [
    'cagr calculator',
    'compound annual growth rate',
    'cagr formula',
    'doubling time calculator',
    'annualized return',
  ],
});

interface CagrResult {
  cagr: number;
  cagr_pct: number;
  total_return_pct: number;
  doubling_time_years: number | null;
  start_value: number;
  end_value: number;
  years: number;
  projections?: Array<{ years_forward: number; projected_value: number }>;
  ms: number;
}

interface Inputs {
  start_value: number;
  end_value: number;
  years: number;
}

const DEFAULTS: Inputs = {
  start_value: 10000,
  end_value: 50000,
  years: 10,
};

function parseInputs(sp: Record<string, string | string[] | undefined>): Inputs {
  const num = (v: string | string[] | undefined, fallback: number) => {
    if (v === undefined) return fallback;
    const s = Array.isArray(v) ? v[0] : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    start_value: num(sp.start_value, DEFAULTS.start_value),
    end_value: num(sp.end_value, DEFAULTS.end_value),
    years: num(sp.years, DEFAULTS.years),
  };
}

async function calc(inputs: Inputs): Promise<CagrResult | null> {
  try {
    return await callQuantOracle<CagrResult>('/v1/tvm/cagr', {
      ...inputs,
      include_projections: true,
    } as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

export default async function CagrPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const inputs = parseInputs(sp);
  const result = await calc(inputs);

  const jsonLd = [
    calculatorJsonLd({
      name: 'CAGR Calculator (Compound Annual Growth Rate)',
      description:
        'Free CAGR calculator returning compound annual growth rate, doubling time, total return, and forward projections.',
      url: 'https://quantoracle.dev/cagr-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ];

  return (
    <CalculatorShell
      slug="cagr-calculator"
      title="CAGR Calculator"
      subtitle="Compute the compound annual growth rate from any start/end value pair. Returns CAGR, doubling time, total return, and forward projections at 1, 3, 5, 10, and 20 years."
      inputs={<InputsCard inputs={inputs} />}
      results={result ? <ResultsCard inputs={inputs} result={result} /> : <ErrorCard />}
      interpretation={result && <Interpretation result={result} />}
      faq={<Faq items={faqs} />}
      jsonLd={jsonLd}
      longform={<Longform />}
    />
  );
}

function InputsCard({ inputs }: { inputs: Inputs }) {
  return (
    <form method="GET" className="card">
      <h2 className="text-lg font-semibold mb-4">Inputs</h2>
      <div className="space-y-4">
        <Field
          name="start_value"
          label="Starting value ($)"
          value={inputs.start_value}
          step="any"
          min="0.01"
        />
        <Field
          name="end_value"
          label="Ending value ($)"
          value={inputs.end_value}
          step="any"
          min="0.01"
        />
        <Field
          name="years"
          label="Time period (years)"
          value={inputs.years}
          step="any"
          min="0.01"
          hint="Decimals OK (1.5 = 18 months)"
        />
      </div>
      <button type="submit" className="btn-primary w-full mt-5">
        Calculate
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Calls the deterministic <code className="text-slate-300">/v1/tvm/cagr</code> endpoint
        server-side. First 1,000/day free, no signup.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  value,
  step,
  min,
  hint,
}: {
  name: string;
  label: string;
  value: number;
  step: string;
  min?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type="number"
        name={name}
        defaultValue={value}
        step={step}
        min={min}
        required
        className="field-input"
      />
      {hint && <span className="text-xs text-slate-500 mt-1 block">{hint}</span>}
    </label>
  );
}

function ResultsCard({ inputs, result }: { inputs: Inputs; result: CagrResult }) {
  const isNegative = result.cagr < 0;
  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Results</h2>
        <span className="text-xs text-slate-500">
          ${inputs.start_value.toLocaleString()} → ${inputs.end_value.toLocaleString()} over{' '}
          {inputs.years} {inputs.years === 1 ? 'year' : 'years'}
        </span>
      </div>

      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
          Compound Annual Growth Rate
        </div>
        <div
          className={`font-mono text-4xl tabular-nums ${isNegative ? 'text-chart-loss' : 'text-accent'}`}
        >
          {result.cagr_pct.toFixed(2)}%
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Stat label="Total return" value={`${result.total_return_pct.toFixed(1)}%`} />
        <Stat
          label="Doubling time"
          value={
            result.doubling_time_years && result.doubling_time_years > 0
              ? `${result.doubling_time_years.toFixed(2)} yr`
              : 'N/A'
          }
        />
        <Stat label="Compute time" value={`${result.ms.toFixed(0)} ms`} />
      </div>

      {result.projections && result.projections.length > 0 && (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Forward projections (at this CAGR)
          </h3>
          <div className="overflow-hidden rounded-md border border-ink-700/40">
            <table className="w-full text-sm">
              <thead className="bg-ink-800/40">
                <tr>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
                    Years from end value
                  </th>
                  <th className="text-right px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
                    Projected value
                  </th>
                  <th className="text-right px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
                    Multiple of start
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.projections.map((p) => {
                  const multiple = p.projected_value / inputs.start_value;
                  return (
                    <tr key={p.years_forward} className="border-t border-ink-700/40">
                      <td className="px-3 py-2 font-mono text-slate-400">+{p.years_forward}y</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-100">
                        ${p.projected_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-500">
                        {multiple.toFixed(1)}×
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Projections assume the historical CAGR continues unchanged — they are extrapolations,
            not forecasts.
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-800/40 rounded-md p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">{label}</div>
      <div className="font-mono text-sm tabular-nums text-slate-100">{value}</div>
    </div>
  );
}

function ErrorCard() {
  return (
    <div className="card border-chart-loss/30">
      <h2 className="text-lg font-semibold mb-2 text-chart-loss">Calculation failed</h2>
      <p className="text-sm text-slate-300">
        Make sure starting value, ending value, and years are all positive numbers.
      </p>
    </div>
  );
}

function Interpretation({ result }: { result: CagrResult }) {
  const isNegative = result.cagr < 0;
  const cagrPct = result.cagr_pct;
  const tier = isNegative
    ? 'a losing investment'
    : cagrPct < 3
      ? 'below inflation in most periods — consider whether this beats a money-market fund'
      : cagrPct < 7
        ? 'modest — typical of bonds, conservative balanced portfolios'
        : cagrPct < 12
          ? 'solid — in line with historical US equity returns'
          : cagrPct < 20
            ? 'strong — well above broad market averages'
            : cagrPct < 30
              ? 'exceptional — sustainable only for outlier strategies or shorter periods'
              : 'extraordinary — verify the data is real and not subject to survivorship bias or short-window distortion';
  const doubleTimeNote =
    result.doubling_time_years && result.doubling_time_years > 0 ? (
      <>
        {' '}At this rate, the investment doubles every{' '}
        <strong>{result.doubling_time_years.toFixed(2)} years</strong>.
      </>
    ) : null;
  return (
    <p>
      The compound annual growth rate of <strong>{cagrPct.toFixed(2)}%</strong> means $1 grew to ${' '}
      {(result.end_value / result.start_value).toFixed(2)} over {result.years}{' '}
      {result.years === 1 ? 'year' : 'years'} — {tier}.{doubleTimeNote}
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>Why CAGR matters</h2>
      <p>
        When someone tells you a portfolio &quot;averaged 12% returns over 20 years,&quot; they
        almost always mean CAGR — the smoothed compound rate, not the arithmetic average of
        year-by-year returns. The distinction is fundamental: CAGR is the rate at which compounding
        actually moved your money, while arithmetic average ignores the math of how returns
        interact with each other.
      </p>

      <h3>The arithmetic-vs-geometric trap</h3>
      <p>
        A two-year sequence of +50% then -50% has an arithmetic average of 0%. But $1 going up by
        50% and then back down by 50% leaves you with $0.75 — a -25% total return, or about{' '}
        -13.4% CAGR. The arithmetic average says you broke even; the CAGR tells you the actual
        truth. <strong>For any multi-period analysis, only CAGR matters.</strong>
      </p>
      <p>
        The gap between arithmetic mean and CAGR widens with volatility. For a 10% expected return:
      </p>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>0% volatility: arithmetic = CAGR = 10%</li>
        <li>15% volatility: arithmetic 10%, CAGR ~8.9%</li>
        <li>30% volatility: arithmetic 10%, CAGR ~5.5%</li>
        <li>50% volatility: arithmetic 10%, CAGR ~-2.5%</li>
      </ul>
      <p>
        This is &quot;volatility drag&quot; — high-vol assets compound much worse than their
        arithmetic averages suggest. It&apos;s why levered ETFs (3x daily) underperform 3x of the
        underlying index over multi-year periods.
      </p>

      <h3>Doubling time and the Rule of 72</h3>
      <p>
        At a constant CAGR, the time to double the investment is <code>ln(2) / ln(1 + CAGR)</code>.
        The famous Rule of 72 approximates this as <code>72 / CAGR_percent</code> — accurate to
        within a few percent for CAGRs between 4% and 25%. So 7.2 years to double at 10%, 4.8 years
        at 15%, 3 years at 24%. The calculator returns the exact value.
      </p>

      <h3>Limitations honest people acknowledge</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>CAGR ignores intermediate volatility.</strong> A 10% CAGR over 20 years could
          come from a smooth ride or from a roller coaster. CAGR doesn&apos;t care; your nervous
          system does.
        </li>
        <li>
          <strong>CAGR is not predictive.</strong> Past CAGR tells you what happened, not what will
          happen. Forward-looking CAGR for US equities is widely estimated at 6-7% real, not the
          ~10% historical figure.
        </li>
        <li>
          <strong>CAGR ignores cash flows.</strong> If you contributed money or withdrew during the
          period, CAGR is misleading. Use{' '}
          <a href="/api-docs" className="text-accent">
            IRR
          </a>{' '}
          (<code>/v1/tvm/irr</code>) instead, which handles arbitrary cash flow timing.
        </li>
        <li>
          <strong>Survivorship bias amplifies reported CAGRs.</strong> The funds and stocks you can
          look up today are the ones that survived. Failed investments don&apos;t appear in
          datasets, biasing all backward-looking averages upward by 1-3% in equity studies.
        </li>
      </ul>

      <h3>Related calculators</h3>
      <p>
        For risk-adjusted return analysis, see the{' '}
        <Link href="/sharpe-ratio-calculator" className="text-accent">
          Sharpe ratio calculator
        </Link>
        . For investments with periodic cash flows, the API exposes IRR at{' '}
        <code>/v1/tvm/irr</code> (the QuantOracle{' '}
        <Link href="/api-docs" className="text-accent">
          API docs
        </Link>
        ). For projecting forward outcomes with realistic uncertainty (instead of
        constant-CAGR extrapolation), use the{' '}
        <Link href="/monte-carlo-simulation-calculator" className="text-accent">
          Monte Carlo simulation calculator
        </Link>{' '}
        — same starting value, but with volatility baked in to give a distribution of possible
        outcomes rather than a single line.
      </p>
    </div>
  );
}
