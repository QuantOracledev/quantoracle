import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Sharpe vs Sortino vs Calmar';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Sharpe vs Sortino vs Calmar',
    kicker: 'Compare',
    subtitle:
      'Three risk-adjusted return metrics, three different things they measure. Which one to use, when each lies, and what good values look like.',
  });
}
