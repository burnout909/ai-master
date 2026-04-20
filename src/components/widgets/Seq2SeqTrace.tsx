import { useMemo, useState } from "react";

const ALL_TOKENS = ["the", "cat", "sat", "on", "the", "mat"];

function tokenEmbedding(i: number): number {
  return Math.sin((i + 1) * 0.73) + Math.sin((i + 1) * 2.1) * 0.5;
}

function computeRetentions(tokens: string[]): number[] {
  const n = tokens.length;
  // weight for position i (0-indexed from start) = 0.6^(distance from end)
  // distance from end = (n - 1 - i)
  const raw = tokens.map((_, i) => Math.pow(0.6, n - 1 - i));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v / sum);
}

export function Seq2SeqTrace() {
  const [srcLen, setSrcLen] = useState(6);
  const [reversed, setReversed] = useState(false);

  const { displayTokens, retentions, firstTokenDistance } = useMemo(() => {
    const baseTokens = ALL_TOKENS.slice(0, srcLen);
    const ordered = reversed ? [...baseTokens].reverse() : baseTokens;
    const rets = computeRetentions(ordered);

    // The first source word used (before any reordering) is ALL_TOKENS[0] = "the"
    // Distance from final encoder step = n - 1 - position_of_first_token_in_ordered
    const firstOriginal = baseTokens[0]; // always ALL_TOKENS[0]
    const posInOrdered = reversed ? srcLen - 1 : 0;
    const dist = srcLen - 1 - posInOrdered;

    return {
      displayTokens: ordered,
      retentions: rets,
      firstTokenDistance: { word: firstOriginal, dist },
    };
  }, [srcLen, reversed]);

  const maxBar = 220; // px

  return (
    <div className="my-4 p-4 border rounded-lg bg-white">
      <div className="flex gap-6 items-center mb-4 flex-wrap">
        <label className="text-sm flex items-center gap-2">
          source length
          <input
            aria-label="source length"
            type="range"
            min={2}
            max={6}
            step={1}
            value={srcLen}
            onChange={(e) => setSrcLen(+e.target.value)}
            className="mx-1"
          />
          <span className="font-mono font-semibold">{srcLen}</span>
        </label>

        <label className="text-sm flex items-center gap-2">
          <input
            id="reverse-checkbox"
            type="checkbox"
            checked={reversed}
            onChange={(e) => setReversed(e.target.checked)}
            aria-label="Reverse source order"
          />
          Reverse source order
        </label>
      </div>

      {/* Bar chart — horizontal bars */}
      <div className="flex flex-col gap-1 mb-4">
        {displayTokens.map((token, i) => {
          const r = retentions[i];
          const barW = Math.round(r * maxBar * displayTokens.length);
          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-12 text-right font-mono text-neutral-700">{token}</span>
              <div
                className="h-6 rounded bg-blue-400 transition-all duration-200"
                style={{ width: `${Math.max(barW, 4)}px` }}
                title={`retention: ${(r * 100).toFixed(1)}%`}
              />
              <span className="text-xs text-neutral-500">{(r * 100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-neutral-700">
        Distance from final encoder step to &ldquo;
        <span className="font-semibold">{firstTokenDistance.word}</span>&rdquo; ={" "}
        <span className="font-mono font-bold">{firstTokenDistance.dist}</span>
      </p>

      <p className="mt-2 text-xs text-neutral-500">
        Retention ∝ 0.6<sup>(distance from end)</sup>, normalized.
        {reversed
          ? " Source reversed — first word is now close to the final encoder step."
          : " Original order — first word is farthest from the final encoder step."}
      </p>
    </div>
  );
}
