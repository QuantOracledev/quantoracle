import { CalculatorShell } from '@/components/CalculatorShell';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';
import { OptionsProfitChart } from './chart';

export const metadata = buildMetadata({
  path: '/options-profit-calculator',
  title: 'Options Profit Calculator (Multi-Leg Payoff Diagram)',
  description:
    'Free options profit calculator with payoff diagram. Build single- or multi-leg strategies (spreads, straddles, condors) and see profit, loss, and break-even points at expiration.',
  keywords: [
    'options profit calculator',
    'options payoff diagram',
    'options strategy calculator',
    'option spread calculator',
    'iron condor calculator',
    'straddle calculator',
  ],
});

interface PayoffResult {
  prices: number[];
  pnl: number[];
  breakeven_points: number[];
  max_profit: number;
  max_loss: number;
  ms: number;
}

interface Leg {
  type: 'call' | 'put';
  strike: number;
  premium: number;
  direction: 'long' | 'short';
  quantity: number;
}

interface Inputs {
  legs: Leg[];
  spot: number;
  price_range_pct: number;
}

const DEFAULT_LEGS: Leg[] = [
  { type: 'call', strike: 100, premium: 4.62, direction: 'long', quantity: 1 },
];

const DEFAULTS: Inputs = {
  legs: DEFAULT_LEGS,
  spot: 100,
  price_range_pct: 40,
};

function parseInputs(sp: Record<string, string | string[] | undefined>): Inputs {
  const num = (v: string | string[] | undefined, fallback: number) => {
    if (v === undefined) return fallback;
    const s = Array.isArray(v) ? v[0] : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };
  // Legs are encoded as parallel arrays: type1, strike1, premium1, direction1, quantity1, type2, ...
  const types = (sp.type as string[] | string | undefined) ?? [];
  const strikes = (sp.strike as string[] | string | undefined) ?? [];
  const premiums = (sp.premium as string[] | string | undefined) ?? [];
  const directions = (sp.direction as string[] | string | undefined) ?? [];
  const quantities = (sp.quantity as string[] | string | undefined) ?? [];
  const arr = (v: string | string[] | undefined) =>
    v === undefined ? [] : Array.isArray(v) ? v : [v];
  const tA = arr(types);
  const sA = arr(strikes);
  const pA = arr(premiums);
  const dA = arr(directions);
  const qA = arr(quantities);
  const n = Math.min(tA.length, sA.length, pA.length, dA.length, qA.length);
  const legs: Leg[] = [];
  for (let i = 0; i < n; i++) {
    legs.push({
      type: tA[i] === 'put' ? 'put' : 'call',
      strike: Number(sA[i]) || 0,
      premium: Number(pA[i]) || 0,
      direction: dA[i] === 'short' ? 'short' : 'long',
      quantity: Math.max(1, Math.round(Number(qA[i]) || 1)),
    });
  }
  return {
    legs: legs.length > 0 ? legs.filter((l) => l.strike > 0 && l.premium >= 0) : DEFAULT_LEGS,
    spot: num(sp.spot, DEFAULTS.spot),
    price_range_pct: num(sp.price_range_pct, DEFAULTS.price_range_pct),
  };
}

async function calc(inputs: Inputs): Promise<PayoffResult | null> {
  try {
    return await callQuantOracle<PayoffResult>('/v1/options/payoff-diagram', {
      legs: inputs.legs,
      spot: inputs.spot,
      price_range_pct: inputs.price_range_pct,
      points: 80,
    });
  } catch {
    return null;
  }
}

