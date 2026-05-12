import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'VaR vs CVaR vs Max Drawdown';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'VaR vs CVaR vs Max Drawdown',
    kicker: 'Compare',
    subtitle:
      'Three downside risk metrics with very different blind spots. Where VaR lies, why CVaR fixes it, and why allocators care about drawdown most.',
  });
}
