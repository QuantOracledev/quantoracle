import Link from 'next/link';
import { AffiliateCta } from '@/components/AffiliateCta';
import { WritingRelated } from '@/components/WritingRelated';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/writing/anatomy-of-a-paying-quant-agent',
  title:
    "Anatomy of a Paying Quant Agent — 8 x402 Tool Calls, 75 Minutes, $0.285 USDC on Base Mainnet",
  description:
    "On 2026-05-29 a single wallet ran 8 chained x402 paid tool calls through the QuantOracle API in 75 minutes for $0.285 USDC. All 8 transactions are on-chain on Base. Here's the exact sequence, the on-chain proof, what each tool likely returned, and how to build an agent that runs the same flow.",
  keywords: [
    'x402 agent example',
    'x402 paid tool calls',
    'agent on-chain payment',
    'base mainnet agent',
    'quant agent workflow',
    'chained tool calls agent',
    'agent decision loop',
    'micropayment ai agent',
    'x402 case study',
  ],
});

const LAST_UPDATED = 'May 29, 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline:
    "Anatomy of a Paying Quant Agent — 8 x402 Tool Calls, 75 Minutes, $0.285 USDC on Base Mainnet",
  description:
    'A single wallet ran 8 chained x402 paid quant tool calls through the QuantOracle API in 75 minutes for $0.285 USDC. The exact sequence, on-chain proof, and how to build one.',
  author: { '@type': 'Organization', name: 'QuantOracle' },
  publisher: { '@type': 'Organization', name: 'QuantOracle', url: 'https://quantoracle.dev' },
  datePublished: '2026-05-29',
  dateModified: '2026-05-29',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://quantoracle.dev/writing/anatomy-of-a-paying-quant-agent',
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'QuantOracle', item: 'https://quantoracle.dev' },
    { '@type': 'ListItem', position: 2, name: 'Writing', item: 'https://quantoracle.dev/writing' },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Anatomy of a Paying Quant Agent',
      item: 'https://quantoracle.dev/writing/anatomy-of-a-paying-quant-agent',
    },
  ],
};

interface Step {
  i: number;
  time: string;
  endpoint: string;
  amount: string;
  tx: string;
  what: string;
  chains_to: string;
}

