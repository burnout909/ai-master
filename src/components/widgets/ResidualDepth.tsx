import { useState, useMemo } from "react";

const DEPTH_MIN = 2;
const DEPTH_MAX = 50;
const SVG_W = 260;
const SVG_H = 90;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 8;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function plainAcc(depth: number): number {
  return clamp(
    0.92 - 0.015 * Math.max(0, depth - 18) + 0.002 * Math.sin(depth * 1.3),
    0.5,
    0.99
  );
}

function residualAcc(depth: number): number {
  return clamp(
    0.88 + 0.001 * depth + 0.002 * Math.sin(depth * 1.7),
    0.5,
    0.99
  );
}

function depthToX(depth: number): number {
  return PAD_L + ((depth - DEPTH_MIN) / (DEPTH_MAX - DEPTH_MIN)) * (SVG_W - PAD_L - PAD_R);
}

function accToY(acc: number): number {
  // acc in [0.5, 0.99] maps to [H-PAD_B, PAD_T]
  return PAD_T + ((0.99 - acc) / (0.99 - 0.5)) * (SVG_H - PAD_T - PAD_B);
}

function buildPolyline(fn: (d: number) => number): string {
  const pts: string[] = [];
  for (let d = DEPTH_MIN; d <= DEPTH_MAX; d++) {
    pts.push(`${depthToX(d).toFixed(1)},${accToY(fn(d)).toFixed(1)}`);
  }
  return pts.join(" ");
}

export function ResidualDepth() {
  const [depth, setDepth] = useState(18);
  const [useSkip, setUseSkip] = useState(false);

  const plain = useMemo(() => plainAcc(depth), [depth]);
  const residual = useMemo(() => residualAcc(depth), [depth]);

  const plainPoly = useMemo(() => buildPolyline(plainAcc), []);
  const residualPoly = useMemo(() => buildPolyline(residualAcc), []);

  const markerX = depthToX(depth).toFixed(1);

  return (
    <div className="my-4 p-4 border rounded-lg bg-white">
      <div className="flex flex-col gap-3">
        {/* Slider */}
        <label className="text-sm flex items-center gap-2">
          <span className="w-16 shrink-0">depth:</span>
          <input
            aria-label="depth"
            type="range"
            min={DEPTH_MIN}
            max={DEPTH_MAX}
            step={1}
            value={depth}
            onChange={(e) => setDepth(parseInt(e.target.value, 10))}
            className="flex-1"
          />
          <span className="font-mono w-6 text-right">{depth}</span>
        </label>

        {/* Checkbox */}
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={useSkip}
            onChange={(e) => setUseSkip(e.target.checked)}
          />
          Use skip connection
        </label>

        {/* Accuracy values */}
        <div className="flex gap-6 text-sm font-mono">
          <span>
            <span className="text-red-500 font-semibold">train_acc_plain: </span>
            {plain.toFixed(4)}
          </span>
          <span>
            <span className="text-blue-500 font-semibold">train_acc_residual: </span>
            {residual.toFixed(4)}
          </span>
        </div>

        {/* SVG Plot */}
        <svg
          width={SVG_W}
          height={SVG_H}
          className="border border-neutral-200 rounded bg-neutral-50"
        >
          {/* Axes labels */}
          <text x={PAD_L} y={SVG_H - 1} fontSize={7} fill="#999">depth 2→50</text>

          {/* Plain curve */}
          <polyline
            points={plainPoly}
            fill="none"
            stroke="#ef4444"
            strokeWidth={1.5}
          />

          {/* Residual curve */}
          <polyline
            points={residualPoly}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeDasharray={useSkip ? "none" : "4 2"}
          />

          {/* Vertical marker */}
          <line
            x1={markerX}
            x2={markerX}
            y1={PAD_T}
            y2={SVG_H - PAD_B}
            stroke="#6b7280"
            strokeWidth={1}
            strokeDasharray="2 2"
          />

          {/* Dots at current depth */}
          <circle cx={markerX} cy={accToY(plain).toFixed(1)} r={3} fill="#ef4444" />
          <circle cx={markerX} cy={accToY(residual).toFixed(1)} r={3} fill="#3b82f6" />
        </svg>

        <div className="flex gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-red-400" /> Plain
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-blue-400" /> Residual
          </span>
        </div>
      </div>
    </div>
  );
}
