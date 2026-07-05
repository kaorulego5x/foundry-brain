"use client";

import { motion } from "framer-motion";

interface Props {
  lotId: string;
  bad: boolean;
  yieldPct: number;
  delay?: number;
}

// Deterministic die layout: a square grid clipped to a circle.
const GRID = 9;
const CENTER = (GRID - 1) / 2;
const RADIUS = 4.35;

function buildDies(bad: boolean, seed: number) {
  const dies: { x: number; y: number; fail: boolean }[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const dist = Math.hypot(x - CENTER, y - CENTER);
      if (dist > RADIUS) continue;
      let fail = false;
      if (bad) {
        // Bad lots: a lower-region cluster fails (thickness under-etch),
        // plus a little pseudo-random scatter keyed off the seed.
        const inCluster = y >= 5 && Math.abs(x - CENTER) <= 3 - (y - 6);
        const scatter = ((x * 7 + y * 13 + seed * 5) % 11) === 0;
        fail = inCluster || scatter;
      } else {
        const scatter = ((x * 3 + y * 11 + seed * 7) % 23) === 0;
        fail = scatter;
      }
      dies.push({ x, y, fail });
    }
  }
  return dies;
}

export default function WaferMap({ lotId, bad, yieldPct, delay = 0 }: Props) {
  const seed = parseInt(lotId.replace(/\D/g, ""), 10) || 1;
  const dies = buildDies(bad, seed);
  const cell = 12;
  const pad = 10;
  const size = GRID * cell + pad * 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35 }}
      className={`rounded-xl border bg-white p-3 shadow-sm ${
        bad ? "border-red-200" : "border-slate-200"
      }`}
    >
      {/* viewBox + fluid width so the wafer scales down inside narrow cards
          instead of overflowing them */}
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block h-auto w-full max-w-[128px]">
        {/* wafer disc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(RADIUS + 0.7) * cell}
          fill={bad ? "#fef2f2" : "#f8fafc"}
          stroke={bad ? "#fecaca" : "#e2e8f0"}
        />
        {/* notch */}
        <rect
          x={size / 2 - 3}
          y={size / 2 + (RADIUS + 0.7) * cell - 3}
          width={6}
          height={6}
          rx={1}
          fill="#cbd5e1"
        />
        {dies.map((d, i) => (
          <motion.rect
            key={i}
            x={pad + d.x * cell + 1}
            y={pad + d.y * cell + 1}
            width={cell - 2}
            height={cell - 2}
            rx={1.5}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 + i * 0.004 }}
            fill={d.fail ? "#ef4444" : "#22c55e"}
          />
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-xs text-slate-600">{lotId}</span>
        <span
          className={`font-mono text-xs font-semibold ${
            bad ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {yieldPct}%
        </span>
      </div>
    </motion.div>
  );
}
