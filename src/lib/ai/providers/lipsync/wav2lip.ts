import { access, mkdir } from "fs/promises";
import path from "path";
import { spawn } from "child_process";

const ROOT = path.resolve(process.env.WAV2LIP_DIR ?? "./vendor/Wav2Lip");
const SADTALKER_PYTHON = path.resolve(process.env.SADTALKER_DIR ?? "./vendor/SadTalker", ".venv/bin/python");

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

/** Replace the mouth on an existing full-body performance so it matches studio voice. */
export async function lipSyncVideo(videoPath: string, audioPath: string, outPath: string) {
  const infer = path.join(ROOT, "inference.py");
  const ckpt = path.join(ROOT, "checkpoints", "wav2lip_gan.pth");
  const localPython = path.join(ROOT, ".venv/bin/python");
  const python = (await exists(localPython)) ? localPython : (await exists(SADTALKER_PYTHON)) ? SADTALKER_PYTHON : "python3";
  if (!(await exists(infer)) || !(await exists(ckpt))) return null;
  await mkdir(path.dirname(outPath), { recursive: true });
  await run(
    python,
    [
      infer,
      "--checkpoint_path",
      ckpt,
      "--face",
      videoPath,
      "--audio",
      audioPath,
      "--outfile",
      outPath,
      "--pads",
      "0",
      "15",
      "0",
      "0",
      "--face_det_batch_size",
      "2",
      "--wav2lip_batch_size",
      "8",
      "--nosmooth",
    ],
    ROOT,
  );
  if (!(await exists(outPath))) return null;
  return outPath;
}
