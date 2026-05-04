// Server-side wrapper around api.quantoracle.dev.
// All calculator pages call this from server components so the browser
// never makes a CORS request and the backend sees a single trusted origin.

const API_BASE = process.env.NEXT_PUBLIC_QUANTORACLE_API ?? 'https://api.quantoracle.dev';
const DEFAULT_TIMEOUT_MS = 8_000;

export interface ApiError {
  status: number;
  message: string;
  detail?: unknown;
}

/**
 * POST a JSON body to a QuantOracle endpoint and return the parsed response.
 * Throws ApiError on non-2xx responses.
 *
 * @param path  Endpoint path beginning with `/v1/...`
 * @param body  JSON-serializable request body
 */
export async function callQuantOracle<T = unknown>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  if (!path.startsWith('/v1/')) {
    throw new Error(`Endpoint path must start with /v1/, got: ${path}`);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'quantoracle-site',
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      // Calculator results are pure functions of the input — no need to
      // re-fetch on every page render. Next.js caches by URL+body shape.
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      let detail: unknown;
      try {
        detail = await res.json();
      } catch {
        detail = await res.text().catch(() => undefined);
      }
      const err: ApiError = {
        status: res.status,
        message: `QuantOracle ${path} returned ${res.status}`,
        detail,
      };
      throw err;
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
