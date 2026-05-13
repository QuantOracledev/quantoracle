import { CalculatorShell } from '@/components/CalculatorShell';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { parseNumberSeries } from '@/lib/parse';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/hurst-exponent-calculator',
  title: 'Hurst Exponent Calculator (Trending vs Mean-Reverting)',
  description:
    'Free Hurst exponent calculator using R/S analysis. Paste a price or return series and classify it as trending, mean-reverting, or random walk. Pick the right strategy for the regime.',
  keywords: [
    'hurst exponent calculator',
    'hurst exponent',
    'r/s analysis',
    'rescaled range analysis',
    'trending vs mean reverting',
    'long memory time series',
  ],
});

interface HurstResult {
  hurst_exponent: number;
  interpretation: string;
  r_squared: number;
  n_windows: number;
  series_length: number;
  ms: number;
}

interface Inputs {
  series: number[];
  series_text: string;
  min_window: number;
  max_window: number;
}

// A 100-point sample series with a mild upward trend plus noise.
// Designed to land near H ≈ 0.55-0.65 (mildly trending), illustrating a
// realistic financial-style signal rather than pure noise or pure trend.
const SAMPLE_SERIES = [
  100.0, 100.4, 100.9, 101.2, 100.8, 101.4, 102.1, 102.5, 103.0, 102.7, 103.3, 103.8, 104.4, 104.1,
  104.7, 105.3, 105.0, 105.6, 106.2, 106.8, 106.5, 107.1, 107.7, 108.3, 108.0, 108.6, 109.2, 109.8,
  109.4, 110.0, 110.7, 111.3, 110.9, 111.5, 112.2, 112.8, 112.4, 113.0, 113.6, 114.3, 113.9, 114.5,
  115.1, 115.7, 115.3, 115.9, 116.5, 117.2, 116.8, 117.4, 118.0, 118.6, 118.2, 118.8, 119.5, 120.1,
  119.7, 120.3, 120.9, 121.5, 121.1, 121.7, 122.4, 123.0, 122.6, 123.2, 123.8, 124.4, 124.0, 124.6,
  125.3, 125.9, 125.5, 126.1, 126.7, 127.3, 126.9, 127.5, 128.2, 128.8, 128.4, 129.0, 129.6, 130.2,
  129.8, 130.4, 131.1, 131.7, 131.3, 131.9, 132.5, 133.1, 132.7, 133.3, 134.0, 134.6, 134.2, 134.8,
  135.4, 136.0,
];
const DEFAULT_SERIES_TEXT = SAMPLE_SERIES.map((n) => n.toFixed(2)).join(', ');

const DEFAULTS: Inputs = {
  series: SAMPLE_SERIES,
  series_text: DEFAULT_SERIES_TEXT,
  min_window: 10,
  max_window: 50,
};

function parseInputs(sp: Record<string, string | string[] | undefined>): Inputs {
  const num = (v: string | string[] | undefined, fallback: number) => {
    if (v === undefined) return fallback;
    const s = Array.isArray(v) ? v[0] : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };
  const text = (() => {
    const v = sp.series;
    if (v === undefined) return DEFAULT_SERIES_TEXT;
    return Array.isArray(v) ? v[0] : v;
  })();
  const arr = parseNumberSeries(text);
  return {
    series: arr.length >= 20 ? arr : SAMPLE_SERIES,
    series_text: text,
    min_window: Math.round(num(sp.min_window, DEFAULTS.min_window)),
    max_window: Math.round(num(sp.max_window, DEFAULTS.max_window)),
  };
}

async function calc(inputs: Inputs): Promise<HurstResult | null> {
  try {
    return await callQuantOracle<HurstResult>('/v1/stats/hurst-exponent', {
      series: inputs.series,
      min_window: inputs.min_window,
      max_window: inputs.max_window,
    });
  } catch {
    return null;
  }
}

