import { useMemo, useState } from "react";

const ROWS = 6;
const COLS = 6;
const TOTAL = ROWS * COLS;

function buildMask(keepProb: number, step: number): boolean[] {
  return Array.from({ length: TOTAL }, (_, i) => {
    const x = Math.sin((step * 2654435761 + i) * 2654435761) * 10000;
    const rand = x - Math.floor(x);
    return rand < keepProb;
  });
}

export function DropoutMask() {
  const [keepProb, setKeepProb] = useState(0.5);
  const [step, setStep] = useState(0);
  const [showExpected, setShowExpected] = useState(false);

  const mask = useMemo(() => buildMask(keepProb, step), [keepProb, step]);
  const survived = mask.filter(Boolean).length;
  const expected = (TOTAL * keepProb).toFixed(1);

  return (
    <div className="my-4 p-4 border rounded-lg bg-white">
      <div className="flex gap-4 items-center mb-3 flex-wrap">
        <label className="text-sm">
          keep_prob:
          <input
            aria-label="keep probability"
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={keepProb}
            onChange={(e) => setKeepProb(parseFloat(e.target.value))}
            className="mx-2"
          />
          <span className="font-mono">{keepProb.toFixed(2)}</span>
        </label>

        <button
          onClick={() => setStep((s) => s + 1)}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Resample
        </button>

        <label className="text-sm flex items-center gap-1">
          <input
            type="checkbox"
            checked={showExpected}
            onChange={(e) => setShowExpected(e.target.checked)}
          />
          Show expected value
        </label>
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${COLS}, 2.5rem)` }}
      >
        {mask.map((alive, i) => (
          <div
            key={i}
            title={alive ? "active" : "dropped"}
            className={`w-10 h-10 rounded flex items-center justify-center text-xs font-mono transition-colors ${
              alive
                ? "bg-blue-400 text-white"
                : "bg-neutral-200 text-neutral-400"
            }`}
          >
            {alive ? "1" : "0"}
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-neutral-700">
        Surviving: <span className="font-mono font-semibold">{survived}</span>
        {showExpected && (
          <span className="ml-3 text-neutral-500">
            Expected: <span className="font-mono">{expected}</span>
          </span>
        )}
        {" "}/ {TOTAL} neurons
      </p>

      <p className="mt-1 text-xs text-neutral-500">
        Step {step} — each neuron is independently kept with probability keep_prob.
        At test time, all neurons are active but outputs are scaled by keep_prob.
      </p>
    </div>
  );
}
