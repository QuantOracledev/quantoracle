import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Reliable Quant Finance Math for Your LangChain Agent';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Quant Finance Math for LangChain Agents',
    kicker: 'Tutorial',
    subtitle:
      'LLMs hallucinate Black-Scholes. Wire 73 deterministic quant tools into a LangChain agent with one import — options, risk, Monte Carlo, backtests. 1,000 free calls/day.',
  });
}
