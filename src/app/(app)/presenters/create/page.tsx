import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreatePresenterForm } from "@/components/create-presenter-form";
import { SectionTitle } from "@/components/ui";

export default async function CreatePresenterPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await requireUser();
  const { edit } = await searchParams;
  const existing = edit
    ? await db.presenter.findFirst({ where: { id: edit, ownerId: user.id } })
    : null;

  return (
    <div className="space-y-8">
      <SectionTitle
        kicker="Create My Presenter"
        title={existing ? `Edit ${existing.name}` : "Build a reusable brand ambassador."}
        copy="Upload your photo and become the speaker, or design a fictional ambassador. A motion model makes that face talk and move like a presenter."
      />
      <CreatePresenterForm
        initial={
          existing
            ? {
                id: existing.id,
                name: existing.name,
                gender: existing.gender,
                appearance: "",
                skinTone: existing.skinTone,
                hair: existing.hair,
                ageRange: existing.ageRange,
                clothingStyle: existing.clothingStyle,
                professionalStyle: existing.professionalStyle,
                personality: existing.personality,
                voiceId: existing.voiceId,
                accent: existing.accent,
                languages: existing.languages,
                speakingTone: existing.speakingTone,
                studioStyle: existing.studioStyle,
                brandAssociation: existing.brandAssociation ?? "",
              }
            : undefined
        }
      />
    </div>
  );
}
