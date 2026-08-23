import Link from "next/link";
import { db } from "@/lib/db";
import { PortraitView } from "@/components/portrait-view";
import { Button } from "@/components/ui";

export const dynamic = "force-dynamic";

const FEATURED = [
  "yuna-han",
  "amara-okonkwo",
  "sofia-alvarez",
  "seo-yeon-park",
  "maya-chen",
  "chinedu-adebayo",
  "layla-al-hassan",
  "jordan-hale",
];

export default async function LandingPage() {
  const all = await db.presenter.findMany({ where: { isCustom: false } });
  const presenters = FEATURED.map((slug) => all.find((p) => p.slug === slug)).filter(Boolean) as typeof all;

  return (
    <div>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-gold-400">DevFlow</p>
          <p className="font-display text-xl">Advertising Studio</p>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm text-mist-300">
            Sign in
          </Link>
          <Link href="/register" className="rounded-full bg-gold-400 px-4 py-2 text-sm text-ink-950">
            Open the studio
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 md:pt-20">
        <p className="text-xs uppercase tracking-[0.32em] text-gold-400">AI creative agency, in one platform</p>
        <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
          Choose your presenter. Upload your brand. Let AI create the advertisement.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-mist-300">
          Upload your photo and become the speaker — or choose a realistic model. They walk, turn, point, and smile while
          they talk, and your product screens sit beside them.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register">
            <Button>Start a film</Button>
          </Link>
          <Link href="/presenters">
            <Button variant="ghost">Browse presenters</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <p className="text-xs uppercase tracking-[0.32em] text-gold-400">Fashion presenter</p>
        <h2 className="mt-3 max-w-3xl font-display text-4xl">Yuna Han, standing and moving while she talks fashion.</h2>
        <p className="mt-4 max-w-2xl text-mist-300">
          An original Seoul fashion model — not a celebrity lookalike. She walks, turns, points, and smiles on camera
          while lookbook stills stay beside her.
        </p>
        <div className="mt-8 overflow-hidden rounded-[32px] bg-ink-950">
          <video
            className="aspect-[9/16] w-full max-w-md mx-auto"
            src="/demos/yuna-fashion.mp4"
            poster="/presenters/yuna-han.png"
            controls
            playsInline
            preload="metadata"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-4">
          {presenters.map((p) => (
            <article key={p.id} className="glass overflow-hidden rounded-3xl">
              <div className="aspect-[4/5] overflow-hidden">
                <PortraitView presenter={p} />
              </div>
              <div className="space-y-1 p-4">
                <p className="font-display text-lg">{p.name}</p>
                <p className="text-xs text-mist-500">{p.region}</p>
                <p className="text-xs text-gold-300">{p.categories.split(",")[0]}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="glass rounded-[32px] p-8 md:p-14">
          <p className="text-xs uppercase tracking-[0.28em] text-gold-400">Create My Presenter</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl md:text-5xl">
            Create your presenter. Build your brand ambassador. Use them again and again.
          </h2>
          <p className="mt-5 max-w-2xl text-mist-300">
            Directors can upload their own photo and stay the speaker. Or pick a realistic model. Either way, they move
            while they talk, and your product screens stay on camera beside them.
          </p>
          <Link href="/presenters/create" className="mt-8 inline-block">
            <Button>Create My Presenter</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
