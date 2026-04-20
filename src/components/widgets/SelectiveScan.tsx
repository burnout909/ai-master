import { useMemo, useState } from "react";

const SEQ_LEN = 16;

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function computeSequence(selective: boolean): {
  h: number[];
  A: number[];
  B: number[];
  x: number[];
} {
  const h: number[] = [];
  const A: number[] = [];
  const B: number[] = [];
  const x: number[] = [];

  let hPrev = 0;
  for (let t = 0; t < SEQ_LEN; t++) {
    const xt = Math.sin(t * 0.8);
    const At = selective ? 0.95 * sigmoid(2 * xt) : 0.8;
    const Bt = selective ? sigmoid(1 + xt) : 1.0;
    const ht = At * hPrev + Bt * xt;

    x.push(xt);
    A.push(At);
    B.push(Bt);
    h.push(ht);
    hPrev = ht;
  }

  return { h, A, B, x };
}

export function SelectiveScan() {
  const [selective, setSelective] = useState(false);
  const [step, setStep] = useState(0);

  const { h, A } = useMemo(() => computeSequence(selective), [selective]);

  // Determine bar chart scale
  const maxAbs = useMemo(() => Math.max(...h.map(Math.abs), 0.01), [h]);

  const modeLabel = selective ? "Mode: Mamba (selective)" : "Mode: Plain SSM";

  return (
    <div className="my-4 p-4 border rounded-lg">
      {/* Controls */}
      <div className="flex items-center gap-6 flex-wrap mb-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            aria-label="Selective (Mamba)"
            checked={selective}
            onChange={(e) => setSelective(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Selective (Mamba)</span>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm">Step:</span>
          <input
            type="range"
            aria-label="step"
            min={0}
            max={SEQ_LEN - 1}
            step={1}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="w-40"
          />
          <span className="text-sm font-mono w-4 text-right">{step}</span>
        </label>
      </div>

      {/* Bar chart */}
      <div className="mb-4">
        <p className="text-xs text-neutral-500 mb-1">h_t across 16 steps</p>
        <div className="flex items-end gap-0.5 h-24">
          {h.map((ht, t) => {
            const pct = Math.abs(ht) / maxAbs;
            const barH = Math.round(pct * 88);
            const isHighlighted = t === step;
            const isNeg = ht < 0;
            return (
              <div
                key={t}
                className="flex-1 flex flex-col items-center justify-center"
                title={`t=${t}, h=${ht.toFixed(3)}`}
              >
                <div
                  className="w-full"
                  style={{
                    height: `${barH}px`,
                    backgroundColor: isHighlighted
                      ? "#6366f1"
                      : isNeg
                        ? "#f87171"
                        : "#34d399",
                    transition: "height 0.15s ease",
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-neutral-400 mt-0.5">
          <span>t=0</span>
          <span>t=15</span>
        </div>
      </div>

      {/* Numeric readout */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div className="p-3 bg-indigo-50 rounded border border-indigo-200">
          <p className="text-xs text-neutral-500 mb-1">h at step {step}</p>
          <p className="font-mono text-lg font-semibold text-indigo-700">
            {h[step].toFixed(4)}
          </p>
        </div>

        <div className="p-3 bg-amber-50 rounded border border-amber-200">
          <p className="text-xs text-neutral-500 mb-1">A_t at step {step}</p>
          <p className="font-mono text-lg font-semibold text-amber-700">
            {A[step].toFixed(4)}
          </p>
        </div>
      </div>

      {/* Mode label */}
      <p className="text-sm font-medium text-neutral-600">{modeLabel}</p>

      <p className="text-xs text-neutral-400 mt-2">
        h_t = A_t · h_&#123;t-1&#125; + B_t · x_t &nbsp;|&nbsp; x_t = sin(t × 0.8)
      </p>
    </div>
  );
}
