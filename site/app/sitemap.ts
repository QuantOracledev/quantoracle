import type { MetadataRoute } from 'next';
import { CALCULATORS } from '@/lib/calculators';

const BASE = 'https://quantoracle.dev';

/** Add comparison/explainer articles here as they're published. */
const COMPARE_ARTICLES = [
  'sharpe-vs-sortino-vs-calmar',
  'kelly-vs-fixed-fractional-vs-optimal-f',
  'var-vs-cvar-vs-max-drawdown',
  'black-scholes-vs-binomial',
  'hurst-vs-autocorrelation-vs-variance-ratio',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/api-docs`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    ...CALCULATORS.filter((c) => c.status === 'live').map((c) => ({
      url: `${BASE}/${c.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    { url: `${BASE}/compare`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    ...COMPARE_ARTICLES.map((slug) => ({
      url: `${BASE}/compare/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
