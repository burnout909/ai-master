import { useMemo, useState } from "react";

type TargetMode = "Gaussian" | "BiModal";

const N = 20;
const SVG_W = 340;
const SVG_H = 50;
const X_MIN = -4;
const X_MAX = 4;

function xScale(x: number): number {
  return ((x - X_MIN) / (X_MAX - X_MIN)) * SVG_W;
}

function initParticles() {
  const x0: number[] = [];
  for (let i = 0; i < N; i++) {
    x0.push(Math.sin((i + 1) * 0.73) * 1.5);
  }
  return x0;
}

function targetParticles(mode: TargetMode): number[] {
  const x1: number[] = [];
  for (let i = 0; i < N; i++) {
    if (mode === "Gaussian") {
      x1.push(2 + Math.sin((i + 1) * 0.73) * 0.5);
    } else {
      x1.push((i % 2 === 0 ? -2 : 2) + Math.sin((i + 1) * 0.73) * 0.3);
    }
  }
  return x1;
}

export function FlowField() {
  const [t, setT] = useState(0);
  const [mode, setMode] = useState<TargetMode>("Gaussian");

  const x0 = useMemo(() => initParticles(), []);
  const x1 = useMemo(() => targetParticles(mode), [mode]);

  const positions = useMemo(
    () => x0.map((xi, i) => (1 - t) * xi + t * x1[i]),
    [x0, x1, t]
  );

  const mean = useMemo(
    () => positions.reduce((s, v) => s + v, 0) / N,
    [positions]
  );

  const variance = useMemo(() => {
    const m = mean;
    return positions.reduce((s, v) => s + (v - m) ** 2, 0) / N;
  }, [positions, mean]);

  const midY = SVG_H / 2;
  const tickH = 8;

  return (
    <div className="my-4 p-4 border rounded-lg">
      <div className="flex items-center gap-4 flex-wrap mb-3">
        <label>
          Time t:
          <input
            type="range"
            aria-label="time"
            min={0}
            max={1}
            step={0.05}
            value={t}
            onChange={(e) => setT(parseFloat(e.target.value))}
            className="mx-2"
          />
          <span className="font-mono">{t.toFixed(2)}</span>
        </label>
        <label>
          Target mode:
          <select
            aria-label="target mode"
            className="ml-2 border rounded"
            value={mode}
            onChange={(e) => setMode(e.target.value as TargetMode)}
          >
            <option value="Gaussian">Gaussian</option>
            <option value="BiModal">BiModal</option>
          </select>
        </label>
      </div>

      <svg width={SVG_W} height={SVG_H} className="border bg-neutral-50">
        {/* Baseline */}
        <line
          x1={0}
          y1={midY}
          x2={SVG_W}
          y2={midY}
          stroke="#aaa"
          strokeWidth={1}
        />
        {/* Ticks at 0 and ±2 */}
        {[0, -2, 2].map((val) => (
          <line
            key={val}
            x1={xScale(val)}
            y1={midY - tickH / 2}
            x2={xScale(val)}
            y2={midY + tickH / 2}
            stroke="#888"
            strokeWidth={1}
          />
        ))}
        {/* Particles */}
        {positions.map((px, i) => (
          <circle
            key={i}
            cx={xScale(px)}
            cy={midY}
            r={4}
            fill="#3b82f6"
            opacity={0.75}
          />
        ))}
      </svg>

      <p className="text-xs text-neutral-600 mt-2">
        Mean: <span className="font-mono">{mean.toFixed(3)}</span>
        {"  "}Variance: <span className="font-mono">{variance.toFixed(3)}</span>
      </p>
    </div>
  );
}
