import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BrandKitForm } from "@/components/brand-kit-form";
import { SectionTitle } from "@/components/ui";

export default async function BrandKitsPage() {
  const user = await requireUser();
  const [kits, presenters] = await Promise.all([
    db.brandKit.findMany({ where: { userId: user.id }, include: { preferredPresenter: true } }),
    db.presenter.findMany({ where: { OR: [{ isCustom: false }, { ownerId: user.id }] } }),
  ]);

  return (
    <div className="space-y-8">
      <SectionTitle
        kicker="Brand Kits"
        title="Reuse identity so the next film starts faster."
        copy="Logo colours, fonts, default CTA, preferred presenter and voice — locked once, reused forever."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {kits.map((kit) => (
          <article key={kit.id} className="glass rounded-3xl p-5">
            <p className="font-display text-2xl">{kit.name}</p>
            <p className="text-sm text-mist-300">{kit.productInfo}</p>
            <p className="mt-2 text-xs text-gold-300">{kit.defaultCta}</p>
            <p className="text-xs text-mist-500">{kit.preferredPresenter?.name ?? "No preferred presenter"}</p>
          </article>
        ))}
      </div>
      <BrandKitForm presenters={presenters.map((p) => ({ id: p.id, name: p.name }))} />
    </div>
  );
}
