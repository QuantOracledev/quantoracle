/**
 * Base URL for the QuantOracle API.
 *
 * Override via the QUANTORACLE_API_URL env var or via the plugin
 * constructor's `baseUrl` option if you're proxying through a private
 * gateway or testing against staging.
 */
export const QUANTORACLE_BASE_URL =
  process.env.QUANTORACLE_API_URL ?? "https://api.quantoracle.dev";

/**
 * Free tier: 1,000 calls/IP/day, no signup, no API key required for any
 * of the 63 calculator endpoints. Paid composite endpoints cost
 * $0.04-$0.10 per call settled in USDC on Base or Solana via x402.
 */
export const FREE_TIER_DAILY_LIMIT = 1000;

/**
 * Generic User-Agent so the QuantOracle backend can attribute calls to
 * GOAT-SDK installs in our analytics dashboard.
 */
export const USER_AGENT = "QuantOracle-GOAT/1.0";
