import Link from 'next/link';
import { CalculatorShell } from '@/components/CalculatorShell';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/implied-volatility-calculator',
  title: 'Implied Volatility Calculator (Newton-Raphson Solver)',
  description:
    'Free implied volatility calculator. Enter the market price of a call or put option and get the IV that produces that price under Black-Scholes. 6-decimal precision, typically 3-5 iterations.',
  keywords: [
    'implied volatility calculator',
    'iv calculator',
    'black scholes iv',
    'option implied vol',
    'iv solver',
  ],
});

interface IvResult {
  implied_volatility: number;
  annualized_pct: number;
  model_price: number;
  market_price: number;
  iterations: number;
  ms: number;
}

interface Inputs {
  S: number;
  K: number;
  T: number;
  r: number;
  q: number;
  market_price: number;
  type: 'call' | 'put';
}

const DEFAULTS: Inputs = {
  S: 100,
  K: 100,
  T: 0.25,
  r: 0.05,
  q: 0,
  market_price: 4.62,
  type: 'call',
};

function parseInputs(sp: Record<string, string | string[] | undefined>): Inputs {
  const num = (v: string | string[] | undefined, fallback: number) => {
    if (v === undefined) return fallback;
    const s = Array.isArray(v) ? v[0] : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };
  const opt = (v: string | string[] | undefined, fallback: 'call' | 'put') => {
    const s = Array.isArray(v) ? v[0] : v;
    return s === 'put' ? 'put' : s === 'call' ? 'call' : fallback;
  };
  return {
    S: num(sp.S, DEFAULTS.S),
    K: num(sp.K, DEFAULTS.K),
    T: num(sp.T, DEFAULTS.T),
    r: num(sp.r, DEFAULTS.r),
    q: num(sp.q, DEFAULTS.q),
    market_price: num(sp.market_price, DEFAULTS.market_price),
    type: opt(sp.type, DEFAULTS.type),
  };
}

