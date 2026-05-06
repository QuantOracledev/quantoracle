import { CalculatorShell } from '@/components/CalculatorShell';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { parseNumberSeries, SAMPLE_RETURNS_DAILY } from '@/lib/parse';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/sharpe-ratio-calculator',
  title: 'Sharpe Ratio Calculator (Free, with Confidence Interval)',
  description:
    'Free Sharpe ratio calculator. Paste a return series, choose a risk-free rate and annualization factor, get the annualized Sharpe with a 95% confidence interval.',
  keywords: [
    'sharpe ratio calculator',
    'sharpe ratio formula',
    'risk adjusted return',
    'sharpe ratio confidence interval',
    'annualized sharpe',
  ],
});

interface SharpeResult {
  sharpe_ratio: number;
  annualized_return: number;
  annualized_vol: number;
  excess_return: number;
  se_sharpe: number;
  ci_95_lower: number;
  ci_95_upper: number;
  n: number;
  ms: number;
}

interface Inputs {
  returns: number[];
  returns_text: string;
  risk_free_rate: number;
  annualization_factor: number;
}

const DEFAULT_TEXT = SAMPLE_RETURNS_DAILY.map((r) => r.toFixed(4)).join(', ');

const DEFAULTS: Inputs = {
  returns: SAMPLE_RETURNS_DAILY,
  returns_text: DEFAULT_TEXT,
  risk_free_rate: 0.04,
  annualization_factor: 252,
};

function parseInputs(sp: Record<string, string | string[] | undefined>): Inputs {
  const num = (v: string | string[] | undefined, fallback: number) => {
    if (v === undefined) return fallback;
    const s = Array.isArray(v) ? v[0] : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };
  const text = (() => {
    const v = sp.returns;
    if (v === undefined) return DEFAULT_TEXT;
    return Array.isArray(v) ? v[0] : v;
  })();
  const arr = parseNumberSeries(text);
  return {
    returns: arr.length >= 2 ? arr : SAMPLE_RETURNS_DAILY,
    returns_text: text,
    risk_free_rate: num(sp.risk_free_rate, DEFAULTS.risk_free_rate),
    annualization_factor: Math.round(num(sp.annualization_factor, DEFAULTS.annualization_factor)),
  };
}

async function priceSharpe(inputs: Inputs): Promise<SharpeResult | null> {
  try {
    return await callQuantOracle<SharpeResult>('/v1/stats/sharpe-ratio', {
      returns: inputs.returns,
      risk_free_rate: inputs.risk_free_rate,
      annualization_factor: inputs.annualization_factor,
    });
  } catch {
    return null;
  }
}

