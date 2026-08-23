import path from "path";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import { resolutionFor, getPlan } from "@/lib/plans";
import { llm, tts, avatars, video, storage, motion, images } from "@/lib/ai/registry";
import { planScenes } from "./storyboard";
import type { BrandAnalysis, BrandBrief, ScriptDraft, ScenePlan } from "@/lib/ai/ports";
import { portraitSvg, traitsFromPresenter } from "@/lib/presenters/portrait";
import { motionPromptFor, stillPromptFor } from "@/lib/presenters/motion-prompt";
import { sadTalkerMotion } from "@/lib/ai/providers/motion/sadtalker";
import { defaultVoiceId } from "@/lib/ai/providers/tts/voices";
import { saveGeneratedImage } from "@/lib/studio/save-image";

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
    const voiceId = brief.voiceId || project.presenter?.voiceId || defaultVoiceId(project.presenter?.gender);
    const spoken = await tts().synthesize({
      text: script.voiceover,
      voiceId,
      language: project.language,
      rate: project.speechRate,
      tone: project.voiceTone,
      gender: project.presenter?.gender,
    });

    const presenter = project.presenter;
    push(logs, "presenter", "Animating the presenter with the Yuna-style motion model");
    await updateJob(jobId, { stage: "presenter", progress: 52, logs });
    let talkVideo: string | null = null;
    const portrait = await resolvePresenterStill(presenter, logs, brief.directorPrompt);
    if (portrait && spoken.audioPath) {
      const audioPath = spoken.audioPath.startsWith("/") ? spoken.audioPath : storage().resolve(spoken.audioPath);
      const outPath = storage().resolve(`renders/${project.id}/talking.mp4`);
      const prompt = motionPromptFor(
        {
          name: presenter?.name,
          gender: presenter?.gender,
          clothingStyle: presenter?.clothingStyle,
          studioStyle: presenter?.studioStyle,
          region: presenter?.region,
          professionalStyle: presenter?.professionalStyle,
        },
        brief.directorPrompt,
      );
      try {
        const animated = await motion().animate({
          sourceImage: portrait,
          audioPath,
          outPath,
          prompt,
          seconds: brief.durationSeconds,
        });
        talkVideo = animated.videoPath;
        push(logs, "presenter", `Motion via ${animated.provider} — walk, turn, gesture, smile`);
        talkVideo = await lockMouthToVoice(talkVideo, audioPath, project.id, logs);
      } catch (error) {
        push(logs, "presenter", error instanceof Error ? error.message : "Primary motion unavailable; trying fallback");
        try {
          const fallback = await sadTalkerMotion.animate({ sourceImage: portrait, audioPath, outPath });
          talkVideo = fallback.videoPath;
          push(logs, "presenter", `Motion via ${fallback.provider}`);
          talkVideo = await lockMouthToVoice(talkVideo, audioPath, project.id, logs);
        } catch {
          push(logs, "presenter", "Motion model unavailable; falling back to stills");
        }
      }
    }
    const svg = presenter
      ? portraitSvg(traitsFromPresenter(presenter), 720, presenter.name)
      : (await avatars().identityFrame({ seed: project.id, traits: { gender: "female", skinTone: "Warm tan", hair: "Long dark waves", clothingStyle: "Studio tailoring" } })).svg;

    push(logs, "scenes", "Selecting layouts from script beats and brand assets");
    await updateJob(jobId, { stage: "scenes", progress: 66, logs });
    const scenes =
      parseJson<ScenePlan[] | null>(project.scenes, null) ??
      planScenes(script, (brief.assetPaths?.length || brief.assetLabels?.length) ?? 0, presenter?.studioStyle ?? "Premium dark studio");
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
    const assetPaths = await resolveProductStills(brief, project.id, logs);
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
      assetPaths,
      outDir: storage().resolve("renders"),
      audioPath: spoken.audioPath ? storage().resolve(spoken.audioPath) : null,
      talkFrameDir: process.env.TALK_FRAME_DIR || null,
      talkVideoPath: talkVideo,
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

type StillPresenter = {
  id: string;
  slug: string;
  name: string;
  gender: string;
  region: string;
  skinTone: string;
  hair: string;
  ageRange: string;
  clothingStyle: string;
  professionalStyle: string;
  studioStyle: string;
  portraitUrl: string | null;
};

async function lockMouthToVoice(talkVideo: string, audioPath: string, projectId: string, logs: JobLog[]) {
  try {
    const { lipSyncVideo } = await import("@/lib/ai/providers/lipsync/wav2lip");
    const synced = await lipSyncVideo(talkVideo, audioPath, storage().resolve(`renders/${projectId}/talking-sync.mp4`));
    if (synced) {
      push(logs, "presenter", "Mouth locked to the studio voice");
      return synced;
    }
  } catch (syncError) {
    push(logs, "presenter", syncError instanceof Error ? syncError.message : "Lip-sync skipped");
  }
  return talkVideo;
}

async function resolveProductStills(brief: BrandBrief, projectId: string, logs: JobLog[]) {
  const existing = (brief.assetPaths ?? []).map((p) => (p.startsWith("/") ? p : storage().resolve(p)));
  if (existing.length) return existing;
  push(logs, "branding", "Generating product pictures from the idea");
  const still = await saveGeneratedImage(
    `Photoreal product still for an advertisement of ${brief.product || brief.business}. Premium lighting, no celebrity, no readable labels.`,
    `renders/${projectId}/product-still.png`,
  );
  if (!still) return [];
  const full = still.startsWith("/") ? still : storage().resolve(still);
  return [full];
}

function existingStillPath(portraitUrl: string | null) {
  if (!portraitUrl) return null;
  if (portraitUrl.startsWith("http")) return portraitUrl;
  if (portraitUrl.startsWith("/presenters/")) return path.join(process.cwd(), "public", portraitUrl);
  if (portraitUrl.startsWith("/")) return portraitUrl;
  return storage().resolve(portraitUrl);
}

async function resolvePresenterStill(presenter: StillPresenter | null, logs: JobLog[], directorPrompt?: string) {
  if (!presenter) return null;
  const existing = existingStillPath(presenter.portraitUrl);
  if (existing && !existing.startsWith("http")) {
    try {
      const { access } = await import("fs/promises");
      await access(existing);
      return existing;
    } catch {
      /* generate below */
    }
  }
  if (existing?.startsWith("http")) return existing;
  push(logs, "presenter", "Creating a photoreal standing still so this presenter can move like Yuna Han");
  const generated = await images().generate(stillPromptFor(presenter, directorPrompt));
  if (!generated.imagePath) return existing;
  if (!generated.imagePath.startsWith("http")) return generated.imagePath;
  const res = await fetch(generated.imagePath);
  if (!res.ok) return existing;
  const rel = `presenters/generated/${presenter.slug}.png`;
  await storage().save(rel, Buffer.from(await res.arrayBuffer()), "image/png");
  await db.presenter.update({ where: { id: presenter.id }, data: { portraitUrl: rel } });
  return storage().resolve(rel);
}
