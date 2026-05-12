import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Hurst vs Autocorrelation vs Variance Ratio';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Hurst vs Autocorrelation vs Variance Ratio',
    kicker: 'Compare',
    subtitle:
      'Three tests for detecting trend or mean-reversion. One number, lag-by-lag, formal hypothesis test. When to use each and what to do when they disagree.',
  });
}
