export const FEMALE_ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID_FEMALE || process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
export const MALE_ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID_MALE || "pNInz6obpgDQGcFmaJgB";

const MALE_HINTS = /\b(male|man|guy|andre|chinedu|omar|jordan|minjun|kenji|lukas|kwame|elias|daniel|hiroshi|deep|low|formal|confident|sales|tech)\b/i;
const FEMALE_HINTS = /\b(female|woman|amara|layla|maya|yuna|seo|hana|anja|isabella|priya|sofia|nia|fatima|yasmin|warm|soft|silk|bright|glow)\b/i;

export function resolveElevenVoice(voiceId: string, gender?: string) {
  if (gender === "male") return MALE_ELEVEN_VOICE;
  if (gender === "female") return FEMALE_ELEVEN_VOICE;
  if (MALE_HINTS.test(voiceId) && !FEMALE_HINTS.test(voiceId)) return MALE_ELEVEN_VOICE;
  return FEMALE_ELEVEN_VOICE;
}

export function resolveOpenAiVoice(voiceId: string, gender?: string) {
  if (gender === "male" || (MALE_HINTS.test(voiceId) && !FEMALE_HINTS.test(voiceId))) {
    if (voiceId.includes("sales") || voiceId.includes("fast") || voiceId.includes("energy")) return "echo";
    return "onyx";
  }
  if (voiceId.includes("bright") || voiceId.includes("glow")) return "shimmer";
  if (voiceId.includes("warm") || voiceId.includes("soft") || voiceId.includes("silk")) return "nova";
  return process.env.OPENAI_TTS_VOICE ?? "alloy";
}
