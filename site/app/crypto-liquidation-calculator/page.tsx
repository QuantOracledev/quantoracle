import { CalculatorShell } from '@/components/CalculatorShell';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/crypto-liquidation-calculator',
  title: 'Crypto Liquidation Price Calculator (Long & Short, Any Leverage)',
  description:
    'Free crypto liquidation price calculator. Enter entry, collateral, position size, leverage, and direction — get the exact liquidation price and distance-to-liquidation percentage.',
  keywords: [
    'crypto liquidation calculator',
    'liquidation price calculator',
    'leverage calculator',
    'futures liquidation',
    'perpetual swap liquidation',
  ],
});

interface LiquidationResult {
  liquidation_price: number;
  distance_pct: number;
  effective_leverage: number;
  margin_ratio_current: number;
  max_loss_before_liq: number;
  direction: string;
  safe_price_range: { min: number; max: number };
  ms: number;
}

interface Inputs {
  entry_price: number;
  collateral: number;
  position_size: number;
  leverage: number;
  direction: 'long' | 'short';
  maintenance_margin_rate: number;
  funding_accumulated: number;
}

const DEFAULTS: Inputs = {
  entry_price: 50000,
  collateral: 1000,
  position_size: 10000,
  leverage: 10,
  direction: 'long',
  maintenance_margin_rate: 0.005,
  funding_accumulated: 0,
};

function parseInputs(sp: Record<string, string | string[] | undefined>): Inputs {
  const num = (v: string | string[] | undefined, fallback: number) => {
    if (v === undefined) return fallback;
    const s = Array.isArray(v) ? v[0] : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };
  const dir = (v: string | string[] | undefined, fallback: 'long' | 'short') => {
    const s = Array.isArray(v) ? v[0] : v;
    return s === 'short' ? 'short' : s === 'long' ? 'long' : fallback;
  };
  return {
    entry_price: num(sp.entry_price, DEFAULTS.entry_price),
    collateral: num(sp.collateral, DEFAULTS.collateral),
    position_size: num(sp.position_size, DEFAULTS.position_size),
    leverage: num(sp.leverage, DEFAULTS.leverage),
    direction: dir(sp.direction, DEFAULTS.direction),
    maintenance_margin_rate: num(sp.maintenance_margin_rate, DEFAULTS.maintenance_margin_rate),
    funding_accumulated: num(sp.funding_accumulated, DEFAULTS.funding_accumulated),
  };
}

