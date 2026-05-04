// One-shot script that submits every live calculator URL to IndexNow,
// covering Bing, Yandex, DuckDuckGo, and Seznam in a single API call.
//
// Run with:
//   node scripts/submit-indexnow.mjs
//
// No auth required: IndexNow uses a key file hosted at /<key>.txt as proof
// of domain ownership. The key + keyfile are checked in at
// site/public/bf32e3ea123c5021212705408bacdf46.txt.

const HOST = 'quantoracle.dev';
const KEY = 'bf32e3ea123c5021212705408bacdf46';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// Keep this list aligned with lib/calculators.ts + sitemap.ts.
const URLS = [
  `https://${HOST}/`,
  `https://${HOST}/api-docs`,
  `https://${HOST}/black-scholes-calculator`,
  `https://${HOST}/american-option-calculator`,
  `https://${HOST}/options-profit-calculator`,
  `https://${HOST}/implied-volatility-calculator`,
  `https://${HOST}/kelly-criterion-calculator`,
  `https://${HOST}/sharpe-ratio-calculator`,
  `https://${HOST}/value-at-risk-calculator`,
  `https://${HOST}/position-size-calculator`,
  `https://${HOST}/crypto-liquidation-calculator`,
  `https://${HOST}/impermanent-loss-calculator`,
];

const body = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: URLS,
};

console.log(`Submitting ${URLS.length} URLs to IndexNow...`);
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
