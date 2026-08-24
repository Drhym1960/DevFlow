import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import type { ScenePlan } from "@/lib/ai/ports";
import { RenderProgress } from "@/components/render-progress";
import { ScenePlayer } from "@/components/scene-player";
import { Button } from "@/components/ui";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await db.project.findFirst({
    where: { id, userId: user.id },
    include: { presenter: true, videos: true, jobs: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!project) notFound();
  const scenes = parseJson<ScenePlan[]>(project.scenes, []);
  const job = project.jobs[0];
  const video = project.videos[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold-400">{project.status}</p>
          <h1 className="font-display text-4xl">{project.title}</h1>
        </div>
        <Link href={`/videos/${project.id}/editor`}>
          <Button variant="ghost">Open scene editor</Button>
        </Link>
      </div>
      {job && job.status !== "completed" ? <RenderProgress jobId={job.id} /> : null}
      {scenes.length ? (
        <ScenePlayer scenes={scenes} presenter={project.presenter} brand={project.title} format={project.format} />
      ) : null}
      {video ? (
        <a className="inline-block text-sm text-gold-300" href={`/api/media/${video.path}`}>
          Download rendered MP4 ({video.width}×{video.height})
        </a>
      ) : null}
    </div>
  );
}
