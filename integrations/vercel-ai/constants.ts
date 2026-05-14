/**
 * Base URL for the QuantOracle API.
 *
 * Override via the QUANTORACLE_API_URL env var if you're proxying through a
 * private gateway or testing against a staging instance.
 */
export const QUANTORACLE_BASE_URL =
  process.env.QUANTORACLE_API_URL ?? "https://api.quantoracle.dev";

/**
 * Free tier: 1,000 calls/IP/day, no signup, no API key required for any of
 * the 63 calculator endpoints. Paid composite endpoints (full-analysis,
 * hedging, backtest, rebalance) cost $0.04-$0.10 per call settled in USDC
 * on Base or Solana via x402.
 *
 * The plain `quantoracleTools()` factory only wires the free-tier tools.
 * To use the paid composites from a Vercel AI SDK agent, see the
 * `quantoraclePaidTools()` factory in tools.ts — it requires a callback you
 * supply that handles the 402 response by signing an x402 payment header.
 */
export const FREE_TIER_DAILY_LIMIT = 1000;

/**
 * Generic User-Agent so the QuantOracle backend can attribute calls to
 * Vercel AI SDK installs in our analytics dashboard. This is how we know
 * which integration channels are actually driving traffic.
 */
export const USER_AGENT = "QuantOracle-VercelAI/1.0";
