import { describe, it, expect, beforeEach } from "vitest";
import { createStore } from "./store";

beforeEach(() => {
  localStorage.clear();
});

describe("createStore", () => {
  it("starts with empty sessions and no active id", () => {
    const s = createStore("chat:paper:demo");
    expect(s.getState()).toEqual({ sessions: [], activeId: null });
  });

  it("startSession creates + activates a session", () => {
    const s = createStore("chat:paper:demo");
    const id = s.startSession("socratic");
    const st = s.getState();
    expect(st.activeId).toBe(id);
    expect(st.sessions).toHaveLength(1);
    expect(st.sessions[0].pedagogyMode).toBe("socratic");
  });

  it("appendMessage updates title from first user message", () => {
    const s = createStore("chat:paper:demo");
    s.startSession("socratic");
    s.appendMessage({ role: "user", content: "√d_k 스케일링 왜 필요?", ts: "t1" });
    const active = s.getActive()!;
    expect(active.title.startsWith("√d_k")).toBe(true);
  });

  it("persists to localStorage under the given key", () => {
    const s = createStore("chat:paper:demo");
    s.startSession("socratic");
    s.appendMessage({ role: "user", content: "q", ts: "t" });
    const raw = localStorage.getItem("chat:paper:demo")!;
    expect(JSON.parse(raw).sessions[0].messages[0].content).toBe("q");
  });

  it("reloads from localStorage on construction", () => {
    const s1 = createStore("chat:paper:demo");
    s1.startSession("socratic");
    s1.appendMessage({ role: "user", content: "q", ts: "t" });
    const s2 = createStore("chat:paper:demo");
    expect(s2.getState().sessions).toHaveLength(1);
  });

  it("rename updates title", () => {
    const s = createStore("chat:paper:demo");
    const id = s.startSession("socratic");
    s.rename(id, "My topic");
    expect(s.getActive()!.title).toBe("My topic");
  });

  it("deleteSession removes and picks next active", () => {
    const s = createStore("chat:paper:demo");
    const a = s.startSession("socratic");
    const b = s.startSession("socratic");
    expect(s.getState().activeId).toBe(b);
    s.deleteSession(b);
    expect(s.getState().sessions.map((x) => x.id)).toEqual([a]);
    expect(s.getState().activeId).toBe(a);
  });

  it("setPedagogyMode updates active session", () => {
    const s = createStore("chat:paper:demo");
    s.startSession("socratic");
    s.setPedagogyMode("direct");
    expect(s.getActive()!.pedagogyMode).toBe("direct");
  });

  it("subscribe fires on mutations", () => {
    const s = createStore("chat:paper:demo");
    let calls = 0;
    s.subscribe(() => { calls++; });
    s.startSession("socratic");
    s.appendMessage({ role: "user", content: "q", ts: "t" });
    expect(calls).toBeGreaterThanOrEqual(2);
  });
});