const SEQUENCE: Step[] = [
  {
    i: 1,
    time: '19:22:09',
    endpoint: '/v1/portfolio/health',
    amount: '0.04',
    tx: '0x0fb459e1b29022527ff11e70dfbe947f35086ec0edf05f8cec6d8633fa2f8143',
    what: 'Composite portfolio audit — current allocation, drift from target, concentration risk, basic risk metrics. The "where am I right now" call.',
    chains_to: 'Reveals problems and opportunities. The agent now knows which positions need attention.',
  },
  {
    i: 2,
    time: '19:34:20',
    endpoint: '/v1/trade/evaluate',
    amount: '0.025',
    tx: '0x3b3bedfe27f1140e87061c57c6f19ee80b317aedd64b72211c82b7844b372f17',
    what: 'Trade idea evaluator — given a proposed trade (size, instrument, direction), returns expected risk-adjusted return, fit to existing portfolio, and a flag if it would breach concentration limits.',
    chains_to: 'The agent now has a quantified opinion on a specific trade.',
  },
  {
    i: 3,
    time: '19:34:58',
    endpoint: '/v1/options/spread-scan',
    amount: '0.05',
    tx: '0x8b7a5ecfc51c9dd04f106592d7246092ab0404c3544f4cc05adc188c845df11f',
    what: 'Multi-leg options spread scanner — searches across the chain for credit/debit spreads matching defined risk-reward criteria. Ranks structures by expected value.',
    chains_to: 'Surfaces option-structure alternatives to the simple long/short trade the prior call evaluated.',
  },
  {
    i: 4,
    time: '19:37:17',
    endpoint: '/v1/pairs/signal',
    amount: '0.025',
    tx: '0x726fe9b2aa85703b5cb1ad187921924d84f84db422a8506c077fb90c7adab49d',
    what: 'Pairs trading signal — runs cointegration / spread z-score / half-life against a candidate pair. Returns entry / exit / current position recommendation.',
    chains_to: 'A second-strategy alternative — market-neutral instead of directional.',
  },
  {
    i: 5,
    time: '19:50:52',
    endpoint: '/v1/risk/full-analysis',
    amount: '0.04',
    tx: '0xc70253c27afbc7e0444e4ff275a07b1aa0313712554a7cb397763b607bbf20ba',
    what: 'Full risk audit on a return series — Sharpe, Sortino, Calmar, max drawdown, VaR, CVaR, Kelly fraction, Hurst exponent. The portfolio-level "what could go wrong" call.',
    chains_to: 'Quantified tail risk plus optimal sizing — feeds the hedging decision.',
  },
  {
    i: 6,
    time: '20:28:34',
    endpoint: '/v1/indicators/regime-classify',
    amount: '0.015',
    tx: '0x2684365ce14f29b7f82dc620e7889f76c2458009ceeaeae036dae5d1900a545a',
    what: 'Market regime classifier — trending / mean-reverting / high-vol / low-vol / crisis label using Hurst + realized vol + drawdown features.',
    chains_to: 'Conditions the hedging policy. Crisis regime = stronger hedges; trending = lighter.',
  },
  {
    i: 7,
    time: '20:35:13',
    endpoint: '/v1/hedging/recommend',
    amount: '0.04',
    tx: '0x0a195b660e347df36fbe0593808ec031ecd21d0e89af5596fdac44312961e3f7',
    what: 'Hedging recommender — given a position and a horizon, returns ranked hedge structures: collar, protective put, partial put, inverse position. Each scored by cost, residual downside, and upside captured.',
    chains_to: 'Concrete hedge choice for the rebalance step.',
  },
  {
    i: 8,
    time: '20:36:01',
    endpoint: '/v1/portfolio/rebalance-plan',
    amount: '0.05',
    tx: '0x578dcbf25781da717ef90f3322bd849a63a945feda6d7a76f414ca7a304930de',
    what: 'Rebalance plan — given current portfolio, target weights, and constraints, returns the ordered list of buys/sells (including hedges) that move the portfolio to the target with minimum turnover.',
    chains_to: 'Final output: an executable action list.',
  },
];

