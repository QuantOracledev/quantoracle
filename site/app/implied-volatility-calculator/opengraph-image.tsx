import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Implied Volatility Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Implied Volatility Calculator',
    kicker: 'Options',
    subtitle:
      'Solve for the IV that makes Black-Scholes match a market option price. Newton-Raphson under the hood, 6-decimal precision.',
  });
}
