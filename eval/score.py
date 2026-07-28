"""
score.py — grade model answers against the citation-backed answer key.

Scoring deliberately separates three failure modes that a plain pass/fail would
conflate:

  CORRECT  within the same tolerance our own verification suite uses
  SCALE    numerically right but off by exactly x100 or /100 — a unit convention
           miss, not a maths error, and worth knowing separately
  WRONG    genuinely different number
  NULL     declined to answer (honest, and better than a confident wrong number)

For WRONG answers the magnitude matters more than the count: a liquidation price
off by 0.3% is noise, off by 15% is somebody getting liquidated. So errors are
bucketed by relative size rather than just tallied.

    python eval/score.py                       # every answers-*.json found
    python eval/score.py --json results.json   # also dump machine-readable
"""

import argparse
import json
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path

# citations carry Greek letters and en-dashes; Windows consoles default to cp1252
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent
KEY = ROOT / "problems.json"

BUCKETS = [
    (0.001, "<0.1%   (noise)"),
    (0.01,  "0.1-1%  (minor)"),
    (0.05,  "1-5%    (material)"),
    (0.20,  "5-20%   (serious)"),
    (math.inf, ">20%    (catastrophic)"),
]


def _safe(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def bucket(rel):
    for lim, label in BUCKETS:
        if rel < lim:
            return label
    return BUCKETS[-1][1]


def grade(expected, tol, got):
    """-> (outcome, relative_error or None)"""
    if got is None:
        return "NULL", None
    try:
        got = float(got)
    except (TypeError, ValueError):
        return "NULL", None
    if not math.isfinite(got):
        return "NULL", None

    if abs(got - expected) <= tol:
        return "CORRECT", 0.0

    # scale slips: right number, wrong unit convention
    for factor in (100.0, 0.01):
        if abs(got * factor - expected) <= max(tol, abs(expected) * 1e-6):
            return "SCALE", None

    # sign flips: right magnitude, wrong direction. Called out separately because
    # it is the most dangerous class here — you would hedge the wrong way, and the
    # number looks entirely plausible while doing it.
    if abs(-got - expected) <= max(tol, abs(expected) * 1e-4):
        return "SIGN", None

    denom = abs(expected) if abs(expected) > 1e-9 else 1.0
    return "WRONG", abs(got - expected) / denom


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", help="write machine-readable results here")
    args = ap.parse_args()

    key = {p["id"]: p for p in json.loads(KEY.read_text(encoding="utf-8"))}
    core_ids = {i for i, p in key.items() if p["tier"] == "core"}

    files = sorted(ROOT.glob("answers-*.json"))
    if not files:
        print("no answers-*.json found — have the solvers run yet?")
        return

    all_results = {}
    per_problem = defaultdict(dict)

    for f in files:
        model = f.stem.replace("answers-", "")
        try:
            answers = json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:
            print("could not read %s: %s" % (f.name, e))
            continue

        outcomes, errs, by_cat, mags = {}, {}, defaultdict(Counter), Counter()
        for pid, p in key.items():
            outcome, rel = grade(p["expected"], p["tol"], answers.get(pid))
            outcomes[pid] = outcome
            per_problem[pid][model] = (outcome, answers.get(pid))
            by_cat[p["category"]][outcome] += 1
            if outcome == "WRONG":
                errs[pid] = rel
                mags[bucket(rel)] += 1

        core = [o for i, o in outcomes.items() if i in core_ids]
        all_results[model] = {
            "outcomes": outcomes, "errors": errs,
            "counts": Counter(outcomes.values()),
            "core_counts": Counter(core),
            "by_cat": {k: dict(v) for k, v in by_cat.items()},
            "magnitudes": dict(mags),
        }

    # ── headline ──────────────────────────────────────────────────────────────
    n_core = len(core_ids)
    print()
    print("=" * 78)
    print("  LLM ACCURACY vs DETERMINISTIC IMPLEMENTATION")
    print("  %d problems (%d core, %d sanity) — answer key is textbook-cited" %
          (len(key), n_core, len(key) - n_core))
    print("=" * 78)
    print()
    print("  %-10s %-22s %-22s %s" % ("model", "CORE correct", "all correct", "null"))
    print("  " + "-" * 74)
    for model, r in all_results.items():
        c, a = r["core_counts"], r["counts"]
        print("  %-10s %3d/%-3d (%5.1f%%)        %3d/%-3d (%5.1f%%)        %d" % (
            model, c["CORRECT"], n_core, 100 * c["CORRECT"] / n_core,
            a["CORRECT"], len(key), 100 * a["CORRECT"] / len(key), a["NULL"]))

    print()
    print("  outcome breakdown (all problems)")
    print("  " + "-" * 74)
    print("  %-10s %8s %7s %6s %7s %6s" % ("model", "CORRECT", "SCALE", "SIGN", "WRONG", "NULL"))
    for model, r in all_results.items():
        a = r["counts"]
        print("  %-10s %8d %7d %6d %7d %6d" % (
            model, a["CORRECT"], a["SCALE"], a["SIGN"], a["WRONG"], a["NULL"]))

    # ── how wrong, when wrong ────────────────────────────────────────────────
    print()
    print("  ERROR MAGNITUDE — of the answers that were wrong, how wrong?")
    print("  " + "-" * 74)
    labels = [l for _, l in BUCKETS]
    print("  %-10s %s" % ("model", "".join("%-22s" % l for l in labels[:3])))
    for model, r in all_results.items():
        m = r["magnitudes"]
        print("  %-10s %s" % (model, "".join("%-22s" % m.get(l, 0) for l in labels[:3])))
    print("  %-10s %s" % ("", "".join("%-22s" % l for l in labels[3:])))
    for model, r in all_results.items():
        m = r["magnitudes"]
        print("  %-10s %s" % (model, "".join("%-22s" % m.get(l, 0) for l in labels[3:])))

    # ── by category ──────────────────────────────────────────────────────────
    print()
    print("  BY CATEGORY (correct / total)")
    print("  " + "-" * 74)
    cats = sorted({p["category"] for p in key.values()})
    print("  %-16s %s" % ("category", "".join("%-14s" % m for m in all_results)))
    for cat in cats:
        tot = sum(1 for p in key.values() if p["category"] == cat)
        row = ""
        for model, r in all_results.items():
            row += "%-14s" % ("%d/%d" % (r["by_cat"].get(cat, {}).get("CORRECT", 0), tot))
        print("  %-16s %s" % (cat, row))

    # ── problems nobody got ──────────────────────────────────────────────────
    print()
    print("  PROBLEMS NO MODEL GOT RIGHT")
    print("  " + "-" * 74)
    none_right = [
        pid for pid in key
        if all(per_problem[pid].get(m, ("NULL", None))[0] != "CORRECT" for m in all_results)
    ]
    if not none_right:
        print("  (none — every problem was solved by at least one model)")
    for pid in none_right:
        p = key[pid]
        got = ", ".join("%s=%s" % (m, per_problem[pid].get(m, ("-", None))[1]) for m in all_results)
        print("  %s [%s] %s" % (pid, p["category"], p["field_path"]))
        print("       expected %-12s got: %s" % (p["expected"], got))
        print("       %s" % p["citation"][:100])

    # ── the two-way audit ────────────────────────────────────────────────────
    # If every model missed a problem but they all agree with EACH OTHER, the
    # outlier is probably us, not them — a convention we chose (sample vs
    # population sigma, which end a Fibonacci level is measured from) rather than
    # arithmetic anyone got wrong. Worth knowing before claiming superior accuracy.
    if len(all_results) > 1:
        print()
        print("  CONSENSUS AGAINST OUR KEY — models agree with each other, not with us")
        print("  " + "-" * 74)
        flagged = 0
        # Look at EVERY problem, not just ones models "failed". Where our own
        # tolerance is loose (±28% on the lookback), a model can score CORRECT
        # while still disagreeing with our point estimate by 20% — which is
        # exactly the case worth catching, because the loose tolerance is what
        # would hide a bug in our own implementation.
        candidates = [
            pid for pid, p in key.items()
            if any(
                (lambda v: v is not None and abs(v - p["expected"]) > max(p["tol"] * 0.5, abs(p["expected"]) * 0.01))(
                    _safe(per_problem[pid].get(m, (None, None))[1]))
                for m in all_results
            )
        ]
        for pid in candidates:
            vals = []
            for m in all_results:
                v = per_problem[pid].get(m, (None, None))[1]
                try:
                    vals.append(float(v))
                except (TypeError, ValueError):
                    pass
            if len(vals) < 2:
                continue
            # Largest cluster of models agreeing within 1% of each other. Using the
            # full spread instead would let a single wild outlier (Haiku's 58 for a
            # lookback the other two both put at 16.91) mask a genuine two-model
            # consensus against us — which is the signal we most want.
            best = []
            for anchor in vals:
                scale_a = abs(anchor) or 1.0
                cluster = [v for v in vals if abs(v - anchor) / scale_a < 0.01]
                if len(cluster) > len(best):
                    best = cluster
            if len(best) >= 2:
                vals = best
            spread = max(vals) - min(vals)
            scale = max(abs(v) for v in vals) or 1.0
            if len(vals) >= 2 and spread / scale < 0.01:
                p = key[pid]
                gap = abs(vals[0] - p["expected"]) / (abs(p["expected"]) or 1.0)
                if gap < 0.01:
                    continue                   # they agree with us too — fine
                flagged += 1
                tolpct = 100 * p["tol"] / abs(p["expected"]) if p["expected"] else 0
                print("  %s [%s] %s" % (pid, p["category"], p["field_path"]))
                print("       ours=%-12s models all ≈ %-12s  gap %.1f%%   our test tolerance ±%.1f%%"
                      % (p["expected"], round(vals[0], 6), 100 * gap, tolpct))
        if not flagged:
            print("  (none — where models failed, they also disagreed with each other)")
        else:
            print()
            print("  ^ these %d deserve review: independent solvers converging on a" % flagged)
            print("    different value than ours is evidence about OUR implementation.")

    # ── unanimous, for contrast ──────────────────────────────────────────────
    all_right = [
        pid for pid in key
        if all(per_problem[pid].get(m, ("NULL", None))[0] == "CORRECT" for m in all_results)
    ]
    print()
    print("  Every model correct on %d/%d problems." % (len(all_right), len(key)))

    if args.json:
        Path(args.json).write_text(json.dumps({
            m: {k: v for k, v in r.items() if k != "outcomes"} | {"outcomes": r["outcomes"]}
            for m, r in all_results.items()
        }, indent=1, default=str), encoding="utf-8")
        print("\n  wrote %s" % args.json)
    print()


if __name__ == "__main__":
    main()
