#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";

// ── Config ─────────────────────────────────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL || "https://api.quantoracle.dev";
const PORT = parseInt(process.env.PORT || "8002");
const DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || "1000");
const WALLET = process.env.WALLET_ADDRESS || "0xC94f5F33ae446a50Ce31157db81253BfddFE2af6";

// ── Rate limiter (in-memory, resets daily) ─────────────────────────────
const callCounts = new Map<string, { count: number; date: string }>();

function getRateLimit(ip: string): { count: number; remaining: number; limited: boolean } {
  const today = new Date().toISOString().slice(0, 10);
  const entry = callCounts.get(ip);

  if (!entry || entry.date !== today) {
    callCounts.set(ip, { count: 0, date: today });
    return { count: 0, remaining: DAILY_LIMIT, limited: false };
  }

  return {
    count: entry.count,
    remaining: Math.max(0, DAILY_LIMIT - entry.count),
    limited: entry.count >= DAILY_LIMIT,
  };
}

function incrementCount(ip: string): void {
  const today = new Date().toISOString().slice(0, 10);
  const entry = callCounts.get(ip);
  if (!entry || entry.date !== today) {
    callCounts.set(ip, { count: 1, date: today });
  } else {
    entry.count++;
  }
}

// Clean stale entries daily
setInterval(() => {
  const today = new Date().toISOString().slice(0, 10);
  for (const [ip, entry] of callCounts) {
    if (entry.date !== today) callCounts.delete(ip);
  }
}, 3600_000);

// ── Types ──────────────────────────────────────────────────────────────
interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  path: string;
}

interface OpenAPISpec {
  paths: Record<string, Record<string, {
    summary?: string;
    description?: string;
    requestBody?: {
      content: {
        "application/json": {
          schema: { $ref?: string } & Record<string, any>;
        };
      };
    };
  }>>;
  components?: {
    schemas?: Record<string, any>;
  };
}

// ── Resolve $ref ───────────────────────────────────────────────────────
function resolveRef(schema: any, components: Record<string, any>): any {
  if (!schema) return schema;
  if (schema.$ref) {
    const refName = schema.$ref.replace("#/components/schemas/", "");
    const resolved = components[refName];
    if (!resolved) return schema;
    return resolveRef({ ...resolved }, components);
  }
  const result: any = { ...schema };
  if (result.properties) {
    result.properties = {};
    for (const [key, val] of Object.entries(schema.properties)) {
      result.properties[key] = resolveRef(val, components);
    }
  }
  if (result.items) {
    result.items = resolveRef(result.items, components);
  }
  if (result.anyOf) {
    // Flatten Optional[T] patterns: anyOf: [{type: T}, {type: "null"}] → just {type: T}
    const nonNull = result.anyOf.filter((s: any) => s.type !== "null");
    if (nonNull.length === 1 && result.anyOf.some((s: any) => s.type === "null")) {
      const flat = resolveRef(nonNull[0], components);
      // Preserve description/title from parent
      if (result.description) flat.description = result.description;
      if (result.title) flat.title = result.title;
      return flat;
    }
    result.anyOf = result.anyOf.map((s: any) => resolveRef(s, components));
  }
  if (result.oneOf) {
    result.oneOf = result.oneOf.map((s: any) => resolveRef(s, components));
  }
  if (result.allOf) {
    result.allOf = result.allOf.map((s: any) => resolveRef(s, components));
  }
  return result;
}