export default async function SharpePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const inputs = parseInputs(sp);
  const result = await priceSharpe(inputs);

  const jsonLd = [
    calculatorJsonLd({
      name: 'Sharpe Ratio Calculator',
      description:
        'Free Sharpe ratio calculator with 95% confidence interval, configurable risk-free rate and annualization factor.',
      url: 'https://quantoracle.dev/sharpe-ratio-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ];

  return (
    <CalculatorShell
      slug="sharpe-ratio-calculator"
      title="Sharpe Ratio Calculator"
      subtitle="Compute the Sharpe ratio of any return series with a configurable risk-free rate. Includes the 95% confidence interval, which most calculators omit but matters a lot for short samples."
      inputs={<InputsCard inputs={inputs} />}
      results={result ? <ResultsCard result={result} /> : <ErrorCard />}
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
      <label className="block mb-4">
        <span className="field-label">Periodic returns</span>
        <textarea
          name="returns"
          defaultValue={inputs.returns_text}
          className="field-input font-mono text-xs"
          rows={6}
          placeholder="0.012, -0.008, 0.005, ..."
          required
        />
        <span className="text-xs text-slate-500 mt-1 block">
          Comma- or whitespace-separated. Decimals not percentages (use 0.012 for 1.2%).
        </span>
      </label>
      <div className="space-y-4">
        <Field
          name="risk_free_rate"
          label="Risk-free rate (annual)"
          value={inputs.risk_free_rate}
          step="any"
          min="0"
          hint="0.04 = 4% (current 3-month Treasury yield)"
        />
        <Field
          name="annualization_factor"
          label="Annualization factor"
          value={inputs.annualization_factor}
          step="any"
          min="1"
          hint="252 for daily, 52 for weekly, 12 for monthly"
        />
      </div>
      <button type="submit" className="btn-primary w-full mt-5">
        Calculate
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Calls the deterministic <code className="text-slate-300">/v1/stats/sharpe-ratio</code>{' '}
        endpoint server-side.
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

function ResultsCard({ result }: { result: SharpeResult }) {
  const ciContainsZero = result.ci_95_lower < 0 && result.ci_95_upper > 0;
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Results</h2>

      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
          Annualized Sharpe ratio
        </div>
        <div className={`font-mono text-3xl tabular-nums ${result.sharpe_ratio < 0 ? 'text-chart-loss' : 'text-accent'}`}>
          {result.sharpe_ratio.toFixed(3)}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          95% CI: [{result.ci_95_lower.toFixed(2)}, {result.ci_95_upper.toFixed(2)}]
          {ciContainsZero && (
            <span className="ml-2 text-chart-loss">
              · CI contains zero — not statistically distinguishable from no edge
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Annualized return" value={`${(result.annualized_return * 100).toFixed(2)}%`} />
        <Stat label="Annualized vol" value={`${(result.annualized_vol * 100).toFixed(2)}%`} />
        <Stat label="Excess return" value={`${(result.excess_return * 100).toFixed(2)}%`} />
        <Stat label="Std error of Sharpe" value={result.se_sharpe.toFixed(3)} />
        <Stat label="Observations" value={String(result.n)} />
        <Stat label="Compute time" value={`${result.ms.toFixed(0)} ms`} />
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
        The API returned an error. Make sure the return series has at least 2 numeric values
        (decimals, not percentages — use 0.012 not 1.2).
      </p>
    </div>
  );
}

function Interpretation({ result }: { result: SharpeResult }) {
  const tier =
    result.sharpe_ratio < 0
      ? 'a losing strategy in this sample'
      : result.sharpe_ratio < 0.5
        ? 'below typical for a long-only equity strategy'
        : result.sharpe_ratio < 1.0
          ? 'typical for a diversified long-only strategy'
          : result.sharpe_ratio < 1.5
            ? 'good — better than most active funds'
            : result.sharpe_ratio < 2.5
              ? 'excellent — quant-fund territory'
              : 'extremely high — verify the data is clean';
  const ciNote =
    result.ci_95_lower < 0 && result.ci_95_upper > 0
      ? `, but the 95% confidence interval (${result.ci_95_lower.toFixed(2)} to ${result.ci_95_upper.toFixed(2)}) crosses zero — with only ${result.n} observations the result is not statistically significant`
      : `; the 95% confidence interval is ${result.ci_95_lower.toFixed(2)} to ${result.ci_95_upper.toFixed(2)}`;
  return (
    <p>
      The annualized Sharpe ratio of <strong>{result.sharpe_ratio.toFixed(2)}</strong> is{' '}
      <strong>{tier}</strong>
      {ciNote}. The strategy returned an annualized{' '}
      <strong>{(result.annualized_return * 100).toFixed(2)}%</strong> at{' '}
      <strong>{(result.annualized_vol * 100).toFixed(2)}%</strong> volatility.
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>Why Sharpe matters</h2>
      <p>
        Two strategies that returned 20% in a year are not equivalent if one ran at 10% volatility
        and the other at 40%. The first is twice as efficient with risk; over many years the lower-
        vol strategy will compound more reliably and have shallower drawdowns. The Sharpe ratio
        captures that distinction in one number: excess return per unit of volatility.
      </p>

      <h3>The formula</h3>
      <p>
        Per-period Sharpe = <code>(mean return − risk-free rate) / std deviation</code>. Annualized
        Sharpe scales by the square root of the number of periods per year:{' '}
        <code>per-period Sharpe × √(periods per year)</code>. For daily data with 252 trading days,
        that means multiplying by ~15.87.
      </p>

      <h3>What the confidence interval tells you</h3>
      <p>
        Most online calculators just give you a Sharpe number. That is misleading: with 30 daily
        returns, a sample Sharpe of 2.0 might really be anywhere from -1 to +5. The 95% CI shown
        here uses Lo&apos;s 2002 standard error formula. A wide CI means &quot;not enough data to
        say.&quot; A narrow CI that excludes zero means &quot;there really is something here.&quot;
      </p>

      <h3>What Sharpe does NOT capture</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Asymmetry.</strong> Sharpe penalizes upside volatility just as much as downside
          volatility. The Sortino ratio fixes this by using downside deviation only.
        </li>
        <li>
          <strong>Tail risk.</strong> Sharpe assumes returns are roughly normal. Strategies that
          look great by Sharpe but have fat-tailed losses (e.g. selling out-of-the-money options)
          can blow up despite a high reported Sharpe.
        </li>
        <li>
          <strong>Drawdown.</strong> The peak-to-trough loss along the way is invisible in Sharpe.
          Calmar ratio (return divided by max drawdown) addresses this.
        </li>
        <li>
          <strong>Survivorship and selection bias.</strong> A backtest run on the current S&amp;P
          500 constituents has a higher Sharpe than the live strategy will, because failed
          companies were dropped from the index over time.
        </li>
      </ul>

      <h3>For more depth</h3>
      <p>
        For a fuller risk picture, the QuantOracle{' '}
        <a href="/api-docs" className="text-accent">
          composite endpoint
        </a>{' '}
        <code>/v1/risk/full-analysis</code> returns Sharpe alongside Sortino, Calmar, max
        drawdown, VaR, CVaR, and Kelly in a single call. For just downside risk, see the{' '}
        <a href="/value-at-risk-calculator" className="text-accent">
          Value at Risk calculator
        </a>
        .
      </p>
    </div>
  );
}
