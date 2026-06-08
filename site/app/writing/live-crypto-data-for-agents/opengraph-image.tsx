import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Live Crypto Volatility & Funding for Your Agent';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Live Crypto Data for Agents',
    kicker: 'Tutorial',
    subtitle:
      'Fresh realized volatility + perp funding rates in one call. We fetch the market data and run the math — no exchange integrations to manage. 100 free/day, then x402.',
  });
}
