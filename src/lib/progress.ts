import type { PaperSlug, StageId, StageStatus } from "./types";
import { loadStore, updateStore } from "./storage";

const STAGE_ORDER: StageId[] = ["intuition", "math", "pseudo", "code", "pdf"];

export function initPaperProgress(slug: PaperSlug): void {
  updateStore((s) => {
    if (s.progress[slug]) return s;
    return {
      ...s,
      progress: {
        ...s.progress,
        [slug]: {
          stages: STAGE_ORDER.reduce(
            (acc, stage) => ({ ...acc, [stage]: "locked" }),
            {} as Record<StageId, StageStatus>,
          ),
          retrievalScores: {},
          startedAt: new Date().toISOString(),
        },
      },
    };
  });
}

export function setStageStatus(
  slug: PaperSlug,
  stage: StageId,
  status: StageStatus,
): void {
  updateStore((s) => {
    const paper = s.progress[slug];
    if (!paper) throw new Error(`Paper ${slug} not initialized`);
    const nextStages = { ...paper.stages, [stage]: status };
    const completedAt = STAGE_ORDER.every((st) => nextStages[st] === "mastered")
      ? new Date().toISOString()
      : paper.completedAt;
    return {
      ...s,
      progress: {
        ...s.progress,
        [slug]: { ...paper, stages: nextStages, completedAt },
      },
    };
  });
}

export function getStageStatus(slug: PaperSlug, stage: StageId): StageStatus {
  const paper = loadStore().progress[slug];
  return paper?.stages[stage] ?? "locked";
}

export function isStageUnlocked(slug: PaperSlug, stage: StageId): boolean {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx === 0) return true;
  const prev = STAGE_ORDER[idx - 1];
  const prevStatus = getStageStatus(slug, prev);
  return prevStatus === "mastered" || prevStatus === "skipped";
}

export function allStagesMastered(slug: PaperSlug): boolean {
  const paper = loadStore().progress[slug];
  if (!paper) return false;
  return STAGE_ORDER.every((st) => paper.stages[st] === "mastered");
}
