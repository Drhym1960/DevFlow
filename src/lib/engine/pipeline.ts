import path from "path";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import { resolutionFor, getPlan } from "@/lib/plans";
import { llm, tts, avatars, video, storage } from "@/lib/ai/registry";
import { planScenes } from "./storyboard";
import type { BrandAnalysis, BrandBrief, ScriptDraft, ScenePlan } from "@/lib/ai/ports";
import { portraitSvg, traitsFromPresenter } from "@/lib/presenters/portrait";

export type JobLog = { at: string; stage: string; message: string };

async function updateJob(id: string, data: { status?: string; stage?: string; progress?: number; logs?: JobLog[]; error?: string }) {
  const job = await db.job.findUnique({ where: { id } });
  if (!job) return;
  const logs = data.logs ?? parseJson<JobLog[]>(job.logs, []);
  await db.job.update({
    where: { id },
    data: {
      status: data.status ?? job.status,
      stage: data.stage ?? job.stage,
      progress: data.progress ?? job.progress,
      logs: JSON.stringify(logs),
      error: data.error,
    },
  });
}

function push(logs: JobLog[], stage: string, message: string) {
  logs.push({ at: new Date().toISOString(), stage, message });
}

export async function runPipeline(jobId: string) {
  const job = await db.job.findUnique({ where: { id: jobId }, include: { project: { include: { presenter: true, user: true } } } });
  if (!job) return;
  const project = job.project;
  const logs: JobLog[] = [];

  try {
    await db.project.update({ where: { id: project.id }, data: { status: "rendering" } });
    push(logs, "analyzing", "Reading brand brief and assets");
    await updateJob(jobId, { status: "running", stage: "analyzing", progress: 8, logs });

    const brief = parseJson<BrandBrief>(project.brief, { business: project.title, product: project.title });
    const analysis = parseJson<BrandAnalysis | null>(project.analysis, null) ?? (await llm().analyze(brief));
    await db.project.update({ where: { id: project.id }, data: { analysis: JSON.stringify(analysis) } });

    push(logs, "writing", `Writing original advertisement copy via ${llm().status().label}`);
    await updateJob(jobId, { stage: "writing", progress: 22, logs });
    const script =
      parseJson<ScriptDraft | null>(project.script, null) ??
      (await llm().writeScript({
        brief,
        analysis,
        goal: project.goal ?? "product-ad",
        tone: project.voiceTone,
        language: project.language,
        presenterName: project.presenter?.name ?? "the presenter",
      }));
    await db.project.update({ where: { id: project.id }, data: { script: JSON.stringify(script) } });

    push(logs, "voice", "Creating voice timeline and visemes");
    await updateJob(jobId, { stage: "voice", progress: 38, logs });
    const spoken = await tts().synthesize({
      text: script.voiceover,
      voiceId: project.presenter?.voiceId ?? "studio",
      language: project.language,
      rate: project.speechRate,
      tone: project.voiceTone,
    });

    push(logs, "presenter", "Locking presenter identity for this campaign");
    await updateJob(jobId, { stage: "presenter", progress: 52, logs });
    const presenter = project.presenter;
    const svg = presenter
      ? portraitSvg(traitsFromPresenter(presenter), 720, presenter.name)
      : (await avatars().identityFrame({ seed: project.id, traits: { gender: "female", skinTone: "Warm tan", hair: "Long dark waves", clothingStyle: "Studio tailoring" } })).svg;

    push(logs, "scenes", "Selecting layouts from script beats and brand assets");
    await updateJob(jobId, { stage: "scenes", progress: 66, logs });
    const scenes =
      parseJson<ScenePlan[] | null>(project.scenes, null) ??
      planScenes(script, brief.assetLabels?.length ?? 0, presenter?.studioStyle ?? "Premium dark studio");
    await db.project.update({
      where: { id: project.id },
      data: { scenes: JSON.stringify(scenes), captions: script.captions, cta: script.cta },
    });

    push(logs, "branding", "Applying brand colours, captions and call to action");
    await updateJob(jobId, { stage: "branding", progress: 78, logs });
    const colors = brief.colors?.length ? brief.colors : ["#0c0c14", "#d4a853", "#f4f1ea"];

    push(logs, "rendering", "Compositing scenes into a finished advertisement");
    await updateJob(jobId, { stage: "rendering", progress: 88, logs });
    const plan = getPlan(project.user.plan);
    const dims = resolutionFor(project.format, plan.maxHeight);
    const out = await video().render({
      projectId: project.id,
      format: project.format,
      width: dims.width,
      height: dims.height,
      scenes,
      colors: colors.length ? colors : ["#0c0c14", "#d4a853"],
      brandName: brief.business || project.title,
      cta: script.cta,
      presenterSvg: svg,
      music: project.music,
      assetPaths: [],
      outDir: storage().resolve("renders"),
    });

    await db.video.create({
      data: {
        projectId: project.id,
        format: project.format,
        width: dims.width,
        height: dims.height,
        path: path.relative(storage().resolve("."), out.videoPath),
        duration: out.duration,
        status: "ready",
      },
    });
    await db.user.update({ where: { id: project.userId }, data: { videosUsed: { increment: 1 } } });
    await db.project.update({ where: { id: project.id }, data: { status: "completed" } });
    push(logs, "rendering", spoken.audioPath ? "Voice bed mixed from configured TTS" : "Viseme timeline ready. Add OPENAI_API_KEY or ELEVENLABS_API_KEY for spoken audio.");
    await updateJob(jobId, { status: "completed", stage: "rendering", progress: 100, logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed";
    await db.project.update({ where: { id: project.id }, data: { status: "failed" } });
    await updateJob(jobId, { status: "failed", error: message, logs, progress: job.progress });
  }
}
