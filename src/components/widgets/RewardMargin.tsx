import { useState } from "react";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function RewardMargin() {
  const [rA, setRA] = useState(1.0);
  const [rB, setRB] = useState(0.0);
  const [temperature, setTemperature] = useState(1.0);

  const margin = rA - rB;
  const pAB = sigmoid(margin / temperature);
  const pABPct = pAB * 100;
  const logLoss = -Math.log(pAB);

  return (
    <div className="my-4 p-4 border rounded-lg bg-white">
      <div className="flex flex-col gap-3">
        {/* Sliders */}
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <span className="w-28 text-right">reward A:</span>
            <input
              aria-label="reward A"
              type="range"
              min={-3}
              max={3}
              step={0.1}
              value={rA}
              onChange={(e) => setRA(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono w-10">{rA.toFixed(1)}</span>
          </label>

          <label className="flex items-center gap-2">
            <span className="w-28 text-right">reward B:</span>
            <input
              aria-label="reward B"
              type="range"
              min={-3}
              max={3}
              step={0.1}
              value={rB}
              onChange={(e) => setRB(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono w-10">{rB.toFixed(1)}</span>
          </label>

          <label className="flex items-center gap-2">
            <span className="w-28 text-right">temperature T:</span>
            <input
              aria-label="temperature"
              type="range"
              min={0.1}
              max={3}
              step={0.05}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono w-10">{temperature.toFixed(2)}</span>
          </label>
        </div>

        {/* Computed values */}
        <div className="grid grid-cols-2 gap-2 text-sm font-mono bg-neutral-50 p-3 rounded">
          <div>
            <span className="text-neutral-500">margin (r_A − r_B)</span>
            <div className="font-semibold">{margin.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-neutral-500">p(A &gt; B)</span>
            <div className="font-semibold text-blue-600">{pABPct.toFixed(2)}%</div>
          </div>
        </div>

        {/* Preference bar */}
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex justify-between text-neutral-500">
            <span>A</span>
            <span>B</span>
          </div>
          <div
            style={{ width: "260px", height: "12px" }}
            className="flex rounded overflow-hidden border border-neutral-200"
            aria-label="preference bar"
          >
            <div
              style={{ width: `${pABPct}%` }}
              className="bg-blue-500"
            />
            <div
              style={{ width: `${100 - pABPct}%` }}
              className="bg-neutral-300"
            />
          </div>
        </div>

        {/* Log loss */}
        <div className="text-sm bg-neutral-50 p-3 rounded">
          <span className="text-neutral-500">
            RM log-loss for labelled &apos;A preferred&apos; = −log p(A&gt;B)
          </span>
          <div className="font-mono font-semibold mt-1">{logLoss.toFixed(4)}</div>
        </div>
      </div>
    </div>
  );
}
