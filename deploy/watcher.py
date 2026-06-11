#!/usr/bin/env python3
"""QuantOracle Watch — the watcher loop (quantoracle-watch.service).

Evaluates every active monitor in watch_monitors each ~60s tick:
  - mark price (Kraken ticker, direct, one call per distinct asset)
  - funding rate via the API's own /v1/live/funding-rates on localhost
    (X-Source: watcher -> skipped by usage metrics; shares the live cache
    and feeds the append-only live_history dataset)
  - funding-adjusted liquidation distance -> warn/critical bands with
    hysteresis + 6h in-breach re-alert cooldown
  - funding-rate sign flips, hourly vol-regime changes
  - expiry warnings (paid: T-3d, trial: T-6h with upgrade CTA) and expiry

Alerts are INSERTed into watch_alerts (always readable via the API's GET
/v1/watch/{id}) and POSTed to the monitor's webhook_url when configured:
HMAC-SHA256 signed (X-QO-Signature, key = monitor token), SSRF re-checked
at send time, redirects refused, 3 attempts with backoff.

Deliberately isolated: this process can die without touching the serving
API — /health just shows a stale watcher_heartbeat_age_s. Run with --once
for a single verbose tick (used for deploy verification).

Stdlib only. Lives at /opt/quantoracle/watcher.py.
"""
import argparse
import hmac
import hashlib
import ipaddress
import json
import socket
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse

DB = "/opt/quantoracle/metrics.db"
API = "http://localhost:8001"
UA = "quantoracle-watch/1.0 (+https://quantoracle.dev)"
KRAKEN_PAIR = {"BTC": "XBTUSD"}
TICK_SECS = 60
REALERT_SECS = 6 * 3600          # re-alert cadence while still in breach
PAID_EXPIRY_WARN_SECS = 3 * 86400
TRIAL_EXPIRY_WARN_SECS = 6 * 3600
UPGRADE_CTA = "Extend 30 days for $5 via x402: POST https://api.quantoracle.dev/v1/watch/extend {monitor_id, token}."


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):  # refuse redirects on webhook sends
        return None


_OPENER = urllib.request.build_opener(_NoRedirect)


def db():
    conn = sqlite3.connect(DB, timeout=5)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn


def http_json(url, body=None, headers=None, timeout=15):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method="POST" if data else "GET")
    req.add_header("User-Agent", UA)
    if data:
        req.add_header("Content-Type", "application/json")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def get_mark(asset):
    pair = KRAKEN_PAIR.get(asset, f"{asset}USD")
    j = http_json(f"https://api.kraken.com/0/public/Ticker?pair={pair}", timeout=10)
    if j.get("error"):
        raise ValueError(str(j["error"]))
    return float(next(iter(j["result"].values()))["c"][0])


def get_funding(asset):
    return http_json(f"{API}/v1/live/funding-rates", {"asset": asset},
                     {"X-Source": "watcher"}, timeout=20)


def get_vol(asset):
    return http_json(f"{API}/v1/live/volatility", {"asset": asset},
                     {"X-Source": "watcher"}, timeout=25)


def liq_distance(direction, entry, size, collateral, mmr, funding_accum, mark):
    eff = collateral - funding_accum
    if direction == "long":
        liq = max(0.0, entry * (1 - (eff - size * mmr) / size)) if size > 0 else 0.0
        dist = (mark - liq) / mark if mark > 0 else 0.0
    else:
        liq = entry * (1 + (eff - size * mmr) / size) if size > 0 else 0.0
        dist = (liq - mark) / mark if mark > 0 else 0.0
    return liq, dist


def webhook_target_ok(url):
    """SSRF re-check at send time (DNS rebinding defense)."""
    try:
        u = urlparse(url)
        if u.scheme not in ("http", "https") or not u.hostname:
            return False
        infos = socket.getaddrinfo(u.hostname, u.port or (443 if u.scheme == "https" else 80),
                                   proto=socket.IPPROTO_TCP)
        return bool(infos) and all(
            ipaddress.ip_address(i[4][0]).is_global and not ipaddress.ip_address(i[4][0]).is_multicast
            for i in infos)
    except Exception:
        return False


