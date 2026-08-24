import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { completeIdentity } from "@/lib/presenters/identity";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await db.presenter.findFirst({ where: { id, ownerId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const identity = completeIdentity({ ...existing, ...body, languages: body.languages ?? existing.languages.split(",") }, user.id);
  const presenter = await db.presenter.update({
    where: { id },
    data: {
      name: identity.name,
      gender: identity.gender,
      ageRange: identity.ageRange,
      skinTone: identity.skinTone,
      hair: identity.hair,
      clothingStyle: identity.clothingStyle,
      professionalStyle: identity.professionalStyle,
      personality: identity.personality,
      voiceId: identity.voiceId,
      accent: identity.accent,
      languages: identity.languages.join(","),
      speakingTone: identity.speakingTone,
      studioStyle: identity.studioStyle,
      bio: identity.bio,
      brandAssociation: identity.brandAssociation,
      portraitSeed: identity.seed,
    },
  });
  return NextResponse.json(presenter);
}
