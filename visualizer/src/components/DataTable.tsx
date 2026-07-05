"use client";

import { motion } from "framer-motion";
import type { Column, Row, RowState } from "@/lib/demo-data";

interface Props {
  columns: Column[];
  rows: Row[];
  // returns per-row state given whether the scan has resolved
  rowState: (row: Row) => RowState;
  scanning: boolean;
}

export default function DataTable({ columns, rows, rowState, scanning }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className="border-b border-slate-200 px-3 py-2 font-semibold uppercase tracking-wide text-slate-400"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const state: RowState = scanning ? "normal" : rowState(row);
            return (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: state === "dim" ? 0.35 : 1,
                  backgroundColor:
                    state === "hit" ? "rgba(254,226,226,0.9)" : "rgba(255,255,255,0)",
                }}
                transition={{
                  opacity: { delay: scanning ? i * 0.04 : 0, duration: 0.25 },
                  backgroundColor: { duration: 0.4 },
                }}
                className="relative"
              >
                {columns.map((c, ci) => {
                  const val = row.cells[c.key] ?? "";
                  const isVerdict = c.key === "verdict";
                  const fail = val === "FAIL";
                  return (
                    <td
                      key={c.key}
                      className={`border-b border-slate-100 px-3 py-1.5 ${
                        c.mono ? "font-mono" : ""
                      } ${
                        state === "hit" && ci === 0
                          ? "font-semibold text-red-700"
                          : "text-slate-600"
                      }`}
                    >
                      {isVerdict ? (
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            fail
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {val}
                        </span>
                      ) : (
                        val
                      )}
                    </td>
                  );
                })}
              </motion.tr>
            );
          })}
        </tbody>
      </table>
      {scanning && (
        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-400">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-indigo-500" />
          scanning {rows.length} rows…
        </div>
      )}
    </div>
  );
}
