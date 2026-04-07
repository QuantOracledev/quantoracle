// HTTP client — thin wrapper around native fetch

const DEFAULT_URL = "https://api.quantoracle.dev";

export async function apiCall(path, payload, opts = {}) {
  const base = opts.url || process.env.QUANTORACLE_URL || DEFAULT_URL;
  const url = `${base}${path}`;

  const headers = { "Content-Type": "application/json" };
  const apiKey = opts.apiKey || process.env.QUANTORACLE_API_KEY;
  if (apiKey) headers["X-Api-Key"] = apiKey;

  if (opts.verbose) {
    process.stderr.write(`\x1b[90mPOST ${url}\n${JSON.stringify(payload, null, 2)}\x1b[0m\n`);
  }

  const t0 = performance.now();
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const elapsed = performance.now() - t0;

  if (!res.ok) {
    const text = await res.text();
    let msg;
    try {
      const err = JSON.parse(text);
      if (err.detail) {
        // FastAPI validation error
        if (Array.isArray(err.detail)) {
          msg = err.detail.map(e => `${e.loc?.join(".")}: ${e.msg}`).join("\n  ");
        } else {
          msg = err.detail;
        }
      } else {
        msg = text;
      }
    } catch {
      msg = text;
    }
    throw new Error(`HTTP ${res.status} — ${msg}`);
  }

  const data = await res.json();

  if (opts.verbose) {
    process.stderr.write(`\x1b[90m${res.status} in ${elapsed.toFixed(0)}ms\x1b[0m\n`);
  }

  return data;
}

export async function apiGet(path, opts = {}) {
  const base = opts.url || process.env.QUANTORACLE_URL || DEFAULT_URL;
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
