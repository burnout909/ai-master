import { useState } from "react";

type SentenceKey = "calculator" | "wiki" | "translate";
type ToolKey = "Calculator" | "WikiSearch" | "Translate";

const SENTENCES: Record<SentenceKey, { label: string; blank: string; tool: ToolKey; filled: string }> = {
  calculator: {
    label: "The revenue grew from 12M to __ this year.",
    blank: "The revenue grew from 12M to __ this year.",
    tool: "Calculator",
    filled: "The revenue grew from 12M to [Calculator(12 * 1.25) → 15M] 15M this year.",
  },
  wiki: {
    label: "Marie Curie won the Nobel Prize in __.",
    blank: "Marie Curie won the Nobel Prize in __.",
    tool: "WikiSearch",
    filled: "Marie Curie won the Nobel Prize in [WikiSearch(\"Marie Curie Nobel\") → Physics (1903), Chemistry (1911)] Physics and Chemistry.",
  },
  translate: {
    label: "In Spanish 'thank you' is __.",
    blank: "In Spanish 'thank you' is __.",
    tool: "Translate",
    filled: "In Spanish 'thank you' is [Translate(\"thank you\", target=\"es\") → gracias] gracias.",
  },
};

const TOOLS: ToolKey[] = ["Calculator", "WikiSearch", "Translate"];

const PERPLEXITY: Record<"match" | "mismatch", string> = {
  match: "−4.2 nats",
  mismatch: "−0.1 nats",
};

export function ToolCalls() {
  const [sentence, setSentence] = useState<SentenceKey>("calculator");
  const [tool, setTool] = useState<ToolKey>("Calculator");

  const data = SENTENCES[sentence];
  const isMatch = data.tool === tool;
  const perplexity = isMatch ? PERPLEXITY.match : PERPLEXITY.mismatch;

  // Render the blank sentence with __ highlighted
  const parts = data.blank.split("__");

  return (
    <div className="my-4 p-4 border rounded-lg space-y-4 font-sans text-sm">
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-semibold text-xs uppercase tracking-wide text-neutral-500">Sentence</span>
          <select
            aria-label="sentence"
            value={sentence}
            onChange={(e) => setSentence(e.target.value as SentenceKey)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="calculator">Revenue grew from 12M to __</option>
            <option value="wiki">Marie Curie won the Nobel Prize in __</option>
            <option value="translate">In Spanish 'thank you' is __</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-semibold text-xs uppercase tracking-wide text-neutral-500">Tool</span>
          <select
            aria-label="tool"
            value={tool}
            onChange={(e) => setTool(e.target.value as ToolKey)}
            className="border rounded px-2 py-1 text-sm"
          >
            {TOOLS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Original sentence with __ highlighted */}
      <div className="font-mono text-base">
        {parts[0]}
        <span className="bg-yellow-200 text-yellow-800 rounded px-1 font-bold">__</span>
        {parts[1]}
      </div>

      {/* Result panel */}
      <div
        className={`rounded-lg border-2 p-3 ${
          isMatch
            ? "border-green-500 bg-green-50"
            : "border-red-400 bg-red-50"
        }`}
      >
        {isMatch ? (
          <>
            <p className="font-mono text-sm text-green-800 leading-relaxed">{data.filled}</p>
            <p className="mt-2 text-xs text-green-700 font-semibold">
              Useful completion — perplexity reduction: <span className="font-mono">{perplexity}</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-red-700 font-semibold">
              Mismatched tool — this would give a useless completion.
            </p>
            <p className="mt-1 text-xs text-red-600">
              Perplexity reduction: <span className="font-mono">{perplexity}</span> (near zero — Toolformer discards this candidate)
            </p>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="text-xs text-neutral-500 border-t pt-2">
        <span className="font-semibold">How Toolformer works:</span> During self-supervised training, the model
        proposes API calls mid-sentence. Only calls that reduce perplexity significantly are kept, teaching the model
        when to invoke tools.
      </div>
    </div>
  );
}
