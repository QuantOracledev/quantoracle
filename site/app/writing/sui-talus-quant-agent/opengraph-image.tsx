import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Add Reliable Quant Math to Your Sui / Talus Agent';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Quant Math for Sui / Talus Agents',
    kicker: 'Tutorial',
    subtitle:
      'Wire deterministic quant tools — Black-Scholes, liquidation price, impermanent loss, risk analysis — into a Sui AI agent. Zero-code MCP or a portable tool-pack. Free tier, no API key.',
  });
}
