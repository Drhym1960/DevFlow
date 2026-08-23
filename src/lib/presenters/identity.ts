import { STUDIO_STYLES, TONES } from "@/lib/constants";
import { uniqueSlug } from "@/lib/utils";

export type PresenterDraft = {
  name: string;
  gender: "female" | "male";
  appearance: string;
  skinTone: string;
  hair: string;
  ageRange: string;
  clothingStyle: string;
  professionalStyle: string;
  personality: string;
  voiceId: string;
  accent: string;
  languages: string[];
  speakingTone: string;
  studioStyle: string;
  brandAssociation?: string;
};

export function completeIdentity(draft: Partial<PresenterDraft>, ownerKey: string): PresenterDraft & { slug: string; bio: string; seed: string } {
  const gender = draft.gender === "male" ? "male" : "female";
  const name = draft.name?.trim() || (gender === "male" ? "Adrian Cole" : "Mira Solenne");
  const tone = draft.speakingTone || TONES[0];
  const studio = draft.studioStyle || STUDIO_STYLES[0];
  const personality = draft.personality || "Composed, memorable, commercially clear";
  const bio = `${name} is a fictional ${gender} brand ambassador with a ${draft.skinTone || "warm"} complexion and ${draft.hair || "considered"} hair. ${personality}. Designed for ${draft.professionalStyle || "general marketing"} films in a ${studio.toLowerCase()}.`;
  return {
    name,
    gender,
    appearance: draft.appearance || "Photoreal-adjacent studio portrait, original fictional face",
    skinTone: draft.skinTone || (gender === "female" ? "Warm tan" : "Medium bronze"),
    hair: draft.hair || (gender === "female" ? "Long dark waves" : "Close cropped"),
    ageRange: draft.ageRange || "28-36",
    clothingStyle: draft.clothingStyle || "Tailored studio look",
    professionalStyle: draft.professionalStyle || "Brand ambassador",
    personality,
    voiceId: draft.voiceId || `${name.split(" ")[0].toLowerCase()}-${tone.toLowerCase()}`,
    accent: draft.accent || "Neutral",
    languages: draft.languages?.length ? draft.languages : ["en"],
    speakingTone: tone,
    studioStyle: studio,
    brandAssociation: draft.brandAssociation,
    slug: uniqueSlug(name, ownerKey),
    bio,
    seed: `${ownerKey}:${name}:${gender}:${draft.skinTone}:${draft.hair}`,
  };
}
