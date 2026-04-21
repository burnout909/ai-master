import React, { useState } from "react";
import type { Message } from "../../lib/chat/types";

type Props = {
  messages: Message[];
  onJumpToQuestion: (idx: number) => void;
  onJumpToAnswer: (idx: number) => void;
  onReAsk: (text: string) => void;
};

export function QuestionStack({ messages, onJumpToQuestion, onJumpToAnswer, onReAsk }: Props) {
  const [open, setOpen] = useState(false);
  const questions = messages
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.role === "user");

  if (questions.length === 0) return null;

  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-2.5 text-[12px] text-mute hover:text-ink flex items-center gap-1.5"
      >
        <span>{open ? "▾" : "▸"}</span>
        <span>내 질문 {questions.length}개</span>
      </button>
      {open && (
        <ol className="px-4 pb-3 flex flex-col gap-1.5" role="list">
          {questions.map(({ m, i }, qIdx) => {
            const short = m.content.length > 18 ? m.content.slice(0, 16) + "…" : m.content;
            return (
              <li key={i} className="flex items-center gap-2.5 text-[12px]" title={m.content}>
                <span className="text-mute tabular-nums">{qIdx + 1}.</span>
                <span className="flex-1 truncate">{short}</span>
                <button onClick={() => onJumpToQuestion(i)} className="text-mute hover:text-ink px-1" title="질문 위치로" aria-label="질문 위치로 이동">⤢</button>
                <button onClick={() => onReAsk(m.content)} className="text-mute hover:text-ink px-1" title="다시 묻기" aria-label="다시 묻기">↑</button>
                <button onClick={() => onJumpToAnswer(i)} className="text-mute hover:text-ink px-1" title="답변으로" aria-label="답변 위치로 이동">↓</button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
