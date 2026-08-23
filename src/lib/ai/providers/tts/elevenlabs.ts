import type { TtsProvider } from "@/lib/ai/ports";
import { openaiTtsProvider } from "./openai";
import { resolveElevenVoice } from "./voices";

export const elevenLabsTtsProvider: TtsProvider = {
  status: () => ({
    id: "elevenlabs-tts",
    kind: "tts",
    label: "ElevenLabs TTS",
    configured: Boolean(process.env.ELEVENLABS_API_KEY),
    requires: ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"],
    notes: "Matches the presenter: bold male voices for men, the studio female voice for women. Mixed over the performance after lip-sync.",
  }),
  async synthesize(input) {
    if (!process.env.ELEVENLABS_API_KEY) return openaiTtsProvider.synthesize(input);
    const voice = resolveElevenVoice(input.voiceId, input.gender);
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
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