// ── Path → tool name (underscore-separated for compatibility) ──────────
// /v1/options/price → options_price
// /v1/crypto/apy-apr-convert → crypto_apy-apr-convert
function pathToToolName(path: string): string {
  return path.replace("/v1/", "").replace(/\//g, "_");
}

// ── Pricing table (mirrors worker/src/index.ts) ────────────────────────
const PRICES: Record<string, string> = {
  "/v1/stats/zscore": "0.002", "/v1/crypto/apy-apr-convert": "0.002",
  "/v1/derivatives/put-call-parity": "0.002", "/v1/indicators/fibonacci-retracement": "0.002",
  "/v1/macro/inflation-adjusted": "0.002", "/v1/macro/taylor-rule": "0.002",
  "/v1/macro/real-yield": "0.002", "/v1/crypto/liquidation-price": "0.002",
  "/v1/indicators/bollinger-bands": "0.002", "/v1/indicators/atr": "0.002",
  "/v1/tvm/present-value": "0.002", "/v1/tvm/future-value": "0.002",
  "/v1/tvm/npv": "0.002", "/v1/tvm/cagr": "0.002",
  "/v1/stats/normal-distribution": "0.002", "/v1/stats/sharpe-ratio": "0.002",
  "/v1/options/price": "0.005", "/v1/options/implied-vol": "0.005",
  "/v1/risk/kelly": "0.005", "/v1/risk/position-size": "0.005",
  "/v1/risk/drawdown": "0.005", "/v1/indicators/technical": "0.005",
  "/v1/indicators/crossover": "0.005", "/v1/indicators/regime": "0.005",
  "/v1/fx/interest-rate-parity": "0.005", "/v1/fx/purchasing-power-parity": "0.005",
  "/v1/fx/forward-rate": "0.005", "/v1/fx/carry-trade": "0.005",
  "/v1/crypto/funding-rate": "0.005", "/v1/crypto/dex-slippage": "0.005",
  "/v1/crypto/vesting-schedule": "0.005", "/v1/crypto/rebalance-threshold": "0.005",
  "/v1/fixed-income/amortization": "0.005", "/v1/options/payoff-diagram": "0.005",
  "/v1/crypto/impermanent-loss": "0.005", "/v1/risk/transaction-cost": "0.005",
  "/v1/stats/probabilistic-sharpe": "0.005", "/v1/tvm/irr": "0.005",
  "/v1/stats/realized-volatility": "0.005",
  "/v1/options/strategy": "0.008", "/v1/risk/portfolio": "0.008",
  "/v1/risk/correlation": "0.008", "/v1/risk/var-parametric": "0.008",
  "/v1/risk/stress-test": "0.008", "/v1/derivatives/binomial-tree": "0.008",
  "/v1/derivatives/barrier-option": "0.008", "/v1/derivatives/lookback-option": "0.008",
  "/v1/derivatives/asian-option": "0.008", "/v1/stats/hurst-exponent": "0.008",
  "/v1/stats/cointegration": "0.008", "/v1/stats/linear-regression": "0.008",
  "/v1/stats/polynomial-regression": "0.008", "/v1/stats/distribution-fit": "0.008",
  "/v1/fi/credit-spread": "0.008", "/v1/fixed-income/bond": "0.008",
  "/v1/portfolio/risk-parity-weights": "0.008",
  "/v1/simulate/montecarlo": "0.015", "/v1/portfolio/optimize": "0.015",
  "/v1/stats/garch-forecast": "0.015", "/v1/derivatives/volatility-surface": "0.015",
  "/v1/derivatives/option-chain-analysis": "0.015", "/v1/fi/yield-curve-interpolate": "0.015",
  "/v1/stats/correlation-matrix": "0.015",
};

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
  console.log("QuantOracle MCP Server starting...");
  console.log(`Backend: ${BACKEND_URL}`);
  console.log(`Free tier: ${DAILY_LIMIT} calls/IP/day`);

  // Fetch OpenAPI spec
  const specResp = await fetch(`${BACKEND_URL}/openapi.json`);
  if (!specResp.ok) throw new Error(`Failed to fetch /openapi.json: ${specResp.status}`);
  const spec: OpenAPISpec = await specResp.json();
  const schemas = spec.components?.schemas || {};

  // Build tool definitions from OpenAPI paths
  const toolDefs: ToolDef[] = [];
  for (const [path, methods] of Object.entries(spec.paths)) {
    if (!path.startsWith("/v1/")) continue;
    const postOp = methods.post;
    if (!postOp) continue;

    const rawSchema = postOp.requestBody?.content?.["application/json"]?.schema;
    if (!rawSchema) continue;

    const inputSchema = resolveRef(rawSchema, schemas);
    delete inputSchema.title;

    toolDefs.push({
      name: pathToToolName(path),
      description: postOp.description || postOp.summary || `Compute ${pathToToolName(path)}`,
      inputSchema: { type: "object", ...inputSchema },
      path,
    });
  }

  console.log(`Loaded ${toolDefs.length} tool definitions`);

  const toolByName = new Map<string, ToolDef>();
  for (const t of toolDefs) toolByName.set(t.name, t);

  // ── Session → IP tracking ────────────────────────────────────────────
  const sessionIPs = new Map<string, string>();

  // ── Server factory ───────────────────────────────────────────────────
  function createServer(clientIP: string, sessionId: string): Server {
    sessionIPs.set(sessionId, clientIP);

    const server = new Server(
      { name: "quantoracle", version: "2.0.0" },
      { capabilities: { tools: {}, prompts: {}, resources: {} } }
    );

    // ── Prompts (system prompt for agents) ─────────────────────────────
    server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [{
        name: "quantoracle_usage",
        description: "How to use QuantOracle tools effectively",
      }],
    }));

    server.setRequestHandler(GetPromptRequestSchema, async () => ({
      description: "How to use QuantOracle tools effectively",
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: "QuantOracle provides 63 deterministic math tools for quantitative finance. All tools accept JSON and return JSON. Key categories: options pricing (Black-Scholes, Greeks, implied vol, exotic derivatives), risk metrics (Sharpe, Sortino, VaR, CVaR, drawdown, Kelly), portfolio optimization (max Sharpe, min variance, risk parity), technical indicators (RSI, MACD, Bollinger, ATR), Monte Carlo simulation, bond pricing and yield curves, statistical analysis (regression, cointegration, GARCH, Hurst exponent), crypto/DeFi (impermanent loss, liquidation, funding rates, DEX slippage), FX (interest rate parity, carry trade, PPP), macro (Taylor Rule, Fisher equation), and time value of money (PV, FV, IRR, NPV, CAGR). Every tool is deterministic — same inputs always produce same outputs. Use these tools whenever you need precise financial calculations instead of estimating.",
        },
      }],
    }));

    // ── Resources (empty but registered) ───────────────────────────────
    server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [],
    }));

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: toolDefs.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        annotations: {
          title: t.description.split(".")[0],
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      })),
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const tool = toolByName.get(name);

      if (!tool) {
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
      }

      // ── Rate limit check ───────────────────────────────────────────
      const ip = sessionIPs.get(sessionId) || clientIP;
      const rl = getRateLimit(ip);

      if (rl.limited) {
        const price = PRICES[tool.path] || "0.005";
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "payment_required",
              message: `Free tier limit reached (${DAILY_LIMIT}/day). Use the REST API at https://api.quantoracle.dev${tool.path} with x402 payment to continue.`,
              usage: {
                calls_today: rl.count,
                daily_limit: DAILY_LIMIT,
              },
              payment: {
                protocol: "x402",
                rest_endpoint: `https://api.quantoracle.dev${tool.path}`,
                amount: price,
                currency: "USDC",
                network: "base",
                recipient: WALLET,
              },
            }, null, 2),
          }],
          isError: true,
        };
      }

      // ── Forward to backend ─────────────────────────────────────────
      try {
        const resp = await fetch(`${BACKEND_URL}${tool.path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args || {}),
        });

        const data = await resp.json();

        if (!resp.ok) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ error: true, status: resp.status, ...data }, null, 2),
            }],
            isError: true,
          };
        }

        // Success — count this call
        incrementCount(ip);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(data, null, 2),
          }],
        };
      } catch (err: any) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: "backend_unreachable", detail: err.message }),
          }],
          isError: true,
        };
      }
    });

    return server;
  }

  // ── Express app ──────────────────────────────────────────────────────
  const app = express();

  // Trust proxy for X-Forwarded-For
  app.set("trust proxy", true);

  const transports = new Map<string, StreamableHTTPServerTransport>();

  function getClientIP(req: express.Request): string {
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.headers["x-real-ip"] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown"
    );
  }

  app.post("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res);
      return;
    }

    // New session
    const clientIP = getClientIP(req);
    let capturedSid: string | undefined;

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => {
        capturedSid = crypto.randomUUID();
        return capturedSid;
      },
      onsessioninitialized: (sid: string) => {
        transports.set(sid, transport);
      },
    });

    transport.onclose = () => {
      if (capturedSid) {
        transports.delete(capturedSid);
        sessionIPs.delete(capturedSid);
      }
    };

    const server = createServer(clientIP, capturedSid || "pending");
    await server.connect(transport);
    await transport.handleRequest(req, res);

    // Update session ID mapping after transport assigns it
    if (capturedSid) {
      sessionIPs.set(capturedSid, clientIP);
    }
  });

  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports.has(sessionId)) {
      res.status(400).json({ error: "No active session. Send a POST first." });
      return;
    }
    await transports.get(sessionId)!.handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res);
      transports.delete(sessionId);
      sessionIPs.delete(sessionId);
    } else {
      res.status(404).json({ error: "Session not found" });
    }
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      server: "quantoracle-mcp",
      version: "2.0.0",
      tools: toolDefs.length,
      daily_limit: DAILY_LIMIT,
      active_sessions: transports.size,
      backend: BACKEND_URL,
    });
  });

  // Server card for Smithery discovery
  app.get("/.well-known/mcp/server-card.json", (_req, res) => {
    res.json({
      serverInfo: { name: "quantoracle", version: "2.0.0" },
      description: "63 deterministic quant computation tools for AI agents. Options pricing, exotic derivatives, risk metrics, portfolio optimization, Monte Carlo, statistics, crypto/DeFi, macro/FX, time value of money. 1,000 free calls/day — no signup required.",
      homepage: "https://quantoracle.dev",
      repository: "https://github.com/QuantOracledev/quantoracle",
      documentation: "https://api.quantoracle.dev/docs",
      license: "MIT",
      keywords: ["finance", "quantitative", "options", "derivatives", "risk", "portfolio", "statistics", "crypto", "defi", "macro", "fx", "backtesting", "deterministic", "calculator"],
      tools: toolDefs.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
      prompts: [{
        name: "quantoracle_usage",
        description: "How to use QuantOracle tools effectively",
      }],
      resources: [],
    });
  });

  // Usage check (mirrors the REST API's /usage endpoint)
  app.get("/usage", (req, res) => {
    const ip = getClientIP(req);
    const rl = getRateLimit(ip);
    res.json({
      calls_today: rl.count,
      daily_limit: DAILY_LIMIT,
      remaining: rl.remaining,
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`QuantOracle MCP server listening on port ${PORT}`);
    console.log(`MCP endpoint: http://0.0.0.0:${PORT}/mcp`);
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
