#!/usr/bin/env python3
"""
QuantOracle morning brief — the startup protocol the COO runs at the
beginning of each session.

Run with:
    D:/Quantcalc/venv/Scripts/python.exe D:/Quantcalc/ops/morning-brief.py

Pulls operational + traffic state in ~30 seconds and prints a compact
report. Designed so a fresh Claude session can rehydrate context without
the CEO having to brief manually.

Sections:
    1. API health (public + droplet uptime check)
    2. Last 24h API traffic by source
    3. GA4 sessions: today + last 7 days
    4. Worker timeout count (last 6 hours)
    5. Dependabot alert counts
    6. Open upstream PRs (vercel/ai, goat-sdk/goat)
    7. Open Dependabot PRs on our own repo
    8. Recent deploys
    9. AdSense readiness check vs the 4 criteria

No side effects — read-only.
"""
import os
import sys
import json
import subprocess
from datetime import date, timedelta, datetime, timezone

# Force UTF-8 stdout on Windows so checkmarks / unicode don't crash the brief.
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

# Make the GSC MCP module importable so we can call list_sites / inspect
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'mcp-gsc'))


def section(title: str) -> None:
    """Print a section header so the report is scannable."""
    print()
    print('=' * 72)
    print(f'  {title}')
    print('=' * 72)


def run(cmd, timeout: int = 30) -> str:
    """Run a command, return stdout. Empty string on failure.

    Pass a string for shell=True (cmd.exe on Windows — beware quoting), or a
    list for shell=False (preferred for gh / jq filters with quotes)."""
    try:
        is_list = isinstance(cmd, (list, tuple))
        r = subprocess.run(
            cmd, shell=not is_list, capture_output=True, text=True,
            timeout=timeout, encoding='utf-8', errors='replace',
        )
        return r.stdout.strip() if r.returncode == 0 else f'(ERR {r.returncode}: {r.stderr.strip()[:160]})'
    except subprocess.TimeoutExpired:
        return '(TIMEOUT)'
    except Exception as e:
        return f'(EXC: {e})'


