/**
 * Base URL for the QuantOracle API.
 *
 * Override via the QUANTORACLE_API_URL env var if you're proxying through a
 * private gateway or testing against a staging instance.
 */
export const QUANTORACLE_BASE_URL =
  process.env.QUANTORACLE_API_URL ?? "https://api.quantoracle.dev";

/**
 * Free tier: 1,000 calls/IP/day, no signup, no API key.
 *
 * Paid composite endpoints (full-analysis, hedging, backtest, rebalance) cost
 * $0.04-$0.10 per call settled in USDC on Base or Solana via the x402
 * protocol. AgentKit's wallet pays automatically — your agent doesn't need
 * to handle billing logic.
 */
export const FREE_TIER_DAILY_LIMIT = 1000;

/**
 * Generic User-Agent so the QuantOracle backend can attribute calls and we
 * can show AgentKit usage in our analytics dashboard.
 */
export const USER_AGENT = "QuantOracle-AgentKit/1.0";
