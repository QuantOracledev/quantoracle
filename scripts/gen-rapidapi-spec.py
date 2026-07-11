#!/usr/bin/env python3
"""
Generate the API-marketplace OpenAPI spec (rapidapi/openapi.json).

Pulls the LIVE spec from https://api.quantoracle.dev/openapi.json and trims it
to the marketplace-listable surface:
  - keeps only /v1/* paths
  - drops /v1/watch* (stateful, priced per position — x402-only) and /v1/batch
    (up to 100 computations per request = plan-quota arbitrage — x402-only)
  - sets the public server URL (the gateway calls api.quantoracle.dev directly
    with the per-API proxy-secret header; the Worker routes it past x402)
  - rewrites title/description for the marketplace audience

Run:  D:/Quantcalc/venv/Scripts/python.exe D:/Quantcalc/scripts/gen-rapidapi-spec.py [local-spec.json]

Pass a local spec file as argv[1] to skip the network fetch (useful when the
public edge blocks the client — e.g. the WAF rate-limit rule from a load test).
"""
import json
import sys
import urllib.request
from pathlib import Path

SRC = "https://api.quantoracle.dev/openapi.json"
OUT = Path(__file__).resolve().parent.parent / "rapidapi" / "openapi.json"

EXCLUDE_PREFIXES = ("/v1/watch",)
EXCLUDE_EXACT = {"/v1/batch"}


def main() -> None:
    if len(sys.argv) > 1:
        spec = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8-sig"))
    else:
        spec = json.load(urllib.request.urlopen(SRC, timeout=30))

    kept, dropped = {}, []
    for path, ops in sorted(spec.get("paths", {}).items()):
        if (not path.startswith("/v1/")
                or path in EXCLUDE_EXACT
                or path.startswith(EXCLUDE_PREFIXES)):
            dropped.append(path)
            continue
        kept[path] = ops

    spec["paths"] = kept
    spec["servers"] = [{"url": "https://api.quantoracle.dev"}]
    spec["info"]["title"] = "QuantOracle — Quant Finance Calculations"
    spec["info"]["description"] = (
        "77 deterministic quantitative-finance endpoints: options pricing "
        "(Black-Scholes + 10 Greeks, implied vol, exotics), risk metrics "
        "(VaR/CVaR, Kelly, drawdown, stress tests), portfolio optimization, "
        "technical indicators, Monte Carlo simulation, fixed income, "
        "statistics (GARCH, Hurst, cointegration), crypto/DeFi (liquidation, "
        "impermanent loss, funding), FX, macro, and live crypto market data "
        "(real-time volatility + perp funding with historical percentile "
        "context). Pure computation — same inputs always return the same "
        "outputs. p50 latency ~70 ms."
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(spec, indent=1), encoding="utf-8")
    print(f"kept {len(kept)} paths -> {OUT}")
    print("dropped:", ", ".join(dropped) or "(none)")


if __name__ == "__main__":
    main()
