#!/usr/bin/env bash
# Worker-timeout sentinel for the QuantOracle API droplet.
#
# Run with:
#   bash D:/Quantcalc/ops/worker-watch.sh
#
# Counts gunicorn worker timeouts in the last hour. If the count exceeds the
# threshold (3), prints a flag so the COO knows to investigate. The 2026-05-17
# fix (--timeout 300 --keep-alive 75) brought the rate from ~13/3h to 0/6h
# baseline. Any return of this pattern suggests a different root cause:
# memory pressure, KV stall, a new SSE consumer with longer connections.
#
# Read-only — no side effects on the droplet.

set -uo pipefail

DROPLET=142.93.191.231
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=5"
THRESHOLD=3

echo "QuantOracle worker watch — $(date -u '+%Y-%m-%d %H:%M:%S %Z')"
echo

# Service state
state=$(ssh $SSH_OPTS root@$DROPLET 'systemctl is-active quantoracle' 2>/dev/null || echo 'unreachable')
echo "Service state:  $state"

# Worker count
workers=$(ssh $SSH_OPTS root@$DROPLET 'ps aux | grep gunicorn | grep -v grep | wc -l' 2>/dev/null || echo '?')
echo "Worker procs:   $workers  (expect 5 = 1 master + 4 workers)"

# Memory
mem=$(ssh $SSH_OPTS root@$DROPLET 'free -h | sed -n 2p | awk "{print \$3 \" / \" \$2 \" used\"}"' 2>/dev/null || echo '?')
echo "Memory:         $mem"

# Worker timeouts in last hour
timeouts_1h=$(ssh $SSH_OPTS root@$DROPLET \
    "journalctl -u quantoracle --since '1 hour ago' --no-pager | grep -c 'WORKER TIMEOUT'" \
    2>/dev/null || echo '?')
echo "Worker timeouts last 1h:  $timeouts_1h  (threshold: $THRESHOLD)"

# Worker timeouts in last 6 hours
timeouts_6h=$(ssh $SSH_OPTS root@$DROPLET \
    "journalctl -u quantoracle --since '6 hours ago' --no-pager | grep -c 'WORKER TIMEOUT'" \
    2>/dev/null || echo '?')
echo "Worker timeouts last 6h:  $timeouts_6h"

echo

# Verdict
if [ "$state" != 'active' ]; then
    echo "🚨 ALERT: service not active (state: $state)"
    exit 2
fi
if [ "$workers" != '5' ]; then
    echo "⚠ ALERT: worker count is $workers, expected 5 — may be in restart cycle"
    exit 2
fi
if [ "$timeouts_1h" != '?' ] && [ "$timeouts_1h" -ge "$THRESHOLD" ]; then
    echo "⚠ ALERT: $timeouts_1h worker timeouts in last 1h — investigate"
    echo
    echo "Most recent timeout context:"
    ssh $SSH_OPTS root@$DROPLET \
        "journalctl -u quantoracle --since '15 min ago' --no-pager | grep -B1 -A3 'WORKER TIMEOUT' | tail -20" \
        2>/dev/null
    exit 2
fi

echo '✓ All checks pass.'
echo "  service: active, workers: 5/5, recent timeouts: $timeouts_1h"
exit 0
