import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const project = await db.project.create({
    data: {
      userId: user.id,
      title: String(body.title ?? "Untitled film"),
      status: body.status ?? "draft",
      format: body.format ?? "landscape",
      goal: body.goal,
      language: body.language ?? "en",
      voiceTone: body.voiceTone ?? "Professional",
      music: body.music ?? "cinematic-warm",
      presenterId: body.presenterId || null,
      brandKitId: body.brandKitId || null,
      brief: JSON.stringify(body.brief ?? {}),
    },
  });
  return NextResponse.json(project);
}
