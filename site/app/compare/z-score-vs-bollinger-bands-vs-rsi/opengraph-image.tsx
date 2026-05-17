import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Z-Score vs Bollinger Bands vs RSI';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Z-Score vs Bollinger Bands vs RSI',
    kicker: 'Compare',
    subtitle:
      'Three mean-reversion indicators that all measure "how far from the mean" — and produce different signals. When each lies and which is right for pairs trading.',
  });
}
