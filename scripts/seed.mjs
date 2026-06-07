/**
 * CDP Bazaar cataloging seed — shells out to AgentCash for payments.
 *
 * For each paid endpoint, posts a minimal valid body with X-Force-Pay: 1
 * (server-side opt-in that bypasses free tier so every call goes through
 * the x402 middleware, which attaches the bazaar extension the facilitator
 * reads for cataloging).
 *
 * Usage:   node seed.mjs
 * Cost:    ~$0.85 USDC on Base (facilitator pays gas).
 */
import { spawnSync } from 'node:child_process';

const API = 'https://api.quantoracle.dev';
const NETWORK = 'base';
const TIMEOUT_MS = 120_000;

const RETURNS = [0.01,-0.005,0.008,-0.012,0.015,0.003,-0.007,0.011,-0.002,0.006,-0.009,0.013,-0.004,0.007,0.002,-0.008,0.01,-0.003,0.009,-0.006];
const RETURNS_B = [0.012,-0.008,0.01,-0.015,0.018,-0.005,0.009,-0.01,0.007,-0.004,0.011,-0.007,0.005,-0.009,0.013,-0.006,0.008,-0.004,0.01,-0.005];
const PRICES_30 = Array.from({length: 40}, (_, i) => 180 + i * 0.5);
const HIGH_30 = PRICES_30.map(p => p + 2);
const LOW_30 = PRICES_30.map(p => p - 2);

