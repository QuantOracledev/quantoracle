import { CalculatorShell } from '@/components/CalculatorShell';
import { PayoffChart, type PayoffPoint } from '@/components/PayoffChart';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/black-scholes-calculator',
  title: 'Black-Scholes Calculator — Free Option Pricing with Greeks, Dividends, Delta',
  description:
    'Free Black-Scholes formula calculator for European calls and puts. Returns the option price, full Greeks (delta, gamma, vega, theta, rho), break-even, and probability ITM in under 70 ms. Supports continuous dividend yield. Same engine that prices for AI agents — deterministic, citation-tested.',
  keywords: [
    'black scholes calculator',
    'black and scholes calculator',
    'black scholes formula calculator',
    'black scholes model calculator',
    'black scholes calculator with dividends',
    'black scholes delta calculator',
    'option pricing calculator',
    'option greeks calculator',
    'european option calculator',
    'implied volatility',
  ],
});

interface OptionPrice {
  price: number;
  intrinsic: number;
  time_value: number;
  breakeven: number;
  prob_itm: number;
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    vanna?: number;
    charm?: number;
    volga?: number;
    speed?: number;
  };
  d1: number;
  d2: number;
  ms: number;
}

interface Inputs {
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
  /** Continuous dividend yield (q). 0 for a non-dividend-paying stock. */
  q: number;
}

const DEFAULTS: Inputs = { S: 100, K: 100, T: 0.25, r: 0.05, sigma: 0.2, q: 0 };

function parseInputs(sp: Record<string, string | string[] | undefined>): Inputs {
  const num = (v: string | string[] | undefined, fallback: number) => {
    if (v === undefined) return fallback;
    const s = Array.isArray(v) ? v[0] : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    S: num(sp.S, DEFAULTS.S),
    K: num(sp.K, DEFAULTS.K),
    T: num(sp.T, DEFAULTS.T),
    r: num(sp.r, DEFAULTS.r),
    sigma: num(sp.sigma, DEFAULTS.sigma),
    q: num(sp.q, DEFAULTS.q),
  };
}

async function priceBoth(inputs: Inputs): Promise<{ call: OptionPrice; put: OptionPrice } | null> {
  try {
    const [call, put] = await Promise.all([
      callQuantOracle<OptionPrice>('/v1/options/price', { ...inputs, option_type: 'call' }),
      callQuantOracle<OptionPrice>('/v1/options/price', { ...inputs, option_type: 'put' }),
    ]);
    return { call, put };
  } catch {
    return null;
  }
}

function buildPayoff(K: number, callPrem: number, putPrem: number): PayoffPoint[] {
  const points: PayoffPoint[] = [];
  const lo = K * 0.6;
  const hi = K * 1.4;
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const spot = lo + ((hi - lo) * i) / steps;
    points.push({
      spot: Math.round(spot * 100) / 100,
      callPnl: Math.max(spot - K, 0) - callPrem,
      putPnl: Math.max(K - spot, 0) - putPrem,
    });
  }
  return points;
}

