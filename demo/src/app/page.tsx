"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WaferMap from "@/components/WaferMap";
import FabFloor from "@/components/FabFloor";
import RfChart from "@/components/RfChart";
import VerdictCard from "@/components/VerdictCard";
import DataTable from "@/components/DataTable";
import {
  METROLOGY,
  METROLOGY_COLS,
  MES,
  MES_COLS,
  FDC_ETCH3C,
  FDC_COLS,
  type Row,
  type RowState,
} from "@/lib/demo-data";

type Scene = "overview" | "inspect" | "trace" | "sensor" | "verdict";

const FAILING = [
  { id: "LOT-0703", y: 66 },
  { id: "LOT-0704", y: 63 },
  { id: "LOT-0707", y: 68 },
  { id: "LOT-0708", y: 62 },
  { id: "LOT-0711", y: 70 },
];

// The three fab systems Foundry Brain reads across — plain names, no jargon.
const SOURCES = [
  { id: "MES", name: "Production History", gloss: "which lot ran where & when", icon: "🏭" },
  { id: "FDC", name: "Machine Sensors", gloss: "temp · pressure · power", icon: "📡" },
  { id: "MET", name: "Quality Inspection", gloss: "thickness & defects", icon: "🔬" },
] as const;

type SourceId = (typeof SOURCES)[number]["id"] | "all" | null;

function activeSource(scene: Scene): SourceId {
  switch (scene) {
    case "inspect":
      return "MET";
    case "trace":
      return "MES";
    case "sensor":
      return "FDC";
    case "verdict":
      return "all";
    default:
      return null;
  }
}

interface Step {
  n: number;
  source: string;
  title: string;
  detail: string;
  scene: Scene;
  durationMs: number;
}

const STEPS: Step[] = [
  {
    n: 1,
    source: "Quality Inspection",
    title: "Find the failing lots",
    detail: "5 lots below thickness spec (45 nm vs 48.2 nm target)",
    scene: "inspect",
    durationMs: 4200,
  },
  {
    n: 2,
    source: "Production History",
    title: "Trace equipment history",
    detail: "Checked CVD, Etch, CMP — all 5 share Etch-3/C, 10:00–12:00",
    scene: "trace",
    durationMs: 4600,
  },
  {
    n: 3,
    source: "Machine Sensors",
    title: "Check sensor telemetry",
    detail: "RF power drifted to 2.31 kW — under alarm limit, no alert fired",
    scene: "sensor",
    durationMs: 4600,
  },
  {
    n: 4,
    source: "Correlation",
    title: "Correlate & conclude",
    detail: "1 chamber = 100% of failures, RF drift ↔ thickness (r² = 0.91)",
    scene: "verdict",
    durationMs: 2200,
  },
];

type Tab = "data" | "investigation";

