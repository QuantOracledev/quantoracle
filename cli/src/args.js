// Zero-dep argument parser

import { readFileSync } from "fs";

/**
 * Parse process.argv into { flags, positional }
 * Supports: --flag value, --flag=value, --bool-flag
 */
export function parseArgs(argv) {
  const flags = {};
  const positional = [];
  let i = 0;

  while (i < argv.length) {
    const arg = argv[i];

    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx !== -1) {
        // --flag=value
        const key = arg.slice(2, eqIdx);
        flags[key] = arg.slice(eqIdx + 1);
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        // --flag value
        flags[arg.slice(2)] = argv[i + 1];
        i++;
      } else {
        // --bool-flag
        flags[arg.slice(2)] = true;
      }
    } else {
      positional.push(arg);
    }
    i++;
  }

  return { flags, positional };
}

/**
 * Parse a data value — handles inline CSV, @file, JSON arrays
 */
export function parseData(value) {
  if (value === undefined || value === null) return undefined;

  // @file — read from file, one value per line
  if (typeof value === "string" && value.startsWith("@")) {
    const content = readFileSync(value.slice(1), "utf-8");
    return content
      .split("\n")
      .map(l => l.trim())
      .filter(l => l && !isNaN(l))
      .map(Number);
  }

  // JSON array
  if (typeof value === "string" && value.startsWith("[")) {
    try {
      return JSON.parse(value);
    } catch {
      // fall through to CSV
    }
  }

  // Comma-separated numbers
  if (typeof value === "string" && value.includes(",")) {
    return value.split(",").map(s => {
      const n = Number(s.trim());
      if (isNaN(n)) throw new Error(`Invalid number in list: "${s.trim()}"`);
      return n;
    });
  }

  // Single number
  const n = Number(value);
  if (!isNaN(n)) return n;

  return value;
}

/**
 * Parse JSON value (for --legs, --scenarios, etc.)
 */
export function parseJSON(value) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Invalid JSON: ${value}`);
  }
}

/**
 * Read CSV file into { name: [values] } object
 */
export function readCSV(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV needs header row + data rows");

  const headers = lines[0].split(",").map(h => h.trim());
  const result = {};
  headers.forEach(h => (result[h] = []));

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map(s => s.trim());
    headers.forEach((h, j) => {
      if (vals[j] && !isNaN(vals[j])) result[h].push(Number(vals[j]));
    });
  }

  return result;
}
