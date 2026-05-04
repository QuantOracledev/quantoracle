import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

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
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-sm text-slate-400 grid gap-6 sm:grid-cols-3">
            <div>
              <div className="font-semibold text-slate-200 mb-2">QuantOracle</div>
              <div>
                73 deterministic quant endpoints. Free tier: 1,000 calls/IP/day, no API key.
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-200 mb-2">For developers</div>
              <ul className="space-y-1">
                <li>
                  <Link href="/api-docs" className="hover:text-accent">
                    API documentation
                  </Link>
                </li>
                <li>
                  <a
                    href="https://api.quantoracle.dev/openapi.json"
                    rel="noopener"
                    className="hover:text-accent"
                  >
                    OpenAPI spec
                  </a>
                </li>
                <li>
                  <a
                    href="https://api.quantoracle.dev/.well-known/agent-card.json"
                    rel="noopener"
                    className="hover:text-accent"
                  >
                    A2A AgentCard
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-slate-200 mb-2">Project</div>
              <ul className="space-y-1">
                <li>
                  <a
                    href="https://github.com/QuantOracledev/quantoracle"
                    rel="noopener"
                    className="hover:text-accent"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://pypi.org/project/langchain-quantoracle/"
                    rel="noopener"
                    className="hover:text-accent"
                  >
                    LangChain integration
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.npmjs.com/package/quantoracle-mcp"
                    rel="noopener"
                    className="hover:text-accent"
                  >
                    MCP server
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-6 text-xs text-slate-500">
            Calculator results are estimates for educational purposes only. Not investment advice.
          </div>
        </footer>
      </body>
    </html>
  );
}
