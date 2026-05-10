import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Hurst Exponent Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Hurst Exponent Calculator',
    kicker: 'Stats',
    subtitle:
      'Trending or mean-reverting? Classify any time series with R/S analysis and pick the strategy that fits the regime.',
  });
}