export default async function HurstPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  // Skip API call on bare-URL landing — R/S analysis on the default 100-point
  // sample plus network round-trip pushed cold-fetch to ~8s before this fix.
  // Now page renders instantly; user clicks Calculate to compute.
  const hasUserParams = Object.keys(sp).length > 0;
  const inputs = parseInputs(sp);
  const result = hasUserParams ? await calc(inputs) : null;

  const jsonLd = [
    calculatorJsonLd({
      name: 'Hurst Exponent Calculator',
      description:
        'Free Hurst exponent calculator using R/S analysis. Classifies a time series as trending, mean-reverting, or random walk.',
      url: 'https://quantoracle.dev/hurst-exponent-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ];

  const resultsNode = !hasUserParams
    ? <EmptyState />
    : result
      ? <ResultsCard result={result} />
      : <ErrorCard />;

  return (
    <CalculatorShell
      slug="hurst-exponent-calculator"
      title="Hurst Exponent Calculator"
      subtitle="Classify any price or return series as trending, mean-reverting, or random walk using R/S analysis. Helps you pick momentum vs mean-reversion strategies for the right asset."
      inputs={<InputsCard inputs={inputs} />}
      results={resultsNode}
      interpretation={hasUserParams && result ? <Interpretation result={result} /> : undefined}
      faq={<Faq items={faqs} />}
      jsonLd={jsonLd}
      longform={<Longform />}
    />
  );
}

/** Shown on the bare-URL initial visit. Defers the R/S computation until the
 *  user clicks Calculate, eliminating the cold-fetch click-to-reveal delay. */
function EmptyState() {
  return (
    <div className="card border-accent/20">
      <h2 className="text-lg font-semibold mb-2">Ready to classify your time series</h2>
      <p className="text-sm text-slate-300 leading-relaxed mb-3">
        Paste your price or return series in the form (or use the 100-point sample already
        loaded) and click <strong className="text-accent">Calculate</strong>. R/S analysis runs
        across multiple window sizes and returns the Hurst exponent plus the R² of the log-log
        fit so you know how reliable the estimate is.
      </p>
      <p className="text-xs text-slate-500">
        H ≈ 0.5 → random walk · H &gt; 0.55 → trending · H &lt; 0.45 → mean-reverting
      </p>
    </div>
  );
}

function InputsCard({ inputs }: { inputs: Inputs }) {
  return (
    <form method="GET" className="card">
      <h2 className="text-lg font-semibold mb-4">Inputs</h2>
      <label className="block mb-4">
        <span className="field-label">Time series</span>
        <textarea
          name="series"
          defaultValue={inputs.series_text}
          className="field-input font-mono text-xs"
          rows={8}
          placeholder="100, 100.4, 100.9, 101.2, ..."
          required
        />
        <span className="text-xs text-slate-500 mt-1 block">
          Prices or returns. At least 60 points recommended; 100+ for stable estimates.
        </span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Field
          name="min_window"
          label="Min window"
          value={inputs.min_window}
          step="any"
          min="2"
          hint="Smallest sub-series size for R/S"
        />
        <Field
          name="max_window"
          label="Max window"
          value={inputs.max_window}
          step="any"
          min="3"
          hint="Largest sub-series size (typ. N/2)"
        />
      </div>
      <button type="submit" className="btn-primary w-full mt-5">
        Calculate
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Calls the deterministic <code className="text-slate-300">/v1/stats/hurst-exponent</code>{' '}
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

function ResultsCard({ result }: { result: HurstResult }) {
  const colorClass =
    result.hurst_exponent > 0.55
      ? 'text-chart-gain'
      : result.hurst_exponent < 0.45
        ? 'text-accent'
        : 'text-slate-300';
  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Results</h2>
        <span className="text-xs text-slate-500">{result.series_length} observations</span>
      </div>

      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Hurst exponent</div>
        <div className={`font-mono text-4xl tabular-nums ${colorClass}`}>
          {result.hurst_exponent.toFixed(3)}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Classification:{' '}
          <span className="text-slate-200 font-medium">{result.interpretation}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="R-squared (fit quality)" value={result.r_squared.toFixed(4)} />
        <Stat label="Window count" value={String(result.n_windows)} />
        <Stat label="Series length" value={String(result.series_length)} />
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
        Make sure the series has at least 20 numeric values (60+ recommended for a stable
        estimate), and that <code>min_window</code> &lt; <code>max_window</code> &lt; series length.
      </p>
    </div>
  );
}

function Interpretation({ result }: { result: HurstResult }) {
  const H = result.hurst_exponent;
  const tier =
    H > 0.7
      ? 'strongly trending — momentum and trend-following strategies have structural edge here'
      : H > 0.55
        ? 'mildly trending — momentum strategies are worth testing on this asset'
        : H > 0.45
          ? 'effectively a random walk — neither momentum nor mean-reversion has structural edge; look for other alpha sources'
          : H > 0.3
            ? 'mildly mean-reverting — fade-the-extreme and pairs strategies may have edge'
            : 'strongly mean-reverting — Bollinger band fades and statistical arbitrage are the natural fit';
  const fitNote =
    result.r_squared > 0.95
      ? 'The R² of the log-log regression is high — the estimate is robust.'
      : result.r_squared > 0.85
        ? 'The R² is acceptable but not exceptional; consider longer series for higher confidence.'
        : 'The R² is low, suggesting the series does not follow a clean power law — treat the H value with caution.';
  return (
    <p>
      The Hurst exponent of <strong>{H.toFixed(3)}</strong> indicates the series is{' '}
      <strong>{tier}</strong>. {fitNote}
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>Why the Hurst exponent matters</h2>
      <p>
        Most quant edge comes from picking the right strategy for the right asset and the right
        regime. Momentum strategies bleed money on mean-reverting assets; mean-reversion strategies
        get steamrolled by trends. The Hurst exponent gives you one number that tells you which
        regime an asset is in, so you can stop running the wrong playbook.
      </p>

      <h3>The math in 60 seconds</h3>
      <p>
        Take a time series. Split it into chunks of size <code>n</code>. Inside each chunk,
        compute the cumulative deviation from the mean, take its range (max minus min), and divide
        by the chunk&apos;s standard deviation. Average those across chunks — that is the rescaled
        range R/S(n). Repeat for many values of <code>n</code>. Plot log(R/S(n)) versus log(n) and
        fit a line. The slope is the Hurst exponent.
      </p>
      <p>
        For a true random walk (geometric Brownian motion), this slope is exactly 0.5. For a
        process with persistent long-term trends, the slope is above 0.5. For a process that
        reverts to its mean, the slope is below 0.5. The exponent therefore directly measures the
        long-memory of the series.
      </p>

      <h3>What Hurst values look like in real markets</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>S&amp;P 500 (daily, multi-decade)</strong>: H ≈ 0.55-0.60 — slightly trending,
          which is why long-only buy-and-hold and trend-following both work over long horizons.
        </li>
        <li>
          <strong>Major FX pairs (EUR/USD, USD/JPY)</strong>: H ≈ 0.48-0.52 — close to random walk.
          This is consistent with the difficulty of beating spot FX systematically.
        </li>
        <li>
          <strong>Short-term interest rates</strong>: H often below 0.4 — strongly mean-reverting,
          which is why carry and roll-down strategies work here.
        </li>
        <li>
          <strong>Single-name equities</strong>: H ≈ 0.40-0.55 with high variance — many show short-
          term mean reversion (intraday) but mild trending (multi-month).
        </li>
        <li>
          <strong>Crypto majors (BTC, ETH)</strong>: H ≈ 0.55-0.70 historically — strongly trending,
          which is why CTA-style trend strategies have outperformed in crypto.
        </li>
      </ul>

      <h3>How to use Hurst in a research workflow</h3>
      <ol className="list-decimal list-inside space-y-1 text-sm">
        <li>
          <strong>Choose the right return frequency</strong>. The Hurst exponent of an asset can be
          different on daily, weekly, and monthly data. Pick the frequency at which your strategy
          will trade.
        </li>
        <li>
          <strong>Compute on rolling windows</strong>. A single H over 10 years averages across
          multiple regimes and tells you very little. Compute H on a rolling 1-2 year window and
          chart it through time. Watch for crossings of 0.5.
        </li>
        <li>
          <strong>Use H as a strategy switch</strong>. If your toolkit includes both momentum and
          mean-reversion, route capital based on the current rolling H. Many systematic shops do
          exactly this.
        </li>
        <li>
          <strong>Validate with out-of-sample tests</strong>. The H value can mislead on small
          samples. Always confirm any strategy choice by walk-forward backtesting on data the H was
          not measured on.
        </li>
      </ol>

      <h3>Limitations and caveats</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Small samples are noisy</strong>. Below ~100 observations, H estimates can be off
          by ±0.1 or more. Always check R-squared.
        </li>
        <li>
          <strong>Non-stationarity inflates H</strong>. A series with a strong trend can produce
          H &gt; 1.0. Run Hurst on returns, not raw prices, to avoid this.
        </li>
        <li>
          <strong>Regime changes are common</strong>. An H value computed yesterday may not apply
          tomorrow. Markets shift between trending and mean-reverting regimes constantly.
        </li>
        <li>
          <strong>Hurst is not a profit predictor</strong>. It tells you the asset has structure
          consistent with a strategy style — not that the strategy will be profitable after
          transaction costs.
        </li>
      </ul>

      <h3>Related calculators</h3>
      <p>
        For other regime-detection metrics, see the{' '}
        <a href="/sharpe-ratio-calculator" className="text-accent">
          Sharpe ratio calculator
        </a>{' '}
        and{' '}
        <a href="/probabilistic-sharpe-ratio-calculator" className="text-accent">
          probabilistic Sharpe ratio calculator
        </a>
        . For risk-of-ruin assessment of strategies you choose based on Hurst, see the{' '}
        <a href="/drawdown-calculator" className="text-accent">
          drawdown calculator
        </a>{' '}
        and{' '}
        <a href="/value-at-risk-calculator" className="text-accent">
          value-at-risk calculator
        </a>
        . For sizing positions, see the{' '}
        <a href="/kelly-criterion-calculator" className="text-accent">
          Kelly criterion calculator
        </a>
        .
      </p>
    </div>
  );
}
