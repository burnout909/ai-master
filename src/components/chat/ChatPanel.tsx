import React, { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { QuestionStack } from "./QuestionStack";
import { SessionList } from "./SessionList";
import { createStore, type Store } from "../../lib/chat/store";
import { createSseParser } from "../../lib/chat/sseParser";
import { detectSkipIntent } from "../../lib/chat/skipDetector";
import type { ChatMode, Message, StageId, ProgressSnapshot } from "../../lib/chat/types";

type Props = {
  mode: ChatMode;
  paperSlug?: string;
  storageKey: string;
  progressSnapshot?: ProgressSnapshot;
};

function useStore(key: string): [Store, number] {
  const [tick, setTick] = useState(0);
  const ref = useRef<Store | null>(null);
  if (!ref.current) ref.current = createStore(key);
  useEffect(() => ref.current!.subscribe(() => setTick((n) => n + 1)), []);
  return [ref.current, tick];
}

function useCurrentStage(enabled: boolean): StageId | undefined {
  const [stage, setStage] = useState<StageId | undefined>();
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const sections = document.querySelectorAll<HTMLElement>("[data-stage-section]");
    if (sections.length === 0) return;
    const ratios = new Map<StageId, number>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const id = e.target.getAttribute("data-stage-section") as StageId | null;
        if (id) ratios.set(id, e.intersectionRatio);
      }
      let best: StageId | undefined;
      let max = 0;
      for (const [id, r] of ratios) if (r > max) { max = r; best = id; }
      if (best) setStage(best);
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [enabled]);
  return stage;
}

export default function ChatPanel(props: Props) {
  const [store] = useStore(props.storageKey);
  const state = store.getState();
  const active = store.getActive();
  const currentStage = useCurrentStage(props.mode === "paper");

  const [input, setInput] = useState("");
  const [view, setView] = useState<"chat" | "history">("chat");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Array<HTMLDivElement | null>>([]);

  function jumpToMsg(idx: number) {
    const el = messageRefs.current[idx];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.animate(
      [{ background: "var(--accent-soft)" }, { background: "var(--paper-2)" }],
      { duration: 900 },
    );
  }

  useEffect(() => {
    if (!active) store.startSession("socratic");
  }, [active, store]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [state, streaming]);

  async function send() {
    const text = input.trim();
    if (!text || streaming || !active) return;

    const userMsg: Message = { role: "user", content: text, ts: new Date().toISOString() };
    store.appendMessage(userMsg);
    store.appendMessage({ role: "assistant", content: "", ts: new Date().toISOString() });
    setInput("");
    setError(null);
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const history = [...(active.messages ?? []), userMsg];

    let buffer = "";
    const parser = createSseParser((e) => {
      if ("delta" in e) {
        buffer += e.delta;
        store.replaceLastAssistant(buffer);
      } else if ("error" in e) {
        setError(e.error);
      }
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          mode: props.mode,
          paperSlug: props.paperSlug,
          currentStage,
          progressSnapshot: props.progressSnapshot,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          pedagogyMode: active.pedagogyMode,
        }),
      });
      if (!res.ok || !res.body) {
        setError(`HTTP ${res.status}`);
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          parser.push(decoder.decode(value, { stream: true }));
        }
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e?.message ?? "network error");
    } finally {
      setStreaming(false);
      abortRef.current = null;

      if (detectSkipIntent(text) && active.pedagogyMode === "socratic") {
        // intentionally no-op: server side handles the re-prompt via system instruction.
        // If user's NEXT message supplies a reason, we flip to direct (see onNextMessage flag below).
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function abort() { abortRef.current?.abort(); }
  function newSession() { store.startSession("socratic"); }

  const headerTitle =
    props.mode === "paper" ? props.paperSlug :
    props.mode === "roadmap" ? "Roadmap" :
    props.mode === "progress" ? "Progress" : "Review";

  return (
    <div
      className="flex flex-col h-full border border-line rounded-[4px] overflow-hidden"
      style={{ background: "var(--paper-2)" }}
      data-chat-panel
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-line">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] uppercase tracking-[0.12em] text-mute">Tutor</span>
          <span className="text-[13px] truncate">{headerTitle}</span>
          {currentStage && (
            <span className="text-[11px] text-mute">· {currentStage}</span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setView((v) => v === "chat" ? "history" : "chat")}
            className="text-[12px] px-2 py-1 text-mute hover:text-ink"
            title="히스토리"
          >📚</button>
          <button onClick={newSession} className="text-[12px] px-2 py-1 text-mute hover:text-ink" title="새 대화">＋</button>
        </div>
      </div>

      {view === "history" ? (
        <SessionList store={store} onPickActive={() => setView("chat")} />
      ) : (
        <>
          <QuestionStack
            messages={active?.messages ?? []}
            onJumpToQuestion={(i) => jumpToMsg(i)}
            onJumpToAnswer={(i) => jumpToMsg(i + 1)}
            onReAsk={(t) => setInput(t)}
          />
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            {(active?.messages ?? []).map((m, i) => (
              <div key={i} ref={(el) => { messageRefs.current[i] = el; }}>
                <ChatMessage msg={m} streaming={streaming && i === active!.messages.length - 1 && m.role === "assistant"} />
              </div>
            ))}
            {error && <div className="text-[12px] text-[color:var(--danger)]">{error}</div>}
          </div>

          <div className="border-t border-line p-2 flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder="질문을 입력하세요. Enter 전송, Shift+Enter 줄바꿈."
              className="flex-1 resize-none px-2 py-1 text-[14px] border border-line rounded-[4px] bg-paper outline-none focus:border-ink"
            />
            {streaming ? (
              <button onClick={abort} className="px-3 text-[12px] border border-line rounded-[4px] hover:border-ink">중단</button>
            ) : (
              <button onClick={send} className="px-3 text-[12px] text-paper rounded-[4px]" style={{ background: "var(--accent)" }}>전송</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
