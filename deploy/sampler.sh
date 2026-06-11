#!/usr/bin/env bash
# QuantOracle live-data sampler — feeds the append-only live_history table.
#
# Fired every 5 minutes by quantoracle-sampler.timer. Hits the API's OWN live
# endpoints on localhost so all fetch/compute/cache/history logic stays in one
# place (api/quantoracle.py). The cache TTLs dedupe for free: funding (60s TTL)
# yields a fresh upstream snapshot every run; volatility (300s TTL, daily
# candles) is only sampled on the top-of-hour run.
#
# X-Source: sampler  ->  hit() skips the `calls` metrics table entirely, so
# sampler traffic never pollutes usage analytics; only live_history grows.
#
# Failure mode: any curl failing is ignored (|| true) — next timer run retries.
# The API never depends on this script; worst case the dataset just has a gap.

set -u
API="http://localhost:8001"
ASSETS="BTC ETH SOL"

for a in $ASSETS; do
  curl -s -m 20 -X POST "$API/v1/live/funding-rates" \
    -H "Content-Type: application/json" -H "X-Source: sampler" \
    -d "{\"asset\":\"$a\"}" >/dev/null || true
done

# Realized vol comes from daily candles — hourly sampling is plenty.
if [ "$(date -u +%M)" -lt 5 ]; then
  for a in $ASSETS; do
    curl -s -m 25 -X POST "$API/v1/live/volatility" \
      -H "Content-Type: application/json" -H "X-Source: sampler" \
      -d "{\"asset\":\"$a\"}" >/dev/null || true
  done
fi
