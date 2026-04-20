import { useState } from "react";

const IMAGES = ["🐱 cat", "🐶 dog", "🚗 car", "🌸 flower"];
const TEXTS = [
  "a photo of a cat",
  "a photo of a dog",
  "a photo of a car",
  "a photo of a flower",
];

function buildLogits(): number[][] {
  return Array.from({ length: 4 }, (_, i) =>
    Array.from({ length: 4 }, (_, j) =>
      i === j ? 2.5 : 0.5 * Math.sin((i + 1) * (j + 2) * 0.7)
    )
  );
}

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exp = arr.map((x) => Math.exp(x - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map((x) => x / sum);
}

function computeProbs(logits: number[][], temp: number, direction: "row" | "col"): number[][] {
  const scaled = logits.map((row) => row.map((v) => v / temp));

  if (direction === "row") {
    return scaled.map((row) => softmax(row));
  } else {
    // column-softmax: transpose, softmax each row, transpose back
    const transposed = Array.from({ length: 4 }, (_, j) =>
      Array.from({ length: 4 }, (_, i) => scaled[i][j])
    );
    const softmaxed = transposed.map((col) => softmax(col));
    return Array.from({ length: 4 }, (_, i) =>
      Array.from({ length: 4 }, (_, j) => softmaxed[j][i])
    );
  }
}

export default function ClipMatrix() {
  const [temperature, setTemperature] = useState(0.5);
  const [direction, setDirection] = useState<"row" | "col">("row");

  const logits = buildLogits();
  const probs = computeProbs(logits, temperature, direction);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 540 }}>
      <h3 style={{ marginBottom: "0.75rem" }}>CLIP Similarity Matrix</h3>

      {/* Temperature slider */}
      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="clip-temp-slider" style={{ marginRight: "0.5rem" }}>
          Temperature: {temperature.toFixed(2)}
        </label>
        <input
          id="clip-temp-slider"
          type="range"
          aria-label="temperature"
          min={0.05}
          max={1.5}
          step={0.05}
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
        />
      </div>

      {/* Direction radio group */}
      <div
        role="radiogroup"
        aria-label="direction"
        style={{ marginBottom: "1rem", display: "flex", gap: "1.5rem" }}
      >
        <label style={{ cursor: "pointer" }}>
          <span
            role="radio"
            aria-checked={direction === "row"}
            tabIndex={0}
            onClick={() => setDirection("row")}
            onKeyDown={(e) => e.key === "Enter" && setDirection("row")}
            style={{ marginRight: "0.25rem" }}
          >
            {direction === "row" ? "●" : "○"}
          </span>
          image → text
        </label>
        <label style={{ cursor: "pointer" }}>
          <span
            role="radio"
            aria-checked={direction === "col"}
            tabIndex={0}
            onClick={() => setDirection("col")}
            onKeyDown={(e) => e.key === "Enter" && setDirection("col")}
            style={{ marginRight: "0.25rem" }}
          >
            {direction === "col" ? "●" : "○"}
          </span>
          text → image
        </label>
      </div>

      {/* Matrix */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `120px repeat(4, 1fr)`,
          gap: 2,
        }}
      >
        {/* Header row */}
        <div />
        {TEXTS.map((t) => (
          <div
            key={t}
            style={{
              fontSize: "0.65rem",
              textAlign: "center",
              padding: "2px 4px",
              fontWeight: 600,
            }}
          >
            {t}
          </div>
        ))}

        {/* Data rows */}
        {IMAGES.map((img, i) => (
          <>
            <div
              key={`label-${img}`}
              style={{
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                fontWeight: 600,
              }}
            >
              {img}
            </div>
            {probs[i].map((p, j) => (
              <div
                key={`cell-${i}-${j}`}
                style={{
                  background: `rgba(37,99,235,${p.toFixed(3)})`,
                  borderRadius: 4,
                  minHeight: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  color: p >= 0.5 ? "#fff" : "#1e293b",
                  fontWeight: p >= 0.1 ? 600 : 400,
                }}
              >
                {p >= 0.1 ? p.toFixed(2) : ""}
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  );
}
