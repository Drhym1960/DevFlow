import { writeFile, mkdir } from "fs/promises";
import path from "path";
import type { MotionProvider } from "./types";

export const didMotion: MotionProvider = {
  status: () => ({
    id: "d-id",
    kind: "motion",
    label: "D-ID talking presenter",
    configured: Boolean(process.env.D_ID_API_KEY),
    requires: ["D_ID_API_KEY"],
    notes: "Commercial photo-to-talking-presenter API. Used when configured; otherwise SadTalker runs locally.",
  }),

  async animate({ sourceImage, audioPath, outPath }) {
    const key = process.env.D_ID_API_KEY;
    if (!key) throw new Error("D_ID_API_KEY is not set");
    const sourceUrl = sourceImage.startsWith("http")
      ? sourceImage
      : `data:image/png;base64,${(await import("fs/promises")).readFile(sourceImage).then((b) => b.toString("base64"))}`;
    const audioUrl = audioPath.startsWith("http")
      ? audioPath
      : `data:audio/mpeg;base64,${(await import("fs/promises")).readFile(audioPath).then((b) => b.toString("base64"))}`;

    const created = await fetch("https://api.d-id.com/talks", {
      method: "POST",
      headers: {
        Authorization: `Basic ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_url: sourceUrl,
        script: { type: "audio", audio_url: audioUrl },
        config: { stitch: true, result_format: "mp4" },
      }),
    });
    if (!created.ok) throw new Error(`D-ID create failed (${created.status})`);
    const job = (await created.json()) as { id: string };
    let url: string | undefined;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await fetch(`https://api.d-id.com/talks/${job.id}`, {
        headers: { Authorization: `Basic ${key}` },
      });
      const body = (await poll.json()) as { status: string; result_url?: string };
      if (body.status === "done" && body.result_url) {
        url = body.result_url;
        break;
      }
      if (body.status === "error") throw new Error("D-ID render failed");
    }
    if (!url) throw new Error("D-ID timed out");
    const video = await fetch(url);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, Buffer.from(await video.arrayBuffer()));
    return { videoPath: outPath, provider: "d-id" };
  },
};
