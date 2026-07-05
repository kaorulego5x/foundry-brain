// Live investigation: Claude runs the yield-engineer tool loop over the mock
// fab data and we translate each tool call into InvestigationEvents over SSE.
// The UI consumes the same event shape as the scripted replay.

import Anthropic from "@anthropic-ai/sdk";
import { METROLOGY, MES, FDC_ETCH3C, type Row } from "@/lib/demo-data";
import type { InvestigationEvent, PhaseId } from "@/lib/events";

export const dynamic = "force-dynamic";

const SPEC_NM = 48.2;
const THICKNESS_LIMIT_NM = 46.7;
const RF_SPEC_KW = 2.1;
const RF_TOL_KW = 0.1;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "query_metrology",
    description:
      "Query the quality-inspection database. Returns per-lot mean film thickness and pass/fail verdicts for today's lots. Call this first to find which lots are failing.",
    input_schema: {
      type: "object",
      properties: {
        max_thickness_nm: {
          type: "number",
          description: `Return lots with mean thickness below this value as failing (spec target is ${SPEC_NM} nm, control limit ${THICKNESS_LIMIT_NM} nm)`,
        },
      },
    },
  },
  {
    name: "query_mes",
    description:
      "Query the production-history (MES) database. Returns the full equipment route (CVD, Etch, CMP steps with equipment, chamber and time window) for the given lots. Use it to find what the failing lots have in common.",
    input_schema: {
      type: "object",
      properties: {
        lot_ids: {
          type: "array",
          items: { type: "string" },
          description: 'Lot ids to trace, e.g. ["LOT-0703"]',
        },
      },
      required: ["lot_ids"],
    },
  },
  {
    name: "query_fdc",
    description:
      "Query the machine-sensor (FDC) logs for one equipment chamber. Returns hourly RF power and pressure readings across the shift. FDC data is keyed by equipment + chamber + timestamp; it has no lot ids.",
    input_schema: {
      type: "object",
      properties: {
        equipment: { type: "string", description: 'e.g. "Etch-3"' },
        chamber: { type: "string", description: 'e.g. "C"' },
      },
      required: ["equipment", "chamber"],
    },
  },
];

const SYSTEM = `You are Foundry Brain, an AI yield engineer for a semiconductor fab.
A yield alert fired: line yield dropped 12% today; several of the 11 lots failed final inspection.

Investigate the root cause the way an experienced yield engineer would:
1. query_metrology — confirm which lots fail the thickness spec (${SPEC_NM} nm target; below ${THICKNESS_LIMIT_NM} nm is failing).
2. query_mes — trace those failing lots' equipment routes and find what they share (same equipment + chamber + time window) that passing lots don't.
3. query_fdc — pull the sensor trace for the suspect chamber and check for drift (RF power spec is ${RF_SPEC_KW} kW ±${RF_TOL_KW}; the alarm limit is ${RF_SPEC_KW + 0.15} kW).
4. Conclude: name the root-cause equipment/chamber, the physical mechanism, and the recommended action.

Before each tool call, write exactly one short sentence saying what you learned and what you will check next. Your final answer must be at most 3 sentences: root cause, mechanism, action.`;

const toolStep: Record<string, number> = {
  query_metrology: 1,
  query_mes: 2,
  query_fdc: 3,
};

const mesPhase: Record<string, PhaseId> = {
  CVD: "CVD",
  Etch: "ETCH",
  CMP: "CMP",
};

