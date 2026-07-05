"use client";

import { motion } from "framer-motion";

// Daily line yield — steady ~90%, then a 12pt cliff today.
const DATA = [91, 90, 92, 89, 91, 90, 78];
const LABELS = ["6/28", "6/29", "6/30", "7/1", "7/2", "7/3", "7/4"];

const W = 620;
const H = 240;
const PAD = { l: 44, r: 16, t: 20, b: 32 };
const Y_MIN = 70;
const Y_MAX = 95;
const plotW = W - PAD.l - PAD.r;
const plotH = H - PAD.t - PAD.b;

const x = (i: number) => PAD.l + (i / (DATA.length - 1)) * plotW;
const y = (v: number) => PAD.t + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;

export default function YieldChart() {
  const line = DATA.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${line} ${x(DATA.length - 1)},${y(Y_MIN)} ${x(0)},${y(Y_MIN)}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[70, 80, 90].map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="#f1f5f9" />
          <text x={PAD.l - 8} y={y(v) + 4} fontSize="10" textAnchor="end" className="fill-slate-400">
            {v}%
          </text>
        </g>
      ))}

      <motion.polygon
        points={area}
        fill="url(#yg)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      />
      <defs>
        <linearGradient id="yg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.polyline
        points={line}
        fill="none"
        stroke="#6366f1"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />

      {DATA.map((v, i) => {
        const last = i === DATA.length - 1;
        return (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r={last ? 5 : 3} fill={last ? "#dc2626" : "#6366f1"} />
            <text x={x(i)} y={H - PAD.b + 18} fontSize="10" textAnchor="middle" className="fill-slate-400">
              {LABELS[i]}
            </text>
          </g>
        );
      })}

      <text x={x(DATA.length - 1)} y={y(78) - 14} fontSize="13" textAnchor="end" fontWeight="700" className="fill-red-600">
        −12%
      </text>
    </svg>
  );
}
