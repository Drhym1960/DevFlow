import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdWizard } from "@/components/ad-wizard";
import { SectionTitle } from "@/components/ui";

export default async function NewVideoPage({
  searchParams,
}: {
  searchParams: Promise<{ presenter?: string }>;
}) {
  const user = await requireUser();
  const { presenter } = await searchParams;
  const [presenters, kits] = await Promise.all([
    db.presenter.findMany({
      where: { OR: [{ isCustom: false }, { ownerId: user.id }] },
      orderBy: { name: "asc" },
    }),
    db.brandKit.findMany({ where: { userId: user.id } }),
  ]);

  return (
    <div className="space-y-8">
      <SectionTitle
        kicker="New advertisement"
        title="The presenter is only one part of the film."
        copy="Brief, brand, then a model or a client photo. They perform like Yuna Han — freely, on their feet — while product screens sit beside them."
      />
      <AdWizard presenters={presenters} kits={kits} presetPresenter={presenter} />
    </div>
  );
}
