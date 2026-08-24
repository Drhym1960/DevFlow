import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { ImageProvider } from "@/lib/ai/ports";

export const openaiImageProvider: ImageProvider = {
  status: () => ({
    id: "openai-image",
    kind: "image",
    label: "OpenAI Images",
    configured: Boolean(process.env.OPENAI_API_KEY),
    requires: ["OPENAI_API_KEY"],
    notes: "Used for photoreal stills and store-screenshot backdrops. Defaults to gpt-image-1.",
  }),
  async generate(prompt) {
    if (!process.env.OPENAI_API_KEY) {
      return { imagePath: null, provider: "unconfigured" };
    }
    const res = await fetch(`${process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
        prompt,
        size: process.env.OPENAI_IMAGE_SIZE ?? "1024x1536",
      }),
    });
    if (!res.ok) return { imagePath: null, provider: "openai-image-error" };
    const json = (await res.json()) as { data?: { url?: string; b64_json?: string }[] };
    const item = json.data?.[0];
    if (item?.url) return { imagePath: item.url, provider: "openai-image" };
    if (!item?.b64_json) return { imagePath: null, provider: "openai-image" };
    const rel = path.join("generated", `${Date.now()}.png`);
    const full = path.join(process.env.STORAGE_DIR ?? "./data", rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, Buffer.from(item.b64_json, "base64"));
    return { imagePath: full, provider: "openai-image" };
  },
};

