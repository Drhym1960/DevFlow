import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const job = await db.job.findUnique({ where: { id }, include: { project: true } });
  if (!job || job.project.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: job.id,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    error: job.error,
    logs: parseJson(job.logs, []),
  });
}
