/**
 * Example: chained-action workflow. The two paid composite endpoints
 * (assess_portfolio_risk + recommend_hedge) form a natural agent workflow:
 *
 *   1. User describes their portfolio + return history
 *   2. Agent audits risk via assess_portfolio_risk ($0.04 USDC)
 *   3. If risk metrics breach a threshold, agent automatically calls
 *      recommend_hedge to find the cheapest viable protection ($0.04 USDC)
 *   4. Agent presents a single combined recommendation
 *
 * This file scripts that flow end-to-end with a pre-baked prompt sequence so
 * you can see the chain execute without typing each step yourself. Useful as
 * a reference for the multi-call pattern when designing your own agents.
 *
 * Setup is identical to example-agent.ts:
 *   1. npx create-onchain-agent (or use existing AgentKit project)
 *   2. Drop the QuantOracle action provider files in
 *   3. Set OPENAI_API_KEY + CDP_API_KEY_ID/CDP_API_KEY_SECRET
 *   4. Fund your AgentKit wallet with ~$0.50 USDC on Base mainnet
 *   5. Run: npx tsx example-chained-workflow.ts
 *
 * The script will spend ~$0.08 USDC ($0.04 + $0.04) per run on real x402
 * settlements. Expected total runtime: 5-10 seconds.
 */
import { AgentKit, CdpEvmWalletProvider } from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { quantoracleActionProvider } from "./quantoracleActionProvider";

/** A realistic portfolio scenario for the demo: a $100K long NVDA position
 *  with the last 60 trading days of returns. The risk audit should flag
 *  high concentration + drawdown; the hedge recommender should propose
 *  collar / protective put structures.
 *
 *  Returns are synthetic but tuned to look like a high-vol single-stock
 *  position (mean +0.15%/day, stdev ~3%, occasional larger moves). */
const NVDA_LAST_60_RETURNS = [
  0.012, -0.025, 0.034, 0.008, -0.018, 0.022, 0.005, -0.011, 0.041, -0.029,
  0.018, 0.007, -0.045, 0.038, 0.012, -0.008, 0.025, -0.014, 0.031, 0.019,
  -0.052, 0.067, -0.022, 0.014, 0.028, -0.019, 0.041, -0.033, 0.025, 0.018,
  -0.011, 0.022, 0.014, -0.038, 0.045, 0.012, -0.019, 0.029, 0.008, 0.022,
  -0.014, 0.018, -0.025, 0.041, 0.012, -0.029, 0.025, 0.014, 0.008, -0.022,
  0.038, 0.019, -0.011, 0.025, 0.014, 0.008, -0.029, 0.041, 0.012, 0.022,
];

/** Scripted conversation that exercises the assess → hedge chain. */
const PROMPTS = [
  // Prompt 1: ask for the risk audit. Agent should call assess_portfolio_risk.
  `I have a $100,000 long NVDA position. Here are the last 60 daily returns:
[${NVDA_LAST_60_RETURNS.join(", ")}]

Audit the risk on this position. I'm specifically concerned about max drawdown
and tail risk.`,

  // Prompt 2: chain to hedge recommendation. The agent should pick up the
  // context from the prior message and call recommend_hedge with sensible
  // params (the same $100K notional, ~30 day horizon).
  `Given that risk profile, recommend the cheapest hedge structure to protect
against a 10%+ drawdown over the next 30 days. Compare collar vs protective put.`,

  // Prompt 3: synthesize. Agent now has both tool outputs and should give a
  // final actionable recommendation grounded in both.
  `Based on both the risk audit and the hedge analysis, what would you actually
do — and what's the expected cost vs the expected protection benefit?`,
];

async function main(): Promise<void> {
  const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
    apiKeyId: process.env.CDP_API_KEY_ID!,
    apiKeySecret: process.env.CDP_API_KEY_SECRET!,
    networkId: "base-mainnet",
  });

  const agentkit = await AgentKit.from({
    walletProvider,
    actionProviders: [quantoracleActionProvider()],
  });
  const tools = await getLangChainTools(agentkit);

  const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });
  const agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: new MemorySaver(),
    messageModifier: `
You are a risk-management agent. You have access to QuantOracle's deterministic
quant tools. ALWAYS use the tools — never compute Sharpe, drawdown, VaR, Kelly,
Greeks, or option prices in-context.

Workflow you should follow when a user describes a position:
  1. First audit the risk with assess_portfolio_risk (free composite call —
     actually it costs $0.04 USDC, but it's worth it for the integrated view).
     This returns Sharpe, Sortino, Calmar, max drawdown, VaR, CVaR, Kelly, Hurst.
  2. If the audit shows meaningful tail risk (max DD > 15%, CVaR > 5%, or
     Kelly recommends de-sizing), THEN call recommend_hedge with sensible
     parameters derived from the position size and the user's risk tolerance.
  3. Synthesize: present the actionable conclusion grounded in both tool
     outputs. Cite specific numbers.

Be concise but specific. The user is a sophisticated trader; don't over-explain
fundamentals.
`,
  });

  const config = { configurable: { thread_id: "quantoracle-chained-demo" } };
  console.log("\n" + "=".repeat(72));
  console.log("  QuantOracle chained-action demo (risk audit → hedge recommend)");
  console.log("  Expected cost: ~$0.08 USDC via x402 on Base mainnet");
  console.log("=".repeat(72));

  for (const [i, prompt] of PROMPTS.entries()) {
    console.log(`\n${"─".repeat(72)}\nPrompt ${i + 1}/${PROMPTS.length}:\n${prompt}\n${"─".repeat(72)}\n`);
    const stream = await agent.stream(
      { messages: [new HumanMessage(prompt)] },
      config,
    );
    for await (const chunk of stream) {
      if ("agent" in chunk) {
        const last = chunk.agent.messages[chunk.agent.messages.length - 1];
        if (last?.content) console.log(`\nAgent response:\n${last.content}\n`);
      } else if ("tools" in chunk) {
        // Print tool invocation outputs for visibility into the chain
        for (const msg of chunk.tools.messages || []) {
          const name = (msg as { name?: string }).name ?? "?";
          const content = msg.content as string;
          const preview = content.length > 200 ? content.slice(0, 200) + "..." : content;
          console.log(`  [tool ${name}] ${preview}`);
        }
      }
    }
  }

  console.log("\n" + "=".repeat(72));
  console.log("  Demo complete. Check your wallet's USDC balance for the x402 spend.");
  console.log("=".repeat(72) + "\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
