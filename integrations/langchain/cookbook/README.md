# QuantOracle × LangChain cookbook

Single-page recipes that show LangChain agents using QuantOracle for deterministic quant finance math.

![Hedging composite output](./notebook_screenshot.png)

| Notebook | What it shows | Free tier? |
|---|---|---|
| [`quantoracle_risk_analyst.ipynb`](./quantoracle_risk_analyst.ipynb) | A 25-line LangChain agent that handles a risk question (Sharpe + drawdown), Kelly position sizing (free tier), and a hedging recommendation composite that ranks 4 hedge structures with concrete strikes (paid, $0.04 in USDC via x402). | Yes for first two; paid for hedging |

## Run locally

```bash
pip install langchain-quantoracle langchain-openai langgraph jupyter
export OPENAI_API_KEY=sk-...
jupyter notebook quantoracle_risk_analyst.ipynb
```

The hedging composite cell needs an x402-capable HTTP client to settle the $0.04 payment ([AgentCash](https://agentcash.dev), Coinbase AgentKit, or your own EIP-3009 signer). Without one, that cell raises on the 402 — the rest of the notebook runs on the free tier.

## Run in Colab

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/QuantOracledev/quantoracle/blob/main/integrations/langchain/cookbook/quantoracle_risk_analyst.ipynb)

## Why deterministic math matters for agents

LLMs are great at reasoning about finance and unreliable at *doing* finance math. Ask an LLM to price a Black-Scholes collar and the strikes drift run-to-run; ask for vanna or charm and it's frequently wrong. When an agent makes 50 tool calls during a backtest or hedging analysis, every calculation has to land — cumulative drift turns the run into noise.

Pattern: **LLM for reasoning, deterministic API for compute.** That's what these notebooks demonstrate.
