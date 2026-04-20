import { useMemo, useState } from "react";

type ActivationKey = "relu" | "tanh" | "sigmoid";

const ACTIVATIONS: Record<ActivationKey, { label: string; fn: (x: number) => number; dfn: (x: number) => number }> = {
  relu: {
    label: "ReLU",
    fn: (x) => Math.max(0, x),
    dfn: (x) => (x > 0 ? 1 : 0),
  },
  tanh: {
    label: "Tanh",
    fn: (x) => Math.tanh(x),
    dfn: (x) => 1 - Math.tanh(x) ** 2,
  },
  sigmoid: {
    label: "Sigmoid",
    fn: (x) => 1 / (1 + Math.exp(-x)),
    dfn: (x) => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); },
  },
};

const X_MIN = -6;
const X_MAX = 6;
const SAMPLES = 60;
const SVG_W = 300;
const SVG_H = 160;

function toSvgX(x: number) {
  return ((x - X_MIN) / (X_MAX - X_MIN)) * SVG_W;
}
function toSvgY(y: number) {
  // map [-1.1, 1.1] → [SVG_H, 0]
  return SVG_H - ((y + 1.1) / 2.2) * SVG_H;
}

export function ActivationCompare() {
  const [activation, setActivation] = useState<ActivationKey>("relu");
  const [xVal, setXVal] = useState(0);

  const act = ACTIVATIONS[activation];
  const fx = act.fn(xVal);
  const dfx = act.dfn(xVal);

  const points = useMemo(() => {
    return Array.from({ length: SAMPLES + 1 }, (_, i) => {
      const x = X_MIN + (i / SAMPLES) * (X_MAX - X_MIN);
      return { x, y: act.fn(x) };
    });
  }, [activation]);

  const polyline = points
    .map((p) => `${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`)
    .join(" ");

  const dotX = toSvgX(xVal);
  const dotY = toSvgY(fx);

  return (
    <div className="my-4 p-4 border rounded-lg bg-white">
      <div className="flex gap-4 items-center mb-3 flex-wrap">
        <label className="text-sm" htmlFor="activation-select">
          Activation:
          <select
            id="activation-select"
            aria-label="Activation"
            className="ml-2 border rounded"
            value={activation}
            onChange={(e) => setActivation(e.target.value as ActivationKey)}
          >
            <option value="relu">ReLU</option>
            <option value="tanh">Tanh</option>
            <option value="sigmoid">Sigmoid</option>
          </select>
        </label>

        <label className="text-sm">
          x:
          <input
            aria-label="x value"
            type="range"
            min={X_MIN}
            max={X_MAX}
            step={0.1}
            value={xVal}
            onChange={(e) => setXVal(+e.target.value)}
            className="mx-2"
          />
          <span className="font-mono">{xVal.toFixed(1)}</span>
        </label>
      </div>

      <div className="flex gap-6 text-sm mb-3">
        <span>
          <span className="text-neutral-500">f(x) =</span>{" "}
          <span className="font-mono font-semibold">{fx.toFixed(4)}</span>
        </span>
        <span>
          <span className="text-neutral-500">f′(x) =</span>{" "}
          <span className="font-mono font-semibold">{dfx.toFixed(4)}</span>
        </span>
        <span className="text-blue-600 font-medium">{act.label}</span>
      </div>

      <svg
        width={SVG_W}
        height={SVG_H}
        className="border border-neutral-200 rounded bg-neutral-50"
        aria-label={`${act.label} function plot`}
      >
        {/* axes */}
        <line x1={toSvgX(0)} y1={0} x2={toSvgX(0)} y2={SVG_H} stroke="#d1d5db" strokeWidth={1} />
        <line x1={0} y1={toSvgY(0)} x2={SVG_W} y2={toSvgY(0)} stroke="#d1d5db" strokeWidth={1} />
        {/* function curve */}
        <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth={2} />
        {/* current x dot */}
        <circle cx={dotX} cy={dotY} r={5} fill="#ef4444" stroke="white" strokeWidth={1.5} />
      </svg>

      <p className="mt-2 text-xs text-neutral-500">
        Drag the slider to explore how gradient (f′) behaves — notice ReLU keeps f′=1 for x&gt;0,
        while sigmoid/tanh saturate near ±1.
      </p>
    </div>
  );
}
