import { CalculatorShell } from '@/components/CalculatorShell';
import { Faq } from '@/components/FAQ';
import { callQuantOracle } from '@/lib/api';
import { buildMetadata, calculatorJsonLd, faqJsonLd } from '@/lib/seo';
import { faqs } from './faqs';

export const metadata = buildMetadata({
  path: '/position-size-calculator',
  title: 'Position Size Calculator (Stocks, Forex, Crypto)',
  description:
    'Free position-size calculator. Enter your account size, risk-per-trade, entry, and stop-loss — get the exact share count, total risk, and 2R target price.',
  keywords: [
    'position size calculator',
    'risk per trade',
    'share calculator',
    'trading position size',
    'stop loss calculator',
  ],
});

interface PositionResult {
  shares: number;
  value: number;
  risk: number;
  pct_account: number;
  risk_per_share: number;
  max_loss: number;
  target_2r: number;
  ms: number;
}

interface Inputs {
  account_size: number;
  risk_per_trade: number;
  entry_price: number;
  stop_loss: number;
}

const DEFAULTS: Inputs = {
  account_size: 100000,
  risk_per_trade: 0.02,
  entry_price: 50,
  stop_loss: 48,
};

function parseInputs(sp: Record<string, string | string[] | undefined>): Inputs {
  const num = (v: string | string[] | undefined, fallback: number) => {
    if (v === undefined) return fallback;
    const s = Array.isArray(v) ? v[0] : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    account_size: num(sp.account_size, DEFAULTS.account_size),
    risk_per_trade: num(sp.risk_per_trade, DEFAULTS.risk_per_trade),
    entry_price: num(sp.entry_price, DEFAULTS.entry_price),
    stop_loss: num(sp.stop_loss, DEFAULTS.stop_loss),
  };
}

async function priceSize(inputs: Inputs): Promise<PositionResult | null> {
  try {
    return await callQuantOracle<PositionResult>('/v1/risk/position-size', { ...inputs });
  } catch {
    return null;
  }
}

