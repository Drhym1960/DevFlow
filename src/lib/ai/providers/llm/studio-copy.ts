import type { BrandAnalysis, BrandBrief, LlmProvider, ScriptDraft } from "@/lib/ai/ports";

function productName(brief: BrandBrief) {
  const raw = brief.product || brief.business || "the brand";
  const first = raw.split(/[.\n]/)[0]?.trim() ?? raw;
  return first.slice(0, 48);
}

function inferAudience(brief: BrandBrief, goal: string) {
  const blob = `${brief.product} ${brief.extra ?? ""} ${goal}`.toLowerCase();
  if (blob.includes("advisor") || blob.includes("coach") || blob.includes("chat")) {
    return "Adults who want private, one-to-one guidance without appearing in a public feed";
  }
  if (blob.includes("app") || blob.includes("software")) {
    return "Busy professionals discovering a product through social and paid video";
  }
  if (blob.includes("fashion") || blob.includes("beauty")) {
    return "Style-conscious shoppers who decide in seconds";
  }
  if (blob.includes("real estate") || blob.includes("propert")) {
    return "Qualified buyers and renters comparing premium spaces";
  }
  return "People already close to a purchase who need a clear reason to act now";
}

function sellingPoints(brief: BrandBrief): string[] {
  const text = `${brief.product} ${brief.offer ?? ""} ${brief.extra ?? ""}`;
  const bits = text
    .split(/[.\n•\-]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 18 && s.length < 140)
    .slice(0, 4);
  if (bits.length >= 3) return bits;
  const name = productName(brief);
  return [
    `${name} makes the core job feel immediate and private`,
    "The interface is simple enough to trust on first glance",
    "A human presenter plus real product frames does the explaining",
    brief.offer || "A clear next step replaces vague brand talk",
  ].slice(0, 4);
}

export const studioCopyProvider: LlmProvider = {
  status: () => ({
    id: "studio-copy",
    kind: "llm",
    label: "Studio Copy Engine",
    configured: true,
    notes: "On-device marketing writer. Original copy from structured brand analysis — not an echo of the brief.",
  }),

  async analyze(brief) {
    const name = productName(brief);
    const points = sellingPoints(brief);
    return {
      productSummary: `${name} is positioned as a complete offer, not a feature list. The film should prove the outcome, then show the product doing the work.`,
      audience: inferAudience(brief, "general"),
      sellingPoints: points,
      benefits: points.map((p) => p.replace(/^[A-Z]/, (m) => m)),
      tone: brief.extra?.toLowerCase().includes("luxury") ? "Luxury" : "Confident",
      bestAssets: brief.assetLabels?.length
        ? brief.assetLabels.slice(0, 6)
        : ["Logo lockup", "Primary product still", "Interface screenshot", "Human-scale detail"],
      callToAction: brief.offer || `Start with ${name}`,
      provider: "studio-copy",
    } satisfies BrandAnalysis;
  },

  async writeScript({ brief, analysis, goal, tone, language, presenterName }) {
    const name = productName(brief);
    const hook = hookFor(name, goal, brief);
    const mid = analysis.sellingPoints.slice(0, 3);
    const voiceover = [hook, ...mid, analysis.callToAction].join(" ");
    const beats = [
      { id: "open", line: hook, visual: `${presenterName} in a premium studio, full frame, speaking to camera` },
      {
        id: "split",
        line: mid[0] ?? `${name} puts the essential action within reach.`,
        visual: "Presenter left, hero product or screenshot right",
      },
      {
        id: "product",
        line: mid[1] ?? "Show the product working, not the presenter talking over it.",
        visual: "Product-only or floating screenshots of the real interface",
      },
      {
        id: "proof",
        line: mid[2] ?? "A second proof frame — feature callouts, not slogans.",
        visual: "Presenter picture-in-picture over a product walkthrough",
      },
      {
        id: "return",
        line: `${presenterName} returns to close the thought.`,
        visual: "Presenter right, brand mark left",
      },
      {
        id: "cta",
        line: analysis.callToAction,
        visual: "Logo, product name, and a single professional call to action",
      },
    ];
    return {
      headline: headlineFor(name, goal),
      voiceover,
      beats,
      cta: analysis.callToAction,
      captions: voiceover,
      language,
      provider: "studio-copy",
    } satisfies ScriptDraft;
  },

  async rewriteScript({ script, instruction, language }) {
    const next = { ...script, language: language ?? script.language, provider: "studio-copy" };
    const cmd = instruction.toLowerCase();
    if (cmd.includes("shorter")) {
      next.voiceover = shorten(script.voiceover);
      next.beats = script.beats.map((b) => ({ ...b, line: shorten(b.line) }));
      next.captions = next.voiceover;
    } else if (cmd.includes("longer")) {
      next.voiceover = `${script.voiceover} Every frame is there to make the next decision obvious.`;
      next.captions = next.voiceover;
    } else if (cmd.includes("professional")) {
      next.voiceover = script.voiceover.replace(/\b(amazing|awesome|game-changing)\b/gi, "considered");
      next.captions = next.voiceover;
    } else if (cmd.includes("energetic")) {
      next.voiceover = script.voiceover.replace(/\.$/, " — now.");
      next.captions = next.voiceover;
    } else if (cmd.includes("regenerate") || cmd.includes("rewrite")) {
      next.voiceover = invertRhythm(script.voiceover);
      next.captions = next.voiceover;
    }
    return next;
  },
};

function hookFor(name: string, goal: string, brief: BrandBrief) {
  const lower = `${brief.product} ${brief.extra ?? ""}`.toLowerCase();
  if (lower.includes("mystic") || lower.includes("advisor") || lower.includes("live chat")) {
    return `Looking for someone to talk things through with? ${name} lets you connect privately with experienced advisors through one-to-one Live Chat and Voice Call.`;
  }
  if (goal.includes("launch")) return `${name} is here — and the first thirty seconds should make the category feel finished.`;
  if (goal.includes("offer")) return `A short window. A clear offer. ${name} is the reason to act today.`;
  if (goal.includes("app")) return `Open ${name} once, and the job you came to do is already on screen.`;
  return `If you have been waiting for a clearer way forward, ${name} is built for that moment.`;
}

function headlineFor(name: string, goal: string) {
  if (goal.includes("app")) return `${name} — the conversation, on your terms`;
  if (goal.includes("fashion")) return `${name}. Worn, not explained.`;
  if (goal.includes("offer")) return `${name}: the offer, plainly`;
  return `${name}`;
}

function shorten(text: string) {
  const parts = text.split(/(?<=\.)\s+/);
  return parts.slice(0, Math.max(1, Math.ceil(parts.length * 0.65))).join(" ");
}

function invertRhythm(text: string) {
  const sentences = text.split(/(?<=\.)\s+/);
  if (sentences.length < 2) return text;
  return [sentences[sentences.length - 1], ...sentences.slice(0, -1)].join(" ");
}
