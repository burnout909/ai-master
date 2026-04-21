import type { PaperMeta } from "../../content/papers-meta";
import { ERAS } from "../../lib/eras";

type Props = { papers: PaperMeta[] };

export function RoadmapGraph({ papers }: Props) {
  const yearMin = 2012;
  const yearMax = 2026;
  const yearCount = yearMax - yearMin + 1;

  const yearWidth = 84;
  const rowGap = 26;
  const circleR = 9;
  const leftPad = 140;
  const topPad = 50;

  const cellBuckets = new Map<string, PaperMeta[]>();
  for (const p of papers) {
    const k = `${p.era}:${p.year}`;
    const arr = cellBuckets.get(k) ?? [];
    arr.push(p);
    cellBuckets.set(k, arr);
  }
  const cellIndex = new Map<string, { sub: number; n: number }>();
  for (const arr of cellBuckets.values()) {
    arr.forEach((p, i) => cellIndex.set(p.slug, { sub: i, n: arr.length }));
  }

  const laneMaxN: number[] = ERAS.map((era) => {
    let max = 1;
    for (const [k, arr] of cellBuckets) {
      if (k.startsWith(`${era.id}:`) && arr.length > max) max = arr.length;
    }
    return max;
  });
  const laneHeights = laneMaxN.map((n) => Math.max(60, n * rowGap + 32));
  const laneTops: number[] = [];
  let acc = topPad;
  for (const h of laneHeights) {
    laneTops.push(acc);
    acc += h;
  }
  const totalHeight = acc + 20;
  const totalWidth = leftPad + yearCount * yearWidth + 40;

  const place = (p: PaperMeta) => {
    const eraIdx = ERAS.findIndex((e) => e.id === p.era);
    const { sub, n } = cellIndex.get(p.slug) ?? { sub: 0, n: 1 };
    const laneTop = laneTops[eraIdx];
    const laneH = laneHeights[eraIdx];
    const laneCenter = laneTop + laneH / 2;
    const cy = laneCenter + (sub - (n - 1) / 2) * rowGap;
    const cx = leftPad + (p.year - yearMin) * yearWidth;
    return { cx, cy };
  };

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="w-full max-w-5xl mx-auto my-8"
      role="img"
      aria-label="Roadmap of deep learning papers"
    >
      {ERAS.map((era, i) => {
        const top = laneTops[i];
        const h = laneHeights[i];
        return (
          <g key={era.id}>
            {i > 0 && (
              <line
                x1={0}
                x2={totalWidth}
                y1={top}
                y2={top}
                stroke="#e6e2da"
                strokeWidth={1}
              />
            )}
            <text
              x={16}
              y={top + h / 2 + 4}
              className="text-xs"
              fill="#6b6b72"
            >
              {era.label}
            </text>
          </g>
        );
      })}
      {Array.from({ length: yearCount }, (_, i) => (
        <g key={i}>
          <text
            x={leftPad + i * yearWidth}
            y={28}
            className="text-xs"
            fill="#9ca3af"
            textAnchor="middle"
          >
            {yearMin + i}
          </text>
        </g>
      ))}
      {papers.flatMap((p) =>
        (p.influencedBy ?? []).map((srcSlug) => {
          const src = papers.find((q) => q.slug === srcSlug);
          if (!src) return null;
          const from = place(src);
          const to = place(p);
          return (
            <line
              key={`${srcSlug}->${p.slug}`}
              x1={from.cx}
              y1={from.cy}
              x2={to.cx}
              y2={to.cy}
              stroke="#cbd5e1"
              strokeWidth={1}
            />
          );
        }),
      )}
      {papers.map((p) => {
        const { cx, cy } = place(p);
        const labelX = cx + circleR + 6;
        const fill =
          p.status === "implemented" ? "#2563eb"
          : p.status === "stub" ? "#94a3b8"
          : "#e2e8f0";
        const labelFill =
          p.status === "implemented" ? "#0a0a0b" : "#9ca3af";
        const circle = (
          <circle
            cx={cx}
            cy={cy}
            r={circleR}
            fill={fill}
            stroke="#1e293b"
            strokeWidth={p.status === "implemented" ? 1.5 : 1}
          />
        );
        const label = (
          <text
            x={labelX}
            y={cy + 4}
            className="text-[11px]"
            textAnchor="start"
            fill={labelFill}
          >
            {p.slug}
          </text>
        );
        if (p.status === "implemented") {
          return (
            <a key={p.slug} href={`/papers/${p.slug}`} title={p.title}>
              {circle}
              {label}
            </a>
          );
        }
        return (
          <g key={p.slug} title={p.title}>
            {circle}
            {label}
          </g>
        );
      })}
    </svg>
  );
}
