import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = '24/7 Crypto Liquidation Alerts for Your Agent — QuantOracle Watch';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Liquidation Alerts for Agents',
    kicker: 'QuantOracle Watch',
    subtitle:
      'Register a perp position once — we check it every 60s and webhook you on liq distance, funding flips, and vol regime. Free 48h trial, then $5 per position per 30 days via x402.',
  });
}
