import type { TranslationProvider } from "@/lib/ai/ports";

const LEX: Record<string, Record<string, string>> = {
  es: {
    "Looking for someone to talk things through with?": "¿Buscas con quién hablar las cosas de verdad?",
    "Talk to a Live Coach": "Habla con un coach en vivo",
    Start: "Empieza",
    Open: "Abre",
  },
  fr: {
    "Talk to a Live Coach": "Parlez à un coach en direct",
    Start: "Commencer",
    Open: "Ouvrir",
  },
  de: {
    "Talk to a Live Coach": "Sprich mit einem Live-Coach",
    Start: "Starten",
    Open: "Öffnen",
  },
  ar: {
    "Talk to a Live Coach": "تحدث مع مدرب مباشر",
    Start: "ابدأ",
  },
  ko: {
    "Talk to a Live Coach": "라이브 코치와 대화하세요",
    Start: "시작",
  },
  ja: {
    "Talk to a Live Coach": "ライブコーチに相談",
    Start: "はじめる",
  },
  yo: {
    Start: "Bẹrẹ",
  },
  ha: {
    Start: "Fara",
  },
  hi: {
    Start: "शुरू करें",
  },
  pt: {
    Start: "Começar",
    Open: "Abrir",
  },
};

export const studioTranslator: TranslationProvider = {
  status: () => ({
    id: "studio-translate",
    kind: "translate",
    label: "Studio translator",
    configured: true,
    notes: "Deterministic phrase map plus structure-preserving pass. Swap for an LLM translator when OPENAI_API_KEY is set.",
  }),
  async translate(text, language) {
    if (!language || language === "en") return text;
    const dict = LEX[language] ?? {};
    let out = text;
    for (const [from, to] of Object.entries(dict)) {
      out = out.replaceAll(from, to);
    }
    if (process.env.OPENAI_API_KEY) {
      const res = await fetch(`${process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          messages: [
            { role: "system", content: `Translate advertising copy into ${language}. Keep names. Return text only.` },
            { role: "user", content: text },
          ],
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        return json.choices?.[0]?.message?.content?.trim() || out;
      }
    }
    return out;
  },
};
