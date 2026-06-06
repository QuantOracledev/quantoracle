/**
 * QuantOracle API client — shared fetch helper for all Sui agent tools.
 *
 * Free tier: 1,000 calls/IP/day, no auth, no wallet. Works for any agent on
 * any chain — a Sui/Talus agent can call these tools with zero payment setup.
 *
 * Paid: endpoints past the free tier (and the paid-only composites) return
 * HTTP 402 with x402 payment requirements. x402 settles in USDC on Base or
 * Solana today; a Sui agent that wants to pay past the free tier can do so
 * with a Base/Solana wallet via any x402-capable client. Native Sui
 * settlement will be added as the x402-on-Sui rail matures.
 *
 * Docs: https://api.quantoracle.dev/docs
 */

const DEFAULT_BASE_URL = "https://api.quantoracle.dev";

export interface QuantOracleOpts {
  /** Override the API base URL (e.g. for a self-hosted backend). */
  baseUrl?: string;
  /** Abort the request after this many ms. */
  timeoutMs?: number;
}

export async function callQuantOracle<T = any>(
  endpoint: string,
  params: Record<string, any>,
  opts?: QuantOracleOpts
): Promise<T> {
  const base = opts?.baseUrl ?? DEFAULT_BASE_URL;
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const controller = new AbortController();
  const timeoutId = opts?.timeoutMs
    ? setTimeout(() => controller.abort(), opts.timeoutMs)
    : null;

  try {
    const resp = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // X-Source feeds QuantOracle's per-client traffic tracking, so Sui
        // agent usage shows up distinctly in analytics.
        "User-Agent": "sui-agent-kit-quantoracle/0.1.0",
        "X-Source": "sui-agent-kit",
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    if (resp.status === 402) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(
        `QuantOracle: payment required (${endpoint}). Free tier exhausted or paid-only ` +
          `endpoint. Route through an x402-capable client to pay. Details: ` +
          `${JSON.stringify(body).slice(0, 200)}`
      );
    }
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(
        `QuantOracle ${endpoint} failed (${resp.status}): ${body.slice(0, 300)}`
      );
    }
    return (await resp.json()) as T;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
