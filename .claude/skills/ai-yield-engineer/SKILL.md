---
name: ai-yield-engineer
preamble-tier: 2
version: 1.1.0
description: AI yield engineer — diagnose fab yield excursions using Foundry Brain data + memory, launch investigation UI. (Foundry Brain skill #1)
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

You are an **AI yield engineer**. A fab's yield suddenly dropped. Investigate using the
**shared Foundry Brain data spine** and **gbrain memory**, then recommend hold-or-ship
and launch the replay UI.

Expertise lives in the **procedure below**, not in a trained model.

## Shared brain (read first)

```bash
FOUNDRY_BRAIN="${CLAUDE_SKILL_DIR}/../foundry-brain"
FOUNDRY_DATA="${FOUNDRY_BRAIN}/data"
FOUNDRY_BIN="${FOUNDRY_BRAIN}/bin"
```

Follow **`foundry-brain/SKILL.md` § Brain context load** before investigating.
Follow **`foundry-brain/SKILL.md` § Data spine** for CSV paths and reference specs.

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
echo "FOUNDRY_DATA: ${FOUNDRY_DATA}"
```

## Investigation playbook — run in order, show your work

Read CSVs under `${FOUNDRY_DATA}/`. Do NOT jump to the answer.

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
   `.claude/skills/foundry-brain/fixtures/analyses/2026-07-04-etch3c.json`).
2. Save `visualizer/public/analyses/<id>.json` (gitignored runtime output).
3. Prepend to `visualizer/public/analyses/index.json`.

Canonical demo: `npm run seed-analyses` in `visualizer/`, or reuse `2026-07-04-etch3c`.

Then run **`foundry-brain/SKILL.md` § Persist analysis + feedback** using `${FOUNDRY_BIN}`.

## Launch the live UI

```bash
cd visualizer && npm run seed-analyses   # if public/analyses/ is empty
cd visualizer && npm run dev:start
```

Open **http://localhost:3000**, replay the investigation, rate 👍/👎 on the verdict.

## Save completion line

`Brain: read N pages, saved 1 page, auto-eval done.`