export default async function BlackScholesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const inputs = parseInputs(sp);
  const result = await priceBoth(inputs);

  const jsonLd = [
    calculatorJsonLd({
      name: 'Black-Scholes Option Pricing Calculator',
      description:
        'Free Black-Scholes calculator for European calls and puts with full Greeks (delta, gamma, vega, theta, rho).',
      url: 'https://quantoracle.dev/black-scholes-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ];

  return (
    <CalculatorShell
      slug="black-scholes-calculator"
      title="Black-Scholes Option Pricing Calculator"
      subtitle="Price European calls and puts with full Greeks. Powered by the same engine pricing thousands of options daily for AI agents — under 70 ms per calculation."
      inputs={<InputsCard inputs={inputs} />}
      results={
        result ? (
          <ResultsCard inputs={inputs} call={result.call} put={result.put} />
        ) : (
          <ErrorCard />
        )
      }
      interpretation={result && <Interpretation inputs={inputs} call={result.call} put={result.put} />}
      faq={<Faq items={faqs} />}
      jsonLd={jsonLd}
      longform={<Longform />}
    />
  );
}

function InputsCard({ inputs }: { inputs: Inputs }) {
  // Plain HTML form with method=GET — no client JS needed. Submitting reloads the
  // page with new query params; Next.js streams the new SSR'd result.
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
          hint="0.25 = 3 months"
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
          hint="0.2 = 20%"
        />
        <Field
          name="q"
          label="Dividend yield"
          value={inputs.q}
          step="any"
          min="0"
          hint="0.03 = 3% · use 0 for none"
        />
      </div>
      <button type="submit" className="btn-primary w-full mt-5">
        Calculate
      </button>
      <p className="mt-3 text-xs text-slate-500">
        First 1,000 calculations/day are free, no signup. Calls the deterministic{' '}
        <code className="text-slate-300">/v1/options/price</code> endpoint server-side.
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

function ResultsCard({ inputs, call, put }: { inputs: Inputs; call: OptionPrice; put: OptionPrice }) {
  const data = buildPayoff(inputs.K, call.price, put.price);
  const days = Math.round(inputs.T * 365);
  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Results</h2>
        <span className="text-xs text-slate-500">
          ${inputs.S} spot · ${inputs.K} strike · {days}d · {(inputs.sigma * 100).toFixed(1)}% IV ·{' '}
          {(inputs.r * 100).toFixed(1)}% r
          {inputs.q > 0 && <> · {(inputs.q * 100).toFixed(1)}% div</>}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Call price</div>
          <div className="stat-num">${call.price.toFixed(4)}</div>
          <div className="text-xs text-slate-500 mt-1">break-even ${call.breakeven.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Put price</div>
          <div className="stat-num">${put.price.toFixed(4)}</div>
          <div className="text-xs text-slate-500 mt-1">break-even ${put.breakeven.toFixed(2)}</div>
        </div>
      </div>

      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">Greeks</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Greek label="Delta (call)" value={call.greeks.delta} fmt="0.0000" />
        <Greek label="Delta (put)" value={put.greeks.delta} fmt="0.0000" />
        <Greek label="Gamma" value={call.greeks.gamma} fmt="0.0000" />
        <Greek label="Vega" value={call.greeks.vega} fmt="0.0000" />
        <Greek label="Theta (call)" value={call.greeks.theta} fmt="0.0000" />
        <Greek label="Theta (put)" value={put.greeks.theta} fmt="0.0000" />
        <Greek label="Rho (call)" value={call.greeks.rho} fmt="0.0000" />
        <Greek label="Rho (put)" value={put.greeks.rho} fmt="0.0000" />
        <Greek label="Prob ITM (call)" value={call.prob_itm} fmt="0.0000" />
      </div>

      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
        Payoff at expiration
      </h3>
      <PayoffChart data={data} strike={inputs.K} />
      <div className="mt-2 text-xs text-slate-500">
        Computed in {Math.max(call.ms, put.ms)} ms.
      </div>
    </div>
  );
}

function Greek({ label, value, fmt }: { label: string; value: number; fmt: string }) {
  // Currently only one format used; left here so the API can expand later.
  void fmt;
  const display = Number.isFinite(value) ? value.toFixed(4) : '—';
  return (
    <div className="bg-ink-800/40 rounded-md p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">{label}</div>
      <div className="font-mono text-sm tabular-nums text-slate-100">{display}</div>
    </div>
  );
}

function ErrorCard() {
  return (
    <div className="card border-chart-loss/30">
      <h2 className="text-lg font-semibold mb-2 text-chart-loss">Calculation failed</h2>
      <p className="text-sm text-slate-300">
        The QuantOracle API returned an error or the request timed out. Check that your inputs are
        positive numbers (volatility and time must be greater than zero) and try again. If this
        persists,{' '}
        <a
          href="https://github.com/QuantOracledev/quantoracle/issues"
          rel="noopener"
          className="text-accent underline"
        >
          open an issue on GitHub
        </a>
        .
      </p>
    </div>
  );
}

function Interpretation({ inputs, call, put }: { inputs: Inputs; call: OptionPrice; put: OptionPrice }) {
  const moneyness = inputs.S - inputs.K;
  const moneynessLabel =
    Math.abs(moneyness) < 0.01 * inputs.S
      ? 'at-the-money'
      : moneyness > 0
        ? 'in-the-money for the call'
        : 'in-the-money for the put';
  const days = Math.round(inputs.T * 365);
  const ivPct = (inputs.sigma * 100).toFixed(1);
  const callDeltaPct = (call.greeks.delta * 100).toFixed(0);
  return (
    <p>
      With the stock at <strong>${inputs.S}</strong> and the strike at <strong>${inputs.K}</strong>{' '}
      ({moneynessLabel}), {days} days to expiry, and {ivPct}% annualized volatility, the call is
      worth <strong>${call.price.toFixed(2)}</strong> and the put is worth{' '}
      <strong>${put.price.toFixed(2)}</strong>. The call&apos;s delta of {callDeltaPct} means it
      moves roughly <strong>${(call.greeks.delta).toFixed(2)}</strong> for every $1 the stock moves;
      the put moves the opposite direction by a similar amount. Theta is per day — both options lose
      a small amount of value daily as expiration approaches.
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>Understanding the Black-Scholes formula</h2>
      <p>
        The Black-Scholes-Merton model, published in 1973, gives a closed-form price for European
        options under five assumptions: log-normal stock prices, constant volatility, constant
        risk-free rate, no dividends, and continuous trading with no transaction costs. Most of
        these assumptions are wrong in practice, which is why the model is a starting point — not a
        final answer — for serious options trading.
      </p>

      <h3>Inputs explained</h3>
      <p>
        <strong>Stock price (S)</strong> is the current spot price of the underlying.{' '}
        <strong>Strike (K)</strong> is the price at which the option holder can buy (call) or sell
        (put) the underlying. <strong>Time to expiry (T)</strong> is in years — three months ≈ 0.25,
        thirty days ≈ 0.082. <strong>Risk-free rate (r)</strong> is typically the yield on a
        short-dated Treasury matching the option&apos;s tenor. <strong>Volatility (σ)</strong> is
        the annualized standard deviation of the log returns of the underlying — almost always
        estimated from historical prices or implied from market option prices.{' '}
        <strong>Dividend yield (q)</strong> is the continuous annualized dividend yield of the
        underlying; set it to 0 for a non-dividend-paying stock. This calculator uses the
        Black-Scholes-Merton extension, which discounts the spot by the dividend yield — a positive
        q lowers call values and raises put values, exactly as a known dividend stream should.
      </p>

      <h3>The Greeks, in plain English</h3>
      <p>
        <strong>Delta</strong> is how much the option price changes when the stock moves $1.{' '}
        <strong>Gamma</strong> is how much delta changes when the stock moves $1 — high gamma means
        delta is unstable. <strong>Vega</strong> is how much the option price changes when implied
        volatility moves 1 percentage point. <strong>Theta</strong> is daily time decay — the dollar
        amount the option loses each day, all else equal. <strong>Rho</strong> is sensitivity to
        interest rate changes, usually small for short-dated options.
      </p>

      <h3>When Black-Scholes breaks down</h3>
      <p>
        The model assumes constant volatility, but real markets have volatility smiles and skews.
        It assumes lognormal returns, but real returns have fat tails. Continuous dividends are
        handled here via the dividend-yield input, but the formula still cannot price
        American-style early exercise — for that, use the{' '}
        <a href="/american-option-calculator" className="text-accent">
          American Option Calculator
        </a>
        , which prices a binomial tree and reports the early-exercise premium directly. For
        path-dependent exotics (Asian, barrier, lookback), use the dedicated exotic endpoints in{' '}
        <a href="/api-docs" className="text-accent">
          the API
        </a>
        .
      </p>

      <h3>How this calculator works</h3>
      <p>
        When you submit the form, this page makes a server-side POST to{' '}
        <code>https://api.quantoracle.dev/v1/options/price</code>, the same endpoint that AI agents
        and trading bots call directly. The API runs a deterministic Black-Scholes implementation
        and returns the price, the full set of Greeks (including second-order Greeks like vanna and
        volga), and the implied probability of finishing in the money. Computation typically
        completes in 15-30 ms; total round-trip including network is usually under 200 ms.
      </p>
    </div>
  );
}
