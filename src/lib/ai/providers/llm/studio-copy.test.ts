import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { studioCopyProvider } from "./studio-copy";

describe("studio copy engine", () => {
  it("writes original MysticTxt-style copy instead of echoing the brief", async () => {
    const brief = {
      business: "MysticTxt",
      product: "MysticTxt is an app",
      extra: "Live Chat and Voice Call with advisors",
      assetLabels: ["Logo", "Advisor screen", "Live Chat", "Voice Call"],
    };
    const analysis = await studioCopyProvider.analyze(brief);
    const script = await studioCopyProvider.writeScript({
      brief,
      analysis,
      goal: "app-promo",
      tone: "Professional",
      language: "en",
      presenterName: "Amara Okonkwo",
    });
    assert.match(script.voiceover, /MysticTxt/);
    assert.match(script.voiceover, /Live Chat/);
    assert.notEqual(script.voiceover.trim(), brief.product);
    assert.ok(script.beats.length >= 5);
    assert.equal(script.cta.length > 0, true);
  });
});