export default async function PositionSizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const inputs = parseInputs(sp);
  const result = await priceSize(inputs);

  const jsonLd = [
    calculatorJsonLd({
      name: 'Position Size Calculator',
      description:
        'Free position-size calculator implementing fixed-fractional risk per trade with stop-loss-based share count.',
      url: 'https://quantoracle.dev/position-size-calculator',
    }),
    faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.plainAnswer }))),
  ].join('\n');

  return (
    <CalculatorShell
      slug="position-size-calculator"
      title="Position Size Calculator"
      subtitle="Get the exact number of shares to buy so a single bad trade can only lose your chosen risk-per-trade fraction. Works for longs and shorts, stocks and crypto."
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
          name="account_size"
          label="Account size ($)"
          value={inputs.account_size}
          step="100"
          min="1"
        />
        <Field
          name="risk_per_trade"
          label="Risk per trade (fraction)"
          value={inputs.risk_per_trade}
          step="0.001"
          min="0.0001"
          max="0.5"
          hint="0.02 = 2% of account, the standard retail rule"
        />
        <Field
          name="entry_price"
          label="Entry price ($)"
          value={inputs.entry_price}
          step="0.01"
          min="0.0001"
        />
        <Field
          name="stop_loss"
          label="Stop-loss price ($)"
          value={inputs.stop_loss}
          step="0.01"
          min="0.0001"
          hint="Above entry for shorts, below for longs"
        />
      </div>
      <button type="submit" className="btn-primary w-full mt-5">
        Calculate
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Calls the deterministic <code className="text-slate-300">/v1/risk/position-size</code>{' '}
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

function ResultsCard({ inputs, result }: { inputs: Inputs; result: PositionResult }) {
  const overAccount = result.value > inputs.account_size;
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Results</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Buy</div>
          <div className="stat-num">{result.shares.toLocaleString()} shares</div>
          <div className="text-xs text-slate-500 mt-1">
            position value ${result.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Max loss at stop</div>
          <div className="font-mono text-xl tabular-nums text-chart-loss">
            -${result.max_loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {(result.pct_account * 100).toFixed(2)}% of account
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Risk / share" value={`$${result.risk_per_share.toFixed(2)}`} />
        <Stat label="2R target price" value={`$${result.target_2r.toFixed(2)}`} />
        <Stat label="Shares × entry" value={`$${result.value.toFixed(0)}`} />
      </div>

      {overAccount && (
        <div className="mt-4 p-3 rounded-md bg-chart-loss/10 border border-chart-loss/30">
          <div className="text-xs uppercase tracking-wide text-chart-loss mb-1">Warning</div>
          <div className="text-sm text-slate-200">
            The calculated position value ($
            {result.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            ) exceeds your account size. Either widen your stop-loss, lower your risk-per-trade
            fraction, or pass on the trade.
          </div>
        </div>
      )}

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
        Check that all values are positive and that the entry price differs from the stop-loss
        price.
      </p>
    </div>
  );
}

function Interpretation({ inputs, result }: { inputs: Inputs; result: PositionResult }) {
  const direction = inputs.entry_price > inputs.stop_loss ? 'long' : 'short';
  const stopPct = (Math.abs(inputs.entry_price - inputs.stop_loss) / inputs.entry_price) * 100;
  return (
    <p>
      For a {direction} entry at <strong>${inputs.entry_price}</strong> with a stop at{' '}
      <strong>${inputs.stop_loss}</strong> ({stopPct.toFixed(2)}% from entry), risking{' '}
      <strong>{(inputs.risk_per_trade * 100).toFixed(2)}%</strong> of a $
      {inputs.account_size.toLocaleString()} account, you should buy{' '}
      <strong>{result.shares.toLocaleString()} shares</strong>. Worst-case loss at the stop is{' '}
      <strong>${result.max_loss.toFixed(2)}</strong>. If the trade reaches your 2R target at $
      {result.target_2r.toFixed(2)}, your gain is twice the dollar risk.
    </p>
  );
}

function Longform() {
  return (
    <div>
      <h2>The fixed-fractional rule</h2>
      <p>
        Position sizing is the discipline that separates traders who survive losing streaks from
        traders who do not. The simplest sustainable rule is{' '}
        <em>fixed-fractional risk per trade</em>: pick a small percentage of your account that you
        are willing to lose on any single trade — typically 1-2% — and let your stop-loss distance
        determine how many shares to buy.
      </p>
      <p>
        With 2% per trade, a streak of 10 consecutive losses leaves you down about 18%. With 5%,
        the same streak draws you down 40%. With 10%, 65%. The math is unforgiving on the high end:
        per-trade risk and drawdown grow geometrically, not linearly.
      </p>

      <h3>Why this rule beats the alternatives</h3>
      <p>
        New traders often size by gut, by &quot;buy a round lot,&quot; or by &quot;use all
        available margin.&quot; All three guarantee that your worst trade roughly equals your
        biggest position, which means a single fat-finger or a single fast-market gap can take out
        your account. Fixed-fractional sizing decouples the size of any single bet from the size of
        the worst possible outcome.
      </p>

      <h3>Tightening or loosening the stop</h3>
      <p>
        Notice how the stop distance interacts with the position size. If you cut your stop in
        half, you can buy twice as many shares for the same dollar risk — but you double your
        chances of getting stopped out by routine noise. If you widen the stop, you buy fewer
        shares but tolerate more wiggle. The right stop comes from the trade thesis (volatility,
        support/resistance, average true range), not from how big a position you want.
      </p>

      <h3>R-multiples and trade evaluation</h3>
      <p>
        Many traders track outcomes in R-multiples — the ratio of profit (or loss) to the dollar
        amount risked. A trade that hits 2R is &quot;a 2R win.&quot; A losing trade that gets out
        at the stop is &quot;a -1R loss.&quot; This standardization lets you compare trade quality
        across positions of different sizes. A profitable trader generally has an average R per
        trade above zero — even if their win rate is below 50%, the size of their wins relative to
        their losses keeps the expectancy positive.
      </p>

      <h3>Combining with Kelly</h3>
      <p>
        This calculator answers &quot;given that I want to risk X% of account per trade, how many
        shares?&quot; It does not tell you what X% should be. For that, see the{' '}
        <a href="/kelly-criterion-calculator" className="text-accent">
          Kelly criterion calculator
        </a>{' '}
        — it derives the optimal X% from your edge and win/loss profile.
      </p>
    </div>
  );
}
