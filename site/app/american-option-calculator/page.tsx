import Link from 'next/link';
import { CalculatorShell } from '@/components/CalculatorShell';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/american-option-calculator',
  title: 'American Option Pricing Calculator (Binomial Tree, with Dividends)',
  description:
    'Price American-style call and put options with early exercise and dividend yield using a Cox-Ross-Rubinstein binomial tree. Free, fast, and shows the early-exercise premium vs Black-Scholes.',
  keywords: [
    'american option calculator',
    'binomial tree calculator',
    'american option pricing',
    'early exercise calculator',
    'dividend option calculator',
  ],
});

interface BinomialResult {
  price: number;
  bs_price: number;
  early_exercise_premium: number;
  delta: number;
  steps: number;
  exercise: string;
  ms: number;
}

interface Inputs {
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
  q: number;
  steps: number;
  option_type: 'call' | 'put';
  exercise: 'american' | 'european';
}

const DEFAULTS: Inputs = {
  S: 100,
  K: 100,
  T: 0.5,
  r: 0.05,
  sigma: 0.25,
  q: 0.02,
  steps: 100,
  option_type: 'call',
  exercise: 'american',
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
  const ex = (v: string | string[] | undefined, fallback: 'american' | 'european') => {
    const s = Array.isArray(v) ? v[0] : v;
    return s === 'european' ? 'european' : s === 'american' ? 'american' : fallback;
  };
  return {
    S: num(sp.S, DEFAULTS.S),
    K: num(sp.K, DEFAULTS.K),
    T: num(sp.T, DEFAULTS.T),
    r: num(sp.r, DEFAULTS.r),
    sigma: num(sp.sigma, DEFAULTS.sigma),
    q: num(sp.q, DEFAULTS.q),
    steps: Math.min(500, Math.max(10, Math.round(num(sp.steps, DEFAULTS.steps)))),
    option_type: opt(sp.option_type, DEFAULTS.option_type),
    exercise: ex(sp.exercise, DEFAULTS.exercise),
  };
}

async function priceTree(inputs: Inputs): Promise<BinomialResult | null> {
  try {
    return await callQuantOracle<BinomialResult>(
      '/v1/derivatives/binomial-tree',
      inputs as unknown as Record<string, unknown>,
    );
  } catch {
    return null;
  }
}

