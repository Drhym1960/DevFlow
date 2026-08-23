import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { PortraitView } from "@/components/portrait-view";
import { Button, SectionTitle } from "@/components/ui";

export default async function MyPresentersPage() {
  const user = await requireUser();
  const plan = getPlan(user.plan);
  const presenters = await db.presenter.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" } });

  return (
    <div className="space-y-8">
      <SectionTitle
        kicker="My Presenters"
        title="Your brand ambassadors."
        copy={`${presenters.length} of ${plan.customPresenters} custom presenters on the ${plan.name} plan. The same face, voice and manner — film after film.`}
      />
      <Link href="/presenters/create">
        <Button>Create new presenter</Button>
      </Link>
      <div className="grid gap-5 md:grid-cols-2">
        {presenters.map((p) => (
          <Link key={p.id} href={`/presenters/${p.slug}`} className="glass grid grid-cols-[140px_1fr] overflow-hidden rounded-3xl">
            <PortraitView presenter={p} />
            <div className="space-y-2 p-5">
              <p className="font-display text-2xl">{p.name}</p>
              <p className="text-sm text-mist-300">{p.personality}</p>
              <p className="text-xs text-mist-500">{p.voiceId} · {p.languages}</p>
              <p className="text-xs text-gold-300">{p.brandAssociation || "No brand linked yet"}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
