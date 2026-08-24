import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canCreatePresenter, getPlan } from "@/lib/plans";
import { uniqueSlug } from "@/lib/utils";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plan = getPlan(user.plan);
  const count = await db.presenter.count({ where: { ownerId: user.id } });
  if (!canCreatePresenter(plan, count)) {
    return NextResponse.json({ error: "Presenter limit reached" }, { status: 402 });
  }
  const { id } = await params;
  const source = await db.presenter.findFirst({
    where: { id, OR: [{ ownerId: user.id }, { isCustom: false }] },
  });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const copy = await db.presenter.create({
    data: {
      ownerId: user.id,
      isCustom: true,
      name: `${source.name} Copy`,
      slug: uniqueSlug(source.name, `${user.id}-copy`),
      gender: source.gender,
      ageRange: source.ageRange,
      region: source.region,
      skinTone: source.skinTone,
      hair: source.hair,
      bodyType: source.bodyType,
      clothingStyle: source.clothingStyle,
      professionalStyle: source.professionalStyle,
      personality: source.personality,
      voiceId: source.voiceId,
      accent: source.accent,
      languages: source.languages,
      speakingTone: source.speakingTone,
      categories: source.categories,
      studioStyle: source.studioStyle,
      bio: source.bio,
      portraitSeed: `${source.portraitSeed}-copy-${Date.now()}`,
      brandAssociation: source.brandAssociation,
      duplicatedFromId: source.id,
    },
  });
  return NextResponse.redirect(new URL(`/presenters/${copy.slug}`, process.env.APP_URL ?? "http://localhost:3000"));
}
