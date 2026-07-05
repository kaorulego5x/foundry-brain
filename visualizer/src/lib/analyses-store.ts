// Filesystem-backed store for excursion analyses, read and written only from
// Route Handlers (never imported by client components). Records live under
// data/analyses/<id>.json, listed in data/analyses/index.json.

import { readFile, writeFile, unlink } from "fs/promises";
import path from "path";
import type { Analysis, AnalysisSummary } from "./analysis";

const DATA_DIR = path.join(process.cwd(), "data", "analyses");
const INDEX_PATH = path.join(DATA_DIR, "index.json");

function recordPath(id: string): string {
  return path.join(DATA_DIR, `${id}.json`);
}

function toSummary(analysis: Analysis): AnalysisSummary {
  return {
    id: analysis.id,
    timestamp: analysis.timestamp,
    query: analysis.query,
    rootCause: analysis.verdict.rootCause,
    yieldDeltaPct: analysis.alert.yieldDeltaPct,
  };
}

export async function readIndex(): Promise<AnalysisSummary[]> {
  const raw = await readFile(INDEX_PATH, "utf-8");
  return JSON.parse(raw) as AnalysisSummary[];
}

async function writeIndex(list: AnalysisSummary[]): Promise<void> {
  await writeFile(INDEX_PATH, JSON.stringify(list, null, 2) + "\n", "utf-8");
}

export async function readAnalysis(id: string): Promise<Analysis | null> {
  try {
    const raw = await readFile(recordPath(id), "utf-8");
    return JSON.parse(raw) as Analysis;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function createAnalysis(analysis: Analysis): Promise<AnalysisSummary> {
  await writeFile(recordPath(analysis.id), JSON.stringify(analysis, null, 2) + "\n", "utf-8");
  const index = await readIndex();
  const summary = toSummary(analysis);
  const next = [summary, ...index.filter((e) => e.id !== analysis.id)];
  await writeIndex(next);
  return summary;
}

export async function updateAnalysis(id: string, analysis: Analysis): Promise<AnalysisSummary | null> {
  const existing = await readAnalysis(id);
  if (!existing) return null;
  const merged = { ...analysis, id };
  await writeFile(recordPath(id), JSON.stringify(merged, null, 2) + "\n", "utf-8");
  const index = await readIndex();
  const summary = toSummary(merged);
  await writeIndex(index.map((e) => (e.id === id ? summary : e)));
  return summary;
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  const existing = await readAnalysis(id);
  if (!existing) return false;
  await unlink(recordPath(id));
  const index = await readIndex();
  await writeIndex(index.filter((e) => e.id !== id));
  return true;
}
