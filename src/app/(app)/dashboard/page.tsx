import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { Button, SectionTitle } from "@/components/ui";

export default async function DashboardPage() {
  const user = await requireUser();
  const plan = getPlan(user.plan);
  const [projects, presenters, kits] = await Promise.all([
    db.project.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 6 }),
    db.presenter.count({ where: { ownerId: user.id } }),
    db.brandKit.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="space-y-10">
      <SectionTitle
        kicker="Overview"
        title={`Welcome back, ${user.name.split(" ")[0]}.`}
        copy="Choose a presenter, upload the brand, and let the studio cut a complete advertisement."
      />
      <div className="flex flex-wrap gap-3">
        <Link href="/videos/new">
          <Button>Create New Video</Button>
        </Link>
        <Link href="/presenters/create">
          <Button variant="ghost">Create My Presenter</Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Films this month", value: `${user.videosUsed}/${plan.videosPerMonth}` },
          { label: "Brand ambassadors", value: `${presenters}/${plan.customPresenters}` },
          { label: "Brand kits", value: String(kits) },
        ].map((card) => (
          <div key={card.label} className="glass rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-mist-500">{card.label}</p>
            <p className="mt-3 font-display text-4xl">{card.value}</p>
          </div>
        ))}
      </div>
      <div>
        <h3 className="mb-4 font-display text-2xl">Recent projects</h3>
        <div className="space-y-3">
          {projects.length === 0 ? (
            <p className="text-sm text-mist-500">No films yet. Start with a brief and a presenter.</p>
          ) : (
            projects.map((p) => (
              <Link key={p.id} href={`/videos/${p.id}`} className="glass flex items-center justify-between rounded-2xl px-5 py-4">
                <div>
                  <p>{p.title}</p>
                  <p className="text-xs text-mist-500">{p.status} · {p.format}</p>
                </div>
                <span className="text-gold-300 text-sm">Open</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
