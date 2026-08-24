import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { llm, translator } from "@/lib/ai/registry";
import type { ScriptDraft } from "@/lib/ai/ports";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const project = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const instruction = String(body.instruction ?? "Rewrite with AI");
  let script = (body.script ?? {}) as ScriptDraft;
  if (instruction.toLowerCase().includes("translate")) {
    const language = body.language ?? project.language;
    script = {
      ...script,
      voiceover: await translator().translate(script.voiceover, language),
      captions: await translator().translate(script.captions, language),
      cta: await translator().translate(script.cta, language),
      language,
    };
  } else {
    script = await llm().rewriteScript({ script, instruction, language: project.language });
  }
  await db.project.update({ where: { id }, data: { script: JSON.stringify(script), cta: script.cta } });
  return NextResponse.json({ script });
}
