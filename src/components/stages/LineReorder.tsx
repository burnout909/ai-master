import { useMemo, useState } from "react";

type Props = {
  lines: string[];       // correct order
  onCorrect?: () => void;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function LineReorder({ lines, onCorrect }: Props) {
  const initial = useMemo(() => shuffle(lines.map((l, i) => ({ id: i, text: l }))), [lines]);
  const [order, setOrder] = useState(initial);
  const [state, setState] = useState<"idle" | "right" | "wrong">("idle");

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);
    setState("idle");
  };

  const check = () => {
    const ok = order.every((o, i) => o.text === lines[i]);
    setState(ok ? "right" : "wrong");
    if (ok) onCorrect?.();
  };

  return (
    <div className="my-4 border rounded p-3">
      <ol className="space-y-1">
        {order.map((line, i) => (
          <li key={line.id} className="flex items-center gap-2 font-mono">
            <button
              className="px-2 border rounded"
              aria-label="move up"
              onClick={() => move(i, i - 1)}
            >
              ↑
            </button>
            <button
              className="px-2 border rounded"
              aria-label="move down"
              onClick={() => move(i, i + 1)}
            >
              ↓
            </button>
            <span>{line.text}</span>
          </li>
        ))}
      </ol>
      <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded" onClick={check}>
        Check order
      </button>
      {state === "right" && <span className="ml-2 text-green-600">✓</span>}
      {state === "wrong" && <span className="ml-2 text-red-600">Not yet — keep trying</span>}
    </div>
  );
}
