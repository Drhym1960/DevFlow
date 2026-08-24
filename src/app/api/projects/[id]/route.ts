import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const existing = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = await db.project.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      status: body.status ?? existing.status,
      format: body.format ?? existing.format,
      goal: body.goal ?? existing.goal,
      language: body.language ?? existing.language,
      voiceTone: body.voiceTone ?? existing.voiceTone,
      music: body.music ?? existing.music,
      presenterId: body.presenterId ?? existing.presenterId,
      brandKitId: body.brandKitId ?? existing.brandKitId,
      brief: body.brief ? JSON.stringify(body.brief) : existing.brief,
      script: body.script ? JSON.stringify(body.script) : existing.script,
      scenes: body.scenes ? JSON.stringify(body.scenes) : existing.scenes,
      cta: body.cta ?? existing.cta,
    },
  });
  return NextResponse.json(project);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const project = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}
