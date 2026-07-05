import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function POST(req: Request) {
  const body = await req.json();
  const { analysisId, rating, notes, failureTags } = body as {
    analysisId?: string;
    rating?: string;
    notes?: string;
    failureTags?: string[];
  };

  if (!analysisId || !["good", "bad", "partial"].includes(rating ?? "")) {
    return NextResponse.json({ error: "analysisId and rating (good|bad|partial) required" }, { status: 400 });
  }

  const feedback = {
    analysis_id: analysisId,
    rating,
    reviewer: "operator" as const,
    timestamp: new Date().toISOString(),
    failure_tags: failureTags ?? [],
    notes: notes ?? "",
  };

  const dir = path.join(process.cwd(), "public/analyses");
  const fbPath = path.join(dir, `${analysisId}.feedback.json`);
  await writeFile(fbPath, JSON.stringify(feedback, null, 2) + "\n");

  const syncScript = path.resolve(
    process.cwd(),
    "../.claude/skills/foundry-brain/bin/foundry-sync-feedback.py",
  );
  try {
    await execFileAsync("python3", [syncScript, fbPath]);
  } catch {
    // gbrain optional
  }

  return NextResponse.json({ ok: true, feedback });
}
