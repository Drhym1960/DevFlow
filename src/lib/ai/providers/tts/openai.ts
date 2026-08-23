import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { TtsProvider } from "@/lib/ai/ports";
import { studioLipSync } from "../lipsync/studio";
import { resolveOpenAiVoice } from "./voices";

export const openaiTtsProvider: TtsProvider = {
  status: () => ({
    id: "openai-tts",
    kind: "tts",
    label: "OpenAI TTS",
    configured: Boolean(process.env.OPENAI_API_KEY),
    requires: ["OPENAI_API_KEY"],
    notes: "Male presenters map to a deep voice (onyx). Female presenters keep a matching studio voice.",
  }),

  async synthesize({ text, voiceId, language, rate, gender }) {
    const visemes = studioLipSync.align(text, language);
    if (!process.env.OPENAI_API_KEY) {
      return { audioPath: null, visemes, provider: "unconfigured" };
    }
    const res = await fetch(`${process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
        voice: resolveOpenAiVoice(voiceId, gender),
        input: text,
        speed: rate,
      }),
    });
    if (!res.ok) {
      return { audioPath: null, visemes, provider: "openai-tts-error" };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const rel = path.join("audio", `${Date.now()}-${voiceId}.mp3`);
    const full = path.join(process.env.STORAGE_DIR ?? "./data", rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, buf);
    return { audioPath: rel, visemes, provider: "openai-tts" };
  },
};
