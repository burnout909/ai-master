import { useMemo, useState } from "react";

type Task = "Translation" | "Arithmetic" | "TriviaQA" | "WordScramble";

const TASKS: Task[] = ["Translation", "Arithmetic", "TriviaQA", "WordScramble"];

const BASE: Record<Task, number> = {
  Translation: 0.15,
  Arithmetic: 0.05,
  TriviaQA: 0.10,
  WordScramble: 0.04,
};

const SLOPE: Record<Task, number> = {
  Translation: 0.10,
  Arithmetic: 0.22,
  TriviaQA: 0.12,
  WordScramble: 0.20,
};

function clip(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function computeAcc(task: Task, log10p: number, shots: number): number {
  const base = BASE[task];
  const slope = SLOPE[task];
  const shots_boost = shots * 0.05 * Math.max(0, log10p - 9.5);
  return clip(
    base + slope * (log10p - 8.0) + shots_boost + 0.01 * Math.sin(log10p * 3 + shots),
    0,
    1
  );
}

const LOG10P_MIN = 8.0;
const LOG10P_MAX = 11.25;
const LOG10P_STEP = 0.05;

const SVG_W = 300;
const SVG_H = 100;
const PAD_L = 4;
const PAD_R = 4;
const PAD_T = 6;
const PAD_B = 6;

function buildSparklinePath(task: Task, shots: number): string {
  const steps: number[] = [];
  for (let v = LOG10P_MIN; v <= LOG10P_MAX + 1e-9; v += LOG10P_STEP) {
    steps.push(Math.round(v * 1000) / 1000);
  }

  const innerW = SVG_W - PAD_L - PAD_R;
  const innerH = SVG_H - PAD_T - PAD_B;

  const points = steps.map((lp) => {
    const x = PAD_L + ((lp - LOG10P_MIN) / (LOG10P_MAX - LOG10P_MIN)) * innerW;
    const acc = computeAcc(task, lp, shots);
    const y = PAD_T + (1 - acc) * innerH;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return "M" + points.join(" L");
}

export function FewShotScale() {
  const [task, setTask] = useState<Task>("Translation");
  const [shots, setShots] = useState(0);
  const [log10p, setLog10p] = useState(9.0);

  const acc = useMemo(() => computeAcc(task, log10p, shots), [task, log10p, shots]);
  const sparkPath = useMemo(() => buildSparklinePath(task, shots), [task, shots]);

  const innerW = SVG_W - PAD_L - PAD_R;
  const innerH = SVG_H - PAD_T - PAD_B;
  const markerX = PAD_L + ((log10p - LOG10P_MIN) / (LOG10P_MAX - LOG10P_MIN)) * innerW;
  const markerY = PAD_T + (1 - acc) * innerH;

  return (
    <div className="my-4 p-4 border rounded-lg space-y-4">
      <div className="flex flex-wrap gap-6 items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Task:</span>
          <select
            aria-label="task"
            value={task}
            onChange={(e) => setTask(e.target.value as Task)}
            className="border rounded px-2 py-1 text-sm"
          >
            {TASKS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Shots:</span>
          <input
            type="range"
            aria-label="shots"
            min={0}
            max={5}
            step={1}
            value={shots}
            onChange={(e) => setShots(+e.target.value)}
            className="w-28"
          />
          <span className="font-mono text-sm w-4">{shots}</span>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">log₁₀(params):</span>
          <input
            type="range"
            aria-label="log10 params"
            min={LOG10P_MIN}
            max={LOG10P_MAX}
            step={LOG10P_STEP}
            value={log10p}
            onChange={(e) => setLog10p(+e.target.value)}
            className="w-36"
          />
          <span className="font-mono text-sm w-10">{log10p.toFixed(2)}</span>
        </label>
      </div>

      <p className="text-lg font-semibold">
        Accuracy:{" "}
        <span className="font-mono text-blue-600">{(acc * 100).toFixed(1)}%</span>
      </p>

      <svg
        width={SVG_W}
        height={SVG_H}
        className="block rounded bg-neutral-50 border"
        aria-label="accuracy sparkline"
      >
        {/* axes */}
        <line
          x1={PAD_L}
          y1={PAD_T + innerH}
          x2={PAD_L + innerW}
          y2={PAD_T + innerH}
          stroke="#d1d5db"
          strokeWidth={1}
        />
        {/* sparkline */}
        <path d={sparkPath} fill="none" stroke="#3b82f6" strokeWidth={2} />
        {/* marker */}
        <circle cx={markerX} cy={markerY} r={4} fill="#ef4444" />
      </svg>

      <p className="text-xs text-neutral-500">
        x-axis: log₁₀(parameters) [8 → 11.25] &nbsp;|&nbsp; y-axis: accuracy &nbsp;|&nbsp;
        red dot = current setting
      </p>
    </div>
  );
}
