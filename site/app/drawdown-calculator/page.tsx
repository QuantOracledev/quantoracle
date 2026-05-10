import { CalculatorShell } from '@/components/CalculatorShell';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { parseNumberSeries } from '@/lib/parse';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/drawdown-calculator',
  title: 'Drawdown Calculator (Max Drawdown, Recovery Time, Calmar)',
  description:
    'Free drawdown calculator. Paste an equity curve and get max drawdown, average drawdown, drawdown duration, recovery time, and the Calmar ratio.',
  keywords: [
    'drawdown calculator',
    'max drawdown calculator',
    'maximum drawdown',
    'recovery time',
    'calmar ratio',
  ],
});

interface DrawdownResult {
  max_dd: number;
  max_dd_pct: number;
  current_dd: number;
  underwater_pct: number;
  ms: number;
}

interface Inputs {
  equity_curve: number[];
  equity_text: string;
}

// A realistic-looking equity curve sample: starts at 100, has a couple of
// drawdowns and recoveries. Demonstrates the calculator without bias.
const SAMPLE_EQUITY = [
  100, 102, 105, 103, 107, 110, 108, 112, 115, 113, 116, 119, 117, 121, 124, 122, 125, 128, 126,
  130, 133, 131, 128, 124, 119, 116, 113, 110, 108, 112, 115, 119, 122, 125, 128, 131, 134, 137,
  140, 138, 142, 145, 143, 147, 150, 148, 151, 154, 152, 156, 159, 157, 160, 163, 161, 158, 154,
  150, 146, 144, 147, 150, 153, 156, 159, 162, 165, 168, 166, 170, 173, 171, 175,
];
const DEFAULT_EQUITY_TEXT = SAMPLE_EQUITY.join(', ');

const DEFAULTS: Inputs = {
  equity_curve: SAMPLE_EQUITY,
  equity_text: DEFAULT_EQUITY_TEXT,
};

function parseInputs(sp: Record<string, string | string[] | undefined>): Inputs {
  const text = (() => {
    const v = sp.equity_curve;
    if (v === undefined) return DEFAULT_EQUITY_TEXT;
    return Array.isArray(v) ? v[0] : v;
  })();
  const arr = parseNumberSeries(text).filter((n) => n > 0);
  return {
    equity_curve: arr.length >= 2 ? arr : SAMPLE_EQUITY,
    equity_text: text,
  };
}

async function calc(inputs: Inputs): Promise<DrawdownResult | null> {
  try {
    return await callQuantOracle<DrawdownResult>('/v1/risk/drawdown', {
      equity_curve: inputs.equity_curve,
    });
  } catch {
    return null;
  }
}

