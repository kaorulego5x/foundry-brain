#!/usr/bin/env python3
"""Sync feedback.json quality tags to gbrain and gstack learnings."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) not in (2, 3):
        print("usage: foundry-sync-feedback.py <feedback.json> [analysis.json]", file=sys.stderr)
        return 2
    fb_path = Path(sys.argv[1])
    fb = json.loads(fb_path.read_text())
    aid = fb["analysis_id"]
    analysis_path = Path(sys.argv[2]) if len(sys.argv) == 3 else fb_path.with_name(f"{aid}.json")
    if not analysis_path.is_file():
        print(f"analysis not found: {analysis_path}", file=sys.stderr)
        return 1

    # Re-save analysis page with updated quality (reuse save script logic)
    data = json.loads(analysis_path.read_text())
    import importlib.util

    save_mod_path = Path(__file__).resolve().parent / "foundry-gbrain-save.py"
    spec = importlib.util.spec_from_file_location("foundry_gbrain_save", save_mod_path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    body_lines = mod.build_markdown(data).splitlines()
    # Replace quality line
    quality = fb.get("rating", "pending_review")
    out_lines = []
    for line in body_lines:
        if line.startswith("quality:"):
            out_lines.append(f"quality: {quality}")
        else:
            out_lines.append(line)
    tags = fb.get("failure_tags") or []
    if tags:
        out_lines.append("")
        out_lines.append(f"failure_tags: {json.dumps(tags)}")
    body = "\n".join(out_lines)

    slug = f"foundry-excursions/{aid}"
    try:
        subprocess.run(
            ["gbrain", "put", slug, "--content", body],
            check=True,
            capture_output=True,
            text=True,
        )
        print(f"gbrain updated: {slug} quality={quality}")
    except FileNotFoundError:
        print("gbrain not on PATH — skip", file=sys.stderr)
    except subprocess.CalledProcessError as e:
        print(e.stderr or str(e), file=sys.stderr)

    if fb.get("rating") == "bad":
        insight = fb.get("notes") or f"Excursion analysis {aid} rated bad"
        key = (tags[0] if tags else "excursion-analysis").replace(" ", "-")[:40]
        payload = json.dumps(
            {
                "skill": "ai-yield-engineer",
                "type": "pitfall",
                "key": key,
                "insight": insight[:500],
                "confidence": 7,
                "source": "observed",
            }
        )
        log_bin = Path.home() / ".claude/skills/gstack/bin/gstack-learnings-log"
        if log_bin.is_file():
            subprocess.run([str(log_bin), payload], check=False)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
