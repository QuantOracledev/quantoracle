import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'AgentKit vs GOAT vs Vercel AI SDK vs LangChain vs elizaOS';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Agent Framework Comparison 2026',
    kicker: 'Tutorial',
    subtitle:
      'AgentKit vs GOAT vs Vercel AI SDK vs LangChain vs elizaOS. Same quant agent in each, with the decision table and migration paths.',
  });
}
