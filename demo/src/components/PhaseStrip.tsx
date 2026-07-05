"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PhaseId, PhaseState } from "@/lib/events";
import { CheckIcon } from "./icons";

const PHASES: { id: PhaseId; name: string; gloss: string }[] = [
  { id: "CVD", name: "CVD", gloss: "deposition" },
  { id: "ETCH", name: "Etch", gloss: "plasma etch" },
  { id: "CMP", name: "CMP", gloss: "polish" },
  { id: "INSPECT", name: "Quality Inspection", gloss: "metrology" },
];

const NODE_STYLE: Record<PhaseState, { border: string; bg: string }> = {
  pending: { border: "#e2e8f0", bg: "#ffffff" },
  detected: { border: "#fca5a5", bg: "#fef2f2" },
  investigating: { border: "#818cf8", bg: "#eef2ff" },
  cleared: { border: "#e2e8f0", bg: "#f8fafc" },
  suspect: { border: "#fbbf24", bg: "#fffbeb" },
  "root-cause": { border: "#dc2626", bg: "#fef2f2" },
};

function StateLine({
  state,
  causeLabel,
}: {
  state: PhaseState;
  causeLabel?: string;
}) {
  switch (state) {
    case "pending":
      return <span className="text-[11px] text-slate-300">not checked</span>;
    case "investigating":
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
          checking…
        </span>
      );
    case "cleared":
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
          <CheckIcon className="h-3 w-3" />
          cleared
        </span>
      );
    case "suspect":
      return (
        <span className="text-[11px] font-bold uppercase tracking-wide text-amber-600">
          suspect
        </span>
      );
    case "root-cause":
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-red-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          root cause{causeLabel ? ` · ${causeLabel}` : ""}
        </span>
      );
    case "detected":
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-red-500">
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-red-500">
            <path d="M6 1 11 11H1L6 1Z" />
          </svg>
          detected here
        </span>
      );
  }
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-slate-300"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h16M13 5l7 7-7 7" />
    </svg>
  );
}

// Process-phase strip: manufacturing flows left→right, the AI investigation
// traces right→left from the detection point back to the root-cause phase.
export default function PhaseStrip({
  phases,
  backtracking,
  causeLabel,
}: {
  phases: Record<PhaseId, PhaseState>;
  backtracking: boolean;
  causeLabel?: string;
}) {
  return (
    <div className="canvas-grid rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Process line · Fab #2
        </span>
        <span className="text-[10px] text-slate-400">
          manufacturing flows left to right
        </span>
      </div>

      <div className="flex items-stretch gap-2">
        {PHASES.map((p, i) => {
          const state = phases[p.id];
          const style = NODE_STYLE[state];
          return (
            <div key={p.id} className="flex flex-1 items-center gap-2">
              {i > 0 && <ArrowRight />}
              <motion.div
                initial={false}
                animate={{ borderColor: style.border, backgroundColor: style.bg }}
                className={`flex-1 rounded-xl border-2 px-3 py-2 ${
                  state === "cleared" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-slate-800">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-slate-400">{p.gloss}</span>
                </div>
                <div className="mt-0.5">
                  <StateLine state={state} causeLabel={causeLabel} />
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {backtracking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center gap-2"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 shrink-0 text-red-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 12H4M11 5l-7 7 7 7" />
            </svg>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              style={{ transformOrigin: "right" }}
              className="h-0 flex-1 border-t-2 border-dashed border-red-300"
            />
            <span className="shrink-0 text-[10px] font-semibold text-red-500">
              AI traces backwards from the detection point
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
