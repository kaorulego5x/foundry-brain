// The three data silos, as concrete readable rows.
// The whole point: 3 systems, 3 different ID schemas, 3 time granularities.
// Metrology is keyed by (lot, wafer). MES is keyed by (lot) → equipment/chamber.
// FDC is keyed by (equipment, chamber, timestamp) — no lot id at all.

export type RowState = "normal" | "hit" | "dim";

export interface Column {
  key: string;
  label: string;
  mono?: boolean;
}

export interface Row {
  id: string;
  cells: Record<string, string>;
  bad?: boolean; // ground-truth flag used to decide hit/dim per step
  drift?: boolean;
}

// ---------- 1. Metrology DB (per-lot summary of wafer thickness) ----------
export const METROLOGY_COLS: Column[] = [
  { key: "lot", label: "lot_id", mono: true },
  { key: "wafers", label: "wafers" },
  { key: "thick", label: "mean_thk (nm)", mono: true },
  { key: "verdict", label: "verdict" },
];

export const METROLOGY: Row[] = [
  { id: "0701", bad: false, cells: { lot: "LOT-0701", wafers: "25", thick: "48.3", verdict: "PASS" } },
  { id: "0702", bad: false, cells: { lot: "LOT-0702", wafers: "25", thick: "48.1", verdict: "PASS" } },
  { id: "0703", bad: true, cells: { lot: "LOT-0703", wafers: "25", thick: "45.1", verdict: "FAIL" } },
  { id: "0704", bad: true, cells: { lot: "LOT-0704", wafers: "25", thick: "44.8", verdict: "FAIL" } },
  { id: "0705", bad: false, cells: { lot: "LOT-0705", wafers: "25", thick: "48.4", verdict: "PASS" } },
  { id: "0706", bad: false, cells: { lot: "LOT-0706", wafers: "25", thick: "48.0", verdict: "PASS" } },
  { id: "0707", bad: true, cells: { lot: "LOT-0707", wafers: "25", thick: "45.3", verdict: "FAIL" } },
  { id: "0708", bad: true, cells: { lot: "LOT-0708", wafers: "25", thick: "44.6", verdict: "FAIL" } },
  { id: "0709", bad: false, cells: { lot: "LOT-0709", wafers: "25", thick: "48.2", verdict: "PASS" } },
  { id: "0710", bad: false, cells: { lot: "LOT-0710", wafers: "25", thick: "48.3", verdict: "PASS" } },
  { id: "0711", bad: true, cells: { lot: "LOT-0711", wafers: "25", thick: "45.5", verdict: "FAIL" } },
];

// ---------- 2. MES / lot tracking (which tool+chamber each lot ran on) ----------
// Each lot goes through 3 process steps: CVD → Etch → CMP.
// The needle: all failing lots share Etch-3/C, but use different CVD & CMP tools.
export const MES_COLS: Column[] = [
  { key: "lot", label: "lot_id", mono: true },
  { key: "step", label: "step" },
  { key: "eqp", label: "equipment", mono: true },
  { key: "chamber", label: "chamber", mono: true },
  { key: "window", label: "time_in–out", mono: true },
];

