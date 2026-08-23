import { db } from "@/lib/db";
import { runPipeline } from "@/lib/engine/pipeline";

let ticking = false;

export async function enqueueRender(projectId: string) {
  const job = await db.job.create({
    data: { projectId, type: "render", status: "queued", stage: "queued", progress: 0 },
  });
  queueMicrotask(() => {
    void runPipeline(job.id);
  });
  return job;
}

export async function drainQueued() {
  if (ticking) return;
  ticking = true;
  const jobs = await db.job.findMany({ where: { status: "queued" }, take: 2 });
  for (const job of jobs) {
    await runPipeline(job.id);
  }
  ticking = false;
}
