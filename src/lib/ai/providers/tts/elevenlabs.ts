import type { TtsProvider } from "@/lib/ai/ports";
import { openaiTtsProvider } from "./openai";

export const elevenLabsTtsProvider: TtsProvider = {
  status: () => ({
    id: "elevenlabs-tts",
    kind: "tts",
    label: "ElevenLabs TTS",
    configured: Boolean(process.env.ELEVENLABS_API_KEY),
    requires: ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"],
    notes: "Studio voice for every presenter. Mixed over the full-body performance.",
  }),
  async synthesize(input) {
    if (!process.env.ELEVENLABS_API_KEY) return openaiTtsProvider.synthesize(input);
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: input.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.4, similarity_boost: 0.8 },
      }),
    });
    if (!res.ok) return openaiTtsProvider.synthesize(input);
    const { mkdir, writeFile } = await import("fs/promises");
    const path = await import("path");
    const buf = Buffer.from(await res.arrayBuffer());
    const rel = path.join("audio", `${Date.now()}-eleven.mp3`);
    const full = path.join(process.env.STORAGE_DIR ?? "./data", rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, buf);
    const { studioLipSync } = await import("../lipsync/studio");
    return { audioPath: rel, visemes: studioLipSync.align(input.text, input.language), provider: "elevenlabs-tts" };
  },
};
