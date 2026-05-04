import Link from 'next/link';
import { CalculatorShell } from '@/components/CalculatorShell';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/kelly-criterion-calculator',
  title: 'Kelly Criterion Calculator (Free, with Half- and Quarter-Kelly)',
  description:
    'Free Kelly criterion calculator. Enter your win rate, average win, and average loss — get full, half, and quarter-Kelly position sizes plus your edge and payoff ratio.',
  keywords: [
    'kelly criterion calculator',
    'kelly formula',
    'optimal bet size',
    'half kelly',
    'position sizing',
  ],
});

interface KellyResult {
  full_kelly: number;
  half_kelly: number;
  quarter_kelly: number;
  edge: number;
  payoff_ratio: number;
  recommended: string;
  ms: number;
}

interface Inputs {
  win_rate: number;
  avg_win: number;
  avg_loss: number;
}

const DEFAULTS: Inputs = { win_rate: 0.55, avg_win: 150, avg_loss: 100 };

function parseInputs(sp: Record<string, string | string[] | undefined>): Inputs {
  const num = (v: string | string[] | undefined, fallback: number) => {
    if (v === undefined) return fallback;
    const s = Array.isArray(v) ? v[0] : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    win_rate: num(sp.win_rate, DEFAULTS.win_rate),
    avg_win: num(sp.avg_win, DEFAULTS.avg_win),
    avg_loss: num(sp.avg_loss, DEFAULTS.avg_loss),
  };
}

async function priceKelly(inputs: Inputs): Promise<KellyResult | null> {
  try {
    return await callQuantOracle<KellyResult>('/v1/risk/kelly', {
      mode: 'discrete',
      ...inputs,
    });
  } catch {
    return null;
  }
}

