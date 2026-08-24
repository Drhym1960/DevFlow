import type { LipSyncProvider } from "@/lib/ai/ports";

const VOWELS: Record<string, string> = {
  a: "A",
  e: "E",
  i: "I",
  o: "O",
  u: "U",
  á: "A",
  é: "E",
  í: "I",
  ó: "O",
  ú: "U",
};

export const studioLipSync: LipSyncProvider = {
  status: () => ({
    id: "studio-lipsync",
    kind: "lipsync",
    label: "Studio viseme mapper",
    configured: true,
    notes: "Language-aware viseme timeline for compositor mouth cues. Replace with a vendor lip-sync port later.",
  }),
  align(text, _language) {
    const words = text.replace(/\s+/g, " ").trim().split(" ");
    const out: { t: number; viseme: string }[] = [];
    let t = 0;
    for (const word of words) {
      const ch = [...word.toLowerCase()].find((c) => VOWELS[c]) ?? "m";
      out.push({ t, viseme: VOWELS[ch] ?? "M" });
      t += Math.max(0.18, word.length * 0.07);
    }
    return out;
  },
};
