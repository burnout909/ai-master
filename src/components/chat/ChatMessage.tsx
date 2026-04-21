import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Message } from "../../lib/chat/types";

type Props = { msg: Message; streaming?: boolean };

export function ChatMessage({ msg, streaming }: Props) {
  const isUser = msg.role === "user";
  return (
    <div
      className={isUser ? "self-end max-w-[88%] px-3.5 py-2.5 rounded-[4px]" : "self-start max-w-[92%] px-4 py-3 rounded-[4px] border border-line"}
      style={{
        background: isUser ? "var(--accent-soft)" : "var(--paper-2)",
        color: "var(--ink)",
        fontSize: 15,
        lineHeight: 1.7,
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {msg.content + (streaming ? " ▍" : "")}
      </ReactMarkdown>
    </div>
  );
}
