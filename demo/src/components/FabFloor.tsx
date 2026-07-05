"use client";

import { motion } from "framer-motion";

interface Props {
  // "idle" | "flows" (draw lot→chamber paths) | "verdict" (culprit locked red)
  mode: "idle" | "flows" | "verdict";
}

type Lot = { id: string; bad: boolean; chamber: string };

const LOTS: Lot[] = [
  { id: "LOT-0701", bad: false, chamber: "E1A" },
  { id: "LOT-0702", bad: false, chamber: "E1B" },
  { id: "LOT-0703", bad: true, chamber: "E3C" },
  { id: "LOT-0704", bad: true, chamber: "E3C" },
  { id: "LOT-0705", bad: false, chamber: "E2A" },
  { id: "LOT-0706", bad: false, chamber: "E2B" },
  { id: "LOT-0707", bad: true, chamber: "E3C" },
  { id: "LOT-0708", bad: true, chamber: "E3C" },
  { id: "LOT-0709", bad: false, chamber: "E3A" },
  { id: "LOT-0710", bad: false, chamber: "E3B" },
  { id: "LOT-0711", bad: true, chamber: "E3C" },
];

const CHAMBERS: Record<string, { label: string; x: number; y: number }> = {
  E1A: { label: "Etch-1 · A", x: 560, y: 62 },
  E1B: { label: "Etch-1 · B", x: 560, y: 98 },
  E2A: { label: "Etch-2 · A", x: 560, y: 182 },
  E2B: { label: "Etch-2 · B", x: 560, y: 218 },
  E3A: { label: "Etch-3 · A", x: 560, y: 302 },
  E3B: { label: "Etch-3 · B", x: 560, y: 338 },
  E3C: { label: "Etch-3 · C", x: 560, y: 400 },
};

const TOOLS = [
  { name: "Etch-1", y: 40, h: 92 },
  { name: "Etch-2", y: 160, h: 92 },
  { name: "Etch-3", y: 280, h: 156 },
];

const CH_W = 128;
const CH_H = 26;

export default function FabFloor({ mode }: Props) {
  const showFlows = mode === "flows" || mode === "verdict";
  const verdict = mode === "verdict";

  const lotY = (i: number) => 40 + i * 37;

  return (
    <svg viewBox="0 0 720 470" className="w-full h-full">
      {/* section labels */}
      <text x="40" y="24" className="fill-slate-400" fontSize="12" fontWeight="600">
        WAFER LOTS
      </text>
      <text x="470" y="24" className="fill-slate-400" fontSize="12" fontWeight="600">
        ETCH BAY · CHAMBERS
      </text>

      {/* tool grouping boxes */}
      {TOOLS.map((t) => (
        <g key={t.name}>
          <rect
            x={470}
            y={t.y}
            width={CH_W + 20 + 470 - 470}
            height={t.h}
            rx={12}
            fill="#f8fafc"
            stroke="#e2e8f0"
          />
          <text
            x={478}
            y={t.y + 16}
            className="fill-slate-400"
            fontSize="10"
            fontWeight="700"
          >
            {t.name}
          </text>
        </g>
      ))}

      {/* flow paths */}
      {showFlows &&
        LOTS.map((lot, i) => {
          const ch = CHAMBERS[lot.chamber];
          const y0 = lotY(i);
          const d = `M150,${y0} C 330,${y0} 360,${ch.y} ${560},${ch.y}`;
          const isCulprit = lot.chamber === "E3C";
          return (
            <motion.path
              key={lot.id}
              d={d}
              fill="none"
              stroke={
                lot.bad ? (verdict ? "#dc2626" : "#f87171") : "#cbd5e1"
              }
              strokeWidth={lot.bad ? 2.4 : 1.4}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: isCulprit || !lot.bad ? 1 : 1 }}
              transition={{ duration: 0.9, delay: 0.1 + i * 0.08 }}
            />
          );
        })}

      {/* chamber nodes */}
      {Object.entries(CHAMBERS).map(([key, c]) => {
        const isCulprit = key === "E3C";
        const hot = verdict && isCulprit;
        return (
          <g key={key}>
            <motion.rect
              x={c.x}
              y={c.y - CH_H / 2}
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
              x={c.x + 10}
              y={c.y + 4}
              fontSize="11"
              fontWeight={hot ? 700 : 500}
              className={hot ? "fill-red-700" : "fill-slate-600"}
              fontFamily="ui-monospace, monospace"
            >
              {c.label}
            </text>
            {hot && (
              <motion.circle
                cx={c.x + CH_W - 12}
                cy={c.y}
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
      {LOTS.map((lot, i) => {
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
