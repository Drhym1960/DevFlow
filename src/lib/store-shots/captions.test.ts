import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { captionsForScreens } from "./captions";
import { storeSize } from "./sizes";

describe("store shots", () => {
  it("keeps client captions in order for each original screen", () => {
    const lines = captionsForScreens({
      appName: "MysticTxt",
      notes: "Private live chat with advisors.",
      screens: 2,
      captions: ["Talk privately", "Voice when you are ready"],
    });
    assert.equal(lines.length, 2);
    assert.equal(lines[0].headline, "Talk privately");
    assert.equal(lines[1].headline, "Voice when you are ready");
  });

  it("fills missing captions from the app name instead of inventing UI", () => {
    const lines = captionsForScreens({ appName: "MysticTxt", notes: "", screens: 1 });
    assert.match(lines[0].headline, /MysticTxt/);
  });

  it("exports Play Store phone size", () => {
    assert.equal(storeSize("play").width, 1080);
    assert.equal(storeSize("play").height, 1920);
  });

  it("exports App Store iPhone size", () => {
    assert.equal(storeSize("apple").width, 1290);
    assert.equal(storeSize("apple").height, 2796);
  });
});
