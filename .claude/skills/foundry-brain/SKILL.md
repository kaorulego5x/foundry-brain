---
name: foundry-brain
version: 1.0.0
description: |
  Foundry Brain — shared fab data spine (MES/FDC/Metrology) and gbrain memory.
  Route yield questions to /ai-yield-engineer. Other fab skills use the same
  data/ and bin/ under this directory. (Foundry Brain)
triggers:
  - foundry brain
  - fab brain
  - company brain for the fab
---

# Foundry Brain — shared brain layer

**One brain + multiple skills (GStack model).** This directory is the **brain**:
fab data and memory tools. Individual capabilities live in sibling skills
(`ai-yield-engineer`, `hold-or-ship`, …) that all read from here.

Aligned with [gstack + gbrain](https://github.com/garrytan/gstack/blob/master/USING_GBRAIN_WITH_GSTACK.md):
gstack = workflow platform; gbrain = persistent memory; **foundry-brain/data/** = fab
data spine (MES / FDC / Metrology).

## Paths (use in every fab skill)

```bash
FOUNDRY_BRAIN="${CLAUDE_SKILL_DIR}/../foundry-brain"
FOUNDRY_DATA="${FOUNDRY_BRAIN}/data"
FOUNDRY_BIN="${FOUNDRY_BRAIN}/bin"
```

From repo root: `.claude/skills/foundry-brain/data/`

## Route fab requests

| Request | Skill |
| --- | --- |
| Yield drop, excursion diagnosis, root cause, hold/ship | `/ai-yield-engineer` |
| Hold-or-ship disposition only (future) | `/hold-or-ship` |
| In-spec drift watch (future) | `/drift-watch` |
| Lot commonality (future) | `/commonality` |

## Data spine — three fab systems

Files under `${FOUNDRY_DATA}/`. Keys do **not** align — stitch by hand every time.

| File | System | Keyed by |
| --- | --- | --- |
| `quality_inspection.csv` | Quality inspection (Metrology) | `lot_id (+ wafer)` |
| `production_history.csv` | Production history (MES) | `lot_id` |
| `machine_sensors.csv` | Machine sensors (FDC) | `equipment + chamber + timestamp` |

### Reference specs (all fab skills)

- **Film thickness**: target **48.2 nm**, spec floor **46.7 nm** → below floor = FAIL.
- **Etch RF power**: center **2.10 kW**, warn ±0.10, **hard alarm 2.40 kW** (sub-alarm drift
  fires no alert).

## Memory — gbrain (optional)

Run `/setup-gbrain` once. Pages use slug prefix **`foundry-excursions/`** (analyses) and
**`foundry-patterns/`** (reusable lessons). Frontmatter **`quality:`** is `pending_review`,
`good`, `bad`, or `partial`.

### Brain context load (before any fab skill run)

Skip if `gbrain` not on PATH or `~/.gbrain/config.json` missing.

1. `gbrain search "yield excursion foundry"` — read up to 3 pages with `quality: good`
2. `gbrain search "yield excursion failure"` — anti-patterns with `quality: bad`
3. `gstack-learnings-search --query excursion --limit 3` — pitfalls

Memory **informs** hypotheses; CSV evidence is still required.

### Persist analysis + feedback (after a skill run)

From repo root, after writing `visualizer/public/analyses/<id>.json`:

```bash
python3 "${FOUNDRY_BIN}/foundry-gbrain-save.py" "visualizer/public/analyses/<id>.json"
python3 "${FOUNDRY_BIN}/foundry-eval-analysis.py" "visualizer/public/analyses/<id>.json"
python3 "${FOUNDRY_BIN}/foundry-sync-feedback.py" "visualizer/public/analyses/<id>.feedback.json"
```

Demo seed: `foundry-brain/fixtures/analyses/` → `npm run seed-analyses`.
