import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'CAGR Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'CAGR Calculator',
    kicker: 'Stats',
    subtitle:
      'Compound annual growth rate from any start/end values. Doubling time, total return, and forward projections at 1, 3, 5, 10, 20 years.',
  });
}
