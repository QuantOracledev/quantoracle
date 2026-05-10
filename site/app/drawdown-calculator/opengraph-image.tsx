import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Drawdown Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Drawdown Calculator',
    kicker: 'Risk',
    subtitle:
      'Max drawdown, average drawdown, recovery time, and Calmar ratio from any equity curve. The number that matters more than volatility.',
  });
}
