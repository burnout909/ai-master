import React, { useState } from "react";
import type { Store } from "../../lib/chat/store";

type Props = { store: Store; onPickActive: () => void };

export function SessionList({ store, onPickActive }: Props) {
  const { sessions, activeId } = store.getState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const sorted = [...sessions].sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));

  return (
    <div className="flex flex-col h-full">
      <button
        onClick={() => { store.startSession("socratic"); onPickActive(); }}
        className="mx-3 my-2 text-[13px] text-left border border-line rounded-[4px] px-2 py-1 hover:border-ink"
        aria-label="새 대화 시작"
      >＋ 새 대화</button>
      <ol className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-1" role="list">
        {sorted.map((s) => (
          <li key={s.id} className="border-b border-line/60 py-1.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { store.setActive(s.id); onPickActive(); }}
                className="flex-1 text-left text-[13px] truncate hover:text-accent"
              >
                {s.id === activeId && <span className="text-accent">•</span>}{" "}
                {editingId === s.id ? (
                  <input
                    autoFocus value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => { store.rename(s.id, draft || s.title); setEditingId(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    className="w-full bg-transparent border-b border-ink outline-none"
                  />
                ) : s.title}
              </button>
              <span className="text-[11px] text-mute tabular-nums">{s.lastActiveAt.slice(0, 10)}</span>
              <button
                onClick={() => { setEditingId(s.id); setDraft(s.title); }}
                className="text-[11px] text-mute hover:text-ink" title="이름 바꾸기"
                aria-label="세션 이름 바꾸기"
              >✎</button>
              <button
                onClick={() => { if (confirm("이 세션을 삭제할까?")) store.deleteSession(s.id); }}
                className="text-[11px] text-mute hover:text-[color:var(--danger)]" title="삭제"
                aria-label="세션 삭제"
              >×</button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
