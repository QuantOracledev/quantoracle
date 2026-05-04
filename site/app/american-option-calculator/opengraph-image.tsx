import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'American Option Pricing Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'American Option Calculator',
    kicker: 'Options',
    subtitle:
      'Price American-style calls and puts with early exercise and dividend yield via a Cox-Ross-Rubinstein binomial tree.',
  });
}
