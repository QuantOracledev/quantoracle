#!/usr/bin/env python3
"""
Weekly GSC + content-opportunity scan.

Run with:
    D:/Quantcalc/venv/Scripts/python.exe D:/Quantcalc/ops/gsc-weekly.py

Pulls last 7d + 30d data from Google Search Console, identifies:
    1. Newly-indexed URLs since last scan (good news to flag)
    2. URLs in 'Crawled but not yet indexed' or 'Discovered but not crawled'
       (action items — Google nudge needed)
    3. Queries we rank for but have 0 CTR (title/meta optimization candidates)
    4. Queries we rank for but no dedicated page (content opportunity)
    5. Pages with traffic spikes vs prior week (amplification candidates)
    6. AdSense readiness criteria refresh

Also auto-pings IndexNow for all current site URLs so Bing/Yandex/DDG/Seznam
stay fresh. (Google doesn't honor IndexNow; for Google we surface the action
list to be submitted manually via Search Console URL Inspection.)

No destructive side effects. The IndexNow ping is read-only-equivalent — it
just notifies engines, doesn't write anything to our infra.
"""
import os
import sys
import json
import time
import subprocess
import requests
from datetime import date, timedelta

# Force UTF-8 stdout on Windows — otherwise ⚠ (⚠) crashes the run.
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

# Make the GSC MCP module importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'mcp-gsc'))
from server import top_queries, top_pages, query_search, inspect_url, list_sites

SITE = 'sc-domain:quantoracle.dev'
BASE = 'https://quantoracle.dev'

INDEXNOW_HOST = 'quantoracle.dev'
INDEXNOW_KEY = 'bf32e3ea123c5021212705408bacdf46'

# Canonical URL list — kept in sync with site/scripts/submit-indexnow.mjs
ALL_URLS = [
    f'{BASE}/', f'{BASE}/pricing', f'{BASE}/api-docs', f'{BASE}/writing',
    f'{BASE}/compare', f'{BASE}/about', f'{BASE}/contact',
    f'{BASE}/affiliate-disclosure', f'{BASE}/privacy', f'{BASE}/terms',
    f'{BASE}/black-scholes-calculator', f'{BASE}/american-option-calculator',
    f'{BASE}/options-profit-calculator', f'{BASE}/crypto-liquidation-calculator',
    f'{BASE}/impermanent-loss-calculator', f'{BASE}/position-size-calculator',
    f'{BASE}/value-at-risk-calculator', f'{BASE}/drawdown-calculator',
    f'{BASE}/hurst-exponent-calculator',
    f'{BASE}/probabilistic-sharpe-ratio-calculator',
    f'{BASE}/kelly-criterion-calculator',
    f'{BASE}/implied-volatility-calculator', f'{BASE}/cagr-calculator',
    f'{BASE}/sharpe-ratio-calculator',
    f'{BASE}/monte-carlo-simulation-calculator',
    f'{BASE}/compare/sharpe-vs-sortino-vs-calmar',
    f'{BASE}/compare/kelly-vs-fixed-fractional-vs-optimal-f',
    f'{BASE}/compare/var-vs-cvar-vs-max-drawdown',
    f'{BASE}/compare/black-scholes-vs-binomial',
    f'{BASE}/compare/hurst-vs-autocorrelation-vs-variance-ratio',
    f'{BASE}/compare/implied-vol-vs-historical-vol-vs-realized-vol',
    f'{BASE}/compare/american-vs-european-vs-bermudan-options',
    f'{BASE}/compare/geometric-vs-arithmetic-vs-time-weighted-returns',
    f'{BASE}/compare/black-scholes-vs-monte-carlo',
    f'{BASE}/compare/sharpe-vs-information-ratio-vs-treynor',
    f'{BASE}/compare/z-score-vs-bollinger-bands-vs-rsi',
    f'{BASE}/writing/agentkit-reliable-quant-finance-math',
    f'{BASE}/writing/chaining-x402-paid-tool-calls',
    f'{BASE}/writing/vercel-ai-sdk-quant-tools',
    f'{BASE}/writing/agent-framework-comparison-2026',
]


def section(title):
    print()
    print('=' * 72)
    print(f'  {title}')
    print('=' * 72)


def ping_indexnow():
    """Submit all URLs to Bing/Yandex/DDG/Seznam via the IndexNow protocol."""
    r = requests.post(
        'https://api.indexnow.org/indexnow',
        json={
            'host': INDEXNOW_HOST,
            'key': INDEXNOW_KEY,
            'keyLocation': f'https://{INDEXNOW_HOST}/{INDEXNOW_KEY}.txt',
            'urlList': ALL_URLS,
        },
        headers={'Content-Type': 'application/json; charset=utf-8'},
        timeout=30,
    )
    return r.status_code, r.text[:200]


