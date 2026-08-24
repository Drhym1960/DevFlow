import { spawn } from "child_process";
import path from "path";
import { mkdir } from "fs/promises";
import { images, storage } from "@/lib/ai/registry";
import { captionsForScreens } from "./captions";
import { storeSize } from "./sizes";
import { publicHttpUrl } from "./url";

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

export type StoreShotInput = {
  store: string;
  appName: string;
  notes: string;
  captions?: string[];
  screenPaths: string[];
  websiteUrl?: string;
  samplePath?: string | null;
  userId: string;
};

export async function captureWebsiteScreen(userId: string, rawUrl: string) {
  const url = publicHttpUrl(rawUrl);
  const rel = `store-shots/${userId}/web-${Date.now()}.png`;
  const full = storage().resolve(rel);
  await mkdir(path.dirname(full), { recursive: true });
  await run("python3", [
    path.resolve("scripts/capture_page.py"),
    "--url",
    url,
    "--out",
    full,
    "--width",
    "393",
    "--height",
    "852",
    "--scale",
    "3",
    "--wait-for",
    "",
    "--wait",
    "16",
  ]);
  return full;
}

export async function renderStoreShots(input: StoreShotInput) {
  const screenPaths = [...input.screenPaths];
  if (input.websiteUrl?.trim()) {
    screenPaths.unshift(await captureWebsiteScreen(input.userId, input.websiteUrl));
  }
  if (!screenPaths.length) {
    throw new Error("Upload a screenshot of your real app, or paste the live website address.");
  }
  const size = storeSize(input.store);
  const lines = captionsForScreens({
    appName: input.appName,
    notes: input.notes,
    screens: screenPaths.length,
    captions: input.captions,
  });
  let bg: string | undefined;
  if (process.env.OPENAI_API_KEY && !input.samplePath) {
    const vibe = input.notes || input.appName || "a premium mobile product";
    const generated = await images().generate(
      `Vertical 9:16 marketing backdrop only, empty center for a phone, no device, no UI, no text, no logos. Mood matches: ${vibe}. Soft premium lighting.`,
    );
    if (generated.imagePath?.startsWith("http")) {
      const res = await fetch(generated.imagePath);
      if (res.ok) {
        const rel = `store-shots/${input.userId}/backdrop-${Date.now()}.png`;
        await storage().save(rel, Buffer.from(await res.arrayBuffer()), "image/png");
        bg = storage().resolve(rel);
      }
    } else if (generated.imagePath) {
      bg = generated.imagePath;
    }
  }

  const script = path.resolve("scripts/store_shot.py");
  const outs: { path: string; headline: string; width: number; height: number }[] = [];
  for (const [i, screen] of screenPaths.entries()) {
    const rel = `store-shots/${input.userId}/${Date.now()}-${i + 1}.png`;
    const full = storage().resolve(rel);
    await mkdir(path.dirname(full), { recursive: true });
    const args = [
      script,
      "--screen",
      screen,
      "--out",
      full,
      "--size",
      `${size.width}x${size.height}`,
      "--headline",
      lines[i]?.headline ?? input.appName,
      "--sub",
      lines[i]?.sub ?? "",
    ];
    if (input.samplePath) args.push("--sample", input.samplePath);
    if (bg) args.push("--bg", bg);
    await run("python3", args);
    outs.push({ path: rel, headline: lines[i]?.headline ?? input.appName, width: size.width, height: size.height });
  }
  return { shots: outs, store: size };
}
