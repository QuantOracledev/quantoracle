import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Kelly vs Fixed Fractional vs Optimal-f';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Kelly vs Fixed Fractional vs Optimal-f',
    kicker: 'Compare',
    subtitle:
      'Three position sizing methods with wildly different aggressiveness. Which one to use, why most people should use fixed-fractional, and the half-Kelly trick.',
  });
}
