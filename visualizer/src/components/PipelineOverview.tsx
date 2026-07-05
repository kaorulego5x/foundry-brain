"use client";

import type { Table } from "@/lib/analysis";

interface Props {
  // the production-history table for this analysis — the pipeline is derived
  // from the actual process steps in it (kept static, no replay).
  mes: Table;
}

const STEP_ICON: Record<string, string> = {
  CVD: "🌫️",
  Etch: "⚡",
  CMP: "🪞",
};

export default function PipelineOverview({ mes }: Props) {
  // distinct process steps, in first-seen order (e.g. CVD → Etch → CMP)
  const steps: string[] = [];
  for (const r of mes.rows) {
    const s = r.cells.step;
    if (s && !steps.includes(s)) steps.push(s);
  }
  // the step where the failing lots went wrong, + the offending tool/chamber
  const culpritRow = mes.rows.find((r) => r.bad);
  const culpritStep = culpritRow?.cells.step;
  const culpritTool = culpritRow ? `${culpritRow.cells.eqp} / ${culpritRow.cells.chamber}` : "";

  const stages = [
    { name: "Wafer lot", icon: "⬜️", note: "enters the line" },
    ...steps.map((s) => ({ name: s, icon: STEP_ICON[s] ?? "⚙️", note: "" })),
    { name: "Inspection", icon: "🔬", note: "thickness & defects" },
  ];

  return (
    <>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">The fab pipeline</h2>
        <p className="text-xs text-slate-400">
          This lot runs {steps.length} process steps ({steps.join(" → ")}), then quality inspection. The excursion
          traced back to the <b className="text-amber-700">{culpritStep}</b> step.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {stages.map((s, i) => {
          const hot = s.name === culpritStep;
          return (
            <div key={s.name} className="flex items-center gap-1.5">
              <div
                className={`flex w-[120px] flex-col rounded-xl border p-3 ${
                  hot ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="text-2xl leading-none">{s.icon}</div>
                <div className={`mt-2 text-sm font-bold ${hot ? "text-amber-700" : "text-slate-800"}`}>{s.name}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-slate-400">
                  {hot ? `drift → ${culpritTool}` : s.note}
                </div>
              </div>
              {i < stages.length - 1 && (
                <div className="text-slate-300" aria-hidden>
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* compact reminder of the three record systems (full tables live in Raw Data) */}
      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Recorded along the way:</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">🏭 Production History · by lot</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">📡 Machine Sensors · by machine + time</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">🔬 Quality Inspection · by lot + wafer</span>
      </div>
    </>
  );
}
