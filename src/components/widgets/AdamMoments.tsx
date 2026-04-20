import { useMemo, useState } from "react";

const N_STEPS = 40;

function buildGradients(): number[] {
  return Array.from({ length: N_STEPS }, (_, i) => {
    const t = i + 1;
    return Math.sin(t * 0.37) + 0.3 * Math.sin(t * 1.7);
  });
}

const GRADIENTS = buildGradients();

interface MomentResult {
  g: number;
  m: number;
  v: number;
  mHat: number;
  vHat: number;
  update: number;
  ms: number[];
  vs: number[];
  mHats: number[];
}

function computeMoments(
  beta1: number,
  beta2: number,
  stepIdx: number,
  biasCorrection: boolean
): MomentResult {
  let m = 0;
  let v = 0;
  const ms: number[] = [];
  const vs: number[] = [];
  const mHats: number[] = [];

  for (let t = 1; t <= N_STEPS; t++) {
    const g = GRADIENTS[t - 1];
    m = beta1 * m + (1 - beta1) * g;
    v = beta2 * v + (1 - beta2) * g * g;
    ms.push(m);
    vs.push(v);
    const mh = m / (1 - Math.pow(beta1, t));
    mHats.push(mh);
  }

  const idx = stepIdx - 1;
  const g = GRADIENTS[idx];
  const mt = ms[idx];
  const vt = vs[idx];
  const mHat = mt / (1 - Math.pow(beta1, stepIdx));
  const vHat = vt / (1 - Math.pow(beta2, stepIdx));

  const effectiveM = biasCorrection ? mHat : mt;
  const effectiveV = biasCorrection ? vHat : vt;
  const update = effectiveM / (Math.sqrt(effectiveV) + 1e-8);

  return { g, m: mt, v: vt, mHat, vHat, update, ms, vs, mHats };
}

function fmt(n: number): string {
  return n.toFixed(4);
}

const SVG_W = 320;
const SVG_H = 80;
const PAD = 8;

function MiniPlot({
  gs,
  ms,
  overlayValues,
  stepIdx,
  biasCorrection,
}: {
  gs: number[];
  ms: number[];
  overlayValues: number[];
  stepIdx: number;
  biasCorrection: boolean;
}) {
  const allVals = [...gs, ...ms, ...overlayValues];
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal || 1;

  function toX(t: number) {
    return PAD + ((t - 1) / (N_STEPS - 1)) * (SVG_W - 2 * PAD);
  }
  function toY(v: number) {
    return PAD + (1 - (v - minVal) / range) * (SVG_H - 2 * PAD);
  }

  function polyline(vals: number[], color: string, opacity = 1) {
    const pts = vals.map((v, i) => `${toX(i + 1)},${toY(v)}`).join(" ");
    return (
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={opacity}
      />
    );
  }

  const cx = toX(stepIdx);

  return (
    <svg
      width={SVG_W}
      height={SVG_H}
      className="border rounded bg-neutral-50 mt-2"
      aria-label="gradient and moment plot"
    >
      {polyline(gs, "#9ca3af")}
      {polyline(ms, "#3b82f6")}
      {polyline(overlayValues, biasCorrection ? "#f59e0b" : "#3b82f6", 0.5)}
      <line
        x1={cx}
        y1={PAD}
        x2={cx}
        y2={SVG_H - PAD}
        stroke="#ef4444"
        strokeWidth={1}
        strokeDasharray="3 2"
      />
    </svg>
  );
}

export function AdamMoments() {
  const [beta1, setBeta1] = useState(0.9);
  const [beta2, setBeta2] = useState(0.999);
  const [stepIdx, setStepIdx] = useState(10);
  const [biasCorrection, setBiasCorrection] = useState(true);

  const { g, m, v, mHat, vHat, update, ms, vs, mHats } = useMemo(
    () => computeMoments(beta1, beta2, stepIdx, biasCorrection),
    [beta1, beta2, stepIdx, biasCorrection]
  );

  return (
    <div className="my-4 p-4 border rounded-lg bg-white">
      <div className="flex flex-col gap-3">
        {/* Controls */}
        <div className="flex gap-4 flex-wrap items-center text-sm">
          <label>
            β₁:
            <input
              aria-label="beta 1"
              type="range"
              min={0.5}
              max={0.999}
              step={0.01}
              value={beta1}
              onChange={(e) => setBeta1(parseFloat(e.target.value))}
              className="mx-2"
            />
            <span className="font-mono">{beta1.toFixed(2)}</span>
          </label>

          <label>
            β₂:
            <input
              aria-label="beta 2"
              type="range"
              min={0.9}
              max={0.999}
              step={0.001}
              value={beta2}
              onChange={(e) => setBeta2(parseFloat(e.target.value))}
              className="mx-2"
            />
            <span className="font-mono">{beta2.toFixed(3)}</span>
          </label>

          <label>
            Step:
            <input
              aria-label="step"
              type="range"
              min={1}
              max={40}
              step={1}
              value={stepIdx}
              onChange={(e) => setStepIdx(parseInt(e.target.value, 10))}
              className="mx-2"
            />
            <span className="font-mono">{stepIdx}</span>
          </label>

          <label className="flex items-center gap-1">
            <input
              aria-label="Bias correction"
              type="checkbox"
              checked={biasCorrection}
              onChange={(e) => setBiasCorrection(e.target.checked)}
            />
            Bias correction
          </label>
        </div>

        {/* Values table */}
        <div className="grid grid-cols-3 gap-2 text-sm font-mono bg-neutral-50 p-3 rounded">
          <div>
            <span className="text-neutral-500">g_t</span>
            <div className="font-semibold">{fmt(g)}</div>
          </div>
          <div>
            <span className="text-neutral-500">m_t</span>
            <div className="font-semibold text-blue-600">{fmt(m)}</div>
          </div>
          <div>
            <span className="text-neutral-500">v_t</span>
            <div className="font-semibold">{fmt(v)}</div>
          </div>
          {biasCorrection && (
            <>
              <div>
                <span className="text-neutral-500">m̂_t</span>
                <div className="font-semibold text-amber-600">{fmt(mHat)}</div>
              </div>
              <div>
                <span className="text-neutral-500">v̂_t</span>
                <div className="font-semibold text-amber-600">{fmt(vHat)}</div>
              </div>
            </>
          )}
          <div className={biasCorrection ? "" : "col-span-3"}>
            <span className="text-neutral-500">update</span>
            <div className="font-semibold text-red-600">{fmt(update)}</div>
          </div>
        </div>

        {/* SVG plot */}
        <MiniPlot
          gs={GRADIENTS}
          ms={ms}
          overlayValues={biasCorrection ? mHats : ms}
          stepIdx={stepIdx}
          biasCorrection={biasCorrection}
        />

        <p className="text-xs text-neutral-500">
          Grey = g_t · Blue = m_t ·{" "}
          {biasCorrection ? "Amber = m̂_t (bias-corrected)" : "Dashed = m_t"} ·
          Red line = current step
        </p>
      </div>
    </div>
  );
}
