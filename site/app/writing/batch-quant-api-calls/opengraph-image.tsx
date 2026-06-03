import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Batch API Calls for Speed';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Batch API Calls for Speed',
    kicker: 'Tutorial',
    subtitle:
      'Bundle up to 100 quant computations into one HTTP round-trip. A real run: 20 Black-Scholes calls, 7,182 ms → 1,426 ms — 5× faster for the same 0.1 USDC.',
  });
}
