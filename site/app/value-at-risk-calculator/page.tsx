import { CalculatorShell } from '@/components/CalculatorShell';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { parseNumberSeries, SAMPLE_RETURNS_DAILY } from '@/lib/parse';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/value-at-risk-calculator',
  title: 'Value at Risk (VaR) Calculator — Parametric VaR + CVaR',
  description:
    'Free Value at Risk calculator. Paste a return series, choose confidence levels and holding period — get parametric VaR and CVaR (Expected Shortfall), plus skew and kurtosis to gauge tail risk.',
  keywords: [
    'value at risk calculator',
    'var calculator',
    'cvar calculator',
    'expected shortfall',
    'parametric var',
  ],
});

interface VarResult {
  var_results: Record<
    string,
    { var: number; cvar: number; var_pct: number; cvar_pct: number; var_dollar?: number; cvar_dollar?: number }
  >;
  holding_period_days: number;
  volatility_daily: number;
  volatility_annual: number;
  skewness: number;
  kurtosis: number;
  n: number;
  ms: number;
}

interface Inputs {
  returns: number[];
  returns_text: string;
  confidence_levels: number[];
  confidence_text: string;
  holding_period_days: number;
  portfolio_value: number;
}

const DEFAULT_RETURNS_TEXT = SAMPLE_RETURNS_DAILY.map((r) => r.toFixed(4)).join(', ');

const DEFAULTS: Inputs = {
  returns: SAMPLE_RETURNS_DAILY,
  returns_text: DEFAULT_RETURNS_TEXT,
  confidence_levels: [0.95, 0.99],
  confidence_text: '0.95, 0.99',
  holding_period_days: 1,
  portfolio_value: 100000,
};

function parseInputs(sp: Record<string, string | string[] | undefined>): Inputs {
  const num = (v: string | string[] | undefined, fallback: number) => {
    if (v === undefined) return fallback;
    const s = Array.isArray(v) ? v[0] : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };
  const txt = (v: string | string[] | undefined, fallback: string) => {
    if (v === undefined) return fallback;
    return Array.isArray(v) ? v[0] : v;
  };
  const returnsText = txt(sp.returns, DEFAULT_RETURNS_TEXT);
  const returnsArr = parseNumberSeries(returnsText);
  const confText = txt(sp.confidence_levels, DEFAULTS.confidence_text);
  const confArr = parseNumberSeries(confText)
    .filter((c) => c > 0 && c < 1)
    .slice(0, 4);
  return {
    returns: returnsArr.length >= 2 ? returnsArr : SAMPLE_RETURNS_DAILY,
    returns_text: returnsText,
    confidence_levels: confArr.length > 0 ? confArr : DEFAULTS.confidence_levels,
    confidence_text: confText,
    holding_period_days: Math.max(1, Math.round(num(sp.holding_period_days, DEFAULTS.holding_period_days))),
    portfolio_value: num(sp.portfolio_value, DEFAULTS.portfolio_value),
  };
}

async function priceVar(inputs: Inputs): Promise<VarResult | null> {
  try {
    return await callQuantOracle<VarResult>('/v1/risk/var-parametric', {
      returns: inputs.returns,
      confidence_levels: inputs.confidence_levels,
      holding_period_days: inputs.holding_period_days,
      portfolio_value: inputs.portfolio_value,
    });
  } catch {
    return null;
  }
}

