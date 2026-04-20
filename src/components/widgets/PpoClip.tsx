import { useState } from "react";

function computeClip(r: number, A: number, eps: number) {
  const unclipped = r * A;
  const rClipped = Math.min(Math.max(r, 1 - eps), 1 + eps);
  const clipped = Math.min(r * A, rClipped * A);

  let regime: string;
  if (r >= 1 - eps && r <= 1 + eps) {
    regime = "no clip";
  } else if (r > 1 + eps && A > 0) {
    regime = "clipped (upper, A>0)";
  } else if (r < 1 - eps && A < 0) {
    regime = "clipped (lower, A<0)";
  } else {
    regime = "no clip (unfavorable side)";
  }

  return { unclipped, clipped, regime };
}

function fmt(n: number): string {
  return n.toFixed(4);
}

export function PpoClip() {
  const [ratio, setRatio] = useState(1.0);
  const [advantage, setAdvantage] = useState(1.0);
  const [epsilon, setEpsilon] = useState(0.2);

  const { unclipped, clipped, regime } = computeClip(ratio, advantage, epsilon);

  const lowerBound = 1 - epsilon;
  const upperBound = 1 + epsilon;

  const regimeColor =
    regime === "no clip"
      ? "text-green-600"
      : regime.startsWith("clipped")
      ? "text-red-600"
      : "text-amber-600";

  return (
    <div className="my-4 p-4 border rounded-lg bg-white">
      <div className="flex flex-col gap-3">
        {/* Controls */}
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <span className="w-24 text-right">ratio r:</span>
            <input
              aria-label="ratio"
              type="range"
              min={0.1}
              max={3.0}
              step={0.05}
              value={ratio}
              onChange={(e) => setRatio(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono w-10">{ratio.toFixed(2)}</span>
          </label>

          <label className="flex items-center gap-2">
            <span className="w-24 text-right">advantage A:</span>
            <input
              aria-label="advantage"
              type="range"
              min={-2}
              max={2}
              step={0.1}
              value={advantage}
              onChange={(e) => setAdvantage(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono w-10">{advantage.toFixed(1)}</span>
          </label>

          <label className="flex items-center gap-2">
            <span className="w-24 text-right">epsilon ε:</span>
            <input
              aria-label="epsilon"
              type="range"
              min={0.05}
              max={0.5}
              step={0.01}
              value={epsilon}
              onChange={(e) => setEpsilon(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono w-10">{epsilon.toFixed(2)}</span>
          </label>
        </div>

        {/* Values */}
        <div className="grid grid-cols-3 gap-2 text-sm font-mono bg-neutral-50 p-3 rounded">
          <div>
            <span className="text-neutral-500">unclipped</span>
            <div className="font-semibold">{fmt(unclipped)}</div>
            <div className="text-xs text-neutral-400">r × A</div>
          </div>
          <div>
            <span className="text-neutral-500">clipped</span>
            <div className="font-semibold text-blue-600">{fmt(clipped)}</div>
            <div className="text-xs text-neutral-400">L_CLIP</div>
          </div>
          <div>
            <span className="text-neutral-500">clip range</span>
            <div className="font-semibold">
              [{lowerBound.toFixed(2)}, {upperBound.toFixed(2)}]
            </div>
          </div>
        </div>

        {/* Regime */}
        <div className="text-sm bg-neutral-50 p-3 rounded">
          <span className="text-neutral-500">Regime: </span>
          <span className={`font-semibold ${regimeColor}`}>{regime}</span>
        </div>

        {/* Visual number line */}
        <div aria-label="ratio number line" className="relative h-10 mx-2">
          <div className="absolute top-4 left-0 right-0 h-1 bg-neutral-200 rounded" />
          {/* clip zone */}
          <div
            className="absolute top-4 h-1 bg-green-200"
            style={{
              left: `${((lowerBound - 0.1) / 2.9) * 100}%`,
              width: `${((upperBound - lowerBound) / 2.9) * 100}%`,
            }}
          />
          {/* ratio marker */}
          <div
            className="absolute top-2 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow -translate-x-1/2"
            style={{ left: `${((ratio - 0.1) / 2.9) * 100}%` }}
          />
          {/* lower bound marker */}
          <div
            className="absolute top-0 text-xs text-neutral-500 -translate-x-1/2"
            style={{ left: `${((lowerBound - 0.1) / 2.9) * 100}%` }}
          >
            {lowerBound.toFixed(2)}
          </div>
          {/* upper bound marker */}
          <div
            className="absolute top-0 text-xs text-neutral-500 -translate-x-1/2"
            style={{ left: `${((upperBound - 0.1) / 2.9) * 100}%` }}
          >
            {upperBound.toFixed(2)}
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          Green zone = clip range [1−ε, 1+ε] · Blue dot = current r · L_CLIP =
          min(r·A, clip(r, 1−ε, 1+ε)·A)
        </p>
      </div>
    </div>
  );
}
