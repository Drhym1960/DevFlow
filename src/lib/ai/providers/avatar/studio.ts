import type { AvatarProvider } from "@/lib/ai/ports";
import { portraitSvg, type PortraitTraits } from "@/lib/presenters/portrait";

export const studioAvatarProvider: AvatarProvider = {
  status: () => ({
    id: "studio-avatar",
    kind: "avatar",
    label: "Studio portrait engine",
    configured: true,
    notes: "Seed-stable illustrated identity. Same seed always yields the same ambassador.",
  }),
  async identityFrame({ seed, traits, expression }) {
    const t: PortraitTraits = {
      seed,
      gender: traits.gender ?? "female",
      skinTone: traits.skinTone ?? "Warm tan",
      hair: traits.hair ?? "Long dark waves",
      clothingStyle: traits.clothingStyle ?? "Tailored studio look",
      studioStyle: traits.studioStyle,
    };
    const svg = portraitSvg(t, 640, `${seed}-${expression ?? "neutral"}`);
    return { svg, provider: "studio-avatar" };
  },
};