async function calc(inputs: Inputs): Promise<LiquidationResult | null> {
  try {
    return await callQuantOracle<LiquidationResult>('/v1/crypto/liquidation-price', {
      ...inputs,
    } as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

export default async function CryptoLiqPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const inputs = parseInputs(sp);
  const result = await calc(inputs);

  const jsonLd = [
    calculatorJsonLd({
      name: 'Crypto Liquidation Price Calculator',
      description:
        'Free liquidation price calculator for leveraged crypto positions on isolated margin, with maintenance-margin and accumulated-funding adjustments.',
      url: 'https://quantoracle.dev/crypto-liquidation-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ];

  return (
    <CalculatorShell
      slug="crypto-liquidation-calculator"
      title="Crypto Liquidation Price Calculator"
      subtitle="Calculate the exact price at which a leveraged crypto position gets force-closed. Supports longs and shorts, any leverage, and accumulated funding payments. Isolated-margin model."
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
        <Field name="entry_price" label="Entry price ($)" value={inputs.entry_price} step="0.01" min="0.01" />
        <Field name="leverage" label="Leverage" value={inputs.leverage} step="0.1" min="1" max="125" hint="e.g. 10 for 10×" />
        <Field name="collateral" label="Collateral (USD)" value={inputs.collateral} step="1" min="0.01" />
        <Field name="position_size" label="Position size (USD)" value={inputs.position_size} step="1" min="0.01" hint="collateral × leverage" />
        <Select
          name="direction"
          label="Direction"
          value={inputs.direction}
          options={[
            { value: 'long', label: 'Long' },
            { value: 'short', label: 'Short' },
          ]}
        />
        <Field
          name="maintenance_margin_rate"
          label="Maintenance margin"
          value={inputs.maintenance_margin_rate}
          step="0.0001"
          min="0"
          hint="0.005 = 0.5% (typical for majors)"
        />
        <Field
          name="funding_accumulated"
          label="Accumulated funding ($)"
          value={inputs.funding_accumulated}
          step="0.01"
          hint="Negative if you have paid funding"
        />
      </div>
      <button type="submit" className="btn-primary w-full mt-5">
        Calculate
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Calls the deterministic <code className="text-slate-300">/v1/crypto/liquidation-price</code>{' '}
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

function ResultsCard({ inputs, result }: { inputs: Inputs; result: LiquidationResult }) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Results</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Liquidation price</div>
          <div className="font-mono text-3xl tabular-nums text-chart-loss">
            ${result.liquidation_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Distance to liquidation</div>
          <div className="font-mono text-3xl tabular-nums text-accent">
            {result.distance_pct.toFixed(2)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            from entry of ${inputs.entry_price.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Effective leverage" value={`${result.effective_leverage.toFixed(2)}×`} />
        <Stat label="Current margin ratio" value={`${(result.margin_ratio_current * 100).toFixed(2)}%`} />
        <Stat
          label="Max loss before liq"
          value={`$${result.max_loss_before_liq.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        />
        <Stat
          label="Safe price range (low)"
          value={`$${result.safe_price_range.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        />
        <Stat
          label="Safe price range (high)"
          value={`$${result.safe_price_range.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        />
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
        Make sure all inputs are positive. Verify leverage = position_size / collateral within
        rounding.
      </p>
    </div>
  );
}

function Interpretation({ inputs, result }: { inputs: Inputs; result: LiquidationResult }) {
  const tier =
    result.distance_pct > 25
      ? 'comfortably far — even sharp adverse moves should not threaten the position'
      : result.distance_pct > 10
        ? 'meaningful — routine market noise will not liquidate, but a typical daily move could put it close'
        : result.distance_pct > 5
          ? 'tight — single-day adverse moves of this magnitude are common in crypto, especially on high-vol days'
          : 'extremely tight — a routine intraday move could wipe out the position';
  return (
    <p>
      Your {inputs.direction} position is liquidated if the price moves to{' '}
      <strong>${result.liquidation_price.toFixed(2)}</strong>, which is{' '}
      <strong>{result.distance_pct.toFixed(2)}%</strong> away from your entry — {tier}. Worst-case
      loss before liquidation is{' '}
      <strong>
        $
        {result.max_loss_before_liq.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </strong>
      , approximately your full collateral.
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>How crypto liquidations work</h2>
      <p>
        Crypto exchanges let you trade with leverage — borrow against your collateral to take
        positions larger than your account. The mechanic that makes this possible is automated
        liquidation: if the position moves against you far enough that your collateral is
        insufficient to cover further losses, the exchange force-closes the position to protect
        itself. You lose most or all of your collateral in the process.
      </p>

      <h3>The math behind the price</h3>
      <p>
        For an <strong>isolated-margin long</strong>:
      </p>
      <pre className="bg-ink-800 border border-ink-700 rounded-md p-3 text-xs overflow-x-auto">
        <code>{`liquidation_price = entry × (1 − 1/leverage + maintenance_margin)`}</code>
      </pre>
      <p>
        For a <strong>short</strong>, flip the signs:
      </p>
      <pre className="bg-ink-800 border border-ink-700 rounded-md p-3 text-xs overflow-x-auto">
        <code>{`liquidation_price = entry × (1 + 1/leverage − maintenance_margin)`}</code>
      </pre>
      <p>
        At 10× leverage with 0.5% maintenance margin, an isolated long is liquidated when the
        price falls 9.5% from entry. At 20×, 4.5%. At 50×, 1.5%. At 100×, half a percent. The
        relationship between leverage and survivable price movement is starkly nonlinear: doubling
        leverage roughly halves your buffer.
      </p>

      <h3>Why your real liquidation might differ</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Funding payments</strong> on perpetual swaps drift your effective collateral up
          or down. Long the funding-positive side: you pay, and your liquidation creeps closer.
        </li>
        <li>
          <strong>Tiered maintenance margin.</strong> Most exchanges raise the maintenance margin
          requirement as your position size grows. A position large enough to push you into a
          higher tier has a closer liquidation than the base-tier formula suggests.
        </li>
        <li>
          <strong>Cross vs isolated margin.</strong> In cross margin, the exchange uses your full
          account equity, including PnL from other positions, in the liquidation calculation. This
          gives more buffer per position but exposes the entire account if many positions move
          together.
        </li>
        <li>
          <strong>Trading fees.</strong> Some exchanges include exit-side fees in the liquidation
          calculation, which moves the effective liquidation closer.
        </li>
      </ul>

      <h3>Practical implications</h3>
      <p>
        The lesson the math forces is uncomfortable: high leverage looks profitable in the
        scenarios where you win, and instantly catastrophic in the scenarios where you lose. A
        100× leveraged position that is correct 99% of the time still loses everything in one bad
        outcome. Most experienced crypto traders cap leverage at 2-5× for positions held more than
        a few hours, and reserve double-digit leverage for tightly-stop-lossed scalp trades.
      </p>

      <h3>Related calculators</h3>
      <p>
        Use the{' '}
        <a href="/position-size-calculator" className="text-accent">
          position-size calculator
        </a>{' '}
        to size positions consistently from a stop-loss-based risk rule. Use the{' '}
        <a href="/kelly-criterion-calculator" className="text-accent">
          Kelly calculator
        </a>{' '}
        to derive what fraction of your account you should risk per trade given your edge.
      </p>
    </div>
  );
}