def send_webhook(url, token, monitor_id, payload):
    if not url or not webhook_target_ok(url):
        return False
    body = json.dumps(payload).encode()
    sig = hmac.new(token.encode(), body, hashlib.sha256).hexdigest()
    for delay in (0, 5, 25):
        if delay:
            time.sleep(delay)
        try:
            req = urllib.request.Request(url, data=body, method="POST")
            req.add_header("Content-Type", "application/json")
            req.add_header("User-Agent", UA)
            req.add_header("X-QO-Monitor", monitor_id)
            req.add_header("X-QO-Signature", sig)
            with _OPENER.open(req, timeout=10) as r:
                if 200 <= r.status < 300:
                    return True
        except Exception:
            continue
    return False


def record_alert(conn, mon, alert_type, data, verbose=False):
    now = time.time()
    payload = {"monitor_id": mon["id"], "type": alert_type,
               "ts": now, "asset": mon["asset"], "direction": mon["direction"], **data}
    delivered = send_webhook(mon["webhook_url"], mon["token"], mon["id"], payload)
    conn.execute("INSERT INTO watch_alerts (monitor_id, ts, type, payload, delivered) VALUES (?,?,?,?,?)",
                 (mon["id"], now, alert_type, json.dumps(payload), int(delivered)))
    if verbose:
        print(f"  ALERT {mon['id']} {alert_type} delivered={delivered} {data}")


def load_active(conn, now):
    cols = ("id", "token", "tier", "status", "created_ts", "expires_ts", "ip64", "asset",
            "direction", "entry_price", "position_size", "collateral", "mmr",
            "webhook_url", "thresholds", "state")
    rows = conn.execute(
        f"SELECT {','.join(cols)} FROM watch_monitors WHERE status='active'").fetchall()
    return [dict(zip(cols, r)) for r in rows]


