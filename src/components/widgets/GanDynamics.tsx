import { useState } from "react";

function clip(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computeStep(t: number) {
  const D_real = clip(0.5 + 0.3 * Math.cos(t * 0.2), 0.05, 0.95);
  const D_fake = clip(0.5 + 0.3 * Math.cos(t * 0.2 + 1.5), 0.05, 0.95);
  const G_mean = 0.5 + 1.5 * (t / 100) + 0.3 * Math.sin(t * 0.25);
  return { D_real, D_fake, G_mean };
}

const BAR_MAX_W = 240; // px

interface BarProps {
  label: string;
  value: number;
  color: string;
}

function DiscBar({ label, value, color }: BarProps) {
  const pct = (value * 100).toFixed(1);
  const width = Math.round(value * BAR_MAX_W);
  return (
    <div className="flex items-center gap-3 my-1">
      <span className="w-16 text-sm font-mono text-right shrink-0">{label}</span>
      <div
        className="h-6 rounded"
        style={{ width, backgroundColor: color, minWidth: 4 }}
        role="presentation"
      />
      <span className="text-sm font-mono text-neutral-700">{pct}%</span>
    </div>
  );
}

export function GanDynamics() {
  const [step, setStep] = useState(0);
  const [converged, setConverged] = useState(false);

  const { D_real, D_fake, G_mean } = converged
    ? { D_real: 0.5, D_fake: 0.5, G_mean: computeStep(step).G_mean }
    : computeStep(step);

  const TARGET_MEAN = 2.0;

  return (
    <div className="my-4 p-4 border rounded-lg bg-white max-w-lg">
      <h3 className="font-semibold text-base mb-3">GAN Adversarial Dynamics</h3>

      {/* Step slider */}
      <label className="flex items-center gap-3 text-sm mb-3">
        <span className="shrink-0">Training step:</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          aria-label="training step"
          className="flex-1"
        />
        <span className="font-mono w-8 text-right">{step}</span>
      </label>

      {/* Converged checkbox */}
      <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={converged}
          onChange={(e) => setConverged(e.target.checked)}
          aria-label="Converged equilibrium"
        />
        <span>Converged equilibrium</span>
      </label>

      {/* Discriminator bars */}
      <div className="mb-4">
        <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">
          Discriminator output
        </p>
        <DiscBar label="D(real)" value={D_real} color="#3b82f6" />
        <DiscBar label="D(fake)" value={D_fake} color="#f97316" />
      </div>

      {/* Generator stats */}
      <div className="text-sm border-t pt-3">
        <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">
          Generator
        </p>
        <div className="flex gap-6">
          <span>
            <span className="text-neutral-500">G mean: </span>
            <span className="font-mono font-semibold">{G_mean.toFixed(3)}</span>
          </span>
          <span>
            <span className="text-neutral-500">Target: </span>
            <span className="font-mono font-semibold">{TARGET_MEAN.toFixed(1)}</span>
          </span>
        </div>
        <div className="mt-2 w-full bg-neutral-100 rounded h-3 relative overflow-hidden">
          {/* target mark */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-500"
            style={{ left: `${(TARGET_MEAN / 3) * 100}%` }}
          />
          {/* generator mean mark */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-orange-500"
            style={{ left: `${Math.min(100, Math.max(0, (G_mean / 3) * 100))}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-neutral-400">
          Blue = target (2.0) · Orange = G mean
        </p>
      </div>

      {converged && (
        <p className="mt-3 text-xs text-green-700 bg-green-50 rounded px-2 py-1">
          Equilibrium reached: D(real) ≈ D(fake) ≈ 0.5 — discriminator can no longer distinguish samples.
        </p>
      )}
    </div>
  );
}
