import { useMemo, useRef, useState, useEffect } from "react";

type Schedule = "linear" | "cosine";

function betas(T: number, schedule: Schedule): Float32Array {
  const b = new Float32Array(T);
  if (schedule === "linear") {
    const b0 = 1e-4, bT = 0.02;
    for (let i = 0; i < T; i++) b[i] = b0 + ((bT - b0) * i) / (T - 1);
  } else {
    const s = 0.008;
    const f = (t: number) => Math.cos(((t / T + s) / (1 + s)) * Math.PI / 2) ** 2;
    const f0 = f(0);
    for (let i = 0; i < T; i++) {
      const ab = f(i) / f0;
      const abPrev = i === 0 ? 1 : f(i - 1) / f0;
      const beta = 1 - ab / abPrev;
      b[i] = Math.min(Math.max(beta, 1e-8), 0.999);
    }
  }
  return b;
}

function alphaBars(b: Float32Array): Float32Array {
  const a = new Float32Array(b.length);
  let acc = 1;
  for (let i = 0; i < b.length; i++) {
    acc *= 1 - b[i];
    a[i] = acc;
  }
  return a;
}

export function NoiseSchedule() {
  const T = 1000;
  const [t, setT] = useState(0);
  const [schedule, setSchedule] = useState<Schedule>("linear");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { ab } = useMemo(() => {
    const b = betas(T, schedule);
    return { b, ab: alphaBars(b) };
  }, [schedule]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = c.width, H = c.height;
    const img = ctx.createImageData(W, H);
    const sqrtAb = Math.sqrt(ab[Math.max(0, Math.min(T - 1, t))]);
    const sqrtOne = Math.sqrt(1 - ab[Math.max(0, Math.min(T - 1, t))]);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const base = ((x + y) % 64 < 32 ? 200 : 80) + Math.sin(x / 8) * 20;
        const noise = (Math.random() - 0.5) * 255;
        const v = sqrtAb * base + sqrtOne * noise + 128;
        const i = (y * W + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, v));
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [t, ab]);

  return (
    <div className="my-4 p-4 border rounded-lg">
      <div className="flex items-center gap-4 flex-wrap mb-3">
        <label>
          Timestep:
          <input
            type="range"
            aria-label="timestep"
            min={0}
            max={T - 1}
            value={t}
            onChange={(e) => setT(+e.target.value)}
            className="mx-2"
          />
          <span className="font-mono">{t}</span>
        </label>
        <label>
          Schedule:
          <select
            aria-label="schedule"
            className="ml-2 border rounded"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value as Schedule)}
          >
            <option value="linear">Linear</option>
            <option value="cosine">Cosine</option>
          </select>
        </label>
      </div>
      <canvas ref={canvasRef} width={200} height={200} className="border" />
      <p className="text-xs text-neutral-600 mt-2">
        x_t = √ᾱ_t · x_0 + √(1 − ᾱ_t) · ε   (ε ~ 𝒩(0, I))
      </p>
    </div>
  );
}
