import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Monte Carlo Simulation Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Monte Carlo Simulation',
    kicker: 'Risk',
    subtitle:
      'Run thousands of random price paths to see the full distribution of portfolio outcomes — median, P5/P95, probability of loss and ruin.',
  });
}
