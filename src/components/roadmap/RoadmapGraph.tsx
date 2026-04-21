import type { PaperMeta } from "../../content/papers-meta";
import { ERAS } from "../../lib/eras";

type Props = { papers: PaperMeta[] };

export function RoadmapGraph({ papers }: Props) {
  const yearMin = 2012;
  const yearMax = 2026;
  const yearCount = yearMax - yearMin + 1;

  const laneHeight = 80;
  const yearWidth = 72;
  const totalWidth = yearCount * yearWidth + 120;
  const totalHeight = ERAS.length * laneHeight + 40;

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
  const place = (p: PaperMeta) => {
    const eraIdx = ERAS.findIndex((e) => e.id === p.era);
    const { sub, n } = cellIndex.get(p.slug) ?? { sub: 0, n: 1 };
    const cxOffset = (sub - (n - 1) / 2) * 20;
    const cx = 120 + (p.year - yearMin) * yearWidth + cxOffset;
    const cy = 40 + eraIdx * laneHeight + 34;
    const labelY = cy + 22 + (sub % 2) * 14;
    return { cx, cy, labelY };
  };

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="w-full max-w-5xl mx-auto my-8"
      role="img"
      aria-label="Roadmap of deep learning papers"
    >
      {ERAS.map((era, i) => (
        <text
          key={era.id}
          x={10}
          y={40 + i * laneHeight + 20}
          className="text-xs"
          fill="#666"
        >
          {era.label}
        </text>
      ))}
      {Array.from({ length: yearCount }, (_, i) => (
        <text
          key={i}
          x={120 + i * yearWidth}
          y={20}
          className="text-xs"
          fill="#999"
          textAnchor="middle"
        >
          {yearMin + i}
        </text>
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
        const { cx, cy, labelY } = place(p);
        const common = { cx, cy, r: 10 };
        const fill =
          p.status === "implemented" ? "#2563eb"
          : p.status === "stub" ? "#94a3b8"
          : "#e2e8f0";

        const circle = (
          <circle {...common} fill={fill} stroke="#1e293b" strokeWidth={p.status === "implemented" ? 2 : 1} />
        );

        if (p.status === "implemented") {
          return (
            <a key={p.slug} href={`/papers/${p.slug}`} title={p.title}>
              {circle}
              <text x={cx} y={labelY} textAnchor="middle" className="text-xs" fill="#111">
                {p.slug}
              </text>
            </a>
          );
        }
        return (
          <g key={p.slug} title={p.title}>
            {circle}
            <text x={cx} y={labelY} textAnchor="middle" className="text-xs" fill="#9ca3af">
              {p.slug}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