export default async function AmericanOptionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const inputs = parseInputs(sp);
  const result = await priceTree(inputs);

  const jsonLd = [
    calculatorJsonLd({
      name: 'American Option Pricing Calculator (Binomial Tree)',
      description:
        'Free Cox-Ross-Rubinstein binomial tree calculator for American-style call and put options with early exercise and dividend yield support.',
      url: 'https://quantoracle.dev/american-option-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ];

  return (
    <CalculatorShell
      slug="american-option-calculator"
      title="American Option Pricing Calculator"
      subtitle="Price American calls and puts via a Cox-Ross-Rubinstein binomial tree. Handles early exercise and dividend-paying underlyings — the two cases the Black-Scholes formula cannot."
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
      <div className="grid grid-cols-2 gap-4">
        <Field name="S" label="Stock price ($)" value={inputs.S} step="any" min="0.01" />
        <Field name="K" label="Strike ($)" value={inputs.K} step="any" min="0.01" />
        <Field
          name="T"
          label="Time to expiry (years)"
          value={inputs.T}
          step="any"
          min="0.001"
          hint="0.5 = 6 months"
        />
        <Field
          name="r"
          label="Risk-free rate"
          value={inputs.r}
          step="any"
          min="0"
          hint="0.05 = 5%"
        />
        <Field
          name="sigma"
          label="Volatility (annualized)"
          value={inputs.sigma}
          step="any"
          min="0.001"
          hint="0.25 = 25%"
        />
        <Field
          name="q"
          label="Dividend yield"
          value={inputs.q}
          step="any"
          min="0"
          hint="0.02 = 2% — set to 0 for non-dividend stocks"
        />
        <Select
          name="option_type"
          label="Option type"
          value={inputs.option_type}
          options={[
            { value: 'call', label: 'Call' },
            { value: 'put', label: 'Put' },
          ]}
        />
        <Select
          name="exercise"
          label="Exercise style"
          value={inputs.exercise}
          options={[
            { value: 'american', label: 'American' },
            { value: 'european', label: 'European' },
          ]}
        />
        <Field
          name="steps"
          label="Tree steps"
          value={inputs.steps}
          step="any"
          min="10"
          hint="50-200 typical"
        />
      </div>
      <button type="submit" className="btn-primary w-full mt-5">
        Calculate
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Calls the deterministic <code className="text-slate-300">/v1/derivatives/binomial-tree</code>{' '}
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

function ResultsCard({ inputs, result }: { inputs: Inputs; result: BinomialResult }) {
  const eepPct = result.bs_price > 0 ? (result.early_exercise_premium / result.bs_price) * 100 : 0;
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Results</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            {inputs.exercise === 'american' ? 'American' : 'European'} {inputs.option_type}
          </div>
          <div className="stat-num">${result.price.toFixed(4)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Black-Scholes</div>
          <div className="font-mono text-xl tabular-nums text-slate-100">
            ${result.bs_price.toFixed(4)}
          </div>
          <div className="text-xs text-slate-500 mt-1">European reference</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            Early-exercise premium
          </div>
          <div className="font-mono text-xl tabular-nums text-accent">
            ${result.early_exercise_premium.toFixed(4)}
          </div>
          <div className="text-xs text-slate-500 mt-1">{eepPct.toFixed(2)}% of BS price</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
        <Stat label="Delta" value={result.delta.toFixed(4)} />
        <Stat label="Tree steps" value={String(result.steps)} />
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
        The QuantOracle API returned an error or the request timed out. Check your inputs (all
        positive, volatility and time greater than zero) and try again.
      </p>
    </div>
  );
}

function Interpretation({ inputs, result }: { inputs: Inputs; result: BinomialResult }) {
  const isCall = inputs.option_type === 'call';
  const eep = result.early_exercise_premium;
  const eepCents = (eep * 100).toFixed(1);
  const days = Math.round(inputs.T * 365);
  const qPct = (inputs.q * 100).toFixed(1);

  if (eep < 0.005) {
    return (
      <p>
        For this {isCall ? 'call' : 'put'} ({days} days, {qPct}% dividend yield), the early-exercise
        premium is essentially zero — the American and European prices match. This is the textbook
        result for {isCall ? 'calls on non-dividend-paying stocks' : 'far-out-of-the-money puts'}:
        the right to exercise early has no economic value, so the American option is worth the same
        as the European one.{' '}
        {isCall && inputs.q < 0.01 ? (
          <>
            For this case you can use the simpler{' '}
            <Link href={`/black-scholes-calculator?S=${inputs.S}&K=${inputs.K}&T=${inputs.T}&r=${inputs.r}&sigma=${inputs.sigma}`} className="text-accent underline">
              Black-Scholes calculator
            </Link>
            .
          </>
        ) : null}
      </p>
    );
  }

  return (
    <p>
      The American {isCall ? 'call' : 'put'} is worth{' '}
      <strong>${result.price.toFixed(2)}</strong>, which is <strong>${eepCents}¢</strong> more than
      the equivalent European option (${result.bs_price.toFixed(2)}). That extra value is the{' '}
      <strong>early-exercise premium</strong> — the price of the right to exercise before
      expiration.{' '}
      {isCall ? (
        <>
          For calls, this premium appears when the underlying pays a dividend (here, {qPct}%): it
          can be optimal to exercise just before the ex-dividend date to capture the dividend.
        </>
      ) : (
        <>
          For puts, this premium appears when the option is sufficiently in-the-money: exercising
          early lets you lock in the payoff and earn interest on the proceeds, which is worth more
          than holding the option.
        </>
      )}
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>When to use a binomial tree instead of Black-Scholes</h2>
      <p>
        The Black-Scholes-Merton formula is exact, fast, and has a closed form — but only for
        European options on non-dividend-paying stocks. Real markets violate both assumptions
        constantly: most US-listed equity options are American-style (exerciseable any time before
        expiration), and most stocks pay dividends. The Cox-Ross-Rubinstein binomial tree handles
        both cases by working backward through a discrete tree of possible price paths and, at each
        node, taking the maximum of (exercise now) and (continue holding).
      </p>

      <h3>How the model works</h3>
      <p>
        The binomial tree partitions the time to expiration into <em>n</em> equal steps. At each
        step the stock can move up by a factor <em>u</em> or down by a factor <em>d</em>; with
        log-normal returns and matching the underlying volatility, <em>u</em> = exp(σ·√Δt) and{' '}
        <em>d</em> = 1/<em>u</em>. The risk-neutral probability of an up move is{' '}
        <em>p</em> = (exp((r-q)·Δt) − <em>d</em>) / (<em>u</em> − <em>d</em>).
      </p>
      <p>
        At each terminal node, the option payoff is its intrinsic value. Working backward, the
        value at each interior node is the maximum of (a) exercise immediately and take the
        intrinsic value, or (b) hold and take the discounted risk-neutral expected value of the two
        child nodes. The price at the root of the tree is today&apos;s option value.
      </p>

      <h3>The early-exercise premium, in dollars</h3>
      <p>
        This calculator shows the binomial price <em>and</em> the equivalent Black-Scholes price{' '}
        side-by-side. The difference is the <strong>early-exercise premium</strong> — the dollar
        amount you would pay extra for the American feature. Three observations:
      </p>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>American call on a non-dividend stock:</strong> premium is exactly zero (proven
          theorem — never optimal to exercise early). Use{' '}
          <Link href="/black-scholes-calculator" className="text-accent underline">
            Black-Scholes
          </Link>{' '}
          instead, it&apos;s faster and exact.
        </li>
        <li>
          <strong>American call on a dividend-paying stock:</strong> premium can be material
          (especially right before ex-dividend), worth using the binomial tree.
        </li>
        <li>
          <strong>American put:</strong> premium can be material, especially when in-the-money.
          Always check if it matters for your use case.
        </li>
      </ul>

      <h3>Convergence and step count</h3>
      <p>
        The binomial tree converges to the continuous-time price as the number of steps → ∞.
        Convergence is roughly O(1/n) but oscillates, so doubling steps doesn&apos;t halve the
        error. For most practical purposes, 100-200 steps gives accuracy within a cent. Near-the-
        money short-dated options converge slowest; very deep ITM/OTM options converge fastest.
      </p>

      <h3>What this calculator does NOT do</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Discrete dividends</strong> — modeled here as a continuous yield. For known
          discrete dividends on specific dates, you need a tree that models cash dividends explicitly.
        </li>
        <li>
          <strong>Stochastic volatility</strong> — the tree assumes constant σ. Real markets have
          volatility smiles and skews; for that, use{' '}
          <a href="/api-docs" className="text-accent underline">
            the API&apos;s volatility-surface endpoint
          </a>
          .
        </li>
        <li>
          <strong>Path-dependent payoffs</strong> — for barrier, Asian, or lookback options, use
          the dedicated exotic endpoints in the API.
        </li>
      </ul>
    </div>
  );
}
