"use client";

import { motion } from "framer-motion";
import type { FabFloorData } from "@/lib/analysis";

interface Props {
  // "idle" | "flows" (draw lot→chamber paths) | "verdict" (culprit locked red)
  mode: "idle" | "flows" | "verdict";
  data: FabFloorData;
}

const CH_X = 560;
const CH_W = 128;
const CH_H = 26;
const ROW_H = 37;
const TOOL_GAP = 24;

export default function FabFloor({ mode, data }: Props) {
  const showFlows = mode === "flows" || mode === "verdict";
  const verdict = mode === "verdict";

  const { tools, chambers, lots, culpritKey } = data;
  const label = Object.fromEntries(chambers.map((c) => [c.key, c.label]));

  // Data-driven vertical layout: stack tool boxes, place chambers within.
  const chamberY: Record<string, number> = {};
  const toolBoxes: { name: string; y: number; h: number }[] = [];
  let cy = 52;
  for (const tool of tools) {
    const boxTop = cy - CH_H / 2 - 14;
    for (const key of tool.chambers) {
      chamberY[key] = cy;
      cy += ROW_H;
    }
    const boxBottom = cy - ROW_H + CH_H / 2 + 6;
    toolBoxes.push({ name: tool.name, y: boxTop, h: boxBottom - boxTop });
    cy += TOOL_GAP;
  }

  const lotY = (i: number) => 40 + i * ROW_H;
  const rightH = cy + 10;
  const leftH = lotY(lots.length - 1) + 30;
  const vbH = Math.max(rightH, leftH, 240);

  return (
    <svg viewBox={`0 0 720 ${vbH}`} className="w-full h-full">
      {/* section labels */}
      <text x="40" y="24" className="fill-slate-400" fontSize="12" fontWeight="600">
        WAFER LOTS
      </text>
      <text x="470" y="24" className="fill-slate-400" fontSize="12" fontWeight="600">
        ETCH BAY · CHAMBERS
      </text>

      {/* tool grouping boxes */}
      {toolBoxes.map((t) => (
        <g key={t.name}>
          <rect x={470} y={t.y} width={CH_W + 20} height={t.h} rx={12} fill="#f8fafc" stroke="#e2e8f0" />
          <text x={478} y={t.y + 16} className="fill-slate-400" fontSize="10" fontWeight="700">
            {t.name}
          </text>
        </g>
      ))}

      {/* flow paths */}
      {showFlows &&
        lots.map((lot, i) => {
          const chY = chamberY[lot.chamberKey];
          const y0 = lotY(i);
          const d = `M150,${y0} C 330,${y0} 360,${chY} ${CH_X},${chY}`;
          return (
            <motion.path
              key={lot.id}
              d={d}
              fill="none"
              stroke={lot.bad ? (verdict ? "#dc2626" : "#f87171") : "#cbd5e1"}
              strokeWidth={lot.bad ? 2.4 : 1.4}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.1 + i * 0.08 }}
            />
          );
        })}

      {/* chamber nodes */}
      {chambers.map((c) => {
        const isCulprit = c.key === culpritKey;
        const hot = verdict && isCulprit;
        const y = chamberY[c.key];
        return (
          <g key={c.key}>
            <motion.rect
              x={CH_X}
              y={y - CH_H / 2}
              width={CH_W}
              height={CH_H}
              rx={7}
              animate={{
                fill: hot ? "#fee2e2" : "#ffffff",
                stroke: hot ? "#dc2626" : isCulprit && showFlows ? "#f59e0b" : "#cbd5e1",
              }}
              strokeWidth={hot ? 2.5 : 1.5}
            />
            <text
              x={CH_X + 10}
              y={y + 4}
              fontSize="11"
              fontWeight={hot ? 700 : 500}
              className={hot ? "fill-red-700" : "fill-slate-600"}
              fontFamily="ui-monospace, monospace"
            >
              {label[c.key] ?? c.key}
            </text>
            {hot && (
              <motion.circle
                cx={CH_X + CH_W - 12}
                cy={y}
                r={4}
                fill="#dc2626"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
          </g>
        );
      })}

      {/* lot chips */}
      {lots.map((lot, i) => {
        const y = lotY(i);
        return (
          <g key={lot.id}>
            <rect
              x={40}
              y={y - 13}
              width={110}
              height={26}
              rx={7}
              fill={lot.bad ? "#fef2f2" : "#f0fdf4"}
              stroke={lot.bad ? "#fca5a5" : "#bbf7d0"}
              strokeWidth={1.5}
            />
            <circle cx={54} cy={y} r={4} fill={lot.bad ? "#ef4444" : "#22c55e"} />
            <text
              x={66}
              y={y + 4}
              fontSize="11"
              className={lot.bad ? "fill-red-700" : "fill-emerald-700"}
              fontFamily="ui-monospace, monospace"
              fontWeight="600"
            >
              {lot.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
