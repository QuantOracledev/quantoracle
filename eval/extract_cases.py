"""
extract_cases.py — pull the verification suite's test cases out as data.

tests/accuracy_benchmarks.py defines ~200 checks whose expected values come from
textbooks and published formulas, each with a citation. Those are exactly the
problems we want to pose to a language model: the answer key is already sourced.

Rather than run the suite (which issues HTTP calls), this strips out its own
check()/check_bool() definitions via AST surgery and substitutes collectors, so
the module-level check(...) calls become data instead of requests.

    python eval/extract_cases.py > eval/cases.json
"""

import ast
import json
import sys
from pathlib import Path

SUITE = Path(__file__).resolve().parent.parent / "tests" / "accuracy_benchmarks.py"

# Functions defined by the suite that we replace with our own collectors, or
# neutralise because they print/exit.
DROP = {"check", "check_bool", "report", "main"}

cases = []


def _collect(name, endpoint, category, payload, field_path, expected, tol, citation,
             method="POST", skip_reason=None, kind="numeric"):
    cases.append({
        "name": name,
        "endpoint": endpoint,
        "category": category,
        "payload": payload,
        "field_path": field_path,
        "expected": expected,
        "tol": tol,
        "citation": citation,
        "method": method,
        "skip_reason": skip_reason,
        "kind": kind,
    })


def check(name, endpoint, category, payload, field_path, expected, tol, citation,
          method="POST", skip_reason=None):
    _collect(name, endpoint, category, payload, field_path, expected, tol, citation,
             method, skip_reason, "numeric")


def check_bool(name, endpoint, category, payload, field_path, expected_bool, citation,
               method="POST", skip_reason=None):
    _collect(name, endpoint, category, payload, field_path, expected_bool, "bool", citation,
             method, skip_reason, "bool")


def main():
    src = SUITE.read_text(encoding="utf-8")
    tree = ast.parse(src)

    # Remove the suite's own definitions of the functions we're substituting, so
    # our collectors survive into the module-level calls.
    tree.body = [
        node for node in tree.body
        if not (isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in DROP)
    ]

    ns = {
        "__name__": "_suite_extract",   # keeps any if __name__ == "__main__" block dormant
        "check": check,
        "check_bool": check_bool,
        "report": lambda *a, **k: 0,
        "main": lambda *a, **k: 0,
        "print": lambda *a, **k: None,  # the suite prints banners as it goes
    }

    # The suite imports requests at the top; nothing should reach the network now
    # that check() is ours, but stub it so an import can't fail on a bare machine.
    import types
    stub = types.ModuleType("requests")

    def _boom(*a, **k):
        raise RuntimeError("extract_cases must not perform HTTP")

    stub.get = stub.post = _boom
    sys.modules.setdefault("requests", stub)

    try:
        exec(compile(tree, str(SUITE), "exec"), ns)
    except SystemExit:
        pass

    json.dump(cases, sys.stdout, indent=1, default=str)


if __name__ == "__main__":
    main()
