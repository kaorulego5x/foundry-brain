# Analysis report schema

Human-readable counterpart to the JSON replay record
(`visualizer/public/analyses/<id>.json`). Same investigation, same `<id>`,
written as Markdown with four fixed sections: **Problem, Methodology, Output,
Insight**. Fill every field — do not omit a section.

Save filled reports as `.claude/skills/excursion-diagnosis/reports/<id>.md`,
where `<id>` matches the JSON record's `id` (e.g. `2026-07-04-etch3c`).

---

## Schema

```markdown
# <one-line title, e.g. "Etch-3 / Chamber C RF drift — 12% yield excursion">

- **id**: <slug, matches the JSON record id>
- **date**: <YYYY-MM-DD>
- **bay**: <fab/bay context, e.g. "Fab #2 · Etch Bay">
- **triggering query**: "<natural-language prompt that started the run>"

## Problem

- **Symptom**: <what alerted — yield delta, e.g. "-12% yield, 5 of 11 lots out of spec">
- **Scope**: <lots / wafers / time window affected>
- **Why it matters**: <exposure — $ at risk, wafers at risk, schedule impact>
- **Why it wasn't caught automatically**: <e.g. "drift stayed under the hard alarm limit">

## Methodology

Data sources walked, in order (one line per step — mirrors the investigation
playbook):

1. **<system, e.g. Quality Inspection>** — <what was queried, key filter/threshold used>
2. **<system, e.g. Production History>** — <what was queried, what was compared>
3. **<system, e.g. Machine Sensors>** — <what was queried, what was compared>
4. **Correlation** — <how the prior steps were combined into one conclusion>

Reference specs used: <spec name, target, floor/limit values>

## Output

- **Failing lots**: <list with key metric, e.g. thickness>
- **Common factor found**: <equipment + chamber + time window shared by all failing lots>
- **Sensor evidence**: <parameter, peak value, vs. center/alarm limits>
- **Root cause**: `<equipment / chamber>`
- **Confidence**: <%>

## Insight

- **Recommendation**: **HOLD** or **SHIP** — <affected lot ids>
- **Isolation order**: <id, action, fix>
- **Root-cause class**: <e.g. "in-spec drift below alarm threshold — monitoring gap, not equipment failure">
- **Generalizable lesson**: <what this teaches about the fab's monitoring/process for future excursions>
```

---

## Field notes

- **Problem** answers "what happened and why should anyone care" — no equipment
  names yet, just symptom and stakes.
- **Methodology** is the audit trail: which of the three systems (quality
  inspection, production history, sensors) were queried, in what order, and
  what threshold/comparison drove each step. This is what makes the
  conclusion verifiable by a human later.
- **Output** is the factual result of the methodology — tables/values found,
  stated plainly, before any recommendation.
- **Insight** is the one section allowed to go beyond this run's facts: the
  disposition call, and what it implies for the fab's monitoring going
  forward (e.g. "alarm bands should be tightened" is an insight, not an output).

## Worked example

See `reports/2026-07-04-etch3c.md` for a filled instance corresponding to the
seed JSON record `visualizer/public/analyses/2026-07-04-etch3c.json`.
