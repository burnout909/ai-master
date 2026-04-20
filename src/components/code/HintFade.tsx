import { useState, type ReactNode } from "react";

type Props = { hints: [string, string, string]; solution?: ReactNode; solutionCode?: string };

export function HintFade({ hints, solution, solutionCode }: Props) {
  const [level, setLevel] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const solutionContent = solutionCode
    ? <pre className="text-sm bg-neutral-100 p-2 rounded">{solutionCode}</pre>
    : solution;

  return (
    <div className="my-3 border rounded p-3 bg-yellow-50">
      <div className="flex gap-2 mb-2">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            disabled={level >= n}
            className="px-2 py-1 text-sm border rounded disabled:opacity-40"
            onClick={() => setLevel(n)}
          >
            Hint {n}
          </button>
        ))}
        <button
          className="px-2 py-1 text-sm border rounded ml-auto"
          onClick={() => setShowSolution(true)}
        >
          Show solution
        </button>
      </div>
      {level >= 1 && <p className="text-sm">💡 {hints[0]}</p>}
      {level >= 2 && <p className="text-sm">💡 {hints[1]}</p>}
      {level >= 3 && <p className="text-sm">💡 {hints[2]}</p>}
      {showSolution && <div className="mt-2 border-t pt-2">{solutionContent}</div>}
    </div>
  );
}
