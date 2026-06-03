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

/**
 * Schema.org BreadcrumbList JSON-LD. Mirrors the visible breadcrumb nav so
 * Google can render breadcrumb trails in the SERP (instead of a bare URL) and
 * better understands site hierarchy. Pass the ordered trail from root to the
 * current page.
 */
export function breadcrumbJsonLd(items: { name: string; url: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
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
    publisher: {
      '@type': 'Organization',
      name: 'QuantOracle',
      url: SITE_URL,
    },
  };
}

/**
 * Schema.org HowTo JSON-LD for calculator pages. Generic 3-step walkthrough
 * that applies to every calculator on the site. Google uses this for HowTo
 * rich results (a separate ranking surface from FAQPage results) — visual
 * step-by-step cards that appear in search.
 */
export function howToJsonLd(opts: { name: string; url: string }): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to use the ${opts.name}`,
    description: `Step-by-step guide to using the ${opts.name} on quantoracle.dev.`,
    totalTime: 'PT1M',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Enter your inputs',
        text: 'Fill in the input fields on the left. Each field has a hint explaining what value to use; the defaults are pre-loaded with a realistic sample so you can see the calculator working immediately.',
        url: `${opts.url}#inputs`,
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Click Calculate',
        text: 'Press the Calculate button to compute the result server-side via the QuantOracle API. Computation typically completes in under a second.',
        url: `${opts.url}#results`,
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Review the result and interpretation',
        text: 'The calculator returns the numerical result plus an interpretation paragraph explaining what the number means in plain English. Scroll down for the longform explainer covering the underlying math, edge cases, and related calculators.',
        url: `${opts.url}#interpretation`,
      },
    ],
  };
}

/**
 * Schema.org Organization JSON-LD for the QuantOracle site itself.
 * Helps Google understand the entity behind the content (E-E-A-T signal).
 * Include this on the homepage and major editorial pages.
 */
export function organizationJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'QuantOracle',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    description:
      'Free quant finance calculators and a deterministic API for AI agents. 15 calculators, 73 endpoints, 120 verified accuracy benchmarks. MIT licensed, open source.',
    sameAs: [
      'https://github.com/QuantOracledev/quantoracle',
      'https://dev.to/quantoracle',
    ],
  };
}
