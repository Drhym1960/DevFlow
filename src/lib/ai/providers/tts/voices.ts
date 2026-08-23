export const FEMALE_ELEVEN_VOICE =
  process.env.ELEVENLABS_VOICE_ID_FEMALE || process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
export const MALE_ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID_MALE || "pNInz6obpgDQGcFmaJgB";

export type StudioVoice = {
  id: string;
  label: string;
  gender: "male" | "female";
  description: string;
  elevenLabsId: string;
  openaiVoice: string;
};

export const STUDIO_VOICES: StudioVoice[] = [
  {
    id: "bold-male",
    label: "Bold male",
    gender: "male",
    description: "Firm, present, on-camera authority",
    elevenLabsId: process.env.ELEVENLABS_VOICE_ID_MALE || MALE_ELEVEN_VOICE,
    openaiVoice: "onyx",
  },
  {
    id: "deep-male",
    label: "Deep advisor",
    gender: "male",
    description: "Low, calm, one-to-one",
    elevenLabsId: process.env.ELEVENLABS_VOICE_ID_MALE_DEEP || "VR6AewLTigWG4xSOukaG",
    openaiVoice: "onyx",
  },
  {
    id: "energy-male",
    label: "Energetic male",
    gender: "male",
    description: "Sales energy, quicker pace",
    elevenLabsId: process.env.ELEVENLABS_VOICE_ID_MALE_ENERGY || "TxGEqnHWrfWFTfGW9XjX",
    openaiVoice: "echo",
  },
  {
    id: "formal-male",
    label: "Formal male",
    gender: "male",
    description: "Measured, professional",
    elevenLabsId: process.env.ELEVENLABS_VOICE_ID_MALE || MALE_ELEVEN_VOICE,
    openaiVoice: "onyx",
  },
  {
    id: "warm-female",
    label: "Warm female",
    gender: "female",
    description: "Clear, inviting studio voice",
    elevenLabsId: process.env.ELEVENLABS_VOICE_ID_FEMALE || FEMALE_ELEVEN_VOICE,
    openaiVoice: "nova",
  },
  {
    id: "silk-female",
    label: "Silk female",
    gender: "female",
    description: "Soft, close, editorial",
    elevenLabsId: process.env.ELEVENLABS_VOICE_ID_FEMALE_SILK || "MF3mGyEYCl7XYWbV9V6O",
    openaiVoice: "nova",
  },
  {
    id: "bright-female",
    label: "Bright female",
    gender: "female",
    description: "Upbeat, social",
    elevenLabsId: process.env.ELEVENLABS_VOICE_ID_FEMALE_BRIGHT || "21m00Tcm4TlvDq8ikWAM",
    openaiVoice: "shimmer",
  },
  {
    id: "luxe-female",
    label: "Luxury female",
    gender: "female",
    description: "Poised, high-end",
    elevenLabsId: process.env.ELEVENLABS_VOICE_ID_FEMALE || FEMALE_ELEVEN_VOICE,
    openaiVoice: "alloy",
  },
];

const CATALOG_TO_STUDIO: Record<string, string> = {
  "andre-steady": "bold-male",
  "omar-deep": "deep-male",
  "kenji-low": "deep-male",
  "elias-low": "deep-male",
  "chinedu-confident": "bold-male",
  "jordan-sales": "energy-male",
  "daniel-fast": "energy-male",
  "kwame-energy": "energy-male",
  "minjun-tech": "formal-male",
  "hiroshi-formal": "formal-male",
  "lukas-warm": "bold-male",
  "yuna-warm": "warm-female",
  "amara-warm": "warm-female",
  "nia-warm": "warm-female",
  "seoyeon-soft": "silk-female",
  "hana-calm": "silk-female",
  "yasmin-silk": "silk-female",
  "maya-bright": "bright-female",
  "priya-bright": "bright-female",
  "sofia-glow": "bright-female",
  "layla-luxe": "luxe-female",
  "isabella-rich": "luxe-female",
  "anja-clear": "warm-female",
  "fatima-steady": "warm-female",
};

export function findStudioVoice(id: string | undefined | null) {
  if (!id) return undefined;
  return STUDIO_VOICES.find((v) => v.id === id);
}

export function defaultVoiceId(gender?: string) {
  return gender === "male" ? "bold-male" : gender === "female" ? "warm-female" : "warm-female";
}

export function voicesForGender(gender?: string) {
  if (gender === "male" || gender === "female") {
    return STUDIO_VOICES.filter((v) => v.gender === gender);
  }
  return STUDIO_VOICES;
}

/** Map a presenter slug or legacy voiceId onto a client-facing studio voice. */
export function studioVoiceForPresenter(voiceId: string | undefined, gender?: string): StudioVoice {
  const explicit = findStudioVoice(voiceId);
  if (explicit) return explicit;
  const mapped = voiceId ? CATALOG_TO_STUDIO[voiceId] : undefined;
  if (mapped) {
    const studio = findStudioVoice(mapped);
    if (studio) return studio;
  }
  return findStudioVoice(defaultVoiceId(gender))!;
}

function clientPickedOppositeGender(voiceId: string, gender?: string) {
  const picked = findStudioVoice(voiceId);
  return Boolean(picked && gender && picked.gender !== gender);
}

export function resolveStudioVoice(voiceId: string, gender?: string): StudioVoice {
  const picked = findStudioVoice(voiceId);
  if (picked && (clientPickedOppositeGender(voiceId, gender) || !gender || picked.gender === gender)) {
    return picked;
  }
  return studioVoiceForPresenter(voiceId, gender);
}

export function resolveElevenVoice(voiceId: string, gender?: string) {
  const studio = resolveStudioVoice(voiceId, gender);
  if (gender === "male" && studio.gender === "female" && !findStudioVoice(voiceId)) {
    return MALE_ELEVEN_VOICE;
  }
  if (gender === "female" && studio.gender === "male" && !findStudioVoice(voiceId)) {
    return FEMALE_ELEVEN_VOICE;
  }
  return studio.elevenLabsId;
}

export function resolveOpenAiVoice(voiceId: string, gender?: string) {
  return resolveStudioVoice(voiceId, gender).openaiVoice;
}
