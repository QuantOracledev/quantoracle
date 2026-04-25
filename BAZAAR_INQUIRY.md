# Coinbase Bazaar de-index inquiry

**Send via:** comment on [coinbase/x402 PR #26](https://github.com/coinbase/x402/pull/26) (the only public surface — issues and discussions are disabled on the repo).

**Backup channels if no response in 5–7 days:**
- Email `developer-platform@coinbase.com`
- DM `@CoinbaseDev` on X with a link to the comment
- Reach out via [Coinbase Discord](https://discord.gg/coinbasedev) `#x402` channel if accessible

---

## Comment to post on PR #26

> Hi — checking in on this PR, plus surfacing a related visibility issue you might be able to help with.
>
> **Symptom:** QuantOracle is no longer indexed in CDP Bazaar. Querying `https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources?limit=200` (and paginating to all 20,438 resources) returns **0 results matching `quantoracle`**. We were listed previously and have been live and serving paid x402 traffic continuously since launch.
>
> **Manifest is healthy:**
> - `https://api.quantoracle.dev/.well-known/x402` returns 200 with **73 resources** advertised
> - Both Base mainnet (`eip155:8453`, USDC `0x8335...2913`) and Solana mainnet (`solana:5eykt4...`, USDC `EPjF...Dt1v`) are advertised on every resource
> - Each resource includes `outputSchema` with `discoverable: true` (per the Bazaar indexing convention)
> - `x402Version: 2`, `bazaarResourceServerExtension` registered on the resource server
>
> **Settlement record (proof we're a real, paying provider, not a stub):**
> - Base: wallet `0xC94f5F33ae446a50Ce31157db81253BfddFE2af6` — multiple on-chain settled transactions
> - Solana: wallet `9biztrXscReJ3Wi8EfkD2gL3WXzYUmzTEohD26Bxp39u` — on-chain settlements
> - 9 organic paid composite-workflow settlements in the last 7 days (full-analysis, hedging/recommend, backtest/strategy, portfolio/rebalance-plan, options/strategy-optimizer)
>
> **What I'd appreciate:**
> 1. Confirmation of whether Bazaar dropped us automatically (crawler issue, schema mismatch I'm missing) or manually (in which case, what should I fix to get re-listed?).
> 2. Whether there's a re-submission endpoint or a manual-trigger I can hit to nudge the crawler.
> 3. If the original PR (this one, #26) is what's blocking inclusion in the curated ecosystem listing, happy to address any feedback — there's no review activity yet beyond the cb-heimdall bot.
>
> Manifest URL for re-crawl: `https://api.quantoracle.dev/.well-known/x402`
>
> Also worth noting since you might index it: I just published `/.well-known/agent.json` (A2A v0.2 AgentCard schema, 73 skills with per-call pricing) and `/.well-known/agent-card.json` (alias) — discovery cross-refs to x402, OpenAPI, ai-plugin, and the MCP registry.
>
> Thanks for any guidance.

---

## Notes on tone & strategy

- Frames the ask as "help me debug" not "you broke our listing." Coinbase doesn't owe us inclusion; we want to make their life easy.
- Leads with concrete verification (manifest 200, wallet addresses, on-chain settlements) so a reviewer can verify in 30 seconds.
- The 9-settlements-in-7-days line is the strongest signal — it shows we're not a spam project, real agents are paying us.
- Combined with the "PR has been open 20 days with no review" point, gives the maintainer two adjacent asks: review this PR, fix the Bazaar entry. Either action helps us.
- The agent-card.json mention at the end is bonus signal — shows we're investing in standards adoption, not just trying to extract a listing.

## After posting

- [ ] Watch for response over 5–7 days
- [ ] If silence, escalate to email + X
- [ ] If they ask for a re-submission, we already have everything they need
