import { useState, useMemo } from "react";

const D_MODEL = 320; // Stable Diffusion default
const RESOLUTIONS = [64, 128, 256, 512, 1024] as const;
type Resolution = (typeof RESOLUTIONS)[number];

function flops(tokens: number): number {
  return tokens * tokens * D_MODEL;
}

function fmt(n: number): string {
  return n.toFixed(2);
}

export function LatentVsPixel() {
  const [resolution, setResolution] = useState<Resolution>(256);
  const [factor, setFactor] = useState(8);

  const stats = useMemo(() => {
    const H = resolution;
    const f = factor;
    const pixelTokens = H * H;
    const latentTokens = Math.round((H / f) * (H / f));
    const savings = f * f;
    const pixelFlops = flops(pixelTokens);
    const latentFlops = flops(latentTokens);
    const computeRatio = pixelFlops / Math.max(latentFlops, 1);
    return {
      pixelTokens,
      latentTokens,
      savings,
      pixelLog: Math.log10(pixelFlops),
      latentLog: Math.log10(Math.max(latentFlops, 1)),
      computeRatio,
    };
  }, [resolution, factor]);

  return (
    <div className="my-4 p-4 border rounded-lg bg-white max-w-lg">
      <h3 className="font-semibold text-base mb-3">Latent vs Pixel Diffusion Compute</h3>

      {/* Resolution select */}
      <label className="flex items-center gap-3 text-sm mb-3">
        <span className="shrink-0">Resolution:</span>
        <select
          aria-label="resolution"
          value={resolution}
          onChange={(e) => setResolution(Number(e.target.value) as Resolution)}
          className="border rounded px-2 py-0.5"
        >
          {RESOLUTIONS.map((r) => (
            <option key={r} value={r}>
              {r} × {r}
            </option>
          ))}
        </select>
      </label>

      {/* Downsample factor slider */}
      <label className="flex items-center gap-3 text-sm mb-4">
        <span className="shrink-0">Downsample factor:</span>
        <input
          type="range"
          aria-label="downsample factor"
          min={2}
          max={16}
          step={1}
          value={factor}
          onChange={(e) => setFactor(Number(e.target.value))}
          className="flex-1"
        />
        <span className="font-mono w-6 text-right">{factor}×</span>
      </label>

      {/* Stats table */}
      <div className="text-sm border-t pt-3 space-y-1.5">
        <Row label="Pixel tokens (H×W)" value={stats.pixelTokens.toLocaleString()} />
        <Row
          label={`Latent tokens (H/f × W/f)`}
          value={stats.latentTokens.toLocaleString()}
        />
        <Row label="Token savings (f²)" value={`${stats.savings}×`} />
        <div className="border-t my-2" />
        <Row
          label="Pixel attn FLOP proxy (log₁₀)"
          value={fmt(stats.pixelLog)}
          mono
        />
        <Row
          label="Latent attn FLOP proxy (log₁₀)"
          value={fmt(stats.latentLog)}
          mono
        />
        <div className="mt-2 p-2 bg-blue-50 rounded text-blue-900 font-semibold text-center">
          Compute ratio (pixel / latent): {fmt(stats.computeRatio)}×
        </div>
      </div>

      <p className="text-xs text-neutral-500 mt-3">
        FLOP proxy = tokens² × d_model (d_model = {D_MODEL}). Attention scales
        quadratically, so latent-space gives ≈ f⁴ FLOP savings.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-neutral-600">{label}</span>
      <span className={mono ? "font-mono" : "font-semibold"}>{value}</span>
    </div>
  );
}
