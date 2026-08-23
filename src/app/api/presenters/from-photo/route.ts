import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canCreatePresenter, getPlan } from "@/lib/plans";
import { completeIdentity } from "@/lib/presenters/identity";
import { storage } from "@/lib/ai/registry";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plan = getPlan(user.plan);
  const count = await db.presenter.count({ where: { ownerId: user.id } });
  if (!canCreatePresenter(plan, count)) {
    return NextResponse.json({ error: `The ${plan.name} plan allows ${plan.customPresenters} custom presenters.` }, { status: 402 });
  }

  const form = await req.formData();
  const photo = form.get("photo");
  if (!(photo instanceof File)) {
    return NextResponse.json({ error: "Upload a clear photo of the presenter." }, { status: 400 });
  }
  const bytes = Buffer.from(await photo.arrayBuffer());
  const rel = `presenters/${user.id}/${Date.now()}-${photo.name.replace(/[^\w.\-]+/g, "_")}`;
  await storage().save(rel, bytes, photo.type || "image/jpeg");

  const identity = completeIdentity(
    {
      name: String(form.get("name") || user.name),
      gender: form.get("gender") === "male" ? "male" : "female",
      appearance: "Photoreal uploaded identity — the Yuna-style motion model will animate this person walking, turning, pointing and smiling",
      brandAssociation: String(form.get("brandAssociation") || ""),
    },
    user.id,
  );

  const presenter = await db.presenter.create({
    data: {
      ownerId: user.id,
      isCustom: true,
      name: identity.name,
      slug: identity.slug,
      gender: identity.gender,
      ageRange: identity.ageRange,
      region: "Custom",
      skinTone: identity.skinTone,
      hair: identity.hair,
      bodyType: "Custom",
      clothingStyle: identity.clothingStyle,
      professionalStyle: "Director / on-camera presenter",
      personality: identity.personality,
      voiceId: identity.voiceId,
      accent: identity.accent,
      languages: identity.languages.join(","),
      speakingTone: identity.speakingTone,
      categories: "General Marketing",
      studioStyle: identity.studioStyle,
      bio: `${identity.name} is a motion-ready presenter created from an uploaded photograph. The same person walks, turns, points, and smiles while talking — the same performance as every library model.`,
      portraitSeed: identity.seed,
      portraitUrl: rel,
      brandAssociation: identity.brandAssociation,
    },
  });
  return NextResponse.json(presenter);
}
