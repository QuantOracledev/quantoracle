import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Sharpe vs Information Ratio vs Treynor';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Sharpe vs Information Ratio vs Treynor',
    kicker: 'Compare',
    subtitle:
      'Three risk-adjusted return metrics, three different questions. Total vol vs tracking error vs beta — which is right for what.',
  });
}
