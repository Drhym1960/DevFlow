export type MotionIdentity = {
  name?: string;
  gender?: string;
  clothingStyle?: string;
  studioStyle?: string;
  region?: string;
  professionalStyle?: string;
};

export function motionPromptFor(identity: MotionIdentity = {}) {
  const gender = (identity.gender ?? "").toLowerCase();
  const they = gender === "male" ? "He" : gender === "female" ? "She" : "They";
  const their = gender === "male" ? "his" : gender === "female" ? "her" : "their";
  const who = identity.name ? `${identity.name}, the original person in the reference still` : "the original person in the reference still";
  const clothes = identity.clothingStyle ? ` wearing ${identity.clothingStyle}` : "";
  const room = identity.studioStyle || "a premium studio";
  const role = identity.professionalStyle ? ` ${identity.professionalStyle}.` : "";
  return [
    `Photoreal vertical film of ${who}${clothes}.`,
    `${they} stand${they === "They" ? "" : "s"} and talk${they === "They" ? "" : "s"} to camera with a natural smile, then move${they === "They" ? "" : "s"} like a real presenter: walk a few steps, turn, look back over ${their} shoulder, point, and gesture freely with both hands.`,
    `Hair and clothing respond to motion. Setting: ${room}.${role}`,
    "No celebrity likeness, no logos, no readable text, no subtitles.",
  ].join(" ");
}

export function stillPromptFor(identity: MotionIdentity & { skinTone?: string; hair?: string; ageRange?: string }) {
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
