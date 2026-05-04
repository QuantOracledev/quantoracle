import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Impermanent Loss Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Impermanent Loss Calculator',
    kicker: 'Crypto',
    subtitle:
      'Quantify the cost of providing liquidity vs holding the two tokens. Returns IL %, dollar loss, and fee breakeven APY.',
  });
}
