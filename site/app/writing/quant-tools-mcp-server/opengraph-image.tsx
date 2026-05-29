import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Quant Tools for MCP Agents Tutorial';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: '73 Quant Tools for Your MCP Agent',
    kicker: 'Tutorial',
    subtitle:
      'Wire 63 deterministic calculators + 10 paid composites into Claude Desktop, Cursor, or any MCP-capable agent in one config line. Free tier; x402 on Base + Solana.',
  });
}
