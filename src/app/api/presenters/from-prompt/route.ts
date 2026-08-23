import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canCreatePresenter, getPlan } from "@/lib/plans";
import { completeIdentity } from "@/lib/presenters/identity";
import { inferPresenterFromPrompt } from "@/lib/presenters/motion-prompt";
import { images, storage } from "@/lib/ai/registry";
import { stillPromptFor } from "@/lib/presenters/motion-prompt";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plan = getPlan(user.plan);
  const count = await db.presenter.count({ where: { ownerId: user.id } });
  if (!canCreatePresenter(plan, count)) {
    return NextResponse.json({ error: `The ${plan.name} plan allows ${plan.customPresenters} custom presenters.` }, { status: 402 });
  }

  const body = await req.json();
  const directorPrompt = String(body.prompt || "").trim();
  if (directorPrompt.length < 12) {
    return NextResponse.json({ error: "Describe how the model should look and move." }, { status: 400 });
  }
  const inferred = inferPresenterFromPrompt(directorPrompt);
  const identity = completeIdentity(
    {
      name: String(body.name || "").trim() || undefined,
      gender: inferred.gender,
      appearance: directorPrompt,
      skinTone: inferred.skinTone,
      hair: inferred.hair,
      clothingStyle: inferred.clothingStyle,
      professionalStyle: inferred.professionalStyle,
      speakingTone: inferred.speakingTone,
      studioStyle: inferred.studioStyle,
      brandAssociation: String(body.brandAssociation || ""),
    },
    user.id,
  );

  let portraitUrl: string | undefined;
  const generated = await images().generate(stillPromptFor(identity, directorPrompt));
  if (generated.imagePath?.startsWith("http")) {
    const res = await fetch(generated.imagePath);
    if (res.ok) {
      const rel = `presenters/${user.id}/${Date.now()}-${identity.slug}.png`;
      await storage().save(rel, Buffer.from(await res.arrayBuffer()), "image/png");
      portraitUrl = rel;
    }
  }

  const presenter = await db.presenter.create({
    data: {
      ownerId: user.id,
      isCustom: true,
      name: identity.name,
      slug: identity.slug,
      gender: identity.gender,
      ageRange: identity.ageRange,
      region: inferred.region,
      skinTone: identity.skinTone,
      hair: identity.hair,
      bodyType: "Custom",
      clothingStyle: identity.clothingStyle,
      professionalStyle: identity.professionalStyle,
      personality: identity.personality,
      voiceId: identity.voiceId,
      accent: identity.accent,
      languages: identity.languages.join(","),
      speakingTone: identity.speakingTone,
      categories: "General Marketing",
      studioStyle: identity.studioStyle,
      bio: `${identity.name} was created from a client director prompt. They perform with Yuna-level motion, following the requested look and movement.`,
      portraitSeed: identity.seed,
      portraitUrl,
      brandAssociation: identity.brandAssociation,
    },
  });
  return NextResponse.json({ ...presenter, directorPrompt });
}