async function solveIv(inputs: Inputs): Promise<IvResult | null> {
  try {
    return await callQuantOracle<IvResult>('/v1/options/implied-vol', {
      ...inputs,
    } as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

export default async function ImpliedVolPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const inputs = parseInputs(sp);
  const result = await solveIv(inputs);

  const jsonLd = [
    calculatorJsonLd({
      name: 'Implied Volatility Calculator',
      description:
        'Free implied volatility solver using Newton-Raphson iteration on the Black-Scholes formula.',
      url: 'https://quantoracle.dev/implied-volatility-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ].join('\n');

  return (
    <CalculatorShell
      slug="implied-volatility-calculator"
      title="Implied Volatility Calculator"
      subtitle="Solve for the IV that makes Black-Scholes match a market option price. Newton-Raphson under the hood, 6-decimal precision, typically converges in 3-5 iterations."
      inputs={<InputsCard inputs={inputs} />}
      results={result ? <ResultsCard result={result} /> : <ErrorCard />}
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
      <div className="grid grid-cols-2 gap-4">
        <Field name="S" label="Stock price ($)" value={inputs.S} step="0.01" min="0.01" />
        <Field name="K" label="Strike ($)" value={inputs.K} step="0.01" min="0.01" />
        <Field
          name="T"
          label="Time to expiry (years)"
          value={inputs.T}
          step="0.01"
          min="0.001"
          hint="0.25 = 3 months"
        />
        <Field
          name="r"
          label="Risk-free rate"
          value={inputs.r}
          step="0.001"
          min="0"
          hint="0.05 = 5%"
        />
        <Field
          name="q"
          label="Dividend yield"
          value={inputs.q}
          step="0.001"
          min="0"
          hint="0 = no dividend"
        />
        <Field
          name="market_price"
          label="Market price ($)"
          value={inputs.market_price}
          step="0.01"
          min="0.001"
          hint="The observed option price you want to back out IV from"
        />
        <Select
          name="type"
          label="Option type"
          value={inputs.type}
          options={[
            { value: 'call', label: 'Call' },
            { value: 'put', label: 'Put' },
          ]}
        />
      </div>
      <button type="submit" className="btn-primary w-full mt-5">
        Solve for IV
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Calls the deterministic <code className="text-slate-300">/v1/options/implied-vol</code>{' '}
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

function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <select name={name} defaultValue={value} className="field-input">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ResultsCard({ result }: { result: IvResult }) {
  const fitError = Math.abs(result.model_price - result.market_price);
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Results</h2>

      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
          Implied volatility (annualized)
        </div>
        <div className="font-mono text-4xl tabular-nums text-accent">
          {result.annualized_pct.toFixed(2)}%
        </div>
        <div className="text-xs text-slate-500 mt-1">
          decimal: {result.implied_volatility.toFixed(6)}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Market price" value={`$${result.market_price.toFixed(4)}`} />
        <Stat label="Model price (at IV)" value={`$${result.model_price.toFixed(4)}`} />
        <Stat label="Fit error" value={`$${fitError.toFixed(6)}`} />
        <Stat label="Iterations" value={String(result.iterations)} />
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
      <h2 className="text-lg font-semibold mb-2 text-chart-loss">Could not solve for IV</h2>
      <p className="text-sm text-slate-300">
        Common causes: (1) market price is below intrinsic value (no IV exists); (2) the option is
        so deep in or out of the money that vega is too small for Newton-Raphson to converge.
        Double-check your inputs.
      </p>
    </div>
  );
}

function Interpretation({ inputs, result }: { inputs: Inputs; result: IvResult }) {
  const ivPct = result.annualized_pct;
  const tier =
    ivPct < 15
      ? 'very low — typical of stable broad-index options or very near-dated near-the-money options'
      : ivPct < 25
        ? 'low to moderate — consistent with index ETFs and large, stable single names'
        : ivPct < 45
          ? 'moderate to high — typical of single-name equities, especially around earnings'
          : ivPct < 80
            ? 'high — speculative growth, biotech, or single-name stress'
            : 'very high — speculative crypto, microcaps, or extreme stress';
  const days = Math.round(inputs.T * 365);
  const moneyness =
    Math.abs(inputs.S - inputs.K) < 0.01 * inputs.S
      ? 'at-the-money'
      : (inputs.type === 'call') === inputs.S > inputs.K
        ? 'in-the-money'
        : 'out-of-the-money';
  return (
    <p>
      The market is pricing this {moneyness} {inputs.type} ({days} days to expiry) at an implied
      volatility of <strong>{ivPct.toFixed(2)}%</strong> annualized — {tier}. The solver converged
      in {result.iterations} iteration{result.iterations === 1 ? '' : 's'} with a fit error of{' '}
      ${Math.abs(result.model_price - result.market_price).toFixed(6)}.
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>Implied volatility, in one paragraph</h2>
      <p>
        Black-Scholes takes five inputs and returns a price. Four of those inputs (stock price,
        strike, time to expiry, risk-free rate) are observable. Volatility is not — you have to
        estimate it. <em>Implied volatility</em> reverses the question: given an option&apos;s
        market price, what volatility input would produce that price? It is the market&apos;s
        consensus volatility expectation for the underlying over the option&apos;s remaining life.
      </p>

      <h3>Why it matters</h3>
      <p>
        IV is the most-watched number in options trading. When IV is high, options are expensive;
        when IV is low, they are cheap (relative to their fair value under historical volatility).
        Strategies that profit from the gap between IV and realized volatility — selling premium
        when IV is rich, buying premium when IV is cheap — are a major category of options
        trading. IV is also the only Black-Scholes input that traders actively quote and trade
        around: market makers think and quote in vol, not in dollar prices.
      </p>

      <h3>How the solver works</h3>
      <p>
        There is no closed-form expression for IV — Black-Scholes&apos; formula cannot be inverted
        analytically. Numerical methods are required. The standard approach is Newton-Raphson
        iteration:
      </p>
      <ol className="list-decimal list-inside space-y-1 text-sm">
        <li>Start with an initial guess (typically σ = 30%).</li>
        <li>Compute the Black-Scholes price at that σ.</li>
        <li>Compare to the market price; the difference is the residual.</li>
        <li>Adjust σ by (residual / vega) — this is the Newton-Raphson step.</li>
        <li>Repeat until the residual is below a tolerance (typically $0.000001).</li>
      </ol>
      <p>
        Vega (the option&apos;s sensitivity to vol) is the gradient of the function we&apos;re
        inverting. For at-the-money options, vega is large and convergence is fast (3-5
        iterations). For deep ITM or OTM options, vega is small and the iteration can converge
        slowly or fail. The QuantOracle implementation falls back to bisection in failure modes.
      </p>

      <h3>The volatility smile and skew</h3>
      <p>
        If Black-Scholes were perfectly correct, the implied volatility for all options on the same
        underlying with the same expiry would be the same number. In practice, IV varies by strike
        — usually higher for far-OTM puts than for ATM options (the &quot;skew&quot;), and
        sometimes higher on both wings (the &quot;smile&quot;). This reflects market participants
        pricing fat tails into option prices. The full picture across all strikes and expiries is
        the <em>volatility surface</em> — the QuantOracle API exposes one at{' '}
        <code>/v1/derivatives/volatility-surface</code>.
      </p>

      <h3>Related calculators</h3>
      <p>
        Use the <Link href="/black-scholes-calculator" className="text-accent">Black-Scholes calculator</Link>{' '}
        to go in the other direction: given a volatility input, compute the option price. Use the{' '}
        <Link href="/american-option-calculator" className="text-accent">American Option calculator</Link>{' '}
        for early-exerciseable options or for options on dividend-paying stocks.
      </p>
    </div>
  );
}
