import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canCreatePresenter, canRenderVideo, getPlan } from "@/lib/plans";
import { completeIdentity } from "@/lib/presenters/identity";
import { inferPresenterFromPrompt, stillPromptFor } from "@/lib/presenters/motion-prompt";
import { expandIdea } from "@/lib/studio/expand-idea";
import { saveGeneratedImage } from "@/lib/studio/save-image";
import { llm, translator } from "@/lib/ai/registry";
import { enqueueRender } from "@/lib/jobs/queue";
import type { BrandBrief } from "@/lib/ai/ports";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plan = getPlan(user.plan);
  const body = await req.json();
  const idea = String(body.idea || "").trim();
  if (idea.length < 8) {
    return NextResponse.json({ error: "Write anything — a product, a person, a feeling. The studio will take it from there." }, { status: 400 });
  }

  const film = expandIdea(idea, { voiceId: body.voiceId ? String(body.voiceId) : undefined });
  const render = Boolean(body.render);
  if (render && !canRenderVideo(plan, user.videosUsed)) {
    return NextResponse.json({ error: "Monthly video limit reached for this plan." }, { status: 402 });
  }

  let presenter = film.wantsCustomModel
    ? null
    : await db.presenter.findFirst({
        where: { slug: film.librarySlug, isCustom: false },
      });

  if (!presenter && film.wantsCustomModel) {
    const count = await db.presenter.count({ where: { ownerId: user.id } });
    if (!canCreatePresenter(plan, count)) {
      presenter = await db.presenter.findFirst({ where: { slug: film.librarySlug, isCustom: false } });
    } else {
      const look = inferPresenterFromPrompt(idea);
      const identity = completeIdentity(
        {
          name: String(body.name || "").trim() || undefined,
          gender: film.gender,
          appearance: film.directorPrompt || idea,
          skinTone: look.skinTone,
          hair: look.hair,
          clothingStyle: look.clothingStyle,
          professionalStyle: look.professionalStyle,
          speakingTone: film.tone,
          voiceId: film.voiceId,
        },
        user.id,
      );
      const portraitUrl = await saveGeneratedImage(
        stillPromptFor(identity, film.directorPrompt || idea),
        `presenters/${user.id}/${Date.now()}-${identity.slug}.png`,
      );
      presenter = await db.presenter.create({
        data: {
          ownerId: user.id,
          isCustom: true,
          name: identity.name,
          slug: identity.slug,
          gender: identity.gender,
          ageRange: identity.ageRange,
          region: look.region,
          skinTone: identity.skinTone,
          hair: identity.hair,
          bodyType: "Custom",
          clothingStyle: identity.clothingStyle,
          professionalStyle: identity.professionalStyle,
          personality: identity.personality,
          voiceId: film.voiceId,
          accent: identity.accent,
          languages: identity.languages.join(","),
          speakingTone: identity.speakingTone,
          categories: "General Marketing",
          studioStyle: identity.studioStyle,
          bio: `${identity.name} was created from a client idea. The studio generated the portrait and will perform it with Yuna-level motion.`,
          portraitSeed: identity.seed,
          portraitUrl,
          brandAssociation: film.business,
        },
      });
    }
  }

  if (!presenter) {
    presenter = await db.presenter.findFirst({ where: { isCustom: false }, orderBy: { name: "asc" } });
  }
  if (!presenter) {
    return NextResponse.json({ error: "No presenter is available in the library yet." }, { status: 500 });
  }

  const assetPaths: string[] = [];
  const productStill = await saveGeneratedImage(
    `Photoreal vertical product still for an advertisement. ${film.product}. Clean premium studio lighting, no celebrity, no readable labels.`,
    `uploads/${user.id}/${Date.now()}-idea-product.png`,
  );
  if (productStill) {
    assetPaths.push(productStill);
    await db.asset.create({
      data: {
        userId: user.id,
        kind: "product",
        filename: "idea-product.png",
        path: productStill,
        mime: "image/png",
        label: film.business,
      },
    });
  }

  const brief: BrandBrief = {
    business: film.business,
    product: film.product,
    extra: film.extra,
    idea,
    directorPrompt: film.directorPrompt || undefined,
    durationSeconds: film.durationSeconds,
    voiceId: film.voiceId,
    colors: ["#0c0c14", "#d4a853", "#f4f1ea"],
    assetLabels: assetPaths.map((_, i) => `Generated product ${i + 1}`),
    assetPaths,
  };

  const project = await db.project.create({
    data: {
      userId: user.id,
      title: film.business,
      status: render ? "rendering" : "draft",
      format: film.format,
      goal: film.goal,
      language: film.language,
      voiceTone: film.tone,
      music: film.music,
      presenterId: presenter.id,
      brief: JSON.stringify(brief),
    },
  });

  const analysis = await llm().analyze(brief);
  let script = await llm().writeScript({
    brief,
    analysis,
    goal: film.goal,
    tone: film.tone,
    language: film.language,
    presenterName: presenter.name,
  });
  if (film.language !== "en") {
    script = {
      ...script,
      voiceover: await translator().translate(script.voiceover, film.language),
      captions: await translator().translate(script.captions, film.language),
      cta: await translator().translate(script.cta, film.language),
      language: film.language,
    };
  }

  await db.project.update({
    where: { id: project.id },
    data: {
      status: render ? "rendering" : "script_review",
      analysis: JSON.stringify(analysis),
      script: JSON.stringify(script),
      cta: script.cta,
    },
  });

  let jobId: string | undefined;
  if (render) {
    const job = await enqueueRender(project.id);
    jobId = job.id;
  }

  return NextResponse.json({
    id: project.id,
    projectId: project.id,
    jobId,
    presenter,
    film,
    analysis,
    script,
    brief,
  });
}
