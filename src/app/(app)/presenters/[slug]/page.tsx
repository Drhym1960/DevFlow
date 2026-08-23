import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PortraitView } from "@/components/portrait-view";
import { Button, Pill } from "@/components/ui";

export default async function PresenterDetail({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const presenter = await db.presenter.findUnique({ where: { slug } });
  if (!presenter || (presenter.isCustom && presenter.ownerId !== user.id)) notFound();
  const videos = presenter.isCustom
    ? await db.project.findMany({ where: { presenterId: presenter.id, userId: user.id }, take: 8, orderBy: { updatedAt: "desc" } })
    : [];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="glass overflow-hidden rounded-[32px]">
        <PortraitView presenter={presenter} />
      </div>
      <div className="space-y-6">
        <p className="text-xs uppercase tracking-[0.28em] text-gold-400">{presenter.isCustom ? "My Presenter" : "Library"}</p>
        <h1 className="font-display text-5xl">{presenter.name}</h1>
        <p className="text-mist-300">{presenter.bio}</p>
        <p className="text-sm text-mist-500">
          In a film, this presenter walks, turns, points, and smiles while talking — the same motion as every other
          model and every uploaded client photo.
        </p>
        {presenter.slug === "yuna-han" ? (
          <video
            className="w-full overflow-hidden rounded-3xl"
            src="/demos/yuna-fashion.mp4"
            poster="/presenters/yuna-han.png"
            controls
            playsInline
            preload="metadata"
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          {presenter.categories.split(",").map((c) => (
            <Pill key={c}>{c}</Pill>
          ))}
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-mist-500">Voice</dt><dd>{presenter.voiceId}</dd></div>
          <div><dt className="text-mist-500">Languages</dt><dd>{presenter.languages}</dd></div>
          <div><dt className="text-mist-500">Accent</dt><dd>{presenter.accent}</dd></div>
          <div><dt className="text-mist-500">Tone</dt><dd>{presenter.speakingTone}</dd></div>
          <div><dt className="text-mist-500">Personality</dt><dd>{presenter.personality}</dd></div>
          <div><dt className="text-mist-500">Studio</dt><dd>{presenter.studioStyle}</dd></div>
        </dl>
        <div className="flex flex-wrap gap-3">
          <Link href={`/videos/new?presenter=${presenter.id}`}>
            <Button>Use in a film</Button>
          </Link>
          {presenter.isCustom ? (
            <>
              <Link href={`/presenters/create?edit=${presenter.id}`}><Button variant="ghost">Edit presenter</Button></Link>
              <form action={`/api/presenters/${presenter.id}/duplicate`} method="post">
                <Button variant="ink" type="submit">Duplicate</Button>
              </form>
            </>
          ) : null}
        </div>
        {videos.length ? (
          <div>
            <h3 className="mb-3 font-display text-2xl">Previous videos</h3>
            {videos.map((v) => (
              <Link key={v.id} href={`/videos/${v.id}`} className="block py-2 text-sm text-gold-300">
                {v.title}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
