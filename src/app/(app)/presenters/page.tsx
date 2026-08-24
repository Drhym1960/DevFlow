import Link from "next/link";
import { db } from "@/lib/db";
import { CATEGORIES } from "@/lib/constants";
import { PortraitView } from "@/components/portrait-view";
import { Pill, SectionTitle } from "@/components/ui";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const all = await db.presenter.findMany({ where: { isCustom: false }, orderBy: { name: "asc" } });
  const presenters = category ? all.filter((p) => p.categories.includes(category)) : all;

  return (
    <div className="space-y-8">
      <SectionTitle
        kicker="Presenter Library"
        title="Realistic fictional presenters, not lookalikes."
        copy="Browse by marketing category. Every face is an original studio identity, and every film uses the same free-moving performance."
      />
      <div className="flex flex-wrap gap-2">
        <Link href="/presenters"><Pill active={!category}>All</Pill></Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/presenters?category=${encodeURIComponent(c)}`}>
            <Pill active={category === c}>{c}</Pill>
          </Link>
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {presenters.map((p) => (
          <Link key={p.id} href={`/presenters/${p.slug}`} className="glass overflow-hidden rounded-3xl">
            <div className="aspect-[4/5]">
              <PortraitView presenter={p} />
            </div>
            <div className="space-y-2 p-5">
              <p className="font-display text-2xl">{p.name}</p>
              <p className="text-sm text-mist-300">{p.professionalStyle}</p>
              <p className="text-xs text-mist-500">{p.region} · {p.speakingTone} · {p.languages}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
