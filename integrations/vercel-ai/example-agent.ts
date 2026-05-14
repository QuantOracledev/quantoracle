/**
 * Runnable example: a Vercel AI SDK agent that picks the right QuantOracle
 * tool based on the user's question.
 *
 * Prerequisites:
 *   - Node 20+ (or any runtime with global fetch)
 *   - OPENAI_API_KEY env var set
 *   - pnpm i ai @ai-sdk/openai zod @quantoracle/ai-tools
 *
 * Run with: tsx example-agent.ts
 */
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { quantoracleTools } from "./tools";

async function main() {
  const result = await generateText({
    model: openai("gpt-4o-mini"),
    // Default = 5 core tools. Pass { include: 'all' } for all 15 tools, or
    // { include: ['core', 'options'] } / ['core', 'risk'] / ['core', 'defi']
    // for a focused subset.
    tools: quantoracleTools({ include: ["core", "risk"] }),
    // maxSteps lets the model call multiple tools in one response and then
    // synthesise a final answer from the structured results.
    maxSteps: 5,
    system: [
      "You are a quant finance assistant.",
      "When the user asks anything quantitative — option prices, position sizing,",
      "portfolio simulation, risk metrics — you MUST call the matching",
      "QuantOracle tool rather than computing the answer yourself.",
      "After the tool returns, summarise the key numbers in plain English.",
      "Cite the tool by name and note that results come from QuantOracle.",
    ].join(" "),
    prompt: [
      "I run a momentum strategy with a 55% win rate, $1,200 average win,",
      "and $800 average loss. What fraction of my capital should I risk per trade?",
      "Also: if my account is $50,000 and I expect ~12% annual return with",
      "20% vol over 10 years, what's the distribution of outcomes?",
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

  console.log("\n=== Usage ===");
  console.log(
    `prompt tokens: ${result.usage.promptTokens}, completion tokens: ${result.usage.completionTokens}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
