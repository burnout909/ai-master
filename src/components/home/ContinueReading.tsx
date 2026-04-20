import { useEffect, useState } from "react";
import { loadStore } from "../../lib/storage";
import { PAPERS_META } from "../../content/papers-meta";

export function ContinueReading() {
  const [entry, setEntry] = useState<{ slug: string; stage: string } | null>(null);

  useEffect(() => {
    const store = loadStore();
    const entries = Object.entries(store.progress);
    if (entries.length === 0) return setEntry(null);
    const ranked = entries.sort(
      (a, b) => (b[1].startedAt > a[1].startedAt ? 1 : -1),
    );
    for (const [slug, p] of ranked) {
      if (p.completedAt) continue;
      const nextStage =
        (["intuition", "math", "pseudo", "code", "pdf"] as const).find(
          (s) => p.stages[s] !== "mastered",
        ) ?? "pdf";
      return setEntry({ slug, stage: nextStage });
    }
    setEntry(null);
  }, []);

  if (!entry) return null;
  const paper = PAPERS_META.find((p) => p.slug === entry.slug);
  if (!paper) return null;

  return (
    <a
      href={`/papers/${entry.slug}#${entry.stage}`}
      className="block p-4 border rounded-lg bg-blue-50 hover:bg-blue-100"
    >
      <p className="text-xs text-neutral-600">Continue reading</p>
      <p className="font-semibold">{paper.title}</p>
      <p className="text-sm text-neutral-700">Stage: {entry.stage}</p>
    </a>
  );
}
