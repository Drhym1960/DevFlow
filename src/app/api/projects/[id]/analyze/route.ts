import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import { llm, translator } from "@/lib/ai/registry";
import { fetchSiteContext } from "@/lib/engine/analyze-site";
import type { BrandBrief } from "@/lib/ai/ports";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const project = await db.project.findFirst({
    where: { id, userId: user.id },
    include: { presenter: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const brief = parseJson<BrandBrief>(project.brief, { business: project.title, product: project.title });
  const site = await fetchSiteContext(brief.website);
  if (site) brief.extra = `${brief.extra ?? ""}\n${site}`.trim();

  const analysis = await llm().analyze(brief);
  let script = await llm().writeScript({
    brief,
    analysis,
    goal: project.goal ?? "product-ad",
    tone: project.voiceTone,
    language: project.language,
    presenterName: project.presenter?.name ?? "the presenter",
  });
  if (project.language !== "en") {
    script = {
      ...script,
      voiceover: await translator().translate(script.voiceover, project.language),
      captions: await translator().translate(script.captions, project.language),
      cta: await translator().translate(script.cta, project.language),
      language: project.language,
    };
  }

  await db.project.update({
    where: { id },
    data: {
      status: "script_review",
      analysis: JSON.stringify(analysis),
      script: JSON.stringify(script),
      brief: JSON.stringify(brief),
      cta: script.cta,
    },
  });
  return NextResponse.json({ analysis, script });
}
