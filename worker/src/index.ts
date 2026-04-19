import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { paymentMiddleware, x402ResourceServer } from '@x402/hono';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { ExactSvmScheme } from '@x402/svm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { createFacilitatorConfig } from '@coinbase/x402';

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
    .register(SOLANA_MAINNET, new ExactSvmScheme());
  await rs.initialize();
  _cachedResourceServer = rs;
  return rs;
}

app.get('/.well-known/x402', (c) => {
  const wallet = c.env.WALLET_ADDRESS;
  const solanaWallet = c.env.SOLANA_WALLET_ADDRESS;
  const resources = Object.entries(PRICES).map(([path, price]) => {
    const atomicUsdc = String(Math.round(parseFloat(price.replace('$', '')) * 1_000_000));
    return {
      url: `https://api.quantoracle.dev${path}`,
      method: 'POST',
      description: `QuantOracle: ${path.replace('/v1/', '')}`,
      mimeType: 'application/json',
      accepts: [
        {
          scheme: 'exact',
          network: 'eip155:8453',
          amount: atomicUsdc,
          asset: USDC_BASE,
          payTo: wallet,
          maxTimeoutSeconds: 30,
          extra: { name: 'USD Coin', version: '2' },
        },
        ...(solanaWallet ? [{
          scheme: 'exact',
          network: SOLANA_MAINNET,
          amount: atomicUsdc,
          asset: USDC_SOLANA,
          payTo: solanaWallet,
          maxTimeoutSeconds: 30,
        }] : []),
      ],
    };
  });

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

  if (hasPayment) {
    const resourceServer = await getResourceServer(c.env);

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

    const routes = {
      'POST /v1/batch': {
        accepts: batchAccepts,
        description: 'QuantOracle: batch computation',
        mimeType: 'application/json',
      },
    };

    const middleware = paymentMiddleware(routes, resourceServer, undefined, undefined, false);
    return middleware(c, next);
  }

  // Free tier: 1 free batch ever per IP (trial)
  const batchKey = `batch-trial:${ip}`;
  const batchCount = parseInt((await c.env.RATE_LIMITS.get(batchKey)) || '0');

  if (batchCount >= 1) {
    // Return 402 with dynamic price
    const paymentRequired = {
      x402Version: 2,
      error: 'Payment required',
      resource: {
        url: 'https://api.quantoracle.dev/v1/batch',
        description: 'QuantOracle: batch computation',
        mimeType: 'application/json',
      },
      accepts: [{
        scheme: 'exact',
        network: 'eip155:8453',
        amount: String(Math.round(totalPrice * 1_000_000)),
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        payTo: wallet,
        maxTimeoutSeconds: 30,
          extra: { name: "USD Coin", version: "2" },
        }],
    };
    return c.json(paymentRequired, 402, {
      'PAYMENT-REQUIRED': btoa(JSON.stringify(paymentRequired)),
    });
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
      const accepts: any[] = [{
        scheme: 'exact',
        network: 'eip155:8453',
        amount: atomicUsdc,
        asset: USDC_BASE,
        payTo: wallet,
        maxTimeoutSeconds: 30,
        extra: { name: 'USD Coin', version: '2' },
      }];
      if (c.env.SOLANA_WALLET_ADDRESS) {
        accepts.push({
          scheme: 'exact',
          network: SOLANA_MAINNET,
          amount: atomicUsdc,
          asset: USDC_SOLANA,
          payTo: c.env.SOLANA_WALLET_ADDRESS,
          maxTimeoutSeconds: 30,
        });
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

  // For paid endpoints (PAID_ONLY always, or free-tier exhausted) — run through payment middleware
  // so the 402 response format and verification use the same payment requirements
  const shouldPaymentGate = (PAID_ONLY.has(path) && price) || (hasPayment && price);

  if (shouldPaymentGate) {
    const resourceServer = await getResourceServer(c.env);

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

    const routes = {
      [`POST ${path}`]: {
        accepts,
        description: `QuantOracle: ${path}`,
        mimeType: 'application/json',
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
      const result = await middleware(c, customNext);
      // If the payment settled successfully (2xx response), record it to backend metrics.
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

  // No payment — check free tier
  if (price !== undefined) {
    const key = todayKey(ip);
    const count = parseInt((await c.env.RATE_LIMITS.get(key)) || '0');

    if (count >= limit) {
      // Free tier exhausted — return x402 payment required
      const atomicUsdc = String(Math.round(parseFloat(price.replace('$', '')) * 1_000_000));
      const accepts: any[] = [{
        scheme: 'exact',
        network: 'eip155:8453',
        amount: atomicUsdc,
        asset: USDC_BASE,
        payTo: wallet,
        maxTimeoutSeconds: 30,
        extra: { name: 'USD Coin', version: '2' },
      }];
      if (c.env.SOLANA_WALLET_ADDRESS) {
        accepts.push({
          scheme: 'exact',
          network: SOLANA_MAINNET,
          amount: atomicUsdc,
          asset: USDC_SOLANA,
          payTo: c.env.SOLANA_WALLET_ADDRESS,
          maxTimeoutSeconds: 30,
        });
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
