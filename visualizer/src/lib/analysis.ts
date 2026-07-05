// A single stored excursion analysis — everything the UI needs to *replay* a
// past investigation. Records are written by the excursion-diagnosis skill via
// the /api/analyses routes into data/analyses/<id>.json, listed in
// data/analyses/index.json.

import type { Column, Row } from "./demo-data";
export type { Column, Row, RowState } from "./demo-data";

export type Scene = "overview" | "inspect" | "trace" | "sensor" | "verdict";

export interface Step {
  n: number;
  source: string;
  title: string;
  detail: string;
  scene: Scene;
  durationMs: number;
}

export interface Table {
  cols: Column[];
  rows: Row[];
}

export interface FailingLot {
  id: string;
  yieldPct: number;
}

export interface Suspect {
  name: string;
  confidence: number; // 0..100
  culprit?: boolean;
}

// Fab-floor routing diagram (data-driven layout).
export interface ChamberDef {
  key: string; // e.g. "E3C"
  label: string; // e.g. "Etch-3 · C"
}
export interface ToolDef {
  name: string; // e.g. "Etch-3"
  chambers: string[]; // chamber keys, top→bottom
}
export interface FabLotRoute {
  id: string;
  bad: boolean;
  chamberKey: string;
}
export interface FabFloorData {
  tools: ToolDef[];
  chambers: ChamberDef[];
  lots: FabLotRoute[];
  culpritKey: string; // which chamber is the root cause
}

// RF telemetry chart.
export interface RfPoint {
  hour: number;
  kw: number;
}
export interface RfData {
  series: RfPoint[];
  specCenter: number; // nominal, e.g. 2.10
  warnTol: number; // process band ±, e.g. 0.10
  alarmHi: number; // hard alarm limit, e.g. 2.40
  yMin: number;
  yMax: number;
  driftFrom: number; // hour
  driftTo: number; // hour
  culpritLabel: string; // e.g. "Etch-3 / C"
}

export interface IsolationOrder {
  id: string;
  date: string;
  equipment: string;
  action: string;
  affected: string;
  rootCause: string;
  fix: string;
}

export interface Verdict {
  rootCause: string; // "Etch-3 / Chamber C"
  confidence: number; // %
  narrative: string;
  affectedLots: number;
  wafersAtRisk: number;
  exposure: string; // "~$2.1M"
  isolationOrder: IsolationOrder;
}

export interface Analysis {
  id: string;
  timestamp: string; // ISO
  query: string; // natural-language prompt that triggered it
  bay: string; // header context, e.g. "Fab #2 · Etch Bay"
  alert: {
    yieldDeltaPct: number; // e.g. -12
    date: string; // "2026-07-04"
    lotsSummary: string; // "5 of 11 lots out of spec"
  };
  tables: { metrology: Table; mes: Table; fdc: Table };
  failingLots: FailingLot[];
  steps: Step[];
  fabFloor: FabFloorData;
  rf: RfData;
  suspects: Suspect[];
  verdict: Verdict;
}

// Lightweight entry for the history selector (public/analyses/index.json).
export interface AnalysisSummary {
  id: string;
  timestamp: string;
  query: string;
  rootCause: string;
  yieldDeltaPct: number;
}

const BASE = "/api/analyses";

export async function loadIndex(): Promise<AnalysisSummary[]> {
  const res = await fetch(BASE, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${BASE} ${res.status}`);
  const list = (await res.json()) as AnalysisSummary[];
  // newest first
  return [...list].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function loadAnalysis(id: string): Promise<Analysis> {
  const res = await fetch(`${BASE}/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${BASE}/${id} ${res.status}`);
  return (await res.json()) as Analysis;
}

export async function createAnalysis(analysis: Analysis): Promise<AnalysisSummary> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(analysis),
  });
  if (!res.ok) throw new Error(`POST ${BASE} ${res.status}`);
  return (await res.json()) as AnalysisSummary;
}

export async function updateAnalysis(id: string, analysis: Analysis): Promise<AnalysisSummary> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(analysis),
  });
  if (!res.ok) throw new Error(`PUT ${BASE}/${id} ${res.status}`);
  return (await res.json()) as AnalysisSummary;
}

export async function deleteAnalysis(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE ${BASE}/${id} ${res.status}`);
}
