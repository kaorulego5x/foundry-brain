// Investigation is driven by a stream of events so the same UI can be fed by
// either the scripted replay (below) or a live LLM run over SSE.

import { METROLOGY, MES, FDC_ETCH3C } from "./demo-data";

export type PhaseId = "CVD" | "ETCH" | "CMP" | "INSPECT";

export type PhaseState =
  | "pending"
  | "detected"
  | "investigating"
  | "cleared"
  | "suspect"
  | "root-cause";

export type SourceId = "MET" | "MES" | "FDC";

export type InvestigationEvent =
  | { type: "step_start"; step: number }
  | { type: "phase"; phase: PhaseId; state: PhaseState }
  | { type: "rows"; source: SourceId; hitIds: string[] }
  | { type: "step_detail"; step: number; detail: string }
  | { type: "verdict" }
  | { type: "done" };

export const INITIAL_PHASES: Record<PhaseId, PhaseState> = {
  CVD: "pending",
  ETCH: "pending",
  CMP: "pending",
  INSPECT: "detected",
};

// The strip once the investigation has concluded.
export const FINAL_PHASES: Record<PhaseId, PhaseState> = {
  CVD: "cleared",
  ETCH: "root-cause",
  CMP: "cleared",
  INSPECT: "detected",
};

export const MET_HITS = METROLOGY.filter((r) => r.bad).map((r) => r.id);
export const MES_HITS = MES.filter((r) => r.bad).map((r) => r.id);
export const FDC_HITS = FDC_ETCH3C.filter((r) => r.drift).map((r) => r.id);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Live mode: consume SSE events from the LLM tool-use loop at /api/investigate.
export async function* liveInvestigation(): AsyncGenerator<InvestigationEvent> {
  const res = await fetch("/api/investigate", { method: "POST" });
  if (!res.ok || !res.body) {
    throw new Error(`investigate API failed: ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const chunk = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 2);
      if (!chunk.startsWith("data: ")) continue;
      const ev = JSON.parse(chunk.slice(6));
      if (ev.type === "error") throw new Error(ev.message);
      yield ev as InvestigationEvent;
    }
  }
}

// Scripted replay. Total runtime matches the original STEPS timing
// (0.9s lead-in, then 4.2s / 4.6s / 4.6s / 2.2s).
export async function* replayInvestigation(): AsyncGenerator<InvestigationEvent> {
  await sleep(900);

  // Step 1 — quality inspection: confirm the failure signature
  yield { type: "step_start", step: 1 };
  yield { type: "phase", phase: "INSPECT", state: "investigating" };
  await sleep(1600);
  yield { type: "rows", source: "MET", hitIds: MET_HITS };
  await sleep(2600);
  yield { type: "phase", phase: "INSPECT", state: "detected" };

  // Step 2 — trace backwards through production history: CMP → Etch → CVD
  yield { type: "step_start", step: 2 };
  yield { type: "phase", phase: "CMP", state: "investigating" };
  await sleep(1100);
  yield { type: "phase", phase: "CMP", state: "cleared" };
  yield { type: "phase", phase: "ETCH", state: "investigating" };
  yield { type: "rows", source: "MES", hitIds: MES_HITS };
  await sleep(1400);
  yield { type: "phase", phase: "ETCH", state: "suspect" };
  yield { type: "phase", phase: "CVD", state: "investigating" };
  await sleep(1100);
  yield { type: "phase", phase: "CVD", state: "cleared" };
  await sleep(1000);

  // Step 3 — sensor telemetry on the suspect chamber
  yield { type: "step_start", step: 3 };
  yield { type: "rows", source: "FDC", hitIds: FDC_HITS };
  await sleep(4600);

  // Step 4 — correlate & lock the root cause
  yield { type: "step_start", step: 4 };
  await sleep(1200);
  yield { type: "phase", phase: "ETCH", state: "root-cause" };
  await sleep(1000);
  yield { type: "verdict" };
  yield { type: "done" };
}
