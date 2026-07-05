# Foundry Brain

Company Brain, built for the fab. **One brain + multiple skills (GStack model).**

## Architecture

| Layer | Path | Role |
| --- | --- | --- |
| **Brain** | `.claude/skills/foundry-brain/` | Shared MES/FDC/Metrology data + gbrain memory tools |
| **Platform** | `.claude/skills/gstack/` | GStack workflow platform |
| **Skills** | `ai-yield-engineer`, `hold-or-ship`, … | Fab capabilities on the shared brain |

## Skill routing

- Fab yield drop, excursion, hold-or-ship → **`/ai-yield-engineer`** (skill #1)
- “Foundry Brain” overview → **`/foundry-brain`**
- Legacy `/excursion-diagnosis` → redirects to `/ai-yield-engineer`

## Memory (optional)

Run **`/setup-gbrain`** once. Analyses save to gbrain `foundry-excursions/<id>`;
rated via auto-eval + visualizer 👍/👎. See `foundry-brain/SKILL.md`.

## Demo

```bash
cd visualizer && npm run seed-analyses   # copy fixture → public/analyses/
cd visualizer && npm run dev:start
```

After `/ai-yield-engineer`, open **http://localhost:3000**. Stop with `npm run dev:stop`.
