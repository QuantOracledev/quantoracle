# QuantOracle integration patterns — same question, three ways

QuantOracle is available through several agent frameworks. This doc shows the
same realistic question — *"What's the Kelly fraction for a strategy with 55%
win rate, $150 avg win, $100 avg loss?"* — answered three ways, so you can
pick the integration that fits your stack.

The answer to that question is always **f\* = 17.5%** (and half-Kelly =
8.75%). All three paths return the same number; they differ in how the agent
gets there.

---

## Pattern 1 — Direct HTTP (no agent framework)

For when you don't need agent-style tool use, just want the math.

```bash
curl -s -X POST https://api.quantoracle.dev/v1/risk/kelly \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "discrete",
    "win_rate": 0.55,
    "avg_win": 150,
    "avg_loss": 100
  }'
```

**Response:**

```json
{
  "full_kelly": 0.175,
  "half_kelly": 0.0875,
  "quarter_kelly": 0.0438,
  "edge": 32.5,
  "payoff_ratio": 1.5,
  "recommended": "HALF_KELLY",
  "ms": 8.2,
  "_meta": {
    "powered_by": "QuantOracle",
    "url": "https://quantoracle.dev",
    "calculator": "https://quantoracle.dev/kelly-criterion-calculator"
  }
}
```

**When to use:** scripts, backtests, deterministic pipelines, anywhere you
control the prompt and don't need an LLM to choose tools. No SDK, no
dependencies beyond an HTTP client.

**Free tier:** 1,000 calls per IP per day, no signup. Same as all integrations.

---

## Pattern 2 — Coinbase AgentKit (TypeScript)

For agents built on Coinbase's AgentKit framework. The wallet handles x402
micropayments automatically for paid composite endpoints.

**Install:** drop the 4 action-provider files into your project (see
[README.md](./README.md) for the curl one-liners).

**Code:**

```ts
import { AgentKit, CdpEvmWalletProvider } from "@coinbase/agentkit";
import { quantoracleActionProvider } from "./quantoracleActionProvider";

const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
  apiKeyId: process.env.CDP_API_KEY_ID!,
  apiKeySecret: process.env.CDP_API_KEY_SECRET!,
  networkId: "base-mainnet",
});

const agentkit = await AgentKit.from({
  walletProvider,
  actionProviders: [quantoracleActionProvider()],
});

// The agent — wired to GPT-4o via LangChain — chooses `calculate_kelly`
// because the Zod schema's .describe() text matches the user question.
// AgentKit handles the HTTP call and returns the result.
```

**The LLM prompt the user sees:**
> "I have 55% win rate, $150 avg win, $100 avg loss — what's my Kelly?"

**The agent's reasoning trace (typical):**
1. LLM identifies the question as a Kelly Criterion sizing problem
2. LLM picks the `calculate_kelly` tool from QuantOracle's action provider
3. LLM extracts `win_rate=0.55, avg_win=150, avg_loss=100` from the prompt
4. AgentKit invokes the tool → tool POSTs to `/v1/risk/kelly`
5. Tool returns the JSON to the LLM
6. LLM composes a natural-language answer citing the tool

**When to use:** Coinbase-stack agents, x402-native agents, EVM or Solana
wallets, autonomous trading bots that need to pay for premium composites.

**Paid composites:** the wallet pays $0.04 USDC per call to
`assess_portfolio_risk` and `recommend_hedge`. No QuantOracle account
required — wallet ownership is the only auth.

---

## Pattern 3 — LangChain (Python)

For agents in the broader LangChain ecosystem (any LLM, any orchestrator).

**Install:**

```bash
pip install langchain-quantoracle
```

**Code:**

```python
from langchain_quantoracle import QuantOracleToolkit
from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate

# All 73 tools (63 calculators + 10 composites)
tools = QuantOracleToolkit().get_tools()

# Or filter by category
tools = QuantOracleToolkit(categories=["risk", "stats"]).get_tools()

llm = ChatOpenAI(model="gpt-4o", temperature=0)
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a quant finance agent. Use the provided tools for any math."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

response = executor.invoke({
    "input": "I have 55% win rate, $150 avg win, $100 avg loss — what's my Kelly?"
})
```

**When to use:** Python-native pipelines, multi-tool agents (combining
QuantOracle with other LangChain tools like web search, file ops, vector
DBs), LangGraph workflows, anywhere you want all 73 endpoints available
without curating a subset.

**Paid composites:** by default the LangChain toolkit only exposes free
endpoints. Pass `enable_paid=True` to surface the 10 composites; you'll need
to handle x402 payment separately (the Python toolkit doesn't bundle a
wallet — that's an explicit design choice to keep dependencies minimal).

---

## Which one should I use?

| Your situation | Use |
|---|---|
| Just need the math, no agent | **HTTP** |
| Building on Coinbase / x402 / CDP wallets | **AgentKit** |
| Python-native, LangChain or LangGraph | **LangChain** |
| OpenAI custom GPT | [GPT Actions](https://github.com/QuantOracledev/quantoracle/tree/main/integrations/openai) |
| Solana ecosystem, lower per-call gas | **AgentKit with `SolanaKeypairWalletProvider`** (see `example-agent-solana.ts`) |
| MCP-compatible client (Claude Desktop, Cursor, etc) | The npm package `quantoracle-mcp` (separate integration) |

All paths hit the same QuantOracle API. Outputs are byte-identical across
integrations for the same inputs. Pick by ergonomics, not by capability.

---

## Mixing patterns

These aren't mutually exclusive. Common production patterns:

- **AgentKit for trade execution + HTTP for offline backtesting.** The same
  Kelly formula, called from an agent at runtime and from a Python notebook
  during research.
- **LangChain for the research agent + AgentKit for the production trader.**
  Develop with broad tool access (all 73 endpoints), deploy with curated
  subset (5 actions) for tighter control.
- **MCP for the developer's IDE + HTTP for the CI pipeline.** Same math,
  different consumers.

Agents that use multiple QuantOracle integrations don't pay twice — the
free-tier rate limit (1,000/IP/day) is shared across all paths from the same
egress IP, and paid composites are charged once per actual call regardless
of which SDK invoked them.
