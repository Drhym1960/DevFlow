import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import type { MotionProvider } from "./types";
import { motionPromptFor } from "@/lib/presenters/motion-prompt";

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => {
      err += d.toString();
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.slice(-800) || `${cmd} exited ${code}`));
    });
  });
}

const DEFAULT_PROMPT = motionPromptFor();

type SoraJob = {
  id: string;
  status: string;
  progress?: number;
  error?: { message?: string } | null;
};

function firstClipSeconds(wanted: number) {
  if (wanted >= 20) return "12";
  if (wanted >= 12) return "12";
  if (wanted >= 8) return "8";
  return "4";
}

function extensionSeconds(remaining: number) {
  if (remaining >= 20) return "20";
  if (remaining >= 16) return "16";
  if (remaining >= 12) return "12";
  if (remaining >= 8) return "8";
  return "4";
}

async function createJob(imagePath: string, key: string, prompt: string, seconds: string) {
  const form = new FormData();
  form.set("model", process.env.SORA_MODEL ?? "sora-2");
  form.set("prompt", prompt);
  form.set("seconds", seconds);
  form.set("size", "720x1280");
  const jpeg = await readFile(imagePath);
  form.set("input_reference", new Blob([new Uint8Array(jpeg)], { type: "image/jpeg" }), "presenter.jpg");
  const res = await fetch("https://api.openai.com/v1/videos", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  const body = (await res.json()) as SoraJob & { error?: { message?: string } };
  if (!res.ok || !body.id) throw new Error(body.error?.message ?? "Sora create failed");
  return body;
}

async function pollJob(id: string, key: string) {
  for (let i = 0; i < 120; i++) {
    const res = await fetch(`https://api.openai.com/v1/videos/${id}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const job = (await res.json()) as SoraJob;
    if (job.status === "completed") return job;
    if (job.status === "failed") throw new Error(job.error?.message ?? "Sora generation failed");
    await new Promise((r) => setTimeout(r, 8000));
  }
  throw new Error("Sora generation timed out");
}

async function extendJob(videoId: string, key: string, prompt: string, seconds: string) {
  const res = await fetch("https://api.openai.com/v1/videos/extensions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      seconds,
      video: { id: videoId },
    }),
  });
  const body = (await res.json()) as SoraJob & { error?: { message?: string } };
  if (!res.ok || !body.id) throw new Error(body.error?.message ?? "Sora extend failed");
  return body;
}

export const soraMotion: MotionProvider = {
  status: () => ({
    id: "sora",
    kind: "motion",
    label: "Sora full-body motion",
    configured: Boolean(process.env.OPENAI_API_KEY),
    requires: ["OPENAI_API_KEY"],
    notes: "Default Yuna-quality motion. Clients can write their own look and movement prompt. Longer films extend the same performance.",
  }),

  async animate({ sourceImage, audioPath, outPath, prompt, seconds }) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not set");
    await mkdir(path.dirname(outPath), { recursive: true });
    const ref = path.join(path.dirname(outPath), "sora-ref.jpg");
    await run("ffmpeg", [
      "-y",
      "-i",
      sourceImage,
      "-vf",
      "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280",
      "-q:v",
      "2",
      ref,
    ]);
    const wanted = Math.max(4, Math.min(120, Math.round(seconds || Number(process.env.SORA_SECONDS) || 12)));
    const motionPrompt = prompt || process.env.SORA_PROMPT || DEFAULT_PROMPT;
    let job = await createJob(ref, key, motionPrompt, firstClipSeconds(wanted));
    await pollJob(job.id, key);
    let produced = Number(firstClipSeconds(wanted));
    while (produced < wanted - 1) {
      const add = extensionSeconds(wanted - produced);
      const extPrompt = `${motionPrompt} Continue the same person and wardrobe. Keep moving and talking naturally.`;
      try {
        job = await extendJob(job.id, key, extPrompt, add);
        await pollJob(job.id, key);
        produced += Number(add);
      } catch {
        break;
      }
    }
    const raw = path.join(path.dirname(outPath), "sora-raw.mp4");
    const content = await fetch(`https://api.openai.com/v1/videos/${job.id}/content`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!content.ok) throw new Error("Sora download failed");
    await writeFile(raw, Buffer.from(await content.arrayBuffer()));
    await run("ffmpeg", [
      "-y",
      "-stream_loop",
      "-1",
      "-i",
      raw,
      "-i",
      audioPath,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-shortest",
      "-movflags",
      "+faststart",
      outPath,
    ]);
    return { videoPath: outPath, provider: "sora" };
  },
};
