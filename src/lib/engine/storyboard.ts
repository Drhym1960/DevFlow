import type { SceneLayout, ScenePlan } from "@/lib/ai/ports";
import type { ScriptDraft } from "@/lib/ai/ports";

const LAYOUTS: SceneLayout[] = [
  "studio-presenter",
  "presenter-left-product-right",
  "product-only",
  "floating-screens",
  "presenter-pip",
  "presenter-right-product-left",
  "logo-cta",
];

function positionFor(layout: SceneLayout): ScenePlan["presenterPosition"] {
  if (layout === "product-only" || layout === "logo-cta") return "hidden";
  if (layout === "presenter-left-product-right") return "left";
  if (layout === "presenter-right-product-left") return "right";
  if (layout === "presenter-pip" || layout === "product-overlay") return "pip";
  if (layout === "floating-screens") return "left";
  return "center";
}

export function planScenes(script: ScriptDraft, assetCount: number, studioStyle: string): ScenePlan[] {
  const beats = script.beats.length ? script.beats : [{ id: "open", line: script.voiceover, visual: "Presenter" }];
  return beats.map((beat, i) => {
    let layout = LAYOUTS[Math.min(i, LAYOUTS.length - 1)];
    if (assetCount === 0 && (layout === "product-only" || layout === "floating-screens")) {
      layout = i % 2 === 0 ? "studio-presenter" : "lifestyle-presenter";
    }
    if (i === beats.length - 1) layout = "logo-cta";
    const duration = i === 0 || i === beats.length - 1 ? 3.2 : 4;
    return {
      id: beat.id || `scene-${i + 1}`,
      layout,
      duration,
      line: beat.line,
      caption: beat.line,
      visual: beat.visual,
      assetHint: assetCount ? `asset-${i % assetCount}` : undefined,
      presenterPosition: positionFor(layout),
      background: studioStyle || "Premium dark studio",
    };
  });
}

export function applySceneEdit(scenes: ScenePlan[], id: string, patch: Partial<ScenePlan>) {
  return scenes.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

export function moveScene(scenes: ScenePlan[], id: string, dir: -1 | 1) {
  const i = scenes.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= scenes.length) return scenes;
  const next = [...scenes];
  const [item] = next.splice(i, 1);
  next.splice(j, 0, item);
  return next;
}
