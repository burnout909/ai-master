import { useState, useMemo } from "react";

function hsl(i: number, j: number): string {
  const hue = (Math.sin(i * 0.31 + j * 0.57) * 180 + 180) | 0;
  return `hsl(${hue},70%,55%)`;
}

export function PatchGrid() {
  const [patchSize, setPatchSize] = useState(4);
  const [imageSize, setImageSize] = useState(16);

  const numPatches = Math.floor(imageSize / patchSize);
  const totalPatches = numPatches * numPatches;
  const patchDim = patchSize * patchSize * 3;

  const cellPx = 18;
  const zoomPx = cellPx * 4;

  const fullGrid = useMemo(() => {
    const rows = [];
    for (let i = 0; i < imageSize; i++) {
      const cells = [];
      for (let j = 0; j < imageSize; j++) {
        cells.push(
          <div
            key={j}
            style={{
              width: cellPx,
              height: cellPx,
              backgroundColor: hsl(i, j),
              boxSizing: "border-box",
              border:
                i % patchSize === 0 || j % patchSize === 0
                  ? "1px solid rgba(0,0,0,0.25)"
                  : "none",
            }}
          />
        );
      }
      rows.push(
        <div key={i} style={{ display: "flex" }}>
          {cells}
        </div>
      );
    }
    return rows;
  }, [imageSize, patchSize]);

  const zoomPatch = useMemo(() => {
    const rows = [];
    for (let i = 0; i < patchSize; i++) {
      const cells = [];
      for (let j = 0; j < patchSize; j++) {
        cells.push(
          <div
            key={j}
            style={{
              width: zoomPx,
              height: zoomPx,
              backgroundColor: hsl(i, j),
              border: "1px solid rgba(0,0,0,0.15)",
              boxSizing: "border-box",
            }}
          />
        );
      }
      rows.push(
        <div key={i} style={{ display: "flex" }}>
          {cells}
        </div>
      );
    }
    return rows;
  }, [patchSize, zoomPx]);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      {/* Controls */}
      <div style={{ display: "flex", gap: 24, marginBottom: 16, alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Patch size</span>
          <select
            aria-label="patch size"
            value={patchSize}
            onChange={(e) => setPatchSize(Number(e.target.value))}
          >
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Image size</span>
          <select
            aria-label="image size"
            value={imageSize}
            onChange={(e) => setImageSize(Number(e.target.value))}
          >
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>
          </select>
        </label>
      </div>

      {/* Main layout: full image + zoomed patch */}
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        {/* Full image */}
        <div>
          <div style={{ marginBottom: 6, fontSize: 13, color: "#555" }}>
            Full image ({imageSize}×{imageSize})
          </div>
          <div style={{ display: "inline-block", border: "2px solid #aaa" }}>
            {fullGrid}
          </div>

          {/* Stats */}
          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              lineHeight: 1.8,
              color: "#333",
            }}
          >
            <div>patches: {numPatches}</div>
            <div>tokens per image: {totalPatches}</div>
            <div>
              patch dim: {patchSize}×{patchSize}×3 = {patchDim}
            </div>
          </div>
        </div>

        {/* Zoomed top-left patch */}
        <div>
          <div style={{ marginBottom: 6, fontSize: 13, color: "#555" }}>
            Top-left patch (4× zoom)
          </div>
          <div
            style={{
              display: "inline-block",
              border: "2px solid #bbb",
              padding: 2,
              backgroundColor: "#f9f9f9",
            }}
          >
            {zoomPatch}
          </div>
        </div>
      </div>
    </div>
  );
}
