import Link from 'next/link';
import { CalculatorShell } from '@/components/CalculatorShell';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';
import { MonteCarloChart } from './chart';

export const metadata = buildMetadata({
  path: '/monte-carlo-simulation-calculator',
  title: 'Monte Carlo Simulation Calculator (Portfolio + Retirement)',
  description:
    'Free Monte Carlo simulation calculator. Run thousands of price paths and see the full distribution of portfolio outcomes — mean, median, P5/P95, probability of loss and ruin. Handles contributions and withdrawals.',
  keywords: [
    'monte carlo simulation calculator',
    'portfolio simulation',
    'retirement monte carlo',
    'sequence of returns',
    'probability of ruin',
  ],
});

interface McResult {
  terminal: {
    mean: number;
    median: number;
    p5: number;
    p25: number;
    p75: number;
    p95: number;
  };
  prob_loss: number;
  prob_double: number;
  prob_ruin: number;
  cagr: number;
  sample_paths: number[][];
  ms: number;
}

interface Inputs {
  initial_value: number;
  annual_return: number;
  annual_vol: number;
  years: number;
  simulations: number;
  contributions: number;
  withdrawal_rate: number;
  /** Annual inflation rate used to convert nominal results to real (today's
   *  dollars). 0.03 = 3% (long-run US average). Has no effect on the
   *  simulation itself; only on how results are displayed when view=real. */
  inflation_rate: number;
  /** 'nominal' = future dollars at face value (default). 'real' = today's
   *  purchasing power, deflated by inflation_rate^years. Only the display
   *  changes; the underlying simulation is the same. */
  view: 'nominal' | 'real';
}

const DEFAULTS: Inputs = {
  initial_value: 100000,
  annual_return: 0.08,
  annual_vol: 0.18,
  years: 20,
  simulations: 1000,
  contributions: 0,
  withdrawal_rate: 0,
  inflation_rate: 0.03,
  view: 'nominal',
};

/** Pre-built scenarios shown as one-click links above the inputs form. */
const PRESETS: Array<{ name: string; description: string; inputs: Partial<Inputs> }> = [
  {
    name: 'Standard 4% Rule',
    description: '$1M portfolio, 30 years, 4% withdrawal',
    inputs: {
      initial_value: 1_000_000,
      annual_return: 0.07,
      annual_vol: 0.16,
      years: 30,
      contributions: 0,
      withdrawal_rate: 0.04,
    },
  },
  {
    name: 'Aggressive Saver',
    description: '$50K start, $25K/yr added, 25 years to retirement',
    inputs: {
      initial_value: 50_000,
      annual_return: 0.09,
      annual_vol: 0.18,
      years: 25,
      contributions: 25_000,
      withdrawal_rate: 0,
    },
  },
  {
    name: 'Crypto Holder',
    description: '$10K BTC bag, 10 years, hold-only',
    inputs: {
      initial_value: 10_000,
      annual_return: 0.3,
      annual_vol: 0.7,
      years: 10,
      contributions: 0,
      withdrawal_rate: 0,
    },
  },
  {
    name: 'Lean FIRE',
    description: '$500K, 40 years, 3% withdrawal',
    inputs: {
      initial_value: 500_000,
      annual_return: 0.07,
      annual_vol: 0.16,
      years: 40,
      contributions: 0,
      withdrawal_rate: 0.03,
    },
  },
];

