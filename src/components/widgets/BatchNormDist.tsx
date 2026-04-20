import { useMemo, useState } from "react";

const NUM_BINS = 12;
const BIN_MIN = -4;
const BIN_MAX = 4;

function computeValues(batchSize: number, layer: number, applyBN: boolean): number[] {
  let values = Array.from({ length: batchSize }, (_, i) =>
    Math.sin((i + 1) * 0.97 + 1 * 0.31) * Math.sqrt(2)
  );

  for (let l = 2; l <= layer; l++) {
    values = values.map((v) => v * 1.1 + 0.2);
    if (applyBN) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
      const std = Math.sqrt(variance) + 1e-5;
      values = values.map((v) => (v - mean) / std);
    }
  }

  return values;
}

function binValues(values: number[]): number[] {
  const bins = new Array(NUM_BINS).fill(0);
  const range = BIN_MAX - BIN_MIN;
  for (const v of values) {
    const idx = Math.floor(((v - BIN_MIN) / range) * NUM_BINS);
    const clamped = Math.max(0, Math.min(NUM_BINS - 1, idx));
    bins[clamped]++;
  }
  return bins;
}

export function BatchNormDist() {
  const [layer, setLayer] = useState(1);
  const [batchSize, setBatchSize] = useState(32);
  const [applyBN, setApplyBN] = useState(false);

  const { bins, mean, variance } = useMemo(() => {
    const values = computeValues(batchSize, layer, applyBN);
    const m = values.reduce((a, b) => a + b, 0) / values.length;
    const v = values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length;
    return { bins: binValues(values), mean: m, variance: v };
  }, [layer, batchSize, applyBN]);

  const maxBin = Math.max(...bins, 1);

  return (
    <div className="my-4 p-4 border rounded-lg bg-white">
      <div className="flex gap-4 items-center mb-3 flex-wrap">
        <label className="text-sm">
          layer depth:
          <input
            aria-label="layer depth"
            type="range"
            min={1}
            max={10}
            value={layer}
            onChange={(e) => setLayer(+e.target.value)}
            className="mx-2"
          />
          <span className="font-mono">{layer}</span>
        </label>
        <label className="text-sm">
          batch size:
          <input
            aria-label="batch size"
            type="range"
            min={4}
            max={64}
            step={4}
            value={batchSize}
            onChange={(e) => setBatchSize(+e.target.value)}
            className="mx-2"
          />
          <span className="font-mono">{batchSize}</span>
        </label>
        <label className="text-sm flex items-center gap-1">
          <input
            type="checkbox"
            checked={applyBN}
            onChange={(e) => setApplyBN(e.target.checked)}
          />
          Apply BatchNorm
        </label>
      </div>

      <div className="flex items-end gap-1 h-24 mb-3">
        {bins.map((count, i) => {
          const heightPct = Math.max(2, Math.round((count / maxBin) * 88));
          return (
            <div
              key={i}
              role="presentation"
              className="flex-1 bg-blue-400 rounded-t"
              style={{ height: `${heightPct}px` }}
            />
          );
        })}
      </div>

      <div className="flex gap-6 text-sm text-neutral-700">
        <span>
          mean: <span className="font-mono">{mean.toFixed(3)}</span>
        </span>
        <span>
          variance: <span className="font-mono">{variance.toFixed(3)}</span>
        </span>
      </div>
    </div>
  );
}
