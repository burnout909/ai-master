import { useMemo, useState } from "react";

// Chinchilla parametric loss: L(N, D) = 1.7 + 406/N^0.34 + 410/D^0.28
function computeLoss(N: number, D: number): number {
  return 1.7 + 406 / Math.pow(N, 0.34) + 410 / Math.pow(D, 0.28);
}

const LOG_N_MIN = 8;
const LOG_N_MAX = 11;
const LOG_N_STEP = 0.05;
const LOG_D_MIN = 9;
const LOG_D_MAX = 13;
const LOG_D_STEP = 0.05;

const SVG_W = 320;
const SVG_H = 110;
const PAD_L = 6;
const PAD_R = 6;
const PAD_T = 8;
const PAD_B = 8;

function buildCurvePath(logN: number, logDMin: number, logDMax: number): string {
  const N = Math.pow(10, logN);
  const steps: number[] = [];
  for (let v = logDMin; v <= logDMax + 1e-9; v += LOG_D_STEP) {
    steps.push(Math.round(v * 1000) / 1000);
  }
  // compute loss range for scaling
  const losses = steps.map((ld) => computeLoss(N, Math.pow(10, ld)));
  const lMin = Math.min(...losses);
  const lMax = Math.max(...losses);
  const range = lMax - lMin || 1;

  const innerW = SVG_W - PAD_L - PAD_R;
  const innerH = SVG_H - PAD_T - PAD_B;

  const points = steps.map((ld, i) => {
    const x = PAD_L + ((ld - logDMin) / (logDMax - logDMin)) * innerW;
    const y = PAD_T + ((losses[i] - lMin) / range) * innerH;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return { path: "M" + points.join(" L"), lMin, lMax, losses, steps };
}

export function ChinchillaCurve() {
  const [logN, setLogN] = useState(9.0);
  const [logD, setLogD] = useState(11.0);
  const [showOptimal, setShowOptimal] = useState(false);

  const N = Math.pow(10, logN);
  const D = Math.pow(10, logD);
  const C = 6 * N * D;
  const logC = Math.log10(C);
  const L = computeLoss(N, D);

  // Chinchilla optimal: D* ≈ 20 * N
  const Dstar = 20 * N;
  const logDstar = Math.log10(Dstar);
  const Lstar = computeLoss(N, Dstar);
  const tokenRatio = D / Dstar;

  const curveData = useMemo(() => {
    const N = Math.pow(10, logN);
    const steps: number[] = [];
    for (let v = LOG_D_MIN; v <= LOG_D_MAX + 1e-9; v += LOG_D_STEP) {
      steps.push(Math.round(v * 1000) / 1000);
    }
    const losses = steps.map((ld) => computeLoss(N, Math.pow(10, ld)));
    const lMin = Math.min(...losses);
    const lMax = Math.max(...losses);
    const range = lMax - lMin || 1;

    const innerW = SVG_W - PAD_L - PAD_R;
    const innerH = SVG_H - PAD_T - PAD_B;

    const points = steps.map((ld, i) => {
      const x = PAD_L + ((ld - LOG_D_MIN) / (LOG_D_MAX - LOG_D_MIN)) * innerW;
      const y = PAD_T + ((losses[i] - lMin) / range) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    return { path: "M" + points.join(" L"), lMin, lMax, range, steps, losses };
  }, [logN]);

  // marker for current (logD)
  const innerW = SVG_W - PAD_L - PAD_R;
  const innerH = SVG_H - PAD_T - PAD_B;
  const markerX = PAD_L + ((logD - LOG_D_MIN) / (LOG_D_MAX - LOG_D_MIN)) * innerW;
  const markerY =
    PAD_T + ((L - curveData.lMin) / curveData.range) * innerH;

  // marker for optimal D*
  const optimalLogD = Math.min(Math.max(logDstar, LOG_D_MIN), LOG_D_MAX);
  const optimalX = PAD_L + ((optimalLogD - LOG_D_MIN) / (LOG_D_MAX - LOG_D_MIN)) * innerW;
  const optimalY =
    PAD_T + ((Lstar - curveData.lMin) / curveData.range) * innerH;

  return (
    <div className="my-4 p-4 border rounded-lg space-y-4">
      <div className="flex flex-wrap gap-6 items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">log₁₀(params):</span>
          <input
            type="range"
            aria-label="log10 params"
            min={LOG_N_MIN}
            max={LOG_N_MAX}
            step={LOG_N_STEP}
            value={logN}
            onChange={(e) => setLogN(+e.target.value)}
            className="w-32"
          />
          <span className="font-mono text-sm w-10">{logN.toFixed(2)}</span>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">log₁₀(tokens):</span>
          <input
            type="range"
            aria-label="log10 tokens"
            min={LOG_D_MIN}
            max={LOG_D_MAX}
            step={LOG_D_STEP}
            value={logD}
            onChange={(e) => setLogD(+e.target.value)}
            className="w-32"
          />
          <span className="font-mono text-sm w-10">{logD.toFixed(2)}</span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOptimal}
            onChange={(e) => setShowOptimal(e.target.checked)}
            className="w-4 h-4"
          />
          <span>Show Chinchilla-optimal</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
        <div>
          <span className="text-neutral-500">L (current): </span>
          <span className="text-blue-600 font-semibold">{L.toFixed(4)}</span>
        </div>
        <div>
          <span className="text-neutral-500">log₁₀(C): </span>
          <span className="font-semibold">{logC.toFixed(2)}</span>
        </div>
        {showOptimal && (
          <>
            <div>
              <span className="text-neutral-500">D* = 20·N: </span>
              <span className="text-green-600 font-semibold">
                10^{logDstar.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">L* (optimal): </span>
              <span className="text-green-600 font-semibold">{Lstar.toFixed(4)}</span>
            </div>
            <div className="col-span-2 text-amber-700">
              Your model is trained on{" "}
              <span className="font-semibold">{tokenRatio.toFixed(1)}×</span> the
              Chinchilla-optimal token count
              {tokenRatio < 1 ? " (under-trained)" : tokenRatio > 1 ? " (over-trained)" : " (optimal)"}
              .
            </div>
          </>
        )}
      </div>

      <svg
        width={SVG_W}
        height={SVG_H}
        className="block rounded bg-neutral-50 border"
        aria-label="loss curve"
      >
        <line
          x1={PAD_L}
          y1={PAD_T + innerH}
          x2={PAD_L + innerW}
          y2={PAD_T + innerH}
          stroke="#d1d5db"
          strokeWidth={1}
        />
        <path d={curveData.path} fill="none" stroke="#3b82f6" strokeWidth={2} />
        <circle cx={markerX} cy={markerY} r={4} fill="#ef4444" />
        {showOptimal && (
          <circle cx={optimalX} cy={optimalY} r={4} fill="#22c55e" />
        )}
      </svg>

      <p className="text-xs text-neutral-500">
        x-axis: log₁₀(tokens) [{LOG_D_MIN} → {LOG_D_MAX}] &nbsp;|&nbsp; y-axis: loss
        &nbsp;|&nbsp; red = current &nbsp;
        {showOptimal && "| green = Chinchilla-optimal"}
      </p>
    </div>
  );
}
