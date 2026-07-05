"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WaferMap from "@/components/WaferMap";
import FabFloor from "@/components/FabFloor";
import RfChart from "@/components/RfChart";
import VerdictCard from "@/components/VerdictCard";
import DataTable from "@/components/DataTable";
import PipelineOverview from "@/components/PipelineOverview";
import {
  FactoryIcon,
  SensorIcon,
  InspectIcon,
  RestartIcon,
  CheckIcon,
  ExchangeIcon,
  ChevronDownIcon,
  PanelLeftIcon,
} from "@/components/icons";
import {
  loadIndex,
  loadAnalysis,
  type Analysis,
  type AnalysisSummary,
  type Scene,
  type Table,
  type FabFloorData,
  type RfData,
  type FailingLot,
  type Row,
  type RowState,
} from "@/lib/analysis";

// The three fab systems Foundry Brain reads across — plain names, no jargon.
const SOURCES = [
  { id: "MES", name: "Production History", gloss: "which lot ran where & when", icon: FactoryIcon },
  { id: "FDC", name: "Machine Sensors", gloss: "temp · pressure · power", icon: SensorIcon },
  { id: "MET", name: "Quality Inspection", gloss: "thickness & defects", icon: InspectIcon },
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

type Tab = "pipeline" | "data" | "investigation";

const TAB_LABELS: Record<Tab, string> = {
  pipeline: "Root Cause",
  investigation: "Investigation",
  data: "Raw Data",
};

export default function Home() {
  const [history, setHistory] = useState<AnalysisSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const [tab, setTab] = useState<Tab>("data");
  const [scene, setScene] = useState<Scene>("overview");
  const [current, setCurrent] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  // The step log is history, not chrome — collapsed by default; run() unfolds
  // it while the replay walks through it (and it stays open afterwards).
  const [logOpen, setLogOpen] = useState(false);
  // The whole sidebar collapses to a slim rail, giving the canvas full width.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load the history index once, default to the newest analysis.
  useEffect(() => {
    loadIndex()
      .then((list) => {
        setHistory(list);
        if (list.length) setSelectedId(list[0].id);
      })
      .catch(() => setHistory([]));
  }, []);

  // Load the selected analysis record. The investigation has already run —
  // the page opens in the concluded state (all steps done, verdict ready);
  // "Replay again" re-runs the walkthrough animation on demand.
  useEffect(() => {
    if (!selectedId) return;
    loadAnalysis(selectedId)
      .then((a) => {
        setAnalysis(a);
        setTab("pipeline");
        setScene("verdict");
        setCurrent(a.steps.length - 1);
        setIsRunning(false);
        setIsComplete(true);
      })
      .catch(() => setAnalysis(null));
  }, [selectedId]);

  const steps = analysis?.steps ?? [];

  // After a replay lands, bring the verdict (top of the canvas) into view.
  // Skip the initial mount — the page already opens on the concluded state.
  const mainRef = useRef<HTMLElement>(null);
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (!isComplete) return;
    const t = setTimeout(() => mainRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 600);
    return () => clearTimeout(t);
  }, [isComplete]);

  const run = useCallback(async () => {
    if (isRunning || !analysis) return;
    setTab("investigation");
    setLogOpen(true);
    setIsRunning(true);
    setIsComplete(false);
    setCurrent(-1);
    setScene("overview");
    await new Promise((r) => setTimeout(r, 900));

    for (let i = 0; i < analysis.steps.length; i++) {
      setCurrent(i);
      setScene(analysis.steps[i].scene);
      await new Promise((r) => setTimeout(r, analysis.steps[i].durationMs));
    }
    setIsComplete(true);
    setIsRunning(false);
  }, [isRunning, analysis]);

  if (!analysis) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)] text-sm text-slate-400">
        Loading analyses…
      </div>
    );
  }

  const yd = analysis.alert.yieldDeltaPct;

  return (
    <div className="flex h-screen flex-col bg-[var(--background)]">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            FB
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-900">Foundry Brain</h1>
          <span className="ml-1 text-xs text-slate-400">built for the semiconductor fab</span>
        </div>
        <div className="flex items-center gap-3">
          {/* past-analysis replay selector */}
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <span>Replay analysis</span>
            <select
              value={selectedId ?? ""}
              disabled={isRunning}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:opacity-50"
            >
              {history.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.timestamp.slice(0, 10)} · {h.rootCause} ({h.yieldDeltaPct}%)
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            {analysis.bay}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* narration / control */}
        <aside
          className={`flex shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
            sidebarOpen ? "w-[300px] p-5 lg:w-[380px]" : "w-14 items-center px-2 py-4"
          }`}
        >
          {!sidebarOpen && (
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                title="Open sidebar"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <PanelLeftIcon className="h-4 w-4" />
              </button>
              <span
                title={`Yield alert ${yd}%`}
                className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500"
              />
              <button
                type="button"
                onClick={run}
                disabled={isRunning}
                title="Replay investigation"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
              >
                <RestartIcon className="h-4 w-4" />
              </button>
            </div>
          )}
          {sidebarOpen && (
            <>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              AI yield engineer
            </span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              title="Collapse sidebar"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <PanelLeftIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Yield alert
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-red-600">
                {yd > 0 ? "+" : "−"}
                {Math.abs(yd)}%
              </span>
              <span className="text-sm text-slate-500">line yield, today</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {analysis.alert.date} · {analysis.alert.lotsSummary}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <button
              type="button"
              onClick={() => setLogOpen((v) => !v)}
              className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40"
            >
              <span className="text-sm font-semibold text-slate-800">Investigation log</span>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  isRunning ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isRunning ? (
                  <>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                    step {Math.max(current + 1, 1)}/{steps.length}
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-2.5 w-2.5" />
                    {steps.length} steps
                  </>
                )}
              </span>
              <motion.span
                initial={false}
                animate={{ rotate: logOpen ? 180 : 0 }}
                className="ml-auto text-slate-400"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {logOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-2">
                    {steps.map((s, i) => {
                      const state =
                        current > i || (isComplete && current >= i)
                          ? "done"
                          : current === i
                          ? "active"
                          : "idle";
                      return <StepRow key={s.n} step={s} state={state} />;
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            {isRunning ? (
              <div className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-indigo-600">
                <span className="h-2 w-2 animate-ping rounded-full bg-indigo-500" />
                Replaying…
              </div>
            ) : (
              <button
                onClick={run}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <RestartIcon className="h-3.5 w-3.5" />
                Replay again
              </button>
            )}
          </div>
            </>
          )}
        </aside>

        {/* canvas */}
        <main ref={mainRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {/* tabs */}
          <div className="flex shrink-0 border-b border-slate-200 bg-white px-6 pt-3">
            {(["pipeline", "investigation", "data"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => !isRunning && setTab(t)}
                className={`relative px-4 pb-2.5 text-sm font-semibold transition ${
                  tab === t ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {TAB_LABELS[t]}
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
              {tab === "pipeline" && (
                <motion.div
                  key="pipeline"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-1 flex-col"
                >
                  {/* The conclusion is what the user came for — it leads. */}
                  {isComplete && (
                    <div className="mb-6">
                      <VerdictCard visible={isComplete} verdict={analysis.verdict} />
                    </div>
                  )}
                  <PipelineOverview mes={analysis.tables.mes} failingLots={analysis.failingLots} />
                </motion.div>
              )}
              {tab === "data" && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-1 flex-col"
                >
                  <RawDataView tables={analysis.tables} />
                </motion.div>
              )}
              {tab === "investigation" && (
                <motion.div
                  key="investigation"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-1 flex-col"
                >
                  <SourceRail active={activeSource(scene)} />
                  {isComplete && (
                    <div className="mb-5">
                      <VerdictCard visible={isComplete} verdict={analysis.verdict} />
                    </div>
                  )}
                  <SceneView scene={scene} analysis={analysis} />
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

interface StepT {
  n: number;
  source: string;
  title: string;
  detail: string;
}

const SOURCE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "Quality Inspection": InspectIcon,
  "Production History": FactoryIcon,
  "Machine Sensors": SensorIcon,
  Correlation: ExchangeIcon,
};

function StepRow({ step, state }: { step: StepT; state: "idle" | "active" | "done" }) {
  const SourceIcon = SOURCE_ICON[step.source] ?? ExchangeIcon;
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
          {state === "done" ? <CheckIcon className="h-2.5 w-2.5" /> : step.n}
        </span>
        <span className={`text-sm font-semibold ${state === "idle" ? "text-slate-400" : "text-slate-800"}`}>
          {step.title}
        </span>
      </div>
      {/* which system this step queried — sits under the title, next to the rail's vocabulary */}
      <div className="mt-1.5 pl-7">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            state === "active" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
          }`}
        >
          <SourceIcon className="h-3 w-3" />
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
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-xs font-bold">FB</span>
        <div className="leading-tight">
          <div className="text-sm font-bold">Foundry Brain</div>
          <div className="text-[10px] text-indigo-200">reads across every system</div>
        </div>
      </div>

      <ExchangeIcon className="h-4 w-4 shrink-0 text-slate-300" />

      <div className="flex flex-1 gap-2">
        {SOURCES.map((s) => {
          const on = active === s.id || active === "all";
          const Icon = s.icon;
          return (
            <motion.div
              key={s.id}
              initial={false}
              animate={{
                borderColor: on ? "#6366f1" : "#e2e8f0",
                backgroundColor: on ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0)",
              }}
              className="flex flex-1 items-center gap-2 rounded-xl border px-3 py-2"
            >
              <Icon className={`h-5 w-5 shrink-0 ${on ? "text-indigo-600" : "text-slate-400"}`} />
              <div className="leading-tight">
                <div className={`text-sm font-semibold ${on ? "text-indigo-700" : "text-slate-700"}`}>{s.name}</div>
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
    <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-medium ${tones[tone]}`}>{children}</span>
  );
}

function QueryBar({ source, query, input }: { source: string; query: string; input?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-slate-300">
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-300">
          query
        </span>
        <span className="text-[11px] text-slate-500">{source}</span>
      </div>
      <code className="block whitespace-pre-wrap leading-relaxed text-emerald-300">{query}</code>
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
    const t = setTimeout(() => setScanning(false), resolveMs);
    return () => clearTimeout(t);
  }, [resolveMs]);
  return scanning;
}

/* ---------------- scenes ---------------- */

function SceneTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-4">
      <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">{kicker}</div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
  );
}

function SceneView({ scene, analysis }: { scene: Scene; analysis: Analysis }) {
  if (scene === "overview") return <OverviewScene fab={analysis.fabFloor} />;
  if (scene === "inspect")
    return <InspectScene metrology={analysis.tables.metrology} failingLots={analysis.failingLots} />;
  if (scene === "trace") return <TraceScene mes={analysis.tables.mes} fab={analysis.fabFloor} failingLots={analysis.failingLots} />;
  if (scene === "sensor") return <SensorScene fdc={analysis.tables.fdc} rf={analysis.rf} />;
  return <VerdictScene fab={analysis.fabFloor} rootCause={analysis.verdict.rootCause} />;
}

function RawDataView({ tables }: { tables: Analysis["tables"] }) {
  const silos = [
    {
      icon: FactoryIcon,
      name: "Production History",
      desc: "Which lot ran on which machine & chamber, and when",
      keyCols: "identified by: lot number",
      table: tables.mes,
      tone: "border-violet-200",
    },
    {
      icon: SensorIcon,
      name: "Machine Sensors",
      desc: "Temperature, pressure & power from every machine, over time",
      keyCols: "identified by: machine + chamber + timestamp",
      table: tables.fdc,
      tone: "border-amber-200",
    },
    {
      icon: InspectIcon,
      name: "Quality Inspection",
      desc: "Film thickness & defect measurements per lot",
      keyCols: "identified by: lot number + wafer",
      table: tables.metrology,
      tone: "border-sky-200",
    },
  ];
  return (
    <>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">The fab&apos;s data</h2>
        <p className="text-xs text-slate-400">
          3 separate systems — each identifies its records differently, so they don&apos;t line up on their own
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {silos.map((s) => {
          const Icon = s.icon;
          return (
          <div key={s.name} className={`rounded-2xl border ${s.tone} bg-white p-4 shadow-sm`}>
            <div className="mb-0.5 flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <Icon className="h-4 w-4 text-slate-500" />
              {s.name}
            </div>
            <div className="text-xs text-slate-400">{s.desc}</div>
            <div className="mt-1 mb-3 font-mono text-[10px] text-slate-400">{s.keyCols}</div>
            <DataTable
              columns={s.table.cols}
              rows={s.table.rows}
              rowState={() => "normal" as RowState}
              scanning={false}
            />
          </div>
          );
        })}
      </div>
    </>
  );
}

function OverviewScene({ fab }: { fab: FabFloorData }) {
  return (
    <>
      <SceneTitle kicker="Ready" title="Press Replay to walk the investigation" />
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <FabFloor mode="flows" data={fab} />
      </div>
    </>
  );
}

function InspectScene({ metrology, failingLots }: { metrology: Table; failingLots: FailingLot[] }) {
  const scanning = useScan(1600);
  return (
    <>
      <SceneTitle kicker="Step 1 · Quality Inspection" title="Find failing lots" />
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="min-w-0 flex-1">
          <QueryBar source="Quality Inspection" query={"WHERE mean_thk < 46.7 nm"} />
          <div className="mt-3">
            <DataTable
              columns={metrology.cols}
              rows={metrology.rows}
              rowState={(r: Row) => (r.bad ? "hit" : "dim")}
              scanning={scanning}
            />
          </div>
          {!scanning && (
            <ResultBar>
              <Chip tone="red">{failingLots.length} lots</Chip>
              <span>under-etched →</span>
              {failingLots.map((f) => (
                <Chip key={f.id} tone="red">
                  {f.id}
                </Chip>
              ))}
            </ResultBar>
          )}
        </div>
        <div className="lg:w-[360px]">
          <div className="mb-2 text-xs font-semibold text-slate-400">wafer maps · failing lots</div>
          <div className="grid grid-cols-3 gap-2">
            {failingLots.map((f, i) => (
              <WaferMap key={f.id} lotId={f.id} bad yieldPct={f.yieldPct} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function TraceScene({ mes, fab, failingLots }: { mes: Table; fab: FabFloorData; failingLots: FailingLot[] }) {
  const scanning = useScan(1600);
  return (
    <>
      <SceneTitle kicker="Step 2 · Production History" title="Trace equipment routes" />
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="min-w-0 flex-1">
          <QueryBar
            source="Production History"
            query={"GROUP BY step, equipment, chamber\nWHERE lot_id IN (:failing)"}
            input={failingLots.map((f) => (
              <Chip key={f.id} tone="red">
                {f.id}
              </Chip>
            ))}
          />
          <div className="mt-3">
            <DataTable
              columns={mes.cols}
              rows={mes.rows}
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
          <div className="mb-2 text-xs font-semibold text-slate-400">lot → chamber routing</div>
          <div className="rounded-xl border border-slate-200 bg-white p-2">
            <FabFloor mode="flows" data={fab} />
          </div>
        </div>
      </div>
    </>
  );
}

function SensorScene({ fdc, rf }: { fdc: Table; rf: RfData }) {
  const scanning = useScan(1600);
  return (
    <>
      <SceneTitle kicker="Step 3 · Machine Sensors" title="Check sensor telemetry" />
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="min-w-0 flex-1">
          <QueryBar
            source="Machine Sensors"
            query={`for ${rf.culpritLabel},\n  read RF power over the drift window`}
            input={
              <>
                <Chip tone="red">{rf.culpritLabel}</Chip>
                <Chip tone="amber">
                  {String(Math.round(rf.driftFrom)).padStart(2, "0")}:00–
                  {String(Math.round(rf.driftTo)).padStart(2, "0")}:00
                </Chip>
              </>
            }
          />
          <div className="mt-3">
            <DataTable
              columns={fdc.cols}
              rows={fdc.rows}
              rowState={(r: Row) => (r.drift ? "hit" : "dim")}
              scanning={scanning}
            />
          </div>
          {!scanning && (
            <ResultBar>
              <span>RF power peaked</span>
              <Chip tone="red">
                {Math.max(...rf.series.map((s) => s.kw)).toFixed(2)} kW
              </Chip>
              <span>vs center</span>
              <Chip>{rf.specCenter.toFixed(2)} kW</Chip>
              <span>· under alarm {rf.alarmHi.toFixed(2)}</span>
            </ResultBar>
          )}
        </div>
        <div className="lg:w-[420px]">
          <div className="mb-2 text-xs font-semibold text-slate-400">RF power · {rf.culpritLabel}</div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <RfChart data={rf} />
          </div>
        </div>
      </div>
    </>
  );
}

function VerdictScene({ fab, rootCause }: { fab: FabFloorData; rootCause: string }) {
  return (
    <>
      <SceneTitle
        kicker="Step 4 · Correlation"
        title={`Evidence: every failing lot converges on ${rootCause}`}
      />
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <FabFloor mode="verdict" data={fab} />
      </div>
    </>
  );
}
