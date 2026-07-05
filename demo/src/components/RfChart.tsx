"use client";

import { motion } from "framer-motion";

// RF power (kW) for Etch-3 / Chamber C across the shift.
// Flat around 2.10, drifts up into 10:00–12:00, then recovers.
const DATA: { hour: number; kw: number }[] = [
  { hour: 6, kw: 2.10 },
  { hour: 7, kw: 2.11 },
  { hour: 8, kw: 2.09 },
  { hour: 9, kw: 2.12 },
  { hour: 10, kw: 2.25 },
  { hour: 11, kw: 2.31 },
  { hour: 12, kw: 2.27 },
  { hour: 13, kw: 2.13 },
  { hour: 14, kw: 2.10 },
  { hour: 15, kw: 2.11 },
  { hour: 16, kw: 2.09 },
  { hour: 17, kw: 2.10 },
  { hour: 18, kw: 2.12 },
  { hour: 19, kw: 2.10 },
];

const W = 660;
const H = 300;
const PAD = { l: 52, r: 20, t: 24, b: 40 };
const Y_MIN = 2.0;
const Y_MAX = 2.4;
const SPEC = 2.1;
const SPEC_TOL = 0.15; // alarm band ±0.15
const ALARM_HI = SPEC + SPEC_TOL; // 2.25

const plotW = W - PAD.l - PAD.r;
const plotH = H - PAD.t - PAD.b;

const x = (hour: number) =>
  PAD.l + ((hour - 6) / (19 - 6)) * plotW;
const y = (kw: number) =>
  PAD.t + (1 - (kw - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;

export default function RfChart() {
  const line = DATA.map((d) => `${x(d.hour)},${y(d.kw)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* spec band (nominal ± tolerance) */}
      <rect
        x={PAD.l}
        y={y(ALARM_HI)}
        width={plotW}
        height={y(SPEC - SPEC_TOL) - y(ALARM_HI)}
        fill="#dcfce7"
        opacity={0.6}
      />
      <line
        x1={PAD.l}
        x2={W - PAD.r}
        y1={y(SPEC)}
        y2={y(SPEC)}
        stroke="#86efac"
        strokeDasharray="4 4"
      />
      <text x={PAD.l + 6} y={y(SPEC) - 5} fontSize="10" className="fill-emerald-600">
        spec 2.10 kW
      </text>
      <text x={W - PAD.r} y={y(ALARM_HI) - 5} fontSize="10" textAnchor="end" className="fill-amber-600">
        alarm limit 2.25 kW
      </text>

      {/* drift window highlight */}
      <rect
        x={x(9.5)}
        y={PAD.t}
        width={x(12.5) - x(9.5)}
        height={plotH}
        fill="#fef3c7"
        opacity={0.5}
      />
      <text x={x(11)} y={PAD.t - 8} fontSize="11" textAnchor="middle" fontWeight="700" className="fill-amber-700">
        drift 10:00–12:00
      </text>

      {/* y axis ticks */}
      {[2.0, 2.1, 2.2, 2.3, 2.4].map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="#f1f5f9" />
          <text x={PAD.l - 8} y={y(v) + 4} fontSize="10" textAnchor="end" className="fill-slate-400">
            {v.toFixed(1)}
          </text>
        </g>
      ))}

      {/* x axis labels */}
      {[6, 9, 12, 15, 18].map((h) => (
        <text key={h} x={x(h)} y={H - PAD.b + 18} fontSize="10" textAnchor="middle" className="fill-slate-400">
          {String(h).padStart(2, "0")}:00
        </text>
      ))}

      {/* the RF power line */}
      <motion.polyline
        points={line}
        fill="none"
        stroke="#dc2626"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />

      {/* points */}
      {DATA.map((d, i) => {
        const drift = d.hour >= 10 && d.hour <= 12;
        return (
          <motion.circle
            key={d.hour}
            cx={x(d.hour)}
            cy={y(d.kw)}
            r={drift ? 4.5 : 2.5}
            fill={drift ? "#dc2626" : "#fca5a5"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.08 }}
          />
        );
      })}
    </svg>
  );
}
