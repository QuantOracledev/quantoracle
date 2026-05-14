import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'AgentKit Quant Finance Math Tutorial';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'AgentKit + QuantOracle in 10 Minutes',
    kicker: 'Tutorial',
    subtitle:
      '5 deterministic quant tools your agent can use — Black-Scholes, Kelly, Monte Carlo, plus 2 paid composites via x402. Free tier + Solana variant included.',
  });
}