export default async function VarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const inputs = parseInputs(sp);
  const result = await priceVar(inputs);

  const jsonLd = [
    calculatorJsonLd({
      name: 'Value at Risk (VaR) Calculator',
      description:
        'Free parametric VaR calculator returning VaR, CVaR (Expected Shortfall), skewness, and kurtosis for a return series.',
      url: 'https://quantoracle.dev/value-at-risk-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ];

  return (
    <CalculatorShell
      slug="value-at-risk-calculator"
      title="Value at Risk (VaR) Calculator"
      subtitle="Parametric VaR plus CVaR (Expected Shortfall) for any return series at any confidence level. Returns skew and kurtosis so you can see when your data violates the normal-distribution assumption."
      inputs={<InputsCard inputs={inputs} />}
      results={result ? <ResultsCard inputs={inputs} result={result} /> : <ErrorCard />}
      interpretation={result && <Interpretation inputs={inputs} result={result} />}
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
          Decimals (0.012 = 1.2%). Comma- or whitespace-separated. Daily returns assumed.
        </span>
      </label>
      <div className="space-y-4">
        <TextField
          name="confidence_levels"
          label="Confidence levels"
          value={inputs.confidence_text}
          hint="Comma-separated, 0-1 (e.g. 0.95, 0.99)"
        />
        <Field
          name="holding_period_days"
          label="Holding period (days)"
          value={inputs.holding_period_days}
          step="any"
          min="1"
          hint="1 = 1-day VaR, 10 = Basel regulatory standard"
        />
        <Field
          name="portfolio_value"
          label="Portfolio value ($)"
          value={inputs.portfolio_value}
          step="any"
          min="0"
          hint="Optional — for dollar VaR. Set to 0 to skip."
        />
      </div>
      <button type="submit" className="btn-primary w-full mt-5">
        Calculate
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Calls the deterministic <code className="text-slate-300">/v1/risk/var-parametric</code>{' '}
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

function TextField({
  name,
  label,
  value,
  hint,
}: {
  name: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input type="text" name={name} defaultValue={value} className="field-input" required />
      {hint && <span className="text-xs text-slate-500 mt-1 block">{hint}</span>}
    </label>
  );
}

function ResultsCard({ inputs, result }: { inputs: Inputs; result: VarResult }) {
  // Sort the keys numerically so 95 comes before 99.
  const entries = Object.entries(result.var_results).sort(([a], [b]) => Number(a) - Number(b));
  const showDollar = inputs.portfolio_value > 0;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Results</h2>

      <div className="overflow-hidden rounded-md border border-ink-700/40 mb-6">
        <table className="w-full text-sm">
          <thead className="bg-ink-800/40">
            <tr>
              <th className="text-left px-3 py-2 text-xs uppercase tracking-wide text-slate-400">Confidence</th>
              <th className="text-right px-3 py-2 text-xs uppercase tracking-wide text-slate-400">VaR</th>
              <th className="text-right px-3 py-2 text-xs uppercase tracking-wide text-slate-400">CVaR</th>
              {showDollar && (
                <>
                  <th className="text-right px-3 py-2 text-xs uppercase tracking-wide text-slate-400">VaR ($)</th>
                  <th className="text-right px-3 py-2 text-xs uppercase tracking-wide text-slate-400">CVaR ($)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {entries.map(([conf, v]) => (
              <tr key={conf} className="border-t border-ink-700/40">
                <td className="px-3 py-2 font-mono">{conf}%</td>
                <td className="px-3 py-2 text-right font-mono text-chart-loss">
                  -{v.var_pct.toFixed(2)}%
                </td>
                <td className="px-3 py-2 text-right font-mono text-chart-loss">
                  -{v.cvar_pct.toFixed(2)}%
                </td>
                {showDollar && v.var_dollar !== undefined && v.cvar_dollar !== undefined && (
                  <>
                    <td className="px-3 py-2 text-right font-mono text-chart-loss">
                      -${v.var_dollar.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-chart-loss">
                      -${v.cvar_dollar.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Holding period" value={`${result.holding_period_days} day${result.holding_period_days === 1 ? '' : 's'}`} />
        <Stat label="Daily volatility" value={`${(result.volatility_daily * 100).toFixed(2)}%`} />
        <Stat label="Annualized volatility" value={`${(result.volatility_annual * 100).toFixed(2)}%`} />
        <Stat label="Skewness" value={result.skewness.toFixed(3)} />
        <Stat label="Excess kurtosis" value={result.kurtosis.toFixed(3)} />
        <Stat label="Observations" value={String(result.n)} />
      </div>

      <div className="mt-2 text-xs text-slate-500">Computed in {result.ms.toFixed(0)} ms.</div>
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
        Make sure the return series has at least 2 numeric values, and confidence levels are
        between 0 and 1 (e.g. 0.95, not 95).
      </p>
    </div>
  );
}

function Interpretation({ inputs, result }: { inputs: Inputs; result: VarResult }) {
  const v95 = result.var_results['95'];
  if (!v95) return null;
  const fattail = result.kurtosis > 1;
  const skewed = Math.abs(result.skewness) > 0.5;
  const dollarStr =
    inputs.portfolio_value > 0 && v95.var_dollar !== undefined
      ? ` ($${v95.var_dollar.toLocaleString(undefined, { maximumFractionDigits: 0 })})`
      : '';
  return (
    <p>
      With 95% confidence, you should not lose more than{' '}
      <strong>{v95.var_pct.toFixed(2)}%</strong>
      {dollarStr} over a {result.holding_period_days}-day holding period. On the worst 5% of days,
      the average loss (CVaR) is <strong>{v95.cvar_pct.toFixed(2)}%</strong>. Daily volatility is{' '}
      {(result.volatility_daily * 100).toFixed(2)}%; annualized,{' '}
      {(result.volatility_annual * 100).toFixed(2)}%.
      {(fattail || skewed) && (
        <>
          {' '}
          <strong className="text-chart-loss">Caveat:</strong>{' '}
          {fattail && `excess kurtosis of ${result.kurtosis.toFixed(2)} indicates fatter-than-normal tails`}
          {fattail && skewed && ' and '}
          {skewed && `skewness of ${result.skewness.toFixed(2)} indicates asymmetric distribution`}
          . Parametric VaR likely understates true tail risk for this data — actual large-loss
          days may be more common than the 5% the 95% number implies.
        </>
      )}
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>What VaR really tells you</h2>
      <p>
        Value at Risk became the dominant risk metric in the 1990s because it gave a single,
        digestible number to senior managers and regulators: &quot;your 1-day 99% VaR is $4
        million.&quot; That clarity was its strength and its weakness. VaR tells you the threshold
        loss you should not exceed at a chosen confidence level. It does not tell you how bad it
        gets if you do.
      </p>

      <h3>Three ways to compute VaR</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Parametric (this calculator):</strong> assume normal returns, compute analytically
          from the volatility. Fast, clean, used here. Underestimates tail risk for fat-tailed
          assets.
        </li>
        <li>
          <strong>Historical simulation:</strong> empirically count quantiles of the historical
          return series — i.e. for 95% VaR, find the 5th-worst day in your sample and use that.
          Captures actual tail behavior of your data without assuming a distribution.
        </li>
        <li>
          <strong>Monte Carlo:</strong> simulate thousands of paths under a model (could be normal,
          t-distribution, or more complex) and read off the empirical quantile. Most flexible,
          most computationally expensive. The QuantOracle API has{' '}
          <a href="/api-docs" className="text-accent">
            <code>/v1/simulate/montecarlo</code>
          </a>{' '}
          for this.
        </li>
      </ul>

      <h3>Why CVaR is increasingly preferred</h3>
      <p>
        After 2008, regulators and risk managers shifted attention from VaR to CVaR (Conditional
        VaR, also called Expected Shortfall). CVaR is the average loss given that you are in the
        tail beyond VaR. Two portfolios can have identical VaRs but very different CVaRs — one
        with a smooth tail, one with a few catastrophic outcomes. CVaR distinguishes them; VaR does
        not. Basel III replaced VaR with CVaR (97.5% confidence) for trading-book regulatory
        capital in 2019.
      </p>

      <h3>Skewness and kurtosis as red flags</h3>
      <p>
        Parametric VaR assumes returns are normal. Real returns often are not.{' '}
        <strong>Skewness</strong> measures asymmetry: most equity strategies have negative skew
        (big losses more common than big gains). <strong>Excess kurtosis</strong> above zero means
        fat tails — rare events of either direction happen more often than the normal distribution
        predicts. When skewness is meaningfully nonzero or excess kurtosis is meaningfully above
        zero, parametric VaR is understating real risk. Use historical simulation or Monte Carlo
        with a fat-tailed distribution instead.
      </p>

      <h3>The square-root-of-time scaling</h3>
      <p>
        VaR scales with the square root of the holding period:{' '}
        <code>VaR(T-day) = VaR(1-day) × √T</code>. So 10-day VaR is √10 ≈ 3.16x the 1-day VaR, not
        10x. This assumes returns are independent across days, which is approximately true for most
        liquid assets but breaks down during crises (when volatility clusters and serial
        correlation rises). For autocorrelated return series, the actual scaling is faster than
        √T.
      </p>

      <h3>Related risk metrics</h3>
      <p>
        See the <a href="/sharpe-ratio-calculator" className="text-accent">Sharpe ratio calculator</a>{' '}
        for the upside-vs-volatility ratio, the{' '}
        <a href="/kelly-criterion-calculator" className="text-accent">Kelly calculator</a> for
        optimal position sizing given an edge, and the composite{' '}
        <code>/v1/risk/full-analysis</code> endpoint for max drawdown, Sortino, Calmar, and other
        risk metrics in a single API call.
      </p>
    </div>
  );
}
