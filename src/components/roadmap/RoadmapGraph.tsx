import type { PaperMeta } from "../../content/papers-meta";
import { ERAS } from "../../lib/eras";

type Props = { papers: PaperMeta[] };

export function RoadmapGraph({ papers }: Props) {
  const yearMin = 2012;
  const yearMax = 2026;
  const yearCount = yearMax - yearMin + 1;

  const laneHeight = 60;
  const yearWidth = 60;
  const totalWidth = yearCount * yearWidth + 120;
  const totalHeight = ERAS.length * laneHeight + 40;

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
          const eraIdxP = ERAS.findIndex((e) => e.id === p.era);
          const eraIdxS = ERAS.findIndex((e) => e.id === src.era);
          return (
            <line
              key={`${srcSlug}->${p.slug}`}
              x1={120 + (src.year - yearMin) * yearWidth}
              y1={40 + eraIdxS * laneHeight + 30}
              x2={120 + (p.year - yearMin) * yearWidth}
              y2={40 + eraIdxP * laneHeight + 30}
              stroke="#cbd5e1"
              strokeWidth={1}
            />
          );
        }),
      )}
      {papers.map((p) => {
        const eraIdx = ERAS.findIndex((e) => e.id === p.era);
        const cx = 120 + (p.year - yearMin) * yearWidth;
        const cy = 40 + eraIdx * laneHeight + 30;
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
              <text x={cx} y={cy + 24} textAnchor="middle" className="text-xs" fill="#111">
                {p.slug}
              </text>
            </a>
          );
        }
        return <g key={p.slug} title={p.title}>{circle}</g>;
      })}
    </svg>
  );
}
