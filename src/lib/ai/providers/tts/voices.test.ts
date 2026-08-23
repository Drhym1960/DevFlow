import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveElevenVoice, resolveOpenAiVoice } from "./voices";

describe("studio voices", () => {
  it("gives a male presenter a male ElevenLabs voice, not Sarah", () => {
    const voice = resolveElevenVoice("andre-steady", "male");
    assert.notEqual(voice, "EXAVITQu4vr4xnSDxMaL");
    assert.equal(voice, "pNInz6obpgDQGcFmaJgB");
  });

  it("keeps a female presenter on the studio female voice", () => {
    assert.equal(resolveElevenVoice("yuna-warm", "female"), "EXAVITQu4vr4xnSDxMaL");
  });

  it("maps a male presenter to a deep OpenAI voice", () => {
    assert.equal(resolveOpenAiVoice("andre-steady", "male"), "onyx");
  });
});
