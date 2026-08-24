import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { expandIdea, inferDurationSeconds, inferVoiceFromIdea } from "./expand-idea";

describe("expand idea", () => {
  it("turns a messy MysticTxt sentence into a male advisor film", () => {
    const film = expandIdea(
      "private advice app called MysticTxt, handsome American man in a white suit, bold male voice, 30 seconds",
    );
    assert.equal(film.gender, "male");
    assert.equal(film.voiceId, "bold-male");
    assert.equal(film.durationSeconds, 30);
    assert.equal(film.wantsCustomModel, true);
    assert.match(film.product, /MysticTxt|private advice/i);
  });

  it("picks a library model when the idea never describes a person", () => {
    const film = expandIdea("promote our new meditation app for busy professionals");
    assert.equal(film.wantsCustomModel, false);
    assert.ok(film.librarySlug);
  });

  it("honours a client-picked voice over the default", () => {
    const film = expandIdea("a fashion lookbook", { voiceId: "silk-female" });
    assert.equal(film.voiceId, "silk-female");
    assert.equal(film.voice.gender, "female");
  });

  it("reads film length from loose wording", () => {
    assert.equal(inferDurationSeconds("make it 24 sec"), 24);
    assert.equal(inferDurationSeconds("about 28 seconds long"), 30);
  });

  it("maps a requested male voice from the sentence", () => {
    assert.equal(inferVoiceFromIdea("use a deep male voice", "unknown").id, "deep-male");
  });
});
