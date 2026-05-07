import { CalculatorShell } from '@/components/CalculatorShell';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/impermanent-loss-calculator',
  title: 'Impermanent Loss Calculator (Uniswap v2 + v3)',
  description:
    'Free impermanent loss calculator for liquidity pool positions. Computes IL percentage, dollar loss, and the fee APY needed to break even with just holding the two tokens.',
  keywords: [
    'impermanent loss calculator',
    'uniswap il calculator',
    'liquidity pool calculator',
    'lp loss calculator',
    'amm impermanent loss',
  ],
});

interface IlResult {
  impermanent_loss_pct: number;
  hold_value: number;
  lp_value: number;
  loss_amount: number;
  fee_breakeven_apy: number;
  price_ratio: number;
  amm_type: string;
  ms: number;
}

interface Inputs {
  initial_price_ratio: number;
  current_price_ratio: number;
  amm_type: 'v2' | 'v3';
  initial_investment: number;
}

const DEFAULTS: Inputs = {
  initial_price_ratio: 1.0,
  current_price_ratio: 1.5,
  amm_type: 'v2',
  initial_investment: 10000,
};

function parseInputs(sp: Record<string, string | string[] | undefined>): Inputs {
  const num = (v: string | string[] | undefined, fallback: number) => {
    if (v === undefined) return fallback;
    const s = Array.isArray(v) ? v[0] : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };
  const amm = (v: string | string[] | undefined, fallback: 'v2' | 'v3') => {
    const s = Array.isArray(v) ? v[0] : v;
    return s === 'v3' ? 'v3' : s === 'v2' ? 'v2' : fallback;
  };
  return {
    initial_price_ratio: num(sp.initial_price_ratio, DEFAULTS.initial_price_ratio),
    current_price_ratio: num(sp.current_price_ratio, DEFAULTS.current_price_ratio),
    amm_type: amm(sp.amm_type, DEFAULTS.amm_type),
    initial_investment: num(sp.initial_investment, DEFAULTS.initial_investment),
  };
}

