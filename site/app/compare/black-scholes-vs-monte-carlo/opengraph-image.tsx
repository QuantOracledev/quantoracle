import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Black-Scholes vs Monte Carlo';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Black-Scholes vs Monte Carlo',
    kicker: 'Compare',
    subtitle:
      'Two option pricing methods, two different jobs. Closed-form speed vs simulation generality. When each is right.',
  });
}
