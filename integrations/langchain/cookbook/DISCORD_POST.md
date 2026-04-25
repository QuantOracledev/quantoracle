# LangChain Discord — `#show-and-tell` post

Paste this into the LangChain Discord (`https://discord.gg/langchain`, channel `#show-and-tell`). Keep it short — Discord posts that exceed a few hundred words underperform.

The recommended share image is `notebook_screenshot.png` (in this same directory) — it shows the agent calling the `hedging_recommend` paid composite for a $100k NVDA position and getting back a ranked table of 4 hedge structures with concrete strikes, costs, and a recommendation.

---

## Version A — short and punchy (recommended)

```
Built a LangChain agent that does deterministic quant finance math.
LLM for reasoning, API for compute — same input, same output, every run.

Asked it: "I'm long $100k of NVDA at $185, 30-day vol is 28%, how should
I hedge for the next month?"

Single tool call → priced 4 hedge structures via Black-Scholes (collar,
protective put, inverse, partial put), ranked them, recommended the
collar at $613 (0.61% of position) — half the cost of a protective put
alone, with concrete strikes. $0.04 in USDC via x402 on Base.

73 endpoints total (calculators + 10 composite workflows). Free
1,000 calls/IP/day, no signup, no API key.

Cookbook (runs in Colab, ~30 sec): <link>
PyPI:    pip install langchain-quantoracle
GitHub:  https://github.com/QuantOracledev/quantoracle

Feedback welcome — especially on which composite workflows you want next.
```

## Version B — image-first (recommended if you can attach the screenshot)

```
[attach: notebook_screenshot.png]

Gave my LangChain agent a deterministic quant API. Asked it how to
hedge a $100k NVDA position; it priced 4 hedge structures via
Black-Scholes in one tool call and recommended a collar at $613
(0.61%) — half the cost of a protective put.

Same input → same output, every run. No hallucinated strikes, no
drifting Greeks. Settled on-chain via x402 ($0.04 in USDC on Base)
so the result is auditable.

73 endpoints (calculators + 10 composite workflows). Free tier
1,000 calls/IP/day, no signup.

Cookbook (Colab): <link>
GitHub: https://github.com/QuantOracledev/quantoracle
```

## Posting checklist

1. [ ] Confirm `notebook_screenshot.png` and `quantoracle_risk_analyst.ipynb` are both on `main` (so the Colab badge resolves and the screenshot embeds correctly when shared).
2. [ ] Replace `<link>` with the actual Colab URL: `https://colab.research.google.com/github/QuantOracledev/quantoracle/blob/main/integrations/langchain/cookbook/quantoracle_risk_analyst.ipynb`
3. [ ] Drag-drop `notebook_screenshot.png` into the Discord composer (Version B only).
4. [ ] Post in `#show-and-tell` — NOT `#general` (different audience).
5. [ ] Cross-post to r/LangChain (subreddit, ~10 sec).

## Where else to drop the same content

- **LangChain Discord** `#show-and-tell` (primary)
- **r/LangChain** on reddit
- **LangChain GitHub Discussions** → "Show and tell" category
- **`kyrolabs/awesome-langchain`** — already submitted via PR #323
- **Hacker News "Show HN"** with the notebook as the linked artifact (HN rewards concrete demos over marketing pages)
