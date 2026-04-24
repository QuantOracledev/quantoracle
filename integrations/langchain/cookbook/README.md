# QuantOracle × LangChain cookbook

Single-page recipes that show LangChain agents using QuantOracle for deterministic quant finance math.

| Notebook | What it shows | Free tier? |
|---|---|---|
| [`quantoracle_risk_analyst.ipynb`](./quantoracle_risk_analyst.ipynb) | A 25-line LangChain agent that answers risk + Kelly questions with reproducible math. | Yes |

## Run locally

```bash
pip install langchain-quantoracle langchain-openai langchain jupyter
export OPENAI_API_KEY=sk-...
jupyter notebook quantoracle_risk_analyst.ipynb
```

## Run in Colab

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/QuantOracledev/quantoracle/blob/main/integrations/langchain/cookbook/quantoracle_risk_analyst.ipynb)

## Why deterministic math matters for agents

LLMs are great at reasoning about finance and unreliable at *doing* finance math. Ask an LLM to price a Black-Scholes call and the price drifts run-to-run; ask for vanna or charm and it's frequently wrong. When an agent makes 50 tool calls during a backtest, every calculation has to land — the cumulative drift turns the run into noise.

Pattern: **LLM for reasoning, deterministic API for compute.** That's what these notebooks demonstrate.
