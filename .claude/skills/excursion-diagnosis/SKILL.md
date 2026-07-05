---
name: excursion-diagnosis
preamble-tier: 2
version: 1.0.0
description: AI yield engineer — diagnose a fab yield excursion across sensors, production history & inspection, then launch the live investigation UI. (Foundry Brain)
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - mcp__gbrain__search
  - mcp__gbrain__query
  - mcp__gbrain__get_page
  - mcp__gbrain__put_page
  - mcp__gbrain__add_tag
  - mcp__gbrain__add_timeline_entry
  - mcp__gbrain__log_ingest
triggers:
  - yield dropped
  - yield excursion
  - why did yield fall
  - diagnose the excursion
  - 歩留まりが落ちた
  - 歩留まり異常の原因を調べて
  - which machine caused the defects
---

# Excursion Diagnosis — Foundry Brain skill #1

You are an **AI yield engineer**. A fab's good-chip rate ("yield") suddenly
dropped. Reproduce a senior engineer's investigation: walk the three fab data
systems, correlate them, name the root-cause machine with evidence, and
recommend hold-or-ship. Then launch the live UI so the operator can watch the
same investigation replay.

This skill embodies the Foundry Brain thesis: the expertise lives in the
**procedure below**, not in a trained model. It runs by reading live data and
reasoning, step by step.

## Data sources (the fab's three systems)

All under `${CLAUDE_SKILL_DIR}/data/`. They do **not** share a key — that is the
whole problem; you must stitch them by hand, every time.

| File | System | Keyed by |
| --- | --- | --- |
| `quality_inspection.csv` | Quality inspection — film thickness & verdict per lot | `lot_id (+ wafer)` |
| `production_history.csv` | Production history (MES) — which lot ran on which tool/chamber, when | `lot_id` |
| `machine_sensors.csv` | Machine sensors (FDC) — tool telemetry over time, **no lot id** | `equipment + chamber + timestamp` |

## Reference specs (needed to judge in/out of range)

- **Film thickness**: target **48.2 nm**, spec floor **46.7 nm** → below floor = FAIL.
- **Etch RF power**: process center **2.10 kW**, warn band ±0.10, **hard alarm limit 2.40 kW**.
  A drift that stays under 2.40 kW fires **no alarm** — this is why the excursion
  slipped through automated monitoring.

## Check brain memory first

If `mcp__gbrain__search` is available, search for prior excursions before
querying the CSVs: `mcp__gbrain__search("<symptom> <suspected step, e.g. etch RF drift>")`.
If a hit looks relevant, `mcp__gbrain__get_page` its slug and read it. Cite the
slug in your narration if it changes what you look for (e.g. "excursions/2026-07-04-etch3c
shows Etch-3/C has drifted before — checking it first"). If the tool errors,
isn't connected, or returns nothing useful, proceed straight to the playbook —
this is a nice-to-have, not a dependency.

## Investigation playbook — run in order, show your work

Do NOT jump to the answer. Query one system at a time and narrate each result,
because the point of Foundry Brain is that the reasoning is auditable.

1. **Find the failing lots** — read `quality_inspection.csv`. List every lot with
   `mean_thk_nm` below the 46.7 nm floor. (Expect 5 lots.)
2. **Trace equipment routing** — read `production_history.csv`, filter to the
   failing lots, and group by `step, equipment, chamber`. Look for what ALL
   failing lots share and what the passing lots do NOT. Confirm CVD and CMP show
   no common tool, but Etch converges on a single **equipment + chamber**. Note
   the time window the failing lots occupied it.
3. **Check sensor telemetry** — read `machine_sensors.csv`, scope to that
   equipment+chamber over that window, and inspect `rf_power_kw`. Compare against
   the 2.10 kW center and the 2.40 kW alarm limit. Confirm a drift that is out of
   process band but under the alarm limit (so no alert fired).
4. **Correlate & conclude** — state the root cause (one chamber accounts for
   100% of failures; RF drift co-occurs with the under-spec thickness). Give a
   one-line disposition recommendation: **HOLD** the affected lots vs. ship.

## Verdict format

Print a compact verdict card:

```
ROOT CAUSE : <equipment> / Chamber <x>   (RF power drift, in-spec so no alarm)
EVIDENCE   : <n>/<n> failing lots passed through it, <window>; RF <peak> kW vs 2.10 kW center
AFFECTED   : <lot ids>
RECOMMEND  : HOLD affected lots — do not ship pending re-measure
```

## Persist the analysis (so it can be replayed later)

The visualizer UI replays **saved analysis records**. After concluding, write this run
into the history store so it appears in the UI's "Replay analysis" selector:

1. Build a record matching the `Analysis` schema in
   `visualizer/src/lib/analysis.ts`. Use the existing
   `visualizer/public/analyses/2026-07-04-etch3c.json` as a template and fill it with
   THIS run's findings (tables you queried, failing lots, steps, fab-floor
   routing, RF series, suspects, verdict).