const BODIES = {
  '/v1/options/price': { S: 100, K: 105, T: 0.25, sigma: 0.2, r: 0.05, type: 'call' },
  '/v1/options/implied-vol': { S: 100, K: 100, T: 0.25, market_price: 5.0, type: 'call' },
  '/v1/options/strategy': { legs: [{ type: 'call', K: 100, premium: 5.0, quantity: 1 }] },
  '/v1/options/payoff-diagram': { legs: [{ type: 'call', strike: 100, premium: 5.0, quantity: 1 }], spot: 100 },
  '/v1/options/spread-scan': { spot: 580, vol: 0.18, dte_years: 0.096, strategy: 'bull_call_spread', num_candidates: 8 },
  '/v1/options/strategy-optimizer': { S: 100, outlook: 'bullish', vol_view: 'stable', T: 0.25, sigma: 0.2 },
  '/v1/risk/portfolio': { returns: RETURNS },
  '/v1/risk/kelly': { mode: 'discrete', win_rate: 0.55, avg_win: 1.5, avg_loss: 1.0 },
  '/v1/risk/position-size': { account_size: 100000, entry_price: 50, stop_loss: 47 },
  '/v1/risk/drawdown': { equity_curve: [100,105,103,110,108,115,112,120] },
  '/v1/risk/correlation': { series: { SPY: RETURNS, QQQ: RETURNS_B } },
  '/v1/risk/var-parametric': { returns: RETURNS },
  '/v1/risk/stress-test': { positions: [{ asset: 'SPY', value: 50000, beta: 1.0 }], scenarios: [{ name: 'crash', market_shock_pct: -20 }] },
  '/v1/risk/transaction-cost': { trade_value: 10000, shares: 100, spread_bps: 5 },
  '/v1/risk/full-analysis': { returns: RETURNS },
  '/v1/indicators/technical': { prices: PRICES_30 },
  '/v1/indicators/regime': { prices: PRICES_30 },
  '/v1/indicators/crossover': { prices: PRICES_30, fast: 5, slow: 15 },
  '/v1/indicators/bollinger-bands': { prices: PRICES_30, window: 10, num_std: 2 },
  '/v1/indicators/fibonacci-retracement': { swing_high: 150, swing_low: 100 },
  '/v1/indicators/atr': { high: HIGH_30, low: LOW_30, close: PRICES_30, period: 14 },
  '/v1/indicators/regime-classify': { closes: PRICES_30 },
  '/v1/simulate/montecarlo': { initial_value: 100000, annual_return: 0.10, annual_vol: 0.20, years: 1, simulations: 100 },
  '/v1/fixed-income/bond': { coupon_rate: 0.05, ytm: 0.04, years: 10, face: 1000, frequency: 2 },
  '/v1/fixed-income/amortization': { principal: 300000, annual_rate: 0.065, years: 30 },
  '/v1/fi/yield-curve-interpolate': { tenors: [0.25,0.5,1,2,5,10,30], rates: [0.04,0.042,0.045,0.043,0.04,0.042,0.045], target_tenors: [3,7,20] },
  '/v1/fi/credit-spread': { bond_price: 950, coupon_rate: 0.05, maturity_years: 5, risk_free_curve: [{ tenor: 1, rate: 0.04 },{ tenor: 5, rate: 0.042 },{ tenor: 10, rate: 0.045 }] },
  '/v1/portfolio/optimize': { returns: { SPY: RETURNS, TLT: RETURNS_B, GLD: RETURNS.map(r => r * 0.5) } },
  '/v1/portfolio/risk-parity-weights': { volatilities: [0.15,0.10,0.20], correlation_matrix: [[1,0.3,0.1],[0.3,1,-0.2],[0.1,-0.2,1]] },
  '/v1/portfolio/health': { holdings: [
    { asset: 'SPY', value: 60000, target_weight: 50, returns: RETURNS, beta: 1.0 },
    { asset: 'TLT', value: 30000, target_weight: 30, returns: RETURNS_B, beta: 0.1, duration: 7 },
    { asset: 'GLD', value: 10000, target_weight: 20, returns: RETURNS.map(r => r * 0.5), beta: 0.2 },
  ] },
  '/v1/portfolio/rebalance-plan': { current_holdings: { BTC: 60000, ETH: 30000, USDC: 10000 }, target_weights: { BTC: 0.5, ETH: 0.3, USDC: 0.2 } },
  '/v1/derivatives/binomial-tree': { S: 100, K: 105, T: 0.25, sigma: 0.2, steps: 50 },
  '/v1/derivatives/barrier-option': { S: 100, K: 105, H: 90, T: 0.5, sigma: 0.25, barrier_type: 'down-out' },
  '/v1/derivatives/asian-option': { S: 100, K: 100, T: 0.5, sigma: 0.2, observations: 12 },
  '/v1/derivatives/lookback-option': { S: 100, T: 0.5, sigma: 0.25, lookback_type: 'floating', type: 'call' },
  '/v1/derivatives/option-chain-analysis': { chain: [
    { strike: 90, call_bid: 12, call_ask: 13, put_bid: 0.5, put_ask: 0.8, call_oi: 1000, put_oi: 500, call_volume: 200, put_volume: 100 },
    { strike: 100, call_bid: 5, call_ask: 6, put_bid: 3, put_ask: 4, call_oi: 2000, put_oi: 1500, call_volume: 500, put_volume: 400 },
    { strike: 110, call_bid: 1, call_ask: 1.5, put_bid: 9, put_ask: 10, call_oi: 800, put_oi: 2000, call_volume: 150, put_volume: 600 },
  ], spot: 100, T: 0.0833 },
  '/v1/derivatives/put-call-parity': { call_price: 10, put_price: 5, S: 100, K: 95, T: 0.25, r: 0.05 },
  '/v1/derivatives/volatility-surface': { market_data: [
    { strike: 90, expiry_days: 30, implied_vol: 0.25 },
    { strike: 100, expiry_days: 30, implied_vol: 0.20 },
    { strike: 110, expiry_days: 30, implied_vol: 0.22 },
    { strike: 90, expiry_days: 60, implied_vol: 0.24 },
    { strike: 100, expiry_days: 60, implied_vol: 0.19 },
    { strike: 110, expiry_days: 60, implied_vol: 0.21 },
  ], spot: 100 },
  '/v1/stats/linear-regression': { x: RETURNS.map((_, i) => i + 1), y: RETURNS },
  '/v1/stats/polynomial-regression': { x: RETURNS.map((_, i) => i + 1), y: RETURNS, degree: 2 },
  '/v1/stats/cointegration': { series_x: PRICES_30, series_y: PRICES_30.map(p => p * 1.1 + 5) },
  '/v1/stats/hurst-exponent': { series: RETURNS },
  '/v1/stats/garch-forecast': { returns: RETURNS },
  '/v1/stats/zscore': { series: RETURNS },
  '/v1/stats/distribution-fit': { data: RETURNS },
  '/v1/stats/correlation-matrix': { series: { A: RETURNS, B: RETURNS_B } },
  '/v1/stats/probabilistic-sharpe': { returns: RETURNS },
  '/v1/stats/realized-volatility': { close: PRICES_30 },
  '/v1/stats/normal-distribution': { x: 1.96, mean: 0, std: 1 },
  '/v1/stats/sharpe-ratio': { returns: RETURNS },
  '/v1/crypto/impermanent-loss': { current_price_ratio: 1.5 },
  '/v1/crypto/apy-apr-convert': { rate: 0.12, from_type: 'apr', compounding: 'daily' },
  '/v1/crypto/liquidation-price': { entry_price: 3000, collateral: 1000, position_size: 10000, leverage: 10, direction: 'long' },
  '/v1/crypto/funding-rate': { funding_rates: [{ rate: 0.0001 },{ rate: 0.0003 },{ rate: -0.0001 },{ rate: 0.0002 },{ rate: 0.0001 },{ rate: 0.0004 }] },
  '/v1/crypto/dex-slippage': { reserve_a: 1000000, reserve_b: 1000000, trade_amount: 10000 },
  '/v1/crypto/vesting-schedule': { total_tokens: 1000000, tge_pct: 10, cliff_months: 6, vesting_months: 24 },
  '/v1/crypto/rebalance-threshold': { holdings: [
    { asset: 'BTC', current_value: 60000, target_weight: 0.5 },
    { asset: 'ETH', current_value: 30000, target_weight: 0.3 },
    { asset: 'USDC', current_value: 10000, target_weight: 0.2 },
  ] },
  '/v1/fx/interest-rate-parity': { spot_rate: 1.10, domestic_rate: 0.05, foreign_rate: 0.03 },
  '/v1/fx/purchasing-power-parity': { base_spot_rate: 1.10, domestic_inflation: 0.03, foreign_inflation: 0.02 },
  '/v1/fx/forward-rate': { yield_curve: [{ tenor_years: 1, spot_rate: 0.04 },{ tenor_years: 2, spot_rate: 0.045 },{ tenor_years: 5, spot_rate: 0.05 }], forward_start: 1, forward_end: 2 },
  '/v1/fx/carry-trade': { borrow_currency_rate: 0.01, invest_currency_rate: 0.05, spot_entry: 110, spot_exit: 108, holding_period_days: 90 },
  '/v1/macro/inflation-adjusted': { nominal_return_pct: 8, inflation_rate_pct: 3 },
  '/v1/macro/taylor-rule': { current_inflation: 3.5, output_gap_pct: 1.0 },
  '/v1/macro/real-yield': { nominal_yield: 4.5, tips_yield: 2.0 },
  '/v1/tvm/present-value': { rate: 0.05, periods: 10, future_value: 1000 },
  '/v1/tvm/future-value': { rate: 0.05, periods: 10, present_value: 1000 },
  '/v1/tvm/irr': { cash_flows: [-1000,200,300,400,500] },
  '/v1/tvm/npv': { cash_flows: [200,300,400,500], discount_rate: 0.10 },
  '/v1/tvm/cagr': { start_value: 1000, end_value: 1500, years: 5 },
  '/v1/trade/evaluate': { entry_price: 185, stop_loss: 178, take_profit: 200, account_size: 80000, prices: PRICES_30 },
  '/v1/pairs/signal': { series_a: PRICES_30, series_b: PRICES_30.map(p => p * 2 + 5), name_a: 'AAPL', name_b: 'MSFT' },
  '/v1/backtest/strategy': { prices: PRICES_30, strategy: 'sma_crossover', params: { fast: 5, slow: 20 }, initial_capital: 10000 },
  '/v1/hedging/recommend': { position_type: 'long_stock', position_value: 100000, asset_price: 185, volatility: 0.25, time_horizon_days: 30 },
  '/v1/batch': { requests: [{ endpoint: 'stats/zscore', params: { series: [10, 12, 14, 11, 13, 15] } }] },
  '/v1/live/volatility': { asset: 'BTC' },
  '/v1/live/funding-rates': { asset: 'BTC' },
};

