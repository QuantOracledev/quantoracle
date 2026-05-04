/**
 * Parse a free-form text blob of numbers into a number array.
 * Accepts: comma-separated, newline-separated, whitespace-separated,
 * with or without leading + signs, percent signs (which are stripped),
 * and surrounding brackets. Silently drops anything that can't be parsed.
 */
export function parseNumberSeries(input: string): number[] {
  if (!input) return [];
  return input
    .replace(/[\[\]()]/g, ' ')
    .split(/[\s,;]+/)
    .map((s) => s.trim().replace(/%$/, ''))
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));
}

/** Default sample return series used when a user hasn't entered anything yet. */
export const SAMPLE_RETURNS_DAILY = [
  0.0042, -0.0089, 0.0123, 0.0034, -0.0056, 0.0078, 0.0021, -0.0045, 0.0098, -0.0012, 0.0067,
  0.0089, -0.0134, 0.0023, 0.0056, -0.0078, 0.0045, 0.0102, -0.0067, 0.0015, 0.0034, -0.0089,
  0.0123, 0.0078, -0.0023, 0.0056, 0.0089, -0.0145, 0.0034, 0.0067,
];