export default function Home() {
  const [tab, setTab] = useState<Tab>("data");
  const [scene, setScene] = useState<Scene>("overview");
  const [current, setCurrent] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const run = useCallback(async () => {
    if (isRunning) return;
    setTab("investigation");
    setIsRunning(true);
    setIsComplete(false);
    setCurrent(-1);
    setScene("overview");
    await new Promise((r) => setTimeout(r, 900));

    for (let i = 0; i < STEPS.length; i++) {
      setCurrent(i);
      setScene(STEPS[i].scene);
      await new Promise((r) => setTimeout(r, STEPS[i].durationMs));
    }
    setIsComplete(true);
    setIsRunning(false);
  }, [isRunning]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsComplete(false);
    setCurrent(-1);
    setScene("overview");
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[var(--background)]">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            FB
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-900">
            Foundry Brain
          </h1>
          <span className="ml-1 text-xs text-slate-400">
            built for the semiconductor fab
          </span>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
          Fab #2 · Etch Bay
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* narration / control */}
        <aside className="flex w-[380px] shrink-0 flex-col border-r border-slate-200 bg-white p-5">
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Yield alert
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-red-600">−12%</span>
              <span className="text-sm text-slate-500">line yield, today</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              2026-07-04 · 5 of 11 lots out of spec
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {STEPS.map((s, i) => {
              const state =
                current > i || (isComplete && current >= i)
                  ? "done"
                  : current === i
                  ? "active"
                  : "idle";
              return <StepRow key={s.n} step={s} state={state} />;
            })}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            {!isRunning && !isComplete && (
              <button
                onClick={run}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                ▶ Start investigation
              </button>
            )}
            {isRunning && (
              <div className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-indigo-600">
                <span className="h-2 w-2 animate-ping rounded-full bg-indigo-500" />
                Investigating…
              </div>
            )}
            {isComplete && (
              <button
                onClick={reset}
                className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                ↺ Run again
              </button>
            )}
          </div>
        </aside>

        {/* canvas */}
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {/* tabs */}
          <div className="flex shrink-0 border-b border-slate-200 bg-white px-6 pt-3">
            {(["data", "investigation"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => !isRunning && setTab(t)}
                className={`relative px-4 pb-2.5 text-sm font-semibold transition ${
                  tab === t
                    ? "text-indigo-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t === "data" ? "Raw Data" : "Investigation"}
                {tab === t && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6">
            <AnimatePresence mode="wait">
              {tab === "data" ? (
                <motion.div
                  key="data"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-1 flex-col"
                >
                  <RawDataView />
                </motion.div>
              ) : (
                <motion.div
                  key="investigation"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-1 flex-col"
                >
                  <SourceRail active={activeSource(scene)} />
                  <SceneView scene={scene} />
                  {isComplete && (
                    <div className="mt-5">
                      <VerdictCard visible={isComplete} />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------------- sidebar step row ---------------- */

function StepRow({
  step,
  state,
}: {
  step: Step;
  state: "idle" | "active" | "done";
}) {
  return (
    <div
      className={`rounded-xl border p-3 transition-colors ${
        state === "active"
          ? "border-indigo-300 bg-indigo-50"
          : state === "done"
          ? "border-slate-200 bg-white"
          : "border-slate-100 bg-slate-50/60"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
            state === "done"
              ? "bg-emerald-500 text-white"
              : state === "active"
              ? "bg-indigo-600 text-white"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {state === "done" ? "✓" : step.n}
        </span>
        <span
          className={`text-sm font-semibold ${
            state === "idle" ? "text-slate-400" : "text-slate-800"
          }`}
        >
          {step.title}
        </span>
        <span className="ml-auto font-mono text-[10px] text-slate-400">
          {step.source}
        </span>
      </div>
      {state !== "idle" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 pl-7 text-xs leading-relaxed text-slate-500"
        >
          {step.detail}
        </motion.p>
      )}
    </div>
  );
}

/* ---------------- cross-system access rail ---------------- */

function SourceRail({ active }: { active: SourceId }) {
  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-white">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-xs font-bold">
          FB
        </span>
        <div className="leading-tight">
          <div className="text-sm font-bold">Foundry Brain</div>
          <div className="text-[10px] text-indigo-200">reads across every system</div>
        </div>
      </div>

      <div className="text-slate-300">⇄</div>

      <div className="flex flex-1 gap-2">
        {SOURCES.map((s) => {
          const on = active === s.id || active === "all";
          return (
            <motion.div
              key={s.id}
              animate={{
                borderColor: on ? "#6366f1" : "#e2e8f0",
                backgroundColor: on ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0)",
              }}
              className="flex flex-1 items-center gap-2 rounded-xl border px-3 py-2"
            >
              <span className="text-lg">{s.icon}</span>
              <div className="leading-tight">
                <div
                  className={`text-sm font-semibold ${
                    on ? "text-indigo-700" : "text-slate-700"
                  }`}
                >
                  {s.name}
                </div>
                <div className="text-[10px] text-slate-400">{s.gloss}</div>
              </div>
              {on && (
                <motion.span
                  layoutId="active-dot"
                  className="ml-auto flex items-center gap-1 text-[10px] font-medium text-indigo-600"
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                  querying
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- shared bits ---------------- */

function Chip({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "red" | "amber" | "indigo";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };
  return (
    <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function QueryBar({
  source,
  query,
  input,
}: {
  source: string;
  query: string;
  input?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-slate-300">
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-300">
          query
        </span>
        <span className="text-[11px] text-slate-500">{source}</span>
      </div>
      <code className="block whitespace-pre-wrap leading-relaxed text-emerald-300">
        {query}
      </code>
      {input && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-700 pt-2 text-[11px] text-slate-500">
          <span>input from prev step:</span>
          {input}
        </div>
      )}
    </div>
  );
}

function ResultBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
      <span className="font-semibold">→ result:</span>
      {children}
    </div>
  );
}

/* Analysis panel: table on the left "scans" then highlights matching rows. */
function useScan(resolveMs = 1500) {
  const [scanning, setScanning] = useState(true);
  useEffect(() => {
    setScanning(true);
    const t = setTimeout(() => setScanning(false), resolveMs);
    return () => clearTimeout(t);
  }, [resolveMs]);
  return scanning;
}

/* ---------------- scenes ---------------- */

function SceneTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-4">
      <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">
        {kicker}
      </div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
  );
}

function SceneView({ scene }: { scene: Scene }) {
  if (scene === "overview") return <OverviewScene />;
  if (scene === "inspect") return <InspectScene />;
  if (scene === "trace") return <TraceScene />;
  if (scene === "sensor") return <SensorScene />;
  return <VerdictScene />;
}

function RawDataView() {
  const silos = [
    {
      icon: "🏭",
      name: "Production History",
      desc: "Which lot ran on which machine & chamber, and when",
      keyCols: "identified by: lot number",
      cols: MES_COLS,
      rows: MES,
      tone: "border-violet-200",
    },
    {
      icon: "📡",
      name: "Machine Sensors",
      desc: "Temperature, pressure & power from every machine, over time",
      keyCols: "identified by: machine + chamber + timestamp",
      cols: FDC_COLS,
      rows: FDC_ETCH3C,
      tone: "border-amber-200",
    },
    {
      icon: "🔬",
      name: "Quality Inspection",
      desc: "Film thickness & defect measurements per lot",
      keyCols: "identified by: lot number + wafer",
      cols: METROLOGY_COLS,
      rows: METROLOGY,
      tone: "border-sky-200",
    },
  ];
  return (
    <>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">The fab&apos;s data</h2>
        <p className="text-xs text-slate-400">
          3 separate systems — each identifies its records differently, so they
          don&apos;t line up on their own
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {silos.map((s) => (
          <div
            key={s.name}
            className={`rounded-2xl border ${s.tone} bg-white p-4 shadow-sm`}
          >
            <div className="mb-0.5 flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <span>{s.icon}</span>
              {s.name}
            </div>
            <div className="text-xs text-slate-400">{s.desc}</div>
            <div className="mt-1 mb-3 font-mono text-[10px] text-slate-400">
              {s.keyCols}
            </div>
            <DataTable
              columns={s.cols}
              rows={s.rows}
              rowState={() => "normal" as RowState}
              scanning={false}
            />
          </div>
        ))}
      </div>
    </>
  );
}

function OverviewScene() {
  return (
    <>
      <SceneTitle
        kicker="Ready"
        title="Press Start to begin investigation"
      />
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <FabFloor mode="flows" />
      </div>
    </>
  );
}

function InspectScene() {
  const scanning = useScan(1600);
  return (
    <>
      <SceneTitle
        kicker="Step 1 · Quality Inspection"
        title="Find failing lots"
      />
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="min-w-0 flex-1">
          <QueryBar
            source="Quality Inspection"
            query={"WHERE mean_thk < 46.7 nm"}
          />
          <div className="mt-3">
            <DataTable
              columns={METROLOGY_COLS}
              rows={METROLOGY}
              rowState={(r: Row) => (r.bad ? "hit" : "dim")}
              scanning={scanning}
            />
          </div>
          {!scanning && (
            <ResultBar>
              <Chip tone="red">5 lots</Chip>
              <span>under-etched →</span>
              {FAILING.map((f) => (
                <Chip key={f.id} tone="red">
                  {f.id}
                </Chip>
              ))}
            </ResultBar>
          )}
        </div>
        <div className="lg:w-[360px]">
          <div className="mb-2 text-xs font-semibold text-slate-400">
            wafer maps · failing lots
          </div>
          <div className="grid grid-cols-3 gap-2">
            {FAILING.map((f, i) => (
              <WaferMap key={f.id} lotId={f.id} bad yieldPct={f.y} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function TraceScene() {
  const scanning = useScan(1600);
  return (
    <>
      <SceneTitle
        kicker="Step 2 · Production History"
        title="Trace equipment routes"
      />
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="min-w-0 flex-1">
          <QueryBar
            source="Production History"
            query={"GROUP BY step, equipment, chamber\nWHERE lot_id IN (:failing)"}
            input={FAILING.map((f) => (
              <Chip key={f.id} tone="red">
                {f.id}
              </Chip>
            ))}
          />
          <div className="mt-3">
            <DataTable
              columns={MES_COLS}
              rows={MES}
              rowState={(r: Row) => (r.bad ? "hit" : "dim")}
              scanning={scanning}
            />
          </div>
          {!scanning && (
            <ResultBar>
              <Chip>CVD — no pattern</Chip>
              <Chip>CMP — no pattern</Chip>
              <Chip tone="red">Etch → 5/5 Etch-3/C</Chip>
              <Chip tone="amber">10:00–12:00</Chip>
            </ResultBar>
          )}
        </div>
        <div className="lg:w-[420px]">
          <div className="mb-2 text-xs font-semibold text-slate-400">
            lot → chamber routing
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-2">
            <FabFloor mode="flows" />
          </div>
        </div>
      </div>
    </>
  );
}

function SensorScene() {
  const scanning = useScan(1600);
  return (
    <>
      <SceneTitle
        kicker="Step 3 · Machine Sensors"
        title="Check sensor telemetry"
      />
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="min-w-0 flex-1">
          <QueryBar
            source="Machine Sensors"
            query={
              "for Etch-3 / Chamber C,\n  read RF power from 10:00 to 12:00"
            }
            input={
              <>
                <Chip tone="red">Etch-3 / C</Chip>
                <Chip tone="amber">10:00–12:00</Chip>
              </>
            }
          />
          <div className="mt-3">
            <DataTable
              columns={FDC_COLS}
              rows={FDC_ETCH3C}
              rowState={(r: Row) => (r.drift ? "hit" : "dim")}
              scanning={scanning}
            />
          </div>
          {!scanning && (
            <ResultBar>
              <span>RF power</span>
              <Chip tone="red">2.31 kW</Chip>
              <span>vs spec</span>
              <Chip>2.10 kW</Chip>
            </ResultBar>
          )}
        </div>
        <div className="lg:w-[420px]">
          <div className="mb-2 text-xs font-semibold text-slate-400">
            RF power · Etch-3 / C
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <RfChart />
          </div>
        </div>
      </div>
    </>
  );
}

function VerdictScene() {
  return (
    <>
      <SceneTitle
        kicker="Step 4 · Correlation"
        title="Root cause locked: Etch-3 / Chamber C"
      />
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <FabFloor mode="verdict" />
      </div>
    </>
  );
}