function parseInputs(sp: Record<string, string | string[] | undefined>): Inputs {
  const num = (v: string | string[] | undefined, fallback: number) => {
    if (v === undefined) return fallback;
    const s = Array.isArray(v) ? v[0] : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };
  const view = (() => {
    const v = sp.view;
    const s = Array.isArray(v) ? v[0] : v;
    return s === 'real' ? 'real' : 'nominal';
  })();
  return {
    initial_value: num(sp.initial_value, DEFAULTS.initial_value),
    annual_return: num(sp.annual_return, DEFAULTS.annual_return),
    annual_vol: num(sp.annual_vol, DEFAULTS.annual_vol),
    years: Math.max(1, Math.round(num(sp.years, DEFAULTS.years))),
    simulations: Math.min(
      10000,
      Math.max(100, Math.round(num(sp.simulations, DEFAULTS.simulations))),
    ),
    contributions: num(sp.contributions, DEFAULTS.contributions),
    withdrawal_rate: num(sp.withdrawal_rate, DEFAULTS.withdrawal_rate),
    inflation_rate: num(sp.inflation_rate, DEFAULTS.inflation_rate),
    view,
  };
}

/** Converts nominal future dollars to real (today's purchasing power) when
 *  the user selects 'real' view. No-op when view='nominal'. */
function deflate(nominal: number, inputs: Inputs): number {
  if (inputs.view !== 'real') return nominal;
  return nominal / Math.pow(1 + inputs.inflation_rate, inputs.years);
}

