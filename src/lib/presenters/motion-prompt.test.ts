import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { motionPromptFor, stillPromptFor } from "./motion-prompt";

describe("motion prompt", () => {
  it("describes a freely moving presenter from a photo, not a locked talking head", () => {
    const prompt = motionPromptFor({
      name: "Yuna Han",
      gender: "female",
      clothingStyle: "cream knit",
      studioStyle: "Editorial fashion set",
    });
    assert.match(prompt, /Yuna Han/);
    assert.match(prompt, /smile/);
    assert.match(prompt, /walk/);
    assert.match(prompt, /turn/);
    assert.match(prompt, /point/);
    assert.match(prompt, /hands/);
    assert.match(prompt, /no celebrity likeness/i);
  });

  it("uses he for a male client photo", () => {
    const prompt = motionPromptFor({ name: "Jordan Hale", gender: "male" });
    assert.match(prompt, /\bHe\b/);
    assert.doesNotMatch(prompt, /\bShe\b/);
  });

  it("asks for a standing photoreal still when a library model has no photo yet", () => {
    const still = stillPromptFor({
      gender: "female",
      region: "South Korea",
      clothingStyle: "cream knit",
      studioStyle: "Editorial fashion set",
    });
    assert.match(still, /full-body/);
    assert.match(still, /South Korea/);
  });
});