export default async function KellyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const inputs = parseInputs(sp);
  const result = await priceKelly(inputs);

  const jsonLd = [
    calculatorJsonLd({
      name: 'Kelly Criterion Calculator',
      description:
        'Free Kelly criterion calculator returning full-, half-, and quarter-Kelly position sizes given win rate and average win/loss.',
      url: 'https://quantoracle.dev/kelly-criterion-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ];

  return (
    <CalculatorShell
      slug="kelly-criterion-calculator"
      title="Kelly Criterion Calculator"
      subtitle="Find the optimal fraction of your bankroll to risk on each bet given your win rate and win-to-loss ratio. Includes the safer half- and quarter-Kelly variants most professionals actually use."
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
          name="win_rate"
          label="Win rate (probability)"
          value={inputs.win_rate}
          step="0.01"
          min="0.01"
          max="0.99"
          hint="0.55 = 55% — fraction of bets you expect to win"
        />
        <Field
          name="avg_win"
          label="Average win ($)"
          value={inputs.avg_win}
          step="0.01"
          min="0.01"
          hint="Average dollar amount won on winning trades"
        />
        <Field
          name="avg_loss"
          label="Average loss ($)"
          value={inputs.avg_loss}
          step="0.01"
          min="0.01"
          hint="Enter as a positive number — average dollar amount lost"
        />
      </div>
      <button type="submit" className="btn-primary w-full mt-5">
        Calculate
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Calls the deterministic <code className="text-slate-300">/v1/risk/kelly</code> endpoint
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

function ResultsCard({ inputs, result }: { inputs: Inputs; result: KellyResult }) {
  const fullPct = result.full_kelly * 100;
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Results</h2>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <KellyBox label="Full Kelly" value={result.full_kelly} highlight={result.recommended === 'FULL_KELLY'} />
        <KellyBox label="Half Kelly" value={result.half_kelly} highlight={result.recommended === 'HALF_KELLY'} />
        <KellyBox label="Quarter Kelly" value={result.quarter_kelly} highlight={result.recommended === 'QUARTER_KELLY'} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Edge" value={`${result.edge.toFixed(2)}%`} />
        <Stat label="Payoff ratio" value={`${result.payoff_ratio.toFixed(2)}×`} />
        <Stat label="Win rate" value={`${(inputs.win_rate * 100).toFixed(1)}%`} />
      </div>

      <div className="mt-4 p-3 rounded-md bg-ink-800/40 border border-ink-700/40">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Recommendation</div>
        <div className="text-sm">
          <span className="text-accent font-semibold">
            {result.recommended.replace(/_/g, ' ').toLowerCase()}
          </span>{' '}
          — risking{' '}
          <strong>
            {fullPct < 0
              ? 'do not bet (negative edge)'
              : `${(getRecommendedFraction(result) * 100).toFixed(2)}% of bankroll per bet`}
          </strong>
        </div>
      </div>

      <div className="mt-2 text-xs text-slate-500">Computed in {result.ms.toFixed(0)} ms.</div>
    </div>
  );
}

function getRecommendedFraction(r: KellyResult): number {
  if (r.recommended === 'FULL_KELLY') return r.full_kelly;
  if (r.recommended === 'HALF_KELLY') return r.half_kelly;
  return r.quarter_kelly;
}

function KellyBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight: boolean;
}) {
  const pct = (value * 100).toFixed(2);
  return (
    <div
      className={`rounded-md p-3 ${highlight ? 'bg-accent/10 border border-accent/40' : 'bg-ink-800/40'}`}
    >
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</div>
      <div className={`font-mono text-lg tabular-nums ${value < 0 ? 'text-chart-loss' : 'text-accent'}`}>
        {pct}%
      </div>
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
        Check that win rate is between 0 and 1, and that average win and loss are positive numbers.
      </p>
    </div>
  );
}

function Interpretation({ result }: { result: KellyResult }) {
  if (result.full_kelly < 0) {
    return (
      <p>
        Your edge is <strong>negative</strong> ({result.edge.toFixed(2)}%) — the inputs imply a
        losing strategy. Kelly recommends not taking this bet. If these are real numbers from your
        trading history, the system is unprofitable in expectation; if they are estimates, double-
        check them.
      </p>
    );
  }
  const recommendedPct = (getRecommendedFraction(result) * 100).toFixed(2);
  const fullPct = (result.full_kelly * 100).toFixed(2);
  return (
    <p>
      With your inputs, full Kelly says risk <strong>{fullPct}%</strong> of your bankroll per bet,
      but the recommendation is <strong>{result.recommended.replace(/_/g, ' ').toLowerCase()}</strong>{' '}
      — i.e. <strong>{recommendedPct}%</strong> per bet. The conservative recommendation is
      because Kelly inputs (win rate, avg win, avg loss) are usually estimated, not known exactly,
      and small overestimates of edge cause severe overbetting. Your edge is{' '}
      <strong>{result.edge.toFixed(2)}%</strong> with a payoff ratio of{' '}
      <strong>{result.payoff_ratio.toFixed(2)}×</strong>.
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>How the Kelly criterion works</h2>
      <p>
        John Kelly Jr. derived the formula at Bell Labs in 1956 to maximize the long-term geometric
        growth rate of capital under repeated favorable bets. Edward Thorp later applied it to
        blackjack and to portfolio management. The intuition: if you bet too small, you grow
        slowly; if you bet too big, occasional losses compound and your bankroll goes to zero.
        There is a unique fraction in between that maximizes long-run growth — that fraction is
        Kelly.
      </p>

      <h3>The formula in plain English</h3>
      <p>
        For a discrete bet with two outcomes, <code>f* = p − (1 − p) / b</code>. Here{' '}
        <code>p</code> is your probability of winning, and <code>b</code> is the ratio of average
        win to average loss. The expression <code>p − (1 − p) / b</code> is your edge per dollar
        risked, expressed as a fraction.
      </p>
      <p>
        Concrete example: if you win 55% of the time, with average wins of $150 and average losses
        of $100, then <code>p</code> = 0.55, <code>b</code> = 1.5, and{' '}
        <code>f* = 0.55 − 0.45 / 1.5 = 0.55 − 0.30 = 0.25</code>. Full Kelly says bet 25% of your
        bankroll on this opportunity. Half Kelly says 12.5%; quarter Kelly says 6.25%.
      </p>

      <h3>Why most professionals use a fraction of Kelly</h3>
      <p>
        The full Kelly formula assumes you know your edge exactly. In practice, you estimate it from
        a sample of past trades, and the estimate is noisy. Overestimating your edge by 20% can
        cause severe overbetting that destroys the long-run advantage. Half-Kelly captures about
        75% of the long-term growth rate with substantially lower volatility and a much lower
        probability of large drawdowns. Quarter-Kelly is even more conservative — about 50% of full-
        Kelly growth with a much smoother equity curve. Almost no one runs full Kelly in real
        money management for this reason.
      </p>

      <h3>When Kelly does NOT apply</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Single-shot decisions.</strong> Kelly maximizes long-term growth across many
          bets. For a one-time decision, the right answer depends on your utility function, not on
          Kelly.
        </li>
        <li>
          <strong>Multiple correlated bets.</strong> Single-bet Kelly assumes one bet at a time. If
          you have multiple positions running simultaneously, you should size each smaller — divide
          by the number of independent bets, more if they are correlated.
        </li>
        <li>
          <strong>Continuous returns.</strong> For a strategy that produces a continuous return
          stream (not discrete win/loss outcomes), use the continuous-Kelly formula:{' '}
          <code>f* = mean(returns) / variance(returns)</code>. The QuantOracle API supports this
          via <code>mode=continuous</code>.
        </li>
        <li>
          <strong>Non-stationary edge.</strong> If your edge changes over time (markets adapt,
          strategies decay), the static Kelly fraction is wrong. Re-estimate often, and use a
          smaller fraction than the textbook formula suggests.
        </li>
      </ul>
    </div>
  );
}