async function calc(inputs: Inputs): Promise<IlResult | null> {
  try {
    return await callQuantOracle<IlResult>('/v1/crypto/impermanent-loss', {
      ...inputs,
    } as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

export default async function ImpermanentLossPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const inputs = parseInputs(sp);
  const result = await calc(inputs);

  const jsonLd = [
    calculatorJsonLd({
      name: 'Impermanent Loss Calculator',
      description:
        'Free impermanent loss calculator for Uniswap v2 / v3 liquidity pool positions, with fee-breakeven APY.',
      url: 'https://quantoracle.dev/impermanent-loss-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ];

  return (
    <CalculatorShell
      slug="impermanent-loss-calculator"
      title="Impermanent Loss Calculator"
      subtitle="Quantify the cost of providing liquidity to an AMM pool versus simply holding the two tokens. Returns IL percentage, dollar amount, and the fee APY needed to break even."
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
      <div className="space-y-4">
        <Field
          name="initial_investment"
          label="Initial investment ($)"
          value={inputs.initial_investment}
          step="any"
          min="1"
        />
        <Field
          name="initial_price_ratio"
          label="Initial price ratio"
          value={inputs.initial_price_ratio}
          step="any"
          min="0.0001"
          hint="Token A / Token B at the time you provided liquidity (1.0 if you don't know)"
        />
        <Field
          name="current_price_ratio"
          label="Current price ratio"
          value={inputs.current_price_ratio}
          step="any"
          min="0.0001"
          hint="Token A / Token B now. 1.5 = token A appreciated 50% relative to token B"
        />
        <Select
          name="amm_type"
          label="AMM type"
          value={inputs.amm_type}
          options={[
            { value: 'v2', label: 'Uniswap v2 / SushiSwap (full range)' },
            { value: 'v3', label: 'Uniswap v3 (concentrated liquidity)' },
          ]}
        />
      </div>
      <button type="submit" className="btn-primary w-full mt-5">
        Calculate
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Calls the deterministic <code className="text-slate-300">/v1/crypto/impermanent-loss</code>{' '}
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

function ResultsCard({ inputs, result }: { inputs: Inputs; result: IlResult }) {
  const ratioChange = inputs.current_price_ratio / inputs.initial_price_ratio;
  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Results</h2>
        <span className="text-xs text-slate-500">
          {inputs.amm_type === 'v3' ? 'Uniswap v3' : 'Uniswap v2'} · $
          {inputs.initial_investment.toLocaleString()} initial · ratio {ratioChange.toFixed(2)}×
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Impermanent loss</div>
          <div className={`font-mono text-3xl tabular-nums ${result.impermanent_loss_pct < 0 ? 'text-chart-loss' : 'text-accent'}`}>
            {result.impermanent_loss_pct.toFixed(2)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">vs simply holding both tokens</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Dollar loss</div>
          <div className="font-mono text-3xl tabular-nums text-chart-loss">
            ${Math.abs(result.loss_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Hold value" value={`$${result.hold_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <Stat label="LP value" value={`$${result.lp_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <Stat label="Fee breakeven APY" value={`${result.fee_breakeven_apy.toFixed(2)}%`} />
        <Stat label="Price ratio" value={result.price_ratio.toFixed(4)} />
        <Stat label="AMM type" value={result.amm_type} />
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
        Make sure both price ratios are positive numbers. The current ratio may differ from the
        initial ratio by any factor.
      </p>
    </div>
  );
}

function Interpretation({ inputs, result }: { inputs: Inputs; result: IlResult }) {
  const ratio = inputs.current_price_ratio / inputs.initial_price_ratio;
  const movePct = (Math.abs(ratio - 1) * 100).toFixed(1);
  const direction = ratio > 1 ? 'higher' : 'lower';
  const ilPct = Math.abs(result.impermanent_loss_pct);
  const verdict =
    ilPct < 0.5
      ? 'minimal — well within what fees on most pools recover'
      : ilPct < 3
        ? 'modest — a healthy fee yield should compensate'
        : ilPct < 10
          ? 'meaningful — only worth it if the pool generates serious fees or rewards'
          : 'large — at this level, only very high-volume pools would compensate the loss';
  return (
    <p>
      With token A&apos;s price ratio relative to token B {movePct}% {direction} than at LP entry,
      your impermanent loss is <strong>{result.impermanent_loss_pct.toFixed(2)}%</strong> — a
      dollar loss of <strong>${Math.abs(result.loss_amount).toFixed(2)}</strong> on the original $
      {inputs.initial_investment.toLocaleString()} investment. This is <strong>{verdict}</strong>.
      The pool would need to generate at least{' '}
      <strong>{result.fee_breakeven_apy.toFixed(2)}% APY</strong> in fees to compensate; check the
      pool&apos;s actual fee yield against this number.
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>Why impermanent loss exists</h2>
      <p>
        Automated market makers (AMMs) like Uniswap let anyone provide liquidity by depositing two
        tokens. Traders swap against your liquidity, paying fees that get distributed to LPs.
        Sounds great. The catch: when one token&apos;s price changes relative to the other, the
        AMM automatically rebalances your position to maintain a constant product (xy = k for
        Uniswap v2). This means it sells you out of the appreciating token and into the
        depreciating one. Compared to having simply held the two tokens, you end up with less
        value.
      </p>

      <h3>The math, briefly</h3>
      <p>
        For a Uniswap v2 pool, if the price ratio of token A to token B has changed by a factor{' '}
        <code>p</code> (where p=1 means no change), the impermanent loss is:
      </p>
      <pre className="bg-ink-800 border border-ink-700 rounded-md p-3 text-xs overflow-x-auto">
        <code>{`IL = 2·√p / (1+p) − 1`}</code>
      </pre>
      <p>
        At p=1, IL=0%. At p=1.5, IL=-2.0%. At p=2, IL=-5.7%. At p=4, IL=-20%. At p=10, IL=-43%. The
        formula is symmetric: a token that doubles produces the same IL as one that halves. The
        loss accelerates with extreme price moves but is small for moderate ones.
      </p>

      <h3>What v3 changes</h3>
      <p>
        Uniswap v3 lets LPs concentrate liquidity in a price range instead of providing it across
        all prices (0 to ∞). Within the range, capital efficiency is much higher — you can provide
        the same depth with a fraction of the capital, which means much higher fees per dollar
        deposited. But the IL within the range is amplified by the same factor: if you concentrate
        in a tight range and the price exits it, you become 100% one token at the worst possible
        time.
      </p>

      <h3>When LPing pays</h3>
      <p>
        LPing is profitable when fee yield + reward yield exceeds IL over your holding period. The
        &quot;fee breakeven APY&quot; in the results tells you the threshold. Some quick
        intuitions:
      </p>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Stable-stable pairs</strong> (USDC/USDT): IL is essentially zero. Fee yields are
          low (3-10% APY). Almost always profitable to LP if you can earn fees + rewards.
        </li>
        <li>
          <strong>Correlated pairs</strong> (ETH/stETH, BTC/WBTC): low IL, low fees. Usually
          profitable for similar reasons.
        </li>
        <li>
          <strong>Volatile-stable</strong> (ETH/USDC): meaningful IL when one moves significantly,
          but typically high fee volume. Profitable in calm markets, uncertain in trending ones.
        </li>
        <li>
          <strong>Volatile-volatile</strong> (ETH/BTC, SOL/AVAX): IL depends on relative
          divergence. Can be profitable if the two assets stay correlated; brutal if they
          decouple.
        </li>
      </ul>

      <h3>Related</h3>
      <p>
        Use the{' '}
        <a href="/crypto-liquidation-calculator" className="text-accent">
          liquidation price calculator
        </a>{' '}
        for leveraged crypto positions; the QuantOracle API also exposes endpoints for funding
        rate calculation, DEX slippage, and rebalance thresholds — see{' '}
        <a href="/api-docs" className="text-accent">
          /api-docs
        </a>
        .
      </p>
    </div>
  );
}
