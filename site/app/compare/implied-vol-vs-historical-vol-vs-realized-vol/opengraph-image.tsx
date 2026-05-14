import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Implied vs Historical vs Realized Volatility';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Implied vs Historical vs Realized Vol',
    kicker: 'Compare',
    subtitle:
      'Three volatility metrics with the same name and three different jobs. Pricing options, computing Sharpe, forecasting tomorrow — each demands a different one.',
  });
}
