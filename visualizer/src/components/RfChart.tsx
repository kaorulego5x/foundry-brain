"use client";

import { motion } from "framer-motion";
import type { RfData } from "@/lib/analysis";

interface Props {
  data: RfData;
}

const W = 660;
const H = 300;
const PAD = { l: 52, r: 20, t: 24, b: 40 };
const plotW = W - PAD.l - PAD.r;
const plotH = H - PAD.t - PAD.b;

export default function RfChart({ data }: Props) {
  const { series, specCenter, warnTol, alarmHi, yMin, yMax, driftFrom, driftTo } = data;
  const hours = series.map((d) => d.hour);
  const hMin = Math.min(...hours);
  const hMax = Math.max(...hours);

  const x = (hour: number) => PAD.l + ((hour - hMin) / (hMax - hMin)) * plotW;
  const y = (kw: number) => PAD.t + (1 - (kw - yMin) / (yMax - yMin)) * plotH;

  const line = series.map((d) => `${x(d.hour)},${y(d.kw)}`).join(" ");
  const warnHi = specCenter + warnTol;
  const warnLo = specCenter - warnTol;

  // y-axis ticks every 0.1 across the range
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax + 1e-9; v += 0.1) ticks.push(Math.round(v * 10) / 10);

  // x-axis labels: ~5 evenly spaced hours
  const xLabels: number[] = [];
  const span = hMax - hMin;
  for (let k = 0; k <= 4; k++) xLabels.push(Math.round(hMin + (span * k) / 4));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* process band (nominal ± warn tolerance) */}
      <rect x={PAD.l} y={y(warnHi)} width={plotW} height={y(warnLo) - y(warnHi)} fill="#dcfce7" opacity={0.6} />
      <line x1={PAD.l} x2={W - PAD.r} y1={y(specCenter)} y2={y(specCenter)} stroke="#86efac" strokeDasharray="4 4" />
      <text x={PAD.l + 6} y={y(specCenter) - 5} fontSize="10" className="fill-emerald-600">
        spec {specCenter.toFixed(2)} kW
      </text>
      {/* hard alarm limit */}
      <line x1={PAD.l} x2={W - PAD.r} y1={y(alarmHi)} y2={y(alarmHi)} stroke="#fca5a5" strokeDasharray="6 3" />
      <text x={W - PAD.r} y={y(alarmHi) - 5} fontSize="10" textAnchor="end" className="fill-red-500">
        alarm limit {alarmHi.toFixed(2)} kW
      </text>

      {/* drift window highlight */}
      <rect x={x(driftFrom)} y={PAD.t} width={x(driftTo) - x(driftFrom)} height={plotH} fill="#fef3c7" opacity={0.5} />
      <text
        x={(x(driftFrom) + x(driftTo)) / 2}
        y={PAD.t - 8}
        fontSize="11"
        textAnchor="middle"
        fontWeight="700"
        className="fill-amber-700"
      >
        drift {String(Math.round(driftFrom)).padStart(2, "0")}:00–{String(Math.round(driftTo)).padStart(2, "0")}:00
      </text>

      {/* y axis ticks */}
      {ticks.map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="#f1f5f9" />
          <text x={PAD.l - 8} y={y(v) + 4} fontSize="10" textAnchor="end" className="fill-slate-400">
            {v.toFixed(1)}
          </text>
        </g>
      ))}

      {/* x axis labels */}
      {xLabels.map((h) => (
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
      {series.map((d, i) => {
        const drift = d.hour >= driftFrom && d.hour <= driftTo;
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
