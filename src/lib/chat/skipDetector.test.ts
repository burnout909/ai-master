import { describe, it, expect } from "vitest";
import { detectSkipIntent } from "./skipDetector";

describe("detectSkipIntent", () => {
  it("returns true for explicit skip phrases", () => {
    expect(detectSkipIntent("그냥 답 알려줘")).toBe(true);
    expect(detectSkipIntent("skip 해줘")).toBe(true);
    expect(detectSkipIntent("빨리 설명만")).toBe(true);
    expect(detectSkipIntent("답만 말해줘")).toBe(true);
    expect(detectSkipIntent("just tell me")).toBe(true);
  });

  it("returns false for ordinary questions", () => {
    expect(detectSkipIntent("이게 뭐야?")).toBe(false);
    expect(detectSkipIntent("왜 d_k로 나누지?")).toBe(false);
    expect(detectSkipIntent("답이 뭐인지 모르겠어")).toBe(false);
  });
});
