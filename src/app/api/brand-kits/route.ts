import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const kit = await db.brandKit.create({
    data: {
      userId: user.id,
      name: String(body.name),
      businessName: String(body.businessName ?? body.name),
      productInfo: String(body.productInfo ?? ""),
      website: body.website ? String(body.website) : null,
      colors: JSON.stringify(String(body.colors ?? "#0c0c14,#d4a853").split(",").map((s: string) => s.trim())),
      fonts: JSON.stringify(String(body.fonts ?? "Fraunces, Outfit").split(",").map((s: string) => s.trim())),
      defaultCta: String(body.defaultCta ?? "Get started"),
      preferredVoice: body.preferredVoice ? String(body.preferredVoice) : null,
      preferredStyle: body.preferredStyle ? String(body.preferredStyle) : null,
      preferredPresenterId: body.preferredPresenterId || null,
    },
  });
  return NextResponse.json(kit);
}
