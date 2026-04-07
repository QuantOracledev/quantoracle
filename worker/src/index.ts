import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { paymentMiddleware, x402ResourceServer } from '@x402/hono';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { createFacilitatorConfig } from '@coinbase/x402';

interface Env {
  BACKEND_URL: string;
  RATE_LIMITS: KVNamespace;
  FREE_DAILY_LIMIT: string;
  WALLET_ADDRESS: string;
  CDP_API_KEY_ID: string;
  CDP_API_KEY_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.onError((err, c) => {
  return c.json({ error: 'worker_error', detail: err.message }, 500);
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

// ── x402 payment middleware for /v1/* routes ────────────────────────────

app.all('/v1/*', async (c, next) => {
  const path = new URL(c.req.url).pathname;
  const price = PRICES[path];
  const ip = getClientIP(c);
  const limit = parseInt(c.env.FREE_DAILY_LIMIT ?? '1000');
  const wallet = c.env.WALLET_ADDRESS;

  // Check if this request has an x402 payment signature
  const hasPayment = c.req.header('PAYMENT-SIGNATURE') || c.req.header('X-Payment');

  if (hasPayment && price) {
    // Verify and settle payment via CDP facilitator
    const facilitatorConfig = createFacilitatorConfig(
      c.env.CDP_API_KEY_ID,
      c.env.CDP_API_KEY_SECRET,
    );
    const facilitatorClient = new HTTPFacilitatorClient(facilitatorConfig);
    const resourceServer = new x402ResourceServer(facilitatorClient)
      .register('eip155:8453', new ExactEvmScheme());

    const routes = {
      [`POST ${path}`]: {
        accepts: [{
          scheme: 'exact',
          network: 'eip155:8453' as const,
          payTo: wallet,
          price,
        }],
        description: `QuantOracle: ${path}`,
        mimeType: 'application/json',
      },
    };

    const middleware = paymentMiddleware(routes, resourceServer, undefined, undefined, false);
    return middleware(c, next);
  }

  // No payment — check free tier
  if (price !== undefined) {
    const key = todayKey(ip);
    const count = parseInt((await c.env.RATE_LIMITS.get(key)) || '0');

    if (count >= limit) {
      // Free tier exhausted — return x402 payment required
      const paymentRequired = {
        x402Version: 2,
        error: 'Payment required',
        resource: {
          url: `https://api.quantoracle.dev${path}`,
          description: `QuantOracle: ${path}`,
          mimeType: 'application/json',
        },
        accepts: [{
          scheme: 'exact',
          network: 'eip155:8453',
          amount: String(parseFloat(price.replace('$', '')) * 1_000_000),
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          payTo: wallet,
          maxTimeoutSeconds: 30,
        }],
      };

      return c.json(paymentRequired, 402, {
        'PAYMENT-REQUIRED': btoa(JSON.stringify(paymentRequired)),
      });
    }

    // Increment counter
    await c.env.RATE_LIMITS.put(key, (count + 1).toString(), { expirationTtl: 86400 });
  }

  // Proxy to Python backend
  const backendUrl = `${c.env.BACKEND_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': c.req.header('Content-Type') || 'application/json',
  };

  const resp = await fetch(backendUrl, {
    method: c.req.method,
    headers,
    body: c.req.method !== 'GET' ? await c.req.text() : undefined,
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
