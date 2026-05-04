import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is impermanent loss?',
    plainAnswer:
      'Impermanent loss is the difference between holding two tokens in a liquidity pool versus simply holding them in your wallet. When token prices change, the pool automatically rebalances to maintain a constant ratio, which means it sells the token going up and buys the one going down. Compared to simply holding, you end up with less value when prices move significantly.',
    answer:
      'Impermanent loss is the difference between holding two tokens in a liquidity pool versus simply holding them in your wallet. When token prices change, the pool automatically rebalances to maintain a constant ratio (constant-product for v2 AMMs), which means it sells the token going up and buys the one going down. Compared to simply holding, you end up with less value when prices move significantly. It is "impermanent" because if prices return to their starting ratio, the loss disappears — but it is real and permanent if you withdraw at any other ratio.',
  },
  {
    question: 'When is it worth providing liquidity despite IL?',
    plainAnswer:
      'When the trading fees you collect plus any liquidity-mining rewards exceed the impermanent loss over your holding period. The "fee breakeven APY" stat in the results tells you exactly what fee yield the pool needs to generate to compensate for the IL you experienced. If actual fees + rewards exceed that number, LPing was profitable.',
    answer:
      'When the trading fees you collect plus any liquidity-mining rewards exceed the impermanent loss over your holding period. The "fee breakeven APY" stat in the results tells you exactly what fee yield the pool needs to generate to compensate for the IL you experienced. If actual fees + rewards exceed that number, LPing was profitable. Stable pairs (USDC/USDT) have very low IL but also low fee yields. Volatile pairs (ETH/BTC, SOL/USDC) have higher IL but compensating higher fees.',
  },
  {
    question: 'What is the IL formula?',
    plainAnswer:
      'For a constant-product (Uniswap v2) pool: IL = 2*sqrt(p) / (1+p) - 1, where p is the current price ratio relative to the entry ratio. At p=1 (no price change), IL=0. At p=2 (2x move), IL=-5.7%. At p=4, IL=-20%. At p=10, IL=-43%. The formula is symmetric: the same IL applies whether the ratio doubles or halves.',
    answer: (
      <>
        For a constant-product (Uniswap v2) pool:{' '}
        <code>IL = 2·√p / (1+p) − 1</code>, where <code>p</code> is the current price ratio
        relative to the entry ratio. At p=1 (no price change), IL=0. At p=2 (2× move), IL=-5.7%. At
        p=4, IL=-20%. At p=10, IL=-43%. The formula is symmetric: the same IL applies whether the
        ratio doubles or halves.
      </>
    ),
  },
  {
    question: 'What is the difference between v2 and v3 IL?',
    plainAnswer:
      'Uniswap v3 (concentrated liquidity) lets you specify a price range. Within the range, your capital efficiency is much higher and so are the fees you collect — but IL is also magnified because effectively you are operating at high leverage. If the price exits your range entirely, you become 100% one token (the cheaper one), which is the maximum loss for that range. v3 LPing is more like active position management than passive yield.',
    answer:
      'Uniswap v3 (concentrated liquidity) lets you specify a price range. Within the range, your capital efficiency is much higher and so are the fees you collect — but IL is also magnified because effectively you are operating at high leverage. If the price exits your range entirely, you become 100% one token (the cheaper one), which is the maximum loss for that range. v3 LPing is more like active position management than passive yield: you need to monitor the position and rebalance the range as prices move.',
  },
  {
    question: 'What does "fee breakeven APY" mean?',
    plainAnswer:
      'It is the trading-fee APY at which your LP position breaks even with simply holding the two tokens. If the pool you are providing liquidity to is generating fees at or above this rate, you are net-profitable as an LP at the current price ratio. Below this rate, you would have been better off just holding.',
    answer:
      'It is the trading-fee APY at which your LP position breaks even with simply holding the two tokens. If the pool you are providing liquidity to is generating fees at or above this rate, you are net-profitable as an LP at the current price ratio. Below this rate, you would have been better off just holding. Note this is a snapshot — fees accumulated over your holding period need to be compared to the IL at that moment, not the cumulative fee APY.',
  },
  {
    question: 'Is impermanent loss really impermanent?',
    plainAnswer:
      'Only if prices return to their entry ratio. If you withdraw before that — or if prices never return — the loss is real and permanent. The "impermanent" label comes from the math: at the entry ratio, IL is exactly zero. But in practice, traders and LPs do not get the choice of when to withdraw based on price ratios.',
    answer:
      'Only if prices return to their entry ratio. If you withdraw before that — or if prices never return — the loss is real and permanent. The "impermanent" label comes from the math: at the entry ratio, IL is exactly zero. But in practice, traders and LPs do not get the choice of when to withdraw based on price ratios — they exit when they need the capital, which is rarely the moment prices are at the entry ratio.',
  },
  {
    question: 'Does this calculator handle stablecoin pairs?',
    plainAnswer:
      'Yes — and IL on stablecoin pairs (USDC/USDT, USDC/DAI) is essentially zero in normal conditions because the price ratio stays near 1. The exception is depeg events: when one stable temporarily drops to 0.95 or 1.05, IL of 0.03-0.06% is realized. For LPs, this is usually compensated by the fees collected during the depeg trading frenzy.',
    answer:
      'Yes — and IL on stablecoin pairs (USDC/USDT, USDC/DAI) is essentially zero in normal conditions because the price ratio stays near 1. The exception is depeg events: when one stable temporarily drops to 0.95 or 1.05, IL of 0.03-0.06% is realized. For LPs, this is usually compensated by the fees collected during the depeg trading frenzy.',
  },
  {
    question: 'What about LP yields like Curve and Balancer?',
    plainAnswer:
      'Curve uses a stableswap formula optimized for assets that should track 1:1 (stables, ETH/stETH). Its IL formula is similar but smaller in magnitude for in-peg conditions. Balancer allows custom weight pairs (80/20, 60/40, etc), which changes the IL profile asymmetrically. This calculator uses constant-product math (Uniswap v2 / SushiSwap), which is the most common AMM model.',
    answer:
      'Curve uses a stableswap formula optimized for assets that should track 1:1 (stables, ETH/stETH). Its IL formula is similar but smaller in magnitude for in-peg conditions. Balancer allows custom weight pairs (80/20, 60/40, etc), which changes the IL profile asymmetrically. This calculator uses constant-product math (Uniswap v2 / SushiSwap), which is the most common AMM model.',
  },
  {
    question: 'Should I LP at all?',
    plainAnswer:
      'It depends on your view of the underlying assets and the fee yield. As a rule: LP a pair if you are willing to be 50/50 in those two tokens regardless of which one outperforms; do not LP a pair where you have a directional view (in that case, just hold the asset you think will outperform). LPing is essentially a short-volatility position — you collect fees in exchange for taking on the risk of price divergence.',
    answer:
      'It depends on your view of the underlying assets and the fee yield. As a rule: LP a pair if you are willing to be 50/50 in those two tokens regardless of which one outperforms; do not LP a pair where you have a directional view (in that case, just hold the asset you think will outperform). LPing is essentially a short-volatility position — you collect fees in exchange for taking on the risk of price divergence.',
  },
  {
    question: 'Is this calculator free?',
    plainAnswer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
    answer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
  },
];
