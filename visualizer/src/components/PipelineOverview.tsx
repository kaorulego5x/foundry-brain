"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Table, FailingLot } from "@/lib/analysis";
import {
  WaferIcon,
  CvdIcon,
  EtchIcon,
  CmpIcon,
  CogIcon,
  InspectIcon,
  CheckIcon,
  FactoryIcon,
  SensorIcon,
} from "./icons";

interface Props {
  // the production-history table for this analysis — the pipeline and the
  // per-chamber breakdown are both derived from the actual process rows.
  mes: Table;
  failingLots: FailingLot[];
}

const STEP_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  CVD: CvdIcon,
  Etch: EtchIcon,
  CMP: CmpIcon,
};

interface StationGroup {
  key: string; // "Etch-3 / C"
  lots: string[];
  badLots: string[];
}

interface Stage {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  note: string;
  kind: "lot" | "step" | "inspect";
}

const INTRO_TICK_MS = 550;

export default function PipelineOverview({ mes, failingLots }: Props) {
  // distinct process steps, in first-seen order (e.g. CVD → Etch → CMP)
  const { steps, groupsByStep, lotCount, culpritStep, culpritTool } = useMemo(() => {
    const steps: string[] = [];
    const groupsByStep = new Map<string, Map<string, StationGroup>>();
    const lots = new Set<string>();
    for (const r of mes.rows) {
      const step = r.cells.step;
      if (!step) continue;
      if (!steps.includes(step)) steps.push(step);
      lots.add(r.cells.lot);
      const key = `${r.cells.eqp} / ${r.cells.chamber}`;
      if (!groupsByStep.has(step)) groupsByStep.set(step, new Map());
      const g = groupsByStep.get(step)!;
      if (!g.has(key)) g.set(key, { key, lots: [], badLots: [] });
      g.get(key)!.lots.push(r.cells.lot);
      if (r.bad) g.get(key)!.badLots.push(r.cells.lot);
    }
    const culpritRow = mes.rows.find((r) => r.bad);
    return {
      steps,
      groupsByStep,
      lotCount: lots.size,
      culpritStep: culpritRow?.cells.step ?? null,
      culpritTool: culpritRow ? `${culpritRow.cells.eqp} / ${culpritRow.cells.chamber}` : "",
    };
  }, [mes]);

  const stages: Stage[] = useMemo(
    () => [
      { name: "Wafer lot", icon: WaferIcon, note: "enters the line", kind: "lot" },
      ...steps.map((s) => ({
        name: s,
        icon: STEP_ICON[s] ?? CogIcon,
        note: "",
        kind: "step" as const,
      })),
      { name: "Inspection", icon: InspectIcon, note: "thickness & defects", kind: "inspect" },
    ],
    [steps],
  );

  // Intro: a pulse walks the line left→right once, then the culprit stage is
  // selected so the chamber breakdown is visible without any clicks.
  const [pulseIdx, setPulseIdx] = useState(0); // starts on the first stage
  const [selected, setSelected] = useState<string | null>(null);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (introDone) return;
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      if (i >= stages.length) {
        clearInterval(t);
        setPulseIdx(-1);
        setIntroDone(true);
        setSelected((prev) => prev ?? culpritStep ?? "Inspection");
      } else {
        setPulseIdx(i);
      }
    }, INTRO_TICK_MS);
    return () => clearInterval(t);
  }, [stages.length, culpritStep, introDone]);

  const select = (name: string) => {
    setIntroDone(true);
    setPulseIdx(-1);
    setSelected((prev) => (prev === name ? null : name));
  };

  const selectedStage = stages.find((s) => s.name === selected) ?? null;

  return (
    <>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">The fab pipeline</h2>
        <p className="text-xs text-slate-400">
          This lot runs {steps.length} process steps ({steps.join(" → ")}), then quality inspection.
          The excursion traced back to the <b className="text-amber-700">{culpritStep}</b>{" "}step —
          click a stage to see which machine &amp; chamber ran it.
        </p>
      </div>

      {/* stage cards — fluid widths so the row breathes with the window */}
      <div className="flex flex-wrap items-stretch gap-x-1.5 gap-y-3">
        {stages.map((s, i) => {
          const Icon = s.icon;
          const hot = s.name === culpritStep;
          const isSelected = selected === s.name;
          const pulsing = pulseIdx === i;
          return (
            <div key={s.name} className="flex min-w-0 flex-1 basis-28 items-stretch gap-1.5">
              <motion.button
                type="button"
                onClick={() => select(s.name)}
                initial={false}
                animate={{
                  borderColor: pulsing
                    ? "#6366f1"
                    : isSelected
                    ? hot
                      ? "#f59e0b"
                      : "#6366f1"
                    : hot
                    ? "#fcd34d"
                    : "#e2e8f0",
                  backgroundColor: pulsing
                    ? "rgba(99,102,241,0.08)"
                    : hot
                    ? "#fffbeb"
                    : "#ffffff",
                  scale: pulsing ? 1.04 : 1,
                }}
                whileHover={{ y: -2, boxShadow: "0 6px 16px rgba(15,23,42,0.08)" }}
                whileTap={{ scale: 0.98 }}
                className={`flex w-full min-w-[104px] cursor-pointer flex-col rounded-xl border-2 p-3 text-left ${
                  isSelected ? "shadow-md" : "shadow-sm"
                }`}
              >
                <Icon className={`h-6 w-6 ${hot ? "text-amber-600" : "text-slate-500"}`} />
                <div className={`mt-2 text-sm font-bold ${hot ? "text-amber-700" : "text-slate-800"}`}>
                  {s.name}
                </div>
                <div className="mt-0.5 text-[11px] leading-snug text-slate-400">
                  {hot ? (
                    <span className="font-semibold text-amber-600">drift → {culpritTool}</span>
                  ) : (
                    s.note || " "
                  )}
                </div>
              </motion.button>
              {i < stages.length - 1 && (
                <motion.svg
                  viewBox="0 0 24 24"
                  initial={false}
                  animate={{ color: pulseIdx === i ? "#6366f1" : "#cbd5e1" }}
                  className="h-4 w-4 shrink-0 self-center"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M4 12h16M13 5l7 7-7 7" />
                </motion.svg>
              )}
            </div>
          );
        })}
      </div>

      {/* drill-down: what actually ran the selected stage */}
      <AnimatePresence mode="wait">
        {selectedStage && (
          <motion.div
            key={selectedStage.name}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 20 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <StageDetail
              stage={selectedStage}
              groups={[...(groupsByStep.get(selectedStage.name)?.values() ?? [])]}
              failingLots={failingLots}
              lotCount={lotCount}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* compact reminder of the three record systems (full tables live in Raw Data) */}
      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Recorded along the way:</span>
        <RecordChip icon={FactoryIcon} label="Production History · by lot" />
        <RecordChip icon={SensorIcon} label="Machine Sensors · by machine + time" />
        <RecordChip icon={InspectIcon} label="Quality Inspection · by lot + wafer" />
      </div>
    </>
  );
}