export default async function OptionsProfitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const inputs = parseInputs(sp);
  const result = await calc(inputs);

  const jsonLd = [
    calculatorJsonLd({
      name: 'Options Profit Calculator',
      description:
        'Free multi-leg options payoff calculator. Visualizes profit and loss at expiration across underlying prices for any combination of calls and puts.',
      url: 'https://quantoracle.dev/options-profit-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ];

  return (
    <CalculatorShell
      slug="options-profit-calculator"
      title="Options Profit Calculator"
      subtitle="Build single- and multi-leg option strategies and see the exact profit/loss profile at expiration. Calls, puts, longs, shorts, any number of legs. Break-even points and max profit/loss computed automatically."
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
  // For each leg, render a row of inputs. Add-leg/remove-leg is GET-based for SSR
  // (clicking adds an empty leg via query params).
  return (
    <form method="GET" className="card">
      <h2 className="text-lg font-semibold mb-4">Strategy</h2>

      <div className="space-y-4 mb-4">
        <Field name="spot" label="Current spot price ($)" value={inputs.spot} step="0.01" min="0.01" />
        <Field
          name="price_range_pct"
          label="Price range (% from spot)"
          value={inputs.price_range_pct}
          step="5"
          min="5"
          max="200"
          hint="40 = ±40% from spot in the diagram"
        />
      </div>

      <div className="space-y-3 mb-4">
        <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Legs</div>
        {inputs.legs.map((leg, i) => (
          <LegRow key={i} leg={leg} index={i} />
        ))}
      </div>

      {/* Hidden input that re-submits the form with one extra blank leg appended.
          Implemented via a button that has 'name=add_leg' so the server detects it. */}
      <div className="flex gap-2 mb-4">
        <AddLegButton legs={inputs.legs} type="call" />
        <AddLegButton legs={inputs.legs} type="put" />
      </div>

      <button type="submit" className="btn-primary w-full">
        Calculate
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Calls the deterministic{' '}
        <code className="text-slate-300">/v1/options/payoff-diagram</code> endpoint server-side.
      </p>
    </form>
  );
}

function LegRow({ leg, index }: { leg: Leg; index: number }) {
  return (
    <div className="rounded-md border border-ink-700/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wide text-slate-400">Leg {index + 1}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          name="direction"
          defaultValue={leg.direction}
          className="field-input text-xs"
          aria-label={`Leg ${index + 1} direction`}
        >
          <option value="long">Long</option>
          <option value="short">Short</option>
        </select>
        <select
          name="type"
          defaultValue={leg.type}
          className="field-input text-xs"
          aria-label={`Leg ${index + 1} type`}
        >
          <option value="call">Call</option>
          <option value="put">Put</option>
        </select>
        <input
          type="number"
          name="strike"
          defaultValue={leg.strike}
          step="0.01"
          min="0.01"
          required
          className="field-input text-xs"
          placeholder="Strike"
          aria-label={`Leg ${index + 1} strike`}
        />
        <input
          type="number"
          name="premium"
          defaultValue={leg.premium}
          step="0.01"
          min="0"
          required
          className="field-input text-xs"
          placeholder="Premium"
          aria-label={`Leg ${index + 1} premium`}
        />
        <input
          type="number"
          name="quantity"
          defaultValue={leg.quantity}
          step="1"
          min="1"
          required
          className="field-input text-xs col-span-2"
          placeholder="Quantity"
          aria-label={`Leg ${index + 1} quantity`}
        />
      </div>
    </div>
  );
}

function AddLegButton({ legs, type }: { legs: Leg[]; type: 'call' | 'put' }) {
  // Build a query string that includes the existing legs plus a new placeholder
  // leg of the requested type. The link reloads the page with the new param set.
  const sp = new URLSearchParams();
  for (const l of legs) {
    sp.append('type', l.type);
    sp.append('strike', String(l.strike));
    sp.append('premium', String(l.premium));
    sp.append('direction', l.direction);
    sp.append('quantity', String(l.quantity));
  }
  // append blank leg
  sp.append('type', type);
  sp.append('strike', '100');
  sp.append('premium', '1');
  sp.append('direction', 'long');
  sp.append('quantity', '1');
  return (
    <a href={`?${sp.toString()}`} className="btn-ghost text-xs">
      + Add {type}
    </a>
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

function ResultsCard({ inputs, result }: { inputs: Inputs; result: PayoffResult }) {
  const data = result.prices.map((p, i) => ({ price: p, pnl: result.pnl[i] }));
  const netDebit = inputs.legs.reduce(
    (acc, l) => acc + (l.direction === 'long' ? l.premium : -l.premium) * l.quantity,
    0,
  );
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Results</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Net debit/credit" value={`${netDebit >= 0 ? '-' : '+'}$${Math.abs(netDebit).toFixed(2)}`} />
        <Stat
          label="Max profit"
          value={result.max_profit > 1e9 ? 'Unlimited' : `$${result.max_profit.toFixed(2)}`}
          accent
        />
        <Stat
          label="Max loss"
          value={result.max_loss < -1e9 ? 'Unlimited' : `$${result.max_loss.toFixed(2)}`}
          loss
        />
        <Stat label="Break-evens" value={result.breakeven_points.map((p) => `$${p.toFixed(2)}`).join(', ') || 'none'} />
      </div>

      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
        Payoff at expiration
      </h3>
      <OptionsProfitChart data={data} spot={inputs.spot} />
      <div className="mt-2 text-xs text-slate-500">Computed in {result.ms.toFixed(0)} ms.</div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  loss,
}: {
  label: string;
  value: string;
  accent?: boolean;
  loss?: boolean;
}) {
  const colorCls = accent ? 'text-accent' : loss ? 'text-chart-loss' : 'text-slate-100';
  return (
    <div className="bg-ink-800/40 rounded-md p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">{label}</div>
      <div className={`font-mono text-sm tabular-nums ${colorCls}`}>{value}</div>
    </div>
  );
}

function ErrorCard() {
  return (
    <div className="card border-chart-loss/30">
      <h2 className="text-lg font-semibold mb-2 text-chart-loss">Calculation failed</h2>
      <p className="text-sm text-slate-300">
        Make sure each leg has positive strike and premium values, and that the spot price is
        positive.
      </p>
    </div>
  );
}

function Interpretation({ inputs, result }: { inputs: Inputs; result: PayoffResult }) {
  const legCount = inputs.legs.length;
  const breakevens = result.breakeven_points
    .map((p) => `$${p.toFixed(2)}`)
    .join(' and ');
  const maxProfitStr = result.max_profit > 1e9 ? 'unlimited' : `$${result.max_profit.toFixed(2)}`;
  const maxLossStr = result.max_loss < -1e9 ? 'unlimited' : `$${result.max_loss.toFixed(2)}`;
  const beStr = breakevens
    ? `Break-even${result.breakeven_points.length === 1 ? '' : 's'}: ${breakevens}.`
    : 'No break-even points within the price range — your position is profitable across the entire range.';
  return (
    <p>
      This {legCount}-leg strategy on an underlying at <strong>${inputs.spot}</strong> has a
      maximum profit of <strong>{maxProfitStr}</strong> and a maximum loss of{' '}
      <strong>{maxLossStr}</strong> at expiration. {beStr} Hover the chart to see the P&amp;L at
      any specific price.
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>Reading a payoff diagram</h2>
      <p>
        A payoff diagram plots the strategy&apos;s profit (vertical axis) against the underlying
        price at expiration (horizontal axis). Where the curve sits above zero, you make money;
        below zero, you lose money. The points where it crosses zero are your break-evens.
      </p>

      <h3>Single-leg shapes</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Long call:</strong> hockey-stick — flat loss equal to the premium below the
          strike, then rising linearly above. Unlimited upside.
        </li>
        <li>
          <strong>Long put:</strong> mirror image — rising linearly as the underlying falls,
          capped loss at the premium for any price above the strike.
        </li>
        <li>
          <strong>Short call:</strong> capped profit (the premium received), then losing linearly
          and unlimited above the strike.
        </li>
        <li>
          <strong>Short put:</strong> capped profit, losing linearly below the strike. Loss is
          large but bounded (stock can only go to zero).
        </li>
      </ul>

      <h3>Common multi-leg strategies</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Bull call spread</strong> (2 legs): long call at lower strike + short call at
          higher strike. Capped profit, capped loss. Cheaper than a long call but caps upside.
        </li>
        <li>
          <strong>Bear put spread</strong> (2 legs): long put at higher strike + short put at
          lower strike. Mirror-image bull spread for downside views.
        </li>
        <li>
          <strong>Long straddle</strong> (2 legs): long call + long put at the same strike. Profits
          from large moves either direction. Loses if the underlying stays near the strike.
        </li>
        <li>
          <strong>Long strangle</strong> (2 legs): like a straddle but with different strikes
          (call OTM above, put OTM below). Cheaper than a straddle but needs a bigger move to
          profit.
        </li>
        <li>
          <strong>Iron condor</strong> (4 legs): short put spread + short call spread. Profits if
          the underlying stays in a range. Defined max profit and loss.
        </li>
        <li>
          <strong>Butterfly</strong> (3 legs at 3 strikes): peaks at the middle strike, loses if
          the underlying moves much in either direction.
        </li>
      </ul>

      <h3>What the diagram does NOT show</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Pre-expiration P&amp;L.</strong> The diagram is at expiration only. Before
          expiration, time decay (theta), volatility changes (vega), and the underlying movement
          all interact. The current value lies somewhere between the entry premium and the
          expiration value.
        </li>
        <li>
          <strong>Volatility shifts.</strong> If implied volatility changes between now and
          expiration, the value of unexpired options changes. The diagram assumes you hold to
          expiration.
        </li>
        <li>
          <strong>Early assignment risk.</strong> Short options can be assigned at any time. The
          diagram assumes you hold the position cleanly to expiration.
        </li>
        <li>
          <strong>Commissions and slippage.</strong> Real fills are slightly worse than mid; for
          high-leg strategies, commissions add up.
        </li>
      </ul>

      <h3>Where to get the premium values</h3>
      <p>
        From the option chain on your broker. The mid of the bid-ask is a reasonable estimate for
        liquid options. Solve for IV using the{' '}
        <a href="/implied-volatility-calculator" className="text-accent">
          implied volatility calculator
        </a>{' '}
        if you want to compare market premiums to model fair value, and use the{' '}
        <a href="/black-scholes-calculator" className="text-accent">
          Black-Scholes calculator
        </a>{' '}
        if you want to price a leg theoretically before checking the chain.
      </p>
    </div>
  );
}
