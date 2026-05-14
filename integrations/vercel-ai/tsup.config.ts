import { defineConfig } from "tsup";

/**
 * Build config — produces ESM + CJS output with type declarations.
 *
 * We deliberately exclude `example-agent.ts` from the entry list so the
 * runnable example doesn't ship to consumers; it lives in the repo for
 * documentation and local testing only.
 */
export default defineConfig({
  entry: ["index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target: "es2022",
});