function RecordChip({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      {label}
    </span>
  );
}

/* ---------------- stage drill-down panel ---------------- */

function StageDetail({
  stage,
  groups,
  failingLots,
  lotCount,
}: {
  stage: Stage;
  groups: StationGroup[];
  failingLots: FailingLot[];
  lotCount: number;
}) {
  if (stage.kind === "lot") {
    return (
      <Panel title="Wafer lots on the line">
        <p className="text-sm text-slate-600">
          <b className="font-mono">{lotCount}</b> lots entered the line this shift; each carries 25
          wafers through every process step below.
        </p>
      </Panel>
    );
  }

  if (stage.kind === "inspect") {
    return (
      <Panel title="Final inspection — where the problem was detected">
        <p className="mb-3 text-sm text-slate-600">
          <b className="font-mono text-red-600">{failingLots.length}</b> of{" "}
          <b className="font-mono">{lotCount}</b> lots failed the thickness spec here. Detection
          happens at the end of the line — the cause sits upstream.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {failingLots.map((f) => (
            <span
              key={f.id}
              className="rounded-md bg-red-100 px-2 py-1 font-mono text-[11px] font-medium text-red-700"
            >
              {f.id} · {f.yieldPct}%
            </span>
          ))}
        </div>
      </Panel>
    );
  }

  // Process step: chamber-level breakdown — the "which chamber did it" view.
  const anyBad = groups.some((g) => g.badLots.length > 0);
  return (
    <Panel
      title={`${stage.name} equipment — chamber breakdown`}
      sub={
        anyBad
          ? "every chamber that ran lots this shift; the root-cause chamber is locked in red"
          : "every chamber that ran lots this shift — no anomaly at this step"
      }
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups.map((g, i) => {
          const isCulprit = g.badLots.length > 0;
          return (
            <motion.div
              key={g.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border-2 p-3 ${
                isCulprit ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-sm font-bold ${
                    isCulprit ? "text-red-700" : "text-slate-700"
                  }`}
                >
                  {g.key}
                </span>
                {isCulprit ? (
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    root cause
                  </span>
                ) : (
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                    <CheckIcon className="h-2.5 w-2.5" />
                    clear
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {g.lots.length} lot{g.lots.length === 1 ? "" : "s"} ran here
                {isCulprit && (
                  <b className="text-red-600">
                    {" "}
                    — {g.badLots.length}/{g.lots.length} failed
                  </b>
                )}
              </div>
              {isCulprit && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {g.badLots.map((l) => (
                    <span
                      key={l}
                      className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-red-700"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Panel>
  );
}

function Panel({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <div className="text-sm font-bold text-slate-800">{title}</div>
        {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
      </div>
      {children}
    </div>
  );
}
