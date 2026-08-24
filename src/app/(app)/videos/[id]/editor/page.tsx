import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import type { ScenePlan } from "@/lib/ai/ports";
import { SceneEditor } from "@/components/scene-editor";
import { SectionTitle } from "@/components/ui";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!project) notFound();
  const presenters = await db.presenter.findMany({
    where: { OR: [{ isCustom: false }, { ownerId: user.id }] },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-8">
      <SectionTitle
        kicker="Scene editor"
        title="Simple enough for a non-editor."
        copy="Reorder, rewrite, swap the presenter, change the music, replace the CTA — then render again."
      />
      <SceneEditor
        projectId={project.id}
        initialScenes={parseJson<ScenePlan[]>(project.scenes, [])}
        presenters={presenters}
        presenterId={project.presenterId ?? presenters[0]?.id ?? ""}
        music={project.music}
        cta={project.cta ?? ""}
      />
    </div>
  );
}
