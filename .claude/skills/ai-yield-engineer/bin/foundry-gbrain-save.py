#!/usr/bin/env python3
"""Write an Analysis JSON record to gbrain as foundry-excursions/<id>."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


def md_escape(s: str) -> str:
    return s.replace('"', "'")


def build_markdown(data: dict) -> str:
    vid = data["id"]
    v = data.get("verdict", {})
    alert = data.get("alert", {})
    steps = data.get("steps", [])
    failing = data.get("failingLots", [])
    lot_ids = ", ".join(x["id"] for x in failing)
    rec = "HOLD" if "HOLD" in v.get("isolationOrder", {}).get("action", "").upper() else "SHIP"

    lines = [
        "---",
        f'title: "Yield Excursion: {md_escape(v.get("rootCause", "unknown"))}"',
        "tags: [yield-excursion, foundry-brain, excursion-analysis]",
        f"analysis_id: {vid}",
        "quality: pending_review",
        f'root_cause: "{md_escape(v.get("rootCause", ""))}"',
        f"yield_delta_pct: {alert.get('yieldDeltaPct', 0)}",
        f"recommendation: {rec}",
        f'visualizer_replay: /analyses/{vid}.json',
        "---",
        "",
        f"## Query\n{data.get('query', '')}",
        "",
    ]
    for step in steps:
        lines += [
            f"## Step {step.get('n')} — {step.get('source')}",
            f"**{step.get('title')}** — {step.get('detail')}",
            "",
        ]
    lines += [
        "## Verdict",
        v.get("narrative", ""),
        "",
        f"- Root cause: {v.get('rootCause')}",
        f"- Confidence: {v.get('confidence')}%",
        f"- Affected lots: {lot_ids or v.get('affectedLots')}",
        f"- Recommendation: {rec}",
    ]
    return "\n".join(lines)


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: foundry-gbrain-save.py <analysis.json>", file=sys.stderr)
        return 2
    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"not found: {path}", file=sys.stderr)
        return 1
    data = json.loads(path.read_text())
    slug = f"foundry-excursions/{data['id']}"
    body = build_markdown(data)
    try:
        subprocess.run(
            ["gbrain", "put", slug, "--content", body],
            check=True,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError:
        print("gbrain not on PATH — skip", file=sys.stderr)
        return 0
    except subprocess.CalledProcessError as e:
        print(e.stderr or str(e), file=sys.stderr)
        return 1
    print(f"gbrain saved: {slug}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
