import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Chaining x402 Paid Tool Calls';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Chaining x402 Paid Tool Calls',
    kicker: 'Tutorial',
    subtitle:
      'A working multi-step agent demo: risk audit → hedge recommendation. ~$0.08 USDC settled on Base per run. The system-prompt pattern that makes chaining reliable.',
  });
}
