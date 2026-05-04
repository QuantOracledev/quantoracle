import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Options Profit Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Options Profit Calculator',
    kicker: 'Options',
    subtitle:
      'Build single- and multi-leg option strategies. See profit, loss, and break-even points at expiration with a payoff diagram.',
  });
}
