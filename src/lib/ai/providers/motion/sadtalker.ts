import { spawn } from "child_process";
import { access } from "fs/promises";
import path from "path";
import type { MotionProvider } from "./types";

const ROOT = path.resolve(process.env.SADTALKER_DIR ?? "./vendor/SadTalker");

function run(cmd: string, args: string[], cwd?: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => {
      err += d.toString();
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.slice(-1200) || `${cmd} exited ${code}`));
    });
  });
}

async function exists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export const sadTalkerMotion: MotionProvider = {
  status: () => ({
    id: "sadtalker",
    kind: "motion",
    label: "SadTalker motion model",
    configured: true,
    notes: "Image + audio → talking performance with head pose, blinks and lip motion. Runs locally. Swap for D-ID or Fal without changing the app.",
  }),

  async animate({ sourceImage, audioPath, outPath, still }) {
    const python = path.join(ROOT, ".venv/bin/python");
    const infer = path.join(ROOT, "inference.py");
    if (!(await exists(infer))) {
      throw new Error("SadTalker is not installed. See docs/ARCHITECTURE.md (motion provider).");
    }
    const resultDir = path.dirname(outPath);
    await run(
      (await exists(python)) ? python : "python3",
      [
        infer,
        "--driven_audio",
        audioPath,
        "--source_image",
        sourceImage,
        "--result_dir",
        resultDir,
        "--still",
        still === false ? "False" : "",
        "--preprocess",
        "full",
        "--cpu",
      ].filter(Boolean),
      ROOT,
    );
    const { readdir } = await import("fs/promises");
    const files = (await readdir(resultDir)).filter((f) => f.endsWith(".mp4"));
    const latest = files.sort().at(-1);
    if (!latest) throw new Error("SadTalker produced no video");
    const produced = path.join(resultDir, latest);
    if (produced !== outPath) {
      const { copyFile } = await import("fs/promises");
      await copyFile(produced, outPath);
    }
    return { videoPath: outPath, provider: "sadtalker" };
  },
};
