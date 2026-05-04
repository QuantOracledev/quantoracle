import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Black-Scholes Option Pricing Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Black-Scholes Calculator',
    kicker: 'Options',
    subtitle:
      'Price European calls and puts with full Greeks: delta, gamma, vega, theta, rho. Sub-70 ms per calculation, no signup.',
  });
}