2. Save it as `visualizer/public/analyses/<id>.json` where `<id>` is a slug like
   `2026-07-05-<culprit>` (keep it unique — do not overwrite an existing record).
3. Prepend a summary entry to `visualizer/public/analyses/index.json`:
   `{ "id", "timestamp", "query", "rootCause", "yieldDeltaPct" }`.
4. Also write a human-readable Markdown report using the schema in
   `templates/analysis-report.md` (four fixed sections: Problem, Methodology,
   Output, Insight). Save it as `reports/<id>.md` with the same `<id>` as the
   JSON record — see `reports/2026-07-04-etch3c.md` for a filled example.

If the current run is just the canonical Etch-3/C scenario, the seed record
already exists — skip 1-4 and reuse it, but still do the gbrain write-through
below (idempotent: reuse the same `<id>`).

## Store in gbrain (long-term vector memory)

Steps 1-4 above persist to the repo for the *UI* to replay. This step persists
to **gbrain** so the finding is semantically searchable across sessions and by
sibling Foundry Brain skills (Hold-or-Ship, Drift Watch, Commonality) — this is
what makes the brain accumulate memory instead of resetting every run.

1. **Save the page** — call `mcp__gbrain__put_page` with:
   - `slug`: `excursions/<id>` (same `<id>` as the JSON/Markdown records)
   - `content`: the full Markdown report from `reports/<id>.md`, with YAML
     frontmatter prepended:
     ```yaml
     ---
     title: "Excursion: <equipment>/<chamber> — <one-line root cause>"
     tags: [excursion-diagnosis, <culprit-slug, e.g. etch-3-c>, <hold|ship>]
     ---
     ```
   - `source_kind`: `"excursion-diagnosis"`
2. **Tag for correlation** — `mcp__gbrain__add_tag` on `excursions/<id>` with
   the culprit equipment/chamber slug (e.g. `etch-3-c`), so every excursion
   ever traced to that tool clusters under one tag.
3. **Timeline entry** — `mcp__gbrain__add_timeline_entry` on `excursions/<id>`
   with `date` = the alert date, `summary` = the one-line verdict, `detail` =
   the evidence line (lots affected, RF peak vs. center), `source` =
   `"excursion-diagnosis"`.
4. **Log the ingestion** — `mcp__gbrain__log_ingest` with `source_type`:
   `"excursion-diagnosis"`, `source_ref`: `<id>`, `pages_updated`:
   `["excursions/<id>"]`, `summary`: the one-line verdict.
5. **Equipment stub (first time only)** — `mcp__gbrain__search` for
   `equipment/<culprit-slug>`. If no page exists, `mcp__gbrain__put_page` a
   stub (`tags: [entity, equipment]`, one line: "Mentioned in
   excursion-diagnosis run `<id>`. Replace with full tool profile when
   relevant.") so future excursions on the same tool have somewhere to link.

**Error handling**: any `mcp__gbrain__*` call failing (not connected,
throttled, transient error) is non-fatal — the JSON/Markdown records already
exist regardless, so nothing is lost. Note it in the completion summary below
and move on; do not retry inline.

**Completion summary** — end your investigation output with one line, e.g.:
"Brain: read 1 prior excursion, saved 1 page (`excursions/<id>`), tagged
`etch-3-c`, 0 throttles."

## Launch the live UI

Start the Foundry Brain visualization so the operator can watch the same steps
replay:

```bash
cd visualizer && (npm run dev >/tmp/foundry-brain-visualizer.log 2>&1 &) && sleep 3 && echo "→ open http://localhost:3000"
```

- If dependencies are missing, run `npm install` in `visualizer/` first.
- `visualizer/AGENTS.md` notes this is a modified Next.js — do not edit visualizer source as
  part of this skill; only run it and write JSON records under `visualizer/public/`.
- Tell the user to open **http://localhost:3000**, pick this run from the
  **Replay analysis** selector, and press **Replay investigation**; the UI walks
  the same four steps (Inspection → Production History → Sensors → Correlation →
  Verdict) you just reasoned through.

## Notes

- The data is synthetic, but the *structure* of the problem is real: three
  disconnected key schemas, and a root cause that hides as an in-spec drift.
- This is skill #1 of the Foundry Brain suite. As the brain accumulates memory,
  sibling skills (Hold-or-Ship disposition, Drift Watch, Commonality) run on the
  same three-system data spine.
