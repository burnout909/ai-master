import { describe, it, expect } from "vitest";
import { createSseParser } from "./sseParser";

describe("createSseParser", () => {
  it("emits one event per complete data frame", () => {
    const events: any[] = [];
    const p = createSseParser((e) => events.push(e));
    p.push(`data: {"delta":"he"}\n\n`);
    p.push(`data: {"delta":"llo"}\n\n`);
    expect(events).toEqual([{ delta: "he" }, { delta: "llo" }]);
  });

  it("buffers partial frames across pushes", () => {
    const events: any[] = [];
    const p = createSseParser((e) => events.push(e));
    p.push(`data: {"del`);
    p.push(`ta":"hi"}\n\n`);
    expect(events).toEqual([{ delta: "hi" }]);
  });

  it("emits sentinel for [DONE]", () => {
    const events: any[] = [];
    const p = createSseParser((e) => events.push(e));
    p.push(`data: [DONE]\n\n`);
    expect(events).toEqual([{ done: true }]);
  });

  it("passes through error frames", () => {
    const events: any[] = [];
    const p = createSseParser((e) => events.push(e));
    p.push(`data: {"error":"boom"}\n\n`);
    expect(events).toEqual([{ error: "boom" }]);
  });
});
