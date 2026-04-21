import { loadStore } from "../storage";
import type { ProgressSnapshot, StageId } from "./types";

const STAGE_ORDER: StageId[] = ["intuition", "math", "pseudo", "code"];

export function computeSnapshot(): ProgressSnapshot {
  if (typeof localStorage === "undefined") return { completed: [], inProgress: [] };
  const store = loadStore();
  const completed: string[] = [];
  const inProgress: { slug: string; stage: StageId }[] = [];
  for (const [slug, p] of Object.entries(store.progress ?? {})) {
    const allMastered = STAGE_ORDER.every((s) => (p.stages as any)?.[s] === "mastered");
    if (allMastered) { completed.push(slug); continue; }
    const current = STAGE_ORDER.find((s) => (p.stages as any)?.[s] === "revealed")
      ?? STAGE_ORDER.find((s) => (p.stages as any)?.[s] !== "locked" && (p.stages as any)?.[s] !== "mastered")
      ?? "intuition";
    inProgress.push({ slug, stage: current });
  }
  return { completed, inProgress };
}
