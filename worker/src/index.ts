import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { paymentMiddleware, x402ResourceServer } from '@x402/hono';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { ExactSvmScheme } from '@x402/svm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { createFacilitatorConfig } from '@coinbase/x402';
import { declareDiscoveryExtension, bazaarResourceServerExtension } from '@x402/extensions/bazaar';

interface Env {
  BACKEND_URL: string;
  RATE_LIMITS: KVNamespace;
  FREE_DAILY_LIMIT: string;
  WALLET_ADDRESS: string;
  SOLANA_WALLET_ADDRESS: string;
  CDP_API_KEY_ID: string;
  CDP_API_KEY_SECRET: string;
  ADMIN_KEY: string;
  OWNER_KEY: string;
  INTERNAL_SETTLEMENT_KEY?: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.onError((err, c) => {
  return c.json({
    error: 'worker_error',
    detail: err.message,
    cause: (err as any).cause?.message || String((err as any).cause || ''),
    stack: err.stack?.split('\n').slice(0, 5).join(' | ')
  }, 500);
});


// ── Pricing table — 50% cheaper than LLM token cost ────────────────────
const PRICES: Record<string, string> = {
  // $0.002 — Simple formulas
  '/v1/stats/zscore': '$0.002',
  '/v1/crypto/apy-apr-convert': '$0.002',
  '/v1/derivatives/put-call-parity': '$0.002',
  '/v1/indicators/fibonacci-retracement': '$0.002',
  '/v1/macro/inflation-adjusted': '$0.002',
  '/v1/macro/taylor-rule': '$0.002',
  '/v1/macro/real-yield': '$0.002',
  '/v1/crypto/liquidation-price': '$0.002',
  '/v1/indicators/bollinger-bands': '$0.002',
  '/v1/indicators/atr': '$0.002',
  '/v1/tvm/present-value': '$0.002',
  '/v1/tvm/future-value': '$0.002',
  '/v1/tvm/npv': '$0.002',
  '/v1/tvm/cagr': '$0.002',
  '/v1/stats/normal-distribution': '$0.002',
  '/v1/stats/sharpe-ratio': '$0.002',
  // $0.005 — Medium computation
  '/v1/options/price': '$0.005',
  '/v1/options/implied-vol': '$0.005',
  '/v1/risk/kelly': '$0.005',
  '/v1/risk/position-size': '$0.005',
  '/v1/risk/drawdown': '$0.005',
  '/v1/indicators/technical': '$0.005',
  '/v1/indicators/crossover': '$0.005',
  '/v1/indicators/regime': '$0.005',
  '/v1/fx/interest-rate-parity': '$0.005',
  '/v1/fx/purchasing-power-parity': '$0.005',
  '/v1/fx/forward-rate': '$0.005',
  '/v1/fx/carry-trade': '$0.005',
  '/v1/crypto/funding-rate': '$0.005',
  '/v1/crypto/dex-slippage': '$0.005',
  '/v1/crypto/vesting-schedule': '$0.005',
  '/v1/crypto/rebalance-threshold': '$0.005',
  '/v1/fixed-income/amortization': '$0.005',
  '/v1/options/payoff-diagram': '$0.005',
  '/v1/crypto/impermanent-loss': '$0.005',
  '/v1/risk/transaction-cost': '$0.005',
  '/v1/stats/probabilistic-sharpe': '$0.005',
  '/v1/tvm/irr': '$0.005',
  '/v1/stats/realized-volatility': '$0.005',
  // $0.008 — Complex computation
  '/v1/options/strategy': '$0.008',
  '/v1/risk/portfolio': '$0.008',
  '/v1/risk/correlation': '$0.008',
  '/v1/risk/var-parametric': '$0.008',
  '/v1/risk/stress-test': '$0.008',
  '/v1/derivatives/binomial-tree': '$0.008',
  '/v1/derivatives/barrier-option': '$0.008',
  '/v1/derivatives/lookback-option': '$0.008',
  '/v1/derivatives/asian-option': '$0.008',
  '/v1/stats/hurst-exponent': '$0.008',
  '/v1/stats/cointegration': '$0.008',
  '/v1/stats/linear-regression': '$0.008',
  '/v1/stats/polynomial-regression': '$0.008',
  '/v1/stats/distribution-fit': '$0.008',
  '/v1/fi/credit-spread': '$0.008',
  '/v1/fixed-income/bond': '$0.008',
  '/v1/portfolio/risk-parity-weights': '$0.008',
  // $0.015 — Heavy optimization
  '/v1/simulate/montecarlo': '$0.015',
  '/v1/portfolio/optimize': '$0.015',
  '/v1/stats/garch-forecast': '$0.015',
  '/v1/derivatives/volatility-surface': '$0.015',
  '/v1/derivatives/option-chain-analysis': '$0.015',
  '/v1/fi/yield-curve-interpolate': '$0.015',
  '/v1/stats/correlation-matrix': '$0.015',
  // Composites
  '/v1/options/spread-scan': '$0.05',
  '/v1/indicators/regime-classify': '$0.015',
  '/v1/risk/full-analysis': '$0.04',
  '/v1/trade/evaluate': '$0.025',
  '/v1/portfolio/health': '$0.04',
  '/v1/pairs/signal': '$0.025',
  '/v1/backtest/strategy': '$0.10',
  '/v1/portfolio/rebalance-plan': '$0.05',
  '/v1/options/strategy-optimizer': '$0.08',
  '/v1/hedging/recommend': '$0.04',
  // Live data — paid revenue tier (fresh market data + compute). Not part of
  // the 1,000/day free calculator tier; gated by a 20/day free allowance instead.
  '/v1/live/volatility': '$0.01',
  '/v1/live/funding-rates': '$0.005',
};

// ── Helpers ─────────────────────────────────────────────────────────────

function getClientIP(c: any): string {
  return (
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Real-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function todayKey(ip: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `calls:${ip}:${date}`;
}

// Live-data tier: 20 free calls/IP/day — enough to evaluate thoroughly, while
// any real production cadence crosses into paying. Separate from the 1,000/day
// calculator free tier; production usage pays via x402.
const LIVE_FREE_DAILY = 20;
function liveTrialKey(ip: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `live-trial:${ip}:${date}`;
}

// ── x402 discovery endpoint ────────────────────────────────────────────

// USDC contract addresses
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_SOLANA = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SOLANA_MAINNET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

// Cache resourceServer globally so feePayer stays stable across initial 402 and verify
// (CDP rotates feePayer on each getSupported() call, breaking deepEqual match)
let _cachedResourceServer: any = null;
async function getResourceServer(env: Env) {
  if (_cachedResourceServer) return _cachedResourceServer;
  const facilitatorConfig = createFacilitatorConfig(env.CDP_API_KEY_ID, env.CDP_API_KEY_SECRET);
  const facilitatorClient = new HTTPFacilitatorClient(facilitatorConfig);
  const rs = new x402ResourceServer(facilitatorClient)
    .register('eip155:8453', new ExactEvmScheme())
    .register(SOLANA_MAINNET, new ExactSvmScheme())
    .registerExtension(bazaarResourceServerExtension);
  await rs.initialize();
  _cachedResourceServer = rs;
  return rs;
}

// ── CDP Bazaar discovery: outputSchema generation ──────────────────────
// Coinbase's x402 Bazaar (api.cdp.coinbase.com/platform/v2/x402/discovery/resources)
// indexes resources whose 402 responses advertise an `outputSchema` with
// `discoverable: true`. Bazaar is the largest x402 directory (~15k resources)
// so inclusion is high-value.
//
// We derive the schema for each endpoint from the backend's OpenAPI spec,
// cached at the Worker-instance level so it's a single fetch on cold start.
let _cachedOpenApi: any = null;
const _cachedSchemas = new Map<string, any>();
const FETCHING_OPENAPI: { promise: Promise<any> | null } = { promise: null };

async function loadOpenApi(env: Env): Promise<any> {
  if (_cachedOpenApi) return _cachedOpenApi;
  if (FETCHING_OPENAPI.promise) return FETCHING_OPENAPI.promise;
  FETCHING_OPENAPI.promise = (async () => {
    try {
      const r = await fetch(`${env.BACKEND_URL}/openapi.json`);
      if (!r.ok) return null;
      _cachedOpenApi = await r.json();
      return _cachedOpenApi;
    } catch { return null; }
    finally { FETCHING_OPENAPI.promise = null; }
  })();
  return FETCHING_OPENAPI.promise;
}

function resolveRef(spec: any, ref: string): any {
  if (!ref || !ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/');
  let cur = spec;
  for (const p of parts) {
    if (!cur) return null;
    cur = cur[p];
  }
  return cur;
}

function fieldTypeFromSchema(s: any, spec: any): string {
  if (!s) return 'string';
  if (s.$ref) {
    const r = resolveRef(spec, s.$ref);
    return r?.type || 'object';
  }
  if (s.type) {
    if (s.type === 'array') return 'array';
    return s.type;
  }
  if (s.anyOf || s.oneOf) {
    const opts = (s.anyOf || s.oneOf).filter((x: any) => x.type && x.type !== 'null');
    if (opts.length) return opts[0].type;
  }
  return 'string';
}

// Fully resolve $refs in an OpenAPI schema object so we can embed it as a
// standalone JSON Schema inside the bazaar extension. The CDP Bazaar has no
// access to our `#/components/schemas/...` refs, so refs must be inlined.
function deepResolveSchema(spec: any, obj: any, visited: Set<string> = new Set()): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(x => deepResolveSchema(spec, x, visited));
  if (obj.$ref && typeof obj.$ref === 'string') {
    if (visited.has(obj.$ref)) return {};
    const next = resolveRef(spec, obj.$ref);
    const v = new Set(visited);
    v.add(obj.$ref);
    return deepResolveSchema(spec, next, v);
  }
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = deepResolveSchema(spec, v, visited);
  }
  return out;
}

// Synthesize a minimum valid JSON value that satisfies a JSON Schema. The CDP
// Bazaar facilitator validates `info` against `schema` before cataloging
// (spec: coinbase/x402 specs/extensions/bazaar.md line 319). If info.input.body
// is `{}` but the schema has `required` fields, validation fails silently and
// the resource is NOT cataloged — this was our exact bug.
function synthesizeFromSchema(s: any): any {
  if (!s || typeof s !== 'object') return null;
  if (s.default !== undefined) return s.default;
  if (Array.isArray(s.enum) && s.enum.length > 0) return s.enum[0];
  if (s.const !== undefined) return s.const;
  if (s.anyOf || s.oneOf) {
    const opts = (s.anyOf || s.oneOf).filter((x: any) => x?.type !== 'null');
    return opts.length ? synthesizeFromSchema(opts[0]) : null;
  }
  const t = Array.isArray(s.type) ? s.type.find((x: string) => x !== 'null') : s.type;
  switch (t) {
    case 'string': return s.format === 'date-time' ? '2025-01-01T00:00:00Z' : 'x';
    case 'number':
    case 'integer': {
      const min = s.exclusiveMinimum !== undefined ? s.exclusiveMinimum + 1 : (s.minimum ?? 1);
      return t === 'integer' ? Math.max(1, Math.ceil(min)) : Math.max(0.01, min);
    }
    case 'boolean': return false;
    case 'array': {
      const minItems = s.minItems ?? 1;
      const out: any[] = [];
      for (let i = 0; i < minItems; i++) out.push(synthesizeFromSchema(s.items) ?? 0);
      return out;
    }
    case 'object':
    default: {
      const out: any = {};
      const props = s.properties || {};
      const required = s.required || [];
      for (const name of required) {
        if (props[name]) out[name] = synthesizeFromSchema(props[name]);
      }
      return out;
    }
  }
}

// Build a Bazaar DiscoveryExtension for a given endpoint by converting our
// OpenAPI schema into the JSON Schema format the extension expects. Cached per
// path because building the resolved schemas isn't free.
const _cachedBazaarExt = new Map<string, any>();
async function buildBazaarExt(path: string, env: Env): Promise<Record<string, any> | null> {
  if (_cachedBazaarExt.has(path)) return _cachedBazaarExt.get(path);
  const spec = await loadOpenApi(env);
  if (!spec) return null;
  const ep = spec.paths?.[path]?.post;
  if (!ep) return null;

  let inputSchema: any = null;
  let inputExample: any = null;
  const reqBody = ep.requestBody?.content?.['application/json']?.schema;
  if (reqBody) {
    inputSchema = deepResolveSchema(spec, reqBody);
    // Generate a minimal valid example so info.input.body validates against
    // the schema. Required for Bazaar cataloging.
    inputExample = synthesizeFromSchema(inputSchema);
  }

  let outputSchemaDef: any = null;
  const respContent =
    ep.responses?.['200']?.content?.['application/json']?.schema ||
    ep.responses?.['201']?.content?.['application/json']?.schema;
  if (respContent) {
    outputSchemaDef = deepResolveSchema(spec, respContent);
  }

  try {
    const ext = declareDiscoveryExtension({
      bodyType: 'json',
      method: 'POST',
      ...(inputSchema ? { inputSchema } : {}),
      ...(inputExample ? { input: inputExample } : {}),
      ...(outputSchemaDef ? { output: { schema: outputSchemaDef } } : {}),
    });
    _cachedBazaarExt.set(path, ext);
    return ext;
  } catch (e: any) {
    console.log('[bazaar] buildBazaarExt err path=' + path + ' msg=' + e.message);
    return null;
  }
}

// Attach the CDP Bazaar extension to a manual 402 payment-required object.
// Mirrors what the x402 middleware does automatically for middleware-gated
// routes, so probes/manual 402s advertise the same extensions.bazaar as
// middleware-generated 402s — single source of truth on what Bazaar sees.
async function attachBazaarExt(paymentRequired: any, path: string, env: Env): Promise<any> {
  const ext = await buildBazaarExt(path, env);
  if (ext) paymentRequired.extensions = ext;
  return paymentRequired;
}

async function getOutputSchema(path: string, env: Env): Promise<any | null> {
  if (_cachedSchemas.has(path)) return _cachedSchemas.get(path);
  const spec = await loadOpenApi(env);
  if (!spec) return null;

  const ep = spec.paths?.[path]?.post;
  if (!ep) return null;

  const reqBody = ep.requestBody?.content?.['application/json']?.schema;
  let bodySchema: any = reqBody;
  if (reqBody?.$ref) bodySchema = resolveRef(spec, reqBody.$ref) || {};

  const props = bodySchema?.properties || {};
  const required = new Set(bodySchema?.required || []);
  const bodyFields: Record<string, any> = {};
  for (const [name, def] of Object.entries(props)) {
    const d: any = def;
    const desc = d.description || d.title || '';
    bodyFields[name] = {
      type: fieldTypeFromSchema(d, spec),
      description: typeof desc === 'string' ? desc.slice(0, 200) : '',
      required: required.has(name),
    };
  }

  const summary: string = ep.summary || ep.description || `QuantOracle ${path.replace('/v1/', '')}`;
  const schema = {
    input: {
      discoverable: true,
      method: 'POST',
      type: 'http',
      bodyFields,
    },
    output: {
      response: {
        type: 'object',
        description: typeof summary === 'string' ? summary.slice(0, 200) : '',
      },
    },
  };
  _cachedSchemas.set(path, schema);
  return schema;
}

app.get('/.well-known/x402', async (c) => {
  const wallet = c.env.WALLET_ADDRESS;
  const solanaWallet = c.env.SOLANA_WALLET_ADDRESS;
  // Preload OpenAPI once so parallel schema lookups are cheap
  await loadOpenApi(c.env);
  const resources = await Promise.all(Object.entries(PRICES).map(async ([path, price]) => {
    const atomicUsdc = String(Math.round(parseFloat(price.replace('$', '')) * 1_000_000));
    const outputSchema = await getOutputSchema(path, c.env);
    const baseAccept: any = {
      scheme: 'exact',
      network: 'eip155:8453',
      amount: atomicUsdc,
      asset: USDC_BASE,
      payTo: wallet,
      maxTimeoutSeconds: 30,
      extra: { name: 'USD Coin', version: '2' },
    };
    const solAccept: any = solanaWallet ? {
      scheme: 'exact',
      network: SOLANA_MAINNET,
      amount: atomicUsdc,
      asset: USDC_SOLANA,
      payTo: solanaWallet,
      maxTimeoutSeconds: 30,
    } : null;
    if (outputSchema) {
      baseAccept.outputSchema = outputSchema;
      if (solAccept) solAccept.outputSchema = outputSchema;
    }
    return {
      url: `https://api.quantoracle.dev${path}`,
      method: 'POST',
      description: `QuantOracle: ${path.replace('/v1/', '')}`,
      mimeType: 'application/json',
      accepts: [baseAccept, ...(solAccept ? [solAccept] : [])],
    };
  }));

  const discovery = {
    x402Version: 2,
    name: 'QuantOracle',
    description: '63 deterministic quant finance tools for AI agents. Options, risk, portfolio, Monte Carlo, stats, crypto, FX, macro, TVM.',
    homepage: 'https://quantoracle.dev',
    logo: 'https://raw.githubusercontent.com/QuantOracledev/quantoracle/main/quantoraclelogo.png',
    freeTier: '1,000 calls/IP/day, no API key',
    resources,
  };

  return c.json(discovery, 200);
});

// ── ai-plugin.json (ChatGPT plugin spec, served for crawlers) ──────────

const AI_PLUGIN_MANIFEST = {
  schema_version: 'v1',
  name_for_human: 'QuantOracle',
  name_for_model: 'quantoracle',
  description_for_human:
    '63 deterministic quant calculators + 10 composite workflows (backtest, rebalance, strategy-optimizer, hedging, full analysis, pairs signal, etc.). Options pricing, derivatives, risk metrics, portfolio optimization, statistics, crypto/DeFi, macro/FX, TVM. 1,000 free calls/day. x402 payments on Base or Solana.',
  description_for_model:
    'QuantOracle provides 63 pure mathematical calculators + 10 paid composite workflows for quantitative finance. Calculators cover: Black-Scholes option prices and Greeks, implied volatility, exotic derivatives (barrier, Asian, lookback), portfolio risk metrics (Sharpe, Sortino, VaR, CVaR, drawdown), Kelly Criterion, position sizing, technical indicators (RSI, MACD, Bollinger Bands), Monte Carlo simulations, bond pricing and duration, yield curve interpolation, portfolio optimization, statistical tests (regression, cointegration, Hurst exponent, GARCH), crypto calculations (impermanent loss, liquidation price, funding rates, DEX slippage), FX models (interest rate parity, PPP, carry trade), macro tools (Taylor Rule, Fisher equation), and time value of money (PV, FV, IRR, NPV, CAGR). Composite workflows (paid-only): /v1/backtest/strategy, /v1/portfolio/rebalance-plan, /v1/options/strategy-optimizer, /v1/hedging/recommend, /v1/risk/full-analysis, /v1/trade/evaluate, /v1/portfolio/health, /v1/pairs/signal, /v1/options/spread-scan, /v1/indicators/regime-classify. Batch endpoint bundles up to 100 calculator calls per request. All endpoints are deterministic, require no API key for the first 1,000 calls/day, and return results in under 70ms. Paid tier uses x402 micropayments in USDC on Base (eip155:8453) or Solana (solana:5eykt4...) -- every 402 response advertises both. Send JSON, get JSON.',
  auth: { type: 'none' },
  api: { type: 'openapi', url: 'https://api.quantoracle.dev/openapi.json' },
  logo_url: 'https://raw.githubusercontent.com/QuantOracledev/quantoracle/main/quantoraclelogo.png',
  contact_email: 'hello@quantoracle.dev',
  legal_info_url: 'https://quantoracle.dev/terms',
};

app.get('/.well-known/ai-plugin.json', (c) => c.json(AI_PLUGIN_MANIFEST, 200));

// ── A2A / AGNTCY agent-card.json (agent-to-agent discovery) ─────────────
// Served at both `/.well-known/agent.json` and `/.well-known/agent-card.json`.
// Schema follows the Linux Foundation AGNTCY / Google A2A v0.2 AgentCard so
// agent-discovery crawlers (LangGraph, AGNTCY directory, Microsoft AutoGen,
// IBM watsonx Orchestrate) can ingest QuantOracle as a callable agent.

function categorize(path: string): string {
  const seg = path.split('/')[2] || 'misc';
  return seg.replace(/-/g, '_');
}

function isComposite(path: string): boolean {
  return [
    '/v1/options/spread-scan',
    '/v1/indicators/regime-classify',
    '/v1/risk/full-analysis',
    '/v1/trade/evaluate',
    '/v1/portfolio/health',
    '/v1/pairs/signal',
    '/v1/backtest/strategy',
    '/v1/portfolio/rebalance-plan',
    '/v1/options/strategy-optimizer',
    '/v1/hedging/recommend',
  ].includes(path);
}

const COMPOSITE_EXAMPLES: Record<string, string> = {
  '/v1/risk/full-analysis': 'Compute full risk profile (Sharpe, Sortino, VaR, CVaR, drawdown, Kelly) for a return series in one call.',
  '/v1/portfolio/rebalance-plan': 'Generate a rebalance plan with trade-cost aware suggestions for a multi-asset portfolio.',
  '/v1/options/strategy-optimizer': 'Find the highest-expected-value option strategy across spreads, straddles, condors given a market view.',
  '/v1/hedging/recommend': 'Rank hedge structures (collar, protective put, inverse, partial put) by cost and downside protection.',
  '/v1/backtest/strategy': 'Run a vectorized backtest with entry/exit rules and return Sharpe, max drawdown, equity curve.',
  '/v1/trade/evaluate': 'Evaluate a single trade idea — risk, sizing, expected return, breakeven probability.',
  '/v1/portfolio/health': 'Score a portfolio on diversification, concentration risk, and rebalancing urgency.',
  '/v1/pairs/signal': 'Detect cointegrated pairs and generate mean-reversion entry/exit signals.',
  '/v1/options/spread-scan': 'Scan an option chain for highest-EV vertical spreads given vol assumptions.',
  '/v1/indicators/regime-classify': 'Classify the current market regime (trending up, trending down, mean-reverting, high-vol).',
};

function buildAgentCard() {
  const skills = Object.keys(PRICES).map((path) => {
    const id = path.replace(/^\/v1\//, '').replace(/\//g, '_').replace(/-/g, '_');
    const name = path.replace(/^\/v1\//, '');
    const tags = [categorize(path), isComposite(path) ? 'composite' : 'calculator'];
    const description = isComposite(path)
      ? (COMPOSITE_EXAMPLES[path] || `Composite quant workflow: ${name}.`)
      : `Deterministic quant calculator: ${name}. Pure math, no API key for first 1,000 calls/day.`;
    const skill: any = {
      id,
      name,
      description,
      tags,
      inputModes: ['application/json'],
      outputModes: ['application/json'],
      endpoint: `https://api.quantoracle.dev${path}`,
      pricing: { amount: PRICES[path], currency: 'USDC', model: 'per-call' },
    };
    if (isComposite(path) && COMPOSITE_EXAMPLES[path]) {
      skill.examples = [COMPOSITE_EXAMPLES[path]];
    }
    return skill;
  });

  return {
    schemaVersion: '0.2',
    name: 'QuantOracle',
    description:
      '63 deterministic quant calculators + 10 composite workflows for autonomous financial agents. Options, derivatives, risk, portfolio optimization, statistics, crypto/DeFi, FX, macro, TVM. Pay-per-call USDC on Base or Solana via x402.',
    url: 'https://api.quantoracle.dev',
    documentationUrl: 'https://github.com/QuantOracledev/quantoracle',
    provider: {
      organization: 'QuantOracle',
      url: 'https://quantoracle.dev',
    },
    version: '2.2.0',
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    defaultInputModes: ['application/json'],
    defaultOutputModes: ['application/json'],
    authentication: {
      schemes: ['none', 'x402'],
      details:
        'Free tier: 1,000 calls/IP/day, no API key. Paid tier: x402 micropayments in USDC on Base (eip155:8453) or Solana (solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp).',
    },
    skills,
    discovery: {
      x402: 'https://api.quantoracle.dev/.well-known/x402',
      openapi: 'https://api.quantoracle.dev/openapi.json',
      aiPlugin: 'https://api.quantoracle.dev/.well-known/ai-plugin.json',
      mcp: 'https://registry.modelcontextprotocol.io/v0/servers?search=quantoracle',
    },
  };
}

app.get('/.well-known/agent.json', (c) => c.json(buildAgentCard(), 200));
app.get('/.well-known/agent-card.json', (c) => c.json(buildAgentCard(), 200));

// ── Free endpoints ──────────────────────────────────────────────────────

app.get('/health', async (c) => {
  try {
    const url = `${c.env.BACKEND_URL}/health`;
    const resp = await fetch(url);
    const text = await resp.text();
    try { return c.json(JSON.parse(text)); } catch { return c.text(text); }
  } catch (e: any) {
    return c.json({ error: 'backend_unreachable', detail: e.message, backend: c.env.BACKEND_URL }, 502);
  }
});

app.get('/tools', async (c) => {
  const resp = await fetch(`${c.env.BACKEND_URL}/tools`);
  return c.json(await resp.json());
});

app.get('/metrics', async (c) => {
  const resp = await fetch(`${c.env.BACKEND_URL}/metrics`);
  const data = await resp.json() as any;

  // Clarify that backend "revenue" is hypothetical (all calls priced, not settled)
  if (data.revenue !== undefined) {
    data.hypothetical_revenue = data.revenue;
    data.settled_revenue = 0; // No on-chain settlement tracking yet
    data.note = 'hypothetical_revenue = total calls * price. settled_revenue = actual x402 USDC payments received.';
    delete data.revenue;
  }

  return c.json(data);
});

app.get('/openapi.json', async (c) => {
  const resp = await fetch(`${c.env.BACKEND_URL}/openapi.json`);
  return c.json(await resp.json());
});

app.get('/docs', async (c) => {
  return c.redirect(`${c.env.BACKEND_URL}/docs`);
});

// ── Usage check endpoint ────────────────────────────────────────────────

app.get('/usage', async (c) => {
  const ip = getClientIP(c);
  const key = todayKey(ip);
  const limit = parseInt(c.env.FREE_DAILY_LIMIT ?? '1000');
  const count = parseInt((await c.env.RATE_LIMITS.get(key)) || '0');
  return c.json({
    calls_today: count,
    daily_limit: limit,
    remaining: Math.max(0, limit - count),
    resets_at: new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime() + 86400000,
  });
});

// ── Admin endpoints (protected by ADMIN_KEY) ───────────────────────────

function requireAdmin(c: any): Response | null {
  const key = c.req.header('X-Admin-Key') || new URL(c.req.url).searchParams.get('key');
  if (!c.env.ADMIN_KEY || key !== c.env.ADMIN_KEY) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  return null;
}

// List all callers today with call counts, sorted by usage
app.get('/admin/callers', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const today = new Date().toISOString().slice(0, 10);
  const limit = parseInt(c.env.FREE_DAILY_LIMIT ?? '1000');
  const prefix = `calls:`;

  // Paginate through all KV keys
  const callers: { ip: string; calls: number; remaining: number; at_limit: boolean }[] = [];
  let cursor: string | undefined;

  do {
    const list: KVNamespaceListResult<unknown, string> = await c.env.RATE_LIMITS.list({
      prefix,
      cursor,
    });

    for (const key of list.keys) {
      // Only include today's keys: calls:IP:2026-04-07
      if (!key.name.endsWith(`:${today}`)) continue;

      const ip = key.name.replace(prefix, '').replace(`:${today}`, '');
      const count = parseInt((await c.env.RATE_LIMITS.get(key.name)) || '0');
      if (count === 0) continue;

      callers.push({
        ip,
        calls: count,
        remaining: Math.max(0, limit - count),
        at_limit: count >= limit,
      });
    }

    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  // Sort by calls descending
  callers.sort((a, b) => b.calls - a.calls);

  const totalCalls = callers.reduce((sum, c) => sum + c.calls, 0);
  const atLimit = callers.filter(c => c.at_limit);
  const heavyUsers = callers.filter(c => c.calls >= limit * 0.5);

  return c.json({
    date: today,
    daily_limit: limit,
    summary: {
      unique_ips: callers.length,
      total_calls: totalCalls,
      at_limit: atLimit.length,
      heavy_users: heavyUsers.length,
      avg_calls_per_ip: callers.length > 0 ? Math.round(totalCalls / callers.length) : 0,
    },
    callers,
  });
});

// Dashboard summary: backend metrics + caller stats combined
app.get('/admin/dashboard', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const today = new Date().toISOString().slice(0, 10);
  const limit = parseInt(c.env.FREE_DAILY_LIMIT ?? '1000');

  // Fetch backend metrics
  let backendMetrics: any = {};
  try {
    const resp = await fetch(`${c.env.BACKEND_URL}/metrics`);
    backendMetrics = await resp.json();
  } catch {}

  // Fetch backend health
  let health: any = {};
  try {
    const resp = await fetch(`${c.env.BACKEND_URL}/health`);
    health = await resp.json();
  } catch {}

  // Count today's callers from KV
  const prefix = `calls:`;
  let uniqueIPs = 0;
  let totalCallsToday = 0;
  let atLimit = 0;
  let topCaller = { ip: '', calls: 0 };
  let cursor: string | undefined;

  do {
    const list: KVNamespaceListResult<unknown, string> = await c.env.RATE_LIMITS.list({
      prefix,
      cursor,
    });

    for (const key of list.keys) {
      if (!key.name.endsWith(`:${today}`)) continue;
      const ip = key.name.replace(prefix, '').replace(`:${today}`, '');
      const count = parseInt((await c.env.RATE_LIMITS.get(key.name)) || '0');
      if (count === 0) continue;

      uniqueIPs++;
      totalCallsToday += count;
      if (count >= limit) atLimit++;
      if (count > topCaller.calls) topCaller = { ip, calls: count };
    }

    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  return c.json({
    timestamp: new Date().toISOString(),
    date: today,
    backend: {
      status: health.status || 'unknown',
      uptime: health.uptime || 'unknown',
      version: health.version || 'unknown',
      total_calls_since_boot: backendMetrics.calls || 0,
      by_endpoint: backendMetrics.by_endpoint || {},
      hypothetical_revenue: backendMetrics.revenue || 0,
    },
    today: {
      unique_ips: uniqueIPs,
      total_calls: totalCallsToday,
      at_limit: atLimit,
      top_caller: topCaller.calls > 0 ? topCaller : null,
      daily_limit: limit,
    },
  });
});

// ── Batch endpoint — paid only (1 free per day) ───────────────────────

app.post('/v1/batch', async (c, next) => {
  const ip = getClientIP(c);
  const wallet = c.env.WALLET_ADDRESS;

  // Empty body probe (x402 scanners) — return 402
  let rawBody = '';
  try { rawBody = await c.req.text(); } catch {}
  const isEmpty = !rawBody || rawBody.trim() === '' || rawBody.trim() === '{}';
  if (isEmpty) {
    const paymentRequired = {
      x402Version: 2,
      error: 'Payment required',
      resource: {
        url: 'https://api.quantoracle.dev/v1/batch',
        description: 'QuantOracle: batch computation',
        mimeType: 'application/json',
      },
      accepts: (() => {
        const a: any[] = [{
          scheme: 'exact',
          network: 'eip155:8453',
          amount: '5000',
          asset: USDC_BASE,
          payTo: wallet,
          maxTimeoutSeconds: 30,
          extra: { name: 'USD Coin', version: '2' },
        }];
        if (c.env.SOLANA_WALLET_ADDRESS) {
          a.push({
            scheme: 'exact',
            network: SOLANA_MAINNET,
            amount: '5000',
            asset: USDC_SOLANA,
            payTo: c.env.SOLANA_WALLET_ADDRESS,
            maxTimeoutSeconds: 30,
          });
        }
        return a;
      })(),
    };
    await attachBazaarExt(paymentRequired, '/v1/batch', c.env);
    return c.json(paymentRequired, 402, {
      'PAYMENT-REQUIRED': btoa(JSON.stringify(paymentRequired)),
    });
  }

  // Owner key — unlimited
  const apiKey = c.req.header('X-Api-Key');
  if (apiKey && c.env.OWNER_KEY && apiKey === c.env.OWNER_KEY) {
    const resp = await fetch(`${c.env.BACKEND_URL}/v1/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip, 'X-Real-IP': ip, 'CF-Connecting-IP': ip,
        'User-Agent': c.req.header('User-Agent') || '',
        'X-Source': c.req.header('X-Source') || '',
        'X-MCP-Client': c.req.header('X-MCP-Client') || '',
      },
      body: rawBody,
    });
    return c.json(await resp.json() as any, resp.status as any);
  }

  // Parse body to compute dynamic price
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const requests = body.requests;
  if (!Array.isArray(requests) || requests.length === 0 || requests.length > 100) {
    return c.json({ error: 'batch must contain 1-100 requests' }, 400);
  }

  // Sum individual endpoint prices
  let totalPrice = 0;
  for (const r of requests) {
    const ep = `/v1/${(r.endpoint || '').replace(/^\/+/, '')}`;
    const p = PRICES[ep];
    if (!p) return c.json({ error: `unknown endpoint: ${r.endpoint}` }, 400);
    totalPrice += parseFloat(p.replace('$', ''));
  }

  const hasPayment = c.req.header('PAYMENT-SIGNATURE') || c.req.header('X-Payment');
  const forcePayment = c.req.header('X-Force-Pay') === '1' || c.req.header('X-Force-Pay') === 'true';

  // Free tier: 1 free batch ever per IP (trial) — consumed before the middleware branch below
  const batchKey = `batch-trial:${ip}`;
  const batchCount = parseInt((await c.env.RATE_LIMITS.get(batchKey)) || '0');

  // Route through middleware if: payment already attached, free trial exhausted, or explicit force-pay
  if (hasPayment || batchCount >= 1 || forcePayment) {
    const resourceServer = await getResourceServer(c.env);
    const batchBazaarExt = await buildBazaarExt('/v1/batch', c.env);

    const batchAccepts: any[] = [
      {
        scheme: 'exact',
        network: 'eip155:8453' as const,
        payTo: wallet,
        price: `$${totalPrice.toFixed(4)}`,
      },
    ];
    if (c.env.SOLANA_WALLET_ADDRESS) {
      batchAccepts.push({
        scheme: 'exact',
        network: SOLANA_MAINNET,
        payTo: c.env.SOLANA_WALLET_ADDRESS,
        price: `$${totalPrice.toFixed(4)}`,
      });
    }

    const routes: any = {
      'POST /v1/batch': {
        accepts: batchAccepts,
        description: 'QuantOracle: batch computation',
        mimeType: 'application/json',
        ...(batchBazaarExt ? { extensions: batchBazaarExt } : {}),
      },
    };

    // Custom next: after payment verification, proxy to backend and set c.res
    const customNext = async () => {
      const resp = await fetch(`${c.env.BACKEND_URL}/v1/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': ip, 'X-Real-IP': ip, 'CF-Connecting-IP': ip,
          'User-Agent': c.req.header('User-Agent') || '',
          'X-Source': c.req.header('X-Source') || '',
          'X-MCP-Client': c.req.header('X-MCP-Client') || '',
        },
        body: rawBody,
      });
      const data = await resp.json();
      c.res = new Response(JSON.stringify(data), {
        status: resp.status,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const middleware = paymentMiddleware(routes, resourceServer, undefined, undefined, false);
    return middleware(c, customNext);
  }

  // Free batch trial — mark as used (no expiry)
  await c.env.RATE_LIMITS.put(batchKey, '1');

  const resp = await fetch(`${c.env.BACKEND_URL}/v1/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': ip, 'X-Real-IP': ip, 'CF-Connecting-IP': ip,
      'User-Agent': c.req.header('User-Agent') || '',
      'X-Source': c.req.header('X-Source') || '',
        'X-MCP-Client': c.req.header('X-MCP-Client') || '',
    },
    body: JSON.stringify(body),
  });

  return c.json(await resp.json() as any, resp.status as any);
});

// ── x402 payment middleware for /v1/* routes ────────────────────────────

app.all('/v1/*', async (c, next) => {
  const path = new URL(c.req.url).pathname;
  const price = PRICES[path];
  const ip = getClientIP(c);
  const limit = parseInt(c.env.FREE_DAILY_LIMIT ?? '1000');
  const wallet = c.env.WALLET_ADDRESS;

  // Owner API key — unlimited access, skip rate limiting and payment
  const apiKey = c.req.header('X-Api-Key');
  if (apiKey && c.env.OWNER_KEY && apiKey === c.env.OWNER_KEY) {
    const backendUrl = `${c.env.BACKEND_URL}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': c.req.header('Content-Type') || 'application/json',
      'X-Forwarded-For': ip,
      'X-Real-IP': ip,
      'CF-Connecting-IP': ip,
      'User-Agent': c.req.header('User-Agent') || '',
      'X-Source': c.req.header('X-Source') || '',
        'X-MCP-Client': c.req.header('X-MCP-Client') || '',
    };
    const resp = await fetch(backendUrl, {
      method: c.req.method,
      headers,
      body: c.req.method !== 'GET' ? await c.req.text() : undefined,
    });
    const data = await resp.json();
    return c.json(data as any, resp.status as any);
  }

  // Empty body probe (x402 scanners) — return 402 with payment requirements
  if (c.req.method === 'POST' && price) {
    let bodyText = '';
    try { bodyText = await c.req.text(); } catch {}
    const isEmpty = !bodyText || bodyText.trim() === '' || bodyText.trim() === '{}';
    if (isEmpty) {
      const atomicUsdc = String(Math.round(parseFloat(price.replace('$', '')) * 1_000_000));
      const outputSchema = await getOutputSchema(path, c.env);
      const baseAcc: any = {
        scheme: 'exact',
        network: 'eip155:8453',
        amount: atomicUsdc,
        asset: USDC_BASE,
        payTo: wallet,
        maxTimeoutSeconds: 30,
        extra: { name: 'USD Coin', version: '2' },
      };
      if (outputSchema) baseAcc.outputSchema = outputSchema;
      const accepts: any[] = [baseAcc];
      if (c.env.SOLANA_WALLET_ADDRESS) {
        const sol: any = {
          scheme: 'exact',
          network: SOLANA_MAINNET,
          amount: atomicUsdc,
          asset: USDC_SOLANA,
          payTo: c.env.SOLANA_WALLET_ADDRESS,
          maxTimeoutSeconds: 30,
        };
        if (outputSchema) sol.outputSchema = outputSchema;
        accepts.push(sol);
      }
      const paymentRequired = {
        x402Version: 2,
        error: 'Payment required',
        resource: {
          url: `https://api.quantoracle.dev${path}`,
          description: `QuantOracle: ${path.replace('/v1/', '')}`,
          mimeType: 'application/json',
        },
        accepts,
      };
      await attachBazaarExt(paymentRequired, path, c.env);
      return c.json(paymentRequired, 402, {
        'PAYMENT-REQUIRED': btoa(JSON.stringify(paymentRequired)),
      });
    }
    // Stash body for later use since we already consumed the stream
    (c as any)._bodyText = bodyText;
  }

  // Composite endpoints are paid-only — no free tier
  const PAID_ONLY = new Set([
    '/v1/options/spread-scan',
    '/v1/indicators/regime-classify',
    '/v1/risk/full-analysis',
    '/v1/trade/evaluate',
    '/v1/portfolio/health',
    '/v1/pairs/signal',
    '/v1/backtest/strategy',
    '/v1/portfolio/rebalance-plan',
    '/v1/options/strategy-optimizer',
    '/v1/hedging/recommend',
  ]);

  // Check if this request has an x402 payment signature
  const hasPayment = c.req.header('PAYMENT-SIGNATURE') || c.req.header('X-Payment') || c.req.header('x-payment');

  // X-Force-Pay: opt-in header to bypass free tier. Used for CDP Bazaar
  // seeding — a caller that wants payment to go through (so the facilitator
  // sees the bazaar extension and catalogs the resource) sends this header.
  const forcePayment = c.req.header('X-Force-Pay') === '1' || c.req.header('X-Force-Pay') === 'true';

  // For paid endpoints (PAID_ONLY always, or free-tier exhausted, or explicit opt-in) — run through
  // payment middleware so the 402 response format and verification use the same payment requirements
  const shouldPaymentGate = (PAID_ONLY.has(path) && price) || (hasPayment && price) || (forcePayment && price);

  if (shouldPaymentGate) {
    const resourceServer = await getResourceServer(c.env);
    const bazaarExt = await buildBazaarExt(path, c.env);
    console.log('[bazaar] path=' + path + ' bazaarExt=' + (bazaarExt ? 'declared' : 'null'));

    const accepts: any[] = [
      {
        scheme: 'exact',
        network: 'eip155:8453' as const,
        payTo: wallet,
        price,
      },
    ];
    if (c.env.SOLANA_WALLET_ADDRESS) {
      accepts.push({
        scheme: 'exact',
        network: SOLANA_MAINNET,
        payTo: c.env.SOLANA_WALLET_ADDRESS,
        price,
      });
    }

    const routes: any = {
      [`POST ${path}`]: {
        accepts,
        description: `QuantOracle: ${path}`,
        mimeType: 'application/json',
        ...(bazaarExt ? { extensions: bazaarExt } : {}),
      },
    };

    // Custom next: after payment verification, proxy to backend and set c.res
    const customNext = async () => {
      const backendUrl = `${c.env.BACKEND_URL}${path}`;
      const bodyText = (c as any)._bodyText || await c.req.text();
      const resp = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': ip,
          'X-Real-IP': ip,
          'CF-Connecting-IP': ip,
          'User-Agent': c.req.header('User-Agent') || '',
          'X-Source': c.req.header('X-Source') || '',
        'X-MCP-Client': c.req.header('X-MCP-Client') || '',
        },
        body: bodyText,
      });
      const data = await resp.json();
      c.res = new Response(JSON.stringify(data), {
        status: resp.status,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const middleware = paymentMiddleware(routes, resourceServer, undefined, undefined, false);
    try {
      let result = await middleware(c, customNext);
      const responseStatus = (result as any)?.status ?? c.res?.status;

      try {
        if (responseStatus && responseStatus >= 200 && responseStatus < 300 && hasPayment) {
          const signed = JSON.parse(atob(hasPayment as string));
          const amt = Number(signed?.accepted?.amount ?? 0) / 1_000_000;
          const network = signed?.accepted?.network || 'unknown';
          const payer = signed?.payload?.authorization?.from
            ?? signed?.payload?.from
            ?? signed?.payload?.signer
            ?? null;
          let txHash: string | null = null;
          try {
            const hdr = c.res?.headers;
            const pr = hdr?.get?.('payment-response') || hdr?.get?.('PAYMENT-RESPONSE');
            if (pr) {
              const settle = JSON.parse(atob(pr));
              txHash = settle?.transaction ?? settle?.transactionHash ?? settle?.tx_hash ?? null;
            }
          } catch {}
          // Fire-and-forget POST to backend /internal/settlement — doesn't block user response
          c.executionCtx.waitUntil(
            fetch(`${c.env.BACKEND_URL}/internal/settlement`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Internal-Key': (c.env as any).INTERNAL_SETTLEMENT_KEY || '',
              },
              body: JSON.stringify({
                endpoint: path,
                amount_usdc: amt,
                network,
                tx_hash: txHash,
                payer,
                source: c.req.header('X-Source') || 'x402',
              }),
            }).catch((e) => console.log('[settle] record err: ' + e.message))
          );
        }
      } catch (e: any) {
        console.log('[settle] post-settle hook error: ' + e.message);
      }
      return result;
    } catch (e: any) {
      console.log('[pay] middleware error: ' + e.message + ' cause=' + (e.cause?.message || String(e.cause || '')));
      return c.json({ error: 'payment_verify_failed', detail: e.message, cause: e.cause?.message || String(e.cause || '') }, 402);
    }
  }

  // No payment — check free tier. Live-data endpoints use their own daily
  // allowance (LIVE_FREE_DAILY) instead of the 1,000/day calculator quota.
  if (price !== undefined) {
    const isLive = path.startsWith('/v1/live/');
    const key = isLive ? liveTrialKey(ip) : todayKey(ip);
    const effLimit = isLive ? LIVE_FREE_DAILY : limit;
    const count = parseInt((await c.env.RATE_LIMITS.get(key)) || '0');

    if (count >= effLimit) {
      // Free tier exhausted — return x402 payment required
      const atomicUsdc = String(Math.round(parseFloat(price.replace('$', '')) * 1_000_000));
      const outputSchema = await getOutputSchema(path, c.env);
      const baseAcc: any = {
        scheme: 'exact',
        network: 'eip155:8453',
        amount: atomicUsdc,
        asset: USDC_BASE,
        payTo: wallet,
        maxTimeoutSeconds: 30,
        extra: { name: 'USD Coin', version: '2' },
      };
      if (outputSchema) baseAcc.outputSchema = outputSchema;
      const accepts: any[] = [baseAcc];
      if (c.env.SOLANA_WALLET_ADDRESS) {
        const sol: any = {
          scheme: 'exact',
          network: SOLANA_MAINNET,
          amount: atomicUsdc,
          asset: USDC_SOLANA,
          payTo: c.env.SOLANA_WALLET_ADDRESS,
          maxTimeoutSeconds: 30,
        };
        if (outputSchema) sol.outputSchema = outputSchema;
        accepts.push(sol);
      }
      const paymentRequired = {
        x402Version: 2,
        error: 'Payment required',
        resource: {
          url: `https://api.quantoracle.dev${path}`,
          description: `QuantOracle: ${path}`,
          mimeType: 'application/json',
        },
        accepts,
      };
      await attachBazaarExt(paymentRequired, path, c.env);

      return c.json(paymentRequired, 402, {
        'PAYMENT-REQUIRED': btoa(JSON.stringify(paymentRequired)),
      });
    }

    // Increment counter
    await c.env.RATE_LIMITS.put(key, (count + 1).toString(), { expirationTtl: 86400 });
  }

  // Proxy to Python backend (forward real client IP)
  const backendUrl = `${c.env.BACKEND_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': c.req.header('Content-Type') || 'application/json',
    'X-Forwarded-For': ip,
    'X-Real-IP': ip,
    'CF-Connecting-IP': ip,
    'User-Agent': c.req.header('User-Agent') || '',
    'X-Source': c.req.header('X-Source') || '',
        'X-MCP-Client': c.req.header('X-MCP-Client') || '',
  };

  const resp = await fetch(backendUrl, {
    method: c.req.method,
    headers,
    body: c.req.method !== 'GET' ? ((c as any)._bodyText || await c.req.text()) : undefined,
  });

  const data = await resp.json();

  const resHeaders = new Headers();
  resHeaders.set('Content-Type', 'application/json');
  resHeaders.set('X-RateLimit-Limit', limit.toString());
  const key = todayKey(ip);
  const currentCount = parseInt((await c.env.RATE_LIMITS.get(key)) || '0');
  resHeaders.set('X-RateLimit-Remaining', Math.max(0, limit - currentCount).toString());

  return new Response(JSON.stringify(data), {
    status: resp.status,
    headers: resHeaders,
  });
});

export default app;
