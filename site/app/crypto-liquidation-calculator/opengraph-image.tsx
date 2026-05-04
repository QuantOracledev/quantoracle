import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Crypto Liquidation Price Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Crypto Liquidation Calculator',
    kicker: 'Crypto',
    subtitle:
      'Calculate the exact price at which a leveraged crypto position gets force-closed. Longs and shorts, any leverage.',
  });
}
