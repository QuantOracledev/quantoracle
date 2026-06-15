#!/usr/bin/env bash
# Rotating consistent snapshot of metrics.db — the irreplaceable live_history
# moat + paid-customer Watch state (tokens!) + the settlement ledger.
#
# LOCAL ONLY (same disk): protects against corruption, a bad deploy, an
# accidental drop/delete. Does NOT protect against total droplet loss — enable
# DigitalOcean droplet backups for that. Cost: $0 (existing disk, ~10MB/snap).
#
# Fired daily by quantoracle-backup.timer. Uses Python's sqlite3 .backup()
# (a consistent online copy, safe with WAL + live writers) because the droplet
# has no sqlite3 CLI. Backups are chmod 600 in a 700 dir — they contain auth
# tokens, so keep them private.
set -uo pipefail

DB=/opt/quantoracle/metrics.db
DIR=/opt/quantoracle/backups
KEEP=14

mkdir -p "$DIR"; chmod 700 "$DIR"
ts=$(date -u +%Y%m%d-%H%M%S)
tmp="$DIR/metrics-$ts.db"

python3 - "$DB" "$tmp" <<'PY'
import sqlite3, sys
src = sqlite3.connect(sys.argv[1])
dst = sqlite3.connect(sys.argv[2])
try:
    with dst:
        src.backup(dst)          # consistent online snapshot
finally:
    src.close(); dst.close()
PY

if [ -s "$tmp" ]; then
    gzip -9 "$tmp" && chmod 600 "$tmp.gz"
    # Rotate: keep the newest $KEEP, delete older.
    ls -1t "$DIR"/metrics-*.db.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
    echo "backup ok: $tmp.gz ($(du -h "$tmp.gz" | cut -f1)); $(ls -1 "$DIR"/metrics-*.db.gz 2>/dev/null | wc -l) kept"
else
    echo "backup FAILED (empty/missing snapshot)" >&2
    rm -f "$tmp"
    exit 1
fi
