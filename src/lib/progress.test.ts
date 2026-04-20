import { beforeEach, describe, expect, it } from "vitest";
import {
  initPaperProgress,
  setStageStatus,
  getStageStatus,
  isStageUnlocked,
  allStagesMastered,
} from "./progress";
import { resetStore } from "./storage";

describe("progress", () => {
  beforeEach(() => resetStore());

  it("initializes all stages locked except intuition", () => {
    initPaperProgress("transformer");
    expect(getStageStatus("transformer", "intuition")).toBe("locked");
    expect(isStageUnlocked("transformer", "intuition")).toBe(true);
    expect(isStageUnlocked("transformer", "math")).toBe(false);
  });

  it("unlocks next stage when current is mastered", () => {
    initPaperProgress("transformer");
    setStageStatus("transformer", "intuition", "mastered");
    expect(isStageUnlocked("transformer", "math")).toBe(true);
    expect(isStageUnlocked("transformer", "pseudo")).toBe(false);
  });

  it("does not unlock next stage on skip", () => {
    initPaperProgress("transformer");
    setStageStatus("transformer", "intuition", "skipped");
    expect(isStageUnlocked("transformer", "math")).toBe(true);
  });

  it("allStagesMastered true only when every stage mastered", () => {
    initPaperProgress("transformer");
    const stages = ["intuition", "math", "pseudo", "code", "pdf"] as const;
    stages.forEach((s) => setStageStatus("transformer", s, "mastered"));
    expect(allStagesMastered("transformer")).toBe(true);
  });
});
