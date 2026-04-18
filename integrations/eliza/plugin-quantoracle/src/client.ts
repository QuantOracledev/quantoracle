/**
 * Shared HTTP client for QuantOracle API calls.
 * Free tier: 1000 calls/IP/day.
 * Paid endpoints return 402 with x402 payment requirements.
 */

import type { IAgentRuntime } from "@elizaos/core";

export interface QuantOracleClientConfig {
  baseUrl?: string;
  timeoutMs?: number;
}

export function getConfig(runtime: IAgentRuntime): QuantOracleClientConfig {
  return {
    baseUrl: runtime.getSetting("QUANTORACLE_API_URL") ?? "https://api.quantoracle.dev",
    timeoutMs: Number(runtime.getSetting("QUANTORACLE_TIMEOUT_MS") ?? 30000),
  };
}

export async function callQuantOracle<T = any>(
  endpoint: string,
  params: Record<string, any>,
  config: QuantOracleClientConfig
): Promise<T> {
  const base = config.baseUrl ?? "https://api.quantoracle.dev";
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs ?? 30000);
  try {
    const resp = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "elizaos-plugin-quantoracle/0.1.0",
        "X-Source": "elizaos",
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    if (resp.status === 402) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(
        `QuantOracle: payment required (${endpoint}). Pay via x402 USDC on Base or Solana. Details: ${JSON.stringify(
          body
        ).slice(0, 200)}`
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
    clearTimeout(timeoutId);
  }
}
