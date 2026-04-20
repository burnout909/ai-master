import { useState } from "react";

type Step = { kind: "Thought" | "Action" | "Observation"; text: string };
type Mode = "CoT" | "Act" | "ReAct";

const TRACES: Record<Mode, Step[]> = {
  CoT: [
    { kind: "Thought", text: "The capital of France is Paris." },
    { kind: "Thought", text: "Paris's population is roughly 2 million." },
    { kind: "Thought", text: "Final answer: ~2,000,000." },
  ],
  Act: [
    { kind: "Action", text: "search(\"France capital\")" },
    { kind: "Observation", text: "Paris" },
    { kind: "Action", text: "search(\"Paris\")" },
    { kind: "Observation", text: "Disambiguation: Paris (city), Paris (texas)…" },
    { kind: "Action", text: "search(\"Paris Texas\")" },
    { kind: "Observation", text: "Paris, Texas: ~25k" },
    { kind: "Action", text: "Final: 25000 (wrong disambiguation)" },
  ],
  ReAct: [
    { kind: "Thought", text: "I need the capital of France first." },
    { kind: "Action", text: "search(\"France capital\")" },
    { kind: "Observation", text: "Paris" },
    { kind: "Thought", text: "Now fetch Paris's population." },
    { kind: "Action", text: "search(\"Paris, France population\")" },
    { kind: "Observation", text: "≈ 2,102,650 (2023)" },
    { kind: "Thought", text: "Final answer: ~2.1M." },
  ],
};

export function ReActLoop() {
  const [mode, setMode] = useState<Mode>("ReAct");
  const [shown, setShown] = useState(0);

  const trace = TRACES[mode];

  return (
    <div className="my-4 p-4 border rounded-lg">
      <div className="mb-3 flex gap-4 flex-wrap">
        {(["CoT", "Act", "ReAct"] as Mode[]).map((m) => (
          <label key={m} className="text-sm">
            <input
              type="radio"
              name="mode"
              aria-label={m}
              checked={mode === m}
              onChange={() => {
                setMode(m);
                setShown(0);
              }}
              className="mr-1"
            />
            {m}
          </label>
        ))}
      </div>
      <ol className="space-y-1 font-mono text-sm">
        {trace.slice(0, shown).map((s, i) => (
          <li key={i} className={
            s.kind === "Thought" ? "text-neutral-700" :
            s.kind === "Action" ? "text-blue-700" :
            "text-green-700"
          }>
            <span className="font-semibold">{s.kind}:</span> {s.text}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex gap-2">
        <button
          className="px-3 py-1 border rounded disabled:opacity-40"
          disabled={shown >= trace.length}
          onClick={() => setShown((s) => s + 1)}
        >
          Step
        </button>
        <button
          className="px-3 py-1 border rounded"
          onClick={() => setShown(0)}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
