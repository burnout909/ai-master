import { useMemo, useState } from "react";

const SEQ_LEN = 4096;
const N_LAYERS = 32;
const D_HEAD = 128;
const BYTES_PER_PARAM = 2; // fp16

function kvCacheMB(g: number): number {
  // per-token: g * d_head * 2 (K and V)
  // full: × seq_len × n_layers / (1024*1024)
  return (g * D_HEAD * 2 * SEQ_LEN * N_LAYERS) / (1024 * 1024) * BYTES_PER_PARAM;
}

export function KVGroups() {
  const [h, setH] = useState(16); // query heads
  const [g, setG] = useState(4);  // kv groups

  // clamp g to [1, h] whenever h changes
  const clampedG = Math.min(Math.max(g, 1), h);

  const mhaMB = useMemo(() => kvCacheMB(h), [h]);
  const gqaMB = useMemo(() => kvCacheMB(clampedG), [clampedG]);
  const mqaMB = useMemo(() => kvCacheMB(1), []);

  const mode =
    clampedG === h
      ? "Multi-Head (MHA)"
      : clampedG === 1
      ? "Multi-Query (MQA)"
      : "Grouped-Query (GQA)";

  function handleH(val: number) {
    setH(val);
    // keep g in bounds
    if (g > val) setG(val);
  }

  function handleG(val: number) {
    setG(Math.min(Math.max(val, 1), h));
  }

  return (
    <div className="my-4 p-4 border rounded-lg">
      <div className="flex flex-col gap-4 mb-4">
        <label className="flex items-center gap-3">
          <span className="w-36 text-sm">Query heads h: {h}</span>
          <input
            type="range"
            aria-label="query heads"
            min={8}
            max={64}
            step={4}
            value={h}
            onChange={(e) => handleH(Number(e.target.value))}
            className="flex-1"
          />
        </label>

        <label className="flex items-center gap-3">
          <span className="w-36 text-sm">KV groups g: {clampedG}</span>
          <input
            type="range"
            aria-label="kv groups"
            min={1}
            max={h}
            step={1}
            value={clampedG}
            onChange={(e) => handleG(Number(e.target.value))}
            className="flex-1"
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm mb-4">
        <div className="p-3 bg-red-50 rounded border border-red-200">
          <p className="text-xs text-neutral-500 mb-1">MHA cache (g=h)</p>
          <p className="font-mono text-lg font-semibold text-red-700">
            {mhaMB.toFixed(1)} MB
          </p>
        </div>

        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-neutral-500 mb-1">GQA cache (current g)</p>
          <p className="font-mono text-lg font-semibold text-blue-700">
            {gqaMB.toFixed(1)} MB
          </p>
        </div>

        <div className="p-3 bg-green-50 rounded border border-green-200">
          <p className="text-xs text-neutral-500 mb-1">MQA cache (g=1)</p>
          <p className="font-mono text-lg font-semibold text-green-700">
            {mqaMB.toFixed(1)} MB
          </p>
        </div>
      </div>

      <p className="text-sm text-neutral-600">
        Mode: <span className="font-semibold">{mode}</span>
      </p>

      <p className="text-xs text-neutral-400 mt-2">
        Fixed: seq_len={SEQ_LEN}, n_layers={N_LAYERS}, d_head={D_HEAD}, fp16
      </p>
    </div>
  );
}
