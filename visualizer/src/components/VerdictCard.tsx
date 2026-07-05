"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Verdict } from "@/lib/analysis";
import { CheckIcon } from "./icons";

interface Props {
  visible: boolean;
  verdict: Verdict;
  analysisId?: string;
}

export default function VerdictCard({ visible, verdict, analysisId }: Props) {
  const [showOrder, setShowOrder] = useState(false);
  const [rated, setRated] = useState<string | null>(null);

  async function submitRating(rating: "good" | "bad") {
    if (!analysisId || rated) return;
    setRated(rating);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId, rating }),
    }).catch(() => {});
  }

  if (!visible) return null;

  const o = verdict.isolationOrder;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-red-200 bg-white p-5 shadow-lg shadow-red-100/50"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            Root cause identified
          </div>
          <h3 className="text-xl font-bold text-slate-900">{verdict.rootCause}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{verdict.narrative}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-4xl font-bold text-red-600">{verdict.confidence}%</div>
          <div className="text-xs text-slate-400">confidence</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4">
        <Stat label="Affected lots" value={String(verdict.affectedLots)} />
        <Stat label="Wafers at risk" value={String(verdict.wafersAtRisk)} />
        <Stat label="Est. exposure" value={verdict.exposure} />
        <button
          onClick={() => setShowOrder(true)}
          disabled={showOrder}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:bg-slate-200 disabled:text-slate-400"
        >
          {showOrder ? (
            <>
              Order generated
              <CheckIcon className="h-3.5 w-3.5" />
            </>
          ) : (
            "Generate isolation order"
          )}
        </button>
      </div>

      {analysisId && visible && (
        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-500">Rate this analysis:</span>
          <button
            type="button"
            disabled={!!rated}
            onClick={() => submitRating("good")}
            className="rounded-md border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-800 disabled:opacity-50"
          >
            {rated === "good" ? "Good ✓" : "👍 Good"}
          </button>
          <button
            type="button"
            disabled={!!rated}
            onClick={() => submitRating("bad")}
            className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-800 disabled:opacity-50"
          >
            {rated === "bad" ? "Bad ✓" : "👎 Bad"}
          </button>
        </div>
      )}

      {showOrder && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-600"
        >
          <div className="mb-2 font-bold text-amber-600">ISOLATION ORDER #{o.id}</div>
          <div className="space-y-1">
            <div>Date: {o.date}</div>
            <div>Equipment: {o.equipment}</div>
            <div>Action: {o.action}</div>
            <div>Affected: {o.affected}</div>
            <div>Root cause: {o.rootCause}</div>
            <div>Fix: {o.fix}</div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="text-slate-400">{label}: </span>
      <span className="font-mono font-semibold text-slate-900">{value}</span>
    </div>
  );
}
