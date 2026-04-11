# langchain-quantoracle

63 deterministic quant computation tools for LangChain agents. Options pricing, risk metrics, portfolio optimization, technical indicators, statistics, crypto/DeFi, FX, macro, and more.

## Install

```bash
pip install langchain-quantoracle
```

## Usage

```python
from langchain_quantoracle import QuantOracleToolkit

# Load all 63 tools
tools = QuantOracleToolkit().get_tools()

# Or filter by category
tools = QuantOracleToolkit(categories=["options", "risk"]).get_tools()

# Use with any LangChain agent
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate

llm = ChatOpenAI(model="gpt-4o")
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a quant analyst. Use QuantOracle tools for all financial math."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)
result = executor.invoke({"input": "Price a call option: spot 100, strike 105, 6 months, 20% vol"})
```

## Self-hosted

```python
tools = QuantOracleToolkit(api_url="http://localhost:8000").get_tools()
```

## Categories

`options`, `derivatives`, `risk`, `indicators`, `simulate`, `portfolio`, `fixed-income`, `fi`, `stats`, `crypto`, `fx`, `macro`, `tvm`, `trade`, `pairs`

## Links

- API docs: https://api.quantoracle.dev/docs
- GitHub: https://github.com/QuantOracledev/quantoracle
- 1,000 free calls/day, no signup
