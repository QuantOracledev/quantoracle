/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // The "vs Monte Carlo" article was renamed to "vs Binomial" after we
      // realized our existing Monte Carlo calculator does portfolio simulation,
      // not option pricing, which made the article's MC framing inconsistent
      // with the linked tool. 301 so search engines and IndexNow consumers
      // that already saw the old URL transfer to the new canonical.
      {
        source: '/compare/black-scholes-vs-binomial-vs-monte-carlo',
        destination: '/compare/black-scholes-vs-binomial',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