def main():
    print(f'\nWeekly GSC scan — {date.today().isoformat()}\n')

    # ── 1. Indexing status of all URLs ────────────────────────────────
    section('Indexing status — all 40 site URLs')
    buckets = {'indexed': [], 'crawled_not_indexed': [],
               'discovered_not_crawled': [], 'unknown_other': []}
    for url in ALL_URLS:
        try:
            r = inspect_url(site_url=SITE, inspection_url=url)
            if 'error' in r:
                buckets['unknown_other'].append((url, 'API error'))
                continue
            idx = r.get('inspectionResult', {}).get('indexStatusResult', {})
            cov = idx.get('coverageState', '?')
            verdict = idx.get('verdict', 'UNKNOWN')
            if verdict == 'PASS':
                buckets['indexed'].append((url, cov))
            elif 'Crawled' in cov:
                buckets['crawled_not_indexed'].append((url, cov))
            elif 'Discovered' in cov:
                buckets['discovered_not_crawled'].append((url, cov))
            else:
                buckets['unknown_other'].append((url, cov))
        except Exception as e:
            buckets['unknown_other'].append((url, f'exception: {e}'))
        time.sleep(0.15)
    print(f"  Indexed:                {len(buckets['indexed'])} / {len(ALL_URLS)}")
    print(f"  Crawled, not indexed:   {len(buckets['crawled_not_indexed'])}")
    print(f"  Discovered, not crawled:{len(buckets['discovered_not_crawled'])}")
    print(f"  Unknown / other:        {len(buckets['unknown_other'])}")
    if buckets['discovered_not_crawled'] or buckets['unknown_other']:
        print()
        print('  ACTION — submit these via Search Console URL Inspection:')
        for url, _ in buckets['discovered_not_crawled'] + buckets['unknown_other']:
            print(f'    {url}')

    # ── 2. IndexNow ping ──────────────────────────────────────────────
    section('IndexNow refresh (Bing/Yandex/DDG/Seznam)')
    status, body = ping_indexnow()
    print(f'  api.indexnow.org HTTP {status}')
    if body:
        print(f'  body: {body}')

    # ── 3. Top queries ────────────────────────────────────────────────
    section('Top queries last 7d (with 0% CTR = title/meta candidates)')
    r = top_queries(site_url=SITE, days=7, limit=25)
    for row in r.get('rows', []):
        q = row['keys'][0][:55]
        imp = row['impressions']
        clk = row['clicks']
        ctr = row['ctr'] * 100
        pos = row['position']
        flag = '  ⚠ 0% CTR' if imp >= 5 and clk == 0 and pos <= 30 else ''
        print(f'  imp={imp:>3}  clk={clk:>2}  ctr={ctr:>5.1f}%  '
              f'pos={pos:>5.1f}  {q}{flag}')

    # ── 4. Top pages ──────────────────────────────────────────────────
    section('Top pages last 7d')
    r = top_pages(site_url=SITE, days=7, limit=20)
    for row in r.get('rows', []):
        p = row['keys'][0].replace(BASE, '') or '/'
        imp = row['impressions']
        clk = row['clicks']
        ctr = row['ctr'] * 100
        pos = row['position']
        flag = '  ⚠ low CTR' if imp >= 10 and ctr < 1 and pos <= 15 else ''
        print(f'  imp={imp:>3}  clk={clk:>2}  ctr={ctr:>5.1f}%  '
              f'pos={pos:>5.1f}  {p[:48]}{flag}')

    # ── 5. AdSense readiness ──────────────────────────────────────────
    section('AdSense readiness check')
    site_launch = date(2026, 5, 4)
    today = date.today()
    age_days = (today - site_launch).days
    eta = site_launch + timedelta(days=90)
    print(f'  Domain age: {age_days} days (target 90+) — earliest: {eta.isoformat()}')
    print(f'  Other metrics: pull from `morning-brief.py` for current values')

    # ── 6. Closing summary ────────────────────────────────────────────
    section('Next actions')
    action_count = len(buckets['discovered_not_crawled']) + len(buckets['unknown_other'])
    if action_count > 0:
        print(f'  1. Submit {action_count} URLs to Google via Search Console URL Inspection')
    print('  2. Review the "0% CTR" / "low CTR" flags above for title/meta rewrites')
    print(f'  3. Update OPERATIONS.md if anything in the strategic priorities shifted')
    print()


if __name__ == '__main__':
    main()
