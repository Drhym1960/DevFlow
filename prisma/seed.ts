import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { LIBRARY_PRESENTERS } from "../src/lib/presenters/catalog";

const db = new PrismaClient();

const templates = [
  {
    name: "App walkthrough",
    category: "Apps & Software",
    goal: "app-promo",
    description: "Presenter opens, product screens float, private CTA.",
    format: "vertical",
    scenePlan: JSON.stringify(["studio-presenter", "presenter-left-product-right", "floating-screens", "logo-cta"]),
  },
  {
    name: "Luxury product film",
    category: "Luxury",
    goal: "product-ad",
    description: "Stillness, material close-ups, quiet close.",
    format: "landscape",
    scenePlan: JSON.stringify(["lifestyle-presenter", "product-only", "presenter-right-product-left", "logo-cta"]),
  },
  {
    name: "Social offer",
    category: "Ecommerce",
    goal: "offer",
    description: "Fast hook, product proof, offer lockup.",
    format: "square",
    scenePlan: JSON.stringify(["presenter-full", "product-only", "presenter-pip", "logo-cta"]),
  },
  {
    name: "MysticTxt sample",
    category: "Apps & Software",
    goal: "app-promo",
    description: "Private advisors, Live Chat, Voice Call, Talk to a Live Coach.",
    format: "vertical",
    scenePlan: JSON.stringify([
      "studio-presenter",
      "presenter-left-product-right",
      "floating-screens",
      "product-only",
      "presenter-pip",
      "logo-cta",
    ]),
  },
];

async function main() {
  for (const p of LIBRARY_PRESENTERS) {
    await db.presenter.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        gender: p.gender,
        ageRange: p.ageRange,
        region: p.region,
        skinTone: p.skinTone,
        hair: p.hair,
        bodyType: p.bodyType,
        clothingStyle: p.clothingStyle,
        professionalStyle: p.professionalStyle,
        personality: p.personality,
        voiceId: p.voiceId,
        accent: p.accent,
        languages: p.languages.join(","),
        speakingTone: p.speakingTone,
        categories: p.categories.join(","),
        studioStyle: p.studioStyle,
        bio: p.bio,
        portraitSeed: p.slug,
        isCustom: false,
      },
    });
  }

  for (const t of templates) {
    const existing = await db.template.findFirst({ where: { name: t.name } });
    if (!existing) await db.template.create({ data: t });
  }

  const passwordHash = await bcrypt.hash("studio1234", 10);
  const user = await db.user.upsert({
    where: { email: "studio@devflow.ai" },
    update: {},
    create: {
      email: "studio@devflow.ai",
      passwordHash,
      name: "DevFlow Studio",
      company: "DevFlow",
      plan: "studio",
    },
  });

  const amara = await db.presenter.findUnique({ where: { slug: "amara-okonkwo" } });
  await db.brandKit.upsert({
    where: { id: "seed-mystictxt-kit" },
    update: {},
    create: {
      id: "seed-mystictxt-kit",
      userId: user.id,
      name: "MysticTxt",
      businessName: "MysticTxt",
      productInfo:
        "Private one-to-one conversations with experienced advisors through Live Chat and Voice Call.",
      website: "https://mystictxt.example",
      colors: JSON.stringify(["#0c0c14", "#d4a853", "#f4f1ea"]),
      fonts: JSON.stringify(["Fraunces", "Outfit"]),
      defaultCta: "Talk to a Live Coach",
      preferredVoice: "amara-warm",
      preferredStyle: "Premium dark studio",
      preferredPresenterId: amara?.id,
    },
  });

  console.log("Seeded library presenters, templates, and studio@devflow.ai / studio1234");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
