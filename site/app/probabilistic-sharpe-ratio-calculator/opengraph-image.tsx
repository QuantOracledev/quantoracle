import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Probabilistic Sharpe Ratio Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Probabilistic Sharpe Ratio',
    kicker: 'Stats',
    subtitle:
      'The Sharpe ratio adjusted for sample size, skewness, and kurtosis. Probability your edge is real — not noise.',
  });
}
