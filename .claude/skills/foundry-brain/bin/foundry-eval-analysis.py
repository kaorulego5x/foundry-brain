#!/usr/bin/env python3
"""Auto-evaluate an Analysis JSON against the canonical Etch-3/C mock scenario."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def eval_analysis(data: dict) -> dict:
    v = data.get("verdict", {})
    root = (v.get("rootCause") or "").lower()
    order = (v.get("isolationOrder", {}).get("action") or "").upper()
    affected = v.get("affectedLots", 0)
    checks = {
        "root_cause_etch3": "etch-3" in root and ("chamber c" in root or "/ c" in root or " e3c" in root or root.endswith(" c")),
        "affected_lots_5": affected == 5,
        "hold_recommended": "HOLD" in order,
    }
    matched = all(checks.values())
    return {
        "analysis_id": data["id"],
        "rating": "good" if matched else "bad",
        "reviewer": "auto",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "ground_truth_match": matched,
        "checks": checks,
        "failure_tags": [] if matched else ["ground-truth-mismatch"],
        "notes": "Auto-eval vs Etch-3/C canonical scenario",
    }


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: foundry-eval-analysis.py <analysis.json>", file=sys.stderr)
        return 2
    path = Path(sys.argv[1])
    data = json.loads(path.read_text())
    fb = eval_analysis(data)
    out = path.with_suffix(".feedback.json")
    out.write_text(json.dumps(fb, indent=2) + "\n")
    print(f"feedback: {fb['rating']} → {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
