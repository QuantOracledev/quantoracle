import type { Metadata } from 'next';

const SITE_URL = 'https://quantoracle.dev';
const DEFAULT_OG = `${SITE_URL}/og-default.png`;

export interface PageSeo {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  /** Page-specific keywords. Used for the meta tag (limited SEO weight today
   *  but harmless and helpful for some content-extraction crawlers). */
  keywords?: string[];
}

export function buildMetadata(seo: PageSeo): Metadata {
  const url = `${SITE_URL}${seo.path}`;
  const og = seo.ogImage ?? DEFAULT_OG;
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: url },
    metadataBase: new URL(SITE_URL),
    openGraph: {
      title: seo.title,
      description: seo.description,
      url,
      siteName: 'QuantOracle',
      images: [{ url: og, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [og],
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Schema.org FAQPage JSON-LD object — Google uses this for FAQ rich snippets.
 * Returns the OBJECT (not stringified) so multiple JSON-LD blobs on the same
 * page can be combined into a single valid JSON array. CalculatorShell does
 * the JSON.stringify of the array.
 */
export function faqJsonLd(faqs: { question: string; answer: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/** Schema.org SoftwareApplication JSON-LD for calculator pages. */
export function calculatorJsonLd(opts: {
  name: string;
  description: string;
  url: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}
