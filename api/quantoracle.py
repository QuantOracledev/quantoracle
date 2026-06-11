"""
QuantOracle v2.0 — quantoracle.dev
The definitive quant computation layer for autonomous agents.
53 deterministic endpoints. Pure Python math. No numpy/scipy.
"""

from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from typing import Optional, Literal
import math, time, os, random, sqlite3
from contextvars import ContextVar
from datetime import datetime, timezone, timedelta

app = FastAPI(
    title="QuantOracle",
    version="2.0.0",
    description="63 deterministic quant computation tools for autonomous agents. quantoracle.dev",
    docs_url="/docs",
    redoc_url=None,
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Per-request IP + source tracking via context variables ───────────────
_request_ip: ContextVar[str] = ContextVar("request_ip", default="unknown")
_request_source: ContextVar[str] = ContextVar("request_source", default="unknown")
_request_user_agent: ContextVar[str] = ContextVar("request_user_agent", default="")

def _classify_source(x_source: str, user_agent: str, mcp_client: str = "") -> str:
    """Classify traffic source for metrics segmentation."""
    # MCP path — use the upstream client's User-Agent (forwarded via X-MCP-Client)
    # so we can distinguish Smithery vs Claude Desktop vs Cursor vs bots.
    if x_source and "mcp" in x_source.lower():
        m = (mcp_client or "").lower()
        if not m: return "mcp-unknown"
        if "smithery" in m: return "mcp-smithery"
        if "claude" in m and "desktop" in m: return "mcp-claude-desktop"
        if "claude-code" in m or "claude code" in m: return "mcp-claude-code"
        if "claude" in m: return "mcp-claude"
        if "cursor" in m: return "mcp-cursor"
        if "windsurf" in m: return "mcp-windsurf"
        if "cline" in m: return "mcp-cline"
        if "glama" in m: return "mcp-glama"
        if "agentcash" in m: return "mcp-agentcash"
        if "openai" in m or "chatgpt" in m: return "mcp-openai"
        if "python" in m: return "mcp-python"
        if "node" in m or "fetch" in m: return "mcp-node"
        if "curl" in m: return "mcp-curl"
        return "mcp-other"

    if x_source:
        s = x_source.lower()
        if "cli" in s: return "cli"
        if "langchain" in s: return "langchain"
        if "gpt" in s or "openai" in s: return "openai-gpt"
        return s[:32]
    ua = (user_agent or "").lower()
    if not ua: return "unknown"
    if "x402scan" in ua or "x402-scan" in ua: return "x402scan"
    if "smithery" in ua: return "smithery"
    if "glama" in ua: return "glama"
    if "claude" in ua: return "claude"
    if "openai" in ua or "chatgpt" in ua: return "openai-gpt"
    if "python-httpx" in ua or "python-requests" in ua or "langchain" in ua: return "python-client"
    if "node-fetch" in ua or "undici" in ua or "axios" in ua: return "node-client"
    if "curl" in ua: return "curl"
    if "mozilla" in ua or "chrome" in ua or "safari" in ua: return "browser"
    if "postman" in ua or "insomnia" in ua: return "api-tool"
    if "cloudflare-workers" in ua or "cloudflare" in ua: return "cloudflare"
    return "other"

@app.middleware("http")
async def capture_client_ip(request: Request, call_next):
    ip = (request.headers.get("cf-connecting-ip")
          or request.headers.get("x-real-ip")
          or request.headers.get("x-forwarded-for", "").split(",")[0].strip()
          or (request.client.host if request.client else "unknown"))
    raw_ua = request.headers.get("user-agent", "")
    # For SSR traffic from quantoracle.dev, the original browser/agent UA is
    # forwarded as X-Forwarded-User-Agent (otherwise the API just sees "node"
    # from Next.js's server-side fetch).
    # For MCP traffic, the upstream client UA is forwarded as X-MCP-Client.
    # Prefer in this order so attribution surfaces the real upstream:
    #   1. X-Forwarded-User-Agent (real end-user behind SSR proxy)
    #   2. X-MCP-Client (AI assistant making MCP tool call)
    #   3. User-Agent (direct caller — usually a node/python client)
    fwd_ua = request.headers.get("x-forwarded-user-agent", "")
    mcp_client = request.headers.get("x-mcp-client", "")
    stored_ua = (fwd_ua or mcp_client or raw_ua)[:200]
    source = _classify_source(
        request.headers.get("x-source", ""),
        fwd_ua or raw_ua,
        mcp_client,
    )
    _request_ip.set(ip)
    _request_source.set(source)
    _request_user_agent.set(stored_ua)
    return await call_next(request)


# ── Brand metadata middleware — adds _meta to every /v1/* JSON response ───
# Purpose: when LLMs/agents ground answers on QuantOracle results, the _meta
# field gives them a brandable hook they can cite. Convert invisible bot/agent
# traffic into brand visibility. Wraps in try/except so malformed responses
# never break — pass-through on any error.
import json as _json_for_meta

_ENDPOINT_TO_PAGE = {
    "/v1/options/price": "/black-scholes-calculator",
    "/v1/options/payoff-diagram": "/options-profit-calculator",
    "/v1/options/implied-vol": "/implied-volatility-calculator",
    "/v1/derivatives/binomial-tree": "/american-option-calculator",
    "/v1/risk/kelly": "/kelly-criterion-calculator",
    "/v1/risk/position-size": "/position-size-calculator",
    "/v1/risk/var-parametric": "/value-at-risk-calculator",
    "/v1/risk/drawdown": "/drawdown-calculator",
    "/v1/simulate/montecarlo": "/monte-carlo-simulation-calculator",
    "/v1/stats/sharpe-ratio": "/sharpe-ratio-calculator",
    "/v1/stats/probabilistic-sharpe": "/probabilistic-sharpe-ratio-calculator",
    "/v1/stats/hurst-exponent": "/hurst-exponent-calculator",
    "/v1/tvm/cagr": "/cagr-calculator",
    "/v1/crypto/liquidation-price": "/crypto-liquidation-calculator",
    "/v1/crypto/impermanent-loss": "/impermanent-loss-calculator",
}

@app.middleware("http")
async def add_brand_meta(request: Request, call_next):
    response = await call_next(request)
    # Only mutate /v1/* JSON responses — leave /mcp, /health, /metrics alone
    if not request.url.path.startswith("/v1/"):
        return response
    if response.status_code != 200:
        return response
    ct = response.headers.get("content-type", "")
    if not ct.startswith("application/json"):
        return response
    try:
        body = b""
        async for chunk in response.body_iterator:
            body += chunk
        data = _json_for_meta.loads(body)
        if isinstance(data, dict) and "_meta" not in data:
            calculator_path = _ENDPOINT_TO_PAGE.get(request.url.path)
            data["_meta"] = {
                "powered_by": "QuantOracle",
                "url": "https://quantoracle.dev",
                "docs": "https://api.quantoracle.dev/docs",
            }
            if calculator_path:
                data["_meta"]["calculator"] = f"https://quantoracle.dev{calculator_path}"
        new_body = _json_for_meta.dumps(data).encode()
        # Strip Content-Length so Starlette recomputes it; preserve other headers
        new_headers = {k: v for k, v in response.headers.items() if k.lower() != "content-length"}
        return Response(
            content=new_body,
            status_code=response.status_code,
            headers=new_headers,
            media_type="application/json",
        )
    except Exception:
        # Never break a response over branding metadata — return original body if read,
        # else a generic 200 (the underlying response was already consumed by body_iterator).
        safe_body = body if 'body' in locals() else b'{"_meta_error":"response_passthrough_failed"}'
        return Response(
            content=safe_body,
            status_code=response.status_code,
            headers={k: v for k, v in response.headers.items() if k.lower() != "content-length"},
            media_type=ct,
        )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": "internal_error", "detail": "An unexpected error occurred"})

# ── Auth ──────────────────────────────────────────────────────────────────
VALID_KEYS = set(os.environ.get("QO_API_KEYS", "").split(",")) - {""}

async def check_auth(x_api_key: Optional[str] = Header(None)):
    if VALID_KEYS and (not x_api_key or x_api_key not in VALID_KEYS):
        raise HTTPException(401, "Invalid API key")

auth = [Depends(check_auth)] if VALID_KEYS else []

# ── Persistent Metrics (SQLite — survives restarts, multi-worker safe) ────
_boot = datetime.now(timezone.utc)
_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "metrics.db")
_RETAIN_DAYS = 90

def _get_db() -> sqlite3.Connection:
    """Get a thread-local SQLite connection with WAL mode for concurrent writes."""
    conn = sqlite3.connect(_DB_PATH, timeout=5)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn

def _init_db():
    conn = _get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS calls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            date TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            ip TEXT NOT NULL DEFAULT 'unknown',
            price REAL NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_calls_date ON calls(date);
        CREATE INDEX IF NOT EXISTS idx_calls_endpoint ON calls(endpoint);
        CREATE INDEX IF NOT EXISTS idx_calls_ip ON calls(ip);
    """)
    # Auto-migrate: idempotent ALTER pattern that survives multi-worker races.
    # Multiple gunicorn workers run _init_db() in parallel on startup; if we
    # only check `cols` once and then ALTER, the second worker's snapshot is
    # stale by the time it runs. Wrap each ALTER in its own try/except that
    # tolerates the "duplicate column name" race; any other error still raises.
    def _safe_alter(sql: str) -> None:
        try:
            conn.execute(sql)
            conn.commit()
        except sqlite3.OperationalError as e:
            if "duplicate column name" not in str(e):
                raise
    _safe_alter("ALTER TABLE calls ADD COLUMN source TEXT NOT NULL DEFAULT 'unknown'")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_calls_source ON calls(source)")
    conn.commit()
    # Auto-migrate: add user_agent column for richer attribution (added 2026-05-10)
    _safe_alter("ALTER TABLE calls ADD COLUMN user_agent TEXT NOT NULL DEFAULT ''")
    # Settlements table — x402 on-chain payments that actually cleared
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS settlements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            date TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            amount_usdc REAL NOT NULL,
            network TEXT NOT NULL,
            tx_hash TEXT,
            payer TEXT,
            source TEXT NOT NULL DEFAULT 'unknown'
        );
        CREATE INDEX IF NOT EXISTS idx_settle_date ON settlements(date);
        CREATE INDEX IF NOT EXISTS idx_settle_network ON settlements(network);
        CREATE INDEX IF NOT EXISTS idx_settle_tx ON settlements(tx_hash);
    """)
    # Live-data cache — TTL'd responses from external market-data sources.
    # Shared across the 4 gunicorn workers (no in-process cache would sync).
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS live_cache (
            key TEXT PRIMARY KEY,
            json TEXT NOT NULL,
            fetched_at REAL NOT NULL
        );
    """)
    # Live-data HISTORY — append-only archive of every fresh upstream snapshot
    # (organic API fetches + the systemd sampler timer). Free upstreams serve
    # "now"; nobody can backfill the past — this table is the dataset that
    # compounds. Never pruned (_RETAIN_DAYS applies only to `calls`); growth
    # at sampler cadence is ~1K rows/day (~tens of MB/year).
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS live_history (
            ts REAL NOT NULL,
            date TEXT NOT NULL,
            kind TEXT NOT NULL,
            asset TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT '',
            json TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_lh_kind_asset_ts ON live_history(kind, asset, ts);
        CREATE INDEX IF NOT EXISTS idx_lh_date ON live_history(date);
    """)
    conn.close()

_init_db()

PRICES = {
    # $0.002 — Simple formulas
    "stats/zscore": 0.002, "crypto/apy-apr-convert": 0.002,
    "derivatives/put-call-parity": 0.002, "indicators/fibonacci-retracement": 0.002,
    "macro/inflation-adjusted": 0.002, "macro/taylor-rule": 0.002,
    "macro/real-yield": 0.002, "crypto/liquidation-price": 0.002,
    "indicators/bollinger-bands": 0.002, "indicators/atr": 0.002,
    # $0.005 — Medium computation
    "options/price": 0.005, "options/implied-vol": 0.005, "risk/kelly": 0.005,
    "risk/position-size": 0.005, "risk/drawdown": 0.005,
    "indicators/technical": 0.005, "indicators/crossover": 0.005,
    "indicators/regime": 0.005, "fx/interest-rate-parity": 0.005,
    "fx/purchasing-power-parity": 0.005, "fx/forward-rate": 0.005,
    "fx/carry-trade": 0.005, "crypto/funding-rate": 0.005,
    "crypto/dex-slippage": 0.005, "crypto/vesting-schedule": 0.005,
    "crypto/rebalance-threshold": 0.005, "fixed-income/amortization": 0.005,
    "options/payoff-diagram": 0.005, "crypto/impermanent-loss": 0.005,
    # $0.008 — Complex computation
    "options/strategy": 0.008, "risk/portfolio": 0.008, "risk/correlation": 0.008,
    "risk/var-parametric": 0.008, "risk/stress-test": 0.008,
    "derivatives/binomial-tree": 0.008, "derivatives/barrier-option": 0.008,
    "derivatives/lookback-option": 0.008, "derivatives/asian-option": 0.008,
    "stats/hurst-exponent": 0.008, "stats/cointegration": 0.008,
    "stats/linear-regression": 0.008, "stats/polynomial-regression": 0.008,
    "stats/distribution-fit": 0.008, "fi/credit-spread": 0.008,
    "fixed-income/bond": 0.008, "portfolio/risk-parity-weights": 0.008,
    # $0.015 — Heavy optimization
    "simulate/montecarlo": 0.015, "portfolio/optimize": 0.015,
    "stats/garch-forecast": 0.015, "derivatives/volatility-surface": 0.015,
    "derivatives/option-chain-analysis": 0.015, "fi/yield-curve-interpolate": 0.015,
    "stats/correlation-matrix": 0.015,
    # Backtest support
    "risk/transaction-cost": 0.005,
    "stats/probabilistic-sharpe": 0.005,
    # TVM + fundamentals
    "tvm/present-value": 0.002,
    "tvm/future-value": 0.002,
    "tvm/irr": 0.005,
    "tvm/npv": 0.002,
    "stats/realized-volatility": 0.005,
    "stats/normal-distribution": 0.002,
    "stats/sharpe-ratio": 0.002,
    "tvm/cagr": 0.002,
    # Composites
    "options/spread-scan": 0.05,
    "indicators/regime-classify": 0.015,
    "risk/full-analysis": 0.04,
    "trade/evaluate": 0.025,
    "portfolio/health": 0.04,
    "pairs/signal": 0.025,
    "backtest/strategy": 0.10,
    "portfolio/rebalance-plan": 0.05,
    "options/strategy-optimizer": 0.08,
    "hedging/recommend": 0.04,
    # Live data (paid revenue tier — fresh market data + compute, not replaceable
    # by a local lib because the agent doesn't bring the data).
    "live/volatility": 0.01,
    "live/funding-rates": 0.005,
}

def hit(ep):
    """Record an API call — persisted to SQLite immediately."""
    ip = _request_ip.get("unknown")
    source = _request_source.get("unknown")
    if source == "sampler":
        return  # internal time-series collection (systemd timer), not API usage
    user_agent = _request_user_agent.get("")
    now = datetime.now(timezone.utc)
    price = PRICES.get(ep, 0)
    try:
        conn = _get_db()
        conn.execute(
            "INSERT INTO calls (ts, date, endpoint, ip, price, source, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (now.isoformat(), now.strftime("%Y-%m-%d"), ep, ip, price, source, user_agent)
        )
        conn.commit()
        # Prune old data once per day (cheap check)
        cutoff = (now - timedelta(days=_RETAIN_DAYS)).strftime("%Y-%m-%d")
        conn.execute("DELETE FROM calls WHERE date < ?", (cutoff,))
        conn.commit()
        conn.close()
    except Exception:
        pass  # never crash the API over metrics

# ══════════════════════════════════════════════════════════════════════════
# SHARED MATH PRIMITIVES — pure Python, no numpy/scipy
# ══════════════════════════════════════════════════════════════════════════
def ncdf(x):
    """Cumulative normal distribution using math.erf (C-level precision)."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2)))

def npdf(x):
    return math.exp(-0.5 * x * x) / math.sqrt(2 * math.pi)

def bm():
    """Box-Muller normal random variate."""
    u = random.random() or 1e-10
    v = random.random() or 1e-10
    return math.sqrt(-2 * math.log(u)) * math.cos(2 * math.pi * v)

def mu(a):
    return sum(a) / len(a) if a else 0

def va(a, m=None):
    m = m if m is not None else mu(a)
    return sum((x - m) ** 2 for x in a) / (len(a) - 1) if len(a) > 1 else 0

def sd(a, m=None):
    return math.sqrt(va(a, m))

def cv(a, b):
    ma, mb = mu(a), mu(b)
    return sum((x - ma) * (y - mb) for x, y in zip(a, b)) / (len(a) - 1) if len(a) > 1 else 0

r2 = lambda x: round(x, 2)
r4 = lambda x: round(x, 4)
r6 = lambda x: round(x, 6)
r8 = lambda x: round(x, 8)

# ── Matrix operations ─────────────────────────────────────────────────────
def mat_T(A):
    """Transpose a 2D list."""
    if not A:
        return []
    return [[A[i][j] for i in range(len(A))] for j in range(len(A[0]))]

def mat_mul(A, B):
    """Multiply two 2D lists."""
    n, m, p = len(A), len(B[0]), len(B)
    return [[sum(A[i][k] * B[k][j] for k in range(p)) for j in range(m)] for i in range(n)]

def mat_vec(A, v):
    """Multiply matrix by vector."""
    return [sum(A[i][j] * v[j] for j in range(len(v))) for i in range(len(A))]

def solve_linear_system(A, b):
    """Gaussian elimination with partial pivoting. Returns x such that Ax=b."""
    n = len(b)
    M = [A[i][:] + [b[i]] for i in range(n)]
    for col in range(n):
        max_row = max(range(col, n), key=lambda r: abs(M[r][col]))
        M[col], M[max_row] = M[max_row], M[col]
        if abs(M[col][col]) < 1e-14:
            raise ValueError("Singular matrix")
        for row in range(col + 1, n):
            f = M[row][col] / M[col][col]
            for j in range(col, n + 1):
                M[row][j] -= f * M[col][j]
    x = [0.0] * n
    for i in range(n - 1, -1, -1):
        x[i] = (M[i][n] - sum(M[i][j] * x[j] for j in range(i + 1, n))) / M[i][i]
    return x

def mat_inv(A):
    """Invert a square matrix via Gaussian elimination."""
    n = len(A)
    M = [A[i][:] + [1.0 if j == i else 0.0 for j in range(n)] for i in range(n)]
    for col in range(n):
        max_row = max(range(col, n), key=lambda r: abs(M[r][col]))
        M[col], M[max_row] = M[max_row], M[col]
        if abs(M[col][col]) < 1e-14:
            raise ValueError("Singular matrix")
        piv = M[col][col]
        for j in range(2 * n):
            M[col][j] /= piv
        for row in range(n):
            if row != col:
                f = M[row][col]
                for j in range(2 * n):
                    M[row][j] -= f * M[col][j]
    return [row[n:] for row in M]

# ── Nelder-Mead simplex optimizer ─────────────────────────────────────────
def nelder_mead(func, x0, tol=1e-8, max_iter=500):
    """Minimize func(x) starting from x0. Returns (x_best, f_best)."""
    n = len(x0)
    alpha, gamma, rho, sigma = 1.0, 2.0, 0.5, 0.5
    simplex = [x0[:]]
    for i in range(n):
        p = x0[:]
        p[i] += 0.05 if p[i] == 0 else 0.05 * abs(p[i])
        simplex.append(p)
    fs = [func(p) for p in simplex]
    for _ in range(max_iter):
        order = sorted(range(n + 1), key=lambda i: fs[i])
        simplex = [simplex[i] for i in order]
        fs = [fs[i] for i in order]
        if max(abs(fs[i] - fs[0]) for i in range(1, n + 1)) < tol:
            break
        centroid = [sum(simplex[i][j] for i in range(n)) / n for j in range(n)]
        xr = [centroid[j] + alpha * (centroid[j] - simplex[-1][j]) for j in range(n)]
        fr = func(xr)
        if fs[0] <= fr < fs[-2]:
            simplex[-1], fs[-1] = xr, fr
        elif fr < fs[0]:
            xe = [centroid[j] + gamma * (xr[j] - centroid[j]) for j in range(n)]
            fe = func(xe)
            if fe < fr:
                simplex[-1], fs[-1] = xe, fe
            else:
                simplex[-1], fs[-1] = xr, fr
        else:
            xc = [centroid[j] + rho * (simplex[-1][j] - centroid[j]) for j in range(n)]
            fc = func(xc)
            if fc < fs[-1]:
                simplex[-1], fs[-1] = xc, fc
            else:
                for i in range(1, n + 1):
                    simplex[i] = [simplex[0][j] + sigma * (simplex[i][j] - simplex[0][j]) for j in range(n)]
                    fs[i] = func(simplex[i])
    best = min(range(n + 1), key=lambda i: fs[i])
    return simplex[best], fs[best]

# ── Cubic spline interpolation ────────────────────────────────────────────
def cubic_spline(xs, ys, query):
    """Natural cubic spline interpolation. xs must be sorted."""
    n = len(xs) - 1
    h = [xs[i + 1] - xs[i] for i in range(n)]
    al = [3 * (ys[i + 1] - ys[i]) / h[i] - 3 * (ys[i] - ys[i - 1]) / h[i - 1] for i in range(1, n)]
    l = [1.0] * (n + 1)
    mu_arr = [0.0] * (n + 1)
    z = [0.0] * (n + 1)
    for i in range(1, n):
        l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu_arr[i - 1]
        mu_arr[i] = h[i] / l[i]
        z[i] = (al[i - 1] - h[i - 1] * z[i - 1]) / l[i]
    c = [0.0] * (n + 1)
    b = [0.0] * n
    d = [0.0] * n
    for j in range(n - 1, -1, -1):
        c[j] = z[j] - mu_arr[j] * c[j + 1]
        b[j] = (ys[j + 1] - ys[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3
        d[j] = (c[j + 1] - c[j]) / (3 * h[j])
    results = []
    for q in query:
        i = max(0, min(n - 1, next((k for k in range(n) if xs[k + 1] >= q), n - 1)))
        dx = q - xs[i]
        results.append(ys[i] + b[i] * dx + c[i] * dx ** 2 + d[i] * dx ** 3)
    return results

# ── Student's t CDF approximation ────────────────────────────────────────
def t_cdf(x, df):
    """Approximate CDF of Student's t-distribution."""
    if df <= 0:
        return 0.5
    if df >= 100:
        return ncdf(x)
    t_val = df / (df + x * x)
    if x >= 0:
        return 1.0 - 0.5 * _incomplete_beta(t_val, df / 2.0, 0.5)
    else:
        return 0.5 * _incomplete_beta(t_val, df / 2.0, 0.5)

def _incomplete_beta(x, a, b, max_iter=200):
    """Regularized incomplete beta function via continued fraction."""
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    lbeta = math.lgamma(a) + math.lgamma(b) - math.lgamma(a + b)
    front = math.exp(a * math.log(x) + b * math.log(1 - x) - lbeta) / a
    d, c, f = 1.0, 1.0, 1.0
    for i in range(1, max_iter):
        m = i // 2
        if i % 2 == 0:
            num = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m))
        else:
            num = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1))
        d = 1.0 + num * d
        if abs(d) < 1e-30:
            d = 1e-30
        d = 1.0 / d
        c = 1.0 + num / c
        if abs(c) < 1e-30:
            c = 1e-30
        f *= d * c
        if abs(d * c - 1.0) < 1e-10:
            break
    return front * f

# ── Spearman rank helper ─────────────────────────────────────────────────
def _rank(a):
    indexed = sorted(enumerate(a), key=lambda t: t[1])
    ranks = [0.0] * len(a)
    i = 0
    while i < len(indexed):
        j = i
        while j < len(indexed) - 1 and indexed[j + 1][1] == indexed[j][1]:
            j += 1
        avg_rank = (i + j) / 2.0 + 1
        for k in range(i, j + 1):
            ranks[indexed[k][0]] = avg_rank
        i = j + 1
    return ranks


# ══════════════════════════════════════════════════════════════════════════
# TOOL 1: BLACK-SCHOLES + 10 GREEKS — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T1In(BaseModel):
    S: float = Field(..., gt=0, description="Spot price of the underlying asset")
    K: float = Field(..., gt=0, description="Strike price")
    T: float = Field(..., gt=0, description="Time to expiration in years")
    r: float = Field(0.05, description="Risk-free interest rate (annualized)")
    sigma: float = Field(..., gt=0, description="Volatility (annualized, e.g. 0.2 = 20%)")
    q: float = Field(0, description="Continuous dividend yield")
    type: Literal["call", "put"] = Field("call", description="Option type")