function rowsToJson(rows: Row[]) {
  return rows.map((r) => r.cells);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not set" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (ev: InvestigationEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));

      try {
        await runInvestigation(client, emit);
      } catch (err) {
        console.error("investigation failed:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: String(err) })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
}

async function runInvestigation(
  client: Anthropic,
  emit: (ev: InvestigationEvent) => void,
) {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content:
        "Yield dropped 12% today — find the root cause and tell me what to do.",
    },
  ];

  let currentStep = 0;
  let suspectPhase: PhaseId = "ETCH";

  for (let turn = 0; turn < 8; turn++) {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: SYSTEM,
      tools: TOOLS,
      messages,
    });

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim();

    if (response.stop_reason !== "tool_use") {
      // Final answer — lock the verdict.
      emit({ type: "step_start", step: 4 });
      if (text) emit({ type: "step_detail", step: 4, detail: text });
      await sleep(1200);
      emit({ type: "phase", phase: suspectPhase, state: "root-cause" });
      await sleep(800);
      emit({ type: "verdict" });
      emit({ type: "done" });
      return;
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tool of toolUses) {
      const step = toolStep[tool.name] ?? currentStep;
      if (step !== currentStep) {
        currentStep = step;
        emit({ type: "step_start", step });
        if (text) emit({ type: "step_detail", step, detail: text });
      }

      const result = await execTool(tool, emit, (p) => (suspectPhase = p));
      toolResults.push({
        type: "tool_result",
        tool_use_id: tool.id,
        content: JSON.stringify(result),
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  throw new Error("investigation did not converge within 8 turns");
}

async function execTool(
  tool: { name: string; input: unknown },
  emit: (ev: InvestigationEvent) => void,
  setSuspect: (p: PhaseId) => void,
) {
  const input = (tool.input ?? {}) as Record<string, unknown>;

  if (tool.name === "query_metrology") {
    emit({ type: "phase", phase: "INSPECT", state: "investigating" });
    const limit =
      typeof input.max_thickness_nm === "number"
        ? input.max_thickness_nm
        : THICKNESS_LIMIT_NM;
    const hits = METROLOGY.filter(
      (r) => parseFloat(r.cells.thick) < limit,
    );
    emit({ type: "rows", source: "MET", hitIds: hits.map((r) => r.id) });
    await sleep(600);
    emit({ type: "phase", phase: "INSPECT", state: "detected" });
    return {
      lots: rowsToJson(METROLOGY),
      failing_lot_ids: hits.map((r) => r.cells.lot),
    };
  }

  if (tool.name === "query_mes") {
    const lotIds = Array.isArray(input.lot_ids)
      ? (input.lot_ids as string[])
      : [];
    const rows = MES.filter((r) => lotIds.includes(r.cells.lot));

    // Commonality: which (step, equipment, chamber) do ALL queried lots share?
    const byKey = new Map<string, Set<string>>();
    for (const r of rows) {
      const key = `${r.cells.step}|${r.cells.eqp}|${r.cells.chamber}`;
      if (!byKey.has(key)) byKey.set(key, new Set());
      byKey.get(key)!.add(r.cells.lot);
    }
    const common = [...byKey.entries()].find(
      ([, lots]) => lots.size === lotIds.length && lotIds.length > 1,
    );
    const commonStep = common?.[0].split("|")[0];
    const hitIds = common
      ? rows
          .filter(
            (r) =>
              `${r.cells.step}|${r.cells.eqp}|${r.cells.chamber}` === common[0],
          )
          .map((r) => r.id)
      : [];

    // Backtrack animation: inspect each phase upstream of the detection point.
    for (const phase of ["CMP", "ETCH", "CVD"] as const) {
      emit({ type: "phase", phase, state: "investigating" });
      await sleep(700);
      const isSuspect = commonStep && mesPhase[commonStep] === phase;
      emit({ type: "phase", phase, state: isSuspect ? "suspect" : "cleared" });
      if (isSuspect) setSuspect(phase);
    }
    emit({ type: "rows", source: "MES", hitIds });
    return {
      routes: rowsToJson(rows),
      shared_by_all_queried_lots: common
        ? { step: common[0].split("|")[0], equipment: common[0].split("|")[1], chamber: common[0].split("|")[2] }
        : null,
    };
  }

  if (tool.name === "query_fdc") {
    // Mock FDC only has the Etch-3/C trace; other chambers read nominal.
    const isEtch3C =
      input.equipment === "Etch-3" && String(input.chamber).toUpperCase() === "C";
    const rows = isEtch3C ? FDC_ETCH3C : [];
    const hits = rows.filter(
      (r) => Math.abs(parseFloat(r.cells.rf) - RF_SPEC_KW) > RF_TOL_KW,
    );
    emit({ type: "rows", source: "FDC", hitIds: hits.map((r) => r.id) });
    return {
      readings: rowsToJson(rows),
      note: isEtch3C
        ? `spec ${RF_SPEC_KW} kW ±${RF_TOL_KW}, alarm limit ${RF_SPEC_KW + 0.15} kW`
        : "no anomalies recorded for that chamber; nominal all shift",
    };
  }

  return { error: `unknown tool: ${tool.name}` };
}
