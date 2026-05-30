import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Anatomy of a Paying Quant Agent — x402 Case Study';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: '$0.285 USDC. 8 Tools. 75 Minutes.',
    kicker: 'Case study',
    subtitle:
      'A real agent ran 8 chained x402 paid tool calls through QuantOracle on Base mainnet. The exact sequence, the on-chain proof, and how to build one.',
  });
}
