import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canCreatePresenter, canRenderVideo, getPlan, resolutionFor } from "./plans";

describe("plans", () => {
  it("caps starter presenters and videos", () => {
    const plan = getPlan("starter");
    assert.equal(canCreatePresenter(plan, 0), true);
    assert.equal(canCreatePresenter(plan, 1), false);
    assert.equal(canRenderVideo(plan, 3), false);
  });

  it("maps agency landscape to 4K", () => {
    const dims = resolutionFor("landscape", getPlan("agency").maxHeight);
    assert.deepEqual(dims, { width: 3840, height: 2160 });
  });
});
