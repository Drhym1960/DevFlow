import type { ImageProvider } from "@/lib/ai/ports";

export const openaiImageProvider: ImageProvider = {
  status: () => ({
    id: "openai-image",
    kind: "image",
    label: "OpenAI Images",
    configured: Boolean(process.env.OPENAI_API_KEY),
    requires: ["OPENAI_API_KEY"],
    notes: "Used only when a photoreal still is requested. Library portraits use the Studio avatar engine.",
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
        model: process.env.OPENAI_IMAGE_MODEL ?? "dall-e-3",
        prompt,
        size: process.env.OPENAI_IMAGE_SIZE ?? "1024x1792",
      }),
    });
    if (!res.ok) return { imagePath: null, provider: "openai-image-error" };
    const json = (await res.json()) as { data?: { url?: string }[] };
    return { imagePath: json.data?.[0]?.url ?? null, provider: "openai-image" };
  },
};
