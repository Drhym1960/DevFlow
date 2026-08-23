import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import type { MotionProvider } from "./types";

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

const MOTION_PROMPT =
  "Photoreal vertical fashion-studio film of the original person in the reference still. She stands, talks to camera with a natural smile, then moves like a real presenter: walks a few steps, turns her body, looks back over her shoulder, points, and gestures with both hands. Hair and clothing respond to motion. No celebrity likeness, no logos, no readable text, no subtitles.";

type SoraJob = {
  id: string;
  status: string;
  progress?: number;
  error?: { message?: string } | null;
};

async function createJob(imagePath: string, key: string) {
  const form = new FormData();
  form.set("model", process.env.SORA_MODEL ?? "sora-2");
  form.set("prompt", process.env.SORA_PROMPT ?? MOTION_PROMPT);
  form.set("seconds", process.env.SORA_SECONDS ?? "12");
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
  for (let i = 0; i < 90; i++) {
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

export const soraMotion: MotionProvider = {
  status: () => ({
    id: "sora",
    kind: "motion",
    label: "Sora full-body motion",
    configured: Boolean(process.env.OPENAI_API_KEY),
    requires: ["OPENAI_API_KEY"],
    notes: "Image-guided full-body presenter: walk, turn, point, smile while talking. Mixes studio voice over the generated performance. Set MOTION_PROVIDER=sora.",
  }),

  async animate({ sourceImage, audioPath, outPath }) {
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
    const created = await createJob(ref, key);
    await pollJob(created.id, key);
    const raw = path.join(path.dirname(outPath), "sora-raw.mp4");
    const content = await fetch(`https://api.openai.com/v1/videos/${created.id}/content`, {
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
