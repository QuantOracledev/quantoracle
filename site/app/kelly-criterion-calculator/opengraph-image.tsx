import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'Kelly Criterion Calculator';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'Kelly Criterion Calculator',
    kicker: 'Risk',
    subtitle:
      'Find the optimal fraction of your bankroll to risk per bet. Includes the safer half- and quarter-Kelly variants most pros actually use.',
  });
}
