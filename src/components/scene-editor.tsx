"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScenePlan } from "@/lib/ai/ports";
import { MUSIC_BEDS } from "@/lib/constants";
import { Button, Field, Select } from "./ui";

const LAYOUTS: ScenePlan["layout"][] = [
  "presenter-full",
  "presenter-left-product-right",
  "presenter-right-product-left",
  "presenter-pip",
  "floating-screens",
  "product-overlay",
  "product-only",
  "studio-presenter",
  "lifestyle-presenter",
  "logo-cta",
];

export function SceneEditor({
  projectId,
  initialScenes,
  presenters,
  presenterId,
  music,
  cta,
}: {
  projectId: string;
  initialScenes: ScenePlan[];
  presenters: { id: string; name: string }[];
  presenterId: string;
  music: string;
  cta: string;
}) {
  const router = useRouter();
  const [scenes, setScenes] = useState(initialScenes);
  const [meta, setMeta] = useState({ presenterId, music, cta });

  function patch(id: string, next: Partial<ScenePlan>) {
    setScenes((all) => all.map((s) => (s.id === id ? { ...s, ...next } : s)));
  }

  function move(id: string, dir: -1 | 1) {
    setScenes((all) => {
      const i = all.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= all.length) return all;
      const copy = [...all];
      const [item] = copy.splice(i, 1);
      copy.splice(j, 0, item);
      return copy;
    });
  }

  async function save(rerender = false) {
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenes, ...meta, cta: meta.cta }),
    });
    if (rerender) await fetch(`/api/projects/${projectId}/render`, { method: "POST" });
    router.push(`/videos/${projectId}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Select label="Presenter" value={meta.presenterId} onChange={(e) => setMeta({ ...meta, presenterId: e.target.value })}>
          {presenters.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
        <Select label="Music" value={meta.music} onChange={(e) => setMeta({ ...meta, music: e.target.value })}>
          {MUSIC_BEDS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </Select>
        <Field label="Call to action" value={meta.cta} onChange={(e) => setMeta({ ...meta, cta: e.target.value })} />
      </div>
      {scenes.map((scene) => (
        <article key={scene.id} className="glass space-y-3 rounded-3xl p-5">
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => move(scene.id, -1)}>Up</Button>
            <Button variant="ghost" onClick={() => move(scene.id, 1)}>Down</Button>
            <Button variant="ink" onClick={() => setScenes((all) => all.filter((s) => s.id !== scene.id))}>Delete</Button>
          </div>
          <Select label="Layout" value={scene.layout} onChange={(e) => patch(scene.id, { layout: e.target.value as ScenePlan["layout"] })}>
            {LAYOUTS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </Select>
          <Field label="Line / caption" value={scene.caption} onChange={(e) => patch(scene.id, { caption: e.target.value, line: e.target.value })} />
          <Field label="Background" value={scene.background} onChange={(e) => patch(scene.id, { background: e.target.value })} />
        </article>
      ))}
      <Button
        variant="ghost"
        onClick={() =>
          setScenes((all) => [
            ...all,
            {
              id: `scene-${Date.now()}`,
              layout: "studio-presenter",
              duration: 3,
              line: "New scene",
              caption: "New scene",
              visual: "Presenter in studio",
              presenterPosition: "center",
              background: "Premium dark studio",
            },
          ])
        }
      >
        Add scene
      </Button>
      <div className="flex gap-3">
        <Button onClick={() => void save(false)}>Save edit</Button>
        <Button variant="ghost" onClick={() => void save(true)}>Regenerate film</Button>
      </div>
    </div>
  );
}
