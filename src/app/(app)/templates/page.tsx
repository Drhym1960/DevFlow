import Link from "next/link";
import { db } from "@/lib/db";
import { SectionTitle } from "@/components/ui";

export default async function TemplatesPage() {
  const templates = await db.template.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-8">
      <SectionTitle kicker="Templates" title="Campaign structures the studio already knows." />
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((t) => (
          <article key={t.id} className="glass rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.category}</p>
            <h3 className="mt-2 font-display text-2xl">{t.name}</h3>
            <p className="mt-2 text-sm text-mist-300">{t.description}</p>
            <Link href={`/videos/new?goal=${t.goal}`} className="mt-4 inline-block text-sm text-gold-300">
              Use this structure
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