const TOTAL_USDC = 0.285;
const TOTAL_TOOLS = 8;
const WINDOW_MIN = 74;
const PAYER = '0x9CC42f3d9245B867ACccd630B43f906c1665b176';

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-accent">Home</Link> /{' '}
        <Link href="/writing" className="hover:text-accent">Writing</Link>{' '}
        / Anatomy of a Paying Quant Agent
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Anatomy of a Paying Quant Agent — 8 Tool Calls, 75 Minutes, $0.285 USDC on Base Mainnet
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          On 2026-05-29 a single wallet ran 8 chained x402 paid tool calls through the QuantOracle
          API in 75 minutes for a total of $0.285 USDC. All 8 transactions are settled on Base
          mainnet and verifiable on-chain. Here&apos;s the exact sequence, the on-chain proof,
          what each tool returned, and how to build an agent that runs the same flow.
        </p>
        <p className="mt-3 text-xs text-slate-500">Published {LAST_UPDATED}</p>
      </header>

      <article className="prose-soft">
        <p>
          Most x402 demos show <em>one</em> paid call. Single transaction, single response, done.
          That&apos;s not what an autonomous agent looks like in practice. An agent reasoning
          about a portfolio decision needs multiple inputs — current state, candidate actions,
          risk assessment, regime context, hedging options — and synthesizes them. The
          interesting case for x402 is the <strong>multi-step loop</strong>: chained paid tool
          calls in one agent run, each step informed by the previous, total cost a fraction of a
          dollar.
        </p>
        <p>
          We didn&apos;t plan this case study. We woke up to one in our settlements ledger.
        </p>

        <h2>What happened</h2>
        <ul>
          <li>
            <strong>Payer wallet:</strong>{' '}
            <a
              href={`https://basescan.org/address/${PAYER}`}
              target="_blank"
              rel="noopener"
              className="text-accent"
            >
              <code>{PAYER.slice(0, 10)}…{PAYER.slice(-6)}</code>
            </a>
            {' '}— a returning payer (first paid 2026-04-22, came back 37 days later)
          </li>
          <li><strong>Window:</strong> 19:22 → 20:36 UTC ({WINDOW_MIN} minutes total)</li>
          <li><strong>Tool calls:</strong> {TOTAL_TOOLS} distinct composite endpoints, no repeats</li>
          <li><strong>Total cost:</strong> ${TOTAL_USDC} USDC, all on Base mainnet via x402</li>
          <li><strong>Network:</strong> 100% Base; no Solana on this run</li>
        </ul>
        <p>
          We have no other identity for this wallet — no email, no IP, no API key, no signup.
          The only way they got tools and paid for them is the wallet → x402 → API loop. That&apos;s
          the entire customer relationship: stateless, anonymous, on-chain.
        </p>

        <h2>The full sequence</h2>
        <p>
          Eight calls, in order. Each row links to the on-chain settlement on BaseScan — you can
          verify every payment yourself:
        </p>

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="text-left">#</th>
                <th className="text-left">Time UTC</th>
                <th className="text-left">Endpoint</th>
                <th className="text-right">USDC</th>
                <th className="text-left">On-chain</th>
              </tr>
            </thead>
            <tbody>
              {SEQUENCE.map((s) => (
                <tr key={s.tx} className="border-t border-ink-700/40">
                  <td className="py-2 align-top">{s.i}</td>
                  <td className="py-2 align-top whitespace-nowrap font-mono">{s.time}</td>
                  <td className="py-2 align-top"><code>{s.endpoint}</code></td>
                  <td className="py-2 align-top text-right">${s.amount}</td>
                  <td className="py-2 align-top">
                    <a
                      href={`https://basescan.org/tx/${s.tx}`}
                      target="_blank"
                      rel="noopener"
                      className="text-accent"
                    >
                      tx ↗
                    </a>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-ink-700/40 font-semibold">
                <td className="py-2"></td>
                <td className="py-2"></td>
                <td className="py-2">Total</td>
                <td className="py-2 text-right">${TOTAL_USDC}</td>
                <td className="py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>What each step did, and why it chains</h2>
        <p>
          We can&apos;t see the agent&apos;s system prompt or internal reasoning — only the API
          calls. But the sequence isn&apos;t random. Read in order, it&apos;s a coherent decision
          loop: <em>where am I → what could I do → what are the risks → what regime am I in → how
          do I hedge → what&apos;s the executable plan</em>.
        </p>

        {SEQUENCE.map((s) => (
          <div key={s.tx} className="my-6 rounded-lg border border-ink-700/60 p-4">
            <div className="flex items-baseline justify-between mb-2 gap-2 flex-wrap">
              <div className="font-mono text-xs text-accent">{s.time} UTC</div>
              <div className="text-xs text-slate-500">${s.amount} USDC</div>
            </div>
            <div className="font-semibold text-slate-100 mb-1">
              Step {s.i} — <code>{s.endpoint}</code>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-2">{s.what}</p>
            <p className="text-xs text-slate-400 italic">
              <strong>How it chains:</strong> {s.chains_to}
            </p>
          </div>
        ))}

        <h2>The pauses tell a story too</h2>
        <p>
          The 75-minute window isn&apos;t evenly spaced. The agent paused at two notable points:
        </p>
        <ul>
          <li>
            <strong>Step 4 → 5 (3 minutes):</strong> Short pause between the pairs signal and the
            full risk analysis. Likely the agent gathering the return series to pass into the
            risk audit.
          </li>
          <li>
            <strong>Step 5 → 6 (38 minutes):</strong> The long pause. Most likely the agent went
            off-API — either pulling external data (price history, fundamentals, news), running
            an LLM reasoning step locally, or waiting on a human-in-the-loop confirmation before
            spending more on paid composites.
          </li>
          <li>
            <strong>Step 7 → 8 (1 minute):</strong> The fastest hop in the run. Hedge
            recommendation → rebalance plan is a tight, mechanical chain — the hedge output
            feeds directly into the rebalance constraints.
          </li>
        </ul>

        <h2>Cost analysis</h2>
        <p>
          $0.285 for a full quant decision loop is the headline number, but the more interesting
          framing is what it replaced:
        </p>
        <ul>
          <li>
            <strong>Vs. building it yourself:</strong> Implementing portfolio health, risk audit,
            spread scanning, pairs cointegration, regime classification, hedge ranking, and
            rebalance optimization in-house is probably ~6 engineer-months of correctness work,
            calibration, and edge-case hunting. The cost of being wrong on any one of these for a
            real trade is much larger than $0.30.
          </li>
          <li>
            <strong>Vs. calling individual free calculators:</strong> Each composite chains 5-15
            calculator calls internally. Doing this loop with the free tier would be ~50-100
            calculator requests, ~50-100 HTTP roundtrips, and the agent would have to compose
            the results itself. The composites do it in 8 calls for ~30 cents.
          </li>
          <li>
            <strong>Vs. another API:</strong> Bloomberg API minimum subscription starts around
            $25K/year and requires a contract. Refinitiv similar. The marginal cost of a quant
            agent loop on QuantOracle is ~30 cents; there is no minimum spend and no contract.
          </li>
        </ul>

        <h2>How to build an agent that runs this flow</h2>
        <p>
          You don&apos;t need any new infrastructure. The full sequence above can be wired into
          any of the four agent frameworks we have tutorials for. The key pattern is:
        </p>

        <pre><code>{`// pseudo-code — frame your agent's tool list with all 8 composites:
const tools = [
  portfolio_health,
  trade_evaluate,
  options_spread_scan,
  pairs_signal,
  risk_full_analysis,
  indicators_regime_classify,
  hedging_recommend,
  portfolio_rebalance_plan,
];

// system prompt — give the agent the decision-loop framing:
const system = \`
You are a quant decision agent. When the user asks you to evaluate a
portfolio action, work through this loop:

1. Assess current state with portfolio_health.
2. Consider candidate trades using trade_evaluate, options_spread_scan,
   pairs_signal — at least two alternatives.
3. Quantify risk with risk_full_analysis on the proposed combined
   portfolio.
4. Classify the current market regime with indicators_regime_classify.
5. Use hedging_recommend to pick a hedge appropriate for the regime
   and the risk profile.
6. Return a concrete rebalance plan via portfolio_rebalance_plan.

Each paid tool call costs $0.015-$0.05 USDC, settled automatically
from your wallet. Don't repeat calls unnecessarily; chain outputs
into the next call's inputs.
\`;`}</code></pre>

        <p>
          Wire that into a Vercel AI SDK <code>generateText</code> loop with tools, an AgentKit
          ActionProvider, or a custom MCP client. The agent will reason through the sequence
          itself — you don&apos;t need to hardcode the order. Framework-specific guides:
        </p>
        <ul>
          <li>
            <Link href="/writing/vercel-ai-sdk-quant-tools" className="text-accent">
              Add to your Vercel AI SDK agent
            </Link>{' '}
            — TypeScript, 5 minutes
          </li>
          <li>
            <Link href="/writing/agentkit-reliable-quant-finance-math" className="text-accent">
              Add to your Coinbase AgentKit agent
            </Link>{' '}
            — Base + Solana wallets, 10 minutes
          </li>
          <li>
            <Link href="/writing/quant-tools-mcp-server" className="text-accent">
              Use from Claude Desktop, Cursor, or any MCP client
            </Link>{' '}
            — config-line install, 60 seconds
          </li>
          <li>
            <Link href="/writing/chaining-x402-paid-tool-calls" className="text-accent">
              The system-prompt pattern for chained paid tool calls
            </Link>{' '}
            — working <code>risk_full_analysis</code> → <code>hedging_recommend</code> demo
          </li>
        </ul>

        <h2>Why this matters more than a single-call demo</h2>
        <p>
          The argument for x402 has always been: AI agents can have a wallet, transact on-chain,
          and access paid APIs without OAuth dances or API keys. That argument is now backed by
          live evidence at meaningful complexity:
        </p>
        <ol>
          <li>
            <strong>A real agent ran a real decision loop</strong> — not a demo, not a test, not
            us. A real wallet spending real USDC.
          </li>
          <li>
            <strong>The agent chained 8 distinct tools in 75 minutes</strong> — this is the
            multi-step pattern, not single-call.
          </li>
          <li>
            <strong>It cost less than a coffee</strong> — $0.285 for a workflow that&apos;s
            equivalent to a junior quant&apos;s afternoon of work.
          </li>
          <li>
            <strong>The customer relationship is entirely on-chain</strong> — no contract, no
            email, no support ticket. The agent and the API negotiated and settled value via
            x402 directly.
          </li>
          <li>
            <strong>The same payer came back 37 days later</strong> — retention exists in a
            zero-relationship channel.
          </li>
        </ol>
        <p>
          If you&apos;re building agents on Base, this is the pattern to aim for. If you&apos;re
          building paid APIs for agents, this is the proof that 402-and-chain-on works at agent
          complexity, not just hello-world.
        </p>

        <h2>Verifiable on-chain</h2>
        <p>
          We don&apos;t need you to take our word for any of this. Every settlement above is a
          real transaction on Base mainnet. Click any <code>tx ↗</code> link in the table and look
          at the <strong>&quot;ERC-20 Tokens Transferred&quot;</strong> row on BaseScan — you&apos;ll
          see <code>{PAYER.slice(0, 8)}…{PAYER.slice(-4)}</code> sending exactly the listed USDC
          amount to our settlement wallet.
        </p>
        <p>
          <strong>One thing that trips people up:</strong> the top-level &quot;From&quot; field on
          each transaction is <em>not</em> the payer — it&apos;s a facilitator/relayer. That&apos;s
          how x402 works: under{' '}
          <a
            href="https://eips.ethereum.org/EIPS/eip-3009"
            target="_blank"
            rel="noopener"
            className="text-accent"
          >
            EIP-3009
          </a>
          {' '}(<code>transferWithAuthorization</code>), the paying agent signs a payment
          authorization off-chain, and a facilitator submits it to the chain and pays the gas. So
          the payer never needs ETH for gas — only USDC. The agent&apos;s wallet is the{' '}
          <em>token sender</em> inside the transfer event, which is the row that actually proves
          who paid. We verified all 8: every one shows{' '}
          <code>{PAYER.slice(0, 8)}…{PAYER.slice(-4)}</code> as the USDC sender.
        </p>
        <p>
          The QuantOracle x402 settlement wallet on Base is{' '}
          <a
            href="https://basescan.org/address/0xC94f5F33ae446a50Ce31157db81253BfddFE2af6"
            target="_blank"
            rel="noopener"
            className="text-accent"
          >
            <code>0xC94f…2af6</code>
          </a>
          {' '}— every paid composite call routes USDC there, and the full settlement history
          is public.
        </p>

        <h2>What we&apos;re going to do with this</h2>
        <p>
          More of it. The pattern works. We&apos;ll keep building composite endpoints that map
          onto the steps a real agent loop needs, and we&apos;ll keep prices in the
          $0.015-$0.05 range so the full decision loop stays well under a dollar. If you&apos;re
          building something in this space and want to compare notes,{' '}
          <Link href="/contact" className="text-accent">
            contact
          </Link>{' '}
          is the front door. Otherwise just wire up an agent — the tools are sitting there.
        </p>
      </article>

      <div className="mt-10">
        <AffiliateCta subId="writing-anatomy-of-a-paying-quant-agent" />
      </div>

      <WritingRelated slug="anatomy-of-a-paying-quant-agent" />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </div>
  );
}
