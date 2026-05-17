// Submit every QuantOracle URL to IndexNow — covers Bing, Yandex,
// DuckDuckGo, and Seznam via the shared IndexNow protocol in one POST.
//
// Run with:
//   node scripts/submit-indexnow.mjs
//
// No auth required: IndexNow uses a key file hosted at /<key>.txt as proof
// of domain ownership. The key + keyfile are checked in at
// site/public/bf32e3ea123c5021212705408bacdf46.txt.
//
// Google does NOT honor IndexNow. To push URLs into Google's crawl queue,
// use Search Console URL Inspection ("Request Indexing" button) for each
// not-yet-indexed URL, or set up the Indexing API (requires gcloud auth
// with the https://www.googleapis.com/auth/indexing scope added).

const HOST = 'quantoracle.dev';
const KEY = 'bf32e3ea123c5021212705408bacdf46';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// Keep this list aligned with sitemap.ts. Sections mirror the sitemap order.
const URLS = [
  // Top-level pages
  `https://${HOST}/`,
  `https://${HOST}/pricing`,
  `https://${HOST}/api-docs`,
  `https://${HOST}/writing`,
  `https://${HOST}/compare`,
  `https://${HOST}/about`,
  `https://${HOST}/contact`,
  `https://${HOST}/affiliate-disclosure`,
  `https://${HOST}/privacy`,
  `https://${HOST}/terms`,

  // Calculators (15)
  `https://${HOST}/black-scholes-calculator`,
  `https://${HOST}/american-option-calculator`,
  `https://${HOST}/options-profit-calculator`,
  `https://${HOST}/crypto-liquidation-calculator`,
  `https://${HOST}/impermanent-loss-calculator`,
  `https://${HOST}/position-size-calculator`,
  `https://${HOST}/value-at-risk-calculator`,
  `https://${HOST}/drawdown-calculator`,
  `https://${HOST}/hurst-exponent-calculator`,
  `https://${HOST}/probabilistic-sharpe-ratio-calculator`,
  `https://${HOST}/kelly-criterion-calculator`,
  `https://${HOST}/implied-volatility-calculator`,
  `https://${HOST}/cagr-calculator`,
  `https://${HOST}/sharpe-ratio-calculator`,
  `https://${HOST}/monte-carlo-simulation-calculator`,

  // Compare articles (11)
  `https://${HOST}/compare/sharpe-vs-sortino-vs-calmar`,
  `https://${HOST}/compare/kelly-vs-fixed-fractional-vs-optimal-f`,
  `https://${HOST}/compare/var-vs-cvar-vs-max-drawdown`,
  `https://${HOST}/compare/black-scholes-vs-binomial`,
  `https://${HOST}/compare/hurst-vs-autocorrelation-vs-variance-ratio`,
  `https://${HOST}/compare/implied-vol-vs-historical-vol-vs-realized-vol`,
  `https://${HOST}/compare/american-vs-european-vs-bermudan-options`,
  `https://${HOST}/compare/geometric-vs-arithmetic-vs-time-weighted-returns`,
  `https://${HOST}/compare/black-scholes-vs-monte-carlo`,
  `https://${HOST}/compare/sharpe-vs-information-ratio-vs-treynor`,
  `https://${HOST}/compare/z-score-vs-bollinger-bands-vs-rsi`,

  // Writing (4)
  `https://${HOST}/writing/agentkit-reliable-quant-finance-math`,
  `https://${HOST}/writing/chaining-x402-paid-tool-calls`,
  `https://${HOST}/writing/vercel-ai-sdk-quant-tools`,
  `https://${HOST}/writing/agent-framework-comparison-2026`,
];

const body = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: URLS,
};

console.log(`Submitting ${URLS.length} URLs to IndexNow (Bing + Yandex + DuckDuckGo + Seznam)...`);
const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});
console.log(`Status: ${r.status} ${r.statusText}`);
const text = await r.text();
if (text) console.log('Body:', text);
console.log(
  r.status === 200 || r.status === 202
    ? '✓ Accepted — Bing/Yandex/DuckDuckGo/Seznam will crawl shortly'
    : '✗ Submission failed — check that the keyfile is reachable: ' + KEY_LOCATION,
);
