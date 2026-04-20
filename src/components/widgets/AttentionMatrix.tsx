import { useMemo, useState } from "react";

const TOKENS = ["The", "cat", "sat", "on", "the", "mat"];

function seededEmbeddings(dk: number): { Q: number[][]; K: number[][] } {
  const rand = (i: number, j: number) => {
    const x = Math.sin(i * 2654435761 + j) * 10000;
    return x - Math.floor(x) - 0.5;
  };
  const Q = TOKENS.map((_, i) => Array.from({ length: dk }, (_, j) => rand(i, j)));
  const K = TOKENS.map((_, i) => Array.from({ length: dk }, (_, j) => rand(i + 100, j)));
  return { Q, K };
}

function softmax(row: number[]): number[] {
  const max = Math.max(...row);
  const exps = row.map((x) => Math.exp(x - max));
  const s = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / s);
}

export function AttentionMatrix() {
  const [dk, setDk] = useState(32);
  const [scale, setScale] = useState(true);
  const [queryIdx, setQueryIdx] = useState(1);

  const attn = useMemo(() => {
    const { Q, K } = seededEmbeddings(dk);
    const rows = Q.map((q) => {
      const dots = K.map((k) => q.reduce((s, qi, i) => s + qi * k[i], 0));
      const scaled = scale ? dots.map((d) => d / Math.sqrt(dk)) : dots;
      return softmax(scaled);
    });
    return rows;
  }, [dk, scale]);

  return (
    <div className="my-4 p-4 border rounded-lg bg-white">
      <div className="flex gap-4 items-center mb-3 flex-wrap">
        <label className="text-sm">
          d_k:
          <input
            aria-label="d_k"
            type="range"
            min={4}
            max={128}
            step={4}
            value={dk}
            onChange={(e) => setDk(+e.target.value)}
            className="mx-2"
          />
          <span className="font-mono">{dk}</span>
        </label>
        <label htmlFor="dk-scale" className="text-sm flex items-center gap-1">
          <input
            id="dk-scale"
            type="checkbox"
            checked={scale}
            onChange={(e) => setScale(e.target.checked)}
          />
          Scale by √d_k
        </label>
        <label className="text-sm">
          Query:
          <select
            className="ml-2 border rounded"
            value={queryIdx}
            onChange={(e) => setQueryIdx(+e.target.value)}
          >
            {TOKENS.map((t, i) => (
              <option key={i} value={i}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      <table className="text-center text-sm border-collapse">
        <thead>
          <tr>
            <th></th>
            {TOKENS.map((t, i) => (
              <th key={i} className="px-2 py-1">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TOKENS.map((t, qi) => (
            <tr key={qi} className={qi === queryIdx ? "outline outline-2 outline-blue-500" : ""}>
              <th className="pr-2 text-right">{t}</th>
              {attn[qi].map((v, ki) => (
                <td
                  key={ki}
                  className="w-10 h-10"
                  style={{ background: `rgba(59,130,246,${v.toFixed(2)})` }}
                  title={v.toFixed(3)}
                >
                  {v > 0.2 ? v.toFixed(2) : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-xs text-neutral-600">
        Hover a cell to see exact value. Row = query token. Darker cell = more attention mass.
      </p>
    </div>
  );
}
