import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
// GA4 measurement ID. This is a public value — it lands in every page's
// HTML — so the hardcoded fallback has no security implication. Override
// via the env var for preview/staging environments if needed.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-FPTTKC4T1N';

export const metadata: Metadata = {
  metadataBase: new URL('https://quantoracle.dev'),
  title: {
    default: 'QuantOracle — Free Quant Finance Calculators & API',
    template: '%s — QuantOracle',
  },
  description:
    'Free, fast quant finance calculators powered by a deterministic, multi-chain API. Black-Scholes, options profit, Kelly, VaR, crypto liquidation, and more.',
  applicationName: 'QuantOracle',
  authors: [{ name: 'QuantOracle' }],
  // Search engine verification meta tags. Set the matching env var in Vercel
  // and the corresponding <meta> appears automatically in the <head>.
  // Easiest path for Google Search Console verification — no redeploy needed
  // if you set the env var through the Vercel dashboard.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    other: process.env.BING_VERIFICATION
      ? { 'msvalidate.01': process.env.BING_VERIFICATION }
      : undefined,
  },
  keywords: [
    'quant finance',
    'options calculator',
    'black scholes',
    'kelly criterion',
    'value at risk',
    'crypto liquidation',
    'impermanent loss',
    'finance API',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {ADSENSE_CLIENT && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-ink-800 bg-ink-950/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-accent font-bold tracking-tight text-lg">QuantOracle</span>
              <span className="hidden sm:inline text-xs text-slate-500 font-mono">/calc</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/#calculators" className="px-3 py-1.5 rounded text-slate-300 hover:bg-ink-800">
                Calculators
              </Link>
              <Link href="/api-docs" className="px-3 py-1.5 rounded text-slate-300 hover:bg-ink-800">
                API
              </Link>
              <a
                href="https://github.com/QuantOracledev/quantoracle"
                rel="noopener"
                className="px-3 py-1.5 rounded text-slate-300 hover:bg-ink-800"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-ink-800 mt-16">
          {/* Main footer nav — 4 columns desktop, 2 tablet, 1 mobile. */}
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 text-sm text-slate-400 grid gap-8 grid-cols-2 lg:grid-cols-4">
            {/* Brand + tagline */}
            <div className="col-span-2 lg:col-span-1">
              <div className="font-semibold text-slate-200 mb-2">QuantOracle</div>
              <p className="text-sm leading-relaxed">
                73 deterministic quant endpoints + 15 free calculators. Free tier: 1,000 calls/IP/day, no API key.
              </p>
              <div className="mt-3 flex gap-2 text-xs">
                <a href="https://github.com/QuantOracledev/quantoracle" rel="noopener" className="px-2 py-0.5 rounded bg-ink-800/60 hover:bg-ink-800 text-slate-300">
                  ★ GitHub
                </a>
                <a href="https://dev.to/quantoracle" rel="noopener" className="px-2 py-0.5 rounded bg-ink-800/60 hover:bg-ink-800 text-slate-300">
                  dev.to
                </a>
                <Link href="/rss.xml" className="px-2 py-0.5 rounded bg-ink-800/60 hover:bg-ink-800 text-slate-300">
                  RSS
                </Link>
              </div>
            </div>

            {/* Site navigation */}
            <div>
              <div className="font-semibold text-slate-200 mb-3">Site</div>
              <ul className="space-y-1.5">
                <li><Link href="/#calculators" className="hover:text-accent">Calculators</Link></li>
                <li><Link href="/compare" className="hover:text-accent">Compare</Link></li>
                <li><Link href="/writing" className="hover:text-accent">Writing</Link></li>
                <li><Link href="/pricing" className="hover:text-accent">Pricing</Link></li>
                <li><Link href="/about" className="hover:text-accent">About</Link></li>
                <li><Link href="/contact" className="hover:text-accent">Contact</Link></li>
              </ul>
            </div>

            {/* Developer resources */}
            <div>
              <div className="font-semibold text-slate-200 mb-3">For developers</div>
              <ul className="space-y-1.5">
                <li><Link href="/api-docs" className="hover:text-accent">API docs</Link></li>
                <li>
                  <a href="https://api.quantoracle.dev/openapi.json" rel="noopener" className="hover:text-accent">
                    OpenAPI spec
                  </a>
                </li>
                <li>
                  <a href="https://api.quantoracle.dev/.well-known/x402" rel="noopener" className="hover:text-accent">
                    x402 discovery
                  </a>
                </li>
                <li>
                  <a href="https://api.quantoracle.dev/.well-known/agent-card.json" rel="noopener" className="hover:text-accent">
                    A2A AgentCard
                  </a>
                </li>
                <li>
                  <a href="https://api.quantoracle.dev/metrics" rel="noopener" className="hover:text-accent">
                    Public metrics
                  </a>
                </li>
              </ul>
            </div>

            {/* Integrations */}
            <div>
              <div className="font-semibold text-slate-200 mb-3">Integrations</div>
              <ul className="space-y-1.5">
                <li>
                  <a href="https://pypi.org/project/langchain-quantoracle/" rel="noopener" className="hover:text-accent">
                    LangChain (Python)
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/QuantOracledev/quantoracle/tree/main/integrations/agentkit"
                    rel="noopener"
                    className="hover:text-accent"
                  >
                    Coinbase AgentKit
                  </a>
                </li>
                <li>
                  <a href="https://www.npmjs.com/package/quantoracle-mcp" rel="noopener" className="hover:text-accent">
                    MCP server (npm)
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/QuantOracledev/quantoracle/tree/main/integrations"
                    rel="noopener"
                    className="hover:text-accent"
                  >
                    All integrations
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Legal bar */}
          <div className="border-t border-ink-800/60">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="leading-relaxed">
                Calculator results are estimates for educational purposes only. <strong>Not investment advice.</strong>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <Link href="/privacy" className="hover:text-accent">Privacy</Link>
                <Link href="/terms" className="hover:text-accent">Terms</Link>
                <Link href="/affiliate-disclosure" className="hover:text-accent">Disclosure</Link>
              </div>
            </div>
          </div>
        </footer>
        {/* GA4 — uses next/third-parties so the gtag.js loads with the proper
            afterInteractive strategy and doesn't block first paint. Pageview
            events fire automatically on route changes (Next.js App Router). */}
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
