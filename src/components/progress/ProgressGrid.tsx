import { useEffect, useState } from "react";
import { loadStore } from "../../lib/storage";
import { PAPERS_META } from "../../content/papers-meta";
import type { StageStatus } from "../../lib/types";

const STAGES = ["intuition", "math", "pseudo", "code", "pdf"] as const;

function bg(status: StageStatus): string {
  switch (status) {
    case "mastered": return "bg-green-500";
    case "revealed": return "bg-yellow-400";
    case "attempted": return "bg-blue-300";
    case "skipped":  return "bg-red-400";
    default:         return "bg-neutral-200";
  }
}

export function ProgressGrid() {
  const [store, setStore] = useState(loadStore());
  useEffect(() => { setStore(loadStore()); }, []);

  const implemented = PAPERS_META.filter((p) => p.status === "implemented");

  return (
    <table className="my-4 text-sm border-collapse">
      <thead>
        <tr>
          <th className="text-left pr-4">Paper</th>
          {STAGES.map((s) => <th key={s} className="px-2">{s}</th>)}
        </tr>
      </thead>
      <tbody>
        {implemented.map((p) => {
          const prog = store.progress[p.slug];
          return (
            <tr key={p.slug}>
              <td className="pr-4 py-1"><a href={`/papers/${p.slug}`} className="text-blue-600">{p.title}</a></td>
              {STAGES.map((s) => (
                <td key={s} className="px-1 py-1">
                  <div className={`w-6 h-6 rounded ${bg(prog?.stages[s] ?? "locked")}`} title={prog?.stages[s] ?? "locked"} />
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