export const MES: Row[] = [
  // LOT-0701 — PASS
  { id: "0701-cvd",  bad: false, cells: { lot: "LOT-0701", step: "CVD",  eqp: "CVD-2",  chamber: "A", window: "12:00–13:10" } },
  { id: "0701-etch", bad: false, cells: { lot: "LOT-0701", step: "Etch", eqp: "Etch-1", chamber: "A", window: "14:10–15:40" } },
  { id: "0701-cmp",  bad: false, cells: { lot: "LOT-0701", step: "CMP",  eqp: "CMP-1",  chamber: "B", window: "16:00–17:00" } },
  // LOT-0702 — PASS
  { id: "0702-cvd",  bad: false, cells: { lot: "LOT-0702", step: "CVD",  eqp: "CVD-1",  chamber: "B", window: "12:30–13:40" } },
  { id: "0702-etch", bad: false, cells: { lot: "LOT-0702", step: "Etch", eqp: "Etch-1", chamber: "B", window: "15:00–16:30" } },
  { id: "0702-cmp",  bad: false, cells: { lot: "LOT-0702", step: "CMP",  eqp: "CMP-2",  chamber: "A", window: "17:00–18:00" } },
  // LOT-0703 — FAIL  ← bad on Etch only
  { id: "0703-cvd",  bad: false, cells: { lot: "LOT-0703", step: "CVD",  eqp: "CVD-1",  chamber: "A", window: "08:00–09:10" } },
  { id: "0703-etch", bad: true,  cells: { lot: "LOT-0703", step: "Etch", eqp: "Etch-3", chamber: "C", window: "10:05–11:35" } },
  { id: "0703-cmp",  bad: false, cells: { lot: "LOT-0703", step: "CMP",  eqp: "CMP-1",  chamber: "A", window: "12:00–13:00" } },
  // LOT-0704 — FAIL
  { id: "0704-cvd",  bad: false, cells: { lot: "LOT-0704", step: "CVD",  eqp: "CVD-2",  chamber: "B", window: "08:20–09:30" } },
  { id: "0704-etch", bad: true,  cells: { lot: "LOT-0704", step: "Etch", eqp: "Etch-3", chamber: "C", window: "10:40–12:10" } },
  { id: "0704-cmp",  bad: false, cells: { lot: "LOT-0704", step: "CMP",  eqp: "CMP-2",  chamber: "B", window: "13:00–14:00" } },
  // LOT-0705 — PASS (uses Etch-3 but chamber A, not C)
  { id: "0705-cvd",  bad: false, cells: { lot: "LOT-0705", step: "CVD",  eqp: "CVD-2",  chamber: "A", window: "13:30–14:40" } },
  { id: "0705-etch", bad: false, cells: { lot: "LOT-0705", step: "Etch", eqp: "Etch-3", chamber: "A", window: "16:00–17:30" } },
  { id: "0705-cmp",  bad: false, cells: { lot: "LOT-0705", step: "CMP",  eqp: "CMP-1",  chamber: "A", window: "18:00–19:00" } },
  // LOT-0706 — PASS
  { id: "0706-cvd",  bad: false, cells: { lot: "LOT-0706", step: "CVD",  eqp: "CVD-1",  chamber: "A", window: "12:00–13:10" } },
  { id: "0706-etch", bad: false, cells: { lot: "LOT-0706", step: "Etch", eqp: "Etch-2", chamber: "B", window: "14:30–16:00" } },
  { id: "0706-cmp",  bad: false, cells: { lot: "LOT-0706", step: "CMP",  eqp: "CMP-2",  chamber: "A", window: "16:30–17:30" } },
  // LOT-0707 — FAIL
  { id: "0707-cvd",  bad: false, cells: { lot: "LOT-0707", step: "CVD",  eqp: "CVD-2",  chamber: "A", window: "08:30–09:40" } },
  { id: "0707-etch", bad: true,  cells: { lot: "LOT-0707", step: "Etch", eqp: "Etch-3", chamber: "C", window: "11:00–12:30" } },
  { id: "0707-cmp",  bad: false, cells: { lot: "LOT-0707", step: "CMP",  eqp: "CMP-1",  chamber: "B", window: "13:30–14:30" } },
  // LOT-0708 — FAIL
  { id: "0708-cvd",  bad: false, cells: { lot: "LOT-0708", step: "CVD",  eqp: "CVD-1",  chamber: "B", window: "07:50–09:00" } },
  { id: "0708-etch", bad: true,  cells: { lot: "LOT-0708", step: "Etch", eqp: "Etch-3", chamber: "C", window: "10:20–11:50" } },
  { id: "0708-cmp",  bad: false, cells: { lot: "LOT-0708", step: "CMP",  eqp: "CMP-2",  chamber: "A", window: "12:30–13:30" } },
  // LOT-0709 — PASS (uses Etch-3 but chamber A)
  { id: "0709-cvd",  bad: false, cells: { lot: "LOT-0709", step: "CVD",  eqp: "CVD-1",  chamber: "A", window: "13:00–14:10" } },
  { id: "0709-etch", bad: false, cells: { lot: "LOT-0709", step: "Etch", eqp: "Etch-3", chamber: "A", window: "15:20–16:50" } },
  { id: "0709-cmp",  bad: false, cells: { lot: "LOT-0709", step: "CMP",  eqp: "CMP-1",  chamber: "A", window: "17:20–18:20" } },
  // LOT-0710 — PASS (uses Etch-3 but chamber B)
  { id: "0710-cvd",  bad: false, cells: { lot: "LOT-0710", step: "CVD",  eqp: "CVD-2",  chamber: "B", window: "11:30–12:40" } },
  { id: "0710-etch", bad: false, cells: { lot: "LOT-0710", step: "Etch", eqp: "Etch-3", chamber: "B", window: "13:40–15:10" } },
  { id: "0710-cmp",  bad: false, cells: { lot: "LOT-0710", step: "CMP",  eqp: "CMP-2",  chamber: "B", window: "15:40–16:40" } },
  // LOT-0711 — FAIL
  { id: "0711-cvd",  bad: false, cells: { lot: "LOT-0711", step: "CVD",  eqp: "CVD-2",  chamber: "B", window: "09:00–10:10" } },
  { id: "0711-etch", bad: true,  cells: { lot: "LOT-0711", step: "Etch", eqp: "Etch-3", chamber: "C", window: "11:15–12:45" } },
  { id: "0711-cmp",  bad: false, cells: { lot: "LOT-0711", step: "CMP",  eqp: "CMP-1",  chamber: "B", window: "13:20–14:20" } },
];

// ---------- 3. FDC sensor logs (equipment telemetry, keyed by time — no lot) ----------
export const FDC_COLS: Column[] = [
  { key: "eqp", label: "equipment", mono: true },
  { key: "chamber", label: "chamber", mono: true },
  { key: "ts", label: "timestamp", mono: true },
  { key: "rf", label: "rf_power (kW)", mono: true },
  { key: "press", label: "press (mT)", mono: true },
];

// Already scoped to the chamber of interest (Etch-3 / C) across the shift.
export const FDC_ETCH3C: Row[] = [
  { id: "08", drift: false, cells: { eqp: "Etch-3", chamber: "C", ts: "08:00", rf: "2.10", press: "45.1" } },
  { id: "09", drift: false, cells: { eqp: "Etch-3", chamber: "C", ts: "09:00", rf: "2.11", press: "44.9" } },
  { id: "10", drift: true, cells: { eqp: "Etch-3", chamber: "C", ts: "10:00", rf: "2.25", press: "45.0" } },
  { id: "11", drift: true, cells: { eqp: "Etch-3", chamber: "C", ts: "11:00", rf: "2.31", press: "45.2" } },
  { id: "12", drift: true, cells: { eqp: "Etch-3", chamber: "C", ts: "12:00", rf: "2.27", press: "44.8" } },
  { id: "13", drift: false, cells: { eqp: "Etch-3", chamber: "C", ts: "13:00", rf: "2.12", press: "45.1" } },
  { id: "14", drift: false, cells: { eqp: "Etch-3", chamber: "C", ts: "14:00", rf: "2.10", press: "45.0" } },
];
