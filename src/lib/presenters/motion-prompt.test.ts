import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { inferPresenterFromPrompt, motionPromptFor, stillPromptFor } from "./motion-prompt";

describe("motion prompt", () => {
  it("describes a freely moving presenter from a photo, not a locked talking head", () => {
    const prompt = motionPromptFor({
      name: "Yuna Han",
      gender: "female",
      clothingStyle: "cream knit",
      studioStyle: "Editorial fashion set",
    });
    assert.match(prompt, /Yuna Han/);
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

  it("lets a client director prompt override look and movement", () => {
    const prompt = motionPromptFor(
      { name: "Andre Whitfield", gender: "male", clothingStyle: "white suit" },
      "Dark American guy, clean cut, white suit, professional advice, composed gestures",
    );
    assert.match(prompt, /Client direction/);
    assert.match(prompt, /professional advice/);
    assert.match(prompt, /white suit/);
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

  it("reads a client look prompt into a new presenter", () => {
    const inferred = inferPresenterFromPrompt(
      "dark American guy very handsome with clean cut wearing a white suit, professional advice",
    );
    assert.equal(inferred.gender, "male");
    assert.match(inferred.clothingStyle, /white suit/i);
    assert.equal(inferred.region, "United States");
  });
});
