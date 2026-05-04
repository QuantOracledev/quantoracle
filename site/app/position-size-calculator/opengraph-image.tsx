import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Position Size Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Position Size Calculator',
    kicker: 'Risk',
    subtitle:
      'Get the exact number of shares to buy so a single bad trade can only lose your chosen risk-per-trade fraction. Longs and shorts.',
  });
}
