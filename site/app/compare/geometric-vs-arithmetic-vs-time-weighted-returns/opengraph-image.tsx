import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Geometric vs Arithmetic vs Time-Weighted Returns';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Geometric vs Arithmetic vs TWR',
    kicker: 'Compare',
    subtitle:
      'Three ways to compute mean return, three different answers. Volatility drag is real money. Sharpe uses arithmetic, CAGR uses geometric, and the gap between them matters.',
  });
}
