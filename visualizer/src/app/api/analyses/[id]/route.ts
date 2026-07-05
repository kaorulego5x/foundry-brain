import { NextRequest, NextResponse } from "next/server";
import { readAnalysis, updateAnalysis, deleteAnalysis } from "@/lib/analyses-store";
import type { Analysis } from "@/lib/analysis";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/analyses/[id]">) {
  const { id } = await ctx.params;
  const analysis = await readAnalysis(id);
  if (!analysis) {
    return NextResponse.json({ error: `analysis ${id} not found` }, { status: 404 });
  }
  return NextResponse.json(analysis);
}

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/analyses/[id]">) {
  const { id } = await ctx.params;
  const body = (await request.json()) as Analysis;
  const summary = await updateAnalysis(id, body);
  if (!summary) {
    return NextResponse.json({ error: `analysis ${id} not found` }, { status: 404 });
  }
  return NextResponse.json(summary);
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/analyses/[id]">) {
  const { id } = await ctx.params;
  const deleted = await deleteAnalysis(id);
  if (!deleted) {
    return NextResponse.json({ error: `analysis ${id} not found` }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
