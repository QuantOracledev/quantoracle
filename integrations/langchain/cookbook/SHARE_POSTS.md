# Share posts for the LangChain cookbook

The recommended share image is `notebook_screenshot.png` (in this same directory) — it shows the agent calling the `hedging_recommend` paid composite for a $100k NVDA position and getting back a ranked table of 4 hedge structures with concrete strikes, costs, and a recommendation.

## Primary venue: [forum.langchain.com](https://forum.langchain.com) → `#talking-shop`

LangChain migrated their community from Discord + GitHub Discussions to a Discourse forum. The `/talking-shop` category is the show-and-tell equivalent.

**Forum post draft (Title + Body):**

> **Title:** Built a LangChain agent with deterministic quant finance math — hedging analysis in 25 lines

```
Asked a LangChain agent: "I'm long $100k of NVDA at $185, 30-day vol is
28%, how should I hedge for the next month?"

Single tool call → priced 4 hedge structures via Black-Scholes (collar,
protective put, inverse, partial put), ranked them, recommended the
collar at $613 (0.61% of position) — half the cost of a protective put
alone, with concrete strikes ($175.75 put / $203.50 call).

[attach: notebook_screenshot.png]

Same input → same output, every run. No hallucinated strikes, no drifting
Greeks. Settled on-chain via x402 ($0.04 in USDC on Base) so the result
is auditable.

73 endpoints total (calculators + 10 composite workflows). Free tier
1,000 calls/IP/day, no signup, no API key.

Cookbook (Colab, ~30 sec):
https://colab.research.google.com/github/QuantOracledev/quantoracle/blob/main/integrations/langchain/cookbook/quantoracle_risk_analyst.ipynb

PyPI:   pip install langchain-quantoracle
GitHub: https://github.com/QuantOracledev/quantoracle

Feedback welcome — especially on which composite workflows you want next.
```

## Secondary venue: r/LangChain on reddit

Same body, drop the explicit `[attach]` line — Reddit lets you upload images directly when posting.

## Tertiary venue: Hacker News "Show HN"

> **Title:** Show HN: Give your LangChain agent a deterministic quant finance API

Use the Colab link as the submission URL (HN rewards concrete artifacts over marketing pages). First comment from you should explain in 2-3 sentences what it does and why.

## Posting checklist

1. [ ] Confirm `notebook_screenshot.png` and `quantoracle_risk_analyst.ipynb` are both on `main` (so the Colab badge resolves and the screenshot embeds correctly).
2. [ ] Sign in / sign up at [forum.langchain.com](https://forum.langchain.com) (free).
3. [ ] Click "+ New Topic" → category: `talking-shop` → paste title + body → drag-drop `notebook_screenshot.png`.
4. [ ] Post.
5. [ ] Cross-post to r/LangChain (~30 sec).
6. [ ] Optional: Show HN with the Colab link as URL.

## What changed since the last draft

- Removed the LangChain Discord version — the `discord.gg/langchain` invite is dead, no official Discord exists.
- Removed the GitHub Discussions option — langchain-ai/langchain Discussions migrated to forum.langchain.com.
- Removed the langchain-ai/langchain cookbook PR option — that directory no longer exists in the repo.
