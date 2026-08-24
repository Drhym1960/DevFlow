import type { BrandAnalysis, LlmProvider, ScriptDraft } from "@/lib/ai/ports";
import { studioCopyProvider } from "./studio-copy";

function configured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function complete(prompt: string) {
  const res = await fetch(`${process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are a senior advertising creative director. Write original marketing language. Never parrot the client's brief. Return strict JSON only.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI request failed (${res.status})`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content ?? "{}";
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  return JSON.parse(content.slice(start, end + 1));
}

export const openaiLlmProvider: LlmProvider = {
  status: () => ({
    id: "openai-llm",
    kind: "llm",
    label: "OpenAI-compatible LLM",
    configured: configured(),
    requires: ["OPENAI_API_KEY"],
    notes: "Optional. When unset, the Studio Copy Engine writes the advertisement.",
  }),

  async analyze(brief) {
    if (!configured()) return studioCopyProvider.analyze(brief);
    const data = await complete(`Analyze this brand for a filmed advertisement. JSON keys: productSummary, audience, sellingPoints[], benefits[], tone, bestAssets[], callToAction.\n${JSON.stringify(brief)}`);
    return { ...data, provider: "openai-llm" } as BrandAnalysis;
  },

  async writeScript(input) {
    if (!configured()) return studioCopyProvider.writeScript(input);
    const data = await complete(
      `Write a 20-35s advertisement script. JSON keys: headline, voiceover, beats[{id,line,visual}], cta, captions, language.\n${JSON.stringify(input)}`,
    );
    return { ...data, provider: "openai-llm" } as ScriptDraft;
  },

  async rewriteScript(input) {
    if (!configured()) return studioCopyProvider.rewriteScript(input);
    const data = await complete(`Rewrite this ad script. Instruction: ${input.instruction}. Keep JSON shape.\n${JSON.stringify(input.script)}`);
    return { ...data, language: input.language ?? input.script.language, provider: "openai-llm" } as ScriptDraft;
  },
};