const paths = Object.keys(BODIES);
console.log(`Seeding ${paths.length} endpoints via AgentCash on ${NETWORK}…\n`);

let ok = 0, paid = 0, failed = 0, totalUsd = 0;
const failures = [];

for (let i = 0; i < paths.length; i++) {
  const path = paths[i];
  const body = BODIES[path];
  const bodyStr = JSON.stringify(body);

  // Windows cmd escaping: inner double-quotes in JSON → \"
  const bodyEsc = bodyStr.replace(/"/g, '\\"');
  const cmd = [
    'npx agentcash@latest fetch',
    `${API}${path}`,
    '-m POST',
    `-b "${bodyEsc}"`,
    '-H "X-Force-Pay: 1"',
    '-H "X-Source: bazaar-seed"',
    `--payment-network ${NETWORK}`,
    `--timeout ${TIMEOUT_MS}`,
    '--format json',
  ].join(' ');

  const t0 = Date.now();
  const res = spawnSync(cmd, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, shell: true });
  const elapsed = Date.now() - t0;
  const out = res.stdout || '';
  const err = res.stderr || '';

  let parsed;
  try { parsed = JSON.parse(out); } catch { parsed = null; }

  const meta = parsed?.metadata;
  const tx = meta?.payment?.transactionHash;
  const price = meta?.price;
  const paidOk = !!meta?.payment?.success;
  const httpOk = parsed && parsed.success !== false;

  const label = `[${String(i+1).padStart(2)}/${paths.length}]`;
  if (httpOk) {
    ok++;
    if (paidOk) {
      paid++;
      if (price) totalUsd += parseFloat(price.replace('$', ''));
      console.log(`  ${label} PAID ${price || ''}  ${path}  ${elapsed}ms  tx=${tx?.slice(0, 16) || '?'}…`);
    } else {
      console.log(`  ${label} FREE       ${path}  ${elapsed}ms`);
    }
  } else {
    failed++;
    const errMsg = parsed?.error?.message || err.slice(0, 120) || 'unknown';
    console.log(`  ${label} FAIL       ${path}  ${errMsg.slice(0, 100)}`);
    failures.push({ path, err: errMsg });
  }
}

console.log(`\n${'='.repeat(70)}`);
console.log(`Total: ${ok} ok (${paid} paid, ~$${totalUsd.toFixed(3)} USDC), ${failed} failed`);
if (failures.length) {
  console.log(`\nFailures:`);
  for (const f of failures) console.log(`  ${f.path}  —  ${f.err}`);
}
