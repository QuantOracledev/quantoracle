import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Value at Risk (VaR) Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Value at Risk Calculator',
    kicker: 'Risk',
    subtitle:
      'Parametric VaR plus CVaR (Expected Shortfall) at any confidence level, with skewness and kurtosis to flag fat-tail risk.',
  });
}
