import { useState } from "react";

type MaskMode = "bidirectional" | "causal" | "bidirectional-with-mask-15";

const TOKENS = ["[CLS]", "The", "cat", "sat", "on", "mat"];
const N = 6;
const MASKED_COLS = [1, 4]; // deterministic 15% mask positions

function cellStyle(
  row: number,
  col: number,
  mode: MaskMode,
  queryPos: number
): React.CSSProperties {
  const isActiveRow = row === queryPos;
  const border = isActiveRow ? "2px solid #1d4ed8" : "1px solid #d1d5db";

  if (mode === "bidirectional") {
    return { background: "#3b82f6", border };
  }

  if (mode === "causal") {
    const attendable = col <= row;
    return { background: attendable ? "#3b82f6" : "#f3f4f6", border };
  }

  // bidirectional-with-mask-15
  if (MASKED_COLS.includes(col)) {
    return {
      background: "repeating-linear-gradient(45deg,#9ca3af,#9ca3af 3px,#e5e7eb 3px,#e5e7eb 6px)",
      border,
    };
  }
  return { background: "#3b82f6", border };
}

export function MaskPatterns() {
  const [mode, setMode] = useState<MaskMode>("bidirectional");
  const [queryPos, setQueryPos] = useState(0);

  return (
    <div className="my-4 p-4 border rounded-lg bg-white">
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <label className="text-sm flex items-center gap-2">
          <span>Mask mode:</span>
          <select
            aria-label="mask mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as MaskMode)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="bidirectional">bidirectional</option>
            <option value="causal">causal</option>
            <option value="bidirectional-with-mask-15">bidirectional-with-mask-15</option>
          </select>
        </label>

        <label className="text-sm flex items-center gap-2">
          <span>Query position: {queryPos}</span>
          <input
            aria-label="query position"
            type="range"
            min={0}
            max={5}
            step={1}
            value={queryPos}
            onChange={(e) => setQueryPos(+e.target.value)}
            className="mx-1"
          />
        </label>
      </div>

      <div className="overflow-auto">
        <table className="text-xs text-center border-collapse">
          <thead>
            <tr>
              <th className="w-12" />
              {TOKENS.map((t, i) => (
                <th key={i} className="w-12 px-1 py-1 font-mono text-neutral-600">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: N }, (_, row) => (
              <tr key={row}>
                <th className="pr-2 text-right font-mono text-neutral-600 whitespace-nowrap">
                  {TOKENS[row]}
                </th>
                {Array.from({ length: N }, (_, col) => (
                  <td
                    key={col}
                    className="w-10 h-10"
                    style={cellStyle(row, col, mode, queryPos)}
                    title={`row=${TOKENS[row]} col=${TOKENS[col]}`}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 bg-blue-500 border" /> Attendable
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 bg-neutral-100 border" /> Masked (causal)
        </span>
        {mode === "bidirectional-with-mask-15" && (
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-4 h-4 border"
              style={{
                background:
                  "repeating-linear-gradient(45deg,#9ca3af,#9ca3af 3px,#e5e7eb 3px,#e5e7eb 6px)",
              }}
            />{" "}
            [MASK] token
          </span>
        )}
        <span>Active row = thick blue border (query position {queryPos}: {TOKENS[queryPos]})</span>
      </div>
    </div>
  );
}
