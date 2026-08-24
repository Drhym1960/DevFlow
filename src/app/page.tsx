import Link from "next/link";
import { db } from "@/lib/db";
import { PortraitView } from "@/components/portrait-view";
import { Button } from "@/components/ui";

export const dynamic = "force-dynamic";

const FEATURED = [
  "yuna-han",
  "andre-whitfield",
  "amara-okonkwo",
  "sofia-alvarez",
  "seo-yeon-park",
  "maya-chen",
  "chinedu-adebayo",
  "layla-al-hassan",
];

const STUDIO = [
  { href: "/login", title: "Sign in", copy: "Open the studio. Demo: studio@devflow.ai" },
  { href: "/presenters", title: "Presenter library", copy: "Pick a realistic model by category and region." },
  { href: "/presenters/create", title: "Upload a photo", copy: "A client or director becomes the speaker." },
  { href: "/videos/new", title: "Create a film", copy: "Write an idea, or pick a model and a voice." },
  { href: "/brand-kits", title: "Brand kits", copy: "Colours, product, CTA — reused on every film." },
  { href: "/store-shots", title: "Store screenshots", copy: "Upload a sample look and your real app screens." },
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
        <p className="text-xs uppercase tracking-[0.32em] text-gold-400">The studio is live</p>
        <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
          Write an idea. Pick a model and a voice. Let AI make the advertisement.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-mist-300">
          Clients choose the presenter and the voice — or they write anything and the studio generates the pictures,
          the performance, and the film. Every model walks, turns, and talks with the mouth locked to those words.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register">
            <Button>Start a film</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost">Enter the studio</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <p className="text-xs uppercase tracking-[0.32em] text-gold-400">The performance</p>
        <h2 className="mt-3 max-w-3xl font-display text-4xl">This is how every presenter talks.</h2>
        <p className="mt-4 max-w-2xl text-mist-300">
          Yuna Han is the quality floor. Clients write their own prompt for look and movement — Andre Whitfield is a
          30-second MysticTxt advisor cut with a bold male voice, mouth locked to the words, not a locked talking head.
        </p>
        <div className="mt-8 overflow-hidden rounded-[32px] bg-ink-950">
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <video
              className="aspect-[9/16] w-full rounded-3xl"
              src="/demos/yuna-fashion.mp4"
              poster="/presenters/yuna-han.png"
              controls
              playsInline
              preload="metadata"
            />
            <video
              className="aspect-[9/16] w-full rounded-3xl"
              src="/demos/mystictxt-andre.mp4"
              poster="/presenters/andre-whitfield.png"
              controls
              playsInline
              preload="metadata"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <p className="text-xs uppercase tracking-[0.32em] text-gold-400">Website & studio</p>
        <h2 className="mt-3 font-display text-4xl">What you can open right now</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STUDIO.map((item) => (
            <Link key={item.href} href={item.href} className="glass rounded-3xl p-6">
              <p className="font-display text-2xl">{item.title}</p>
              <p className="mt-2 text-sm text-mist-300">{item.copy}</p>
            </Link>
          ))}
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
          <p className="text-xs uppercase tracking-[0.28em] text-gold-400">Your photo or our model</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl md:text-5xl">
            Same motion. Same film. Use them again and again.
          </h2>
          <p className="mt-5 max-w-2xl text-mist-300">
            Upload a client picture and they become the speaker. Or pick a library model. Either way they move freely
            while they talk, and the brand stays on camera beside them.
          </p>
          <Link href="/presenters/create" className="mt-8 inline-block">
            <Button>Create My Presenter</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
