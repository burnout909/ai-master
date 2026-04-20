import { useState } from "react";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function computeDpo(logrW: number, logrL: number, beta: number) {
  const margin = logrW - logrL;
  const implicitRewardGap = beta * margin;
  const loss = -Math.log(sigmoid(implicitRewardGap));
  return { margin, implicitRewardGap, loss };
}

function fmt(n: number): string {
  return n.toFixed(4);
}

function buildSparkline(beta: number, currentMargin: number): string {
  const W = 260;
  const H = 60;
  const marginMin = -3;
  const marginMax = 3;
  const steps = 80;

  // compute loss values
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const m = marginMin + (i / steps) * (marginMax - marginMin);
    const loss = -Math.log(sigmoid(beta * m));
    points.push([m, loss]);
  }

  const losses = points.map((p) => p[1]);
  const lossMin = Math.min(...losses);
  const lossMax = Math.max(...losses);
  const lossRange = lossMax - lossMin || 1;

  const toX = (m: number) => ((m - marginMin) / (marginMax - marginMin)) * W;
  const toY = (l: number) => H - ((l - lossMin) / lossRange) * (H - 8) - 4;

  const pathData = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p[0]).toFixed(1)} ${toY(p[1]).toFixed(1)}`)
    .join(" ");

  const mx = toX(currentMargin);
  const my = toY(-Math.log(sigmoid(beta * currentMargin)));

  return JSON.stringify({ pathData, mx, my, W, H });
}

export function DpoLoss() {
  const [logrW, setLogrW] = useState(1.0);
  const [logrL, setLogrL] = useState(-1.0);
  const [beta, setBeta] = useState(0.5);

  const { margin, implicitRewardGap, loss } = computeDpo(logrW, logrL, beta);

  const sparkData = buildSparkline(beta, margin);
  const { pathData, mx, my, W, H } = JSON.parse(sparkData);

  return (
    <div className="my-4 p-4 border rounded-lg bg-white">
      <div className="flex flex-col gap-3">
        {/* Sliders */}
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <span className="w-36 text-right">log-ratio winner:</span>
            <input
              aria-label="log-ratio winner"
              type="range"
              min={-3}
              max={3}
              step={0.1}
              value={logrW}
              onChange={(e) => setLogrW(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono w-12">{logrW.toFixed(1)}</span>
          </label>

          <label className="flex items-center gap-2">
            <span className="w-36 text-right">log-ratio loser:</span>
            <input
              aria-label="log-ratio loser"
              type="range"
              min={-3}
              max={3}
              step={0.1}
              value={logrL}
              onChange={(e) => setLogrL(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono w-12">{logrL.toFixed(1)}</span>
          </label>

          <label className="flex items-center gap-2">
            <span className="w-36 text-right">beta:</span>
            <input
              aria-label="beta"
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={beta}
              onChange={(e) => setBeta(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono w-12">{beta.toFixed(2)}</span>
          </label>
        </div>

        {/* Computed values */}
        <div className="grid grid-cols-3 gap-2 text-sm font-mono bg-neutral-50 p-3 rounded">
          <div>
            <span className="text-neutral-500">margin</span>
            <div className="font-semibold">{fmt(margin)}</div>
            <div className="text-xs text-neutral-400">logr_w − logr_l</div>
          </div>
          <div>
            <span className="text-neutral-500">loss</span>
            <div className="font-semibold text-blue-600">{fmt(loss)}</div>
            <div className="text-xs text-neutral-400">L_DPO</div>
          </div>
          <div>
            <span className="text-neutral-500">reward gap</span>
            <div className="font-semibold text-emerald-600">{fmt(implicitRewardGap)}</div>
            <div className="text-xs text-neutral-400">β × margin</div>
          </div>
        </div>

        {/* Sparkline */}
        <svg
          width={W}
          height={H}
          className="border rounded bg-neutral-50"
          aria-label="loss vs margin sparkline"
        >
          <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
          <circle cx={mx} cy={my} r={4} fill="#ef4444" />
        </svg>

        <p className="text-xs text-neutral-500">
          Blue curve = L_DPO vs margin at current β · Red dot = current state ·
          L_DPO = −log σ(β·(logr_w − logr_l))
        </p>
      </div>
    </div>
  );
}