async function simulate(inputs: Inputs): Promise<McResult | null> {
  // Strip out view + inflation_rate before calling the API — they're display-
  // only and not part of the simulation contract.
  const { view: _v, inflation_rate: _i, ...apiInputs } = inputs;
  void _v;
  void _i;
  try {
    return await callQuantOracle<McResult>('/v1/simulate/montecarlo', {
      ...apiInputs,
    } as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

export default async function MonteCarloPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  // Skip the API call on the bare-URL landing (i.e., the user just clicked
  // the link from the homepage). The simulation runs ~1000 paths through 20
  // years of GBM plus network round-trip, which makes the click-to-reveal
  // delay 1-3 seconds on a cold serverless instance. Render the form +
  // presets instantly; only run the simulation when the user explicitly
  // submits (which adds query params to the URL). This trades 0 latency for
  // 1 explicit "Run simulation" click — which is the right UX here because
  // results depend on YOUR portfolio inputs, not abstract defaults.
  const hasUserParams = Object.keys(sp).length > 0;
  const inputs = parseInputs(sp);
  const result = hasUserParams ? await simulate(inputs) : null;

  const jsonLd = [
    calculatorJsonLd({
      name: 'Monte Carlo Simulation Calculator',
      description:
        'Free Monte Carlo portfolio simulator returning the distribution of terminal outcomes, probability of loss, and probability of ruin under contributions and withdrawals.',
      url: 'https://quantoracle.dev/monte-carlo-simulation-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ];

  const resultsNode = !hasUserParams
    ? <EmptyState />
    : result
      ? <ResultsCard inputs={inputs} result={result} />
      : <ErrorCard />;

  return (
    <CalculatorShell
      slug="monte-carlo-simulation-calculator"
      title="Monte Carlo Simulation Calculator"
      subtitle="Run thousands of random price paths and see the full distribution of where your portfolio could end up. Handles contributions, withdrawals, sequence-of-returns risk, and inflation-adjusted (real) outcomes."
      inputs={
        <div className="space-y-3">
          <PresetScenarios />
          <InputsCard inputs={inputs} />
        </div>
      }
      results={resultsNode}
      interpretation={hasUserParams && result ? <Interpretation inputs={inputs} result={result} /> : undefined}
      faq={<Faq items={faqs} />}
      jsonLd={jsonLd}
      longform={<Longform />}
    />
  );
}

/** Shown on the bare-URL initial visit (no query params). Tells the user
 *  what to do without making them wait for a server-side simulation. */
function EmptyState() {
  return (
    <div className="card border-accent/20">
      <h2 className="text-lg font-semibold mb-2">Ready to simulate</h2>
      <p className="text-sm text-slate-300 leading-relaxed mb-3">
        Pick a preset above for a one-click scenario, or set your own inputs and click{' '}
        <strong className="text-accent">Run simulation</strong>. Each simulation runs 1,000+ random
        price paths (~1 second) and returns the full distribution of where your portfolio could
        end up — median, percentiles, probability of loss, and probability of ruin.
      </p>
      <p className="text-xs text-slate-500">
        Free, no signup. Powered by the QuantOracle <code>/v1/simulate/montecarlo</code> endpoint.
      </p>
    </div>
  );
}

function PresetScenarios() {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-2 font-semibold">
        Try a preset
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const params = new URLSearchParams();
          for (const [k, v] of Object.entries(p.inputs)) {
            if (v !== undefined) params.set(k, String(v));
          }
          return (
            <Link
              key={p.name}
              href={`?${params.toString()}`}
              className="rounded-md border border-ink-700 hover:border-accent/50 hover:bg-ink-800/50 transition px-3 py-2 text-xs"
              prefetch={false}
            >
              <div className="font-semibold text-slate-100">{p.name}</div>
              <div className="text-slate-500 mt-0.5">{p.description}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function InputsCard({ inputs }: { inputs: Inputs }) {
  return (
    <form method="GET" className="card">
      <h2 className="text-lg font-semibold mb-4">Inputs</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field
          name="initial_value"
          label="Initial value ($)"
          value={inputs.initial_value}
          step="any"
          min="1"
        />
        <Field
          name="years"
          label="Time horizon (years)"
          value={inputs.years}
          step="any"
          min="1"
          max="100"
        />
        <Field
          name="annual_return"
          label="Expected annual return"
          value={inputs.annual_return}
          step="any"
          min="-0.5"
          max="2"
          hint="0.08 = 8% — historical US equity"
        />
        <Field
          name="annual_vol"
          label="Annual volatility"
          value={inputs.annual_vol}
          step="any"
          min="0.001"
          max="2"
          hint="0.18 = 18% — historical US equity"
        />
        <Field
          name="contributions"
          label="Annual contribution ($)"
          value={inputs.contributions}
          step="any"
          min="0"
          hint="0 if no additions"
        />
        <Field
          name="withdrawal_rate"
          label="Annual withdrawal rate"
          value={inputs.withdrawal_rate}
          step="any"
          min="0"
          max="0.5"
          hint="0.04 = 4% retirement rule"
        />
        <Field
          name="simulations"
          label="Simulations"
          value={inputs.simulations}
          step="any"
          min="100"
          max="10000"
          hint="1000-2500 typical"
        />
        <Field
          name="inflation_rate"
          label="Inflation rate"
          value={inputs.inflation_rate}
          step="any"
          min="0"
          max="0.5"
          hint="0.03 = 3% (US long-run avg)"
        />
        <label className="block">
          <span className="field-label">View results in</span>
          <select name="view" defaultValue={inputs.view} className="field-input">
            <option value="nominal">Nominal (future $)</option>
            <option value="real">Real (today&apos;s $)</option>
          </select>
          <span className="text-xs text-slate-500 mt-1 block">
            Real adjusts for inflation
          </span>
        </label>
      </div>
      <button type="submit" className="btn-primary w-full mt-5">
        Run simulation
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Calls the deterministic <code className="text-slate-300">/v1/simulate/montecarlo</code>{' '}
        endpoint server-side. First 1,000/day free, no signup.
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
  max,
  hint,
}: {
  name: string;
  label: string;
  value: number;
  step: string;
  min?: string;
  max?: string;
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
        max={max}
        required
        className="field-input"
      />
      {hint && <span className="text-xs text-slate-500 mt-1 block">{hint}</span>}
    </label>
  );
}

function Money({ v }: { v: number }) {
  return (
    <>${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}</>
  );
}

function ResultsCard({ inputs, result }: { inputs: Inputs; result: McResult }) {
  // For retirement / withdrawal scenarios, lead with success rate framing
  // (1 - prob_ruin). For accumulation scenarios, lead with the median outcome.
  const isWithdrawalScenario = inputs.withdrawal_rate > 0;
  const successRate = (1 - result.prob_ruin) * 100;
  const successColor =
    successRate >= 95
      ? 'text-chart-profit'
      : successRate >= 80
        ? 'text-accent'
        : successRate >= 60
          ? 'text-yellow-400'
          : 'text-chart-loss';

  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-2 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Results</h2>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          showing {inputs.view === 'real' ? "today's dollars" : 'nominal future dollars'}
        </span>
      </div>
      <div className="text-xs text-slate-500 mb-4">
        ${inputs.initial_value.toLocaleString()} · {inputs.years}y ·{' '}
        {(inputs.annual_return * 100).toFixed(1)}% return ·{' '}
        {(inputs.annual_vol * 100).toFixed(1)}% vol
        {inputs.contributions > 0 && ` · +$${inputs.contributions.toLocaleString()}/yr`}
        {inputs.withdrawal_rate > 0 &&
          ` · -${(inputs.withdrawal_rate * 100).toFixed(1)}%/yr withdrawal`}
      </div>

      {isWithdrawalScenario && (
        <div className="mb-6 p-4 rounded-md bg-ink-800/40 border border-ink-700/50">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
            Success rate (portfolio survives full horizon)
          </div>
          <div className={`font-mono text-4xl tabular-nums ${successColor}`}>
            {successRate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {successRate >= 95
              ? 'Very safe — your withdrawal plan survives in nearly all simulated futures'
              : successRate >= 80
                ? 'Reasonably safe — failures occur in only the worst sequences of returns'
                : successRate >= 60
                  ? 'Risky — consider lowering withdrawal rate, working longer, or accepting flexibility'
                  : 'Likely to fail — withdrawal rate is too high for this return/volatility profile'}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Median outcome</div>
          <div className="font-mono text-2xl tabular-nums text-accent">
            <Money v={deflate(result.terminal.median, inputs)} />
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Mean outcome</div>
          <div className="font-mono text-2xl tabular-nums text-slate-100">
            <Money v={deflate(result.terminal.mean, inputs)} />
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">CAGR (median)</div>
          <div className="font-mono text-2xl tabular-nums text-slate-100">
            {(result.cagr * 100).toFixed(2)}%
            <span className="text-xs text-slate-500 ml-1">
              {inputs.view === 'real' ? '(real)' : '(nom)'}
            </span>
          </div>
        </div>
      </div>

      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
        Distribution of terminal outcomes
      </h3>
      <div className="overflow-hidden rounded-md border border-ink-700/40 mb-6">
        <table className="w-full text-sm">
          <thead className="bg-ink-800/40">
            <tr>
              <th className="text-left px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
                Percentile
              </th>
              <th className="text-right px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
                Portfolio value
              </th>
              <th className="text-right px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
                vs starting
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ['5th', result.terminal.p5, 'text-chart-loss'],
              ['25th', result.terminal.p25, 'text-slate-300'],
              ['50th (median)', result.terminal.median, 'text-accent'],
              ['75th', result.terminal.p75, 'text-slate-300'],
              ['95th', result.terminal.p95, 'text-chart-profit'],
            ].map(([label, value, cls]) => {
              const nominal = value as number;
              const displayed = deflate(nominal, inputs);
              const ratio = nominal / inputs.initial_value; // ratio is unaffected by deflation
              return (
                <tr key={label as string} className="border-t border-ink-700/40">
                  <td className="px-3 py-2 text-slate-400">{label}</td>
                  <td className={`px-3 py-2 text-right font-mono ${cls}`}>
                    <Money v={displayed} />
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-500">
                    {ratio >= 1 ? '+' : ''}
                    {((ratio - 1) * 100).toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
        Probability events
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat
          label="Loss vs start"
          value={`${(result.prob_loss * 100).toFixed(1)}%`}
          tone={result.prob_loss > 0.25 ? 'warn' : 'neutral'}
        />
        <Stat
          label="Doubling"
          value={`${(result.prob_double * 100).toFixed(1)}%`}
          tone="positive"
        />
        <Stat
          label="Ruin (zero)"
          value={`${(result.prob_ruin * 100).toFixed(2)}%`}
          tone={result.prob_ruin > 0.05 ? 'warn' : 'neutral'}
        />
      </div>

      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
        Sample paths
      </h3>
      <MonteCarloChart
        paths={result.sample_paths}
        yearsHorizon={inputs.years}
        initialValue={inputs.initial_value}
        terminal={result.terminal}
      />
      <div className="mt-2 text-xs text-slate-500">
        Showing {result.sample_paths.length} of {inputs.simulations.toLocaleString()} simulated
        paths · computed in {result.ms.toFixed(0)} ms ·{' '}
        {inputs.view === 'real' ? (
          <span>nominal-dollar paths (real-dollar mode applies to summary only)</span>
        ) : (
          'nominal future dollars'
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'warn' | 'positive';
}) {
  const cls =
    tone === 'warn'
      ? 'text-chart-loss'
      : tone === 'positive'
        ? 'text-chart-profit'
        : 'text-slate-100';
  return (
    <div className="bg-ink-800/40 rounded-md p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">{label}</div>
      <div className={`font-mono text-lg tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

function ErrorCard() {
  return (
    <div className="card border-chart-loss/30">
      <h2 className="text-lg font-semibold mb-2 text-chart-loss">Simulation failed</h2>
      <p className="text-sm text-slate-300">
        Make sure all inputs are positive (volatility and time horizon must be greater than zero,
        contributions and withdrawal rate non-negative).
      </p>
    </div>
  );
}

function Interpretation({ inputs, result }: { inputs: Inputs; result: McResult }) {
  const ratio = result.terminal.median / inputs.initial_value;
  const lossPct = (result.prob_loss * 100).toFixed(1);
  const median = deflate(result.terminal.median, inputs);
  const p5 = deflate(result.terminal.p5, inputs);
  const p95 = deflate(result.terminal.p95, inputs);
  const realityNote =
    inputs.view === 'real'
      ? ` (in today's purchasing power, deflated by ${(inputs.inflation_rate * 100).toFixed(1)}% inflation)`
      : '';
  const ruinAlert =
    result.prob_ruin > 0.05 ? (
      <>
        {' '}
        <strong className="text-chart-loss">
          The {(result.prob_ruin * 100).toFixed(1)}% probability of ruin is concerning
        </strong>{' '}
        — at this withdrawal rate, ~1 in {Math.round(1 / result.prob_ruin)} scenarios depletes the
        portfolio entirely. Sequence-of-returns risk: bad early years on a portfolio you&apos;re
        actively withdrawing from compound much worse than late bad years. To improve the success
        rate, you can lower the withdrawal rate, work a few more years, or accept dynamic
        withdrawals (cut spending in down years).
      </>
    ) : null;
  const direction = ratio >= 1 ? 'grows to' : 'shrinks to';
  const fmt = (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return (
    <p>
      In the median outcome, your ${inputs.initial_value.toLocaleString()} {direction}{' '}
      <strong>{fmt(median)}</strong>
      {realityNote} over {inputs.years} years (CAGR {(result.cagr * 100).toFixed(2)}%). But{' '}
      <strong>{lossPct}%</strong> of paths end below the starting value, and the worst 5% end at or
      below {fmt(p5)}. The best 5% reach {fmt(p95)} or higher.{ruinAlert}
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>Why Monte Carlo, instead of a single expected-return projection?</h2>
      <p>
        The simplest way to project a portfolio is to compound the expected return: start with $X,
        multiply by (1 + r)<sup>T</sup>, done. It gives a clean number. It is also wrong in a way
        that matters: <strong>two portfolios can have the same expected return but very different
        risk profiles</strong>, and the single-number projection hides the risk entirely.
      </p>
      <p>
        Monte Carlo simulation runs thousands of random scenarios drawn from the same distribution
        and reports the full range of outcomes. You see not just &quot;you will probably end at
        $250,000&quot; but &quot;5% chance you end below $80K, 50% chance you end above $200K, 5%
        chance you end above $510K.&quot; The <em>spread</em> is what informs decisions like
        whether your retirement plan can survive bad luck.
      </p>

      <h3>The math behind the simulation</h3>
      <p>
        This calculator uses geometric Brownian motion — log returns are drawn from a normal
        distribution with mean (μ − σ²/2)·dt and standard deviation σ·√dt. At each timestep, the
        portfolio is multiplied by exp(drawn_return). Contributions are added at year-end;
        withdrawals are subtracted as a fixed fraction of the current portfolio. The result is one
        random path from your starting value to a terminal value.
      </p>
      <p>
        Repeat that process N times (1,000+ paths) and tabulate the distribution of terminal
        values. The percentiles of that distribution are the answer. Standard error of the
        percentile estimates is roughly 1/√N, so 1,000 paths gives ~3% precision and 10,000 paths
        gives ~1%.
      </p>

      <h3>Sequence-of-returns risk and why it matters</h3>
      <p>
        With contributions only (no withdrawals), the order of returns barely matters — math is
        commutative. With <em>withdrawals</em>, order matters enormously. Two retirees with the
        same average return can end up wildly different just based on whether bad years hit early
        or late: early bad years deplete the portfolio when withdrawals are largest, leaving
        nothing to grow. Late bad years happen on a portfolio that has already had decades of
        compound growth, so they sting less.
      </p>
      <p>
        This is &quot;sequence-of-returns risk,&quot; and it is why the famous &quot;4% rule&quot;
        for retirement uses 30 years of historical sequences rather than a single average. Monte
        Carlo simulates the same idea synthetically: by running thousands of random orderings, you
        see how often early-bad-year scenarios cause ruin even when the long-term mean return is
        fine.
      </p>

      <h3>Limitations to be honest about</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Assumes log-normal returns.</strong> Real markets have fatter tails — extreme
          moves are more frequent than the model predicts. The simulation under-estimates the
          probability of catastrophic losses. For institutional risk modeling, use a Student-t or
          GARCH model. The QuantOracle API exposes GARCH at{' '}
          <code>/v1/stats/garch-forecast</code>.
        </li>
        <li>
          <strong>Constant μ and σ.</strong> Real return distributions vary across regimes (bull,
          bear, high-vol, low-vol). The simulation treats them as fixed. For more realism, run
          multiple simulations under different regimes and weight the results.
        </li>
        <li>
          <strong>No correlations across assets.</strong> A single-asset model cannot capture
          diversification. For multi-asset portfolios, you would simulate each asset and combine
          using a correlation matrix.
        </li>
        <li>
          <strong>Garbage in, garbage out.</strong> Monte Carlo magnifies your input assumptions.
          If your expected return is too optimistic, every path will be too optimistic. Forward-
          looking returns are usually lower than historical — current consensus for US equities
          is closer to 6-7% real, not the 10% historical average.
        </li>
      </ul>

      <h3>Related calculators</h3>
      <p>
        For risk-adjusted return analysis on a known return series, use the{' '}
        <Link href="/sharpe-ratio-calculator" className="text-accent">
          Sharpe ratio calculator
        </Link>
        . For tail-risk estimation on historical returns, use the{' '}
        <Link href="/value-at-risk-calculator" className="text-accent">
          Value at Risk calculator
        </Link>
        . For optimal position sizing given an edge, use the{' '}
        <Link href="/kelly-criterion-calculator" className="text-accent">
          Kelly criterion calculator
        </Link>
        .
      </p>
    </div>
  );
}
