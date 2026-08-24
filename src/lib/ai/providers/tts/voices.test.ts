import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FEMALE_ELEVEN_VOICE,
  MALE_ELEVEN_VOICE,
  defaultVoiceId,
  resolveElevenVoice,
  resolveOpenAiVoice,
  studioVoiceForPresenter,
} from "./voices";

describe("studio voices", () => {
  it("gives a male presenter a male ElevenLabs voice, not Sarah", () => {
    const voice = resolveElevenVoice("andre-steady", "male");
    assert.notEqual(voice, FEMALE_ELEVEN_VOICE);
    assert.equal(voice, MALE_ELEVEN_VOICE);
  });

  it("keeps a female presenter on the studio female voice", () => {
    assert.equal(resolveElevenVoice("yuna-warm", "female"), FEMALE_ELEVEN_VOICE);
  });

  it("maps a male presenter to a deep OpenAI voice", () => {
    assert.equal(resolveOpenAiVoice("andre-steady", "male"), "onyx");
  });

  it("never falls back to Sarah when the model is male and no female voice was chosen", () => {
    assert.equal(resolveElevenVoice("studio", "male"), MALE_ELEVEN_VOICE);
    assert.equal(defaultVoiceId("male"), "bold-male");
    assert.equal(studioVoiceForPresenter("andre-steady", "male").gender, "male");
  });

  it("lets a client explicitly pick a female voice even on a male model", () => {
    assert.equal(resolveElevenVoice("warm-female", "male"), FEMALE_ELEVEN_VOICE);
  });
});
