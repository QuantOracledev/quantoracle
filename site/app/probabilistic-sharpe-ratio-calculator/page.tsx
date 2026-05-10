import { CalculatorShell } from '@/components/CalculatorShell';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { parseNumberSeries, SAMPLE_RETURNS_DAILY } from '@/lib/parse';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/probabilistic-sharpe-ratio-calculator',
  title: 'Probabilistic Sharpe Ratio Calculator (Lopez de Prado, 2012)',
  description:
    'Free probabilistic Sharpe ratio (PSR) calculator. Adjusts Sharpe for sample size, skewness, and kurtosis. Tells you the probability that a strategy genuinely beats a benchmark Sharpe.',
  keywords: [
    'probabilistic sharpe ratio calculator',
    'PSR calculator',
    'lopez de prado',
    'sharpe ratio significance',
    'minimum track record length',
    'deflated sharpe',
  ],
});

interface PSRResult {
  probabilistic_sharpe_ratio: number;
  sharpe_ratio: number;
  benchmark_sharpe: number;
  z_score: number;
  significant_at_95: boolean;
  significant_at_99: boolean;
  se_sharpe: number;
  skewness: number;
  excess_kurtosis: number;
  min_track_record_length: number;
  n: number;
  ms: number;
}

interface Inputs {
  returns: number[];
  returns_text: string;
  benchmark_sharpe: number;
  risk_free_rate: number;
  annualization_factor: number;
}

const DEFAULT_TEXT = SAMPLE_RETURNS_DAILY.map((r) => r.toFixed(4)).join(', ');

const DEFAULTS: Inputs = {
  returns: SAMPLE_RETURNS_DAILY,
  returns_text: DEFAULT_TEXT,
  benchmark_sharpe: 0,
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
    benchmark_sharpe: num(sp.benchmark_sharpe, DEFAULTS.benchmark_sharpe),
    risk_free_rate: num(sp.risk_free_rate, DEFAULTS.risk_free_rate),
    annualization_factor: Math.round(num(sp.annualization_factor, DEFAULTS.annualization_factor)),
  };
}

async function calc(inputs: Inputs): Promise<PSRResult | null> {
  try {
    return await callQuantOracle<PSRResult>('/v1/stats/probabilistic-sharpe', {
      returns: inputs.returns,
      benchmark_sharpe: inputs.benchmark_sharpe,
      risk_free_rate: inputs.risk_free_rate,
      annualization_factor: inputs.annualization_factor,
    });
  } catch {
    return null;
  }
}

