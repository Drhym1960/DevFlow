import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canCreatePresenter, getPlan } from "@/lib/plans";
import { completeIdentity } from "@/lib/presenters/identity";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plan = getPlan(user.plan);
  const count = await db.presenter.count({ where: { ownerId: user.id } });
  if (!canCreatePresenter(plan, count)) {
    return NextResponse.json({ error: `The ${plan.name} plan allows ${plan.customPresenters} custom presenters.` }, { status: 402 });
  }
  const body = await req.json();
  const identity = completeIdentity(body, user.id);
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
      professionalStyle: identity.professionalStyle,
      personality: identity.personality,
      voiceId: identity.voiceId,
      accent: identity.accent,
      languages: identity.languages.join(","),
      speakingTone: identity.speakingTone,
      categories: "General Marketing",
      studioStyle: identity.studioStyle,
      bio: identity.bio,
      portraitSeed: identity.seed,
      brandAssociation: identity.brandAssociation,
    },
  });
  return NextResponse.json(presenter);
}
