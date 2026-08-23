"use client";

import { useEffect, useState } from "react";
import type { ScenePlan } from "@/lib/ai/ports";
import { PortraitView } from "./portrait-view";

export function ScenePlayer({
  scenes,
  presenter,
  brand,
  format,
}: {
  scenes: ScenePlan[];
  presenter: {
    name: string;
    gender: string;
    skinTone: string;
    hair: string;
    clothingStyle: string;
    portraitSeed: string;
    studioStyle?: string | null;
  } | null;
  brand: string;
  format: string;
}) {
  const [i, setI] = useState(0);
  const scene = scenes[i];

  useEffect(() => {
    if (!scene) return;
    const t = setTimeout(() => setI((n) => (n + 1) % scenes.length), scene.duration * 1000);
    return () => clearTimeout(t);
  }, [scene, scenes.length]);

  if (!scene) return null;
  const aspect = format === "vertical" ? "aspect-[9/16]" : format === "square" ? "aspect-square" : "aspect-video";
  const pos = scene.presenterPosition;

  return (
    <div className={`glass relative mx-auto w-full max-w-xl overflow-hidden rounded-[28px] ${aspect} bg-ink-900`}>
      <div className="absolute inset-0 bg-gradient-to-br from-ink-800 to-ink-950" />
      {presenter && pos !== "hidden" ? (
        <div
          className={
            pos === "left"
              ? "absolute bottom-0 left-0 h-[85%] w-[46%]"
              : pos === "right"
                ? "absolute bottom-0 right-0 h-[85%] w-[46%]"
                : pos === "pip"
                  ? "absolute right-4 top-4 h-32 w-24 overflow-hidden rounded-xl"
                  : "absolute inset-x-0 bottom-0 h-[92%]"
          }
        >
          <PortraitView presenter={presenter} />
        </div>
      ) : null}
      {scene.layout.includes("product") || scene.layout.includes("floating") || scene.layout === "logo-cta" ? (
        <div
          className={`absolute rounded-2xl border border-white/10 bg-ink-850/80 p-4 ${
            pos === "left" ? "right-6 top-1/4 w-[42%]" : pos === "right" ? "left-6 top-1/4 w-[42%]" : "inset-x-10 top-1/3"
          }`}
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold-400">{brand}</p>
          <p className="mt-2 text-sm">{scene.visual}</p>
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5">
        <p className="text-sm leading-6">{scene.caption}</p>
      </div>
    </div>
  );
}
