/**
 * Diagnostic: make one paid x402 call and capture all response headers
 * including EXTENSION-RESPONSES so we can see what the facilitator reports
 * about bazaar cataloging (success / processing / rejected + reason).
 *
 * Reads key from local AgentCash wallet file.
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { wrapFetchWithPayment, x402Client } from '@x402/fetch';

const wallet = JSON.parse(readFileSync(join(homedir(), '.agentcash', 'wallet.json'), 'utf8'));
const account = privateKeyToAccount(wallet.privateKey);
console.log('Signer:', account.address);

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http('https://mainnet.base.org'),
}).extend(publicActions);

const signer = {
  address: account.address,
  async signTypedData({ domain, types, primaryType, message }) {
    return walletClient.signTypedData({ domain, types, primaryType, message });
  },
  async readContract(args) { return walletClient.readContract(args); },
};

const client = new x402Client().register('eip155:8453', new ExactEvmScheme(signer));
const fetchWithPay = wrapFetchWithPayment(globalThis.fetch, client);

const url = 'https://api.quantoracle.dev/v1/stats/zscore';
const body = JSON.stringify({ series: [0.01, -0.005, 0.008, -0.012, 0.015, 0.003, -0.007, 0.011, -0.002, 0.006] });

console.log('\n→', url);
const t0 = Date.now();
const resp = await fetchWithPay(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Force-Pay': '1', 'X-Source': 'catalog-diag' },
  body,
});

console.log('\nHTTP:', resp.status, resp.statusText, '•', Date.now() - t0, 'ms');
console.log('\n=== ALL RESPONSE HEADERS ===');
for (const [k, v] of resp.headers.entries()) {
  console.log(`  ${k}: ${v}`);
}

const extHdr = resp.headers.get('extension-responses') || resp.headers.get('EXTENSION-RESPONSES');
if (extHdr) {
  console.log('\n=== EXTENSION-RESPONSES (decoded) ===');
  try {
    console.log(JSON.stringify(JSON.parse(Buffer.from(extHdr, 'base64').toString('utf8')), null, 2));
  } catch (e) {
    console.log('decode err:', e.message, 'raw:', extHdr);
  }
} else {
  console.log('\n⚠  NO EXTENSION-RESPONSES header present in response');
  console.log('   → either the facilitator did not process a bazaar extension,');
  console.log('     or the middleware did not forward it to the client.');
}

const payRespHdr = resp.headers.get('payment-response') || resp.headers.get('PAYMENT-RESPONSE');
if (payRespHdr) {
  console.log('\n=== PAYMENT-RESPONSE (decoded) ===');
  try {
    console.log(JSON.stringify(JSON.parse(Buffer.from(payRespHdr, 'base64').toString('utf8')), null, 2));
  } catch (e) {
    console.log('decode err:', e.message);
  }
}
