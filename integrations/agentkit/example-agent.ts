/**
 * Example: a Coinbase AgentKit agent that uses QuantOracle for grounded
 * financial math. Drop this file into a fresh AgentKit project and run.
 *
 * Setup:
 *   1. Create a new AgentKit project:
 *      npx create-onchain-agent
 *   2. Drop this file into agent.ts
 *   3. Drop the QuantOracle action provider files into the same directory
 *   4. npm install (the agentkit deps already exist in the template)
 *   5. Set OPENAI_API_KEY and CDP_API_KEY environment variables
 *   6. npm start
 *
 * The agent will start a chat loop. Try prompts like:
 *   - "Price a 30-day NVDA call with strike $185, spot $180, IV 28%"
 *   - "I have 55% win rate, $150 avg win, $100 avg loss — Kelly?"
 *   - "Simulate $100K over 30 years with 7% return, 16% vol, 4% withdrawal"
 *   - "Recommend hedges for my $100K long NVDA position over the next 30 days"
 *
 * The agent uses GPT-4o by default but works with any LangChain-compatible LLM.
 *
 * To use a paid composite endpoint (assess_portfolio_risk, recommend_hedge),
 * AgentKit's wallet must hold USDC on Base mainnet (eip155:8453) or Solana
 * mainnet. The wallet pays automatically per call ($0.04 each); no API key
 * required, no signup. Calculator-tier endpoints (price_option, kelly,
 * monte-carlo) are free up to 1,000 calls per IP per day.
 */
import { AgentKit, CdpEvmWalletProvider } from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import * as readline from "node:readline/promises";
import { quantoracleActionProvider } from "./quantoracleActionProvider";

async function main(): Promise<void> {
  // 1. Create the wallet provider. AgentKit's CDP EVM wallet handles x402
  //    payments automatically when calling QuantOracle's paid composite
  //    endpoints. For free-tier-only usage, any wallet provider works.
  const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
    apiKeyId: process.env.CDP_API_KEY_ID!,
    apiKeySecret: process.env.CDP_API_KEY_SECRET!,
    networkId: "base-mainnet",
  });

  // 2. Initialize AgentKit with QuantOracle as an action provider.
  //    No QuantOracle config needed — free tier covers calculator endpoints,
  //    and the wallet pays for paid composites via x402.
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
You are a financial analyst agent with access to deterministic quant finance
tools via QuantOracle. ALWAYS use the QuantOracle tools for any financial
math — never compute Black-Scholes prices, Kelly fractions, Sharpe ratios,
or Monte Carlo simulations in-context. Your computations would drift; the
tools are exact and verifiable.

When a user asks for advice, ground your reasoning in QuantOracle outputs
and cite the specific tool you called. Be concise.
`,
  });

  // 5. Chat loop.
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("\nQuantOracle x AgentKit. Type a question or 'exit' to quit.\n");
  const config = { configurable: { thread_id: "quantoracle-demo" } };
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
