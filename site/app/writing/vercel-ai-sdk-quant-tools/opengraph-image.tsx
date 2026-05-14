import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Vercel AI SDK Quant Finance Tools';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Vercel AI SDK Quant Tools',
    kicker: 'Tutorial',
    subtitle:
      'Wire 15 deterministic quant finance tools — Black-Scholes, Kelly, Monte Carlo, VaR, IL, liquidation price — into a Vercel AI SDK agent. Free tier + optional x402 paid composites.',
  });
}
