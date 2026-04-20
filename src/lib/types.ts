export type PaperSlug = string;
export type StageId = "intuition" | "math" | "pseudo" | "code" | "pdf";
export type StageStatus =
  | "locked"
  | "attempted"
  | "revealed"
  | "mastered"
  | "skipped";

export type SrsCard = {
  id: string;
  paperSlug: PaperSlug;
  prompt: string;
  answer: string;
  ease: number;       // SM-2, starts at 2.5
  interval: number;   // days, starts at 1
  due: string;        // ISO date
};

export type Store = {
  version: 1;
  progress: Record<
    PaperSlug,
    {
      stages: Record<StageId, StageStatus>;
      retrievalScores: Record<string, number>;
      startedAt: string;
      completedAt?: string;
    }
  >;
  notes: Record<PaperSlug, Record<string, string>>;
  bookmarks: { paperSlug: PaperSlug; anchor: string; createdAt: string }[];
  srs: { cards: SrsCard[]; lastReview: string };
  settings: { theme: "light" | "dark" | "system"; fontSize: number };
};

export const EMPTY_STORE: Store = {
  version: 1,
  progress: {},
  notes: {},
  bookmarks: [],
  srs: { cards: [], lastReview: new Date(0).toISOString() },
  settings: { theme: "system", fontSize: 16 },
};
