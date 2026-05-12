import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Black-Scholes vs Binomial Tree';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Black-Scholes vs Binomial Tree',
    kicker: 'Compare',
    subtitle:
      'Two option pricing methods, two different jobs. When the closed-form formula is right, when binomial wins on early exercise, and how many steps you actually need.',
  });
}
