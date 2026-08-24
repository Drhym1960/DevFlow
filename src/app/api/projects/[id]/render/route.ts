import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canRenderVideo, getPlan } from "@/lib/plans";
import { enqueueRender } from "@/lib/jobs/queue";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plan = getPlan(user.plan);
  if (!canRenderVideo(plan, user.videosUsed)) {
    return NextResponse.json({ error: "Monthly video limit reached for this plan." }, { status: 402 });
  }
  const { id } = await params;
  const project = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const job = await enqueueRender(project.id);
  await db.project.update({ where: { id }, data: { status: "rendering" } });
  return NextResponse.json({ jobId: job.id });
}
