"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  visible: boolean;
}

export default function VerdictCard({ visible }: Props) {
  const [showOrder, setShowOrder] = useState(false);

  if (!visible) return null;

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
          <h3 className="text-xl font-bold text-slate-900">
            Etch-3 / Chamber C
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            RF power drifted to <b className="text-slate-900">2.31 kW</b> (spec
            2.10 ±0.15) between 10:00–12:00. All 5 failing lots passed through
            this one chamber in that window — the drift matches the −3.2 nm
            thickness loss. It stayed under the alarm limit, so no alert ever
            fired.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-4xl font-bold text-red-600">97%</div>
          <div className="text-xs text-slate-400">confidence</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4">
        <Stat label="Affected lots" value="5" />
        <Stat label="Wafers at risk" value="27" />
        <Stat label="Est. exposure" value="~$2.1M" />
        <button
          onClick={() => setShowOrder(true)}
          disabled={showOrder}
          className="ml-auto rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:bg-slate-200 disabled:text-slate-400"
        >
          {showOrder ? "Order generated ✓" : "Generate isolation order"}
        </button>
      </div>

      {showOrder && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-600"
        >
          <div className="mb-2 font-bold text-amber-600">
            ISOLATION ORDER #ISO-2026-0704-001
          </div>
          <div className="space-y-1">
            <div>Date: 2026-07-04 12:42 UTC</div>
            <div>Equipment: Etch-3 / Chamber C</div>
            <div>Action: HOLD — do not process new lots</div>
            <div>Affected: LOT-0703, 0704, 0707, 0708, 0711</div>
            <div>Root cause: RF power drift (2.31 kW avg, spec 2.10 ±0.15)</div>
            <div>Fix: recalibrate RF supply, verify with test wafer</div>
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
