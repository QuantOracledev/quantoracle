import type { FaqItem } from '@/components/FAQ';

export const faqs: (FaqItem & { plainAnswer: string })[] = [
  {
    question: 'What is the liquidation price?',
    plainAnswer:
      'The liquidation price is the underlying price at which a leveraged position is force-closed by the exchange because your remaining collateral has fallen below the maintenance margin requirement. For longs, it is below your entry; for shorts, above. Hitting it means you lose your collateral.',
    answer:
      'The liquidation price is the underlying price at which a leveraged position is force-closed by the exchange because your remaining collateral has fallen below the maintenance margin requirement. For longs, it is below your entry; for shorts, above. Hitting it means you lose most or all of your collateral plus any accumulated funding payments — the exchange takes the rest as a liquidation penalty.',
  },
  {
    question: 'How is liquidation price calculated?',
    plainAnswer:
      'For an isolated-margin long: liquidation price = entry × (1 - 1/leverage + maintenance_margin_rate). For a short: liquidation price = entry × (1 + 1/leverage - maintenance_margin_rate). Higher leverage means liquidation is closer to entry. Maintenance margin (typically 0.5% on majors) shifts liquidation slightly closer than the naive 1/leverage formula suggests.',
    answer: (
      <>
        For an isolated-margin long:{' '}
        <code>liq = entry × (1 − 1/leverage + maintenance_margin_rate)</code>. For a short:{' '}
        <code>liq = entry × (1 + 1/leverage − maintenance_margin_rate)</code>. Higher leverage means
        liquidation is closer to entry. Maintenance margin (typically 0.5% on majors) shifts
        liquidation slightly closer than the naive 1/leverage formula suggests. Cross-margin
        accounts use a different formula because all your collateral is shared across positions.
      </>
    ),
  },
  {
    question: 'What does maintenance margin mean?',
    plainAnswer:
      'Maintenance margin is the minimum collateral fraction the exchange requires to keep a position open. If your equity falls below this, the position is liquidated. Most exchanges use tiered maintenance margins: 0.5% for small positions on majors, scaling up to 5%+ for very large positions or thinly traded altcoins.',
    answer:
      'Maintenance margin is the minimum collateral fraction the exchange requires to keep a position open. If your equity falls below this, the position is liquidated. Most exchanges use tiered maintenance margins: 0.5% for small positions on majors, scaling up to 5%+ for very large positions or thinly traded altcoins. Check your exchange\'s tier table for the exact number.',
  },
  {
    question: 'Should I use isolated or cross margin?',
    plainAnswer:
      'Isolated margin caps your loss at the collateral assigned to a single position — the rest of your account is safe. Cross margin uses your entire account as collateral for every position, which gives more buffer against single-position liquidation but exposes the whole account if many positions move against you simultaneously. Isolated is safer; cross is more capital-efficient.',
    answer:
      'Isolated margin caps your loss at the collateral assigned to a single position — the rest of your account is safe. Cross margin uses your entire account as collateral for every position, which gives more buffer against single-position liquidation but exposes the whole account if many positions move against you simultaneously. Isolated is safer for beginners and for trades you don\'t want correlating with the rest of your book; cross is more capital-efficient when you understand the cross-position risk.',
  },
  {
    question: 'Why is my actual liquidation different from this calculator?',
    plainAnswer:
      'A few reasons: (1) accumulated funding payments shift your effective collateral, (2) the maintenance margin tier may have changed if your position size pushed you across a tier boundary, (3) cross-margin accounts use the full account equity in the calculation, (4) some exchanges include trading fees in the liquidation calculation. This calculator handles isolated-margin positions with constant maintenance margin and an optional accumulated-funding adjustment.',
    answer:
      'A few reasons: (1) accumulated funding payments shift your effective collateral, (2) the maintenance margin tier may have changed if your position size pushed you across a tier boundary, (3) cross-margin accounts use the full account equity in the calculation, (4) some exchanges include trading fees in the liquidation calculation. This calculator handles isolated-margin positions with constant maintenance margin and an optional accumulated-funding adjustment.',
  },
  {
    question: 'How much price movement can I take before liquidation?',
    plainAnswer:
      'At leverage L with maintenance margin M, an isolated long is liquidated when the price drops by approximately (1/L - M). At 10x leverage with 0.5% maintenance margin, that is a 9.5% drop. At 20x, 4.5%. At 50x, 1.5%. At 100x, 0.5%. The "distance to liquidation" stat in the results shows this percentage directly.',
    answer:
      'At leverage L with maintenance margin M, an isolated long is liquidated when the price drops by approximately (1/L − M). At 10x leverage with 0.5% maintenance margin, that is a 9.5% drop. At 20x, 4.5%. At 50x, 1.5%. At 100x, 0.5%. The "distance to liquidation" stat in the results shows this percentage directly.',
  },
  {
    question: 'Is this calculator for spot trading or futures?',
    plainAnswer:
      'Futures, perpetual swaps, and margin-traded crypto. Spot positions cannot be liquidated because you own the underlying outright — there is no leverage involved. This calculator assumes a leveraged position where your loss can exceed your collateral, which is the case for perpetuals, dated futures, and margin-funded spot.',
    answer:
      'Futures, perpetual swaps, and margin-traded crypto. Spot positions cannot be liquidated because you own the underlying outright — there is no leverage involved. This calculator assumes a leveraged position where your loss can exceed your collateral, which is the case for perpetuals, dated futures, and margin-funded spot.',
  },
  {
    question: 'What about DeFi liquidations (Aave, Compound)?',
    plainAnswer:
      'DeFi lending protocols use a different liquidation model: a health factor that compares your collateral value (with safety haircuts) to your borrowed value. The math is similar — your position is liquidated when collateral value falls too far — but the formula uses LTV (loan-to-value) ratios rather than leverage. This calculator is built for centralized-exchange leveraged positions.',
    answer:
      'DeFi lending protocols (Aave, Compound, Spark) use a different liquidation model: a health factor that compares your collateral value (with safety haircuts) to your borrowed value. The math is similar — your position is liquidated when collateral value falls too far — but the formula uses LTV (loan-to-value) ratios rather than leverage. This calculator is built for centralized-exchange leveraged positions.',
  },
  {
    question: 'How do I avoid liquidation?',
    plainAnswer:
      'Use less leverage. The number-one cause of liquidation is using more leverage than your conviction or your stop-loss discipline can support. Setting a stop-loss above (longs) or below (shorts) your liquidation price means you exit on your own terms with collateral intact. Many experienced traders cap leverage at 2-5x for swing trades; 10-20x is reserved for short-duration scalps with tight stops.',
    answer:
      'Use less leverage. The number-one cause of liquidation is using more leverage than your conviction or your stop-loss discipline can support. Setting a stop-loss above (longs) or below (shorts) your liquidation price means you exit on your own terms with collateral intact, before the exchange takes the liquidation penalty. Many experienced traders cap leverage at 2-5x for swing trades; 10-20x is reserved for short-duration scalps with tight stops.',
  },
  {
    question: 'Is this calculator free?',
    plainAnswer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
    answer:
      'Yes. Free for unlimited human use; backed by the QuantOracle API which provides 1,000 free calls per IP per day with no signup or API key.',
  },
];
