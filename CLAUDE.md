# Foundry Brain

Company Brain, built for the fab. Skill #1: **AI Yield Engineer**.

## Skill routing

- Fab yield drop, excursion diagnosis, hold-or-ship on lots → invoke **`/ai-yield-engineer`**
- Legacy name `/excursion-diagnosis` redirects to the same workflow

## Memory (optional)

Run **`/setup-gbrain`** once for cross-session memory. Each analysis is saved to
gbrain under `foundry-excursions/<id>` and rated via auto-eval + visualizer 👍/👎.

## Demo

Start the visualizer (persists outside agent sessions):

```bash
cd visualizer && npm run dev:start
```

After `/ai-yield-engineer` completes, open **http://localhost:3000** to replay the
investigation. Stop with `npm run dev:stop`.
