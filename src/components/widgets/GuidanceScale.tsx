import { useState, useMemo } from "react";

const N = 120;
const X_MIN = -5;
const X_MAX = 7;

function linspace(min: number, max: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => min + (i / (n - 1)) * (max - min));
}

function logNormal(x: number, mu: number, sigma: number): number {
  const diff = x - mu;
  return -0.5 * (diff / sigma) ** 2 - Math.log(sigma);
}

function computeCurves(w: number) {
  const xs = linspace(X_MIN, X_MAX, N);

  const logCond = xs.map((x) => logNormal(x, 2, 1));
  const logUncond = xs.map((x) => logNormal(x, 0, 2));
  const logGuided = xs.map((_, i) => (1 + w) * logCond[i] - w * logUncond[i]);

  // Exponentiate and renormalize
  const maxLog = Math.max(...logGuided);
  const raw = logGuided.map((v) => Math.exp(v - maxLog));
  const dx = (X_MAX - X_MIN) / (N - 1);
  const sum = raw.reduce((a, b) => a + b, 0) * dx;
  const guided = raw.map((v) => v / sum);

  const maxLogCond = Math.max(...logCond);
  const rawCond = logCond.map((v) => Math.exp(v - maxLogCond));
  const sumCond = rawCond.reduce((a, b) => a + b, 0) * dx;
  const cond = rawCond.map((v) => v / sumCond);

  const maxLogUncond = Math.max(...logUncond);
  const rawUncond = logUncond.map((v) => Math.exp(v - maxLogUncond));
  const sumUncond = rawUncond.reduce((a, b) => a + b, 0) * dx;
  const uncond = rawUncond.map((v) => v / sumUncond);

  return { xs, guided, cond, uncond };
}

function modeX(xs: number[], density: number[]): number {
  let maxIdx = 0;
  for (let i = 1; i < density.length; i++) {
    if (density[i] > density[maxIdx]) maxIdx = i;
  }
  return xs[maxIdx];
}

function sharpness(xs: number[], density: number[]): number {
  const dx = (X_MAX - X_MIN) / (N - 1);
  const mean = xs.reduce((s, x, i) => s + x * density[i] * dx, 0);
  const variance = xs.reduce((s, x, i) => s + (x - mean) ** 2 * density[i] * dx, 0);
  return variance > 0 ? 1 / Math.sqrt(variance) : 0;
}

const SVG_W = 340;
const SVG_H = 110;
const PAD = { top: 8, right: 8, bottom: 8, left: 8 };

function toSvgPath(xs: number[], ys: number[]): string {
  const xScale = (x: number) =>
    PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * (SVG_W - PAD.left - PAD.right);
  const maxY = Math.max(...ys);
  const yScale = (y: number) =>
    SVG_H - PAD.bottom - (y / maxY) * (SVG_H - PAD.top - PAD.bottom);

  return xs
    .map((x, i) => `${i === 0 ? "M" : "L"}${xScale(x).toFixed(2)},${yScale(ys[i]).toFixed(2)}`)
    .join(" ");
}

export function GuidanceScale() {
  const [w, setW] = useState(1);
  const [showBoth, setShowBoth] = useState(false);

  const { xs, guided, cond, uncond } = useMemo(() => computeCurves(w), [w]);

  const mx = modeX(xs, guided).toFixed(2);
  const sharp = sharpness(xs, guided).toFixed(3);

  const guidedPath = toSvgPath(xs, guided);
  const condPath = toSvgPath(xs, cond);
  const uncondPath = toSvgPath(xs, uncond);

  return (
    <div className="my-4 p-4 border rounded-lg bg-white max-w-lg">
      <h3 className="font-semibold text-base mb-3">Classifier-Free Guidance</h3>

      {/* Slider */}
      <label className="flex items-center gap-3 text-sm mb-3">
        <span className="shrink-0">Guidance scale:</span>
        <input
          type="range"
          min={0}
          max={15}
          step={0.25}
          value={w}
          onChange={(e) => setW(Number(e.target.value))}
          aria-label="guidance scale"
          className="flex-1"
        />
        <span className="font-mono w-10 text-right">{w.toFixed(2)}</span>
      </label>

      {/* Toggle */}
      <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={showBoth}
          onChange={(e) => setShowBoth(e.target.checked)}
          aria-label="Show both source distributions"
        />
        <span>Show both source distributions</span>
      </label>

      {/* SVG plot */}
      <svg
        width={SVG_W}
        height={SVG_H}
        className="block rounded border border-neutral-100 bg-neutral-50"
        role="img"
        aria-label="guided density plot"
      >
        {showBoth && (
          <>
            <path d={uncondPath} fill="none" stroke="#9ca3af" strokeWidth={1.5} opacity={0.7} />
            <path d={condPath} fill="none" stroke="#3b82f6" strokeWidth={1.5} opacity={0.7} />
          </>
        )}
        <path d={guidedPath} fill="none" stroke="#f97316" strokeWidth={2} />
      </svg>

      {/* Stats */}
      <div className="mt-2 flex gap-6 text-sm">
        <span>
          <span className="text-neutral-500">mode x: </span>
          <span className="font-mono font-semibold">{mx}</span>
        </span>
        <span>
          <span className="text-neutral-500">sharpness: </span>
          <span className="font-mono font-semibold">{sharp}</span>
        </span>
      </div>

      {showBoth && (
        <p className="mt-1 text-xs text-neutral-400">
          Grey = unconditional N(0,2) · Blue = conditional N(2,1) · Orange = CFG guided (w={w})
        </p>
      )}
    </div>
  );
}

export default GuidanceScale;
