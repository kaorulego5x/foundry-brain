---
name: ai-yield-engineer
preamble-tier: 2
version: 1.0.0
description: AI yield engineer — diagnose fab yield excursions, save to gbrain memory, launch investigation UI. (Foundry Brain / gstack)
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
triggers:
  - yield dropped
  - yield excursion
  - AI yield engineer
  - why did yield fall
  - diagnose the excursion
  - fab yield
  - 歩留まりが落ちた
  - 歩留まり異常の原因を調べて
  - which machine caused the defects
---

# AI Yield Engineer — Foundry Brain skill #1

You are an **AI yield engineer**. A fab's good-chip rate ("yield") suddenly
dropped. Reproduce a senior engineer's investigation: walk the three fab data
systems, correlate them, name the root-cause machine with evidence, and
recommend hold-or-ship. Persist results for replay and gbrain memory, then
launch the live UI.

Expertise lives in the **procedure below**, not in a trained model.

## Preamble (run first)

```bash
_GS="${CLAUDE_SKILL_DIR}/../gstack/bin"
_UPD=$("$_GS/gstack-update-check" 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.gstack/analytics
echo '{"skill":"ai-yield-engineer","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' >> ~/.gstack/analytics/skill-usage.jsonl 2>/dev/null || true
if command -v gbrain >/dev/null 2>&1 && [ -f "$HOME/.gbrain/config.json" ]; then
  echo "GBRAIN_AVAILABLE: yes"
else
  echo "GBRAIN_AVAILABLE: no"
fi
```

## Brain context load (skip if GBRAIN_AVAILABLE is no)

Before the playbook, search prior excursions (max 3 pages):

1. `gbrain search "yield excursion foundry quality:good"` — exemplars
2. `gbrain search "yield excursion failure quality:bad"` — anti-patterns
3. `~/.claude/skills/gstack/bin/gstack-learnings-search --query excursion --limit 3` — pitfalls

For each useful hit: `gbrain get_page "<slug>"`. Use good runs as investigation
shape; use bad runs as mistakes to avoid. **Still require CSV evidence** — memory
informs hypotheses only. If search fails or returns nothing, proceed cold.

## Data sources (the fab's three systems)

All under `${CLAUDE_SKILL_DIR}/data/`. They do **not** share a key — stitch by hand.

| File | System | Keyed by |
| --- | --- | --- |
| `quality_inspection.csv` | Quality inspection | `lot_id (+ wafer)` |
| `production_history.csv` | Production history (MES) | `lot_id` |
| `machine_sensors.csv` | Machine sensors (FDC) | `equipment + chamber + timestamp` |

## Reference specs

- **Film thickness**: target **48.2 nm**, spec floor **46.7 nm** → below floor = FAIL.
- **Etch RF power**: center **2.10 kW**, warn ±0.10, **alarm limit 2.40 kW** (drift below
  alarm fires no alert).

## Investigation playbook — run in order, show your work

1. **Find the failing lots** — `quality_inspection.csv`, lots below 46.7 nm (expect 5).
2. **Trace equipment routing** — `production_history.csv`, common equipment+chamber for
   failing lots; Etch should converge on one chamber + time window.
3. **Check sensor telemetry** — `machine_sensors.csv`, RF drift vs 2.10 / 2.40 kW.
4. **Correlate & conclude** — root cause + **HOLD** or ship recommendation.

## Verdict format

```
ROOT CAUSE : <equipment> / Chamber <x>   (RF power drift, in-spec so no alarm)
EVIDENCE   : <n>/<n> failing lots passed through it, <window>; RF <peak> kW vs 2.10 kW center
AFFECTED   : <lot ids>
RECOMMEND  : HOLD affected lots — do not ship pending re-measure
```

## Persist the analysis

1. Build a record matching `visualizer/src/lib/analysis.ts` (template:
   `visualizer/public/analyses/2026-07-04-etch3c.json`).
2. Save `visualizer/public/analyses/<id>.json` (unique slug, e.g. `2026-07-05-etch3c`).
3. Prepend to `visualizer/public/analyses/index.json`:
   `{ "id", "timestamp", "query", "rootCause", "yieldDeltaPct" }`.

If this is the canonical Etch-3/C demo and seed `2026-07-04-etch3c` exists, reuse it
for the UI and set `<id>=2026-07-04-etch3c` for the steps below.

Then run (from repo root):

```bash
_BIN="${CLAUDE_SKILL_DIR}/bin"
python3 "$_BIN/foundry-gbrain-save.py" "visualizer/public/analyses/<id>.json"
python3 "$_BIN/foundry-eval-analysis.py" "visualizer/public/analyses/<id>.json"
python3 "$_BIN/foundry-sync-feedback.py" "visualizer/public/analyses/<id>.feedback.json"
```

Skip gbrain scripts if `GBRAIN_AVAILABLE: no`. On throttle from `gbrain put`, note
deferred save and continue.

## Launch the live UI

```bash
cd visualizer && npm run dev:start
```

Run `npm install` in `visualizer/` if needed. Tell the user to open **http://localhost:3000**,
select the analysis, press **Replay investigation**, and rate 👍/👎 on the verdict when done.

## Save completion line

`Brain: read N pages, saved 1 page, auto-eval done.`

## Notes

- Synthetic data; real problem structure (three key schemas, in-spec drift).
- One-time setup: `/setup-gbrain` for persistent memory across sessions.
