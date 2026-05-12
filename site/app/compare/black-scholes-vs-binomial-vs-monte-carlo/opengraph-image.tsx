import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Black-Scholes vs Binomial vs Monte Carlo';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Black-Scholes vs Binomial vs Monte Carlo',
    kicker: 'Compare',
    subtitle:
      'Three option pricing methods, three different jobs. When each one is right, when each breaks, and the decision rule traders actually use.',
  });
}
