import { NextRequest, NextResponse } from "next/server";
import { readIndex, createAnalysis } from "@/lib/analyses-store";
import type { Analysis } from "@/lib/analysis";

export const dynamic = "force-dynamic";

export async function GET() {
  const index = await readIndex();
  return NextResponse.json(index);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Analysis;
  if (!body?.id) {
    return NextResponse.json({ error: "analysis.id is required" }, { status: 400 });
  }
  const summary = await createAnalysis(body);
  return NextResponse.json(summary, { status: 201 });
}