def tick(verbose=False):
    now = time.time()
    conn = db()
    try:
        monitors = load_active(conn, now)
        if verbose:
            print(f"tick: {len(monitors)} active monitor(s)")

        # Expiries first — no market data needed.
        live = []
        for m in monitors:
            st = json.loads(m["state"])
            if m["expires_ts"] <= now:
                data = {"message": "monitor expired", "tier": m["tier"]}
                if m["tier"] == "trial":
                    data["upgrade"] = UPGRADE_CTA
                record_alert(conn, m, "expired", data, verbose)
                conn.execute("UPDATE watch_monitors SET status='expired' WHERE id=?", (m["id"],))
                continue
            warn_window = TRIAL_EXPIRY_WARN_SECS if m["tier"] == "trial" else PAID_EXPIRY_WARN_SECS
            if not st.get("warned_expiry") and (m["expires_ts"] - now) < warn_window:
                data = {"message": f"monitor expires in {round((m['expires_ts'] - now) / 3600, 1)}h",
                        "extend": UPGRADE_CTA}
                record_alert(conn, m, "expiry_warning", data, verbose)
                st["warned_expiry"] = True
            m["_st"] = st
            live.append(m)

        # Shared market data per distinct asset.
        assets = sorted({m["asset"] for m in live})
        marks, fundings, vols = {}, {}, {}
        top_of_hour = time.gmtime(now).tm_min == 0
        for a in assets:
            try:
                marks[a] = get_mark(a)
            except Exception as e:
                if verbose:
                    print(f"  mark fetch failed {a}: {e}")
            try:
                fundings[a] = get_funding(a)
            except Exception as e:
                if verbose:
                    print(f"  funding fetch failed {a}: {e}")
            if top_of_hour or verbose:
                try:
                    vols[a] = get_vol(a)
                except Exception:
                    pass

        for m in live:
            st = m["_st"]
            thr = json.loads(m["thresholds"])
            a = m["asset"]
            if a not in marks:
                conn.execute("UPDATE watch_monitors SET state=? WHERE id=?",
                             (json.dumps(st), m["id"]))
                continue
            mark = marks[a]

            # Funding accrual estimate + flip detection.
            f = fundings.get(a)
            if f and isinstance(f.get("funding_rate"), (int, float)):
                rate = f["funding_rate"]
                interval_s = (f.get("interval_hours") or 8) * 3600
                dt = max(0.0, now - st.get("last_tick", now))
                # Positive funding costs longs; negative costs shorts.
                signed = rate if m["direction"] == "long" else -rate
                st["funding_accum"] = st.get("funding_accum", 0.0) + signed * m["position_size"] * (dt / interval_s)
                sign = 1 if rate > 1e-9 else (-1 if rate < -1e-9 else 0)
                prev = st.get("last_funding_sign")
                if thr.get("funding_flip") and prev not in (None, 0) and sign != 0 and sign != prev:
                    record_alert(conn, m, "funding_flip",
                                 {"funding_rate": rate, "annualized_rate": f.get("annualized_rate"),
                                  "was": "positive" if prev > 0 else "negative",
                                  "now": "positive" if sign > 0 else "negative"}, verbose)
                if sign != 0:
                    st["last_funding_sign"] = sign
            st["last_tick"] = now

            # Vol regime change (hourly).
            v = vols.get(a)
            if v and v.get("regime"):
                if thr.get("vol_regime") and st.get("regime") and v["regime"] != st["regime"]:
                    record_alert(conn, m, "vol_regime",
                                 {"was": st["regime"], "now": v["regime"],
                                  "realized_vol_30d": v.get("realized_vol_30d")}, verbose)
                st["regime"] = v["regime"]

            # Liquidation distance bands with hysteresis + in-breach cooldown.
            liq, dist = liq_distance(m["direction"], m["entry_price"], m["position_size"],
                                     m["collateral"], m["mmr"], st.get("funding_accum", 0.0), mark)
            dist_pct = dist * 100
            band = "critical" if dist_pct < thr["critical_pct"] else (
                "warn" if dist_pct < thr["warn_pct"] else "ok")
            order = {"ok": 0, "warn": 1, "critical": 2}
            prev_band = st.get("band", "ok")
            alert_ts = st.get("alert_ts", {})
            fire = None
            if order[band] > order[prev_band]:
                fire = band  # got worse -> always alert
            elif band != "ok" and band == prev_band and now - alert_ts.get(band, 0) > REALERT_SECS:
                fire = band  # still in breach after cooldown -> re-alert
            if fire:
                record_alert(conn, m, f"liq_{fire}",
                             {"mark": round(mark, 2), "liquidation_price": round(liq, 2),
                              "distance_pct": round(dist_pct, 2),
                              "threshold_pct": thr["critical_pct"] if fire == "critical" else thr["warn_pct"],
                              "funding_accum_est": round(st.get("funding_accum", 0.0), 4)}, verbose)
                alert_ts[fire] = now
            st["band"] = band
            st["alert_ts"] = alert_ts

            conn.execute("UPDATE watch_monitors SET state=? WHERE id=?", (json.dumps(st), m["id"]))
            if verbose:
                print(f"  {m['id']} {a} {m['direction']} mark={mark:.2f} liq={liq:.2f} "
                      f"dist={dist_pct:.2f}% band={band}")

        # Heartbeat — surfaced by the API's /health as watcher_heartbeat_age_s.
        conn.execute(
            "INSERT INTO live_cache (key, json, fetched_at) VALUES ('watch:heartbeat', ?, ?) "
            "ON CONFLICT(key) DO UPDATE SET json=excluded.json, fetched_at=excluded.fetched_at",
            (json.dumps({"monitors": len(live)}), now))
        conn.commit()
    finally:
        conn.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--once", action="store_true", help="run a single verbose tick and exit")
    args = ap.parse_args()
    if args.once:
        tick(verbose=True)
        return
    while True:
        start = time.time()
        try:
            tick()
        except Exception as e:
            print(f"tick error: {e}", file=sys.stderr)
        time.sleep(max(5.0, TICK_SECS - (time.time() - start)))


if __name__ == "__main__":
    main()
