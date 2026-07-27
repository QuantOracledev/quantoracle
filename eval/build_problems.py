"""
build_problems.py — turn extracted verification cases into blind problem statements.

Two hard rules, because getting either wrong makes the eval worthless:

  1. NEVER include `name` or `citation` in a problem. Many test names contain the
     answer outright ("call delta = N(d1) = 0.7791"), and citations name the
     textbook value. Only endpoint + description + inputs + requested output go in.

  2. Be generous with conventions. If a model misses because it assumed percent
     instead of decimal, that measures prompt ambiguity, not capability — and an
     eval that flatters our own product is worse than no eval.

    python eval/build_problems.py            # writes eval/problems.json + .md
    python eval/build_problems.py --per 4    # cap N per category
"""

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CASES = ROOT / "eval" / "cases.json"
OPENAPI = ROOT / "openapi.json"

CONVENTIONS = """\
Conventions used throughout (assume these unless an input says otherwise):
- INPUT rates, volatilities and yields are DECIMALS, not percents (0.20 means 20%).
- OUTPUT scaling follows the requested field's name:
    * a field ending in `_pct` is in PERCENTAGE POINTS  (12.747 means 12.747%)
    * a field ending in `_bps` is in BASIS POINTS        (100.0 means 100bps)
    * every other field is a plain decimal / currency amount
- Time `T` and maturities are in YEARS. Periods `n` are in the unit implied by the rate.
- Volatility is annualised. Returns series are simple periodic returns unless named otherwise.
- Option pricing is Black-Scholes-Merton, European exercise, continuous compounding,
  with `q` the continuous dividend yield (0 if absent).
- Dotted paths index into nested output: `greeks.delta` is the `delta` key inside the
  `greeks` object; `coefficients.0` is the first element of the `coefficients` array;
  `retracement_levels.50.0%` is the key "50.0%" inside `retracement_levels`.
- Give the raw numeric value and do not round beyond what the calculation warrants.

If a unit convention still seems ambiguous, state your assumption and answer anyway —
answers that are numerically right but scaled by 100 are scored separately from wrong ones,
so an honest attempt is never worse than a null."""


def humanize(endpoint: str) -> str:
    tail = endpoint.replace("/v1/", "").replace("/", " / ").replace("-", " ")
    return tail


def load_openapi_desc():
    """endpoint -> a one-line description, if the spec has one."""
    out = {}
    try:
        spec = json.loads(OPENAPI.read_text(encoding="utf-8"))
    except Exception:
        return out
    for path, ops in spec.get("paths", {}).items():
        op = ops.get("post") or ops.get("get") or {}
        desc = op.get("description") or op.get("summary") or ""
        # summaries are opaque codes like "T1"; only keep real prose
        if desc and not (len(desc) <= 4 and desc[0].isalpha()):
            out[path] = desc.strip()
    return out


def build(case, descs):
    ep = case["endpoint"]
    desc = descs.get(ep, "")
    lines = [f"Compute: {humanize(ep)}"]
    if desc:
        lines.append(f"Definition: {desc}")
    lines.append(f"Inputs (JSON): {json.dumps(case['payload'], sort_keys=True)}")
    lines.append(f"Return this value: {case['field_path']}")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--per", type=int, default=4, help="max problems per category")
    args = ap.parse_args()

    cases = json.loads(CASES.read_text(encoding="utf-8"))
    descs = load_openapi_desc()

    usable = [
        c for c in cases
        if c["kind"] == "numeric" and c["expected"] is not None
        and not c["skip_reason"] and c["method"] == "POST"
        and isinstance(c["payload"], dict)
    ]

    # Tier the cases. The suite contains deliberate degenerate checks — all prices
    # identical so the Bollinger band is flat, y=2x so the regression slope is 2 —
    # which are right for unit-testing our own code and useless for telling models
    # apart. Everyone scores them. Kept, but reported separately so they can't
    # inflate the headline number.
    def is_trivial(c):
        e = c["expected"]
        if not isinstance(e, (int, float)):
            return False
        if float(e) in (0.0, 1.0, -1.0):
            return True
        scalars = [v for v in c["payload"].values() if isinstance(v, (int, float))]
        if any(abs(float(e) - float(v)) < 1e-12 for v in scalars):
            return True
        # perfectly constant or perfectly linear input series
        for v in c["payload"].values():
            if isinstance(v, list) and len(v) > 2 and all(isinstance(z, (int, float)) for z in v):
                if len(set(v)) == 1:
                    return True
        return False

    for c in usable:
        c["tier"] = "sanity" if is_trivial(c) else "core"

    # Stratify: up to --per per category, preferring CORE cases and distinct
    # endpoints, so we measure breadth rather than four Greeks off one option.
    by_cat, seen_ep = {}, {}
    for c in sorted(usable, key=lambda c: (c["tier"] != "core",)):
        cat = c["category"]
        bucket = by_cat.setdefault(cat, [])
        if len(bucket) >= args.per:
            continue
        n_ep = seen_ep.get((cat, c["endpoint"]), 0)
        if n_ep >= 2:          # at most 2 problems from any single endpoint
            continue
        bucket.append(c)
        seen_ep[(cat, c["endpoint"])] = n_ep + 1

    picked = [c for cat in sorted(by_cat) for c in by_cat[cat]]

    problems = []
    for i, c in enumerate(picked, 1):
        problems.append({
            "id": f"P{i:03d}",
            "category": c["category"],
            "endpoint": c["endpoint"],
            "field_path": c["field_path"],
            "prompt": build(c, descs),
            # answer key — kept out of anything shown to a solver
            "expected": c["expected"],
            "tol": c["tol"],
            "citation": c["citation"],
            "tier": c["tier"],
        })

    (ROOT / "eval" / "problems.json").write_text(
        json.dumps(problems, indent=1), encoding="utf-8")

    # Solver-facing file: NO expected / tol / citation.
    md = ["# Quantitative computation problems", "", CONVENTIONS, "",
          "Answer every problem. Show whatever working you like, but end with a single",
          "JSON object mapping each problem id to your numeric answer, e.g.",
          '`{"P001": 4.76, "P002": 0.7791}`. Use `null` if you cannot compute one.', ""]
    for p in problems:
        md.append(f"## {p['id']}  [{p['category']}]")
        md.append("```")
        md.append(p["prompt"])
        md.append("```")
        md.append("")
    (ROOT / "eval" / "problems.md").write_text("\n".join(md), encoding="utf-8")

    print(f"{len(problems)} problems across {len(by_cat)} categories")
    for cat in sorted(by_cat):
        print(f"  {cat:<16} {len(by_cat[cat])}")


if __name__ == "__main__":
    main()
