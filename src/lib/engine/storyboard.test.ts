import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { planScenes, moveScene } from "./storyboard";
import type { ScriptDraft } from "../ai/ports";

const script: ScriptDraft = {
  headline: "MysticTxt",
  voiceover: "Looking for someone to talk things through with?",
  beats: [
    { id: "a", line: "Open", visual: "full" },
    { id: "b", line: "Chat", visual: "split" },
    { id: "c", line: "Voice", visual: "product" },
    { id: "d", line: "Close", visual: "cta" },
  ],
  cta: "Talk to a Live Coach",
  captions: "Looking for someone",
  language: "en",
  provider: "studio-copy",
};

describe("storyboard", () => {
  it("never keeps every scene as a centered talking head", () => {
    const scenes = planScenes(script, 4, "Premium dark studio");
    const positions = new Set(scenes.map((s) => s.presenterPosition));
    assert.equal(scenes.at(-1)?.layout, "logo-cta");
    assert.ok(positions.size > 1);
    assert.ok(scenes.some((s) => s.layout !== "presenter-full" && s.layout !== "studio-presenter"));
  });

  it("reorders scenes", () => {
    const scenes = planScenes(script, 2, "studio");
    const moved = moveScene(scenes, scenes[0].id, 1);
    assert.equal(moved[1].id, scenes[0].id);
  });
});
