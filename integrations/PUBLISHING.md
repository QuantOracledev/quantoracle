# Publishing the QuantOracle integration packages to npm

All packages are built, tested, and verified ready for `npm publish`. The
only step left is the actual publish, which requires npm authentication —
this can only run on a machine where you're logged in as the `quantoracle`
npm user.

## State of the four packages

| Package | npm status | Local state |
|---|---|---|
| `@quantoracle/plugin-quantoracle` | **already published** (v0.1.0, 3 weeks ago) | — |
| `@quantoracle/agentkit` | not published — name available | built, dry-run pack ✅ |
| `@quantoracle/ai-tools` | not published — name available | built, dry-run pack ✅ |
| `@quantoracle/goat-plugin` | not published — name available | built, dry-run pack ✅ |

The `@quantoracle` org exists on npm with `hello@quantoracle.dev` as owner.

## Prerequisites (one-time)

```bash
# 1. Log into npm as the quantoracle user
npm login
#    Username: quantoracle
#    Password: ...
#    Email: hello@quantoracle.dev
#    OTP (if 2FA enabled): ...

# 2. Verify
npm whoami    # should print: quantoracle
```

## Publishing — three commands per package

The `prepublishOnly` script rebuilds the package from source on every
publish, so you don't need to manually run `npm run build` first. Each
package's `files` whitelist + `.npmignore` already ensures only `dist/` +
`README.md` ship.

### 1. `@quantoracle/ai-tools` (Vercel AI SDK)

```bash
cd D:/Quantcalc/integrations/vercel-ai
npm install                       # fresh install if not done yet
npm publish --access=public       # --access=public is required for first publish of a scoped package
```

Expected output ends with: `+ @quantoracle/ai-tools@0.1.0`

### 2. `@quantoracle/goat-plugin` (GOAT SDK)

```bash
cd D:/Quantcalc/integrations/goat
npm install
npm publish --access=public
```

### 3. `@quantoracle/agentkit` (Coinbase AgentKit)

```bash
cd D:/Quantcalc/integrations/agentkit
npm install
npm publish --access=public
```

## Verification (post-publish)

After each publish, the package is live at `https://www.npmjs.com/package/<name>`
within ~30 seconds. Verify with:

```bash
npm view @quantoracle/ai-tools
npm view @quantoracle/goat-plugin
npm view @quantoracle/agentkit
```

Each should print the package metadata, latest version `0.1.0`, and the
maintainer line `quantoracle <hello@quantoracle.dev>`.

## After publishing — distribution next steps

These are not gated by the publish; you can do them in any order once the
packages are live.

1. **Awesome-list PRs** — get the packages indexed where developers actually look:
   - Vercel AI SDK: submit to <https://github.com/vercel/ai/discussions> (community plugins)
   - GOAT SDK: submit a PR adding `@quantoracle/goat-plugin` to the plugins list in <https://github.com/goat-sdk/goat>
   - Coinbase AgentKit: submit an extension PR to <https://github.com/coinbase/agentkit/tree/main/typescript/agentkit/src/action-providers> (this is the bigger lift — they want jest tests + ESLint compliance)

2. **`/writing` tutorials** — one tutorial per integration, pointing back to the
   npm package and ranking for searches like "vercel ai sdk options pricing"
   or "GOAT SDK quant tools." Pattern is already established by the two
   site-native articles in `/writing/agentkit-reliable-quant-finance-math`
   and `/writing/chaining-x402-paid-tool-calls`.

3. **Helius MCP catalog + Jupiter Agent SDK** — Solana-side distribution moves
   that aren't blocked on these npm publishes.

## If something goes wrong

- **`E403 You do not have permission to publish`** — you're not logged in as
  a `@quantoracle` org member. Re-run `npm login`.
- **`E402 You must sign up for private packages`** — you forgot
  `--access=public` on first publish of a scoped package.
- **Want to unpublish?** — `npm unpublish @quantoracle/<name>@0.1.0` works
  within 72 hours of publish. After that, you can only deprecate
  (`npm deprecate @quantoracle/<name>@0.1.0 "reason"`).
- **Want to re-publish under a different name?** — bump to `0.1.1`,
  change `name` in `package.json`, `npm publish --access=public`. The old
  name stays registered (squatted) but does no harm.

## Version-bumping policy going forward

These are v0.1.0 — semver pre-1.0, so:

- **0.1.x patch**: bug fixes, doc-only changes, behaviour-preserving
  refactors. No API changes.
- **0.2.0 minor (breaking)**: adding tools to a bundle is non-breaking;
  *removing* a bundle key or *renaming* an exported function is breaking
  and bumps the minor.
- **1.0.0**: when we're confident the public API (factory signatures,
  bundle keys, the `include` semantics) is stable. No rush.