export default async function PSRPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const inputs = parseInputs(sp);
  const result = await calc(inputs);

  const jsonLd = [
    calculatorJsonLd({
      name: 'Probabilistic Sharpe Ratio Calculator',
      description:
        'Free probabilistic Sharpe ratio (PSR) calculator. Adjusts Sharpe for sample size, skewness, and kurtosis to give the probability of true edge.',
      url: 'https://quantoracle.dev/probabilistic-sharpe-ratio-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ];

  return (
    <CalculatorShell
      slug="probabilistic-sharpe-ratio-calculator"
      title="Probabilistic Sharpe Ratio Calculator"
      subtitle="The Sharpe ratio adjusted for sample size, skewness, and kurtosis. Tells you the probability that your strategy's Sharpe is real edge — not sampling noise. Lopez de Prado, 2012."
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
          Comma- or whitespace-separated decimals (use 0.012 for 1.2%, not 1.2).
        </span>
      </label>
      <div className="space-y-4">
        <Field
          name="benchmark_sharpe"
          label="Benchmark Sharpe"
          value={inputs.benchmark_sharpe}
          step="any"
          hint="0 = test for any positive edge. 0.4 = test against S&P 500 long-run Sharpe."
        />
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
          hint="252 daily, 52 weekly, 12 monthly"
        />
      </div>
      <button type="submit" className="btn-primary w-full mt-5">
        Calculate
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Calls the deterministic{' '}
        <code className="text-slate-300">/v1/stats/probabilistic-sharpe</code> endpoint server-side.
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

function ResultsCard({ result }: { result: PSRResult }) {
  const psrColor =
    result.probabilistic_sharpe_ratio > 0.95
      ? 'text-chart-gain'
      : result.probabilistic_sharpe_ratio > 0.5
        ? 'text-accent'
        : 'text-chart-loss';
  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Results</h2>
        <span className="text-xs text-slate-500">{result.n} observations</span>
      </div>

      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
          Probabilistic Sharpe Ratio
        </div>
        <div className={`font-mono text-4xl tabular-nums ${psrColor}`}>
          {(result.probabilistic_sharpe_ratio * 100).toFixed(2)}%
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Probability that the true Sharpe exceeds {result.benchmark_sharpe.toFixed(2)}
          {result.significant_at_99 ? (
            <span className="ml-2 text-chart-gain">· Significant at 99%</span>
          ) : result.significant_at_95 ? (
            <span className="ml-2 text-chart-gain">· Significant at 95%</span>
          ) : (
            <span className="ml-2 text-chart-loss">· Not significant</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Annualized Sharpe" value={result.sharpe_ratio.toFixed(3)} />
        <Stat label="Z-score" value={result.z_score.toFixed(3)} />
        <Stat label="Std error of Sharpe" value={result.se_sharpe.toFixed(3)} />
        <Stat label="Skewness" value={result.skewness.toFixed(3)} />
        <Stat label="Excess kurtosis" value={result.excess_kurtosis.toFixed(3)} />
        <Stat
          label="Min track record (periods)"
          value={
            Number.isFinite(result.min_track_record_length)
              ? Math.ceil(result.min_track_record_length).toString()
              : '∞'
          }
        />
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
        Make sure the return series has at least 2 numeric values (decimals, not percentages —
        use 0.012 not 1.2). PSR estimation is more reliable with 30+ observations.
      </p>
    </div>
  );
}

function Interpretation({ result }: { result: PSRResult }) {
  const psr = result.probabilistic_sharpe_ratio;
  const psrPct = psr * 100;
  const conclusion =
    psr > 0.99
      ? 'strongly significant — the strategy almost certainly has real edge over the benchmark'
      : psr > 0.95
        ? 'statistically significant — convincing evidence of edge over the benchmark'
        : psr > 0.75
          ? 'suggestive but not yet significant — more data is needed before claiming edge'
          : psr > 0.5
            ? 'weak evidence — the apparent Sharpe is more noise than signal at this sample size'
            : 'not significant — the observed Sharpe is consistent with no edge over the benchmark';
  const skewNote =
    Math.abs(result.skewness) > 1
      ? ` The strong return skewness (${result.skewness.toFixed(2)}) is a major reason PSR differs from raw Sharpe — the regular Sharpe overstates edge under non-normal returns.`
      : Math.abs(result.excess_kurtosis) > 3
        ? ` The fat-tailed return distribution (excess kurtosis ${result.excess_kurtosis.toFixed(2)}) widens the uncertainty around the true Sharpe.`
        : '';
  const mtrlNote = Number.isFinite(result.min_track_record_length)
    ? ` To reach 95% significance, this strategy would need at least ${Math.ceil(
        result.min_track_record_length,
      ).toLocaleString()} observations.`
    : '';
  return (
    <p>
      With a Sharpe ratio of <strong>{result.sharpe_ratio.toFixed(2)}</strong> over {result.n}{' '}
      observations, the probability that the true long-run Sharpe exceeds{' '}
      {result.benchmark_sharpe.toFixed(2)} is <strong>{psrPct.toFixed(1)}%</strong> —{' '}
      <strong>{conclusion}</strong>.{skewNote}
      {mtrlNote}
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>Why the regular Sharpe ratio lies, and what to use instead</h2>
      <p>
        The Sharpe ratio is the most-cited number in quant finance, and it is also one of the most
        misleading. The standard formula (mean excess return divided by standard deviation) gives
        you a single point estimate that says nothing about how confident you should be in it.
        Two things break it: small sample sizes (the law of large numbers has not kicked in) and
        non-normal returns (skew and kurtosis distort the assumption that volatility captures all
        the risk). The probabilistic Sharpe ratio (PSR), introduced by Marcos López de Prado in
        2012, addresses both.
      </p>

      <h3>The intuition behind PSR</h3>
      <p>
        PSR asks: &quot;given my observed Sharpe, my sample size, and the higher moments of my
        returns, what is the probability that my TRUE long-run Sharpe exceeds some benchmark?&quot;
        The benchmark is usually 0 (i.e. &quot;is there any edge at all?&quot;) but you can also
        test against the S&amp;P 500&apos;s long-run Sharpe of ~0.4 to ask &quot;is my strategy
        better than passive equity exposure?&quot;.
      </p>
      <p>
        The output is a probability between 0 and 1. By convention, PSR &gt; 0.95 is the threshold
        for &quot;publication-grade significance&quot;, equivalent to the standard 5% statistical
        significance test in regression analysis.
      </p>

      <h3>The formula</h3>
      <p>
        PSR is the cumulative normal distribution evaluated at a z-score that adjusts the raw
        Sharpe for sample size, skewness, and excess kurtosis:
      </p>
      <p>
        <code>
          z = (Sharpe − Benchmark Sharpe) × √(N − 1) / √(1 − γ₃·Sharpe + ((γ₄ − 1)/4)·Sharpe²)
        </code>
      </p>
      <p>
        Where γ₃ is skewness and γ₄ is kurtosis (not excess kurtosis). Then PSR = Φ(z) where Φ is
        the standard normal CDF. The denominator inflates when skew is negative or kurtosis is
        high, which lowers the z-score and therefore lowers PSR — exactly the desired behavior.
      </p>

      <h3>What MTRL tells you</h3>
      <p>
        The minimum track record length (MTRL) is one of the most useful outputs of PSR analysis.
        It tells you the smallest number of observations needed for the strategy&apos;s observed
        Sharpe to plausibly clear the 95% significance threshold. If MTRL is 800 daily returns and
        you only have 200, you simply do not have enough data to claim edge — no matter how
        impressive the point Sharpe looks. Strategies with low Sharpes or fat-tailed return
        distributions need much longer track records to prove themselves.
      </p>

      <h3>Why this matters for capital allocation</h3>
      <p>
        Imagine two strategies you are considering for a $10M allocation:
      </p>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Strategy A</strong>: Sharpe 1.5 over 6 months (125 observations), with negative
          skew (-1.5) and high kurtosis (8). PSR ≈ 0.75. Looks great by Sharpe alone, but PSR
          warns you it is mostly small wins punctuated by occasional large losses — and you
          haven&apos;t seen the next loss yet.
        </li>
        <li>
          <strong>Strategy B</strong>: Sharpe 0.9 over 5 years (1,250 observations), with mild
          positive skew (0.3) and near-normal kurtosis. PSR ≈ 0.99. Lower point Sharpe but
          dramatically more reliable evidence of true edge.
        </li>
      </ul>
      <p>
        Sharpe alone says A is better. PSR correctly identifies B as the safer allocation. This is
        exactly the kind of decision PSR was designed to inform.
      </p>

      <h3>Strategies that get penalized by PSR (deservedly)</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Selling out-of-the-money options</strong> — heavy negative skew. Looks great
          until the tail event hits.
        </li>
        <li>
          <strong>Carry trades</strong> — &quot;picking up nickels in front of a steamroller&quot;,
          high Sharpe with severe negative skew.
        </li>
        <li>
          <strong>Short-vol strategies</strong> — same pattern: many small wins, occasional
          catastrophic losses.
        </li>
        <li>
          <strong>Recently launched strategies</strong> — small N alone hammers the PSR even with
          normal returns.
        </li>
      </ul>

      <h3>Strategies PSR rewards</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Trend-following</strong> — positive skew (rare big wins, frequent small losses)
          actually inflates PSR above raw Sharpe.
        </li>
        <li>
          <strong>Long-vol strategies</strong> — same favorable skew profile.
        </li>
        <li>
          <strong>Long-track-record strategies</strong> — large N narrows the confidence interval
          around the Sharpe.
        </li>
      </ul>

      <h3>Related calculators</h3>
      <p>
        For the underlying point-estimate Sharpe with a 95% confidence interval, see the{' '}
        <a href="/sharpe-ratio-calculator" className="text-accent">
          Sharpe ratio calculator
        </a>
        . For other return-distribution diagnostics, see the{' '}
        <a href="/hurst-exponent-calculator" className="text-accent">
          Hurst exponent calculator
        </a>{' '}
        and the{' '}
        <a href="/value-at-risk-calculator" className="text-accent">
          value-at-risk calculator
        </a>
        . For position sizing once you have established edge, see the{' '}
        <a href="/kelly-criterion-calculator" className="text-accent">
          Kelly criterion calculator
        </a>
        .
      </p>
    </div>
  );
}
