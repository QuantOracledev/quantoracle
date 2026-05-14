import { makeOgImage, SIZE, CONTENT_TYPE } from '@/lib/og-template';

export const alt = 'American vs European vs Bermudan Options';
export const size = SIZE;
export const contentType = CONTENT_TYPE;

export default function Og() {
  return makeOgImage({
    title: 'American vs European vs Bermudan',
    kicker: 'Compare',
    subtitle:
      'Three option exercise styles, three different prices. When early exercise actually matters, Merton\'s 1973 theorem, and the right pricing method for each.',
  });
}
