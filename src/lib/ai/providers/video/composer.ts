import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { PNG } from "pngjs";
import type { ScenePlan, VideoComposer } from "@/lib/ai/ports";

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

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function paintRect(png: PNG, x: number, y: number, w: number, h: number, rgb: [number, number, number], alpha = 255) {
  const { width, height, data } = png;
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(width, Math.ceil(x + w));
  const y1 = Math.min(height, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * width + xx) * 4;
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
      data[i + 3] = alpha;
    }
  }
}

function paintEllipse(png: PNG, cx: number, cy: number, rx: number, ry: number, rgb: [number, number, number]) {
  const { width, height, data } = png;
  const x0 = Math.max(0, Math.floor(cx - rx));
  const y0 = Math.max(0, Math.floor(cy - ry));
  const x1 = Math.min(width, Math.ceil(cx + rx));
  const y1 = Math.min(height, Math.ceil(cy + ry));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const nx = (xx - cx) / rx;
      const ny = (yy - cy) / ry;
      if (nx * nx + ny * ny <= 1) {
        const i = (yy * width + xx) * 4;
        data[i] = rgb[0];
        data[i + 1] = rgb[1];
        data[i + 2] = rgb[2];
        data[i + 3] = 255;
      }
    }
  }
}

function scenePng(scene: ScenePlan, width: number, height: number, colors: string[], brand: string) {
  const png = new PNG({ width, height });
  const bg = hexToRgb(colors[0] ?? "#0c0c14");
  const gold = hexToRgb(colors[1] ?? "#d4a853");
  const mist = hexToRgb("#f4f1ea");
  paintRect(png, 0, 0, width, height, bg);
  paintRect(png, 0, 0, width, Math.round(height * 0.08), gold, 40);

  const presenter = scene.presenterPosition;
  const face: [number, number, number] = [180, 130, 96];
  const cloth: [number, number, number] = [32, 36, 52];

  const drawPresenter = (px: number, py: number, scale: number) => {
    paintEllipse(png, px, py + 90 * scale, 90 * scale, 110 * scale, cloth);
    paintEllipse(png, px, py, 38 * scale, 48 * scale, face);
    paintEllipse(png, px, py - 28 * scale, 42 * scale, 22 * scale, [28, 20, 16]);
  };

  if (presenter === "center") drawPresenter(width * 0.5, height * 0.42, height / 900);
  if (presenter === "left") drawPresenter(width * 0.28, height * 0.46, height / 1000);
  if (presenter === "right") drawPresenter(width * 0.72, height * 0.46, height / 1000);
  if (presenter === "pip") {
    paintRect(png, width * 0.72, height * 0.08, width * 0.22, height * 0.28, [20, 20, 28]);
    drawPresenter(width * 0.83, height * 0.18, 0.7);
  }

  if (scene.layout.includes("product") || scene.layout.includes("floating") || scene.layout === "logo-cta") {
    const boxX = presenter === "left" ? width * 0.52 : presenter === "right" ? width * 0.08 : width * 0.18;
    paintRect(png, boxX, height * 0.22, width * 0.38, height * 0.46, [24, 24, 36]);
    paintRect(png, boxX + 12, height * 0.24, width * 0.38 - 24, 8, gold);
  }

  if (scene.layout === "logo-cta") {
    paintRect(png, width * 0.2, height * 0.38, width * 0.6, height * 0.22, [18, 18, 26]);
    paintRect(png, width * 0.2, height * 0.38, width * 0.6, 6, gold);
  }

  paintRect(png, 40, height - 90, width - 80, 50, [0, 0, 0], 120);
  void brand;
  void mist;
  return PNG.sync.write(png);
}

export const ffmpegComposer: VideoComposer = {
  status: () => ({
    id: "ffmpeg-composer",
    kind: "video",
    label: "Studio ffmpeg compositor",
    configured: true,
    notes: "Renders real MP4 scene sequences with presenter placement, product panels, captions and a generated music bed.",
  }),

  async render(input) {
    if (input.talkVideoPath) {
      const dest = path.join(input.outDir, input.projectId, "ad.mp4");
      await mkdir(path.dirname(dest), { recursive: true });
      const overlayDir = input.talkFrameDir;
      const advisors = overlayDir ? path.join(overlayDir, "mystictxt-advisors.png") : "";
      try {
        if (overlayDir) {
          await run("python3", [path.resolve("scripts/overlay_screens.py"), input.talkVideoPath, overlayDir, dest]);
        } else {
          throw new Error("no overlay");
        }
      } catch {
        await run("ffmpeg", [
          "-y",
          "-i",
          input.talkVideoPath,
          "-vf",
          `scale=${input.width}:${input.height}:force_original_aspect_ratio=increase,crop=${input.width}:${input.height}`,
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-movflags",
          "+faststart",
          dest,
        ]);
      }
      void advisors;
      const duration = input.scenes.reduce((s, sc) => s + sc.duration, 0);
      return { videoPath: dest, duration };
    }
    if (input.audioPath && input.talkFrameDir) {
      const dest = path.join(input.outDir, input.projectId, "ad.mp4");
      await mkdir(path.dirname(dest), { recursive: true });
      await run("python3", [
        path.resolve("scripts/talking_presenter.py"),
        input.talkFrameDir,
        input.audioPath,
        dest,
      ]);
      const duration = input.scenes.reduce((s, sc) => s + sc.duration, 0);
      return { videoPath: dest, duration };
    }
    const dir = path.join(input.outDir, input.projectId);
    await mkdir(dir, { recursive: true });
    const clips: string[] = [];

    for (const [i, scene] of input.scenes.entries()) {
      const pngPath = path.join(dir, `scene-${i}.png`);
      await writeFile(pngPath, scenePng(scene, input.width, input.height, input.colors, input.brandName));
      const mp4 = path.join(dir, `scene-${i}.mp4`);
      const caption = (scene.caption || scene.line).replace(/:/g, "\\:").slice(0, 140);
      const base = [
        "-y",
        "-loop",
        "1",
        "-i",
        pngPath,
        "-f",
        "lavfi",
        "-i",
        `sine=frequency=${220 + i * 18}:sample_rate=44100:duration=${scene.duration}`,
        "-t",
        String(scene.duration),
        "-shortest",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-af",
        "volume=0.06",
        mp4,
      ];
      const withText = [
        ...base.slice(0, 10),
        "-vf",
        `scale=${input.width}:${input.height},drawtext=fontcolor=0xF4F1EA:fontsize=${Math.round(input.width / 42)}:x=48:y=h-110:text='${caption.replace(/'/g, "’")}'`,
        ...base.slice(10),
      ];
      try {
        await run("ffmpeg", withText);
      } catch {
        await run("ffmpeg", ["-y", "-loop", "1", "-i", pngPath, "-f", "lavfi", "-i", `anullsrc=r=44100:cl=stereo`, "-t", String(scene.duration), "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", mp4]);
      }
      clips.push(mp4);
    }

    const listPath = path.join(dir, "list.txt");
    await writeFile(listPath, clips.map((c) => `file '${c}'`).join("\n"));
    const out = path.join(dir, "ad.mp4");
    await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", out]);
    const duration = input.scenes.reduce((s, sc) => s + sc.duration, 0);
    return { videoPath: out, duration };
  },
};
