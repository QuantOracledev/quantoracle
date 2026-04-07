#!/usr/bin/env node

import { parseArgs, parseData, parseJSON, readCSV } from "../src/args.js";
import { apiCall, apiGet } from "../src/client.js";
import { setNoColor, formatGeneric } from "../src/format.js";

// ── Load all command definitions ──────────────────────────────────
import optionsCmds from "../src/commands/options.js";
import riskCmds from "../src/commands/risk.js";
import indicatorsCmds from "../src/commands/indicators.js";
import statsCmds from "../src/commands/stats.js";
import derivativesCmds from "../src/commands/derivatives.js";
import simulateCmds from "../src/commands/simulate.js";
import portfolioCmds from "../src/commands/portfolio.js";
import fiCmds from "../src/commands/fi.js";
import cryptoCmds from "../src/commands/crypto.js";
import fxCmds from "../src/commands/fx.js";
import macroCmds from "../src/commands/macro.js";
import tvmCmds from "../src/commands/tvm.js";

const ALL_COMMANDS = [
  ...optionsCmds, ...riskCmds, ...indicatorsCmds, ...statsCmds,
  ...derivativesCmds, ...simulateCmds, ...portfolioCmds, ...fiCmds,
  ...cryptoCmds, ...fxCmds, ...macroCmds, ...tvmCmds,
];

// ── Build lookup maps ─────────────────────────────────────────────
const byName = new Map();
const byAlias = new Map();

for (const cmd of ALL_COMMANDS) {
  byName.set(cmd.name, cmd);
  if (cmd.aliases) {
    for (const a of cmd.aliases) byAlias.set(a, cmd);
  }
}

// ── Parse argv ────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const { flags, positional } = parseArgs(argv);

const isJson = flags.json === true;
const isVerbose = flags.verbose === true;
if (flags["no-color"]) setNoColor(true);

const globalOpts = {
  url: flags.url,
  apiKey: flags["api-key"],
  verbose: isVerbose,
};

// ── Route command ─────────────────────────────────────────────────

// Utility commands
const firstArg = positional[0];

if (!firstArg || firstArg === "help") {
  if (positional[1]) {
    // help for specific command
    const cmd = findCommand(positional[1], positional[2]);
    if (cmd) {
      printCommandHelp(cmd);
    } else {
      console.error(`Unknown command: ${positional.slice(1).join(" ")}`);
      process.exit(1);
    }
  } else {
    printHelp();
  }
  process.exit(0);
}

