export type PlanId = "starter" | "studio" | "agency";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  blurb: string;
  customPresenters: number;
  videosPerMonth: number;
  maxHeight: number;
  voices: "core" | "full" | "director";
  commercial: boolean;
  customization: "standard" | "advanced" | "director";
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: "$29",
    blurb: "Launch your first brand ambassador and three studio ads.",
    customPresenters: 1,
    videosPerMonth: 3,
    maxHeight: 1080,
    voices: "core",
    commercial: false,
    customization: "standard",
    features: ["1 custom presenter", "3 videos / month", "1080p export", "Core voices", "Personal use"],
  },
  studio: {
    id: "studio",
    name: "Studio",
    price: "$99",
    blurb: "A full in-house creative desk for growing brands.",
    customPresenters: 5,
    videosPerMonth: 30,
    maxHeight: 1080,
    voices: "full",
    commercial: true,
    customization: "advanced",
    features: ["5 custom presenters", "30 videos / month", "HD commercial license", "Full voice catalog", "Brand kits"],
  },
  agency: {
    id: "agency",
    name: "Agency",
    price: "$249",
    blurb: "Director-level control for teams shipping campaigns at scale.",
    customPresenters: 25,
    videosPerMonth: 200,
    maxHeight: 2160,
    voices: "director",
    commercial: true,
    customization: "director",
    features: ["25 brand ambassadors", "200 videos / month", "4K rendering", "Commercial + client usage", "Deep presenter direction"],
  },
};

export function getPlan(id: string | null | undefined): Plan {
  if (id && id in PLANS) return PLANS[id as PlanId];
  return PLANS.starter;
}

export function canCreatePresenter(plan: Plan, currentCount: number) {
  return currentCount < plan.customPresenters;
}

export function canRenderVideo(plan: Plan, videosUsed: number) {
  return videosUsed < plan.videosPerMonth;
}

export function resolutionFor(format: string, maxHeight: number) {
  const map: Record<string, { width: number; height: number }> = {
    vertical: { width: 1080, height: 1920 },
    landscape: { width: 1920, height: 1080 },
    square: { width: 1080, height: 1080 },
  };
  const base = map[format] ?? map.landscape;
  if (maxHeight >= 2160 && format === "landscape") return { width: 3840, height: 2160 };
  if (maxHeight >= 2160 && format === "vertical") return { width: 2160, height: 3840 };
  if (maxHeight >= 2160 && format === "square") return { width: 2160, height: 2160 };
  return base;
}
