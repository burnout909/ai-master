import { useMemo, useState } from "react";

const D = 64; // head dim, fixed
const SRAM_LIMIT_BYTES = 192 * 1024; // 192 KB

const N_OPTIONS = [512, 1024, 2048, 4096, 8192];
const B_OPTIONS = [32, 64, 128, 256];

export function FlashMemory() {
  const [N, setN] = useState(1024);
  const [B, setB] = useState(64);

  const naive = useMemo(() => N * D + N * D + N * D + N * N, [N]);
  const flash = useMemo(() => N * D + N * D + N * D + N * D, [N]);
  const savingsRatio = useMemo(() => naive / flash, [naive, flash]);

  const sramBytes = useMemo(() => 3 * B * D * 4, [B]);
  const sramKB = sramBytes / 1024;
  const sramExceeded = sramBytes > SRAM_LIMIT_BYTES;

  const naiveLog = useMemo(() => Math.log10(naive), [naive]);
  const flashLog = useMemo(() => Math.log10(flash), [flash]);

  return (
    <div className="my-4 p-4 border rounded-lg">
      <div className="flex items-center gap-6 flex-wrap mb-4">
        <label className="flex items-center gap-2">
          Sequence length N:
          <select
            aria-label="sequence length"
            className="ml-2 border rounded px-1"
            value={N}
            onChange={(e) => setN(Number(e.target.value))}
          >
            {N_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          Tile size B:
          <select
            aria-label="tile size"
            className="ml-2 border rounded px-1"
            value={B}
            onChange={(e) => setB(Number(e.target.value))}
          >
            {B_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div className="p-3 bg-red-50 rounded border border-red-200">
          <p className="text-xs text-neutral-500 mb-1">Naive I/O (log₁₀)</p>
          <p className="font-mono text-lg font-semibold text-red-700">
            {naiveLog.toFixed(2)}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            = {naive.toLocaleString()} elements
          </p>
        </div>

        <div className="p-3 bg-green-50 rounded border border-green-200">
          <p className="text-xs text-neutral-500 mb-1">Flash I/O (log₁₀)</p>
          <p className="font-mono text-lg font-semibold text-green-700">
            {flashLog.toFixed(2)}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            = {flash.toLocaleString()} elements
          </p>
        </div>

        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-neutral-500 mb-1">Savings ratio</p>
          <p className="font-mono text-lg font-semibold text-blue-700">
            {savingsRatio.toFixed(1)}×
          </p>
          <p className="text-xs text-neutral-400 mt-1">naive / flash I/O</p>
        </div>

        <div
          className={`p-3 rounded border ${sramExceeded ? "bg-red-100 border-red-400" : "bg-neutral-50 border-neutral-200"}`}
        >
          <p className="text-xs text-neutral-500 mb-1">SRAM per tile</p>
          <p
            className={`font-mono text-lg font-semibold ${sramExceeded ? "text-red-700" : "text-neutral-700"}`}
          >
            {sramKB.toFixed(1)} KB
          </p>
          <p className="text-xs text-neutral-400 mt-1">3 × B × d × 4 bytes</p>
        </div>
      </div>

      {sramExceeded && (
        <p className="text-red-600 text-sm font-medium mt-2">
          Warning: SRAM per tile ({sramKB.toFixed(1)} KB) exceeds 192 KB
          typical A100 SRAM per SM.
        </p>
      )}

      <p className="text-xs text-neutral-500 mt-3">
        d = {D} (fixed head dim). Naive materializes N×N attention matrix in
        HBM; FlashAttention keeps intermediates in SRAM tiles of size {B}×{B}.
      </p>
    </div>
  );
}