@app.post("/v1/options/price", tags=["Options"], dependencies=auth)
async def t1(req: T1In):
    """Black-Scholes pricing with 10 Greeks (delta through color). Crypto underlying?
    Pair with /v1/live/volatility for fresh realized vol instead of a static sigma;
    perp carry at /v1/live/funding-rates."""
    t0 = time.perf_counter(); hit("options/price")
    S, K, T, r, sig, q, cp = req.S, req.K, req.T, req.r, req.sigma, req.q, req.type
    if T <= 0 or sig <= 0:
        raise HTTPException(400, "T and sigma must be > 0")
    sT = math.sqrt(T); d1 = (math.log(S / K) + (r - q + sig**2 / 2) * T) / (sig * sT); d2 = d1 - sig * sT
    N1, N2, n1 = ncdf(d1), ncdf(d2), npdf(d1); eqT, erT = math.exp(-q * T), math.exp(-r * T)
    if cp == "call":
        pr = S * eqT * N1 - K * erT * N2; dl = eqT * N1
        th = (-S * eqT * n1 * sig / (2 * sT) - r * K * erT * N2 + q * S * eqT * N1) / 365
        rh = K * T * erT * N2 / 100
    else:
        pr = K * erT * ncdf(-d2) - S * eqT * ncdf(-d1); dl = -eqT * ncdf(-d1)
        th = (-S * eqT * n1 * sig / (2 * sT) + r * K * erT * ncdf(-d2) - q * S * eqT * ncdf(-d1)) / 365
        rh = -K * T * erT * ncdf(-d2) / 100
    gm = eqT * n1 / (S * sig * sT); vg = S * eqT * n1 * sT / 100
    va_g = -eqT * n1 * d2 / sig / 100
    ch = -eqT * (n1 * (2 * (r - q) * T - d2 * sig * sT) / (2 * T * sig * sT)) / 365
    vo = vg * d1 * d2 / sig; sp = -gm / S * (d1 / (sig * sT) + 1)
    it = max(0, S - K) if cp == "call" else max(0, K - S)
    return {
        "price": r4(pr), "intrinsic": r4(it), "time_value": r4(pr - it),
        "breakeven": r4(K + pr if cp == "call" else K - pr),
        "prob_itm": r4(N2 if cp == "call" else ncdf(-d2)),
        "greeks": {"delta": r6(dl), "gamma": r6(gm), "theta": r6(th), "vega": r6(vg),
                   "rho": r6(rh), "vanna": r8(va_g), "charm": r8(ch), "volga": r8(vo), "speed": r8(sp)},
        "d1": r6(d1), "d2": r6(d2),
        "live_data": {
            "note": "Priced with the sigma you supplied. For crypto underlyings, fetch fresh realized vol ($0.01) or perp funding ($0.005) instead of static inputs.",
            "volatility": "/v1/live/volatility",
            "funding": "/v1/live/funding-rates",
        },
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 2: IMPLIED VOL SOLVER — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T2In(BaseModel):
    S: float = Field(..., gt=0, description="Spot price of the underlying asset")
    K: float = Field(..., gt=0, description="Strike price")
    T: float = Field(..., gt=0, description="Time to expiration in years")
    r: float = Field(0.05, description="Risk-free interest rate (annualized)")
    q: float = Field(0, description="Continuous dividend yield")
    market_price: float = Field(..., gt=0, description="Observed market price of the option")
    type: Literal["call", "put"] = Field("call", description="Option type")

@app.post("/v1/options/implied-vol", tags=["Options"], dependencies=auth)
async def t2(req: T2In):
    """Newton-Raphson implied volatility solver. Converges in 5-8 iterations."""
    t0 = time.perf_counter(); hit("options/implied-vol")
    S, K, T, r, q, mkt, cp = req.S, req.K, req.T, req.r, req.q, req.market_price, req.type
    sig = 0.3; pr = 0
    for i in range(50):
        sT = math.sqrt(T); d1 = (math.log(S / K) + (r - q + sig**2 / 2) * T) / (sig * sT); d2 = d1 - sig * sT
        eqT, erT = math.exp(-q * T), math.exp(-r * T)
        pr = S * eqT * ncdf(d1) - K * erT * ncdf(d2) if cp == "call" else K * erT * ncdf(-d2) - S * eqT * ncdf(-d1)
        vr = S * eqT * npdf(d1) * sT
        if vr < 1e-12:
            break
        sig -= (pr - mkt) / vr; sig = max(0.001, min(sig, 5))
        if abs(pr - mkt) < 1e-8:
            break
    return {"implied_volatility": r6(sig), "annualized_pct": r2(sig * 100), "model_price": r4(pr),
            "market_price": mkt, "iterations": i + 1, "ms": r2((time.perf_counter() - t0) * 1000)}

# ══════════════════════════════════════════════════════════════════════════
# TOOL 3: MULTI-LEG STRATEGY — $0.008
# ══════════════════════════════════════════════════════════════════════════
class Leg(BaseModel):
    type: Literal["call", "put"] = Field(..., description="Option type")
    K: float = Field(..., description="Strike price")
    premium: float = Field(..., description="Premium paid (positive) or received (negative)")
    quantity: int = Field(1, description="Number of contracts (positive=long, negative=short)")

class T3In(BaseModel):
    legs: list[Leg] = Field(..., description="List of option legs in the strategy")
    S_range: Optional[list[float]] = Field(None, description="Custom price range [min, max] for P&L analysis")
    points: int = Field(50, ge=1, description="Number of points to evaluate in P&L curve")

@app.post("/v1/options/strategy", tags=["Options"], dependencies=auth)
async def t3(req: T3In):
    """Multi-leg options strategy P&L, breakevens, max profit/loss, risk/reward."""
    t0 = time.perf_counter(); hit("options/strategy")
    ks = [l.K for l in req.legs]
    lo = req.S_range[0] if req.S_range else min(ks) * 0.7
    hi = req.S_range[1] if req.S_range else max(ks) * 1.3
    pf = []
    for i in range(req.points + 1):
        S = lo + i * (hi - lo) / req.points
        pnl = sum(l.quantity * ((max(0, S - l.K) if l.type == "call" else max(0, l.K - S)) - l.premium) for l in req.legs)
        pf.append({"price": r2(S), "pnl": r2(pnl)})
    ps = [p["pnl"] for p in pf]; bes = []
    for i in range(len(ps) - 1):
        if ps[i] * ps[i + 1] < 0:
            bes.append(r2(pf[i]["price"] - ps[i] * (pf[i + 1]["price"] - pf[i]["price"]) / (ps[i + 1] - ps[i])))
    return {"max_profit": r2(max(ps)), "max_loss": r2(min(ps)), "breakevens": bes,
            "payoff_curve": pf, "ms": r2((time.perf_counter() - t0) * 1000)}

# ══════════════════════════════════════════════════════════════════════════
# TOOL 4: PORTFOLIO RISK — 22 METRICS — $0.008
# ══════════════════════════════════════════════════════════════════════════
class T4In(BaseModel):
    # Returns cap tightened 2026-05-14 from 10000 to 5000 (~20 years daily
    # data). Statistical estimators converge well before this — Sharpe stable
    # at ~250 obs, Hurst stable at ~1000.
    returns: list[float] = Field(..., min_length=5, max_length=5000, description="Array of periodic portfolio returns (e.g. daily), max 5000")
    benchmark_returns: Optional[list[float]] = Field(None, max_length=5000, description="Optional benchmark return series for relative metrics")
    risk_free_rate: float = Field(0.05, description="Annual risk-free rate for Sharpe/Sortino calculation")

@app.post("/v1/risk/portfolio", tags=["Risk"], dependencies=auth)
async def t4(req: T4In):
    """22 risk metrics: Sharpe, Sortino, Calmar, Omega, VaR, CVaR, drawdown, skew, kurtosis."""
    t0 = time.perf_counter(); hit("risk/portfolio")
    R = req.returns; n = len(R); m = mu(R); s = sd(R); sr = sorted(R); rf = req.risk_free_rate / 252
    ar = m * 252; av = s * math.sqrt(252); v5i = max(0, int(n * 0.05) - 1); v1i = max(0, int(n * 0.01) - 1)
    v95, v99 = sr[v5i], sr[v1i]; cv95 = mu(sr[:v5i + 1]) if v5i > 0 else v95
    cum = pk = mdd = 0
    for r_val in R:
        cum = (1 + cum) * (1 + r_val) - 1; pk = max(pk, cum)
        dd = (cum - pk) / (1 + pk) if pk > 0 else min(0, cum); mdd = min(mdd, dd)
    dn = [r_val - rf for r_val in R if r_val < rf]
    dd_dev = math.sqrt(sum(d ** 2 for d in dn) / n) if dn else 0
    sh = (ar - req.risk_free_rate) / av if av > 0 else 0
    so = (ar - req.risk_free_rate) / (dd_dev * math.sqrt(252)) if dd_dev > 0 else 0
    ca = ar / abs(mdd) if mdd else 0
    gn = sum(max(0, r_val) for r_val in R); ls = sum(abs(min(0, r_val)) for r_val in R)
    om = gn / ls if ls > 0 else 0
    w = sum(1 for r_val in R if r_val > 0)
    gp = sum(r_val for r_val in R if r_val > 0); gl = abs(sum(r_val for r_val in R if r_val < 0))
    sk = sum(((r_val - m) / s) ** 3 for r_val in R) * n / ((n - 1) * (n - 2)) if s > 0 and n > 2 else 0
    ku = (sum(((r_val - m) / s) ** 4 for r_val in R) * n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3))) if s > 0 and n > 3 else 0
    bm = None
    if req.benchmark_returns and len(req.benchmark_returns) == n:
        b = req.benchmark_returns; ex = [r_val - bi for r_val, bi in zip(R, b)]
        te = sd(ex) * math.sqrt(252); ir = mu(ex) * 252 / te if te > 0 else 0
        c = cv(R, b); vb = va(b); bt = c / vb if vb > 0 else 0
        al = (m - rf - bt * (mu(b) - rf)) * 252
        bm = {"alpha": r4(al), "beta": r4(bt), "tracking_error": r4(te), "information_ratio": r4(ir)}
    return {
        "returns": {"annualized": r4(ar), "vol": r4(av), "total": r4(cum), "best": r4(max(R)),
                    "worst": r4(min(R)), "win_rate": r4(w / n), "profit_factor": r4(gp / gl if gl > 0 else 0)},
        "risk": {"sharpe": r4(sh), "sortino": r4(so), "calmar": r4(ca), "omega": r4(om),
                 "var_95": r4(v95), "cvar_95": r4(cv95), "var_99": r4(v99), "max_drawdown": r4(mdd)},
        "distribution": {"skewness": r4(sk), "excess_kurtosis": r4(ku), "fat_tails": ku > 1},
        "benchmark": bm, "n": n, "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 5: KELLY CRITERION — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T5In(BaseModel):
    mode: Literal["discrete", "continuous"] = Field("discrete", description="Calculation mode: discrete (win/loss) or continuous (return series)")
    win_rate: Optional[float] = Field(None, description="Probability of winning (0-1), required for discrete mode")
    avg_win: Optional[float] = Field(None, description="Average win amount, required for discrete mode")
    avg_loss: Optional[float] = Field(None, description="Average loss amount (positive number), required for discrete mode")
    returns: Optional[list[float]] = Field(None, description="Array of historical returns, required for continuous mode")

@app.post("/v1/risk/kelly", tags=["Risk"], dependencies=auth)
async def t5(req: T5In):
    """Kelly Criterion: discrete (win/loss) or continuous (returns series) mode."""
    t0 = time.perf_counter(); hit("risk/kelly")
    if req.mode == "discrete":
        if req.win_rate is None or req.avg_win is None or req.avg_loss is None:
            raise HTTPException(400, "Need win_rate, avg_win, avg_loss")
        if req.avg_loss == 0:
            raise HTTPException(400, "avg_loss must be non-zero")
        b = req.avg_win / req.avg_loss
        f = (req.win_rate * b - (1 - req.win_rate)) / b
        e = req.win_rate * req.avg_win - (1 - req.win_rate) * req.avg_loss
        return {"full_kelly": r4(max(0, f)), "half_kelly": r4(max(0, f / 2)), "quarter_kelly": r4(max(0, f / 4)),
                "edge": r4(e), "payoff_ratio": r4(b),
                "recommended": "NO_BET" if f <= 0 else "QUARTER_KELLY" if f > 0.25 else "HALF_KELLY",
                "ms": r2((time.perf_counter() - t0) * 1000)}
    if not req.returns or len(req.returns) < 10:
        raise HTTPException(400, "Need >=10 returns")
    m = mu(req.returns); v = va(req.returns); f = m / v if v > 0 else 0
    return {"full_kelly_leverage": r4(f), "half_kelly": r4(f / 2), "mean": r6(m), "variance": r6(v),
            "growth_annual": r4((m - v / 2) * 252), "n": len(req.returns),
            "ms": r2((time.perf_counter() - t0) * 1000)}

# ══════════════════════════════════════════════════════════════════════════
# TOOL 6: MONTE CARLO — $0.015
# ══════════════════════════════════════════════════════════════════════════
class T6In(BaseModel):
    initial_value: float = Field(100000, description="Starting portfolio value")
    annual_return: float = Field(0.1, description="Expected annual return (e.g. 0.10 = 10%)")
    annual_vol: float = Field(0.2, description="Annual volatility (e.g. 0.20 = 20%)")
    # Caps tightened 2026-05-14 for server-stability under abusive traffic.
    # Quality impact: P5/P95 tail-percentile CI widens to ~3% from ~2%; median
    # and mean estimates are indistinguishable. Power users needing higher
    # precision route through /v1/risk/full-analysis (paid composite) or split
    # into multiple smaller calls.
    years: float = Field(5, gt=0, le=30, description="Simulation horizon in years (max 30)")
    simulations: int = Field(1000, ge=100, le=2500, description="Number of Monte Carlo paths (100-2500; default 1000 matches industry standard)")
    contributions: float = Field(0, description="Periodic contribution amount (per year)")
    withdrawal_rate: float = Field(0, description="Annual withdrawal rate as fraction of portfolio")

@app.post("/v1/simulate/montecarlo", tags=["Simulation"], dependencies=auth)
async def t6(req: T6In):
    """GBM Monte Carlo with contributions/withdrawals. Up to 5000 paths."""
    t0 = time.perf_counter(); hit("simulate/montecarlo")
    dt = 1 / 252; steps = int(req.years * 252)
    dr = (req.annual_return - 0.5 * req.annual_vol ** 2) * dt; df = req.annual_vol * math.sqrt(dt)
    dc = req.contributions / 252; fins = []; ruin = 0; paths = []
    for s in range(req.simulations):
        v = req.initial_value; p = [v] if s < 5 else None
        for t in range(steps):
            v *= math.exp(dr + df * bm()); v += dc; v -= v * req.withdrawal_rate / 252
            if v <= 0:
                v = 0; ruin += 1; break
            if p and t % max(1, steps // 50) == 0:
                p.append(v)
        fins.append(v)
        if p:
            p.append(v); paths.append([r2(x) for x in p])
    fins.sort(); n = len(fins); fm = mu(fins)
    return {
        "terminal": {"mean": r2(fm), "median": r2(fins[n // 2]),
                     "p5": r2(fins[int(n * 0.05)]), "p25": r2(fins[int(n * 0.25)]),
                     "p75": r2(fins[int(n * 0.75)]), "p95": r2(fins[int(n * 0.95)])},
        "prob_loss": r4(sum(1 for f in fins if f < req.initial_value) / n),
        "prob_double": r4(sum(1 for f in fins if f >= req.initial_value * 2) / n),
        "prob_ruin": r4(ruin / n),
        "cagr": r4((fm / req.initial_value) ** (1 / req.years) - 1) if fm > 0 else None,
        "sample_paths": paths, "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 7: TECHNICAL INDICATORS (13) — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T7In(BaseModel):
    prices: list[float] = Field(..., min_length=5, description="Array of price data (e.g. closing prices)")
    volumes: Optional[list[float]] = Field(None, description="Optional array of volume data (same length as prices)")
    period: int = Field(14, ge=2, description="Lookback period for indicator calculations")

@app.post("/v1/indicators/technical", tags=["Indicators"], dependencies=auth)
async def t7(req: T7In):
    """13 technical indicators + composite signals."""
    t0 = time.perf_counter(); hit("indicators/technical")
    p = req.prices; n = len(p); pe = min(req.period, n - 1)
    sma = mu(p[-pe:]); ml = 2 / (pe + 1); ema = mu(p[:pe])
    for i in range(pe, n):
        ema = (p[i] - ema) * ml + ema
    ch = [p[i] - p[i - 1] for i in range(1, n)]
    g = [max(0, c) for c in ch[-pe:]]; l = [max(0, -c) for c in ch[-pe:]]
    ag, al = mu(g), mu(l); rs = ag / al if al > 0 else 100; rsi = 100 - 100 / (1 + rs)
    bp = min(20, n); bs = mu(p[-bp:]); bsd = sd(p[-bp:])
    hi, lo = max(p[-pe:]), min(p[-pe:])
    sk = ((p[-1] - lo) / (hi - lo) * 100) if hi != lo else 50
    atr = mu([abs(p[i] - p[i - 1]) for i in range(1, n)][-pe:]) if n > 1 else 0
    roc = (p[-1] / p[-min(pe, n - 1) - 1] - 1) * 100 if p[-min(pe, n - 1) - 1] != 0 else 0
    sig = []
    if rsi > 70: sig.append("RSI_OVERBOUGHT")
    elif rsi < 30: sig.append("RSI_OVERSOLD")
    sig.append("ABOVE_SMA" if p[-1] > sma else "BELOW_SMA")
    if sk > 80: sig.append("STOCH_OVERBOUGHT")
    elif sk < 20: sig.append("STOCH_OVERSOLD")
    return {
        "price": r2(p[-1]), "sma": r2(sma), "ema": r2(ema), "rsi": r2(rsi),
        "bollinger": {"upper": r2(bs + 2 * bsd), "mid": r2(bs), "lower": r2(bs - 2 * bsd)},
        "stochastic_k": r2(sk), "atr": r4(atr), "roc": r2(roc),
        "signals": sig, "trend": "BULLISH" if p[-1] > sma and rsi > 50 else "BEARISH",
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 8: CORRELATION MATRIX — $0.008
# ══════════════════════════════════════════════════════════════════════════
class T8In(BaseModel):
    series: dict[str, list[float]] = Field(..., description='Named return series, e.g. {"AAPL": [0.01, -0.02, ...], "MSFT": [...]}')

@app.post("/v1/risk/correlation", tags=["Risk"], dependencies=auth)
async def t8(req: T8In):
    """N x N correlation and covariance matrices from return series."""
    t0 = time.perf_counter(); hit("risk/correlation")
    nm = list(req.series.keys()); d = [req.series[n] for n in nm]
    k = len(nm); ml = min(len(x) for x in d); d = [x[:ml] for x in d]
    v = [sd(x) for x in d]
    cr = [[r4(cv(d[i], d[j]) / (v[i] * v[j])) if v[i] > 0 and v[j] > 0 else (1.0 if i == j else 0.0)
           for j in range(k)] for i in range(k)]
    return {"assets": nm, "correlation": cr,
            "volatilities": {nm[i]: r4(v[i] * math.sqrt(252)) for i in range(k)},
            "n": ml, "ms": r2((time.perf_counter() - t0) * 1000)}

# ══════════════════════════════════════════════════════════════════════════
# TOOL 9: POSITION SIZING — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T9In(BaseModel):
    account_size: float = Field(..., description="Total account value")
    risk_per_trade: float = Field(0.02, description="Maximum risk per trade as fraction (e.g. 0.02 = 2%)")
    entry_price: float = Field(..., description="Planned entry price")
    stop_loss: float = Field(..., description="Stop loss price")

@app.post("/v1/risk/position-size", tags=["Risk"], dependencies=auth)
async def t9(req: T9In):
    """Fixed fractional position sizing with risk/reward targets."""
    t0 = time.perf_counter(); hit("risk/position-size")
    rps = abs(req.entry_price - req.stop_loss)
    if rps == 0:
        raise HTTPException(400, "Entry = stop")
    dr = req.account_size * req.risk_per_trade; sh = int(dr / rps)
    return {
        "shares": sh, "value": r2(sh * req.entry_price), "risk": r2(dr),
        "pct_account": r4(sh * req.entry_price / req.account_size),
        "risk_per_share": r4(rps), "max_loss": r2(sh * rps),
        "target_2r": r2(req.entry_price + (req.entry_price - req.stop_loss) * 2),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 10: DRAWDOWN — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T10In(BaseModel):
    equity_curve: list[float] = Field(..., min_length=3, description="Array of portfolio equity values over time")

@app.post("/v1/risk/drawdown", tags=["Risk"], dependencies=auth)
async def t10(req: T10In):
    """Drawdown decomposition with underwater curve."""
    t0 = time.perf_counter(); hit("risk/drawdown")
    eq = req.equity_curve; pk = eq[0]; dds = []
    for v in eq:
        if v > pk:
            pk = v
        dds.append((v - pk) / pk if pk > 0 else 0)
    return {"max_dd": r4(min(dds)), "max_dd_pct": r2(min(dds) * 100), "current_dd": r4(dds[-1]),
            "underwater_pct": r2(sum(1 for d in dds if d < -0.001) / len(dds) * 100),
            "ms": r2((time.perf_counter() - t0) * 1000)}

# ══════════════════════════════════════════════════════════════════════════
# TOOL 11: REGIME DETECTION — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T11In(BaseModel):
    prices: list[float] = Field(..., min_length=30, description="Array of price data")
    sma_period: int = Field(50, description="SMA period for trend detection")
    vol_window: int = Field(21, description="Window for rolling volatility calculation")

@app.post("/v1/indicators/regime", tags=["Indicators"], dependencies=auth)
async def t11(req: T11In):
    """Trend + volatility regime + composite risk classification."""
    t0 = time.perf_counter(); hit("indicators/regime")
    p = req.prices; n = len(p); sv = mu(p[-min(req.sma_period, n):])
    rt = [p[i] / p[i - 1] - 1 for i in range(1, n)]
    rv = sd(rt[-min(req.vol_window, len(rt)):]) * math.sqrt(252)
    lv = sd(rt) * math.sqrt(252); ratio = rv / lv if lv > 0 else 1
    tr = "UPTREND" if p[-1] > sv else "DOWNTREND"
    vr = "CRISIS" if ratio > 2 else "HIGH_VOL" if ratio > 1.3 else "LOW_VOL" if ratio < 0.7 else "NORMAL"
    comp = "RISK_ON" if tr == "UPTREND" and vr in ("NORMAL", "LOW_VOL") else "DEFENSIVE" if vr == "CRISIS" else "NEUTRAL"
    return {"trend": tr, "sma": r2(sv), "price_vs_sma": r4(p[-1] / sv - 1), "vol_regime": vr,
            "recent_vol": r4(rv), "long_vol": r4(lv), "vol_ratio": r4(ratio), "composite": comp,
            "ms": r2((time.perf_counter() - t0) * 1000)}

# ══════════════════════════════════════════════════════════════════════════
# TOOL 12: MA CROSSOVER — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T12In(BaseModel):
    prices: list[float] = Field(..., min_length=30, description="Array of price data")
    fast_period: int = Field(10, description="Fast moving average period")
    slow_period: int = Field(50, description="Slow moving average period")

@app.post("/v1/indicators/crossover", tags=["Indicators"], dependencies=auth)
async def t12(req: T12In):
    """Golden/death cross detection with signal history."""
    t0 = time.perf_counter(); hit("indicators/crossover")
    p = req.prices
    def es(d, sp):
        m = 2 / (sp + 1); e = mu(d[:sp]); o = [e]
        for i in range(sp, len(d)):
            e = (d[i] - e) * m + e; o.append(e)
        return o
    f = es(p, req.fast_period); s = es(p, req.slow_period)
    ml = min(len(f), len(s)); f = f[-ml:]; s = s[-ml:]
    sg = []
    for i in range(1, ml):
        pv, cu = f[i - 1] - s[i - 1], f[i] - s[i]
        if pv <= 0 and cu > 0: sg.append({"type": "GOLDEN_CROSS", "idx": i})
        elif pv >= 0 and cu < 0: sg.append({"type": "DEATH_CROSS", "idx": i})
    d = f[-1] - s[-1]
    return {
        "signal": "BULLISH" if d > 0 else "BEARISH", "fast_ema": r2(f[-1]), "slow_ema": r2(s[-1]),
        "spread": r4(d), "spread_pct": r4(d / s[-1] * 100) if s[-1] > 0 else 0,
        "last_signals": sg[-5:], "total_crosses": len(sg),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 13: BOND PRICING — $0.008
# ══════════════════════════════════════════════════════════════════════════
class T13In(BaseModel):
    face: float = Field(1000, description="Face/par value of the bond")
    coupon_rate: float = Field(..., description="Annual coupon rate (e.g. 0.05 = 5%)")
    ytm: float = Field(..., description="Yield to maturity (annualized)")
    years: int = Field(..., ge=1, le=100, description="Years to maturity")
    frequency: int = Field(2, ge=1, le=12, description="Coupon payments per year")

@app.post("/v1/fixed-income/bond", tags=["Fixed Income"], dependencies=auth)
async def t13(req: T13In):
    """Bond price, Macaulay/modified duration, convexity, DV01."""
    t0 = time.perf_counter(); hit("fixed-income/bond")
    C = req.face * req.coupon_rate / req.frequency; y = req.ytm / req.frequency; n = req.years * req.frequency
    pr = dn = cn = 0
    for t in range(1, n + 1):
        cf = C + (req.face if t == n else 0); pv = cf / (1 + y) ** t
        pr += pv; dn += t * pv; cn += t * (t + 1) * pv
    md = dn / pr / req.frequency if pr > 0 else 0
    mod = md / (1 + y)
    co = cn / (pr * (1 + y) ** 2) / req.frequency ** 2 if pr > 0 else 0
    return {"price": r4(pr), "premium_discount": r4(pr - req.face),
            "macaulay_duration": r4(md), "modified_duration": r4(mod),
            "convexity": r4(co), "dv01": r4(mod * pr / 10000),
            "ms": r2((time.perf_counter() - t0) * 1000)}

# ══════════════════════════════════════════════════════════════════════════
# TOOL 14: AMORTIZATION — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T14In(BaseModel):
    principal: float = Field(..., gt=0, description="Loan principal amount")
    annual_rate: float = Field(..., ge=0, description="Annual interest rate")
    years: int = Field(..., ge=1, le=50, description="Loan term in years")
    extra_payment: float = Field(0, description="Extra payment per period")

@app.post("/v1/fixed-income/amortization", tags=["Fixed Income"], dependencies=auth)
async def t14(req: T14In):
    """Full amortization schedule with extra payment savings analysis."""
    t0 = time.perf_counter(); hit("fixed-income/amortization")
    r = req.annual_rate / 12; n = req.years * 12
    pmt = req.principal * r * (1 + r) ** n / ((1 + r) ** n - 1) if r > 0 else req.principal / n
    bal = req.principal; ti = 0; m = 0; sc = []
    while bal > 0 and m < n:
        m += 1; it = bal * r; pr = min(pmt - it + req.extra_payment, bal); bal -= pr; ti += it
        if m <= 6 or m % 12 == 0 or bal <= 0:
            sc.append({"month": m, "payment": r2(pmt + req.extra_payment), "principal": r2(pr),
                       "interest": r2(it), "balance": r2(max(0, bal))})
    bi = pmt * n - req.principal
    return {"payment": r2(pmt), "with_extra": r2(pmt + req.extra_payment), "total_interest": r2(ti),
            "months": m, "years": r2(m / 12),
            "interest_saved": r2(bi - ti) if req.extra_payment > 0 else 0,
            "schedule": sc, "ms": r2((time.perf_counter() - t0) * 1000)}

# ══════════════════════════════════════════════════════════════════════════
# TOOL 15: PORTFOLIO OPTIMIZATION — $0.015
# ══════════════════════════════════════════════════════════════════════════
class T15In(BaseModel):
    returns: dict[str, list[float]] = Field(..., description='Named return series per asset, e.g. {"AAPL": [...], "MSFT": [...]}')
    risk_free_rate: float = Field(0.05, description="Annual risk-free rate")
    mode: Literal["max_sharpe", "min_vol", "risk_parity"] = Field("max_sharpe", description="Optimization objective")

@app.post("/v1/portfolio/optimize", tags=["Portfolio"], dependencies=auth)
async def t15(req: T15In):
    """Portfolio optimization: max Sharpe, min vol, or risk parity weights."""
    t0 = time.perf_counter(); hit("portfolio/optimize")
    nm = list(req.returns.keys()); k = len(nm); d = [req.returns[n] for n in nm]
    ml = min(len(x) for x in d); d = [x[:ml] for x in d]
    ms_arr = [mu(x) * 252 for x in d]; vs = [sd(x) * math.sqrt(252) for x in d]
    if req.mode == "risk_parity":
        iv = [1 / v if v > 0 else 0 for v in vs]; t = sum(iv)
        w = [x / t for x in iv] if t > 0 else [1 / k] * k
    else:
        w = [1 / k] * k
        for _ in range(300):
            pr = sum(wi * mi for wi, mi in zip(w, ms_arr))
            pv = math.sqrt(sum(w[i] * w[j] * cv(d[i], d[j]) * 252 for i in range(k) for j in range(k))) or 1e-10
            gr = [0.0] * k
            for i in range(k):
                dv = sum(w[j] * cv(d[i], d[j]) * 252 for j in range(k)) / pv
                gr[i] = -(ms_arr[i] * pv - (pr - req.risk_free_rate) * dv) / pv ** 2 if req.mode == "max_sharpe" else dv
            w = [max(0, wi - 0.01 * gi) for wi, gi in zip(w, gr)]
            s = sum(w); w = [wi / s for wi in w] if s > 0 else [1 / k] * k
    pr = sum(wi * mi for wi, mi in zip(w, ms_arr))
    pv = math.sqrt(sum(w[i] * w[j] * cv(d[i], d[j]) * 252 for i in range(k) for j in range(k))) or 1e-10
    return {"weights": {nm[i]: r4(w[i]) for i in range(k)}, "return": r4(pr), "vol": r4(pv),
            "sharpe": r4((pr - req.risk_free_rate) / pv), "mode": req.mode,
            "ms": r2((time.perf_counter() - t0) * 1000)}


# ══════════════════════════════════════════════════════════════════════════
# TOOL 16: BINOMIAL TREE — $0.008
# ══════════════════════════════════════════════════════════════════════════
class T16In(BaseModel):
    S: float = Field(..., gt=0, description="Spot price of the underlying asset")
    K: float = Field(..., gt=0, description="Strike price")
    T: float = Field(..., gt=0, le=30, description="Time to expiration in years")
    r: float = Field(0.05, description="Risk-free interest rate (annualized)")
    sigma: float = Field(..., gt=0, description="Volatility (annualized)")
    q: float = Field(0, description="Continuous dividend yield")
    type: Literal["call", "put"] = Field("call", description="Option type")
    exercise: Literal["american", "european"] = Field("european", description="Exercise style")
    # Cap reduced 2026-05-14 from 500 to 200 — convergence at 200 steps is
    # below typical option bid/ask spread (~0.1-0.25% error vs 0.05% at 500).
    steps: int = Field(100, ge=1, le=200, description="Number of tree steps (1-200; default 100 textbook standard)")

@app.post("/v1/derivatives/binomial-tree", tags=["Derivatives"], dependencies=auth)
async def t16(req: T16In):
    """CRR binomial tree pricing for American and European options."""
    t0 = time.perf_counter(); hit("derivatives/binomial-tree")
    S, K, T, r, sig, q, cp, ex, N = req.S, req.K, req.T, req.r, req.sigma, req.q, req.type, req.exercise, req.steps
    dt = T / N; u = math.exp(sig * math.sqrt(dt)); d = 1 / u
    p = (math.exp((r - q) * dt) - d) / (u - d); disc = math.exp(-r * dt)
    # Terminal payoffs
    prices = [S * u ** (N - j) * d ** j for j in range(N + 1)]
    if cp == "call":
        vals = [max(0, px - K) for px in prices]
    else:
        vals = [max(0, K - px) for px in prices]
    # Backward induction — save step-1 values for delta before they're overwritten
    fu = fd = 0.0
    for i in range(N - 1, -1, -1):
        for j in range(i + 1):
            vals[j] = disc * (p * vals[j] + (1 - p) * vals[j + 1])
            if ex == "american":
                spot = S * u ** (i - j) * d ** j
                intrinsic = max(0, spot - K) if cp == "call" else max(0, K - spot)
                vals[j] = max(vals[j], intrinsic)
        if i == 1:
            fu, fd = vals[0], vals[1]
    price = vals[0]
    # European BS for comparison
    sT = math.sqrt(T); d1 = (math.log(S / K) + (r - q + sig ** 2 / 2) * T) / (sig * sT); d2 = d1 - sig * sT
    eqT, erT = math.exp(-q * T), math.exp(-r * T)
    if cp == "call":
        bs_price = S * eqT * ncdf(d1) - K * erT * ncdf(d2)
    else:
        bs_price = K * erT * ncdf(-d2) - S * eqT * ncdf(-d1)
    early_premium = price - bs_price if ex == "american" else 0
    # Delta from step-1 up and down values
    delta = (fu - fd) / (S * u - S * d) if N >= 1 else 0
    return {
        "price": r4(price), "bs_price": r4(bs_price), "early_exercise_premium": r4(max(0, early_premium)),
        "delta": r6(delta), "steps": N, "exercise": ex,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 17: BARRIER OPTION — $0.008
# ══════════════════════════════════════════════════════════════════════════
class T17In(BaseModel):
    S: float = Field(..., gt=0, description="Spot price of the underlying asset")
    K: float = Field(..., gt=0, description="Strike price")
    H: float = Field(..., gt=0, description="Barrier level")
    T: float = Field(..., gt=0, le=30, description="Time to expiration in years")
    r: float = Field(0.05, description="Risk-free interest rate (annualized)")
    sigma: float = Field(..., gt=0, description="Volatility (annualized)")
    q: float = Field(0, description="Continuous dividend yield")
    type: Literal["call", "put"] = Field("call", description="Option type")
    barrier_type: Literal["up-in", "up-out", "down-in", "down-out"] = Field(
        "down-out", description="Barrier type: up/down + in/out")
    rebate: float = Field(0, description="Rebate paid if barrier is hit (for out) or not hit (for in)")

@app.post("/v1/derivatives/barrier-option", tags=["Derivatives"], dependencies=auth)
async def t17(req: T17In):
    """Barrier option pricing using analytical formulas."""
    t0 = time.perf_counter(); hit("derivatives/barrier-option")
    S, K, H, T, r, sig, q = req.S, req.K, req.H, req.T, req.r, req.sigma, req.q
    cp, bt = req.type, req.barrier_type
    if T <= 0 or sig <= 0:
        raise HTTPException(400, "T and sigma must be > 0")
    sT = math.sqrt(T)
    lam = (r - q + sig ** 2 / 2) / (sig ** 2)
    y = math.log(H ** 2 / (S * K)) / (sig * sT) + lam * sig * sT
    x1 = math.log(S / H) / (sig * sT) + lam * sig * sT
    y1 = math.log(H / S) / (sig * sT) + lam * sig * sT
    # Vanilla BS price
    d1 = (math.log(S / K) + (r - q + sig ** 2 / 2) * T) / (sig * sT); d2 = d1 - sig * sT
    eqT, erT = math.exp(-q * T), math.exp(-r * T)
    if cp == "call":
        vanilla = S * eqT * ncdf(d1) - K * erT * ncdf(d2)
    else:
        vanilla = K * erT * ncdf(-d2) - S * eqT * ncdf(-d1)
    # Simplified barrier pricing via reflection principle
    ratio = H / S
    mu_val = (r - q - sig ** 2 / 2) / (sig ** 2)
    if bt == "down-out" and cp == "call":
        if S <= H:
            price = req.rebate
        elif K > H:
            price = vanilla - (ratio ** (2 * lam)) * (S * eqT * ncdf(y) - K * erT * ncdf(y - sig * sT))
            price = max(0, price)
        else:
            A = S * eqT * ncdf(x1) - K * erT * ncdf(x1 - sig * sT)
            C = (ratio ** (2 * lam)) * (S * eqT * ncdf(y1) - K * erT * ncdf(y1 - sig * sT))
            price = max(0, A - C)
    elif bt == "down-in" and cp == "call":
        if S <= H:
            price = vanilla
        else:
            do_price = vanilla - (ratio ** (2 * lam)) * (S * eqT * ncdf(y) - K * erT * ncdf(y - sig * sT))
            do_price = max(0, do_price)
            price = max(0, vanilla - do_price)
    elif bt == "up-out" and cp == "put":
        if S >= H:
            price = req.rebate
        elif K < H:
            price = vanilla - (ratio ** (2 * lam)) * (-S * eqT * ncdf(-y) + K * erT * ncdf(-y + sig * sT))
            price = max(0, price)
        else:
            price = max(0, vanilla - (ratio ** (2 * lam)) * (-S * eqT * ncdf(-y1) + K * erT * ncdf(-y1 + sig * sT)))
    elif bt == "up-in" and cp == "put":
        if S >= H:
            price = vanilla
        else:
            uo_price = vanilla - (ratio ** (2 * lam)) * (-S * eqT * ncdf(-y) + K * erT * ncdf(-y + sig * sT))
            uo_price = max(0, uo_price)
            price = max(0, vanilla - uo_price)
    else:
        # For other combinations, use Monte Carlo fallback
        n_sims = 5000; steps = 252; dt_mc = T / steps; hit_count = 0; payoff_sum = 0
        for _ in range(n_sims):
            s_val = S; knocked = False
            for __ in range(steps):
                s_val *= math.exp((r - q - sig ** 2 / 2) * dt_mc + sig * math.sqrt(dt_mc) * bm())
                if "up" in bt and s_val >= H:
                    knocked = True
                elif "down" in bt and s_val <= H:
                    knocked = True
            if cp == "call":
                payoff = max(0, s_val - K)
            else:
                payoff = max(0, K - s_val)
            if "in" in bt:
                payoff_sum += payoff if knocked else req.rebate
            else:
                payoff_sum += payoff if not knocked else req.rebate
        price = erT * payoff_sum / n_sims
    return {
        "price": r4(price), "vanilla_price": r4(vanilla), "barrier": H, "barrier_type": bt,
        "discount_vs_vanilla": r4(vanilla - price),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 18: ASIAN OPTION — $0.008
# ══════════════════════════════════════════════════════════════════════════
class T18In(BaseModel):
    S: float = Field(..., gt=0, description="Spot price of the underlying asset")
    K: float = Field(..., gt=0, description="Strike price")
    T: float = Field(..., gt=0, le=30, description="Time to expiration in years")
    r: float = Field(0.05, description="Risk-free interest rate (annualized)")
    sigma: float = Field(..., gt=0, description="Volatility (annualized)")
    q: float = Field(0, description="Continuous dividend yield")
    type: Literal["call", "put"] = Field("call", description="Option type")
    averaging: Literal["geometric", "arithmetic"] = Field(
        "geometric", description="Averaging method for the Asian option")
    observations: int = Field(12, ge=2, description="Number of averaging observations")

@app.post("/v1/derivatives/asian-option", tags=["Derivatives"], dependencies=auth)
async def t18(req: T18In):
    """Asian option pricing: geometric closed-form or arithmetic approximation."""
    t0 = time.perf_counter(); hit("derivatives/asian-option")
    S, K, T, r, sig, q, cp, avg, n = req.S, req.K, req.T, req.r, req.sigma, req.q, req.type, req.averaging, req.observations
    if T <= 0 or sig <= 0:
        raise HTTPException(400, "T and sigma must be > 0")
    # Geometric Asian has closed-form solution
    sig_a = sig * math.sqrt((2 * n + 1) / (6 * (n + 1)))
    r_a = (n + 1) / (2 * n) * (r - q - sig ** 2 / 2) + 0.5 * sig_a ** 2
    d1_g = (math.log(S / K) + (r_a + sig_a ** 2 / 2) * T) / (sig_a * math.sqrt(T))
    d2_g = d1_g - sig_a * math.sqrt(T)
    erT = math.exp(-r * T)
    if cp == "call":
        geo_price = erT * (S * math.exp(r_a * T) * ncdf(d1_g) - K * ncdf(d2_g))
    else:
        geo_price = erT * (K * ncdf(-d2_g) - S * math.exp(r_a * T) * ncdf(-d1_g))
    geo_price = max(0, geo_price)
    if avg == "geometric":
        price = geo_price
    else:
        # Turnbull-Wakeman moment-matching for arithmetic Asian
        dt_tw = T / n
        M1 = S * (math.exp((r - q) * dt_tw) * (1 - math.exp((r - q) * T)) / (1 - math.exp((r - q) * dt_tw))) / n if abs(r - q) > 1e-10 else S
        # Second moment approximation
        sig2T = sig ** 2 * T * (2 * n + 1) / (6 * (n + 1))
        adj_vol = math.sqrt(sig2T / T)
        d1_a = (math.log(M1 / K) + adj_vol ** 2 * T / 2) / (adj_vol * math.sqrt(T))
        d2_a = d1_a - adj_vol * math.sqrt(T)
        if cp == "call":
            price = erT * (M1 * ncdf(d1_a) - K * ncdf(d2_a))
        else:
            price = erT * (K * ncdf(-d2_a) - M1 * ncdf(-d1_a))
        price = max(0, price)
    return {
        "price": r4(price), "geometric_price": r4(geo_price), "averaging": avg,
        "observations": n, "equivalent_vol": r4(sig_a),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 19: LOOKBACK OPTION — $0.008
# ══════════════════════════════════════════════════════════════════════════
class T19In(BaseModel):
    S: float = Field(..., gt=0, description="Current spot price")
    T: float = Field(..., gt=0, le=30, description="Time to expiration in years")
    r: float = Field(0.05, description="Risk-free interest rate (annualized)")
    sigma: float = Field(..., gt=0, description="Volatility (annualized)")
    q: float = Field(0, description="Continuous dividend yield")
    type: Literal["call", "put"] = Field("call", description="Option type")
    lookback_type: Literal["floating", "fixed"] = Field(
        "floating", description="Floating strike or fixed strike lookback")
    K: Optional[float] = Field(None, description="Fixed strike price (required for fixed lookback)")
    S_min: Optional[float] = Field(None, description="Minimum price observed so far (for floating call)")
    S_max: Optional[float] = Field(None, description="Maximum price observed so far (for floating put)")

@app.post("/v1/derivatives/lookback-option", tags=["Derivatives"], dependencies=auth)
async def t19(req: T19In):
    """Lookback option pricing (floating/fixed strike)."""
    t0 = time.perf_counter(); hit("derivatives/lookback-option")
    S, T, r, sig, q = req.S, req.T, req.r, req.sigma, req.q
    if T <= 0 or sig <= 0:
        raise HTTPException(400, "T and sigma must be > 0")
    sT = math.sqrt(T)
    erT = math.exp(-r * T); eqT = math.exp(-q * T)
    if req.lookback_type == "floating":
        # Floating strike lookback (Goldman-Sosin-Gatto 1979 / Haug 2007)
        b = r - q  # cost of carry
        if req.type == "call":
            S_min = req.S_min if req.S_min else S
            a1 = (math.log(S / S_min) + (b + sig ** 2 / 2) * T) / (sig * sT)
            a2 = a1 - sig * sT
            if abs(b) > 1e-10:
                Y = 2 * b / sig ** 2
                a3 = (math.log(S / S_min) + (-b + sig ** 2 / 2) * T) / (sig * sT)
                price = (S * eqT * ncdf(a1) - S_min * erT * ncdf(a2)
                         + S * sig ** 2 / (2 * b) * (
                             -erT * ncdf(-a1)
                             + erT * (S_min / S) ** Y * ncdf(-a3)))
            else:
                price = S * eqT * ncdf(a1) - S_min * erT * ncdf(a2) + S * sig * sT * (npdf(a1) + a1 * ncdf(a1))
        else:
            S_max = req.S_max if req.S_max else S
            b1 = (math.log(S / S_max) + (b + sig ** 2 / 2) * T) / (sig * sT)
            b2 = b1 - sig * sT
            if abs(b) > 1e-10:
                Y = 2 * b / sig ** 2
                b3 = (math.log(S / S_max) + (-b + sig ** 2 / 2) * T) / (sig * sT)
                price = (S_max * erT * ncdf(-b2) - S * eqT * ncdf(-b1)
                         + S * sig ** 2 / (2 * b) * (
                             erT * ncdf(b1)
                             - erT * (S_max / S) ** Y * ncdf(b3)))
            else:
                price = S_max * erT * ncdf(-b2) - S * eqT * ncdf(-b1) + S * sig * sT * (npdf(-b1) - b1 * ncdf(-b1))
    else:
        # Fixed strike lookback — use Monte Carlo
        K = req.K if req.K else S
        n_sims = 5000; steps = int(T * 252); dt_mc = T / steps; payoff_sum = 0
        for _ in range(n_sims):
            s_val = S; s_max_sim = S; s_min_sim = S
            for __ in range(steps):
                s_val *= math.exp((r - q - sig ** 2 / 2) * dt_mc + sig * math.sqrt(dt_mc) * bm())
                s_max_sim = max(s_max_sim, s_val)
                s_min_sim = min(s_min_sim, s_val)
            if req.type == "call":
                payoff_sum += max(0, s_max_sim - K)
            else:
                payoff_sum += max(0, K - s_min_sim)
        price = erT * payoff_sum / n_sims
    price = max(0, price)
    return {
        "price": r4(price), "lookback_type": req.lookback_type,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 20: OPTION CHAIN ANALYSIS — $0.015
# ══════════════════════════════════════════════════════════════════════════
class ChainEntry(BaseModel):
    strike: float = Field(..., description="Strike price")
    call_bid: float = Field(0, description="Call bid price")
    call_ask: float = Field(0, description="Call ask price")
    put_bid: float = Field(0, description="Put bid price")
    put_ask: float = Field(0, description="Put ask price")
    call_oi: int = Field(0, description="Call open interest")
    put_oi: int = Field(0, description="Put open interest")
    call_volume: int = Field(0, description="Call volume")
    put_volume: int = Field(0, description="Put volume")

class T20In(BaseModel):
    chain: list[ChainEntry] = Field(..., description="Array of option chain entries")
    spot: float = Field(..., description="Current spot price of the underlying")
    r: float = Field(0.05, description="Risk-free interest rate")
    T: float = Field(0.0833, description="Time to expiration in years")

@app.post("/v1/derivatives/option-chain-analysis", tags=["Derivatives"], dependencies=auth)
async def t20(req: T20In):
    """Option chain analytics: skew, max pain, put-call ratios."""
    t0 = time.perf_counter(); hit("derivatives/option-chain-analysis")
    chain = req.chain; spot = req.spot
    total_call_vol = sum(e.call_volume for e in chain)
    total_put_vol = sum(e.put_volume for e in chain)
    total_call_oi = sum(e.call_oi for e in chain)
    total_put_oi = sum(e.put_oi for e in chain)
    pcr_vol = total_put_vol / total_call_vol if total_call_vol > 0 else 0
    pcr_oi = total_put_oi / total_call_oi if total_call_oi > 0 else 0
    # Max pain
    best_pain = None; best_strike = chain[0].strike if chain else 0
    for entry in chain:
        pain = 0
        for e in chain:
            call_mid = (e.call_bid + e.call_ask) / 2
            put_mid = (e.put_bid + e.put_ask) / 2
            if entry.strike > e.strike:
                pain += e.call_oi * (entry.strike - e.strike)
            elif entry.strike < e.strike:
                pain += e.put_oi * (e.strike - entry.strike)
        if best_pain is None or pain < best_pain:
            best_pain = pain; best_strike = entry.strike
    # ATM implied vol estimate (using mid of nearest strike)
    atm_entry = min(chain, key=lambda e: abs(e.strike - spot))
    atm_call_mid = (atm_entry.call_bid + atm_entry.call_ask) / 2
    atm_put_mid = (atm_entry.put_bid + atm_entry.put_ask) / 2
    # Rough IV from ATM straddle price
    straddle = atm_call_mid + atm_put_mid
    atm_iv = straddle / (spot * 0.798 * math.sqrt(req.T)) if req.T > 0 else 0  # Brenner-Subrahmanyam approx
    # IV skew (compare OTM puts to OTM calls)
    otm_puts = [e for e in chain if e.strike < spot * 0.95]
    otm_calls = [e for e in chain if e.strike > spot * 1.05]
    avg_put_mid = mu([(e.put_bid + e.put_ask) / 2 for e in otm_puts]) if otm_puts else 0
    avg_call_mid = mu([(e.call_bid + e.call_ask) / 2 for e in otm_calls]) if otm_calls else 0
    skew = avg_put_mid - avg_call_mid
    # Volume-weighted strike
    total_vol = total_call_vol + total_put_vol
    vw_strike = sum(e.strike * (e.call_volume + e.put_volume) for e in chain) / total_vol if total_vol > 0 else spot
    return {
        "put_call_ratio_volume": r4(pcr_vol), "put_call_ratio_oi": r4(pcr_oi),
        "max_pain_strike": r2(best_strike), "atm_iv_approx": r4(atm_iv),
        "skew_metric": r4(skew), "volume_weighted_strike": r2(vw_strike),
        "total_volume": total_call_vol + total_put_vol, "total_oi": total_call_oi + total_put_oi,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 21: PUT-CALL PARITY — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T21In(BaseModel):
    call_price: float = Field(..., description="Observed call option price")
    put_price: float = Field(..., description="Observed put option price")
    S: float = Field(..., description="Spot price of the underlying")
    K: float = Field(..., description="Strike price")
    T: float = Field(..., description="Time to expiration in years")
    r: float = Field(0.05, description="Risk-free interest rate (annualized)")
    q: float = Field(0, description="Continuous dividend yield")

@app.post("/v1/derivatives/put-call-parity", tags=["Derivatives"], dependencies=auth)
async def t21(req: T21In):
    """Put-call parity check and arbitrage detection."""
    t0 = time.perf_counter(); hit("derivatives/put-call-parity")
    S, K, T, r, q = req.S, req.K, req.T, req.r, req.q
    erT = math.exp(-r * T); eqT = math.exp(-q * T)
    # C - P = S*e^(-qT) - K*e^(-rT)
    lhs = req.call_price - req.put_price
    rhs = S * eqT - K * erT
    deviation = lhs - rhs
    theo_call = req.put_price + S * eqT - K * erT
    theo_put = req.call_price - S * eqT + K * erT
    if abs(deviation) < 0.02:
        arb = "NONE"
    elif deviation > 0:
        arb = "SELL_CALL_BUY_PUT_BUY_STOCK"
    else:
        arb = "BUY_CALL_SELL_PUT_SELL_STOCK"
    return {
        "parity_holds": abs(deviation) < 0.10, "deviation": r4(deviation), "deviation_pct": r4(deviation / S * 100),
        "theoretical_call": r4(theo_call), "theoretical_put": r4(theo_put),
        "arbitrage_signal": arb, "arbitrage_profit": r4(abs(deviation)),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 22: VOLATILITY SURFACE — $0.015
# ══════════════════════════════════════════════════════════════════════════
class VolPoint(BaseModel):
    strike: float = Field(..., description="Strike price")
    expiry_days: float = Field(..., description="Days to expiration")
    implied_vol: float = Field(..., description="Implied volatility at this strike and expiry")

class T22In(BaseModel):
    market_data: list[VolPoint] = Field(..., description="Array of implied vol data points")
    spot: float = Field(..., description="Current spot price")
    interpolation: Literal["linear", "cubic"] = Field(
        "linear", description="Surface interpolation method")

@app.post("/v1/derivatives/volatility-surface", tags=["Derivatives"], dependencies=auth)
async def t22(req: T22In):
    """Build implied volatility surface from market data."""
    t0 = time.perf_counter(); hit("derivatives/volatility-surface")
    data = req.market_data; spot = req.spot
    expiries = sorted(set(d.expiry_days for d in data))
    strikes = sorted(set(d.strike for d in data))
    # Build grid
    vol_map = {}
    for d in data:
        vol_map[(d.strike, d.expiry_days)] = d.implied_vol
    # ATM term structure
    atm_strikes = sorted(strikes, key=lambda k: abs(k - spot))
    atm_strike = atm_strikes[0] if atm_strikes else spot
    atm_term = [{"expiry_days": e, "vol": r4(vol_map.get((atm_strike, e), 0))} for e in expiries if (atm_strike, e) in vol_map]
    # Skew per expiry
    skew_by_expiry = []
    for e in expiries:
        vols_at_exp = [(k, vol_map[(k, e)]) for k in strikes if (k, e) in vol_map]
        if len(vols_at_exp) >= 2:
            otm_put_vol = [v for k, v in vols_at_exp if k < spot * 0.95]
            otm_call_vol = [v for k, v in vols_at_exp if k > spot * 1.05]
            skew = (mu(otm_put_vol) - mu(otm_call_vol)) if otm_put_vol and otm_call_vol else 0
            skew_by_expiry.append({"expiry_days": e, "skew": r4(skew), "n_strikes": len(vols_at_exp)})
    # Surface grid
    surface = []
    for e in expiries:
        row = {"expiry_days": e, "vols": []}
        for k in strikes:
            vol = vol_map.get((k, e))
            if vol is not None:
                row["vols"].append({"strike": k, "vol": r4(vol)})
            elif req.interpolation == "linear" and len([s for s in strikes if (s, e) in vol_map]) >= 2:
                known = [(s, vol_map[(s, e)]) for s in strikes if (s, e) in vol_map]
                known.sort()
                # Simple linear interpolation
                for idx in range(len(known) - 1):
                    if known[idx][0] <= k <= known[idx + 1][0]:
                        frac = (k - known[idx][0]) / (known[idx + 1][0] - known[idx][0])
                        interp = known[idx][1] + frac * (known[idx + 1][1] - known[idx][1])
                        row["vols"].append({"strike": k, "vol": r4(interp), "interpolated": True})
                        break
        surface.append(row)
    return {
        "surface": surface, "atm_term_structure": atm_term, "skew_by_expiry": skew_by_expiry,
        "n_points": len(data), "n_expiries": len(expiries), "n_strikes": len(strikes),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 23: LINEAR REGRESSION — $0.008
# ══════════════════════════════════════════════════════════════════════════
class T23In(BaseModel):
    x: list[list[float]] | list[float] = Field(
        ..., description="Independent variable(s): 1D array for simple, 2D for multiple regression")
    y: list[float] = Field(..., description="Dependent variable array")
    confidence_level: float = Field(0.95, description="Confidence level for intervals (e.g. 0.95 = 95%)")

@app.post("/v1/stats/linear-regression", tags=["Statistics"], dependencies=auth)
async def t23(req: T23In):
    """OLS linear regression with R-squared, t-stats, and standard errors."""
    t0 = time.perf_counter(); hit("stats/linear-regression")
    y = req.y; n = len(y)
    # Normalize x to 2D
    if isinstance(req.x[0], (int, float)):
        X = [[1.0, float(v)] for v in req.x]
        p = 2
    else:
        X = [[1.0] + [float(v) for v in row] for row in req.x]
        p = len(X[0])
    if n < p:
        raise HTTPException(400, f"Need at least {p} observations")
    Xt = mat_T(X)
    XtX = mat_mul(Xt, [[X[i][j] for j in range(p)] for i in range(n)])
    Xty = mat_vec(Xt, y)
    try:
        beta = solve_linear_system(XtX, Xty)
    except ValueError:
        raise HTTPException(400, "Singular matrix - collinear predictors")
    y_hat = mat_vec(X, beta)
    residuals = [y[i] - y_hat[i] for i in range(n)]
    ss_res = sum(r_val ** 2 for r_val in residuals)
    y_mean = mu(y)
    ss_tot = sum((yi - y_mean) ** 2 for yi in y)
    r_sq = 1 - ss_res / ss_tot if ss_tot > 0 else 0
    adj_r_sq = 1 - (1 - r_sq) * (n - 1) / (n - p) if n > p else r_sq
    mse = ss_res / (n - p) if n > p else 0
    try:
        XtX_inv = mat_inv(XtX)
        se = [math.sqrt(max(0, mse * XtX_inv[j][j])) for j in range(p)]
    except ValueError:
        se = [0.0] * p
    t_stats = [beta[j] / se[j] if se[j] > 0 else 0 for j in range(p)]
    p_values = [2 * (1 - t_cdf(abs(t_val), n - p)) for t_val in t_stats]
    f_stat = ((ss_tot - ss_res) / (p - 1)) / mse if p > 1 and mse > 0 else 0
    return {
        "coefficients": [r6(b) for b in beta[1:]], "intercept": r6(beta[0]),
        "r_squared": r4(r_sq), "adjusted_r_squared": r4(adj_r_sq),
        "standard_errors": [r6(s) for s in se], "t_statistics": [r4(t) for t in t_stats],
        "p_values": [r6(p) for p in p_values], "f_statistic": r4(f_stat),
        "mse": r6(mse), "n": n, "predictors": p - 1,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 24: POLYNOMIAL REGRESSION — $0.008
# ══════════════════════════════════════════════════════════════════════════
class T24In(BaseModel):
    x: list[float] = Field(..., description="Independent variable array")
    y: list[float] = Field(..., description="Dependent variable array")
    degree: int = Field(2, ge=1, le=10, description="Polynomial degree (1=linear, 2=quadratic, etc.)")

@app.post("/v1/stats/polynomial-regression", tags=["Statistics"], dependencies=auth)
async def t24(req: T24In):
    """Polynomial regression of degree n with goodness-of-fit metrics."""
    t0 = time.perf_counter(); hit("stats/polynomial-regression")
    x, y, deg = req.x, req.y, req.degree; n = len(y)
    if n <= deg:
        raise HTTPException(400, f"Need > {deg} observations for degree {deg}")
    # Build Vandermonde matrix
    X = [[xi ** j for j in range(deg + 1)] for xi in x]
    p = deg + 1
    Xt = mat_T(X)
    XtX = mat_mul(Xt, X)
    Xty = mat_vec(Xt, y)
    try:
        beta = solve_linear_system(XtX, Xty)
    except ValueError:
        raise HTTPException(400, "Singular matrix")
    y_hat = [sum(beta[j] * xi ** j for j in range(p)) for xi in x]
    residuals = [y[i] - y_hat[i] for i in range(n)]
    ss_res = sum(r_val ** 2 for r_val in residuals)
    y_mean = mu(y)
    ss_tot = sum((yi - y_mean) ** 2 for yi in y)
    r_sq = 1 - ss_res / ss_tot if ss_tot > 0 else 0
    adj_r_sq = 1 - (1 - r_sq) * (n - 1) / (n - p) if n > p else r_sq
    ll = -n / 2 * (math.log(2 * math.pi * ss_res / n) + 1) if ss_res > 0 else 0
    aic = 2 * p - 2 * ll
    bic = p * math.log(n) - 2 * ll
    return {
        "coefficients": [r6(b) for b in beta], "degree": deg,
        "r_squared": r4(r_sq), "adjusted_r_squared": r4(adj_r_sq),
        "aic": r2(aic), "bic": r2(bic), "mse": r6(ss_res / n),
        "predicted": [r4(v) for v in y_hat[:20]],
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 25: COINTEGRATION TEST — $0.008
# ══════════════════════════════════════════════════════════════════════════
class T25In(BaseModel):
    series_x: list[float] = Field(..., description="First time series")
    series_y: list[float] = Field(..., description="Second time series")
    significance: Literal["0.01", "0.05", "0.10"] = Field(
        "0.05", description="Significance level for the test")

@app.post("/v1/stats/cointegration", tags=["Statistics"], dependencies=auth)
async def t25(req: T25In):
    """Engle-Granger cointegration test with hedge ratio and half-life."""
    t0 = time.perf_counter(); hit("stats/cointegration")
    x, y = req.series_x, req.series_y
    n = min(len(x), len(y)); x = x[:n]; y = y[:n]
    if n < 20:
        raise HTTPException(400, "Need >= 20 observations")
    # Step 1: OLS regression y = alpha + beta*x
    mx, my = mu(x), mu(y)
    beta = sum((x[i] - mx) * (y[i] - my) for i in range(n)) / sum((x[i] - mx) ** 2 for i in range(n))
    alpha = my - beta * mx
    spread = [y[i] - alpha - beta * x[i] for i in range(n)]
    # Step 2: ADF test on spread
    ds = [spread[i] - spread[i - 1] for i in range(1, len(spread))]
    lag_spread = spread[:-1]
    ns = len(ds)
    # OLS: ds = c + gamma * lag_spread + error (with intercept for proper ADF)
    sl = mu(lag_spread); sd_l = mu(ds)
    ss_lag = sum((lag_spread[i] - sl) ** 2 for i in range(ns))
    gamma = sum((lag_spread[i] - sl) * (ds[i] - sd_l) for i in range(ns)) / ss_lag if ss_lag > 0 else 0
    intercept_adf = sd_l - gamma * sl
    residuals = [ds[i] - intercept_adf - gamma * lag_spread[i] for i in range(ns)]
    se_gamma = math.sqrt(sum(r_val ** 2 for r_val in residuals) / (ns - 2) / ss_lag) if ss_lag > 0 and ns > 2 else 1
    adf_stat = gamma / se_gamma if se_gamma > 0 else 0
    # Critical values for EG test (approximate)
    crit = {"0.01": -3.90, "0.05": -3.34, "0.10": -3.04}
    critical = crit[req.significance]
    cointegrated = adf_stat < critical
    # Half-life of mean reversion
    half_life = -math.log(2) / gamma if gamma < 0 else float('inf')
    spread_mean = mu(spread); spread_std = sd(spread)
    return {
        "cointegrated": cointegrated, "adf_statistic": r4(adf_stat),
        "critical_value": critical, "significance": req.significance,
        "hedge_ratio": r6(beta), "intercept": r6(alpha),
        "spread_mean": r4(spread_mean), "spread_std": r4(spread_std),
        "half_life": r2(min(half_life, 9999)), "current_zscore": r4((spread[-1] - spread_mean) / spread_std if spread_std > 0 else 0),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 26: HURST EXPONENT — $0.008
# ══════════════════════════════════════════════════════════════════════════
class T26In(BaseModel):
    # Series cap tightened 2026-05-14 from 10000 to 5000. R/S analysis
    # converges by ~1000 obs; 5000 is generous for any real time series.
    series: list[float] = Field(..., min_length=20, max_length=5000, description="Time series data (max 5000)")
    min_window: int = Field(10, ge=2, description="Minimum R/S window size")
    max_window: Optional[int] = Field(None, description="Maximum R/S window size (defaults to len/2)")

@app.post("/v1/stats/hurst-exponent", tags=["Statistics"], dependencies=auth)
async def t26(req: T26In):
    """Hurst exponent via rescaled range (R/S) analysis."""
    t0 = time.perf_counter(); hit("stats/hurst-exponent")
    data = req.series; n = len(data)
    max_w = req.max_window or n // 2
    log_n = []; log_rs = []
    w = req.min_window
    while w <= max_w:
        rs_vals = []
        for start in range(0, n - w + 1, w):
            chunk = data[start:start + w]
            m = mu(chunk); s_val = sd(chunk)
            if s_val < 1e-14:
                continue
            cumdev = []; running = 0
            for v in chunk:
                running += v - m; cumdev.append(running)
            R = max(cumdev) - min(cumdev)
            rs_vals.append(R / s_val)
        if rs_vals:
            log_n.append(math.log(w)); log_rs.append(math.log(mu(rs_vals)))
        w = int(w * 1.5) if w < 50 else w + max(10, w // 4)
    # Linear regression on log-log
    if len(log_n) < 2:
        raise HTTPException(400, "Not enough windows for R/S analysis")
    mn = mu(log_n); mr = mu(log_rs)
    hurst = sum((log_n[i] - mn) * (log_rs[i] - mr) for i in range(len(log_n))) / sum((log_n[i] - mn) ** 2 for i in range(len(log_n)))
    # R-squared
    ss_res = sum((log_rs[i] - mr - hurst * (log_n[i] - mn)) ** 2 for i in range(len(log_n)))
    ss_tot = sum((log_rs[i] - mr) ** 2 for i in range(len(log_n)))
    r_sq = 1 - ss_res / ss_tot if ss_tot > 0 else 0
    if hurst < 0.4:
        interp = "MEAN_REVERTING"
    elif hurst > 0.6:
        interp = "TRENDING"
    else:
        interp = "RANDOM_WALK"
    return {
        "hurst_exponent": r4(hurst), "interpretation": interp, "r_squared": r4(r_sq),
        "n_windows": len(log_n), "series_length": n,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 27: GARCH(1,1) FORECAST — $0.015
# ══════════════════════════════════════════════════════════════════════════
class T27In(BaseModel):
    returns: list[float] = Field(..., min_length=30, max_length=5000, description="Array of return data (max 5000)")
    forecast_periods: int = Field(5, ge=1, le=252, description="Number of periods to forecast ahead (max 252)")
    mean_model: Literal["zero", "constant"] = Field("zero", description="Mean model specification")

@app.post("/v1/stats/garch-forecast", tags=["Statistics"], dependencies=auth)
async def t27(req: T27In):
    """GARCH(1,1) volatility forecast using maximum likelihood estimation."""
    t0 = time.perf_counter(); hit("stats/garch-forecast")
    R = req.returns; n = len(R)
    m = mu(R) if req.mean_model == "constant" else 0
    eps = [r_val - m for r_val in R]
    sample_var = va(eps)
    def neg_log_likelihood(params):
        omega, alpha, beta = params
        if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
            return 1e10
        h = sample_var
        ll = 0
        for i in range(n):
            if h <= 0:
                return 1e10
            ll += -0.5 * (math.log(2 * math.pi) + math.log(h) + eps[i] ** 2 / h)
            h = omega + alpha * eps[i] ** 2 + beta * h
        return -ll
    # Initial guess via moment matching
    alpha0 = 0.1; beta0 = 0.85; omega0 = sample_var * (1 - alpha0 - beta0)
    best_params, best_ll = nelder_mead(neg_log_likelihood, [omega0, alpha0, beta0])
    omega, alpha, beta = best_params
    # Ensure valid
    omega = max(1e-10, omega); alpha = max(0, alpha); beta = max(0, beta)
    persistence = alpha + beta
    long_run_var = omega / (1 - persistence) if persistence < 1 else sample_var
    # Compute conditional variance series
    h_series = [sample_var]
    for i in range(n):
        h_next = omega + alpha * eps[i] ** 2 + beta * h_series[-1]
        h_series.append(max(1e-12, h_next))
    # Forecast
    h_forecast = []
    h = h_series[-1]
    for _ in range(req.forecast_periods):
        h = omega + persistence * h
        h_forecast.append(r6(math.sqrt(h) * math.sqrt(252)))
    return {
        "omega": r8(omega), "alpha": r6(alpha), "beta": r6(beta),
        "persistence": r4(persistence),
        "long_run_vol_annualized": r4(math.sqrt(long_run_var) * math.sqrt(252)),
        "current_vol_annualized": r4(math.sqrt(h_series[-1]) * math.sqrt(252)),
        "forecast_vol_annualized": h_forecast,
        "log_likelihood": r2(-best_ll),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 28: Z-SCORE — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T28In(BaseModel):
    series: list[float] = Field(..., min_length=3, max_length=5000, description="Numeric data series (max 5000)")
    window: Optional[int] = Field(None, ge=2, le=5000, description="Rolling window size (null for static z-scores)")
    threshold: float = Field(2.0, description="Z-score threshold for extreme value detection")

@app.post("/v1/stats/zscore", tags=["Statistics"], dependencies=auth)
async def t28(req: T28In):
    """Rolling and static z-scores with extreme value detection."""
    t0 = time.perf_counter(); hit("stats/zscore")
    data = req.series; n = len(data)
    m = mu(data); s = sd(data)
    z_static = [(v - m) / s if s > 0 else 0 for v in data]
    z_rolling = []
    if req.window and req.window < n:
        w = req.window
        for i in range(w - 1, n):
            chunk = data[i - w + 1:i + 1]
            cm = mu(chunk); cs = sd(chunk)
            z_rolling.append(r4((data[i] - cm) / cs if cs > 0 else 0))
    extreme_idx = [i for i, z in enumerate(z_static) if abs(z) > req.threshold]
    return {
        "z_scores": [r4(z) for z in z_static], "rolling_z": z_rolling if z_rolling else None,
        "mean": r6(m), "std_dev": r6(s), "current_zscore": r4(z_static[-1]),
        "extreme_indices": extreme_idx, "extreme_count": len(extreme_idx),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 29: DISTRIBUTION FIT — $0.008
# ══════════════════════════════════════════════════════════════════════════
class T29In(BaseModel):
    data: list[float] = Field(..., min_length=10, description="Array of data to fit distributions to")

@app.post("/v1/stats/distribution-fit", tags=["Statistics"], dependencies=auth)
async def t29(req: T29In):
    """Fit data to common distributions and rank by goodness of fit."""
    t0 = time.perf_counter(); hit("stats/distribution-fit")
    data = sorted(req.data); n = len(data)
    m = mu(data); s = sd(data)
    # Empirical CDF
    ecdf = [(i + 1) / (n + 1) for i in range(n)]
    # Normal fit
    norm_cdf_vals = [ncdf((data[i] - m) / s) if s > 0 else 0.5 for i in range(n)]
    ks_norm = max(abs(ecdf[i] - norm_cdf_vals[i]) for i in range(n))
    ll_norm = sum(-0.5 * (math.log(2 * math.pi * s ** 2) + ((data[i] - m) / s) ** 2) for i in range(n)) if s > 0 else -1e10
    # Lognormal fit (if all positive)
    fits = [{"distribution": "normal", "params": {"mean": r6(m), "std": r6(s)}, "ks_statistic": r6(ks_norm), "log_likelihood": r2(ll_norm)}]
    pos_data = [v for v in data if v > 0]
    if len(pos_data) == n:
        log_data = [math.log(v) for v in data]
        lm = mu(log_data); ls = sd(log_data)
        ln_cdf_vals = [ncdf((math.log(data[i]) - lm) / ls) if ls > 0 else 0.5 for i in range(n)]
        ks_ln = max(abs(ecdf[i] - ln_cdf_vals[i]) for i in range(n))
        ll_ln = sum(-math.log(data[i]) - 0.5 * (math.log(2 * math.pi * ls ** 2) + ((math.log(data[i]) - lm) / ls) ** 2) for i in range(n)) if ls > 0 else -1e10
        fits.append({"distribution": "lognormal", "params": {"mu": r6(lm), "sigma": r6(ls)}, "ks_statistic": r6(ks_ln), "log_likelihood": r2(ll_ln)})
    # Uniform fit
    a, b = data[0], data[-1]
    if b > a:
        unif_cdf_vals = [(data[i] - a) / (b - a) for i in range(n)]
        ks_unif = max(abs(ecdf[i] - unif_cdf_vals[i]) for i in range(n))
        ll_unif = -n * math.log(b - a) if b > a else -1e10
        fits.append({"distribution": "uniform", "params": {"min": r6(a), "max": r6(b)}, "ks_statistic": r6(ks_unif), "log_likelihood": r2(ll_unif)})
    fits.sort(key=lambda f: f["ks_statistic"])
    sk = sum(((v - m) / s) ** 3 for v in data) * n / ((n - 1) * (n - 2)) if s > 0 and n > 2 else 0
    ku = (sum(((v - m) / s) ** 4 for v in data) * n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3))) if s > 0 and n > 3 else 0
    return {
        "best_fit": fits[0]["distribution"], "fits": fits,
        "descriptive": {"mean": r6(m), "median": r4(data[n // 2]), "std": r6(s),
                        "skewness": r4(sk), "kurtosis": r4(ku), "min": r4(data[0]), "max": r4(data[-1])},
        "n": n, "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 30: CORRELATION MATRIX (advanced) — $0.015
# ══════════════════════════════════════════════════════════════════════════
class T30In(BaseModel):
    series: dict[str, list[float]] = Field(
        ..., description='Named data series, e.g. {"A": [...], "B": [...]}')
    method: Literal["pearson", "spearman"] = Field("pearson", description="Correlation method")
    include_eigenvalues: bool = Field(
        False, description="Whether to compute eigenvalue decomposition")

@app.post("/v1/stats/correlation-matrix", tags=["Statistics"], dependencies=auth)
async def t30(req: T30In):
    """Correlation and covariance matrices with optional eigenvalue decomposition."""
    t0 = time.perf_counter(); hit("stats/correlation-matrix")
    nm = list(req.series.keys()); d = [req.series[n] for n in nm]
    k = len(nm); ml = min(len(x) for x in d); d = [x[:ml] for x in d]
    if req.method == "spearman":
        d = [_rank(x) for x in d]
    means = [mu(x) for x in d]
    stds = [sd(x) for x in d]
    cov_mat = [[cv(d[i], d[j]) for j in range(k)] for i in range(k)]
    corr_mat = [[r4(cov_mat[i][j] / (stds[i] * stds[j])) if stds[i] > 0 and stds[j] > 0 else (1.0 if i == j else 0.0)
                 for j in range(k)] for i in range(k)]
    result = {
        "assets": nm, "correlation": corr_mat,
        "covariance": [[r8(cov_mat[i][j]) for j in range(k)] for i in range(k)],
        "method": req.method, "n": ml
    }
    if req.include_eigenvalues and k <= 20:
        # Power iteration for eigenvalues
        eigenvalues = []
        A = [row[:] for row in corr_mat]
        for _ in range(k):
            v = [random.gauss(0, 1) for __ in range(k)]
            for ___ in range(100):
                Av = mat_vec(A, v)
                norm = math.sqrt(sum(x ** 2 for x in Av)) or 1e-10
                v = [x / norm for x in Av]
            Av = mat_vec(A, v)
            eigenval = sum(v[i] * Av[i] for i in range(k))
            eigenvalues.append(r4(eigenval))
            for i in range(k):
                for j in range(k):
                    A[i][j] -= eigenval * v[i] * v[j]
        eigenvalues.sort(reverse=True)
        result["eigenvalues"] = eigenvalues
        result["condition_number"] = r4(eigenvalues[0] / eigenvalues[-1]) if eigenvalues[-1] != 0 else None
    result["ms"] = r2((time.perf_counter() - t0) * 1000)
    return result

# ══════════════════════════════════════════════════════════════════════════
# TOOL 31: IMPERMANENT LOSS — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T31In(BaseModel):
    initial_price_ratio: float = Field(
        1.0, gt=0, description="Initial price ratio of token A to token B")
    current_price_ratio: float = Field(
        ..., gt=0, description="Current price ratio of token A to token B")
    amm_type: Literal["v2", "v3"] = Field(
        "v2", description="AMM type: v2 (full range) or v3 (concentrated)")
    lower_tick: Optional[float] = Field(
        None, description="Lower price bound (v3 only)")
    upper_tick: Optional[float] = Field(
        None, description="Upper price bound (v3 only)")
    initial_investment: float = Field(
        1000, description="Initial investment value in USD")

@app.post("/v1/crypto/impermanent-loss", tags=["Crypto"], dependencies=auth)
async def t31(req: T31In):
    """Impermanent loss calculator for Uniswap v2/v3 AMM positions."""
    t0 = time.perf_counter(); hit("crypto/impermanent-loss")
    pr = req.current_price_ratio / req.initial_price_ratio
    inv = req.initial_investment
    hold_value = inv * (1 + pr) / 2  # 50/50 portfolio
    if req.amm_type == "v2":
        # LP value = initial_investment * sqrt(price_ratio)
        # IL = 2*sqrt(r)/(1+r) - 1 comparing LP to HODL
        lp_value = inv * math.sqrt(pr)
        il_pct = lp_value / hold_value - 1 if hold_value > 0 else 0
    else:
        # V3 concentrated liquidity
        if not req.lower_tick or not req.upper_tick:
            raise HTTPException(400, "V3 requires lower_tick and upper_tick")
        pa, pb = req.lower_tick, req.upper_tick
        if pr <= pa / req.initial_price_ratio:
            lp_value = inv * pr / req.initial_price_ratio  # All in token B
        elif pr >= pb / req.initial_price_ratio:
            lp_value = inv  # All in token A
        else:
            sqrt_p = math.sqrt(pr * req.initial_price_ratio)
            sqrt_pa = math.sqrt(pa)
            sqrt_pb = math.sqrt(pb)
            L = inv / 2 / (sqrt_p - sqrt_pa + (1 / sqrt_p - 1 / sqrt_pb) * pr * req.initial_price_ratio) if (sqrt_p - sqrt_pa + (1 / sqrt_p - 1 / sqrt_pb) * pr * req.initial_price_ratio) != 0 else inv
            lp_value = L * (sqrt_p - sqrt_pa) + L * (1 / sqrt_p - 1 / sqrt_pb) * pr * req.initial_price_ratio
        il_pct = lp_value / hold_value - 1 if hold_value > 0 else 0
    fee_breakeven_apy = abs(il_pct) * 365 / 30 if il_pct < 0 else 0  # Rough 30-day estimate
    return {
        "impermanent_loss_pct": r4(il_pct * 100), "hold_value": r2(hold_value), "lp_value": r2(lp_value),
        "loss_amount": r2(lp_value - hold_value), "fee_breakeven_apy": r4(fee_breakeven_apy * 100),
        "price_ratio": r4(pr), "amm_type": req.amm_type,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 32: APY/APR CONVERTER — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T32In(BaseModel):
    rate: float = Field(..., description="The rate to convert (as decimal, e.g. 0.12 = 12%)")
    from_type: Literal["apy", "apr"] = Field(
        "apr", description="Input rate type to convert from")
    compounding: Literal["daily", "weekly", "monthly", "quarterly", "continuous"] = Field(
        "daily", description="Compounding frequency")

@app.post("/v1/crypto/apy-apr-convert", tags=["Crypto"], dependencies=auth)
async def t32(req: T32In):
    """Convert between APY and APR with configurable compounding frequency."""
    t0 = time.perf_counter(); hit("crypto/apy-apr-convert")
    periods = {"daily": 365, "weekly": 52, "monthly": 12, "quarterly": 4}
    if req.compounding == "continuous":
        if req.from_type == "apr":
            apr = req.rate; apy = math.exp(apr) - 1
        else:
            apy = req.rate; apr = math.log(1 + apy)
    else:
        n = periods[req.compounding]
        if req.from_type == "apr":
            apr = req.rate; apy = (1 + apr / n) ** n - 1
        else:
            apy = req.rate; apr = n * ((1 + apy) ** (1 / n) - 1)
    eff_daily = (1 + apy) ** (1 / 365) - 1
    cont_rate = math.log(1 + apy)
    double_days = math.log(2) / math.log(1 + eff_daily) if eff_daily > 0 else float('inf')
    return {
        "apy": r6(apy), "apy_pct": r4(apy * 100), "apr": r6(apr), "apr_pct": r4(apr * 100),
        "effective_daily_rate": r8(eff_daily), "continuous_rate": r6(cont_rate),
        "doubling_time_days": r2(double_days), "compounding": req.compounding,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 33: LIQUIDATION PRICE — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T33In(BaseModel):
    entry_price: float = Field(..., description="Position entry price")
    collateral: float = Field(..., description="Collateral amount in USD")
    position_size: float = Field(..., description="Total position size in USD")
    leverage: float = Field(..., description="Leverage multiplier")
    direction: Literal["long", "short"] = Field(
        ..., description="Position direction")
    maintenance_margin_rate: float = Field(
        0.005, description="Maintenance margin rate (e.g. 0.005 = 0.5%)")
    funding_accumulated: float = Field(
        0, description="Accumulated funding payments (negative = paid)")

@app.post("/v1/crypto/liquidation-price", tags=["Crypto"], dependencies=auth)
async def t33(req: T33In):
    """Liquidation price calculator for leveraged positions. Perp positions: funding
    erodes collateral over time — pull the live rate from /v1/live/funding-rates."""
    t0 = time.perf_counter(); hit("crypto/liquidation-price")
    entry, coll, size, lev, dir_ = req.entry_price, req.collateral, req.position_size, req.leverage, req.direction
    mmr = req.maintenance_margin_rate; funding = req.funding_accumulated
    effective_coll = coll - funding
    if dir_ == "long":
        liq = entry * (1 - (effective_coll - size * mmr) / size) if size > 0 else 0
        liq = max(0, liq)
        distance = (entry - liq) / entry if entry > 0 else 0
    else:
        liq = entry * (1 + (effective_coll - size * mmr) / size) if size > 0 else 0
        distance = (liq - entry) / entry if entry > 0 else 0
    margin_ratio = effective_coll / size if size > 0 else 0
    max_loss = effective_coll - size * mmr
    return {
        "liquidation_price": r2(liq), "distance_pct": r4(distance * 100),
        "effective_leverage": r2(lev), "margin_ratio_current": r4(margin_ratio),
        "max_loss_before_liq": r2(max_loss), "direction": dir_,
        "safe_price_range": {"min": r2(liq if dir_ == "long" else 0), "max": r2(liq if dir_ == "short" else entry * 3)},
        "live_data": {
            "note": "Holding a perp? Funding erodes collateral over time and shifts this liq price. Pull the current rate from /v1/live/funding-rates ($0.005).",
            "funding": "/v1/live/funding-rates",
        },
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 34: FUNDING RATE ANALYSIS — $0.005
# ══════════════════════════════════════════════════════════════════════════
class FundingEntry(BaseModel):
    rate: float = Field(..., description="Funding rate for the period (e.g. 0.0001 = 0.01%)")
    timestamp: Optional[str] = Field(None, description="Optional ISO timestamp")

class T34In(BaseModel):
    funding_rates: list[FundingEntry] = Field(
        ..., min_length=3, description="Array of funding rate entries")
    payment_interval_hours: int = Field(
        8, description="Hours between funding payments")
    position_size: Optional[float] = Field(
        None, description="Optional position size for P&L calculation")

@app.post("/v1/crypto/funding-rate", tags=["Crypto"], dependencies=auth)
async def t34(req: T34In):
    """Funding rate analysis with annualization and regime detection."""
    t0 = time.perf_counter(); hit("crypto/funding-rate")
    rates = [f.rate for f in req.funding_rates]; n = len(rates)
    payments_per_year = 365 * 24 / req.payment_interval_hours
    annualized = mu(rates) * payments_per_year
    cumulative = 1
    for r_val in rates:
        cumulative *= (1 + r_val)
    cumulative -= 1
    pos_count = sum(1 for r_val in rates if r_val > 0)
    # Streaks
    max_pos = max_neg = cur_pos = cur_neg = 0
    for r_val in rates:
        if r_val > 0:
            cur_pos += 1; cur_neg = 0; max_pos = max(max_pos, cur_pos)
        elif r_val < 0:
            cur_neg += 1; cur_pos = 0; max_neg = max(max_neg, cur_neg)
        else:
            cur_pos = cur_neg = 0
    mean_r = mu(rates)
    regime = "CONTANGO" if mean_r > 0.0001 else "BACKWARDATION" if mean_r < -0.0001 else "NEUTRAL"
    result = {
        "annualized_rate": r4(annualized), "cumulative_return": r6(cumulative),
        "mean_rate": r6(mean_r), "median_rate": r6(sorted(rates)[n // 2]), "std_rate": r6(sd(rates)),
        "positive_pct": r4(pos_count / n * 100), "max_streak_positive": max_pos, "max_streak_negative": max_neg,
        "regime": regime, "n": n, "ms": r2((time.perf_counter() - t0) * 1000)
    }
    if req.position_size:
        result["carry_pnl"] = r2(req.position_size * cumulative)
    return result

# ══════════════════════════════════════════════════════════════════════════
# TOOL 35: DEX SLIPPAGE — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T35In(BaseModel):
    reserve_a: float = Field(
        ..., gt=0, description="Pool reserve of token A")
    reserve_b: float = Field(
        ..., gt=0, description="Pool reserve of token B")
    trade_amount: float = Field(
        ..., gt=0, description="Amount of input token to swap")
    trade_direction: Literal["a_to_b", "b_to_a"] = Field(
        "a_to_b", description="Swap direction")
    fee_bps: int = Field(
        30, description="DEX fee in basis points (e.g. 30 = 0.3%)")

@app.post("/v1/crypto/dex-slippage", tags=["Crypto"], dependencies=auth)
async def t35(req: T35In):
    """DEX slippage estimator for constant-product AMM (x*y=k)."""
    t0 = time.perf_counter(); hit("crypto/dex-slippage")
    ra, rb, amt, fee = req.reserve_a, req.reserve_b, req.trade_amount, req.fee_bps / 10000
    if req.trade_direction == "a_to_b":
        amt_after_fee = amt * (1 - fee)
        output = rb * amt_after_fee / (ra + amt_after_fee)
        spot_price = rb / ra
        effective_price = output / amt
        price_impact = 1 - effective_price / spot_price
    else:
        amt_after_fee = amt * (1 - fee)
        output = ra * amt_after_fee / (rb + amt_after_fee)
        spot_price = ra / rb
        effective_price = output / amt
        price_impact = 1 - effective_price / spot_price
    fee_amount = amt * fee
    min_output_1pct = output * 0.99
    return {
        "output_amount": r4(output), "effective_price": r6(effective_price), "spot_price": r6(spot_price),
        "price_impact_pct": r4(price_impact * 100), "slippage_bps": r2(price_impact * 10000),
        "fee_amount": r4(fee_amount), "minimum_output_1pct_tolerance": r4(min_output_1pct),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 36: VESTING SCHEDULE — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T36In(BaseModel):
    total_tokens: float = Field(..., description="Total tokens in the vesting grant")
    tge_pct: float = Field(
        0, description="Percentage unlocked at Token Generation Event (0-100)")
    cliff_months: int = Field(0, description="Cliff period in months")
    vesting_months: int = Field(
        24, description="Total vesting duration in months")
    vesting_type: Literal["linear", "monthly_cliff", "quarterly"] = Field(
        "linear", description="Vesting schedule type")
    start_date: str = Field(
        "2025-01-01", description="Vesting start date (YYYY-MM-DD)")

@app.post("/v1/crypto/vesting-schedule", tags=["Crypto"], dependencies=auth)
async def t36(req: T36In):
    """Token vesting schedule with cliff, linear/graded unlock, and TGE."""
    t0 = time.perf_counter(); hit("crypto/vesting-schedule")
    total = req.total_tokens; tge = total * req.tge_pct / 100
    remaining = total - tge
    schedule = []
    cumulative = tge
    if tge > 0:
        schedule.append({"month": 0, "tokens_unlocked": r2(tge), "cumulative": r2(cumulative), "pct_unlocked": r4(cumulative / total * 100)})
    if req.vesting_type == "linear":
        monthly_unlock = remaining / req.vesting_months if req.vesting_months > 0 else 0
        for m in range(1, req.cliff_months + req.vesting_months + 1):
            if m <= req.cliff_months:
                schedule.append({"month": m, "tokens_unlocked": 0, "cumulative": r2(cumulative), "pct_unlocked": r4(cumulative / total * 100)})
            else:
                cumulative += monthly_unlock
                schedule.append({"month": m, "tokens_unlocked": r2(monthly_unlock), "cumulative": r2(cumulative), "pct_unlocked": r4(cumulative / total * 100)})
    elif req.vesting_type == "monthly_cliff":
        monthly_unlock = remaining / req.vesting_months if req.vesting_months > 0 else 0
        for m in range(1, req.cliff_months + req.vesting_months + 1):
            if m <= req.cliff_months:
                schedule.append({"month": m, "tokens_unlocked": 0, "cumulative": r2(cumulative), "pct_unlocked": r4(cumulative / total * 100)})
            else:
                cumulative += monthly_unlock
                schedule.append({"month": m, "tokens_unlocked": r2(monthly_unlock), "cumulative": r2(cumulative), "pct_unlocked": r4(cumulative / total * 100)})
    else:  # quarterly
        quarterly_unlock = remaining / (req.vesting_months / 3) if req.vesting_months > 0 else 0
        for m in range(1, req.cliff_months + req.vesting_months + 1):
            if m <= req.cliff_months:
                if m % 3 == 0 or m == req.cliff_months:
                    schedule.append({"month": m, "tokens_unlocked": 0, "cumulative": r2(cumulative), "pct_unlocked": r4(cumulative / total * 100)})
            elif (m - req.cliff_months) % 3 == 0:
                cumulative += quarterly_unlock
                schedule.append({"month": m, "tokens_unlocked": r2(quarterly_unlock), "cumulative": r2(cumulative), "pct_unlocked": r4(cumulative / total * 100)})
    return {
        "schedule": schedule, "tge_tokens": r2(tge), "total_tokens": r2(total),
        "fully_vested_month": req.cliff_months + req.vesting_months,
        "vesting_type": req.vesting_type,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 37: REBALANCE THRESHOLD — $0.005
# ══════════════════════════════════════════════════════════════════════════
class Holding(BaseModel):
    asset: str = Field(..., description="Asset name or ticker")
    current_value: float = Field(..., description="Current value in USD")
    target_weight: float = Field(..., description="Target portfolio weight (0-1)")

class T37In(BaseModel):
    holdings: list[Holding] = Field(
        ..., description="Array of current portfolio holdings")
    threshold_pct: float = Field(
        5, description="Rebalance trigger threshold as percentage")
    min_trade_usd: float = Field(
        10, description="Minimum trade size in USD")

@app.post("/v1/crypto/rebalance-threshold", tags=["Crypto"], dependencies=auth)
async def t37(req: T37In):
    """Portfolio rebalance analyzer: drift detection and trade computation."""
    t0 = time.perf_counter(); hit("crypto/rebalance-threshold")
    total = sum(h.current_value for h in req.holdings)
    if total <= 0:
        raise HTTPException(400, "Total portfolio value must be > 0")
    drifts = []; trades = []; max_drift = 0
    for h in req.holdings:
        current_w = h.current_value / total * 100
        drift = current_w - h.target_weight
        max_drift = max(max_drift, abs(drift))
        drifts.append({"asset": h.asset, "current_weight": r4(current_w), "target_weight": r4(h.target_weight), "drift_pct": r4(drift)})
        target_val = total * h.target_weight / 100
        trade_val = target_val - h.current_value
        if abs(trade_val) >= req.min_trade_usd:
            trades.append({"asset": h.asset, "action": "BUY" if trade_val > 0 else "SELL", "amount": r2(abs(trade_val))})
    needs_rebalance = max_drift > req.threshold_pct
    total_turnover = sum(t["amount"] for t in trades)
    return {
        "needs_rebalance": needs_rebalance, "max_drift_pct": r4(max_drift),
        "drift_per_asset": drifts, "trades": trades,
        "total_turnover": r2(total_turnover), "turnover_pct": r4(total_turnover / total * 100 / 2),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 38: INTEREST RATE PARITY — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T38In(BaseModel):
    spot_rate: float = Field(..., description="Current spot exchange rate")
    domestic_rate: float = Field(
        ..., description="Domestic interest rate (annualized)")
    foreign_rate: float = Field(
        ..., description="Foreign interest rate (annualized)")
    time_years: float = Field(1, description="Time horizon in years")
    parity_type: Literal["covered", "uncovered"] = Field(
        "covered", description="Parity type: covered or uncovered")
    actual_forward: Optional[float] = Field(
        None, description="Actual forward rate for arbitrage detection")

@app.post("/v1/fx/interest-rate-parity", tags=["FX"], dependencies=auth)
async def t38(req: T38In):
    """Interest rate parity calculator with arbitrage detection."""
    t0 = time.perf_counter(); hit("fx/interest-rate-parity")
    S, rd, rf, T = req.spot_rate, req.domestic_rate, req.foreign_rate, req.time_years
    theo_forward = S * (1 + rd * T) / (1 + rf * T)
    fwd_premium = (theo_forward / S - 1) * 100
    carry_yield = (rd - rf) * 100
    result = {
        "theoretical_forward": r6(theo_forward), "forward_premium_pct": r4(fwd_premium),
        "carry_direction": "BORROW_FOREIGN" if rd > rf else "BORROW_DOMESTIC",
        "annualized_carry_yield": r4(carry_yield), "parity_type": req.parity_type,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }
    if req.actual_forward:
        arb_profit = abs(req.actual_forward - theo_forward)
        result["arbitrage_profit"] = r4(arb_profit)
        result["arbitrage_pct"] = r4(arb_profit / S * 100)
        result["mispriced"] = arb_profit / S > 0.001
    return result

# ══════════════════════════════════════════════════════════════════════════
# TOOL 39: PURCHASING POWER PARITY — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T39In(BaseModel):
    base_spot_rate: float = Field(..., description="Current spot exchange rate")
    domestic_inflation: float = Field(..., description="Domestic inflation rate")
    foreign_inflation: float = Field(..., description="Foreign inflation rate")
    time_years: float = Field(1, description="Time horizon in years")

@app.post("/v1/fx/purchasing-power-parity", tags=["FX"], dependencies=auth)
async def t39(req: T39In):
    """Purchasing power parity fair value estimation."""
    t0 = time.perf_counter(); hit("fx/purchasing-power-parity")
    S, di, fi, T = req.base_spot_rate, req.domestic_inflation, req.foreign_inflation, req.time_years
    ppp_rate = S * ((1 + di) / (1 + fi)) ** T
    overval = (S / ppp_rate - 1) * 100
    real_rate = S * (1 + fi) / (1 + di)
    return {
        "ppp_rate": r6(ppp_rate), "overvaluation_pct": r4(overval),
        "real_exchange_rate": r6(real_rate), "inflation_differential": r4((di - fi) * 100),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 40: FORWARD RATE FROM YIELD CURVE — $0.005
# ══════════════════════════════════════════════════════════════════════════
class YieldPoint(BaseModel):
    tenor_years: float = Field(..., description="Maturity in years")
    spot_rate: float = Field(..., description="Spot rate at this tenor")

class T40In(BaseModel):
    yield_curve: list[YieldPoint] = Field(
        ..., min_length=2, description="Array of yield curve points")
    forward_start: float = Field(
        ..., description="Forward period start (years)")
    forward_end: float = Field(
        ..., description="Forward period end (years)")
    compounding: Literal["continuous", "annual", "semi"] = Field(
        "continuous", description="Compounding convention")

@app.post("/v1/fx/forward-rate", tags=["FX"], dependencies=auth)
async def t40(req: T40In):
    """Bootstrap forward rates from a spot yield curve."""
    t0 = time.perf_counter(); hit("fx/forward-rate")
    curve = sorted(req.yield_curve, key=lambda p: p.tenor_years)
    tenors = [p.tenor_years for p in curve]; rates = [p.spot_rate for p in curve]
    # Interpolate for start and end
    def interp_rate(t):
        if t <= tenors[0]:
            return rates[0]
        if t >= tenors[-1]:
            return rates[-1]
        for i in range(len(tenors) - 1):
            if tenors[i] <= t <= tenors[i + 1]:
                frac = (t - tenors[i]) / (tenors[i + 1] - tenors[i])
                return rates[i] + frac * (rates[i + 1] - rates[i])
        return rates[-1]
    r1 = interp_rate(req.forward_start); r2_val = interp_rate(req.forward_end)
    t1, t2 = req.forward_start, req.forward_end
    if req.compounding == "continuous":
        fwd = (r2_val * t2 - r1 * t1) / (t2 - t1) if t2 > t1 else r2_val
    elif req.compounding == "annual":
        df1 = 1 / (1 + r1) ** t1; df2 = 1 / (1 + r2_val) ** t2
        fwd = (df1 / df2) ** (1 / (t2 - t1)) - 1 if t2 > t1 else r2_val
    else:  # semi
        df1 = 1 / (1 + r1 / 2) ** (2 * t1); df2 = 1 / (1 + r2_val / 2) ** (2 * t2)
        fwd = 2 * ((df1 / df2) ** (1 / (2 * (t2 - t1))) - 1) if t2 > t1 else r2_val
    # Full forward curve
    full_fwd = []
    for i in range(len(tenors) - 1):
        r_i = rates[i]; r_j = rates[i + 1]; ti = tenors[i]; tj = tenors[i + 1]
        if req.compounding == "continuous":
            f = (r_j * tj - r_i * ti) / (tj - ti) if tj > ti else r_j
        else:
            f = ((1 + r_j) ** tj / (1 + r_i) ** ti) ** (1 / (tj - ti)) - 1 if tj > ti else r_j
        full_fwd.append({"start": ti, "end": tj, "forward_rate": r6(f)})
    return {
        "forward_rate": r6(fwd), "forward_rate_pct": r4(fwd * 100),
        "spot_rate_start": r6(r1), "spot_rate_end": r6(r2_val),
        "full_forward_curve": full_fwd, "compounding": req.compounding,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 41: CARRY TRADE — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T41In(BaseModel):
    borrow_currency_rate: float = Field(
        ..., description="Interest rate of the funding (borrow) currency")
    invest_currency_rate: float = Field(
        ..., description="Interest rate of the investment currency")
    spot_entry: float = Field(..., description="Spot rate at entry")
    spot_exit: float = Field(..., description="Spot rate at exit")
    holding_period_days: int = Field(
        ..., description="Holding period in days")
    leverage: float = Field(1, description="Leverage multiplier")
    notional: float = Field(100000, description="Notional trade amount")

@app.post("/v1/fx/carry-trade", tags=["FX"], dependencies=auth)
async def t41(req: T41In):
    """Currency carry trade P&L decomposition."""
    t0 = time.perf_counter(); hit("fx/carry-trade")
    days = req.holding_period_days; lev = req.leverage; notional = req.notional
    carry = (req.invest_currency_rate - req.borrow_currency_rate) * days / 365
    spot_return = (req.spot_exit - req.spot_entry) / req.spot_entry
    total_return = carry + spot_return
    levered_return = total_return * lev
    pnl = notional * levered_return
    annualized = total_return * 365 / days if days > 0 else 0
    breakeven = -carry / (req.spot_entry) * req.spot_entry if carry != 0 else 0
    breakeven_pct = carry * 100  # How much the spot can depreciate before losing money
    return {
        "carry_return_pct": r4(carry * 100), "spot_return_pct": r4(spot_return * 100),
        "total_return_pct": r4(total_return * 100), "levered_return_pct": r4(levered_return * 100),
        "annualized_total_return": r4(annualized * 100), "pnl_amount": r2(pnl),
        "breakeven_depreciation_pct": r4(breakeven_pct),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 42: INFLATION-ADJUSTED RETURNS — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T42In(BaseModel):
    nominal_return_pct: float = Field(
        ..., description="Nominal return as percentage")
    inflation_rate_pct: float = Field(
        ..., description="Inflation rate as percentage")
    periods: Optional[int] = Field(
        None, description="Optional number of periods for cumulative calculation")
    initial_value: Optional[float] = Field(
        None, description="Optional initial value for cumulative calculation")

@app.post("/v1/macro/inflation-adjusted", tags=["Macro"], dependencies=auth)
async def t42(req: T42In):
    """Convert nominal returns to real returns using Fisher equation."""
    t0 = time.perf_counter(); hit("macro/inflation-adjusted")
    nom = req.nominal_return_pct / 100; inf = req.inflation_rate_pct / 100
    # Fisher exact: (1+r_real) = (1+r_nom) / (1+r_inf)
    real = (1 + nom) / (1 + inf) - 1
    approx = nom - inf
    pp_mult = 1 / (1 + inf) if inf != -1 else 0
    drag = nom - real
    years_half = math.log(0.5) / math.log(1 / (1 + inf)) if inf > 0 else float('inf')
    result = {
        "real_return_pct": r4(real * 100), "fisher_exact_real_return": r6(real),
        "approximate_real_return": r4(approx * 100),
        "purchasing_power_multiplier": r4(pp_mult), "inflation_drag_pct": r4(drag * 100),
        "years_to_halve_purchasing_power": r2(years_half),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }
    if req.periods and req.initial_value:
        series = []
        nom_val = req.initial_value; real_val = req.initial_value
        for yr in range(req.periods + 1):
            series.append({"year": yr, "nominal": r2(nom_val), "real": r2(real_val)})
            nom_val *= (1 + nom); real_val *= (1 + real)
        result["value_series"] = series
    return result

# ══════════════════════════════════════════════════════════════════════════
# TOOL 43: TAYLOR RULE — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T43In(BaseModel):
    current_inflation: float = Field(
        ..., description="Current inflation rate (percentage)")
    target_inflation: float = Field(
        2.0, description="Target inflation rate (percentage)")
    output_gap_pct: float = Field(
        0, description="Output gap as percentage of potential GDP")
    neutral_real_rate: float = Field(
        2.0, description="Neutral real interest rate (percentage)")
    inflation_weight: float = Field(
        0.5, description="Weight on inflation gap")
    output_weight: float = Field(0.5, description="Weight on output gap")
    current_policy_rate: Optional[float] = Field(
        None, description="Current policy rate for gap analysis")

@app.post("/v1/macro/taylor-rule", tags=["Macro"], dependencies=auth)
async def t43(req: T43In):
    """Taylor Rule interest rate prescription."""
    t0 = time.perf_counter(); hit("macro/taylor-rule")
    inf_gap = req.current_inflation - req.target_inflation
    prescribed = req.neutral_real_rate + req.current_inflation + req.inflation_weight * inf_gap + req.output_weight * req.output_gap_pct
    result = {
        "prescribed_rate": r4(prescribed), "inflation_gap": r4(inf_gap),
        "output_gap": r4(req.output_gap_pct),
        "components": {
            "neutral_real_rate": req.neutral_real_rate, "current_inflation": req.current_inflation,
            "inflation_adjustment": r4(req.inflation_weight * inf_gap),
            "output_adjustment": r4(req.output_weight * req.output_gap_pct)
        },
        "ms": r2((time.perf_counter() - t0) * 1000)
    }
    if req.current_policy_rate is not None:
        result["rate_gap"] = r4(prescribed - req.current_policy_rate)
        result["policy_stance"] = "TIGHT" if req.current_policy_rate > prescribed else "LOOSE" if req.current_policy_rate < prescribed else "NEUTRAL"
    return result

# ══════════════════════════════════════════════════════════════════════════
# TOOL 44: REAL YIELD & BREAKEVEN INFLATION — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T44In(BaseModel):
    nominal_yield: float = Field(
        ..., description="Nominal bond yield (percentage)")
    inflation_expectation: Optional[float] = Field(
        None, description="Expected inflation rate (percentage)")
    tips_yield: Optional[float] = Field(
        None,
        description="TIPS real yield (percentage, alternative to inflation_expectation)")
    tenor_years: float = Field(10, description="Bond tenor in years")

@app.post("/v1/macro/real-yield", tags=["Macro"], dependencies=auth)
async def t44(req: T44In):
    """Real yield and breakeven inflation from nominal yields."""
    t0 = time.perf_counter(); hit("macro/real-yield")
    if req.tips_yield is not None:
        real_yield = req.tips_yield
        breakeven = req.nominal_yield - req.tips_yield
    elif req.inflation_expectation is not None:
        breakeven = req.inflation_expectation
        real_yield = req.nominal_yield - req.inflation_expectation
    else:
        raise HTTPException(400, "Provide either inflation_expectation or tips_yield")
    fisher_real = (1 + req.nominal_yield / 100) / (1 + breakeven / 100) - 1
    return {
        "real_yield": r4(real_yield), "breakeven_inflation": r4(breakeven),
        "nominal_yield": r4(req.nominal_yield), "fisher_real_yield_pct": r4(fisher_real * 100),
        "tenor_years": req.tenor_years,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 45: PARAMETRIC VAR — $0.008
# ══════════════════════════════════════════════════════════════════════════
class T45In(BaseModel):
    returns: list[float] = Field(
        ..., min_length=10, max_length=5000, description="Array of historical returns (max 5000)")
    confidence_levels: list[float] = Field(
        [0.95, 0.99], min_length=1, max_length=5, description="Confidence levels for VaR calculation (max 5 levels)")
    holding_period_days: int = Field(
        1, ge=1, le=252, description="VaR holding period in days (1-252)")
    portfolio_value: Optional[float] = Field(
        None, description="Optional portfolio value for dollar VaR")

@app.post("/v1/risk/var-parametric", tags=["Risk"], dependencies=auth)
async def t45(req: T45In):
    """Parametric Value-at-Risk and Conditional VaR. VaR scales with volatility; for
    crypto, feed fresh realized vol from /v1/live/volatility."""
    t0 = time.perf_counter(); hit("risk/var-parametric")
    R = req.returns; n = len(R); m = mu(R); s = sd(R)
    hp_factor = math.sqrt(req.holding_period_days)
    results = {}
    for cl in req.confidence_levels:
        # Normal quantile approximation
        z = _norm_inv(1 - cl)
        var_1d = -(m + z * s)
        var_hp = var_1d * hp_factor
        # CVaR (Expected Shortfall) - analytical for normal
        cvar_1d = -(m - s * npdf(z) / (1 - cl))
        cvar_hp = cvar_1d * hp_factor
        cl_key = f"{int(cl * 100)}"
        results[cl_key] = {
            "var": r6(var_hp), "cvar": r6(cvar_hp),
            "var_pct": r4(var_hp * 100), "cvar_pct": r4(cvar_hp * 100)
        }
        if req.portfolio_value:
            results[cl_key]["var_dollar"] = r2(var_hp * req.portfolio_value)
            results[cl_key]["cvar_dollar"] = r2(cvar_hp * req.portfolio_value)
    sk = sum(((r_val - m) / s) ** 3 for r_val in R) * n / ((n - 1) * (n - 2)) if s > 0 and n > 2 else 0
    ku = (sum(((r_val - m) / s) ** 4 for r_val in R) * n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3))) if s > 0 and n > 3 else 0
    return {
        "var_results": results, "holding_period_days": req.holding_period_days,
        "volatility_daily": r6(s), "volatility_annual": r4(s * math.sqrt(252)),
        "skewness": r4(sk), "kurtosis": r4(ku), "n": n,
        "live_data": {
            "note": "Parametric VaR scales directly with volatility. For crypto, validate against fresh realized vol from /v1/live/volatility ($0.01).",
            "volatility": "/v1/live/volatility",
        },
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

def _norm_inv(p):
    """Inverse normal CDF (rational approximation)."""
    if p <= 0:
        return -10
    if p >= 1:
        return 10
    if p < 0.5:
        return -_norm_inv(1 - p)
    t = math.sqrt(-2 * math.log(1 - p))
    c0, c1, c2 = 2.515517, 0.802853, 0.010328
    d1, d2, d3 = 1.432788, 0.189269, 0.001308
    return t - (c0 + c1 * t + c2 * t ** 2) / (1 + d1 * t + d2 * t ** 2 + d3 * t ** 3)

# ══════════════════════════════════════════════════════════════════════════
# TOOL 46: STRESS TEST — $0.008
# ══════════════════════════════════════════════════════════════════════════
class Position(BaseModel):
    asset: str = Field(..., description="Asset name")
    value: float = Field(..., description="Current position value in USD")
    beta: float = Field(1.0, description="Market beta of the position")
    duration: float = Field(
        0, description="Bond duration (for fixed income)")

class Scenario(BaseModel):
    name: str = Field(..., description="Scenario name")
    market_shock_pct: float = Field(
        0, description="Equity market shock as percentage")
    rate_shock_bps: float = Field(
        0, description="Interest rate shock in basis points")
    vol_shock_pct: float = Field(
        0, description="Volatility shock as percentage")

class T46In(BaseModel):
    positions: list[Position] = Field(
        ..., description="Array of portfolio positions")
    scenarios: list[Scenario] = Field(
        ..., description="Array of stress scenarios to evaluate")

@app.post("/v1/risk/stress-test", tags=["Risk"], dependencies=auth)
async def t46(req: T46In):
    """Portfolio stress test across multiple scenarios."""
    t0 = time.perf_counter(); hit("risk/stress-test")
    total_val = sum(p.value for p in req.positions)
    results = []
    for sc in req.scenarios:
        per_asset = []
        total_pnl = 0
        for pos in req.positions:
            equity_pnl = pos.value * pos.beta * sc.market_shock_pct / 100
            rate_pnl = -pos.value * pos.duration * sc.rate_shock_bps / 10000
            pnl = equity_pnl + rate_pnl
            total_pnl += pnl
            per_asset.append({"asset": pos.asset, "pnl": r2(pnl), "pnl_pct": r4(pnl / pos.value * 100 if pos.value else 0)})
        results.append({
            "scenario": sc.name, "total_pnl": r2(total_pnl),
            "pnl_pct": r4(total_pnl / total_val * 100 if total_val else 0),
            "per_asset": per_asset
        })
    worst = min(results, key=lambda r: r["total_pnl"])
    best = max(results, key=lambda r: r["total_pnl"])
    return {
        "results": results, "worst_scenario": worst["scenario"], "best_scenario": best["scenario"],
        "portfolio_value": r2(total_val),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 47: PAYOFF DIAGRAM — $0.005
# ══════════════════════════════════════════════════════════════════════════
class PayoffLeg(BaseModel):
    type: Literal["call", "put"] = Field(..., description="Option type")
    strike: float = Field(..., description="Strike price")
    premium: float = Field(..., description="Premium per contract")
    quantity: int = Field(1, description="Number of contracts")
    direction: Literal["long", "short"] = Field(
        "long", description="Long or short the option")

class T47In(BaseModel):
    legs: list[PayoffLeg] = Field(..., description="Array of option legs")
    spot: float = Field(..., description="Current spot price")
    price_range_pct: float = Field(
        30,
        description="Price range around spot for payoff calculation (percentage)")
    points: int = Field(
        100, ge=1, description="Number of evaluation points")

@app.post("/v1/options/payoff-diagram", tags=["Options"], dependencies=auth)
async def t47(req: T47In):
    """Multi-leg options payoff diagram data generation."""
    t0 = time.perf_counter(); hit("options/payoff-diagram")
    lo = req.spot * (1 - req.price_range_pct / 100); hi = req.spot * (1 + req.price_range_pct / 100)
    prices_arr = []; pnl_arr = []
    for i in range(req.points + 1):
        S = lo + i * (hi - lo) / req.points
        pnl = 0
        for l in req.legs:
            intrinsic = max(0, S - l.strike) if l.type == "call" else max(0, l.strike - S)
            sign = 1 if l.direction == "long" else -1
            pnl += sign * l.quantity * (intrinsic - l.premium)
        prices_arr.append(r2(S)); pnl_arr.append(r2(pnl))
    bes = []
    for i in range(len(pnl_arr) - 1):
        if pnl_arr[i] * pnl_arr[i + 1] < 0:
            bes.append(r2(prices_arr[i] - pnl_arr[i] * (prices_arr[i + 1] - prices_arr[i]) / (pnl_arr[i + 1] - pnl_arr[i])))
    return {
        "prices": prices_arr, "pnl": pnl_arr, "breakeven_points": bes,
        "max_profit": r2(max(pnl_arr)), "max_loss": r2(min(pnl_arr)),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 48: YIELD CURVE INTERPOLATION — $0.015
# ══════════════════════════════════════════════════════════════════════════
class T48In(BaseModel):
    tenors: list[float] = Field(
        ..., description="Array of known tenor points (years)")
    rates: list[float] = Field(
        ..., description="Array of known rates at each tenor")
    target_tenors: list[float] = Field(
        ..., description="Array of tenors to interpolate")
    method: Literal["linear", "cubic", "nelson_siegel"] = Field(
        "linear", description="Interpolation method")

@app.post("/v1/fi/yield-curve-interpolate", tags=["Fixed Income"], dependencies=auth)
async def t48(req: T48In):
    """Yield curve interpolation: linear, cubic spline, or Nelson-Siegel."""
    t0 = time.perf_counter(); hit("fi/yield-curve-interpolate")
    tenors, rates = req.tenors, req.rates
    if len(tenors) != len(rates):
        raise HTTPException(400, "tenors and rates must have same length")
    # Sort by tenor
    pairs = sorted(zip(tenors, rates))
    tenors = [p[0] for p in pairs]; rates = [p[1] for p in pairs]
    if req.method == "linear":
        result_rates = []
        for t in req.target_tenors:
            if t <= tenors[0]:
                result_rates.append(r6(rates[0]))
            elif t >= tenors[-1]:
                result_rates.append(r6(rates[-1]))
            else:
                for i in range(len(tenors) - 1):
                    if tenors[i] <= t <= tenors[i + 1]:
                        frac = (t - tenors[i]) / (tenors[i + 1] - tenors[i])
                        result_rates.append(r6(rates[i] + frac * (rates[i + 1] - rates[i])))
                        break
    elif req.method == "cubic":
        result_rates = [r6(v) for v in cubic_spline(tenors, rates, req.target_tenors)]
    else:  # nelson_siegel
        # Fit Nelson-Siegel: y(t) = b0 + b1*(1-exp(-t/tau))/(t/tau) + b2*((1-exp(-t/tau))/(t/tau) - exp(-t/tau))
        def ns_model(params, t):
            b0, b1, b2, tau = params
            if tau <= 0:
                tau = 0.01
            x = t / tau
            if x < 1e-10:
                return b0 + b1 + b2 * 0
            factor1 = (1 - math.exp(-x)) / x
            factor2 = factor1 - math.exp(-x)
            return b0 + b1 * factor1 + b2 * factor2
        def ns_error(params):
            return sum((ns_model(params, tenors[i]) - rates[i]) ** 2 for i in range(len(tenors)))
        best_params, _ = nelder_mead(ns_error, [rates[-1], rates[0] - rates[-1], 0, 2.0])
        result_rates = [r6(ns_model(best_params, t)) for t in req.target_tenors]
    # Full curve at 100 points
    t_min, t_max = tenors[0], tenors[-1]
    full_tenors = [t_min + i * (t_max - t_min) / 99 for i in range(100)]
    if req.method == "cubic":
        full_rates = [r6(v) for v in cubic_spline(tenors, rates, full_tenors)]
    elif req.method == "nelson_siegel":
        full_rates = [r6(ns_model(best_params, t)) for t in full_tenors]
    else:
        full_rates = []
        for t in full_tenors:
            for i in range(len(tenors) - 1):
                if tenors[i] <= t <= tenors[i + 1]:
                    frac = (t - tenors[i]) / (tenors[i + 1] - tenors[i])
                    full_rates.append(r6(rates[i] + frac * (rates[i + 1] - rates[i])))
                    break
            else:
                full_rates.append(r6(rates[-1]))
    result = {
        "interpolated_rates": result_rates, "method": req.method,
        "target_tenors": req.target_tenors,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }
    if req.method == "nelson_siegel":
        result["nelson_siegel_params"] = {"beta0": r6(best_params[0]), "beta1": r6(best_params[1]),
                                           "beta2": r6(best_params[2]), "tau": r4(best_params[3])}
    return result

# ══════════════════════════════════════════════════════════════════════════
# TOOL 49: CREDIT SPREAD — $0.008
# ══════════════════════════════════════════════════════════════════════════
class CurvePoint(BaseModel):
    tenor: float = Field(..., description="Maturity in years")
    rate: float = Field(..., description="Interest rate at this tenor")

class T49In(BaseModel):
    bond_price: float = Field(..., description="Observed bond price")
    coupon_rate: float = Field(..., description="Annual coupon rate")
    maturity_years: int = Field(..., description="Years to maturity")
    face_value: float = Field(1000, description="Face value of the bond")
    payment_frequency: int = Field(
        2, description="Coupon payments per year")
    risk_free_curve: list[CurvePoint] = Field(
        ..., description="Risk-free yield curve points")

@app.post("/v1/fi/credit-spread", tags=["Fixed Income"], dependencies=auth)
async def t49(req: T49In):
    """Credit spread and Z-spread from bond price vs risk-free curve."""
    t0 = time.perf_counter(); hit("fi/credit-spread")
    C = req.face_value * req.coupon_rate / req.payment_frequency
    n = req.maturity_years * req.payment_frequency
    # YTM via Newton's method
    ytm = req.coupon_rate; # initial guess
    for _ in range(100):
        y = ytm / req.payment_frequency; price = 0; dprice = 0
        for t in range(1, n + 1):
            cf = C + (req.face_value if t == n else 0)
            price += cf / (1 + y) ** t
            dprice -= t * cf / (1 + y) ** (t + 1)
        diff = price - req.bond_price
        if abs(diff) < 1e-8:
            break
        ytm -= diff / (dprice / req.payment_frequency) if dprice != 0 else 0
    # Interpolate risk-free rates
    rf_curve = sorted(req.risk_free_curve, key=lambda p: p.tenor)
    def rf_at(t):
        tenors = [p.tenor for p in rf_curve]; rates_rf = [p.rate for p in rf_curve]
        if t <= tenors[0]:
            return rates_rf[0]
        if t >= tenors[-1]:
            return rates_rf[-1]
        for i in range(len(tenors) - 1):
            if tenors[i] <= t <= tenors[i + 1]:
                frac = (t - tenors[i]) / (tenors[i + 1] - tenors[i])
                return rates_rf[i] + frac * (rates_rf[i + 1] - rates_rf[i])
        return rates_rf[-1]
    # Z-spread: find z such that sum(CF/(1+rf+z)^t) = price
    z_spread = 0.01
    for _ in range(200):
        price = 0; dprice = 0
        for t in range(1, n + 1):
            tenor = t / req.payment_frequency
            rf = rf_at(tenor) / req.payment_frequency
            cf = C + (req.face_value if t == n else 0)
            d = 1 + rf + z_spread / req.payment_frequency
            price += cf / d ** t
            dprice -= t * cf / (req.payment_frequency * d ** (t + 1))
        diff = price - req.bond_price
        if abs(diff) < 1e-8:
            break
        z_spread -= diff / dprice if dprice != 0 else 0
    # Credit spread (simple: YTM - benchmark at maturity)
    benchmark_yield = rf_at(req.maturity_years)
    credit_spread = ytm - benchmark_yield
    # Implied default probability (simple model)
    recovery = 0.4
    implied_pd = credit_spread / (1 - recovery) if recovery < 1 else 0
    return {
        "yield_to_maturity": r4(ytm), "yield_to_maturity_pct": r4(ytm * 100),
        "z_spread_bps": r2(z_spread * 10000), "credit_spread_bps": r2(credit_spread * 10000),
        "benchmark_yield": r4(benchmark_yield),
        "default_probability_implied": r4(implied_pd),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 50: BOLLINGER BANDS — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T50In(BaseModel):
    prices: list[float] = Field(
        ..., min_length=5, description="Array of price data")
    window: int = Field(20, description="Moving average window")
    num_std: float = Field(
        2, description="Number of standard deviations for bands")

@app.post("/v1/indicators/bollinger-bands", tags=["Indicators"], dependencies=auth)
async def t50(req: T50In):
    """Bollinger Bands with %B, bandwidth, and squeeze detection."""
    t0 = time.perf_counter(); hit("indicators/bollinger-bands")
    p = req.prices; w = min(req.window, len(p)); n = req.num_std
    mid = mu(p[-w:]); s = sd(p[-w:])
    upper = mid + n * s; lower = mid - n * s
    pct_b = (p[-1] - lower) / (upper - lower) if upper != lower else 0.5
    bandwidth = (upper - lower) / mid * 100 if mid != 0 else 0
    # Squeeze: bandwidth below 20-period average bandwidth
    bw_history = []
    for i in range(w - 1, len(p)):
        chunk = p[i - w + 1:i + 1]; cm = mu(chunk); cs = sd(chunk)
        bw_history.append((cm + n * cs - (cm - n * cs)) / cm * 100 if cm != 0 else 0)
    avg_bw = mu(bw_history) if bw_history else bandwidth
    squeeze = bandwidth < avg_bw * 0.75
    return {
        "upper_band": r2(upper), "middle_band": r2(mid), "lower_band": r2(lower),
        "percent_b": r4(pct_b), "bandwidth": r4(bandwidth), "squeeze_signal": squeeze,
        "price": r2(p[-1]),
        "signal": "OVERBOUGHT" if pct_b > 1 else "OVERSOLD" if pct_b < 0 else "NEUTRAL",
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 51: FIBONACCI RETRACEMENT — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T51In(BaseModel):
    swing_high: float = Field(..., description="Swing high price")
    swing_low: float = Field(..., description="Swing low price")
    direction: Literal["up", "down"] = Field(
        "up", description="Trend direction for level calculation")

@app.post("/v1/indicators/fibonacci-retracement", tags=["Indicators"], dependencies=auth)
async def t51(req: T51In):
    """Fibonacci retracement and extension levels."""
    t0 = time.perf_counter(); hit("indicators/fibonacci-retracement")
    hi, lo = req.swing_high, req.swing_low; rng = hi - lo
    levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0]
    extensions = [1.272, 1.618, 2.0, 2.618]
    if req.direction == "up":
        ret = {f"{l:.1%}": r2(hi - l * rng) for l in levels}
        ext = {f"{l:.1%}": r2(hi + (l - 1) * rng) for l in extensions}
    else:
        ret = {f"{l:.1%}": r2(lo + l * rng) for l in levels}
        ext = {f"{l:.1%}": r2(lo - (l - 1) * rng) for l in extensions}
    return {
        "retracement_levels": ret, "extension_levels": ext,
        "swing_high": r2(hi), "swing_low": r2(lo), "range": r2(rng), "direction": req.direction,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 52: ATR — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T52In(BaseModel):
    high: list[float] = Field(..., description="Array of high prices")
    low: list[float] = Field(..., description="Array of low prices")
    close: list[float] = Field(..., description="Array of closing prices")
    period: int = Field(14, description="ATR lookback period")

@app.post("/v1/indicators/atr", tags=["Indicators"], dependencies=auth)
async def t52(req: T52In):
    """Average True Range with normalized ATR and volatility regime."""
    t0 = time.perf_counter(); hit("indicators/atr")
    n = min(len(req.high), len(req.low), len(req.close))
    if n < 2:
        raise HTTPException(400, "Need at least 2 data points")
    trs = []
    for i in range(1, n):
        tr = max(req.high[i] - req.low[i], abs(req.high[i] - req.close[i - 1]), abs(req.low[i] - req.close[i - 1]))
        trs.append(tr)
    p = min(req.period, len(trs))
    atr_vals = []
    # First ATR is SMA
    atr_cur = mu(trs[:p])
    atr_vals.append(atr_cur)
    for i in range(p, len(trs)):
        atr_cur = (atr_cur * (p - 1) + trs[i]) / p
        atr_vals.append(atr_cur)
    current_atr = atr_vals[-1]
    atr_pct = current_atr / req.close[-1] * 100 if req.close[-1] != 0 else 0
    avg_atr = mu(atr_vals)
    if current_atr > avg_atr * 1.5:
        vol_regime = "HIGH"
    elif current_atr < avg_atr * 0.5:
        vol_regime = "LOW"
    else:
        vol_regime = "MEDIUM"
    return {
        "current_atr": r4(current_atr), "atr_pct": r4(atr_pct),
        "atr_series": [r4(v) for v in atr_vals[-20:]],
        "volatility_regime": vol_regime, "period": req.period,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 53: RISK PARITY WEIGHTS — $0.008
# ══════════════════════════════════════════════════════════════════════════
class T53In(BaseModel):
    volatilities: list[float] = Field(
        ..., description="Array of annualized volatilities per asset")
    correlation_matrix: list[list[float]] = Field(
        ..., description="N x N correlation matrix")
    risk_budget: Optional[list[float]] = Field(
        None, description="Optional risk budget weights (default: equal)")
    asset_names: Optional[list[str]] = Field(
        None, description="Optional asset name labels")

@app.post("/v1/portfolio/risk-parity-weights", tags=["Portfolio"], dependencies=auth)
async def t53(req: T53In):
    """Equal risk contribution portfolio weights."""
    t0 = time.perf_counter(); hit("portfolio/risk-parity-weights")
    vols = req.volatilities; corr = req.correlation_matrix; k = len(vols)
    budget = req.risk_budget or [1.0 / k] * k
    names = req.asset_names or [f"Asset_{i}" for i in range(k)]
    # Build covariance matrix
    cov_mat = [[vols[i] * vols[j] * corr[i][j] for j in range(k)] for i in range(k)]
    # Iterative risk parity (Spinu 2013 — Newton with damping)
    # Initialize with inverse-vol weights (good starting point)
    inv_vol = [1.0 / v if v > 1e-14 else 1.0 for v in vols]
    s_iv = sum(inv_vol)
    w = [x / s_iv for x in inv_vol]
    for _ in range(2000):
        # Portfolio variance and risk contributions
        port_var = sum(w[i] * w[j] * cov_mat[i][j] for i in range(k) for j in range(k))
        port_vol = math.sqrt(port_var) if port_var > 0 else 1e-10
        mrc = [sum(w[j] * cov_mat[i][j] for j in range(k)) / port_vol for i in range(k)]
        rc = [w[i] * mrc[i] for i in range(k)]
        total_rc = sum(rc) or 1e-10
        # Target: each asset's risk contribution = budget * total
        target_rc = [budget[i] * total_rc for i in range(k)]
        # Multiplicative update with damping for stability
        new_w = [w[i] * math.sqrt(target_rc[i] / rc[i]) if rc[i] > 1e-14 else w[i] for i in range(k)]
        s_w = sum(new_w); new_w = [x / s_w for x in new_w]
        if max(abs(new_w[i] - w[i]) for i in range(k)) < 1e-10:
            break
        w = new_w
    # Final metrics
    port_var = sum(w[i] * w[j] * cov_mat[i][j] for i in range(k) for j in range(k))
    port_vol = math.sqrt(port_var) if port_var > 0 else 0
    mrc = [sum(w[j] * cov_mat[i][j] for j in range(k)) / port_vol if port_vol > 0 else 0 for i in range(k)]
    rc = [w[i] * mrc[i] for i in range(k)]
    total_rc = sum(rc) or 1e-10
    div_ratio = sum(w[i] * vols[i] for i in range(k)) / port_vol if port_vol > 0 else 1
    eff_n = 1 / sum((rc_i / total_rc) ** 2 for rc_i in rc) if total_rc > 0 else k
    return {
        "weights": {names[i]: r4(w[i]) for i in range(k)},
        "risk_contributions": {names[i]: r4(rc[i] / total_rc) for i in range(k)},
        "portfolio_volatility": r4(port_vol), "diversification_ratio": r4(div_ratio),
        "effective_n": r2(eff_n),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }


# ══════════════════════════════════════════════════════════════════════════
# TOOL 54: TRANSACTION COST — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T54In(BaseModel):
    trade_value: float = Field(
        ..., gt=0, description="Total trade value in USD")
    commission_per_share: float = Field(
        0, description="Commission per share")
    commission_flat: float = Field(
        0, description="Flat commission per trade")
    commission_pct: float = Field(
        0, description="Commission as percentage of trade value")
    shares: int = Field(1, ge=1, description="Number of shares")
    spread_bps: float = Field(
        5, description="Bid-ask spread in basis points")
    market_impact_bps: float = Field(
        0, description="Estimated market impact in basis points")
    adv: Optional[float] = Field(
        None, description="Average daily volume in USD (for Almgren model)")
    participation_rate: float = Field(
        0.1, description="Fraction of ADV consumed by trade")

@app.post("/v1/risk/transaction-cost", tags=["Risk"], dependencies=auth)
async def t54(req: T54In):
    """Transaction cost model: commission + spread + market impact estimation."""
    t0 = time.perf_counter(); hit("risk/transaction-cost")
    val = req.trade_value
    # Commission
    comm_ps = req.commission_per_share * req.shares
    comm_flat = req.commission_flat
    comm_pct = val * req.commission_pct / 100
    total_commission = comm_ps + comm_flat + comm_pct
    # Half-spread cost (you cross the bid-ask)
    spread_cost = val * req.spread_bps / 10000 / 2
    # Market impact — square-root model (Almgren et al.)
    # Impact ≈ sigma * sqrt(Q / V) where Q = trade size, V = ADV
    if req.adv and req.adv > 0:
        participation = val / req.adv
        # Simplified: impact_bps = 10 * sqrt(participation_rate)
        impact_bps = 10 * math.sqrt(min(participation, 1))
        market_impact = val * impact_bps / 10000
    else:
        market_impact = val * req.market_impact_bps / 10000
    total_cost = total_commission + spread_cost + market_impact
    cost_bps = total_cost / val * 10000 if val > 0 else 0
    # Round-trip (buy + sell)
    round_trip = total_cost * 2
    # Breakeven move needed to profit
    breakeven_pct = total_cost / val * 100 * 2  # need to overcome cost on both sides
    return {
        "total_cost": r4(total_cost), "cost_bps": r2(cost_bps),
        "commission": r4(total_commission), "spread_cost": r4(spread_cost),
        "market_impact": r4(market_impact),
        "round_trip_cost": r4(round_trip), "round_trip_bps": r2(cost_bps * 2),
        "breakeven_move_pct": r4(breakeven_pct),
        "cost_as_pct": r4(total_cost / val * 100),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 55: PROBABILISTIC SHARPE RATIO — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T55In(BaseModel):
    returns: list[float] = Field(
        ..., min_length=10, description="Array of portfolio returns")
    benchmark_sharpe: float = Field(
        0, description="Benchmark Sharpe ratio to test against")
    risk_free_rate: float = Field(
        0.05, description="Annual risk-free rate")
    annualization_factor: int = Field(
        252, description="Trading days per year for annualization")

@app.post("/v1/stats/probabilistic-sharpe", tags=["Statistics"], dependencies=auth)
async def t55(req: T55In):
    """Probabilistic Sharpe Ratio — is the observed Sharpe statistically significant?
    Based on Bailey & Lopez de Prado (2012)."""
    t0 = time.perf_counter(); hit("stats/probabilistic-sharpe")
    R = req.returns; n = len(R)
    rf_daily = req.risk_free_rate / req.annualization_factor
    excess = [r_val - rf_daily for r_val in R]
    m = mu(excess); s = sd(excess)
    if s > 1e-12:
        sr_daily = m / s
    else:
        # Zero vol: constant returns → Sharpe is +∞ (positive), −∞ (negative), or 0
        sr_daily = 0
        sr_annual = 0
        rf_daily_ref = req.benchmark_sharpe / math.sqrt(req.annualization_factor)
        if m > 1e-12:
            return {"probabilistic_sharpe_ratio": 1.0, "sharpe_ratio": 9999.99,
                    "benchmark_sharpe": r4(req.benchmark_sharpe), "z_score": 9999.99,
                    "significant_at_95": True, "significant_at_99": True,
                    "se_sharpe": 0, "skewness": 0, "excess_kurtosis": 0,
                    "min_track_record_length": 1, "n": n,
                    "ms": r2((time.perf_counter() - t0) * 1000)}
        elif m < -1e-12:
            return {"probabilistic_sharpe_ratio": 0.0, "sharpe_ratio": -9999.99,
                    "benchmark_sharpe": r4(req.benchmark_sharpe), "z_score": -9999.99,
                    "significant_at_95": False, "significant_at_99": False,
                    "se_sharpe": 0, "skewness": 0, "excess_kurtosis": 0,
                    "min_track_record_length": None, "n": n,
                    "ms": r2((time.perf_counter() - t0) * 1000)}
        else:
            return {"probabilistic_sharpe_ratio": 0.5, "sharpe_ratio": 0,
                    "benchmark_sharpe": r4(req.benchmark_sharpe), "z_score": 0,
                    "significant_at_95": False, "significant_at_99": False,
                    "se_sharpe": 0, "skewness": 0, "excess_kurtosis": 0,
                    "min_track_record_length": None, "n": n,
                    "ms": r2((time.perf_counter() - t0) * 1000)}
    sr_annual = sr_daily * math.sqrt(req.annualization_factor)
    # Skewness and kurtosis of returns
    sk = sum(((r_val - m) / s) ** 3 for r_val in excess) * n / ((n - 1) * (n - 2)) if s > 0 and n > 2 else 0
    ku = (sum(((r_val - m) / s) ** 4 for r_val in excess) * n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3))) if s > 0 and n > 3 else 0
    # Standard error of Sharpe ratio (Lo 2002, adjusted for non-normality)
    sr_ref = req.benchmark_sharpe / math.sqrt(req.annualization_factor)  # de-annualize benchmark
    se_sr_var = (1 - sk * sr_daily + (ku / 4) * sr_daily ** 2) / (n - 1) if n > 1 else 1
    se_sr = math.sqrt(max(0, se_sr_var)) if n > 1 else 1
    # PSR = P(SR* > SR_benchmark) = Phi((SR - SR_benchmark) / SE(SR))
    if se_sr > 0:
        z_score = (sr_daily - sr_ref) / se_sr
        psr = ncdf(z_score)
    else:
        psr = 0.5
        z_score = 0
    # Minimum track record length for 95% confidence
    min_trl = ((1 - sk * sr_daily + (ku / 4) * sr_daily ** 2) / (sr_daily - sr_ref) ** 2) if abs(sr_daily - sr_ref) > 1e-10 else float('inf')
    min_trl = max(0, min_trl) * (1.96 ** 2)  # For 95% confidence
    return {
        "probabilistic_sharpe_ratio": r4(psr),
        "sharpe_ratio": r4(sr_annual),
        "benchmark_sharpe": r4(req.benchmark_sharpe),
        "z_score": r4(z_score),
        "significant_at_95": psr > 0.95,
        "significant_at_99": psr > 0.99,
        "se_sharpe": r6(se_sr * math.sqrt(req.annualization_factor)),
        "skewness": r4(sk), "excess_kurtosis": r4(ku),
        "min_track_record_length": int(min(min_trl, 99999)) if min_trl != float('inf') else None,
        "n": n, "ms": r2((time.perf_counter() - t0) * 1000)
    }


# ══════════════════════════════════════════════════════════════════════════
# TOOL 56: PRESENT VALUE — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T56In(BaseModel):
    future_value: float = Field(
        0, description="Future lump sum to discount")
    payment: float = Field(
        0, description="Periodic payment amount (annuity)")
    rate: float = Field(
        ..., gt=-1, description="Discount rate per period")
    periods: int = Field(
        ..., ge=1, le=1000, description="Number of periods")
    payment_timing: Literal["end", "begin"] = Field(
        "end", description="Payment at end or beginning of period")

@app.post("/v1/tvm/present-value", tags=["TVM"], dependencies=auth)
async def t56(req: T56In):
    """Present value of a future lump sum and/or annuity stream."""
    t0 = time.perf_counter(); hit("tvm/present-value")
    r, n = req.rate, req.periods
    if abs(r) < 1e-14:
        pv_fv = req.future_value
        pv_pmt = req.payment * n
    else:
        pv_fv = req.future_value / (1 + r) ** n
        annuity_factor = (1 - (1 + r) ** -n) / r
        if req.payment_timing == "begin":
            annuity_factor *= (1 + r)
        pv_pmt = req.payment * annuity_factor
    total_pv = pv_fv + pv_pmt
    return {
        "present_value": r4(total_pv), "pv_of_lump_sum": r4(pv_fv),
        "pv_of_annuity": r4(pv_pmt), "total_payments": r2(req.payment * n),
        "discount_factor": r6(1 / (1 + r) ** n) if abs(r) > 1e-14 else 1.0,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 57: FUTURE VALUE — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T57In(BaseModel):
    present_value: float = Field(
        0, description="Present lump sum to grow")
    payment: float = Field(
        0, description="Periodic payment amount (annuity)")
    rate: float = Field(
        ..., gt=-1, description="Interest rate per period")
    periods: int = Field(
        ..., ge=1, le=1000, description="Number of periods")
    payment_timing: Literal["end", "begin"] = Field(
        "end", description="Payment at end or beginning of period")

@app.post("/v1/tvm/future-value", tags=["TVM"], dependencies=auth)
async def t57(req: T57In):
    """Future value of a present lump sum and/or annuity stream."""
    t0 = time.perf_counter(); hit("tvm/future-value")
    r, n = req.rate, req.periods
    if abs(r) < 1e-14:
        fv_pv = req.present_value
        fv_pmt = req.payment * n
    else:
        fv_pv = req.present_value * (1 + r) ** n
        annuity_factor = ((1 + r) ** n - 1) / r
        if req.payment_timing == "begin":
            annuity_factor *= (1 + r)
        fv_pmt = req.payment * annuity_factor
    total_fv = fv_pv + fv_pmt
    return {
        "future_value": r4(total_fv), "fv_of_lump_sum": r4(fv_pv),
        "fv_of_annuity": r4(fv_pmt), "total_payments": r2(req.payment * n),
        "growth_factor": r6((1 + r) ** n) if abs(r) > 1e-14 else 1.0,
        "total_interest": r4(total_fv - req.present_value - req.payment * n),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 58: IRR — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T58In(BaseModel):
    cash_flows: list[float] = Field(
        ..., min_length=2,
        description="Array of cash flows (first is typically negative = initial investment)")

@app.post("/v1/tvm/irr", tags=["TVM"], dependencies=auth)
async def t58(req: T58In):
    """Internal rate of return via Newton-Raphson. First cash flow is typically negative (investment)."""
    t0 = time.perf_counter(); hit("tvm/irr")
    cf = req.cash_flows; n = len(cf)
    # Newton-Raphson
    r = 0.1  # initial guess
    for iteration in range(200):
        npv = sum(cf[t] / (1 + r) ** t for t in range(n))
        dnpv = sum(-t * cf[t] / (1 + r) ** (t + 1) for t in range(1, n))
        if abs(dnpv) < 1e-14:
            break
        r_new = r - npv / dnpv
        r_new = max(-0.99, min(r_new, 10))  # clamp to avoid divergence
        if abs(r_new - r) < 1e-10:
            r = r_new
            break
        r = r_new
    npv_at_irr = sum(cf[t] / (1 + r) ** t for t in range(n))
    total_invested = sum(c for c in cf if c < 0)
    total_received = sum(c for c in cf if c > 0)
    return {
        "irr": r6(r), "irr_pct": r4(r * 100),
        "npv_at_irr": r4(npv_at_irr),
        "total_invested": r2(abs(total_invested)), "total_received": r2(total_received),
        "profit_multiple": r4(total_received / abs(total_invested)) if total_invested != 0 else 0,
        "periods": n - 1, "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 59: NPV — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T59In(BaseModel):
    cash_flows: list[float] = Field(
        ..., min_length=1,
        description="Array of future cash flows (period 1 onward)")
    discount_rate: float = Field(
        ..., gt=-1, description="Discount rate per period")

@app.post("/v1/tvm/npv", tags=["TVM"], dependencies=auth)
async def t59(req: T59In):
    """Net present value of a cash flow series at a given discount rate."""
    t0 = time.perf_counter(); hit("tvm/npv")
    cf = req.cash_flows; r = req.discount_rate; n = len(cf)
    pv_flows = [cf[t] / (1 + r) ** t if abs(r) > 1e-14 else cf[t] for t in range(n)]
    npv = sum(pv_flows)
    # Profitability index: PV of inflows / PV of outflows
    pv_in = sum(pv for pv in pv_flows if pv > 0)
    pv_out = abs(sum(pv for pv in pv_flows if pv < 0))
    pi = pv_in / pv_out if pv_out > 0 else 0
    # Payback period (undiscounted)
    cumulative = 0; payback = None
    for t in range(n):
        cumulative += cf[t]
        if cumulative >= 0 and payback is None:
            payback = t
    return {
        "npv": r4(npv), "decision": "ACCEPT" if npv > 0 else "REJECT",
        "profitability_index": r4(pi),
        "pv_of_cash_flows": [r4(v) for v in pv_flows[:20]],
        "payback_period": payback, "periods": n,
        "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 60: REALIZED VOLATILITY — $0.005
# ══════════════════════════════════════════════════════════════════════════
class T60In(BaseModel):
    close: list[float] = Field(
        ..., min_length=5, description="Array of closing prices")
    high: Optional[list[float]] = Field(
        None, description="Optional array of high prices (for Parkinson/GK/YZ)")
    low: Optional[list[float]] = Field(
        None, description="Optional array of low prices (for Parkinson/GK/YZ)")
    open: Optional[list[float]] = Field(
        None, description="Optional array of opening prices (for GK/YZ)")
    annualization_factor: int = Field(
        252, description="Trading days per year")

@app.post("/v1/stats/realized-volatility", tags=["Statistics"], dependencies=auth)
async def t60(req: T60In):
    """Realized volatility: close-to-close, Parkinson, Garman-Klass, Yang-Zhang from OHLC."""
    t0 = time.perf_counter(); hit("stats/realized-volatility")
    c = req.close; n = len(c); af = req.annualization_factor
    # Close-to-close (standard)
    log_ret = [math.log(c[i] / c[i - 1]) for i in range(1, n) if c[i - 1] > 0 and c[i] > 0]
    m = mu(log_ret)
    cc_var = sum((r_val - m) ** 2 for r_val in log_ret) / len(log_ret) if log_ret else 0
    cc_vol = math.sqrt(cc_var * af)
    result = {
        "close_to_close": r4(cc_vol), "close_to_close_daily": r6(math.sqrt(cc_var)),
    }
    # Parkinson (high-low)
    if req.high and req.low and len(req.high) >= n and len(req.low) >= n:
        h, l = req.high[:n], req.low[:n]
        park_var = sum(math.log(h[i] / l[i]) ** 2 for i in range(n) if l[i] > 0 and h[i] > 0) / (4 * n * math.log(2))
        park_vol = math.sqrt(park_var * af)
        result["parkinson"] = r4(park_vol)
        # Garman-Klass (OHLC)
        if req.open and len(req.open) >= n:
            o = req.open[:n]
            gk_sum = 0
            for i in range(n):
                if o[i] > 0 and c[i] > 0 and h[i] > 0 and l[i] > 0:
                    gk_sum += 0.5 * math.log(h[i] / l[i]) ** 2 - (2 * math.log(2) - 1) * math.log(c[i] / o[i]) ** 2
            gk_var = gk_sum / n
            gk_vol = math.sqrt(max(0, gk_var) * af)
            result["garman_klass"] = r4(gk_vol)
            # Yang-Zhang
            log_oc = [math.log(o[i] / c[i - 1]) for i in range(1, n) if o[i] > 0 and c[i - 1] > 0]
            log_co = [math.log(c[i] / o[i]) for i in range(n) if c[i] > 0 and o[i] > 0]
            if log_oc and log_co:
                m_oc = mu(log_oc); m_co = mu(log_co)
                overnight_var = sum((v - m_oc) ** 2 for v in log_oc) / (len(log_oc) - 1) if len(log_oc) > 1 else 0
                open_close_var = sum((v - m_co) ** 2 for v in log_co) / (len(log_co) - 1) if len(log_co) > 1 else 0
                k = 0.34 / (1.34 + (n + 1) / (n - 1))
                yz_var = overnight_var + k * open_close_var + (1 - k) * park_var
                yz_vol = math.sqrt(max(0, yz_var) * af)
                result["yang_zhang"] = r4(yz_vol)
    result["n"] = n
    result["annualization_factor"] = af
    result["ms"] = r2((time.perf_counter() - t0) * 1000)
    return result

# ══════════════════════════════════════════════════════════════════════════
# TOOL 61: NORMAL DISTRIBUTION — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T61In(BaseModel):
    x: Optional[float] = Field(
        None, description="Value to compute CDF/PDF for")
    p: Optional[float] = Field(
        None, description="Probability for inverse CDF (quantile)")
    mean: float = Field(0, description="Distribution mean")
    std: float = Field(
        1, gt=0, description="Distribution standard deviation")
    confidence_level: Optional[float] = Field(
        None, description="Confidence level for interval (e.g. 0.95)")

@app.post("/v1/stats/normal-distribution", tags=["Statistics"], dependencies=auth)
async def t61(req: T61In):
    """Normal distribution: CDF, PDF, quantile, and confidence intervals."""
    t0 = time.perf_counter(); hit("stats/normal-distribution")
    m, s = req.mean, req.std
    result = {"mean": m, "std": s}
    if req.x is not None:
        z = (req.x - m) / s
        result["x"] = req.x
        result["z_score"] = r6(z)
        result["cdf"] = r6(ncdf(z))
        result["pdf"] = r6(npdf(z) / s)
        result["survival"] = r6(1 - ncdf(z))
    if req.p is not None:
        # Quantile (inverse CDF)
        p = max(0.0001, min(0.9999, req.p))
        z_inv = _norm_inv(p)
        result["quantile"] = r6(m + z_inv * s)
        result["p"] = req.p
    if req.confidence_level is not None:
        cl = req.confidence_level
        alpha = 1 - cl
        z_cl = _norm_inv(1 - alpha / 2)
        result["confidence_interval"] = {
            "level": cl,
            "lower": r6(m - z_cl * s),
            "upper": r6(m + z_cl * s),
            "z_critical": r6(z_cl)
        }
    result["ms"] = r2((time.perf_counter() - t0) * 1000)
    return result

# ══════════════════════════════════════════════════════════════════════════
# TOOL 62: SHARPE RATIO (standalone) — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T62In(BaseModel):
    returns: list[float] = Field(
        ..., min_length=5, max_length=5000, description="Array of periodic returns (max 5000)")
    risk_free_rate: float = Field(
        0.05, description="Annual risk-free rate")
    annualization_factor: int = Field(
        252, description="Trading days per year")

@app.post("/v1/stats/sharpe-ratio", tags=["Statistics"], dependencies=auth)
async def t62(req: T62In):
    """Standalone Sharpe ratio from a returns series."""
    t0 = time.perf_counter(); hit("stats/sharpe-ratio")
    R = req.returns; n = len(R); af = req.annualization_factor
    m = mu(R); s = sd(R)
    rf_period = req.risk_free_rate / af
    excess_mean = m - rf_period
    sharpe = excess_mean / s * math.sqrt(af) if s > 0 else 0
    # Confidence interval (Lo 2002)
    se = math.sqrt((1 + sharpe ** 2 / (2 * af)) / n) * math.sqrt(af) if n > 1 else 0
    return {
        "sharpe_ratio": r4(sharpe), "annualized_return": r4(m * af),
        "annualized_vol": r4(s * math.sqrt(af)),
        "excess_return": r4(excess_mean * af),
        "se_sharpe": r4(se),
        "ci_95_lower": r4(sharpe - 1.96 * se), "ci_95_upper": r4(sharpe + 1.96 * se),
        "n": n, "ms": r2((time.perf_counter() - t0) * 1000)
    }

# ══════════════════════════════════════════════════════════════════════════
# TOOL 63: CAGR — $0.002
# ══════════════════════════════════════════════════════════════════════════
class T63In(BaseModel):
    start_value: float = Field(
        ..., gt=0, description="Starting value")
    end_value: float = Field(
        ..., gt=0, description="Ending value")
    years: float = Field(
        ..., gt=0, description="Time period in years")
    include_projections: bool = Field(
        False, description="Whether to include forward projections")

@app.post("/v1/tvm/cagr", tags=["TVM"], dependencies=auth)
async def t63(req: T63In):
    """Compound Annual Growth Rate with optional forward projections."""
    t0 = time.perf_counter(); hit("tvm/cagr")
    cagr = (req.end_value / req.start_value) ** (1 / req.years) - 1
    total_return = req.end_value / req.start_value - 1
    doubling_time = math.log(2) / math.log(1 + cagr) if cagr > 0 else float('inf')
    result = {
        "cagr": r6(cagr), "cagr_pct": r4(cagr * 100),
        "total_return_pct": r4(total_return * 100),
        "doubling_time_years": r2(min(doubling_time, 9999)),
        "start_value": r2(req.start_value), "end_value": r2(req.end_value),
        "years": r2(req.years),
        "ms": r2((time.perf_counter() - t0) * 1000)
    }
    if req.include_projections:
        projections = []
        for yr in [1, 3, 5, 10, 20]:
            proj = req.end_value * (1 + cagr) ** yr
            projections.append({"years_forward": yr, "projected_value": r2(proj)})
        result["projections"] = projections
    return result


# ══════════════════════════════════════════════════════════════════════════
# HEALTH + TOOL DISCOVERY + METRICS
# ══════════════════════════════════════════════════════════════════════════
@app.get("/health")
async def health():
    return {"status": "ok", "service": "quantoracle", "version": "2.0.0",
            "domain": "quantoracle.dev", "tools": len(PRICES),
            "uptime": str(datetime.now(timezone.utc) - _boot)}

@app.get("/metrics")
async def metrics():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        conn = _get_db()
        # All-time totals
        total = conn.execute("SELECT COUNT(*), COALESCE(SUM(price),0) FROM calls").fetchone()
        first = conn.execute("SELECT MIN(ts) FROM calls").fetchone()
        # By endpoint (all-time)
        by_ep = dict(conn.execute(
            "SELECT endpoint, COUNT(*) FROM calls GROUP BY endpoint ORDER BY COUNT(*) DESC"
        ).fetchall())
        # Today stats
        t_total = conn.execute("SELECT COUNT(*) FROM calls WHERE date=?", (today,)).fetchone()[0]
        t_ips = conn.execute("SELECT COUNT(DISTINCT ip) FROM calls WHERE date=?", (today,)).fetchone()[0]
        t_top_ep = dict(conn.execute(
            "SELECT endpoint, COUNT(*) FROM calls WHERE date=? GROUP BY endpoint ORDER BY COUNT(*) DESC LIMIT 10", (today,)
        ).fetchall())
        t_top_ip = dict(conn.execute(
            "SELECT ip, COUNT(*) FROM calls WHERE date=? GROUP BY ip ORDER BY COUNT(*) DESC LIMIT 20", (today,)
        ).fetchall())
        # All-time IP stats
        all_ips = conn.execute("SELECT COUNT(DISTINCT ip) FROM calls").fetchone()[0]
        all_days = conn.execute("SELECT COUNT(DISTINCT date) FROM calls").fetchone()[0]
        # Daily history (last 30 days)
        daily = dict(conn.execute(
            "SELECT date, COUNT(*) FROM calls WHERE date >= ? GROUP BY date ORDER BY date",
            ((datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d"),)
        ).fetchall())
        # Source breakdown (all-time + today)
        by_source_all = dict(conn.execute(
            "SELECT source, COUNT(*) FROM calls GROUP BY source ORDER BY COUNT(*) DESC"
        ).fetchall())
        by_source_today = dict(conn.execute(
            "SELECT source, COUNT(*) FROM calls WHERE date=? GROUP BY source ORDER BY COUNT(*) DESC", (today,)
        ).fetchall())
        # Top user-agents today (truncated to 80 chars for readability)
        top_ua_today = dict(conn.execute(
            "SELECT substr(user_agent, 1, 80), COUNT(*) FROM calls WHERE date=? AND user_agent != '' GROUP BY substr(user_agent, 1, 80) ORDER BY COUNT(*) DESC LIMIT 15", (today,)
        ).fetchall())
        # External traffic (exclude localhost)
        ext_today = conn.execute(
            "SELECT COUNT(*), COUNT(DISTINCT ip) FROM calls WHERE date=? AND ip NOT IN ('127.0.0.1','unknown','localhost')",
            (today,)
        ).fetchone()
        # Settlements (real x402 payments that cleared)
        settle_all = conn.execute(
            "SELECT COUNT(*), COALESCE(SUM(amount_usdc),0) FROM settlements"
        ).fetchone()
        settle_today = conn.execute(
            "SELECT COUNT(*), COALESCE(SUM(amount_usdc),0) FROM settlements WHERE date=?", (today,)
        ).fetchone()
        settle_by_network = dict(conn.execute(
            "SELECT network, COUNT(*) FROM settlements GROUP BY network ORDER BY COUNT(*) DESC"
        ).fetchall())
        recent_settlements = [
            {"ts": r[0], "endpoint": r[1], "amount_usdc": r[2], "network": r[3], "tx_hash": r[4]}
            for r in conn.execute(
                "SELECT ts, endpoint, amount_usdc, network, tx_hash FROM settlements ORDER BY id DESC LIMIT 10"
            ).fetchall()
        ]
        conn.close()
        return {
            "calls": total[0], "by_endpoint": by_ep,
            "hypothetical_revenue": round(total[1], 4),
            "settled_revenue": round(settle_all[1], 4),
            "settlement_count": settle_all[0],
            "settlements": {
                "all_time_count": settle_all[0],
                "all_time_usdc": round(settle_all[1], 4),
                "today_count": settle_today[0],
                "today_usdc": round(settle_today[1], 4),
                "by_network": settle_by_network,
                "recent": recent_settlements,
            },
            "first_call": first[0], "uptime": str(datetime.now(timezone.utc) - _boot),
            "today": {
                "date": today, "calls": t_total, "unique_ips": t_ips,
                "top_endpoints": t_top_ep, "top_callers": t_top_ip,
                "by_source": by_source_today,
                "top_user_agents": top_ua_today,
                "external": {"calls": ext_today[0], "unique_ips": ext_today[1]},
            },
            "all_time": {"unique_ips": all_ips, "days_tracked": all_days},
            "by_source": by_source_all,
            "daily_history": daily,
            "note": "hypothetical_revenue = calls * price. settled_revenue = actual x402 USDC settlements recorded.",
        }
    except Exception as e:
        return {"error": "metrics_unavailable", "detail": str(e)}


# ── Settlement recording endpoint (internal — called by Worker) ──────────
class SettlementIn(BaseModel):
    endpoint: str = Field(..., description="Path like /v1/risk/full-analysis")
    amount_usdc: float = Field(..., gt=0, description="USDC amount settled")
    network: str = Field(..., description="Network identifier, e.g. eip155:8453 or solana:...")
    tx_hash: Optional[str] = Field(None, description="On-chain transaction hash")
    payer: Optional[str] = Field(None, description="Payer address")
    source: Optional[str] = Field("x402", description="Traffic source tag")

@app.post("/internal/settlement", include_in_schema=False)
async def record_settlement(req: SettlementIn, x_internal_key: Optional[str] = Header(None)):
    """Worker calls this after a successful x402 settlement so metrics reflect real revenue."""
    # Gate: only accept from Worker with the internal shared secret
    expected = os.environ.get("INTERNAL_SETTLEMENT_KEY")
    if expected and x_internal_key != expected:
        raise HTTPException(401, "Invalid internal key")
    now = datetime.now(timezone.utc)
    try:
        conn = _get_db()
        conn.execute(
            "INSERT INTO settlements (ts, date, endpoint, amount_usdc, network, tx_hash, payer, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (now.isoformat(), now.strftime("%Y-%m-%d"), req.endpoint, req.amount_usdc, req.network, req.tx_hash, req.payer, req.source or "x402"),
        )
        conn.commit()
        conn.close()
        return {"ok": True, "ts": now.isoformat()}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/tools")
async def tools():
    """MCP-compatible tool listing for agent discovery."""
    return {
        "name": "quantoracle", "version": "2.0.0", "homepage": "https://quantoracle.dev",
        "description": "63 deterministic quant computation tools for financial agents",
        "payment": {"protocol": "x402", "network": "base", "currency": "USDC"},
        "tools": [{"name": k, "path": f"/v1/{k}", "price_usdc": v} for k, v in PRICES.items()]
    }

# ══════════════════════════════════════════════════════════════════════════
# COMPOSITE HELPERS — reusable math for composite endpoints
# ══════════════════════════════════════════════════════════════════════════
def _bs(S, K, T, r, sigma, q=0, cp="call"):
    """Black-Scholes price + greeks. Matches t1 exactly."""
    if T <= 0 or sigma <= 0:
        return {"price": 0, "delta": 0, "gamma": 0, "theta": 0, "vega": 0}
    sT = math.sqrt(T)
    d1 = (math.log(S / K) + (r - q + sigma**2 / 2) * T) / (sigma * sT)
    d2 = d1 - sigma * sT
    eqT, erT = math.exp(-q * T), math.exp(-r * T)
    n1 = npdf(d1); N1 = ncdf(d1); N2 = ncdf(d2)
    if cp == "call":
        pr = S * eqT * N1 - K * erT * N2
        dl = eqT * N1
        th = (-S * eqT * n1 * sigma / (2 * sT) - r * K * erT * N2 + q * S * eqT * N1) / 365
    else:
        pr = K * erT * ncdf(-d2) - S * eqT * ncdf(-d1)
        dl = -eqT * ncdf(-d1)
        th = (-S * eqT * n1 * sigma / (2 * sT) + r * K * erT * ncdf(-d2) - q * S * eqT * ncdf(-d1)) / 365
    gm = eqT * n1 / (S * sigma * sT)
    vg = S * eqT * n1 * sT / 100
    return {"price": r4(pr), "delta": r6(dl), "gamma": r6(gm), "theta": r6(th), "vega": r6(vg)}

def _rsi(prices, period=14):
    """RSI from price series."""
    ch = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    g = [max(0, c) for c in ch[-period:]]
    l = [max(0, -c) for c in ch[-period:]]
    ag, al = mu(g), mu(l)
    rs = ag / al if al > 0 else 100
    return round(100 - 100 / (1 + rs), 2)

def _sma(prices, period):
    return mu(prices[-min(period, len(prices)):])

def _realized_vol(prices, window=None):
    """Annualized close-to-close vol using population variance (matches t60)."""
    p = prices if window is None else prices[-window:]
    lr = [math.log(p[i] / p[i-1]) for i in range(1, len(p)) if p[i-1] > 0 and p[i] > 0]
    if not lr: return 0
    m = mu(lr)
    pop_var = sum((x - m)**2 for x in lr) / len(lr)
    return math.sqrt(pop_var * 252)

def _regime_vol(prices, window=None):
    """Annualized vol using arithmetic returns (matches t11 regime detection)."""
    p = prices if window is None else prices[-window:]
    rt = [p[i] / p[i-1] - 1 for i in range(1, len(p))]
    return sd(rt) * math.sqrt(252) if rt else 0

def _max_dd(equity):
    """Max drawdown from equity curve. Returns (max_dd, current_dd)."""
    pk = equity[0]; mdd = 0; cur = 0
    for v in equity:
        if v > pk: pk = v
        dd = (v - pk) / pk if pk > 0 else 0
        mdd = min(mdd, dd); cur = dd
    return mdd, cur

def _hurst_calc(series):
    """Hurst exponent via R/S. Returns (hurst, interpretation)."""
    n = len(series)
    if n < 20:
        return 0.5, "INSUFFICIENT_DATA"
    log_n = []; log_rs = []; w = 10
    max_w = n // 2
    while w <= max_w:
        rs_vals = []
        for start in range(0, n - w + 1, w):
            chunk = series[start:start + w]
            m = mu(chunk); s_val = sd(chunk)
            if s_val < 1e-14: continue
            running = 0; cumdev = []
            for v in chunk:
                running += v - m; cumdev.append(running)
            R = max(cumdev) - min(cumdev)
            rs_vals.append(R / s_val)
        if rs_vals:
            log_n.append(math.log(w)); log_rs.append(math.log(mu(rs_vals)))
        w = int(w * 1.5) if w < 50 else w + max(10, w // 4)
    if len(log_n) < 2:
        return 0.5, "INSUFFICIENT_DATA"
    mn = mu(log_n); mr = mu(log_rs)
    h = sum((log_n[i] - mn) * (log_rs[i] - mr) for i in range(len(log_n))) / sum((log_n[i] - mn)**2 for i in range(len(log_n)))
    interp = "MEAN_REVERTING" if h < 0.4 else "TRENDING" if h > 0.6 else "RANDOM_WALK"
    return round(h, 4), interp


# ══════════════════════════════════════════════════════════════════════════
# COMPOSITE 1: SPREAD SCAN — $0.05
# ══════════════════════════════════════════════════════════════════════════
class SpreadScanIn(BaseModel):
    spot: float = Field(..., gt=0, description="Current spot price")
    vol: float = Field(..., gt=0, description="Implied volatility (annualized)")
    dte_years: float = Field(..., gt=0, description="Days to expiration in years")
    r: float = Field(0.05, description="Risk-free rate")
    q: float = Field(0, description="Dividend yield")
    strategy: Literal["bull_call_spread", "bear_put_spread", "bull_put_spread", "bear_call_spread"] = Field("bull_call_spread")
    num_candidates: int = Field(8, ge=2, le=20, description="Number of spread candidates to evaluate")
    strike_range_pct: float = Field(0.10, gt=0, le=0.50, description="Strike range as fraction of spot")

@app.post("/v1/options/spread-scan", tags=["Composite"], dependencies=auth)
async def spread_scan(req: SpreadScanIn):
    """Scan and rank vertical spreads by risk/reward. Replaces 8-16 individual options/price calls."""
    t0 = time.perf_counter(); hit("options/spread-scan")
    S, vol, T, r, q = req.spot, req.vol, req.dte_years, req.r, req.q
    lo = S * (1 - req.strike_range_pct)
    hi = S * (1 + req.strike_range_pct)
    step = (hi - lo) / (req.num_candidates + 1)
    strikes = [round(lo + step * (i + 1), 2) for i in range(req.num_candidates)]

    candidates = []
    for i in range(len(strikes) - 1):
        K1, K2 = strikes[i], strikes[i + 1]
        width = K2 - K1
        if req.strategy == "bull_call_spread":
            buy = _bs(S, K1, T, r, vol, q, "call"); sell = _bs(S, K2, T, r, vol, q, "call")
            debit = buy["price"] - sell["price"]
            max_profit = width - debit; max_loss = debit
        elif req.strategy == "bear_put_spread":
            buy = _bs(S, K2, T, r, vol, q, "put"); sell = _bs(S, K1, T, r, vol, q, "put")
            debit = buy["price"] - sell["price"]
            max_profit = width - debit; max_loss = debit
        elif req.strategy == "bull_put_spread":
            sell_leg = _bs(S, K2, T, r, vol, q, "put"); buy_leg = _bs(S, K1, T, r, vol, q, "put")
            credit = sell_leg["price"] - buy_leg["price"]
            max_profit = credit; max_loss = width - credit; debit = -credit
        elif req.strategy == "bear_call_spread":
            sell_leg = _bs(S, K1, T, r, vol, q, "call"); buy_leg = _bs(S, K2, T, r, vol, q, "call")
            credit = sell_leg["price"] - buy_leg["price"]
            max_profit = credit; max_loss = width - credit; debit = -credit

        rr = max_profit / max_loss if max_loss > 0 else float('inf')
        if req.strategy in ("bull_call_spread", "bear_put_spread"):
            be = K1 + debit if "call" in req.strategy else K2 - debit
        else:
            be = K2 - max_profit if "put" in req.strategy else K1 + max_profit

        candidates.append({
            "strikes": [K1, K2], "width": r2(width),
            "net_debit_credit": r4(debit),
            "max_profit": r4(max_profit), "max_loss": r4(max_loss),
            "risk_reward": r4(rr), "breakeven": r2(be),
            "buy_leg": buy if req.strategy in ("bull_call_spread", "bear_put_spread") else buy_leg,
            "sell_leg": sell if req.strategy in ("bull_call_spread", "bear_put_spread") else sell_leg,
        })

    candidates.sort(key=lambda c: c["risk_reward"], reverse=True)
    return {
        "strategy": req.strategy, "spot": S, "vol": vol, "dte_years": T,
        "candidates": candidates,
        "best": candidates[0] if candidates else None,
        "ms": r2((time.perf_counter() - t0) * 1000),
    }


# ══════════════════════════════════════════════════════════════════════════
# COMPOSITE 2: REGIME CLASSIFY — $0.015
# ══════════════════════════════════════════════════════════════════════════
class RegimeClassifyIn(BaseModel):
    closes: list[float] = Field(..., min_length=30, description="Closing prices")
    opens: Optional[list[float]] = Field(None, description="Opening prices (optional, improves vol estimate)")
    highs: Optional[list[float]] = Field(None, description="High prices (optional, improves vol estimate)")
    lows: Optional[list[float]] = Field(None, description="Low prices (optional, improves vol estimate)")
    sma_period: int = Field(50, description="SMA period for trend")
    vol_window: int = Field(21, description="Rolling vol window")
    rsi_period: int = Field(14, description="RSI period")

@app.post("/v1/indicators/regime-classify", tags=["Composite"], dependencies=auth)
async def regime_classify(req: RegimeClassifyIn):
    """Combined regime classification: trend, vol, RSI, direction, strategy suggestion. Replaces technical + regime + realized-vol."""
    t0 = time.perf_counter(); hit("indicators/regime-classify")
    p = req.closes; n = len(p)
    # SMA + trend
    sma = _sma(p, req.sma_period)
    price_vs_sma = p[-1] / sma - 1
    trend = "UPTREND" if p[-1] > sma else "DOWNTREND"
    # RSI
    rsi = _rsi(p, req.rsi_period)
    # Regime vol uses arithmetic returns (matches t11)
    rv = _regime_vol(p, req.vol_window)
    lv = _regime_vol(p)
    ratio = rv / lv if lv > 0 else 1
    vol_regime = "CRISIS" if ratio > 2 else "HIGH_VOL" if ratio > 1.3 else "LOW_VOL" if ratio < 0.7 else "NORMAL"
    # Enhanced vol if OHLC provided (log returns for Parkinson, matches t60)
    vol_methods = {"close_to_close": r4(rv)}
    if req.highs and req.lows and len(req.highs) >= n and len(req.lows) >= n:
        h, l = req.highs[:n], req.lows[:n]
        park_var = sum(math.log(h[i]/l[i])**2 for i in range(n) if l[i] > 0 and h[i] > 0) / (4 * n * math.log(2))
        vol_methods["parkinson"] = r4(math.sqrt(park_var * 252))
    # Direction + strength
    slope_5 = (p[-1] / p[-min(5, n)] - 1) * 100
    slope_20 = (p[-1] / p[-min(20, n)] - 1) * 100
    direction = "STRONG_UP" if slope_5 > 2 and slope_20 > 5 else "UP" if slope_5 > 0 and slope_20 > 0 else "STRONG_DOWN" if slope_5 < -2 and slope_20 < -5 else "DOWN" if slope_5 < 0 and slope_20 < 0 else "CHOPPY"
    # Composite
    composite = "RISK_ON" if trend == "UPTREND" and vol_regime in ("NORMAL", "LOW_VOL") else "DEFENSIVE" if vol_regime == "CRISIS" else "NEUTRAL"
    # Strategy suggestion
    if composite == "RISK_ON" and rsi < 70:
        strategy = "TREND_FOLLOW"
    elif composite == "DEFENSIVE":
        strategy = "REDUCE_EXPOSURE"
    elif rsi > 70:
        strategy = "TAKE_PROFITS"
    elif rsi < 30:
        strategy = "MEAN_REVERSION_LONG"
    else:
        strategy = "WAIT"
    return {
        "trend": trend, "sma": r2(sma), "price_vs_sma_pct": r4(price_vs_sma * 100),
        "rsi": rsi,
        "vol_regime": vol_regime, "realized_vol": vol_methods, "vol_ratio": r4(ratio),
        "direction": direction, "slope_5d_pct": r2(slope_5), "slope_20d_pct": r2(slope_20),
        "composite": composite, "suggested_strategy": strategy,
        "ms": r2((time.perf_counter() - t0) * 1000),
    }


# ══════════════════════════════════════════════════════════════════════════
# COMPOSITE 3: FULL ANALYSIS — $0.04
# ══════════════════════════════════════════════════════════════════════════
class FullAnalysisIn(BaseModel):
    # Paid composite endpoint — cap at 5000 still applies. Power users with
    # longer histories can downsample or call individual endpoints in batch.
    returns: list[float] = Field(..., min_length=10, max_length=5000, description="Daily returns series (max 5000)")
    equity_curve: Optional[list[float]] = Field(None, max_length=5000, description="Equity curve (optional, derived from returns if omitted)")
    portfolio_value: float = Field(100000, gt=0, description="Current portfolio value")
    risk_free_rate: float = Field(0.045, description="Annual risk-free rate")

@app.post("/v1/risk/full-analysis", tags=["Composite"], dependencies=auth)
async def full_analysis(req: FullAnalysisIn):
    """Complete risk tearsheet: Sharpe, Sortino, VaR, Kelly, drawdown, Hurst, CAGR. Replaces 7 individual calls."""
    t0 = time.perf_counter(); hit("risk/full-analysis")
    R = req.returns; n = len(R); m = mu(R); s = sd(R); rf_d = req.risk_free_rate / 252
    ar = m * 252; av = s * math.sqrt(252)
    # Sharpe + Sortino
    sh = (ar - req.risk_free_rate) / av if av > 0 else 0
    dn = [r_val - rf_d for r_val in R if r_val < rf_d]
    dd_dev = math.sqrt(sum(d**2 for d in dn) / n) if dn else 0
    so = (ar - req.risk_free_rate) / (dd_dev * math.sqrt(252)) if dd_dev > 0 else 0
    # VaR + CVaR
    sr = sorted(R); v5i = max(0, int(n * 0.05) - 1)
    var95 = sr[v5i]; cvar95 = mu(sr[:v5i + 1]) if v5i > 0 else var95
    # Equity curve + drawdown
    eq = req.equity_curve
    if not eq:
        eq = [req.portfolio_value]
        for r_val in R:
            eq.append(eq[-1] * (1 + r_val))
    mdd, cur_dd = _max_dd(eq)
    # CAGR
    years = n / 252
    cagr = (eq[-1] / eq[0]) ** (1 / years) - 1 if years > 0 and eq[0] > 0 else 0
    # Kelly
    v = va(R); kelly = m / v if v > 0 else 0
    # Hurst
    hurst, hurst_interp = _hurst_calc([math.log(eq[i] / eq[i-1]) for i in range(1, len(eq)) if eq[i-1] > 0 and eq[i] > 0] if len(eq) > 20 else R)
    # Calmar
    calmar = ar / abs(mdd) if mdd != 0 else 0
    # Win rate
    wins = sum(1 for r_val in R if r_val > 0)
    return {
        "returns": {"annualized": r4(ar), "vol": r4(av), "total_pct": r4((eq[-1] / eq[0] - 1) * 100), "cagr": r4(cagr)},
        "risk": {"sharpe": r4(sh), "sortino": r4(so), "calmar": r4(calmar),
                 "var_95": r4(var95), "cvar_95": r4(cvar95),
                 "max_drawdown": r4(mdd), "current_drawdown": r4(cur_dd)},
        "kelly": {"full_kelly_leverage": r4(kelly), "half_kelly": r4(kelly / 2)},
        "hurst": {"exponent": hurst, "interpretation": hurst_interp},
        "portfolio": {"start_value": r2(eq[0]), "end_value": r2(eq[-1]), "win_rate": r4(wins / n)},
        "n": n, "trading_days": n, "years": r2(years),
        "ms": r2((time.perf_counter() - t0) * 1000),
    }


# ══════════════════════════════════════════════════════════════════════════
# COMPOSITE 4: TRADE EVALUATE — $0.025
# ══════════════════════════════════════════════════════════════════════════
class TradeEvaluateIn(BaseModel):
    entry_price: float = Field(..., gt=0, description="Planned entry price")
    stop_loss: float = Field(..., gt=0, description="Stop loss price")
    take_profit: float = Field(..., gt=0, description="Take profit price")
    account_size: float = Field(..., gt=0, description="Total account value")
    risk_per_trade: float = Field(0.02, description="Max risk per trade as fraction")
    prices: list[float] = Field(..., min_length=14, description="Recent price history for signals")
    returns: Optional[list[float]] = Field(None, description="Historical returns for Kelly (optional)")
    commission_per_share: float = Field(0.005, description="Commission per share")
    spread_bps: float = Field(5, description="Bid-ask spread in basis points")
    adv: float = Field(5000000, description="Average daily volume in USD")

@app.post("/v1/trade/evaluate", tags=["Composite"], dependencies=auth)
async def trade_evaluate(req: TradeEvaluateIn):
    """Complete trade evaluation: sizing, risk/reward, Kelly, costs, regime, signals. Replaces 5 individual calls."""
    t0 = time.perf_counter(); hit("trade/evaluate")
    entry, stop, tp = req.entry_price, req.stop_loss, req.take_profit
    # Risk/reward
    risk_per_share = abs(entry - stop)
    reward_per_share = abs(tp - entry)
    rr_ratio = reward_per_share / risk_per_share if risk_per_share > 0 else 0
    direction = "LONG" if tp > entry else "SHORT"
    # Position sizing
    dollar_risk = req.account_size * req.risk_per_trade
    shares = int(dollar_risk / risk_per_share) if risk_per_share > 0 else 0
    position_value = shares * entry
    pct_account = position_value / req.account_size if req.account_size > 0 else 0
    # Transaction cost estimate (matches t54 exactly)
    spread_cost = position_value * req.spread_bps / 10000 / 2  # half-spread
    commission = shares * req.commission_per_share
    participation = position_value / req.adv if req.adv > 0 else 0
    impact_bps = 10 * math.sqrt(min(participation, 1))
    impact = position_value * impact_bps / 10000
    one_way_cost = spread_cost + commission + impact
    total_cost = one_way_cost * 2  # round trip
    cost_pct = total_cost / position_value * 100 if position_value > 0 else 0
    # Signals from prices
    rsi = _rsi(req.prices)
    sma = _sma(req.prices, 14)
    trend = "BULLISH" if req.prices[-1] > sma and rsi > 50 else "BEARISH"
    # Regime (short window vs long window, matches t11)
    rv = _regime_vol(req.prices, min(21, len(req.prices) - 1))
    lv = _regime_vol(req.prices)
    ratio = rv / lv if lv > 0 else 1
    vol_regime = "CRISIS" if ratio > 2 else "HIGH_VOL" if ratio > 1.3 else "LOW_VOL" if ratio < 0.7 else "NORMAL"
    # Kelly from returns if provided
    kelly = None
    if req.returns and len(req.returns) >= 10:
        m_r = mu(req.returns); v_r = va(req.returns)
        kelly = {"full_kelly": r4(m_r / v_r if v_r > 0 else 0), "half_kelly": r4(m_r / v_r / 2 if v_r > 0 else 0)}
    # Signals alignment
    signals = []
    if rsi > 70: signals.append("RSI_OVERBOUGHT")
    elif rsi < 30: signals.append("RSI_OVERSOLD")
    signals.append("ABOVE_SMA" if req.prices[-1] > sma else "BELOW_SMA")
    aligned = (direction == "LONG" and trend == "BULLISH") or (direction == "SHORT" and trend == "BEARISH")
    return {
        "direction": direction, "risk_reward": r4(rr_ratio),
        "position": {"shares": shares, "value": r2(position_value), "pct_account": r4(pct_account),
                      "risk_per_share": r4(risk_per_share), "max_loss": r2(shares * risk_per_share),
                      "max_profit": r2(shares * reward_per_share)},
        "costs": {"round_trip": r2(total_cost), "pct_of_position": r4(cost_pct),
                  "spread": r2(spread_cost), "commission": r2(commission), "impact": r2(impact)},
        "signals": {"rsi": rsi, "sma": r2(sma), "trend": trend, "signals": signals, "aligned_with_trade": aligned},
        "regime": {"realized_vol": r4(rv), "vol_regime": vol_regime},
        "kelly": kelly,
        "verdict": "FAVORABLE" if aligned and rr_ratio >= 2 and vol_regime != "HIGH" else "CAUTION" if rr_ratio >= 1.5 else "UNFAVORABLE",
        "ms": r2((time.perf_counter() - t0) * 1000),
    }


# ══════════════════════════════════════════════════════════════════════════
# COMPOSITE 5: PORTFOLIO HEALTH — $0.04
# ══════════════════════════════════════════════════════════════════════════
class PortfolioHoldingItem(BaseModel):
    asset: str = Field(..., description="Asset name")
    value: float = Field(..., description="Current market value")
    target_weight: float = Field(..., description="Target allocation weight (%)")
    returns: list[float] = Field(..., min_length=5, description="Daily returns for this asset")
    beta: float = Field(1.0, description="Market beta (for stress test)")
    duration: float = Field(0, description="Bond duration (for rate stress)")

class PortfolioHealthIn(BaseModel):
    holdings: list[PortfolioHoldingItem] = Field(..., min_length=2, description="Portfolio holdings")
    risk_free_rate: float = Field(0.045, description="Annual risk-free rate")
    rebalance_threshold_pct: float = Field(5, description="Drift threshold to trigger rebalance (%)")
    min_trade_usd: float = Field(100, description="Minimum trade size in USD")

@app.post("/v1/portfolio/health", tags=["Composite"], dependencies=auth)
async def portfolio_health(req: PortfolioHealthIn):
    """Full portfolio health check: risk metrics, correlation, drawdown, rebalance, stress test. Replaces 6 individual calls."""
    t0 = time.perf_counter(); hit("portfolio/health")
    holdings = req.holdings
    if len(holdings) < 2:
        raise HTTPException(400, "Need at least 2 holdings")
    nh = len(holdings)
    total = sum(h.value for h in holdings)
    names = [h.asset for h in holdings]
    min_len = min(len(h.returns) for h in holdings)
    returns_data = [h.returns[:min_len] for h in holdings]
    # Portfolio returns (weighted)
    weights = [h.value / total for h in holdings]
    port_ret = [sum(weights[j] * returns_data[j][i] for j in range(nh)) for i in range(min_len)]
    # Portfolio risk metrics
    m = mu(port_ret); s = sd(port_ret); ar = m * 252; av = s * math.sqrt(252)
    sh = (ar - req.risk_free_rate) / av if av > 0 else 0
    sr = sorted(port_ret); v5i = max(0, int(min_len * 0.05) - 1)
    var95 = sr[v5i]
    # Drawdown
    eq = [total];
    for r_val in port_ret:
        eq.append(eq[-1] * (1 + r_val))
    mdd, cur_dd = _max_dd(eq)
    # Correlation matrix
    vols = [sd(d) for d in returns_data]
    corr = [[r4(cv(returns_data[i], returns_data[j]) / (vols[i] * vols[j])) if vols[i] > 0 and vols[j] > 0 else (1.0 if i == j else 0.0)
             for j in range(nh)] for i in range(nh)]
    # Rebalance check (matches t37)
    drifts = []; trades = []; max_drift = 0
    for h in holdings:
        cur_w = h.value / total * 100; drift = cur_w - h.target_weight
        max_drift = max(max_drift, abs(drift))
        drifts.append({"asset": h.asset, "current_weight": r2(cur_w), "target_weight": r2(h.target_weight), "drift_pct": r2(drift)})
        target_val = total * h.target_weight / 100
        trade_val = target_val - h.value
        if abs(trade_val) >= req.min_trade_usd:
            trades.append({"asset": h.asset, "action": "BUY" if trade_val > 0 else "SELL", "amount": r2(abs(trade_val))})
    # Stress test (matches t46)
    scenarios = [
        {"name": "2008 Crisis", "market_shock_pct": -40, "rate_shock_bps": -200},
        {"name": "Rate Hike +200bps", "market_shock_pct": -10, "rate_shock_bps": 200},
        {"name": "Flash Crash -15%", "market_shock_pct": -15, "rate_shock_bps": 0},
    ]
    stress = []
    for sc in scenarios:
        pnl = sum(h.value * h.beta * sc["market_shock_pct"] / 100 - h.value * h.duration * sc["rate_shock_bps"] / 10000 for h in holdings)
        stress.append({"scenario": sc["name"], "pnl": r2(pnl), "pnl_pct": r4(pnl / total * 100)})
    return {
        "portfolio_value": r2(total),
        "risk": {"sharpe": r4(sh), "annualized_return": r4(ar), "annualized_vol": r4(av),
                 "var_95": r4(var95), "max_drawdown": r4(mdd), "current_drawdown": r4(cur_dd)},
        "correlation": {"assets": names, "matrix": corr, "volatilities": {names[i]: r4(vols[i] * math.sqrt(252)) for i in range(nh)}},
        "rebalance": {"needs_rebalance": max_drift > req.rebalance_threshold_pct, "max_drift_pct": r2(max_drift), "drifts": drifts, "trades": trades},
        "stress_test": stress,
        "n_periods": min_len,
        "ms": r2((time.perf_counter() - t0) * 1000),
    }


# ══════════════════════════════════════════════════════════════════════════
# COMPOSITE 6: PAIRS SIGNAL — $0.025
# ══════════════════════════════════════════════════════════════════════════
class PairsSignalIn(BaseModel):
    series_a: list[float] = Field(..., min_length=20, description="Price series for asset A")
    series_b: list[float] = Field(..., min_length=20, description="Price series for asset B")
    name_a: str = Field("A", description="Name of asset A")
    name_b: str = Field("B", description="Name of asset B")
    significance: Literal["0.01", "0.05", "0.10"] = Field("0.05")

@app.post("/v1/pairs/signal", tags=["Composite"], dependencies=auth)
async def pairs_signal(req: PairsSignalIn):
    """Complete pairs trading signal: cointegration, Hurst, z-score, half-life, hedge ratio. Replaces 4 individual calls."""
    t0 = time.perf_counter(); hit("pairs/signal")
    a, b = req.series_a, req.series_b
    n = min(len(a), len(b)); a = a[:n]; b = b[:n]
    # OLS: b = alpha + beta * a
    ma, mb = mu(a), mu(b)
    beta = sum((a[i] - ma) * (b[i] - mb) for i in range(n)) / sum((a[i] - ma)**2 for i in range(n))
    alpha = mb - beta * ma
    spread = [b[i] - alpha - beta * a[i] for i in range(n)]
    # ADF on spread
    ds = [spread[i] - spread[i-1] for i in range(1, len(spread))]
    lag = spread[:-1]; ns = len(ds)
    sl = mu(lag); sd_l = mu(ds)
    ss_lag = sum((lag[i] - sl)**2 for i in range(ns))
    gamma = sum((lag[i] - sl) * (ds[i] - sd_l) for i in range(ns)) / ss_lag if ss_lag > 0 else 0
    intercept_adf = sd_l - gamma * sl
    residuals = [ds[i] - intercept_adf - gamma * lag[i] for i in range(ns)]
    se = math.sqrt(sum(r_val**2 for r_val in residuals) / (ns - 2) / ss_lag) if ss_lag > 0 and ns > 2 else 1
    adf_stat = gamma / se if se > 0 else 0
    crit = {"0.01": -3.90, "0.05": -3.34, "0.10": -3.04}
    cointegrated = adf_stat < crit[req.significance]
    # Half-life
    half_life = -math.log(2) / gamma if gamma < 0 else float('inf')
    # Spread stats
    sp_mean = mu(spread); sp_std = sd(spread)
    current_z = (spread[-1] - sp_mean) / sp_std if sp_std > 0 else 0
    # Hurst on spread
    hurst, hurst_interp = _hurst_calc(spread)
    # Correlation
    sa, sb = sd(a), sd(b)
    corr = cv(a, b) / (sa * sb) if sa > 0 and sb > 0 else 0
    # Signal
    if not cointegrated:
        signal = "NO_TRADE"
        reason = "Not cointegrated"
    elif current_z > 2:
        signal = f"SHORT_{req.name_b}_LONG_{req.name_a}"
        reason = f"Spread z-score {r2(current_z)} > 2 (overextended)"
    elif current_z < -2:
        signal = f"LONG_{req.name_b}_SHORT_{req.name_a}"
        reason = f"Spread z-score {r2(current_z)} < -2 (underextended)"
    elif abs(current_z) < 0.5:
        signal = "CLOSE_POSITION"
        reason = "Spread near mean"
    else:
        signal = "WAIT"
        reason = f"Z-score {r2(current_z)} between thresholds"
    return {
        "cointegration": {"cointegrated": cointegrated, "adf_statistic": r4(adf_stat),
                          "critical_value": crit[req.significance], "significance": req.significance},
        "hedge_ratio": r6(beta), "intercept": r6(alpha),
        "spread": {"mean": r4(sp_mean), "std": r4(sp_std), "current": r4(spread[-1]), "current_zscore": r4(current_z)},
        "half_life": r2(min(half_life, 9999)),
        "hurst": {"exponent": hurst, "interpretation": hurst_interp},
        "correlation": r4(corr),
        "signal": signal, "reason": reason,
        "pair": [req.name_a, req.name_b],
        "ms": r2((time.perf_counter() - t0) * 1000),
    }


# ══════════════════════════════════════════════════════════════════════════
# LIVE DATA — fresh market data + compute (the paid data-moat tier)
# Sources picked for reachability FROM THE DROPLET (Binance/Bybit are
# geo-blocked here: 451/403). Volatility -> Kraken OHLC; funding -> OKX.
# Results are cached in SQLite (live_cache) so the 4 gunicorn workers share
# TTL'd data and we don't hammer upstreams. Stale-on-error: if the upstream
# is down we serve the last good value (flagged) rather than failing.
# ══════════════════════════════════════════════════════════════════════════
import json as _json

_LIVE_UA = "quantoracle-live/1.0 (+https://quantoracle.dev)"

def _cache_read(key):
    try:
        conn = _get_db()
        row = conn.execute("SELECT json, fetched_at FROM live_cache WHERE key=?", (key,)).fetchone()
        conn.close()
        if row:
            return _json.loads(row[0]), row[1]
    except Exception:
        pass
    return None, None

def _cache_write(key, data, ts):
    try:
        conn = _get_db()
        blob = _json.dumps(data)
        conn.execute(
            "INSERT INTO live_cache (key, json, fetched_at) VALUES (?,?,?) "
            "ON CONFLICT(key) DO UPDATE SET json=excluded.json, fetched_at=excluded.fetched_at",
            (key, blob, ts))
        # Append-only history: _cache_write only runs on a FRESH upstream fetch,
        # so each row is one real market snapshot (the TTL dedupes for free).
        kind, _, asset = key.partition(":")
        conn.execute(
            "INSERT INTO live_history (ts, date, kind, asset, source, json) VALUES (?,?,?,?,?,?)",
            (ts, datetime.fromtimestamp(ts, timezone.utc).strftime("%Y-%m-%d"),
             kind, asset, str(data.get("source", "")), blob))
        conn.commit(); conn.close()
    except Exception:
        pass

async def cached_fetch(key, ttl_seconds, fetch_fn):
    """Serve from live_cache if fresh; else fetch + store. On upstream error,
    fall back to the last cached value (flagged stale). Returns (data, age, stale)."""
    now = time.time()
    cached, fetched_at = _cache_read(key)
    if cached is not None and fetched_at is not None and (now - fetched_at) < ttl_seconds:
        return cached, round(now - fetched_at, 1), False
    try:
        data = await fetch_fn()
        _cache_write(key, data, now)
        return data, 0.0, False
    except Exception:
        if cached is not None:
            return cached, round(now - (fetched_at or now), 1), True
        raise

def _norm_sym(s):
    s = (s or "").strip().upper().replace("/", "").replace("-", "")
    return s.replace("USDT", "").replace("USD", "") or "BTC"

# ---- Live volatility (Kraken OHLC) ------------------------------------------
_KRAKEN_PAIR = {"BTC": "XBTUSD"}  # Kraken uses XBT for BTC; others map to {SYM}USD

async def _fetch_kraken_vol(asset):
    import httpx
    pair = _KRAKEN_PAIR.get(asset, f"{asset}USD")
    async with httpx.AsyncClient(timeout=12) as client:
        r = await client.get("https://api.kraken.com/0/public/OHLC",
                             params={"pair": pair, "interval": 1440},
                             headers={"User-Agent": _LIVE_UA})
        r.raise_for_status()
        body = r.json()
    if body.get("error"):
        raise ValueError(f"kraken error: {body['error']}")
    series = next((v for k, v in body.get("result", {}).items() if k != "last"), None)
    if not series:
        raise ValueError("kraken: no OHLC series")
    closes = [float(row[4]) for row in series]
    if len(closes) < 8:
        raise ValueError("insufficient price history")
    out = {"asset": asset, "spot": r2(closes[-1])}
    for w in (7, 30, 90):
        if len(closes) > w:
            out[f"realized_vol_{w}d"] = r4(_realized_vol(closes, w))
    if out.get("realized_vol_30d") and out.get("realized_vol_90d"):
        ratio = out["realized_vol_30d"] / out["realized_vol_90d"] if out["realized_vol_90d"] else 0
        out["vol_ratio_30d_90d"] = r4(ratio)
        out["regime"] = "ELEVATED" if ratio > 1.2 else "SUPPRESSED" if ratio < 0.8 else "NORMAL"
    return out

class LiveVolIn(BaseModel):
    asset: str = Field("BTC", description="Crypto asset symbol, e.g. BTC, ETH, SOL (USD pair).")

@app.post("/v1/live/volatility", tags=["Live Data"], dependencies=auth)
async def live_volatility(req: LiveVolIn):
    """Live realized volatility (7d/30d/90d) + regime for a crypto asset, computed
    from fresh daily candles. You supply only the ticker — we fetch the data and
    run the math. Cached ~5 min."""
    t0 = time.perf_counter(); hit("live/volatility")
    asset = _norm_sym(req.asset)
    try:
        data, age, stale = await cached_fetch(f"vol:{asset}", 300, lambda: _fetch_kraken_vol(asset))
    except Exception as e:
        raise HTTPException(502, f"live volatility unavailable for {asset}: {str(e)[:140]}")
    return {**data, "as_of_age_seconds": age, "stale": stale, "source": "kraken",
            "ms": r2((time.perf_counter() - t0) * 1000)}

# ---- Live funding rate (OKX) ------------------------------------------------
async def _fetch_okx_funding(asset):
    import httpx
    inst = f"{asset}-USDT-SWAP"
    async with httpx.AsyncClient(timeout=12) as client:
        r = await client.get("https://www.okx.com/api/v5/public/funding-rate",
                             params={"instId": inst}, headers={"User-Agent": _LIVE_UA})
        r.raise_for_status()
        body = r.json()
    rows = body.get("data") or []
    if body.get("code") != "0" or not rows:
        raise ValueError(f"okx: {body.get('msg') or 'no data'} ({inst})")
    d = rows[0]
    rate = float(d["fundingRate"])
    ft = float(d.get("fundingTime") or 0); nft = float(d.get("nextFundingTime") or 0)
    interval_h = round((nft - ft) / 3_600_000) if (nft and ft and nft > ft) else 8
    ppy = 365 * 24 / interval_h if interval_h else 1095
    return {
        "asset": asset, "instrument": inst,
        "funding_rate": r6(rate), "interval_hours": interval_h,
        "annualized_rate": r4(rate * ppy),
        "regime": "CONTANGO" if rate > 0.0001 else "BACKWARDATION" if rate < -0.0001 else "NEUTRAL",
        "next_funding_time": d.get("nextFundingTime"),
    }

class LiveFundingIn(BaseModel):
    asset: str = Field("BTC", description="Crypto asset symbol, e.g. BTC, ETH, SOL (USDT perp).")

@app.post("/v1/live/funding-rates", tags=["Live Data"], dependencies=auth)
async def live_funding_rates(req: LiveFundingIn):
    """Live perpetual funding rate + annualized carry for a crypto asset, from a
    fresh exchange feed. You supply only the ticker. Cached ~1 min."""
    t0 = time.perf_counter(); hit("live/funding-rates")
    asset = _norm_sym(req.asset)
    try:
        data, age, stale = await cached_fetch(f"fund:{asset}", 60, lambda: _fetch_okx_funding(asset))
    except Exception as e:
        raise HTTPException(502, f"live funding unavailable for {asset}: {str(e)[:140]}")
    return {**data, "as_of_age_seconds": age, "stale": stale, "source": "okx",
            "ms": r2((time.perf_counter() - t0) * 1000)}


# ══════════════════════════════════════════════════════════════════════════
# BATCH ENDPOINT — up to 100 computations in one request
# ══════════════════════════════════════════════════════════════════════════
BATCH_MAX = 100

class BatchRequest(BaseModel):
    endpoint: str = Field(..., description="Endpoint path, e.g. 'options/price'")
    params: dict = Field(..., description="Parameters for the endpoint")

class BatchIn(BaseModel):
    requests: list[BatchRequest] = Field(..., min_length=1, max_length=BATCH_MAX,
        description=f"List of computation requests (max {BATCH_MAX})")

@app.post("/v1/batch", tags=["Batch"], dependencies=auth)
async def batch(req: BatchIn):
    """Execute multiple computations in a single request. Max 100 per batch."""
    import httpx
    t0 = time.perf_counter()

    # Validate all endpoints exist and compute total price
    total_price = 0.0
    for r in req.requests:
        ep = r.endpoint.strip("/")
        if ep not in PRICES:
            raise HTTPException(400, f"Unknown endpoint: {ep}")
        total_price += PRICES[ep]

    results = []
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://internal") as client:
        for r in req.requests:
            ep = r.endpoint.strip("/")
            resp = await client.post(f"/v1/{ep}", json=r.params)
            results.append({
                "endpoint": ep,
                "status": resp.status_code,
                "data": resp.json() if resp.status_code == 200 else {"error": resp.json()},
            })

    return {
        "batch_size": len(req.requests),
        "total_price_usdc": round(total_price, 4),
        "results": results,
        "ms": r2((time.perf_counter() - t0) * 1000),
    }


# ══════════════════════════════════════════════════════════════════════════
# COMPOSITE 7: BACKTEST STRATEGY — $0.10
# ══════════════════════════════════════════════════════════════════════════
class BacktestStrategyIn(BaseModel):
    prices: list[float] = Field(..., min_length=30, description="Price history (daily closes, oldest first)")
    strategy: str = Field("sma_crossover", description="sma_crossover | rsi_mean_reversion | momentum | bollinger_breakout")
    params: dict = Field(default_factory=dict, description="Strategy params. SMA: {fast,slow}. RSI: {period,oversold,overbought}. Momentum: {lookback}. Bollinger: {period,std}.")
    initial_capital: float = Field(10000, gt=0, description="Starting capital")
    commission_bps: float = Field(5, ge=0, description="Round-trip commission in basis points")
    slippage_bps: float = Field(5, ge=0, description="One-way slippage in basis points")

@app.post("/v1/backtest/strategy", tags=["Composite"], dependencies=auth)
async def backtest_strategy(req: BacktestStrategyIn):
    """Deterministic backtest of SMA crossover, RSI mean reversion, momentum, or Bollinger breakout. Replaces 10+ individual calls."""
    t0 = time.perf_counter(); hit("backtest/strategy")
    P = req.prices; n = len(P)
    strat = req.strategy.lower(); p = req.params or {}

    # Generate signals (1=long, 0=flat, -1=short) for each bar
    signals = [0] * n

    if strat == "sma_crossover":
        fast = int(p.get("fast", 20)); slow = int(p.get("slow", 50))
        if slow <= fast or slow >= n:
            raise HTTPException(400, f"Invalid SMA params: slow ({slow}) must be > fast ({fast}) and < {n}")
        for i in range(slow, n):
            fast_ma = sum(P[i-fast+1:i+1]) / fast
            slow_ma = sum(P[i-slow+1:i+1]) / slow
            signals[i] = 1 if fast_ma > slow_ma else -1

    elif strat == "rsi_mean_reversion":
        period = int(p.get("period", 14)); oversold = float(p.get("oversold", 30)); overbought = float(p.get("overbought", 70))
        if period >= n:
            raise HTTPException(400, f"RSI period ({period}) must be < {n}")
        # Wilder's RSI
        gains = [0.0] * n; losses = [0.0] * n
        for i in range(1, n):
            diff = P[i] - P[i-1]
            gains[i] = max(diff, 0); losses[i] = max(-diff, 0)
        avg_g = sum(gains[1:period+1]) / period; avg_l = sum(losses[1:period+1]) / period
        pos = 0
        for i in range(period, n):
            if i > period:
                avg_g = (avg_g * (period - 1) + gains[i]) / period
                avg_l = (avg_l * (period - 1) + losses[i]) / period
            rs = avg_g / avg_l if avg_l > 0 else float('inf')
            rsi = 100 - (100 / (1 + rs)) if rs != float('inf') else 100
            if rsi < oversold: pos = 1
            elif rsi > overbought: pos = 0
            signals[i] = pos

    elif strat == "momentum":
        lookback = int(p.get("lookback", 60))
        if lookback >= n:
            raise HTTPException(400, f"Momentum lookback ({lookback}) must be < {n}")
        for i in range(lookback, n):
            ret = (P[i] / P[i-lookback]) - 1
            signals[i] = 1 if ret > 0 else -1

    elif strat == "bollinger_breakout":
        period = int(p.get("period", 20)); nstd = float(p.get("std", 2.0))
        if period >= n:
            raise HTTPException(400, f"Bollinger period ({period}) must be < {n}")
        pos = 0
        for i in range(period, n):
            window = P[i-period+1:i+1]
            m = sum(window) / period
            std = math.sqrt(sum((x - m) ** 2 for x in window) / period)
            upper = m + nstd * std; lower = m - nstd * std
            if P[i] > upper: pos = 1
            elif P[i] < lower: pos = -1
            signals[i] = pos
    else:
        raise HTTPException(400, f"Unknown strategy '{strat}'. Valid: sma_crossover, rsi_mean_reversion, momentum, bollinger_breakout")

    # Execute trades — compute returns with costs
    cost_per_side = (req.commission_bps + req.slippage_bps) / 10000
    equity = [req.initial_capital]; shares = 0; cash = req.initial_capital
    trades = []; last_entry_idx = None; last_entry_price = None
    wins = 0; losses = 0

    for i in range(1, n):
        price = P[i]; prev_sig = signals[i-1]; cur_sig = signals[i]
        # Signal change = trade
        if cur_sig != prev_sig and i > 0:
            # Close existing position
            if shares != 0:
                exit_val = shares * price * (1 - cost_per_side * (1 if shares > 0 else -1))
                cash += exit_val if shares > 0 else -exit_val
                # Track trade P&L
                if last_entry_idx is not None:
                    pnl = (price - last_entry_price) * shares - abs(shares * price * cost_per_side)
                    trades.append({"entry_idx": last_entry_idx, "exit_idx": i, "entry": r4(last_entry_price), "exit": r4(price), "shares": shares, "pnl": r2(pnl)})
                    if pnl > 0: wins += 1
                    else: losses += 1
                shares = 0
            # Open new position
            if cur_sig != 0:
                alloc = cash
                new_shares = int(alloc / (price * (1 + cost_per_side))) * cur_sig
                if new_shares != 0:
                    cost = abs(new_shares) * price * (1 + cost_per_side)
                    cash -= cost if new_shares > 0 else -cost
                    shares = new_shares
                    last_entry_idx = i; last_entry_price = price
        # Mark-to-market
        equity.append(cash + shares * price)

    # Force-close at end
    if shares != 0 and last_entry_idx is not None:
        pnl = (P[-1] - last_entry_price) * shares
        trades.append({"entry_idx": last_entry_idx, "exit_idx": n-1, "entry": r4(last_entry_price), "exit": r4(P[-1]), "shares": shares, "pnl": r2(pnl)})
        if pnl > 0: wins += 1
        else: losses += 1

    # Stats
    returns = [(equity[i] / equity[i-1] - 1) for i in range(1, len(equity)) if equity[i-1] > 0]
    total_ret = (equity[-1] / equity[0]) - 1 if equity[0] > 0 else 0
    ann_ret = ((1 + total_ret) ** (252 / n) - 1) if n > 0 else 0
    ann_vol = sd(returns) * math.sqrt(252) if returns else 0
    sharpe = (ann_ret - 0.045) / ann_vol if ann_vol > 0 else 0
    mdd, _ = _max_dd(equity)
    calmar = ann_ret / abs(mdd) if mdd != 0 else 0
    benchmark = (P[-1] / P[0]) - 1 if P[0] > 0 else 0

    # Subsample equity curve (max 50 points)
    step = max(1, len(equity) // 50)
    eq_sample = [r2(equity[i]) for i in range(0, len(equity), step)]

    return {
        "strategy": strat, "params": p, "bars": n, "num_trades": len(trades),
        "performance": {
            "total_return": r4(total_ret), "annualized_return": r4(ann_ret),
            "annualized_vol": r4(ann_vol), "sharpe": r4(sharpe), "calmar": r4(calmar),
            "max_drawdown": r4(mdd), "final_equity": r2(equity[-1]),
        },
        "trades_summary": {
            "total": len(trades), "wins": wins, "losses": losses,
            "win_rate": r4(wins / len(trades)) if trades else 0,
            "avg_pnl": r2(sum(t["pnl"] for t in trades) / len(trades)) if trades else 0,
        },
        "vs_buy_hold": {"strategy_return": r4(total_ret), "buy_hold_return": r4(benchmark), "excess_return": r4(total_ret - benchmark)},
        "equity_curve_sample": eq_sample,
        "trades": trades[:20],  # First 20 trades only
        "ms": r2((time.perf_counter() - t0) * 1000),
    }


# ══════════════════════════════════════════════════════════════════════════
# COMPOSITE 8: PORTFOLIO REBALANCE PLAN — $0.05
# ══════════════════════════════════════════════════════════════════════════
class RebalancePlanIn(BaseModel):
    current_holdings: dict[str, float] = Field(..., description="Asset symbol -> current dollar value")
    target_weights: dict[str, float] = Field(..., description="Asset symbol -> target weight (must sum to ~1.0)")
    transaction_cost_bps: float = Field(10, ge=0, description="One-way transaction cost in bps (incl. spread + commission)")
    min_trade_usd: float = Field(10, ge=0, description="Minimum trade size in USD (smaller drifts are ignored)")

@app.post("/v1/portfolio/rebalance-plan", tags=["Composite"], dependencies=auth)
async def rebalance_plan(req: RebalancePlanIn):
    """Generate trade list to rebalance from current holdings to target weights with transaction cost estimate."""
    t0 = time.perf_counter(); hit("portfolio/rebalance-plan")
    holdings = dict(req.current_holdings); targets = dict(req.target_weights)
    portfolio_value = sum(holdings.values())
    if portfolio_value <= 0:
        raise HTTPException(400, "Portfolio value must be positive")
    weight_sum = sum(targets.values())
    if abs(weight_sum - 1.0) > 0.02:
        raise HTTPException(400, f"Target weights must sum to ~1.0 (got {weight_sum:.4f})")

    # Ensure all assets present in both dicts
    all_assets = set(holdings.keys()) | set(targets.keys())
    for a in all_assets:
        holdings.setdefault(a, 0.0); targets.setdefault(a, 0.0)

    # Current vs target weights and required deltas
    current_weights = {a: holdings[a] / portfolio_value for a in all_assets}
    target_dollar = {a: targets[a] * portfolio_value for a in all_assets}
    drift_before = {a: r4(current_weights[a] - targets[a]) for a in all_assets}

    # Generate trades
    cost_rate = req.transaction_cost_bps / 10000
    trades = []; total_cost = 0.0
    for a in sorted(all_assets):
        delta = target_dollar[a] - holdings[a]
        if abs(delta) < req.min_trade_usd:
            continue
        action = "buy" if delta > 0 else "sell"
        notional = abs(delta)
        cost = notional * cost_rate
        total_cost += cost
        trades.append({
            "asset": a, "action": action, "amount_usd": r2(notional),
            "cost_usd": r4(cost), "current_value": r2(holdings[a]), "target_value": r2(target_dollar[a]),
        })

    # Post-rebalance weights (after trades, minus total cost)
    post_value = portfolio_value - total_cost
    post_weights = {a: r4(target_dollar[a] / post_value) if post_value > 0 else 0 for a in all_assets}
    drift_after = {a: r4(post_weights[a] - targets[a]) for a in all_assets}

    # Max drift metrics
    max_drift_before = max(abs(d) for d in drift_before.values()) if drift_before else 0
    max_drift_after = max(abs(d) for d in drift_after.values()) if drift_after else 0

    return {
        "portfolio_value": r2(portfolio_value),
        "num_trades": len(trades), "total_cost_usd": r4(total_cost), "total_cost_bps": r2(total_cost / portfolio_value * 10000) if portfolio_value > 0 else 0,
        "trades": trades,
        "drift_before": drift_before, "drift_after": drift_after,
        "max_drift_before": r4(max_drift_before), "max_drift_after": r4(max_drift_after),
        "current_weights": {a: r4(current_weights[a]) for a in sorted(all_assets)},
        "target_weights": {a: r4(targets[a]) for a in sorted(all_assets)},
        "post_rebalance_weights": {a: post_weights[a] for a in sorted(all_assets)},
        "ms": r2((time.perf_counter() - t0) * 1000),
    }


# ══════════════════════════════════════════════════════════════════════════
# COMPOSITE 9: OPTIONS STRATEGY OPTIMIZER — $0.08
# ══════════════════════════════════════════════════════════════════════════
class StrategyOptimizerIn(BaseModel):
    S: float = Field(..., gt=0, description="Spot price")
    outlook: str = Field(..., description="bullish | bearish | neutral")
    vol_view: str = Field("stable", description="rising | falling | stable")
    T: float = Field(..., gt=0, description="Time to expiration in years")
    sigma: float = Field(..., gt=0, description="Current implied volatility")
    r: float = Field(0.05, description="Risk-free rate")
    q: float = Field(0, description="Dividend yield")
    capital: float = Field(10000, gt=0, description="Available capital")

@app.post("/v1/options/strategy-optimizer", tags=["Composite"], dependencies=auth)
async def strategy_optimizer(req: StrategyOptimizerIn):
    """Rank top options strategies given market outlook + volatility view. Returns P&L, breakevens, max profit/loss for each."""
    t0 = time.perf_counter(); hit("options/strategy-optimizer")
    S, T, sigma, r, q = req.S, req.T, req.sigma, req.r, req.q
    outlook = req.outlook.lower(); vol = req.vol_view.lower()
    if outlook not in ("bullish", "bearish", "neutral"):
        raise HTTPException(400, f"outlook must be bullish|bearish|neutral (got '{outlook}')")
    if vol not in ("rising", "falling", "stable"):
        raise HTTPException(400, f"vol_view must be rising|falling|stable (got '{vol}')")

    # Define candidate strategies based on outlook + vol
    candidates = []
    # --- Bullish ---
    if outlook == "bullish":
        # Long Call (rising vol)
        K_atm = S; call_atm = _bs(S, K_atm, T, r, sigma, q, "call")["price"]
        candidates.append({
            "name": "Long Call (ATM)", "legs": [{"type": "call", "K": r2(K_atm), "action": "buy", "premium": r4(call_atm)}],
            "net_debit": r4(call_atm), "max_profit": float('inf'), "max_loss": r4(call_atm),
            "breakeven": [r2(K_atm + call_atm)], "suits_vol": "rising", "bias": "bullish",
        })
        # Bull Call Spread (stable/falling vol)
        K_long = S * 1.00; K_short = S * 1.05
        c_long = _bs(S, K_long, T, r, sigma, q, "call")["price"]
        c_short = _bs(S, K_short, T, r, sigma, q, "call")["price"]
        net = c_long - c_short; max_p = (K_short - K_long) - net
        candidates.append({
            "name": "Bull Call Spread", "legs": [
                {"type": "call", "K": r2(K_long), "action": "buy", "premium": r4(c_long)},
                {"type": "call", "K": r2(K_short), "action": "sell", "premium": r4(c_short)},
            ],
            "net_debit": r4(net), "max_profit": r4(max_p), "max_loss": r4(net),
            "breakeven": [r2(K_long + net)], "suits_vol": "stable", "bias": "bullish",
        })
        # Short Put (falling vol, income)
        K_put = S * 0.95; p_atm = _bs(S, K_put, T, r, sigma, q, "put")["price"]
        candidates.append({
            "name": "Short Put (Cash-Secured)", "legs": [{"type": "put", "K": r2(K_put), "action": "sell", "premium": r4(p_atm)}],
            "net_debit": r4(-p_atm), "max_profit": r4(p_atm), "max_loss": r4(K_put - p_atm),
            "breakeven": [r2(K_put - p_atm)], "suits_vol": "falling", "bias": "bullish",
        })
    # --- Bearish ---
    elif outlook == "bearish":
        # Long Put
        K_atm = S; put_atm = _bs(S, K_atm, T, r, sigma, q, "put")["price"]
        candidates.append({
            "name": "Long Put (ATM)", "legs": [{"type": "put", "K": r2(K_atm), "action": "buy", "premium": r4(put_atm)}],
            "net_debit": r4(put_atm), "max_profit": r4(K_atm - put_atm), "max_loss": r4(put_atm),
            "breakeven": [r2(K_atm - put_atm)], "suits_vol": "rising", "bias": "bearish",
        })
        # Bear Put Spread
        K_long = S * 1.00; K_short = S * 0.95
        p_long = _bs(S, K_long, T, r, sigma, q, "put")["price"]
        p_short = _bs(S, K_short, T, r, sigma, q, "put")["price"]
        net = p_long - p_short; max_p = (K_long - K_short) - net
        candidates.append({
            "name": "Bear Put Spread", "legs": [
                {"type": "put", "K": r2(K_long), "action": "buy", "premium": r4(p_long)},
                {"type": "put", "K": r2(K_short), "action": "sell", "premium": r4(p_short)},
            ],
            "net_debit": r4(net), "max_profit": r4(max_p), "max_loss": r4(net),
            "breakeven": [r2(K_long - net)], "suits_vol": "stable", "bias": "bearish",
        })
        # Short Call (falling vol, income)
        K_call = S * 1.05; c_atm = _bs(S, K_call, T, r, sigma, q, "call")["price"]
        candidates.append({
            "name": "Short Call (Covered/Naked)", "legs": [{"type": "call", "K": r2(K_call), "action": "sell", "premium": r4(c_atm)}],
            "net_debit": r4(-c_atm), "max_profit": r4(c_atm), "max_loss": float('inf'),
            "breakeven": [r2(K_call + c_atm)], "suits_vol": "falling", "bias": "bearish",
        })
    # --- Neutral ---
    else:
        # Long Straddle (rising vol)
        c = _bs(S, S, T, r, sigma, q, "call")["price"]; p = _bs(S, S, T, r, sigma, q, "put")["price"]
        net = c + p
        candidates.append({
            "name": "Long Straddle", "legs": [
                {"type": "call", "K": r2(S), "action": "buy", "premium": r4(c)},
                {"type": "put", "K": r2(S), "action": "buy", "premium": r4(p)},
            ],
            "net_debit": r4(net), "max_profit": float('inf'), "max_loss": r4(net),
            "breakeven": [r2(S - net), r2(S + net)], "suits_vol": "rising", "bias": "neutral",
        })
        # Iron Condor (stable/falling vol, credit)
        K_ps = S * 0.95; K_pl = S * 0.90; K_cs = S * 1.05; K_cl = S * 1.10
        p_s = _bs(S, K_ps, T, r, sigma, q, "put")["price"]; p_l = _bs(S, K_pl, T, r, sigma, q, "put")["price"]
        c_s = _bs(S, K_cs, T, r, sigma, q, "call")["price"]; c_l = _bs(S, K_cl, T, r, sigma, q, "call")["price"]
        credit = (p_s - p_l) + (c_s - c_l); width = min(K_ps - K_pl, K_cl - K_cs)
        candidates.append({
            "name": "Iron Condor", "legs": [
                {"type": "put", "K": r2(K_pl), "action": "buy", "premium": r4(p_l)},
                {"type": "put", "K": r2(K_ps), "action": "sell", "premium": r4(p_s)},
                {"type": "call", "K": r2(K_cs), "action": "sell", "premium": r4(c_s)},
                {"type": "call", "K": r2(K_cl), "action": "buy", "premium": r4(c_l)},
            ],
            "net_debit": r4(-credit), "max_profit": r4(credit), "max_loss": r4(width - credit),
            "breakeven": [r2(K_ps - credit), r2(K_cs + credit)], "suits_vol": "falling", "bias": "neutral",
        })
        # Long Strangle (rising vol, cheaper than straddle)
        K_c = S * 1.05; K_p = S * 0.95
        c2 = _bs(S, K_c, T, r, sigma, q, "call")["price"]; p2 = _bs(S, K_p, T, r, sigma, q, "put")["price"]
        net2 = c2 + p2
        candidates.append({
            "name": "Long Strangle", "legs": [
                {"type": "call", "K": r2(K_c), "action": "buy", "premium": r4(c2)},
                {"type": "put", "K": r2(K_p), "action": "buy", "premium": r4(p2)},
            ],
            "net_debit": r4(net2), "max_profit": float('inf'), "max_loss": r4(net2),
            "breakeven": [r2(K_p - net2), r2(K_c + net2)], "suits_vol": "rising", "bias": "neutral",
        })

    # Score each strategy: higher score for vol-alignment + risk/reward
    for s in candidates:
        vol_match = 1.0 if s["suits_vol"] == vol else (0.5 if s["suits_vol"] == "stable" or vol == "stable" else 0.2)
        # Risk/reward ratio (capped for infinite-profit strategies)
        mp = s["max_profit"] if s["max_profit"] != float('inf') else s.get("net_debit", 1) * 5
        ml = s["max_loss"] if s["max_loss"] != float('inf') else s.get("net_debit", 1) * 5
        rr = mp / ml if ml > 0 else 1.0
        # Convert inf to displayable string
        s["score"] = r4(vol_match * math.log(1 + rr))
        if s["max_profit"] == float('inf'): s["max_profit"] = "unlimited"
        if s["max_loss"] == float('inf'): s["max_loss"] = "unlimited"

    # Rank by score
    ranked = sorted(candidates, key=lambda x: x["score"], reverse=True)

    return {
        "inputs": {"spot": r2(S), "outlook": outlook, "vol_view": vol, "days_to_expiry": r2(T * 365), "implied_vol": r4(sigma)},
        "strategies": ranked, "num_strategies": len(ranked),
        "top_pick": ranked[0]["name"] if ranked else None,
        "ms": r2((time.perf_counter() - t0) * 1000),
    }


# ══════════════════════════════════════════════════════════════════════════
# COMPOSITE 10: HEDGING RECOMMEND — $0.04
# ══════════════════════════════════════════════════════════════════════════
class HedgingIn(BaseModel):
    position_type: str = Field(..., description="long_stock | short_stock | long_crypto | long_options")
    position_value: float = Field(..., gt=0, description="Current dollar value of position")
    asset_price: float = Field(..., gt=0, description="Current spot price")
    volatility: float = Field(..., gt=0, description="Annualized volatility")
    time_horizon_days: int = Field(30, gt=0, description="Hedge time horizon in days")
    max_hedge_cost_pct: float = Field(0.05, gt=0, description="Max hedge cost as fraction of position (0.05 = 5%)")
    r: float = Field(0.05, description="Risk-free rate")

@app.post("/v1/hedging/recommend", tags=["Composite"], dependencies=auth)
async def hedging_recommend(req: HedgingIn):
    """Rank cheapest effective hedges for a given position. Compares protective puts, collars, inverse hedges."""
    t0 = time.perf_counter(); hit("hedging/recommend")
    pos_type = req.position_type.lower(); V = req.position_value; S = req.asset_price
    sigma = req.volatility; T = req.time_horizon_days / 365; r = req.r
    max_cost = V * req.max_hedge_cost_pct
    shares = V / S

    if pos_type not in ("long_stock", "short_stock", "long_crypto", "long_options"):
        raise HTTPException(400, f"Invalid position_type (got '{pos_type}')")

    hedges = []
    is_long = pos_type in ("long_stock", "long_crypto", "long_options")

    # 1. Protective Put (for longs) or Protective Call (for shorts)
    K_prot = S * (0.95 if is_long else 1.05)
    opt_type = "put" if is_long else "call"
    premium = _bs(S, K_prot, T, r, sigma, 0, opt_type)["price"]
    total_prem = premium * shares
    cost_pct = total_prem / V if V > 0 else 0
    max_loss_hedged = V - (K_prot * shares) + total_prem if is_long else (K_prot * shares) - V + total_prem
    hedges.append({
        "type": f"protective_{opt_type}", "description": f"Buy {'put' if is_long else 'call'} at strike {r2(K_prot)} ({'5% below' if is_long else '5% above'} spot)",
        "cost_usd": r2(total_prem), "cost_pct": r4(cost_pct), "affordable": total_prem <= max_cost,
        "protection": "full downside below strike" if is_long else "full upside above strike",
        "max_loss_if_hedged": r2(max_loss_hedged), "breakeven_price": r2(K_prot - premium) if is_long else r2(K_prot + premium),
        "score": r4(1 / (cost_pct + 0.001)),  # Lower cost = higher score
    })

    # 2. Collar (for longs) — buy put, sell call to finance it
    if is_long:
        K_put = S * 0.95; K_call = S * 1.10
        p_prem = _bs(S, K_put, T, r, sigma, 0, "put")["price"]
        c_prem = _bs(S, K_call, T, r, sigma, 0, "call")["price"]
        net_per_share = p_prem - c_prem; total_net = net_per_share * shares
        cost_pct = total_net / V if V > 0 else 0
        hedges.append({
            "type": "collar", "description": f"Buy put @ {r2(K_put)}, sell call @ {r2(K_call)}",
            "cost_usd": r2(total_net), "cost_pct": r4(cost_pct), "affordable": abs(total_net) <= max_cost,
            "protection": f"floor at {r2(K_put)}, capped upside at {r2(K_call)}",
            "max_loss_if_hedged": r2(V - (K_put * shares) + total_net),
            "max_gain_if_hedged": r2((K_call * shares) - V - total_net),
            "score": r4(2 / (max(cost_pct, 0) + 0.001)),  # Collars typically best for tight budgets
        })

    # 3. Futures/inverse hedge — delta-neutral short (assumes available inverse instrument)
    hedge_notional = V
    daily_vol = sigma / math.sqrt(252)
    # Use parametric VaR at 95% to estimate daily move
    expected_move_1d = 1.645 * daily_vol * S
    margin_req = hedge_notional * 0.10  # Typical 10% initial margin for futures
    hedges.append({
        "type": "futures_inverse_hedge", "description": f"Short ${r2(hedge_notional)} in futures or inverse {'short' if is_long else 'long'} ETF",
        "cost_usd": r2(margin_req), "cost_pct": r4(margin_req / V) if V > 0 else 0, "affordable": True,
        "protection": "delta-neutral (100% hedged against price moves, funding costs apply)",
        "expected_daily_move_protected": r2(expected_move_1d * shares),
        "note": "Requires margin account. P&L is offsetting, not capped.",
        "score": r4(1.2),  # Moderate preference — effective but requires margin
    })

    # 4. Partial hedge — half the position
    partial_shares = shares * 0.5
    partial_prem = premium * partial_shares
    hedges.append({
        "type": "partial_put_hedge", "description": f"Buy puts on 50% of position at strike {r2(K_prot)}",
        "cost_usd": r2(partial_prem), "cost_pct": r4(partial_prem / V) if V > 0 else 0, "affordable": partial_prem <= max_cost,
        "protection": "half position protected below strike, half exposed",
        "max_loss_if_hedged": r2(V * 0.5 - (K_prot * partial_shares) + partial_prem + V * 0.5 * 0.20),  # Assume 20% worst-case loss on unhedged half
        "score": r4(0.8),
    })

    # Rank: affordable first, then by score
    ranked = sorted(hedges, key=lambda h: (not h.get("affordable", False), -h.get("score", 0)))

    return {
        "position": {"type": pos_type, "value_usd": r2(V), "shares": r4(shares), "spot_price": r2(S)},
        "constraints": {"max_hedge_cost_usd": r2(max_cost), "horizon_days": req.time_horizon_days, "volatility": r4(sigma)},
        "hedges": ranked, "num_hedges": len(ranked),
        "recommended": ranked[0]["type"] if ranked else None,
        "ms": r2((time.perf_counter() - t0) * 1000),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
