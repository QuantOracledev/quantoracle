/**
 * QuantOracle API client — shared fetch helper for all actions.
 *
 * Free tier: 1000 calls/IP/day, no auth.
 * Paid: returns 402 with x402 payment requirements (not auto-handled here —
 * agents should route through an x402-capable client if they want to pay
 * past the free tier).
 *
 * Docs: https://api.quantoracle.dev/docs
 */

const DEFAULT_BASE_URL = "https://api.quantoracle.dev";

export async function callQuantOracle<T = any>(
  endpoint: string,
  params: Record<string, any>,
  opts?: { baseUrl?: string; timeoutMs?: number }
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
        "User-Agent": "solana-agent-kit-quantoracle/1.0.0",
        "X-Source": "solana-agent-kit",
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    if (resp.status === 402) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(
        `QuantOracle: payment required (${endpoint}). Free tier exhausted. ` +
          `Details: ${JSON.stringify(body).slice(0, 200)}`
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