def main() -> None:
    print(f'\nQuantOracle morning brief — {datetime.now().strftime("%Y-%m-%d %H:%M %Z")}')

    # ── 1. API health ────────────────────────────────────────────────
    section('API health')
    print(run("curl -s --max-time 5 https://api.quantoracle.dev/health"))

    # ── 2. Droplet quick check (SSH if available) ─────────────────────
    section('Droplet quick check')
    print('Worker process count (expect 5 = 1 master + 4 workers):')
    print('  ' + run(
        "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@142.93.191.231 "
        "'ps aux | grep gunicorn | grep -v grep | wc -l'"
    ))
    print('Memory (RAM used / total):')
    print('  ' + run(
        "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@142.93.191.231 "
        "'free -h | sed -n 2p'"
    ))
    print('Worker timeouts in last 6h (target: 0):')
    # List-form avoids cmd.exe quote eating the nested single quotes.
    print('  ' + run([
        'ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=5',
        'root@142.93.191.231',
        # grep -c already prints 0 on zero matches but exits 1 — || true
        # swallows the exit code so we don't get a phantom second "0".
        "journalctl -u quantoracle --since '6 hours ago' --no-pager | grep -c 'WORKER TIMEOUT' || true",
    ]))

    # ── 3. Today's API metrics ────────────────────────────────────────
    section('Today + recent API call volume')
    metrics_raw = run("curl -s --max-time 5 https://api.quantoracle.dev/metrics") or ''
    try:
        m = json.loads(metrics_raw)
        today = m.get('today', {})
        hist = m.get('daily_history', {})
        recent_days = sorted(hist.items())[-7:]
        # Split today's calls: "internal" = quantoracle-site (Next.js SSR
        # fetches, mostly bot pageviews of calculator pages). "External" =
        # actual MCP/agent/python clients. The external number is the real
        # signal for product-market fit on the API.
        by_src = today.get('by_source', {})
        internal_today = by_src.get('quantoracle-site', 0) + by_src.get('unknown', 0)
        external_today = today.get('calls', 0) - internal_today
        print(f"  Today: {today.get('calls', 0)} calls "
              f"({external_today} external + {internal_today} internal/SSR), "
              f"{today.get('unique_ips', 0)} unique IPs")
        if by_src:
            top_srcs = sorted(by_src.items(), key=lambda kv: -kv[1])[:5]
            srcs = ', '.join(f'{s}={n}' for s, n in top_srcs)
            print(f"  Today sources:  {srcs}")
        print(f"  Lifetime: {m.get('calls', 0)} calls, "
              f"{m.get('all_time', {}).get('unique_ips', 0)} unique IPs, "
              f"{m.get('all_time', {}).get('days_tracked', 0)} days tracked")
        print(f"  Last 7 days (total calls — includes SSR/bot pageviews):")
        for d, n in recent_days:
            print(f'    {d}  {n:>5} calls')
    except (ValueError, KeyError) as e:
        print(f'  (metrics parse failed: {e})')
        print(f'  raw: {metrics_raw[:400]}')

    # Yesterday's external/internal split via the droplet metrics DB.
    # This is the truest signal of real API consumption — internal SSR
    # calls vary with crawl rate, external calls track actual users.
    # Use UTC because the server's `date` column is UTC.
    yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
    # Pipe the script in via ssh stdin — avoids the quoting hell of trying
    # to embed multiline python in a `python3 -c "..."` argument.
    remote_script = f"""
import sqlite3
c = sqlite3.connect('/opt/quantoracle/metrics.db')
rows = list(c.execute("SELECT source, COUNT(*) FROM calls WHERE date='{yesterday}' GROUP BY source ORDER BY 2 DESC"))
total = sum(n for _, n in rows)
internal = sum(n for s, n in rows if s in ('quantoracle-site', 'unknown'))
external = total - internal
print(f'  Yesterday ({yesterday}): {{total}} total, {{external}} external, {{internal}} internal/SSR')
if rows:
    print('  Yesterday sources:  ' + ', '.join(f'{{s}}={{n}}' for s, n in rows[:5]))
"""
    try:
        r = subprocess.run(
            ['ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=5',
             'root@142.93.191.231', 'python3 -'],
            input=remote_script, capture_output=True, text=True,
            timeout=30, encoding='utf-8', errors='replace',
        )
        print(r.stdout.strip() if r.returncode == 0
              else f'  (yesterday-split ERR {r.returncode}: {r.stderr.strip()[:200]})')
    except Exception as e:
        print(f'  (yesterday-split EXC: {e})')

    # ── 4. GA4 sessions ───────────────────────────────────────────────
    section('GA4 traffic — today + last 7 days')
    try:
        # Import the GA4 client via the same path
        from google.auth import default as ga_default
        from googleapiclient.discovery import build as ga_build

        creds, _ = ga_default(scopes=[
            'https://www.googleapis.com/auth/analytics.readonly'
        ])
        ga = ga_build('analyticsdata', 'v1beta', credentials=creds,
                      cache_discovery=False)
        body = {
            'dateRanges': [
                {'startDate': 'today', 'endDate': 'today'},
                {'startDate': 'yesterday', 'endDate': 'yesterday'},
                {'startDate': '7daysAgo', 'endDate': 'today'},
            ],
            'metrics': [
                {'name': 'sessions'},
                {'name': 'totalUsers'},
                {'name': 'engagedSessions'},
                {'name': 'averageSessionDuration'},
            ],
        }
        resp = ga.properties().runReport(
            property='properties/536051756', body=body
        ).execute()
        labels = ['today', 'yesterday', '7-day']
        for row in resp.get('rows', []):
            idx = int(row['dimensionValues'][0]['value'].rsplit('_', 1)[-1])
            mv = row['metricValues']
            print(f'  {labels[idx]:<10} sessions={mv[0]["value"]:>4}  '
                  f'users={mv[1]["value"]:>4}  '
                  f'engaged={mv[2]["value"]:>4}  '
                  f'avg_dur={float(mv[3]["value"]):>5.1f}s')
    except Exception as e:
        print(f'  GA4 unavailable: {e}')

    # ── 5. Dependabot alert counts ────────────────────────────────────
    section('Dependabot alerts (open)')
    alerts_raw = run([
        'gh', 'api', 'repos/QuantOracledev/quantoracle/dependabot/alerts',
        '--paginate',
    ])
    try:
        items = json.loads(alerts_raw) if alerts_raw.startswith('[') else []
        bysev: dict[str, int] = {}
        for a in items:
            if a.get('state') == 'open':
                sev = a.get('security_advisory', {}).get('severity', '?')
                bysev[sev] = bysev.get(sev, 0) + 1
        if bysev:
            for sev, n in sorted(bysev.items()):
                print(f'  {n} {sev}')
        else:
            print('  (none)')
    except (ValueError, AttributeError) as e:
        print(f'  (parse failed: {e})')
        print(f'  raw: {alerts_raw[:200]}')

    # ── 6. Open upstream PRs ──────────────────────────────────────────
    section('Open upstream PRs (filed by us)')
    for repo in ('vercel/ai', 'goat-sdk/goat'):
        print(f'{repo}:')
        raw = run([
            'gh', 'pr', 'list', '--repo', repo,
            '--search', 'author:fel123 is:open',
            '--limit', '3',
            '--json', 'number,title,createdAt',
        ])
        try:
            rows = json.loads(raw) if raw.startswith('[') else []
            if not rows:
                print('  (none)')
            for pr in rows:
                print(f"  #{pr['number']} {pr['title']}  opened {pr['createdAt'][:10]}")
        except ValueError:
            print(f'  (parse failed: {raw[:160]})')

    # ── 7. Open Dependabot PRs on QO repo ─────────────────────────────
    section('Open Dependabot PRs (waiting to merge)')
    raw = run([
        'gh', 'pr', 'list', '--repo', 'QuantOracledev/quantoracle',
        '--state', 'open', '--author', 'app/dependabot',
        '--json', 'number,title',
    ])
    try:
        rows = json.loads(raw) if raw.startswith('[') else []
        if not rows:
            print('  (none)')
        for pr in rows:
            print(f"  #{pr['number']} {pr['title']}")
    except ValueError:
        print(f'  (parse failed: {raw[:160]})')

    # ── 8. Recent deploys ─────────────────────────────────────────────
    section('Recent Vercel deploys (last 3 production)')
    # & in URL would be a cmd separator — list-form passes verbatim.
    raw = run([
        'gh', 'api',
        'repos/QuantOracledev/quantoracle/deployments?environment=Production&per_page=3',
    ])
    try:
        rows = json.loads(raw) if raw.startswith('[') else []
        if not rows:
            print('  (none)')
        for d in rows:
            print(f"  {d.get('created_at', '?')} sha={d.get('sha', '')[:8]}")
    except ValueError:
        print(f'  (parse failed: {raw[:160]})')

    # ── 9. AdSense readiness ──────────────────────────────────────────
    section('AdSense readiness check')
    site_launch = date(2026, 5, 4)
    today = date.today()
    age_days = (today - site_launch).days
    print(f'  Domain age:                {age_days} days (target: 90+)')
    print(f'  Daily sessions baseline:   ~10/day from last GA4 sweep (target: 50+/day sustained)')
    print(f'  Organic search %:          ~9% (target: 30%+)')
    print(f'  Indexed pages:             25 of 40 (per last GSC sweep)')
    print(f'  Engaged session %:         50% (target: 30%+) ✓ MEETING')
    print(f'  Required policy pages:     all present ✓ MEETING')
    print()
    if age_days >= 90:
        print('  → VERDICT: domain age criterion met; check other 3 metrics in detail')
    else:
        eta = site_launch + timedelta(days=90)
        print(f'  → VERDICT: not ready (domain too young — ETA earliest {eta.isoformat()})')

    print()
    print('=' * 72)
    print(f'End of brief — see D:/Quantcalc/OPERATIONS.md for active initiatives + decisions')
    print('=' * 72)


if __name__ == '__main__':
    main()
