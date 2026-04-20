import { useMemo, useState } from "react";

const RAW_LOGITS = [2.5, 1.8, 1.2, 0.9, 0.4, -0.3];
const TOKENS = ["the", "a", "my", "any", "each", "some"];

function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function applyTemperatureAndTopK(raw: number[], temperature: number, topK: number) {
  const logitsT = raw.map((l) => l / temperature);
  const probs = softmax(logitsT);

  // Find top-k indices
  const indexed = probs.map((p, i) => ({ p, i }));
  indexed.sort((a, b) => b.p - a.p);
  const topKIndices = new Set(indexed.slice(0, topK).map((x) => x.i));

  // Zero out non-top-k, renormalize
  const masked = probs.map((p, i) => (topKIndices.has(i) ? p : 0));
  const maskedSum = masked.reduce((a, b) => a + b, 0);
  const final = masked.map((p) => (maskedSum > 0 ? p / maskedSum : 0));

  return { final, topKIndices };
}

function entropy(probs: number[]): number {
  return -probs.reduce((sum, p) => (p > 0 ? sum + p * Math.log2(p) : sum), 0);
}

export function TemperatureSampler() {
  const [temperature, setTemperature] = useState(1.0);
  const [topK, setTopK] = useState(6);

  const { final, topKIndices } = useMemo(
    () => applyTemperatureAndTopK(RAW_LOGITS, temperature, topK),
    [temperature, topK]
  );

  const ent = useMemo(() => entropy(final), [final]);
  const maxProb = Math.max(...final);

  return (
    <div className="my-4 p-4 border rounded-lg space-y-4">
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Temperature:</span>
          <input
            type="range"
            aria-label="temperature"
            min={0.1}
            max={2.0}
            step={0.05}
            value={temperature}
            onChange={(e) => setTemperature(+e.target.value)}
            className="w-32"
          />
          <span className="font-mono text-sm w-8">{temperature.toFixed(2)}</span>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Top k:</span>
          <input
            type="range"
            aria-label="top k"
            min={1}
            max={6}
            step={1}
            value={topK}
            onChange={(e) => setTopK(+e.target.value)}
            className="w-24"
          />
          <span className="font-mono text-sm w-4">{topK}</span>
        </label>
      </div>

      <div className="space-y-1">
        {TOKENS.map((token, i) => {
          const p = final[i];
          const inTopK = topKIndices.has(i);
          const barWidth = maxProb > 0 ? (p / maxProb) * 100 : 0;
          return (
            <div
              key={token}
              className={`flex items-center gap-2 ${inTopK ? "" : "opacity-30"}`}
            >
              <span className="font-mono text-sm w-10 text-right">{token}</span>
              <div className="flex-1 bg-neutral-100 rounded h-5 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded transition-all duration-150"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="font-mono text-xs w-14 text-right">
                {(p * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-neutral-600">
        Entropy:{" "}
        <span className="font-mono font-semibold">{ent.toFixed(3)}</span> bits
      </p>
    </div>
  );
}
