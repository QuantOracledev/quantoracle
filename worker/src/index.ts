import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  BACKEND_URL: string;
  RATE_LIMITS: KVNamespace;
  FREE_DAILY_LIMIT: string; // "1000" — configurable via wrangler.toml
  WALLET_ADDRESS: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.onError((err, c) => {
  return c.json({ error: 'worker_error', detail: err.message }, 500);
});

// ── Pricing table — 50% cheaper than LLM token cost ────────────────────
const PRICES: Record<string, number> = {
  // $0.002 — Simple formulas
  '/v1/stats/zscore': 0.002,
  '/v1/crypto/apy-apr-convert': 0.002,
  '/v1/derivatives/put-call-parity': 0.002,
  '/v1/indicators/fibonacci-retracement': 0.002,
  '/v1/macro/inflation-adjusted': 0.002,
  '/v1/macro/taylor-rule': 0.002,
  '/v1/macro/real-yield': 0.002,
  '/v1/crypto/liquidation-price': 0.002,
  '/v1/indicators/bollinger-bands': 0.002,
  '/v1/indicators/atr': 0.002,
  // $0.005 — Medium computation
  '/v1/options/price': 0.005,
  '/v1/options/implied-vol': 0.005,
  '/v1/risk/kelly': 0.005,
  '/v1/risk/position-size': 0.005,
  '/v1/risk/drawdown': 0.005,
  '/v1/indicators/technical': 0.005,
  '/v1/indicators/crossover': 0.005,
  '/v1/indicators/regime': 0.005,
  '/v1/fx/interest-rate-parity': 0.005,
  '/v1/fx/purchasing-power-parity': 0.005,
  '/v1/fx/forward-rate': 0.005,
  '/v1/fx/carry-trade': 0.005,
  '/v1/crypto/funding-rate': 0.005,
  '/v1/crypto/dex-slippage': 0.005,
  '/v1/crypto/vesting-schedule': 0.005,
  '/v1/crypto/rebalance-threshold': 0.005,
  '/v1/fixed-income/amortization': 0.005,
  '/v1/options/payoff-diagram': 0.005,
  '/v1/crypto/impermanent-loss': 0.005,
  // $0.008 — Complex computation
  '/v1/options/strategy': 0.008,
  '/v1/risk/portfolio': 0.008,
  '/v1/risk/correlation': 0.008,
  '/v1/risk/var-parametric': 0.008,
  '/v1/risk/stress-test': 0.008,
  '/v1/derivatives/binomial-tree': 0.008,
  '/v1/derivatives/barrier-option': 0.008,
  '/v1/derivatives/lookback-option': 0.008,
  '/v1/derivatives/asian-option': 0.008,
  '/v1/stats/hurst-exponent': 0.008,
  '/v1/stats/cointegration': 0.008,
  '/v1/stats/linear-regression': 0.008,
  '/v1/stats/polynomial-regression': 0.008,
  '/v1/stats/distribution-fit': 0.008,
  '/v1/fi/credit-spread': 0.008,
  '/v1/fixed-income/bond': 0.008,
  '/v1/portfolio/risk-parity-weights': 0.008,
  // $0.015 — Heavy optimization
  '/v1/simulate/montecarlo': 0.015,
  '/v1/portfolio/optimize': 0.015,
  '/v1/stats/garch-forecast': 0.015,
  '/v1/derivatives/volatility-surface': 0.015,
  '/v1/derivatives/option-chain-analysis': 0.015,
  '/v1/fi/yield-curve-interpolate': 0.015,
  '/v1/stats/correlation-matrix': 0.015,
  // Backtest support
  '/v1/risk/transaction-cost': 0.005,
  '/v1/stats/probabilistic-sharpe': 0.005,
  // TVM + fundamentals
  '/v1/tvm/present-value': 0.002,
  '/v1/tvm/future-value': 0.002,
  '/v1/tvm/irr': 0.005,
  '/v1/tvm/npv': 0.002,
  '/v1/stats/realized-volatility': 0.005,
  '/v1/stats/normal-distribution': 0.002,
  '/v1/stats/sharpe-ratio': 0.002,
  '/v1/tvm/cagr': 0.002,
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
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
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
  return c.json(await resp.json());
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
  const limit = parseInt(c.env.FREE_DAILY_LIMIT || '1000');
  const count = parseInt((await c.env.RATE_LIMITS.get(key)) || '0');
  return c.json({
    calls_today: count,
    daily_limit: limit,
    remaining: Math.max(0, limit - count),
    resets_at: new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime() + 86400000,
  });
});

// ── Paid endpoints — free tier + x402 ───────────────────────────────────

app.all('/v1/*', async (c) => {
  const path = new URL(c.req.url).pathname;
  const price = PRICES[path];
  const ip = getClientIP(c);
  const limit = parseInt(c.env.FREE_DAILY_LIMIT || '1000');
  const wallet = c.env.WALLET_ADDRESS || 'YOUR_WALLET_ADDRESS_HERE';

  if (price !== undefined) {
    const paymentReceipt = c.req.header('X-Payment-Receipt');
    const paymentAuth = c.req.header('X-Payment-Authorization');

    // If paying with x402, skip free tier check
    const hasPaid = paymentReceipt || paymentAuth;

    if (!hasPaid) {
      // Check free tier allowance
      const key = todayKey(ip);
      const count = parseInt((await c.env.RATE_LIMITS.get(key)) || '0');

      if (count >= limit) {
        // Free tier exhausted — require payment
        return c.json({
          error: 'payment_required',
          status: 402,
          message: `Free tier limit reached (${limit}/day). Attach x402 payment to continue.`,
          usage: {
            calls_today: count,
            daily_limit: limit,
            resets_at: new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime() + 86400000,
          },
          payment: {
            protocol: 'x402',
            amount: price.toString(),
            currency: 'USDC',
            network: 'base',
            recipient: wallet,
            description: `QuantOracle: ${path}`,
          },
        }, 402);
      }

      // Increment counter — TTL 86400s (24 hours) auto-expires the key
      await c.env.RATE_LIMITS.put(key, (count + 1).toString(), { expirationTtl: 86400 });
    }

    // TODO: Verify x402 payment receipt on-chain here
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

  // Add usage headers so agents can track their allowance
  const resHeaders = new Headers();
  resHeaders.set('Content-Type', 'application/json');
  resHeaders.set('X-RateLimit-Limit', limit.toString());
  const key = todayKey(ip);
  const currentCount = parseInt((await c.env.RATE_LIMITS.get(key)) || '0');
  resHeaders.set('X-RateLimit-Remaining', Math.max(0, limit - currentCount).toString());
  resHeaders.set('X-RateLimit-Reset', new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime() + 86400000 + '');

  return new Response(JSON.stringify(data), {
    status: resp.status,
    headers: resHeaders,
  });
});

export default app;