if (firstArg === "list") {
  try {
    const tools = await apiGet("/tools", globalOpts);
    if (isJson) {
      console.log(JSON.stringify(tools));
    } else {
      console.log(`\n  \x1b[36m\x1b[1mQuantOracle\x1b[0m \x1b[2m·\x1b[0m \x1b[1m${tools.length || "?"} Tools\x1b[0m\n`);
      if (Array.isArray(tools)) {
        for (const t of tools) {
          const price = t.price ? `$${t.price}` : "";
          console.log(`  \x1b[90m${price.padEnd(8)}\x1b[0m ${t.name || t.path}`);
        }
      }
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
  process.exit(0);
}

if (firstArg === "health") {
  try {
    const h = await apiGet("/health", globalOpts);
    if (isJson) { console.log(JSON.stringify(h)); }
    else {
      console.log(`\n  \x1b[32m\u2713\x1b[0m ${h.service || "QuantOracle"} ${h.version || ""} — ${h.status || "ok"}`);
      console.log(`  \x1b[90m${h.tools || "?"} tools · ${h.domain || ""}\x1b[0m\n`);
    }
  } catch (e) { console.error(`Error: ${e.message}`); process.exit(1); }
  process.exit(0);
}

if (firstArg === "usage") {
  try {
    const m = await apiGet("/metrics", globalOpts);
    if (isJson) { console.log(JSON.stringify(m)); }
    else { console.log(formatGeneric("Usage", m)); }
  } catch (e) { console.error(`Error: ${e.message}`); process.exit(1); }
  process.exit(0);
}

// ── Find and execute command ──────────────────────────────────────
const cmd = findCommand(positional[0], positional[1]);

if (!cmd) {
  console.error(`Unknown command: ${positional.join(" ")}`);
  console.error(`Run \x1b[1mquantoracle help\x1b[0m for available commands.`);
  process.exit(1);
}

// Validate required flags and build payload
try {
  const payload = buildPayload(cmd, flags);
  const data = await apiCall(cmd.endpoint, payload, globalOpts);

  if (isJson) {
    console.log(JSON.stringify(data));
  } else {
    console.log(cmd.format(data));
    console.log();
  }
} catch (e) {
  if (isJson) {
    console.log(JSON.stringify({ error: e.message }));
  } else {
    console.error(`\n  \x1b[31mError:\x1b[0m ${e.message}`);
    if (e.message.includes("required")) {
      console.error();
      printCommandHelp(cmd);
    }
    console.error();
  }
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────

function findCommand(arg1, arg2) {
  // Try two-word match first: "options price"
  if (arg2) {
    const twoWord = `${arg1} ${arg2}`;
    if (byName.has(twoWord)) return byName.get(twoWord);
  }
  // Try alias: "bs", "kelly", "mc"
  if (byAlias.has(arg1)) return byAlias.get(arg1);
  // Try single-word category match (for "risk" -> "risk portfolio")
  if (byName.has(arg1)) return byName.get(arg1);
  return null;
}

function buildPayload(cmd, flags) {
  // Custom payload builder
  if (cmd.buildPayload) {
    // Pre-process typed flags
    const processed = {};
    for (const [flagName, spec] of Object.entries(cmd.flags)) {
      let val = flags[flagName];
      if (val === undefined) continue;
      if (spec.type === "data") val = parseData(val);
      else if (spec.type === "json") val = parseJSON(val);
      else if (spec.type === "csv") val = readCSV(val);
      else if (spec.type === "number") val = Number(val);
      processed[spec.api || flagName] = val;
    }
    return cmd.buildPayload(processed);
  }

  // Default: map flags to API params
  const payload = {};
  for (const [flagName, spec] of Object.entries(cmd.flags)) {
    let val = flags[flagName];

    if (val === undefined) {
      if (spec.required) {
        throw new Error(`--${flagName} is required\n  ${spec.desc}`);
      }
      continue;
    }

    // Type coercion
    if (spec.type === "number") {
      val = Number(val);
      if (isNaN(val)) throw new Error(`--${flagName} must be a number (got "${flags[flagName]}")`);
    } else if (spec.type === "data") {
      val = parseData(val);
    } else if (spec.type === "json") {
      val = parseJSON(val);
    } else if (spec.type === "csv") {
      val = readCSV(val);
    }

    payload[spec.api] = val;
  }

  return payload;
}

function printHelp() {
  console.log(`
  \x1b[36m\x1b[1mQuantOracle CLI\x1b[0m — 63 quant tools in your terminal
  \x1b[90mhttps://quantoracle.dev\x1b[0m

  \x1b[1mUsage:\x1b[0m quantoracle <command> [options]

  \x1b[1mCommands:\x1b[0m`);

  const categories = {};
  for (const cmd of ALL_COMMANDS) {
    const cat = cmd.name.split(" ")[0];
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cmd);
  }

  for (const [cat, cmds] of Object.entries(categories)) {
    console.log(`\n  \x1b[33m${cat}\x1b[0m`);
    for (const cmd of cmds) {
      const alias = cmd.aliases ? ` \x1b[90m(${cmd.aliases.join(", ")})\x1b[0m` : "";
      console.log(`    ${cmd.name.padEnd(28)} ${cmd.description}${alias}`);
    }
  }

  console.log(`
  \x1b[1mGlobal flags:\x1b[0m
    --json              Raw JSON output (for piping to jq)
    --api-key KEY       API key (or QUANTORACLE_API_KEY env var)
    --url URL           Override API URL
    --verbose           Show request/response details
    --no-color          Disable colored output

  \x1b[1mData input:\x1b[0m
    Inline:   --returns "0.01,-0.005,0.008"
    File:     --returns @returns.txt
    CSV:      --file portfolio.csv

  \x1b[1mExamples:\x1b[0m
    quantoracle bs --spot 185 --strike 190 --expiry 0.25 --vol 0.25
    quantoracle kelly --win-rate 0.55 --avg-win 120 --avg-loss 100
    quantoracle mc --value 80000 --return 0.10 --vol 0.18 --years 2
    quantoracle bs --spot 185 --strike 190 --expiry 0.25 --vol 0.25 --json | jq '.greeks.delta'
`);
}

function printCommandHelp(cmd) {
  const alias = cmd.aliases ? ` (aliases: ${cmd.aliases.join(", ")})` : "";
  console.log(`\n  \x1b[1m${cmd.name}\x1b[0m${alias}`);
  console.log(`  ${cmd.description}\n`);
  console.log(`  \x1b[1mUsage:\x1b[0m quantoracle ${cmd.name} [flags]\n`);
  console.log(`  \x1b[1mFlags:\x1b[0m`);
  for (const [name, spec] of Object.entries(cmd.flags)) {
    const req = spec.required ? " \x1b[31m(required)\x1b[0m" : "";
    console.log(`    --${name.padEnd(20)} ${spec.desc}${req}`);
  }
}
