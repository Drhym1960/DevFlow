import type { MotionProvider } from "./types";
import { didMotion } from "./did";

export const falMotion: MotionProvider = {
  status: () => ({
    id: "fal-liveportrait",
    kind: "motion",
    label: "Fal LivePortrait / avatar",
    configured: Boolean(process.env.FAL_KEY),
    requires: ["FAL_KEY"],
    notes: "Hosted LivePortrait-style motion. Optional replacement for the local SadTalker checkpoint.",
  }),
  async animate(input) {
    if (!process.env.FAL_KEY) {
      throw new Error("FAL_KEY is not set");
    }
    const res = await fetch("https://fal.run/fal-ai/sadtalker", {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_image_url: input.sourceImage,
        driven_audio_url: input.audioPath,
      }),
    });
    if (!res.ok) {
      return didMotion.animate(input);
    }
    const json = (await res.json()) as { video?: { url?: string } };
    if (!json.video?.url) throw new Error("Fal returned no video");
    const video = await fetch(json.video.url);
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    await mkdir(path.dirname(input.outPath), { recursive: true });
    await writeFile(input.outPath, Buffer.from(await video.arrayBuffer()));
    return { videoPath: input.outPath, provider: "fal-sadtalker" };
  },
};
