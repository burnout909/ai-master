import { useState } from "react";

const BASELINE_ACCURACY = 0.55;
const W = 260;
const H = 90;
const STEPS = 200;

function accuracy(t: number): number {
  const raw =
    0.2 +
    0.55 / (1 + Math.exp(-(t - 100) / 25)) +
    0.01 * Math.sin(t * 0.07);
  return Math.min(1, Math.max(0, raw));
}

function avgLength(t: number): number {
  return 400 + 600 * (t / 200) + 80 * Math.sin(t * 0.12);
}

function ahaCount(t: number): number {
  return Math.floor(t / 40);
}

function buildAccuracyPath(): string {
  const points: string[] = [];
  for (let t = 0; t <= STEPS; t++) {
    const x = (t / STEPS) * W;
    const y = H - accuracy(t) * H;
    points.push(`${t === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(" ");
}

const ACCURACY_PATH = buildAccuracyPath();

export function RlRewardCurve() {
  const [step, setStep] = useState(0);
  const [showBaseline, setShowBaseline] = useState(false);

  const acc = accuracy(step);
  const len = avgLength(step);
  const aha = ahaCount(step);

  const markerX = (step / STEPS) * W;
  const markerY = H - acc * H;

  const baselineY = H - BASELINE_ACCURACY * H;

  return (
    <div className="my-4 p-4 border rounded-lg bg-white">
      <div className="flex flex-col gap-3">
        {/* Slider */}
        <label className="flex items-center gap-2 text-sm">
          <span className="w-32 text-right">training step:</span>
          <input
            aria-label="training step"
            type="range"
            min={0}
            max={200}
            step={1}
            value={step}
            onChange={(e) => setStep(parseInt(e.target.value, 10))}
            className="flex-1"
          />
          <span className="font-mono w-8">{step}</span>
        </label>

        {/* Checkbox */}
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            aria-label="Show supervised baseline"
            type="checkbox"
            checked={showBaseline}
            onChange={(e) => setShowBaseline(e.target.checked)}
          />
          <span>Show supervised baseline</span>
        </label>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 text-sm font-mono bg-neutral-50 p-3 rounded">
          <div>
            <div className="text-neutral-500 text-xs">accuracy</div>
            <div className="font-semibold text-blue-600">
              {(acc * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs">avg length</div>
            <div className="font-semibold">{Math.round(len)} tok</div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs">aha moments</div>
            <div className="font-semibold text-amber-600">{aha}</div>
          </div>
        </div>

        {/* SVG chart */}
        <svg
          width={W}
          height={H}
          aria-label="accuracy curve"
          className="border border-neutral-100 rounded bg-neutral-50"
        >
          {/* Accuracy curve */}
          <path
            d={ACCURACY_PATH}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={1.5}
          />

          {/* Baseline overlay */}
          {showBaseline && (
            <line
              x1={0}
              y1={baselineY}
              x2={W}
              y2={baselineY}
              stroke="#f97316"
              strokeWidth={1.5}
              strokeDasharray="6 3"
            />
          )}

          {/* Red marker at current step */}
          <circle cx={markerX} cy={markerY} r={4} fill="#ef4444" />
        </svg>

        <p className="text-xs text-neutral-500">
          Blue curve = GRPO accuracy · Red dot = current step
          {showBaseline ? " · Orange dashed = SFT baseline (55%)" : ""}
        </p>
      </div>
    </div>
  );
}
