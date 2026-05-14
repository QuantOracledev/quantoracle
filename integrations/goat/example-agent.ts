/**
 * Runnable example: a GOAT-SDK agent on Base that uses QuantOracle for
 * deterministic quant math. This example uses the Vercel AI SDK adapter
 * (the most common GOAT adapter) — the same plugin works with the
 * LangChain, Eliza, and direct adapters too.
 *
 * Prerequisites:
 *   - Node 20+
 *   - OPENAI_API_KEY env var
 *   - WALLET_PRIVATE_KEY env var (any EVM key; doesn't need to be funded
 *     unless you want to call paid composite endpoints)
 *   - pnpm i ai @ai-sdk/openai @goat-sdk/core @goat-sdk/adapter-vercel-ai \
 *           @goat-sdk/wallet-viem viem @quantoracle/goat-plugin
 *
 * Run with: tsx example-agent.ts
 */
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { viem } from "@goat-sdk/wallet-viem";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { quantoracle } from "./plugin";

async function main() {
  const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    transport: http(),
    chain: base,
  });

  const tools = await getOnChainTools({
    wallet: viem(walletClient),
    plugins: [
      // Core bundle (5 tools). Use ['core', 'defi'] for an onchain trading
      // agent that also needs IL and liquidation-price math; use 'all' for
      // every bundle (15 tools).
      ...quantoracle({ include: ["core", "defi"] }),
      // ...add other GOAT plugins here (uniswap, jupiter, opensea, etc.)
    ],
  });

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    tools,
    maxSteps: 5,
    system: [
      "You are an onchain finance assistant.",
      "When the user asks anything quantitative — option prices, position sizing,",
      "portfolio simulation, risk metrics — you MUST call the matching",
      "QuantOracle tool rather than computing the answer yourself.",
      "After the tool returns, summarise the key numbers in plain English.",
    ].join(" "),
    prompt: [
      "I want to sell a 30-day covered call on my $498 SPY position. Strike $510,",
      "implied vol 18%, risk-free rate 5%. What's the call's fair value and",
      "how much premium will I collect per share? Also: I have a 55% win-rate",
      "strategy with $1,200 avg win and $800 avg loss — what fraction should I risk?",
    ].join(" "),
  });

  console.log("\n=== Final answer ===\n");
  console.log(result.text);

  console.log("\n=== Tool calls ===");
  for (const step of result.steps) {
    for (const call of step.toolCalls ?? []) {
      console.log(`- ${call.toolName}(${JSON.stringify(call.args).slice(0, 100)}...)`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
