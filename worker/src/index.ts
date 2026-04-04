import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  BACKEND_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// Pricing table — 50% cheaper than LLM token cost
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
};

// Free endpoints
app.get('/health', async (c) => {
  const resp = await fetch(`${c.env.BACKEND_URL}/health`);
  return c.json(await resp.json());
});

app.get('/tools', async (c) => {
  const resp = await fetch(`${c.env.BACKEND_URL}/tools`);
  return c.json(await resp.json());
});

app.get('/metrics', async (c) => {
  const resp = await fetch(`${c.env.BACKEND_URL}/metrics`);
  return c.json(await resp.json());
});

app.get('/docs', async (c) => {
  return c.redirect(`${c.env.BACKEND_URL}/docs`);
});

// Paid endpoints — x402 payment check
app.all('/v1/*', async (c) => {
  const path = new URL(c.req.url).pathname;
  const price = PRICES[path];

  if (price !== undefined) {
    const paymentReceipt = c.req.header('X-Payment-Receipt');
    const paymentAuth = c.req.header('X-Payment-Authorization');
    const apiKey = c.req.header('X-Api-Key');

    // If no payment proof AND no API key, return 402
    if (!paymentReceipt && !paymentAuth && !apiKey) {
      return c.json({
        error: 'payment_required',
        status: 402,
        payment: {
          protocol: 'x402',
          amount: price.toString(),
          currency: 'USDC',
          network: 'base',
          recipient: 'YOUR_WALLET_ADDRESS_HERE',
          description: `QuantOracle: ${path}`,
        },
        alternative: {
          method: 'api_key',
          header: 'X-Api-Key',
          signup: 'https://quantoracle.dev',
        },
      }, 402);
    }

    // TODO: Verify x402 payment receipt on-chain here
  }

  // Proxy to Python backend
  const backendUrl = `${c.env.BACKEND_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': c.req.header('Content-Type') || 'application/json',
  };

  const apiKey = c.req.header('X-Api-Key');
  if (apiKey) headers['X-Api-Key'] = apiKey;

  const resp = await fetch(backendUrl, {
    method: c.req.method,
    headers,
    body: c.req.method !== 'GET' ? await c.req.text() : undefined,
  });

  const data = await resp.json();
  return c.json(data, resp.status as any);
});

export default app;
