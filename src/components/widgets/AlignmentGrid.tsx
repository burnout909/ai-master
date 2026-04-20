import { useMemo, useState } from "react";

const SRC_TOKENS = ["Je", "suis", "étudiant", "à", "l'université", "."];
const NUM_TGT = 5;
const NUM_SRC = SRC_TOKENS.length;

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function learnedWeights(tgt: number, sharpness: number): number[] {
  const raw = SRC_TOKENS.map((_, s) =>
    Math.sin((tgt * 3 + s) * 0.7) * Math.sin((tgt + 1) * 2.1)
  );
  return softmax(raw.map((v) => v * sharpness));
}

function monotonicWeights(tgt: number, sharpness: number): number[] {
  const raw = SRC_TOKENS.map((_, s) => {
    const dist = s - tgt;
    return -(dist * dist) * sharpness;
  });
  return softmax(raw);
}

export function AlignmentGrid() {
  const [tgtStep, setTgtStep] = useState(0);
  const [monotonic, setMonotonic] = useState(false);
  const [sharpness, setSharpness] = useState(2.0);

  const weights = useMemo(() => {
    return monotonic
      ? monotonicWeights(tgtStep, sharpness)
      : learnedWeights(tgtStep, sharpness);
  }, [tgtStep, monotonic, sharpness]);

  return (
    <div className="my-4 p-4 border rounded-lg bg-white">
      <div className="flex gap-4 items-center mb-3 flex-wrap">
        <label className="text-sm">
          Target step:
          <select
            aria-label="target step"
            className="ml-2 border rounded"
            value={tgtStep}
            onChange={(e) => setTgtStep(+e.target.value)}
          >
            {Array.from({ length: NUM_TGT }, (_, i) => (
              <option key={i} value={i}>
                t={i}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm flex items-center gap-1">
          <input
            type="checkbox"
            checked={monotonic}
            onChange={(e) => setMonotonic(e.target.checked)}
          />
          Monotonic alignment
        </label>

        <label className="text-sm">
          Sharpness (temperature⁻¹):
          <input
            aria-label="sharpness"
            type="range"
            min={0.5}
            max={5}
            step={0.1}
            value={sharpness}
            onChange={(e) => setSharpness(parseFloat(e.target.value))}
            className="mx-2"
          />
          <span className="font-mono">{sharpness.toFixed(1)}</span>
        </label>
      </div>

      <div className="flex gap-1 mt-2">
        {SRC_TOKENS.map((token, s) => {
          const w = weights[s];
          return (
            <div
              key={s}
              className="flex flex-col items-center gap-1"
              style={{ minWidth: "4.5rem" }}
            >
              <div
                className="w-16 h-12 flex items-center justify-center rounded text-sm font-mono border"
                style={{ background: `rgba(59,130,246,${w.toFixed(3)})` }}
                title={w.toFixed(4)}
              >
                {w.toFixed(2)}
              </div>
              <span className="text-xs text-neutral-700">{token}</span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-neutral-600">
        Target step <span className="font-mono font-semibold">t={tgtStep}</span>.
        Cell opacity and value show attention weight α over each source token.
        {monotonic
          ? " Monotonic mode: peak forced at src[t]."
          : " Learned mode: additive score seeded by Math.sin."}
      </p>
    </div>
  );
}
