import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block parameterized URLs on the options-profit calculator. The page
        // uses GET form submission + AddLeg links, and crawlers were following
        // the AddLeg links into a combinatorial trap (each variant spawns more
        // variants), generating ~374 server-side API calls/day. Bare-URL and
        // form-submit paths still work for users. See OPERATIONS.md 2026-05-18.
        disallow: '/options-profit-calculator?',
      },
    ],
    sitemap: 'https://quantoracle.dev/sitemap.xml',
    host: 'https://quantoracle.dev',
  };
}
