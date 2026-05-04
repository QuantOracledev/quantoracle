import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Sharpe Ratio Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Sharpe Ratio Calculator',
    kicker: 'Stats',
    subtitle:
      'Compute the Sharpe ratio with a 95% confidence interval most calculators omit. Configurable risk-free rate and annualization.',
  });
}