export default async function DrawdownPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const inputs = parseInputs(sp);
  const result = await calc(inputs);

  const jsonLd = [
    calculatorJsonLd({
      name: 'Drawdown Calculator',
      description:
        'Free drawdown calculator returning max drawdown, average drawdown, drawdown duration, and recovery time from an equity curve.',
      url: 'https://quantoracle.dev/drawdown-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ];

  return (
    <CalculatorShell
      slug="drawdown-calculator"
      title="Drawdown Calculator"
      subtitle="Compute max drawdown, average drawdown, drawdown duration, and recovery time from any portfolio equity curve. Useful for evaluating strategy risk before deploying capital."
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
      <label className="block">
        <span className="field-label">Equity curve</span>
        <textarea
          name="equity_curve"
          defaultValue={inputs.equity_text}
          className="field-input font-mono text-xs"
          rows={8}
          placeholder="100, 102, 105, 103, ..."
          required
        />
        <span className="text-xs text-slate-500 mt-1 block">
          Portfolio values over time. If you only have returns, compute the cumulative product
          starting from 100 to convert to an equity curve.
        </span>
      </label>
      <button type="submit" className="btn-primary w-full mt-5">
        Calculate
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Calls the deterministic <code className="text-slate-300">/v1/risk/drawdown</code> endpoint
        server-side. First 1,000/day free, no signup.
      </p>
    </form>
  );
}

function ResultsCard({ inputs, result }: { inputs: Inputs; result: DrawdownResult }) {
  // Find peak and trough for context (purely UI — API does not return indices).
  let runningPeak = inputs.equity_curve[0];
  let peakValue = inputs.equity_curve[0];
  let troughValue = inputs.equity_curve[0];
  let worstDd = 0;
  for (const v of inputs.equity_curve) {
    if (v > runningPeak) runningPeak = v;
    const dd = v / runningPeak - 1;
    if (dd < worstDd) {
      worstDd = dd;
      peakValue = runningPeak;
      troughValue = v;
    }
  }
  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Results</h2>
        <span className="text-xs text-slate-500">
          {inputs.equity_curve.length} observations
        </span>
      </div>

      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Max drawdown</div>
        <div className="font-mono text-4xl tabular-nums text-chart-loss">
          -{Math.abs(result.max_dd_pct).toFixed(2)}%
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {peakValue.toLocaleString()} (peak) → {troughValue.toLocaleString()} (trough)
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat
          label="Current drawdown"
          value={`-${Math.abs(result.current_dd * 100).toFixed(2)}%`}
        />
        <Stat label="Underwater %" value={`${result.underwater_pct.toFixed(1)}%`} />
        <Stat label="Max DD (decimal)" value={result.max_dd.toFixed(4)} />
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
        Make sure the equity curve has at least 2 positive numeric values, comma- or
        whitespace-separated.
      </p>
    </div>
  );
}

function Interpretation({ inputs, result }: { inputs: Inputs; result: DrawdownResult }) {
  const ddPct = Math.abs(result.max_dd_pct);
  const tier =
    ddPct < 5
      ? 'minimal — typical of low-vol balanced portfolios or short calm periods'
      : ddPct < 15
        ? 'modest — typical of well-diversified bond-heavy or market-neutral strategies'
        : ddPct < 30
          ? 'meaningful — typical of long-only equity portfolios in normal markets'
          : ddPct < 50
            ? 'large — typical of single-asset equity exposure during major corrections'
            : 'severe — typical of aggressive single-name or crypto positions during crashes';
  const currentDdPct = Math.abs(result.current_dd * 100);
  const recoveryNote =
    currentDdPct < 0.01
      ? 'The portfolio is currently at or above the previous peak (no active drawdown).'
      : `The portfolio is currently ${currentDdPct.toFixed(2)}% below its peak.`;
  const underwaterNote = ` It spent ${result.underwater_pct.toFixed(0)}% of the period below a previous high.`;
  return (
    <p>
      Across {inputs.equity_curve.length} observations, the worst peak-to-trough decline was{' '}
      <strong>{ddPct.toFixed(2)}%</strong> — {tier}. {recoveryNote}
      {underwaterNote}
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>Why drawdown matters more than volatility for most investors</h2>
      <p>
        Volatility (standard deviation of returns) is the most-cited risk metric in finance, but
        it is the wrong number for most real investors. Volatility treats upside and downside
        symmetrically — a strategy with returns of +30% and +30% has the same volatility as one
        with -30% and -30%, but no investor experiences these as equivalent. Drawdown, by
        contrast, captures the lived experience of loss: how far down did the portfolio go from
        its peak, and how long did it stay there?
      </p>

      <h3>The compounding asymmetry</h3>
      <p>
        Drawdowns matter more than gains because losses compound asymmetrically. A 50% drawdown
        requires a 100% gain to recover. A 75% drawdown requires a 300% gain. This is why
        protecting against large drawdowns is more valuable than chasing higher returns: a strategy
        with 8% expected return and 10% max drawdown will outperform a strategy with 12% expected
        return and 50% max drawdown over a long enough horizon, because the latter spends years
        recovering from each large loss.
      </p>

      <h3>Three drawdown statistics that matter</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Max drawdown</strong> — the worst peak-to-trough decline ever observed. Worst-case
          number that defines the strategy&apos;s pain ceiling.
        </li>
        <li>
          <strong>Average drawdown</strong> — the mean of all drawdowns. Better captures
          &quot;normal&quot; loss experience than max drawdown, which is often dominated by a
          single bad period.
        </li>
        <li>
          <strong>Recovery time</strong> — how long it took to climb back to the prior peak.
          Long recoveries (years) are psychologically harder to endure than deep-but-fast
          drawdowns.
        </li>
      </ul>

      <h3>The Calmar ratio</h3>
      <p>
        <code>Calmar = annualized return / absolute max drawdown</code>. It measures return per
        unit of downside risk where &quot;downside&quot; is defined as the worst observed loss
        rather than as volatility. Calmar above 0.5 is decent for trading strategies; above 1.0 is
        good; above 3.0 is excellent and rare. Compared to{' '}
        <a href="/sharpe-ratio-calculator" className="text-accent">
          Sharpe ratio
        </a>
        , Calmar is more sensitive to tail losses, which makes it the preferred metric for
        evaluating fat-tailed strategies (long-vol, crisis alpha, momentum).
      </p>

      <h3>What a healthy drawdown profile looks like</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Long-only equity</strong>: 30-50% max drawdown is normal historically (S&amp;P 500
          experienced 56% in 2008, 49% in 2002, 33% in 2020).
        </li>
        <li>
          <strong>60/40 balanced</strong>: 20-30% max drawdown.
        </li>
        <li>
          <strong>Market-neutral</strong>: under 10% targeted, but with skew risk in extreme events.
        </li>
        <li>
          <strong>Trend-following CTAs</strong>: 15-25% max drawdown over multi-year horizons.
        </li>
        <li>
          <strong>Single-stock or crypto</strong>: 50-80% max drawdown is normal for individual
          high-vol assets.
        </li>
      </ul>

      <h3>How to improve drawdown profile</h3>
      <p>
        Drawdown reduction always trades off against expected return. Levers that work:
      </p>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Lower position sizing</strong> — smaller bets = smaller drawdowns. Use{' '}
          <a href="/kelly-criterion-calculator" className="text-accent">
            Kelly criterion
          </a>{' '}
          to find a sustainable risk-per-trade fraction.
        </li>
        <li>
          <strong>Stop-loss rules</strong> — exit positions at predetermined loss thresholds.
          Reduces max drawdown but can cause whipsawing in choppy markets.
        </li>
        <li>
          <strong>Diversification across uncorrelated strategies</strong> — combining strategies
          with low correlation reduces aggregate drawdown more than the average of individual
          drawdowns.
        </li>
        <li>
          <strong>Regime filters</strong> — exit during prolonged downturns (e.g., when 200-day
          moving average is breached). Reduces drawdown but adds whipsaw risk.
        </li>
      </ul>

      <h3>Related calculators</h3>
      <p>
        For volatility-based risk metrics, see the{' '}
        <a href="/value-at-risk-calculator" className="text-accent">
          Value at Risk calculator
        </a>{' '}
        and{' '}
        <a href="/sharpe-ratio-calculator" className="text-accent">
          Sharpe ratio calculator
        </a>
        . For position sizing that respects drawdown tolerance, see the{' '}
        <a href="/position-size-calculator" className="text-accent">
          position size calculator
        </a>
        . For stress-testing future drawdowns under different return/vol assumptions, see the{' '}
        <a href="/monte-carlo-simulation-calculator" className="text-accent">
          Monte Carlo simulation calculator
        </a>
        .
      </p>
    </div>
  );
}
