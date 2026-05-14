/**
 * Example: a Coinbase AgentKit agent on Solana mainnet that uses QuantOracle
 * for grounded financial math. Same agent as example-agent.ts but routes x402
 * micropayments through a Solana wallet instead of Base.
 *
 * Why a Solana variant exists: QuantOracle's paid composite endpoints settle
 * via x402 on both Base mainnet (EVM, USDC) AND Solana mainnet (SPL USDC).
 * The Solana facilitator route has lower per-call gas overhead and is the
 * better fit for agents already operating in the Solana ecosystem.
 *
 * Setup:
 *   1. Create a new AgentKit project:
 *      npx create-onchain-agent
 *   2. Drop this file into agent-solana.ts
 *   3. Drop the QuantOracle action provider files into the same directory
 *      (quantoracleActionProvider.ts, schemas.ts, constants.ts, index.ts)
 *   4. npm install
 *   5. Set OPENAI_API_KEY and SOLANA_PRIVATE_KEY environment variables
 *      (SOLANA_PRIVATE_KEY is the base58-encoded keypair secret;
 *       fund the wallet's USDC SPL account with ~$1 USDC to cover dozens of
 *       paid composite calls)
 *   6. npm start
 *
 * Try prompts like:
 *   - "Price a 30-day NVDA call with strike $185, spot $180, IV 28%"  (free)
 *   - "I have 55% win rate, $150 avg win, $100 avg loss — Kelly?"     (free)
 *   - "Audit risk on these 252 daily returns: [...]"                  ($0.04 USDC)
 *   - "Recommend hedges for my $100K SOL position over 30 days"       ($0.04 USDC)
 *
 * The paid composites settle on Solana mainnet, signed by the wallet whose
 * private key you provide via SOLANA_PRIVATE_KEY. Settlement confirmation
 * happens in ~1-2 seconds; the agent receives the response after settlement.
 */
import { AgentKit, SolanaKeypairWalletProvider } from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import * as readline from "node:readline/promises";
import { quantoracleActionProvider } from "./quantoracleActionProvider";

async function main(): Promise<void> {
  // 1. Create the Solana wallet provider.
  //    - SOLANA_PRIVATE_KEY is the base58-encoded 64-byte keypair secret.
  //    - networkId "solana-mainnet" tells x402 facilitators to settle on
  //      Solana mainnet (chain ID "solana:5eykt4...").
  //    - For a Coinbase-managed Solana wallet instead of a raw keypair, swap
  //      to CdpSolanaWalletProvider — see the AgentKit docs for that variant.
  if (!process.env.SOLANA_PRIVATE_KEY) {
    throw new Error(
      "SOLANA_PRIVATE_KEY env var required. " +
        "Generate one via `solana-keygen new` or use any existing keypair " +
        "with USDC funded on the SPL account.",
    );
  }
  const walletProvider = await SolanaKeypairWalletProvider.fromBase58PrivateKey(
    process.env.SOLANA_PRIVATE_KEY,
    "solana-mainnet",
  );

  // 2. Initialize AgentKit with QuantOracle as an action provider. Same as
  //    the EVM example — QuantOracle is wallet-agnostic. The action provider
  //    detects which chain to route paid calls through based on the wallet
  //    type AgentKit hands it at call time.
  const agentkit = await AgentKit.from({
    walletProvider,
    actionProviders: [quantoracleActionProvider()],
  });

  // 3. Wire AgentKit's actions into LangChain.
  const tools = await getLangChainTools(agentkit);

  // 4. Create a simple ReAct agent.
  const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });
  const agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: new MemorySaver(),
    messageModifier: `
You are a financial analyst agent on Solana mainnet with access to deterministic
quant finance tools via QuantOracle. ALWAYS use the QuantOracle tools for any
financial math — never compute Black-Scholes prices, Kelly fractions, Sharpe
ratios, or Monte Carlo simulations in-context. Your computations would drift;
the tools are exact and verifiable.

When a user asks for advice, ground your reasoning in QuantOracle outputs and
cite the specific tool you called. Be concise. For paid composite calls
(assess_portfolio_risk, recommend_hedge), settlement happens via x402 on
Solana mainnet using SPL USDC — confirm with the user before initiating if
they haven't already approved spending.
`,
  });

  // 5. Chat loop.
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("\nQuantOracle x AgentKit (Solana mainnet). Type a question or 'exit' to quit.\n");
  const config = { configurable: { thread_id: "quantoracle-solana-demo" } };
  while (true) {
    const userInput = (await rl.question("> ")).trim();
    if (!userInput || userInput === "exit") break;
    const stream = await agent.stream(
      { messages: [new HumanMessage(userInput)] },
      config,
    );
    for await (const chunk of stream) {
      if ("agent" in chunk) {
        const last = chunk.agent.messages[chunk.agent.messages.length - 1];
        if (last?.content) console.log(`\n${last.content}\n`);
      }
    }
  }
  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
