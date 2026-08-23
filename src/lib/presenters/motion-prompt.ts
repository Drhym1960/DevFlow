export type MotionIdentity = {
  name?: string;
  gender?: string;
  clothingStyle?: string;
  studioStyle?: string;
  region?: string;
  professionalStyle?: string;
  skinTone?: string;
  hair?: string;
  ageRange?: string;
};

const QUALITY =
  "Keep Yuna-level photoreal motion: the person walks, turns, points, gestures freely with both hands, and can smile while talking. Hair and clothing respond to motion. No celebrity likeness, no logos, no readable text, no subtitles.";

export function motionPromptFor(identity: MotionIdentity = {}, directorPrompt?: string) {
  const gender = (identity.gender ?? "").toLowerCase();
  const they = gender === "male" ? "He" : gender === "female" ? "She" : "They";
  const their = gender === "male" ? "his" : gender === "female" ? "her" : "their";
  const who = identity.name
    ? `${identity.name}, the original person in the reference still`
    : "the original person in the reference still";
  const clothes = identity.clothingStyle ? ` wearing ${identity.clothingStyle}` : "";
  const room = identity.studioStyle || "a premium studio";
  const role = identity.professionalStyle ? ` ${identity.professionalStyle}.` : "";
  const base = [
    `Photoreal vertical film of ${who}${clothes}.`,
    `${they} stand${they === "They" ? "" : "s"} and talk${they === "They" ? "" : "s"} to camera, then move${they === "They" ? "" : "s"} like a real presenter: walk a few steps, turn, look back over ${their} shoulder, point, and gesture freely with both hands.`,
    `Setting: ${room}.${role}`,
    QUALITY,
  ].join(" ");
  if (!directorPrompt?.trim()) return base;
  return `${base} Client direction — follow this for look and movement: ${directorPrompt.trim()}`;
}

export function stillPromptFor(identity: MotionIdentity = {}, directorPrompt?: string) {
  if (directorPrompt?.trim()) {
    return [
      "Photoreal original fictional person, vertical 9:16 editorial photograph, standing, looking at camera.",
      directorPrompt.trim(),
      identity.studioStyle ? `Setting: ${identity.studioStyle}.` : "",
      "No celebrity likeness, no logos, no readable text.",
    ]
      .filter(Boolean)
      .join(" ");
  }
  return [
    `Photoreal original fictional ${identity.gender || "presenter"}`,
    identity.ageRange,
    identity.region,
    identity.skinTone ? `${identity.skinTone} skin` : "",
    identity.hair,
    identity.clothingStyle ? `wearing ${identity.clothingStyle}` : "",
    `standing full-body in ${identity.studioStyle || "a premium studio"}`,
    "looking at camera with a natural smile, vertical 9:16 editorial photograph",
    "no celebrity likeness, no logos, no readable text",
  ]
    .filter(Boolean)
    .join(", ");
}

export function inferPresenterFromPrompt(prompt: string) {
  const text = prompt.toLowerCase();
  const male = /\b(guy|man|male|gentleman|he|him|his)\b/.test(text);
  const female = /\b(woman|female|girl|she|her|lady)\b/.test(text);
  const gender: "female" | "male" = male && !female ? "male" : "female";
  const dark = /\b(dark|black|african|deep mahogany|deep brown)\b/.test(text);
  const whiteSuit = /white suit/.test(text);
  return {
    gender,
    skinTone: dark ? "Deep mahogany" : gender === "male" ? "Medium bronze" : "Warm tan",
    hair: /\bclean.?cut\b/.test(text) ? "Clean-cut fade" : gender === "male" ? "Close cropped" : "Long dark waves",
    clothingStyle: whiteSuit ? "Tailored white suit, open collar" : gender === "male" ? "Navy suit, open collar" : "Tailored studio look",
    professionalStyle: /\badvice|advisor|professional\b/.test(text) ? "Professional advisor" : "Brand ambassador",
    speakingTone: /\bprofessional|advice\b/.test(text) ? "Professional" : "Warm",
    studioStyle: /\bdark|gold|premium\b/.test(text) ? "Premium dark studio" : "Editorial fashion set",
    region: /\bamerican\b/.test(text) ? "United States" : "Global",
  };
}
