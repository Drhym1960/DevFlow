import { GOALS } from "@/lib/constants";
import { inferPresenterFromPrompt } from "@/lib/presenters/motion-prompt";
import { defaultVoiceId, findStudioVoice, studioVoiceForPresenter, type StudioVoice } from "@/lib/ai/providers/tts/voices";

export type FilmIdea = {
  idea: string;
  business: string;
  product: string;
  extra: string;
  website?: string;
  directorPrompt: string;
  durationSeconds: number;
  goal: string;
  format: string;
  tone: string;
  language: string;
  music: string;
  voiceId: string;
  voice: StudioVoice;
  gender: "male" | "female";
  wantsCustomModel: boolean;
  librarySlug: string;
  presenterName?: string;
};

const LOOK_WORDS =
  /\b(man|woman|guy|girl|lady|gentleman|model|presenter|host|ambassador|handsome|beautiful woman|suit|dress|wearing|hair|clean.?cut|white suit)\b/i;

export function inferDurationSeconds(text: string) {
  const match = text.match(/(\d+)\s*(s|sec|secs|seconds?)\b/i);
  const n = match ? Number(match[1]) : 20;
  const allowed = [12, 20, 24, 30, 36, 48];
  return allowed.reduce((best, cur) => (Math.abs(cur - n) < Math.abs(best - n) ? cur : best), 20);
}

export function inferVoiceFromIdea(text: string, gender: "male" | "female" | "unknown"): StudioVoice {
  const blob = text.toLowerCase();
  if (/\b(bold male|male voice|man's voice|deep male|deep voice|he should sound)\b/.test(blob)) {
    return findStudioVoice(blob.includes("deep") ? "deep-male" : "bold-male")!;
  }
  if (/\b(female voice|woman's voice|her voice|warm female|silk female)\b/.test(blob)) {
    return findStudioVoice(blob.includes("silk") ? "silk-female" : "warm-female")!;
  }
  if (/\b(energetic male|sales voice)\b/.test(blob)) return findStudioVoice("energy-male")!;
  if (/\b(luxury female|luxe voice)\b/.test(blob)) return findStudioVoice("luxe-female")!;
  if (/\b(bright female|upbeat voice)\b/.test(blob)) return findStudioVoice("bright-female")!;
  const picked = gender === "unknown" ? "warm-female" : defaultVoiceId(gender);
  return studioVoiceForPresenter(picked, gender === "unknown" ? undefined : gender);
}

function inferGoal(text: string) {
  const blob = text.toLowerCase();
  if (/\bfashion|beauty|runway|lookbook\b/.test(blob)) return "fashion";
  if (/\bapp|chat|software|coach\b/.test(blob)) return "app-promo";
  if (/\blaunch\b/.test(blob)) return "launch";
  if (/\boffer|sale|discount\b/.test(blob)) return "offer";
  if (/\bexplain|how it works\b/.test(blob)) return "explainer";
  if (GOALS.some((g) => blob.includes(g.id))) return GOALS.find((g) => blob.includes(g.id))!.id;
  return "product-ad";
}

function inferBusiness(text: string) {
  const named = text.match(/\b(?:for|called|named)\s+([A-Z][\w]+(?:\s+[A-Z][\w]+)?)/);
  if (named?.[1]) return named[1];
  const first = text.split(/[.\n]/)[0]?.trim() ?? text;
  const compact = first.replace(/[^\w\s]/g, " ").trim();
  if (compact.length > 4 && compact.length <= 40 && !/\b(make|create|want|need)\b/i.test(compact)) {
    const words = compact.split(/\s+/).slice(0, 3).join(" ");
    if (/^[A-Z]/.test(words) && compact.split(/\s+/).length <= 4) return words;
  }
  return compact.split(/\s+/).slice(0, 2).join(" ") || "Studio brand";
}

function inferLibrarySlug(gender: "male" | "female", text: string) {
  const blob = text.toLowerCase();
  if (gender === "male" && /\bamerican|white suit|advisor|advice\b/.test(blob)) return "andre-whitfield";
  if (gender === "female" && /\bkorean|fashion|knit|seoul\b/.test(blob)) return "yuna-han";
  return gender === "male" ? "jordan-hale" : "amara-okonkwo";
}

export function expandIdea(idea: string, options?: { voiceId?: string }): FilmIdea {
  const text = idea.trim();
  const inferred = inferPresenterFromPrompt(text);
  const pickedVoice = options?.voiceId ? findStudioVoice(options.voiceId) : undefined;
  const gender: "male" | "female" =
    inferred.gender === "unknown" ? (pickedVoice?.gender ?? "female") : inferred.gender;
  const voice = pickedVoice ?? inferVoiceFromIdea(text, inferred.gender === "unknown" ? gender : inferred.gender);
  const wantsCustomModel = LOOK_WORDS.test(text);
  const business = inferBusiness(text);
  const product = text.length > 180 ? `${text.slice(0, 177).trim()}…` : text || "the offer";
  return {
    idea: text,
    business,
    product,
    extra: text,
    directorPrompt: wantsCustomModel ? text : inferred.gender === "unknown" ? "" : text,
    durationSeconds: inferDurationSeconds(text),
    goal: inferGoal(text),
    format: /\b(youtube|landscape|16:?9)\b/i.test(text) ? "landscape" : "vertical",
    tone: /\bluxury\b/i.test(text) ? "Luxury" : /\benergetic|sales\b/i.test(text) ? "Energetic" : "Professional",
    language: "en",
    music: /\bfashion|luxury\b/i.test(text) ? "luxury-pulse" : "cinematic-warm",
    voiceId: voice.id,
    voice,
    gender,
    wantsCustomModel,
    librarySlug: inferLibrarySlug(gender, text),
    presenterName: wantsCustomModel ? undefined : undefined,
  };
}
