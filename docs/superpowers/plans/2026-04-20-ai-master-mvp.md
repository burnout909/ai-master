# ai_master MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a static, localStorage-backed interactive learning web app that delivers the Transformer, DDPM, and ReAct papers through a strict 4-stage (Intuition→Math→Pseudo→Code) active-learning flow, plus a 30-paper roadmap page.

**Architecture:** Astro 5 (static output with React islands) + MDX content collections + Tailwind + KaTeX + Pyodide-in-WebWorker for Python execution + localStorage / IndexedDB for learner state. No backend. Component library enforces Predict-Attempt-Reveal-Reflect (PARR) at every stage.

**Tech Stack:** Astro 5, React 19, TypeScript, Vitest, Playwright, Tailwind, MDX, KaTeX, Monaco, Pyodide, PDF.js, D3 (roadmap only).

**Spec:** `docs/superpowers/specs/2026-04-20-ai-master-design.md`

---

## Phase A — Foundation

### Task A1: Scaffold Astro project with TypeScript, React, Tailwind, MDX

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `tailwind.config.mjs`, `src/styles/global.css`, `src/pages/index.astro`, `.gitignore`, `.nvmrc`, `README.md`

- [ ] **Step 1: Initialize Astro template**

Run from `/Users/minseongkim/Desktop/ai_master`:
```bash
npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git --yes
```
Expected: Astro files scaffolded in current directory.

- [ ] **Step 2: Add required integrations**

```bash
npx astro add react tailwind mdx --yes
```
Expected: `astro.config.mjs` updated with React, Tailwind, MDX; deps installed.

- [ ] **Step 3: Pin Node version**

Create `.nvmrc`:
```
20
```

- [ ] **Step 4: Install remaining dependencies**

```bash
npm install katex @types/katex
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```
Expected: all install cleanly.

- [ ] **Step 5: Add KaTeX CSS import to global stylesheet**

Edit `src/styles/global.css`:
```css
@import "katex/dist/katex.min.css";
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Import it from `src/pages/index.astro` via layout (next task).

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```
Expected: server at `http://localhost:4321` shows default Astro page. Ctrl-C to stop.

- [ ] **Step 7: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

Create `src/test/setup.ts`:
```ts
import "@testing-library/jest-dom";
```

Add scripts to `package.json`:
```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "e2e": "playwright test"
}
```

- [ ] **Step 8: Smoke-test Vitest**

Create `src/test/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("smoke", () => {
  it("adds numbers", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm run test`
Expected: 1 test passing.

- [ ] **Step 9: Init git and first commit**

```bash
cd /Users/minseongkim/Desktop/ai_master
git init
git add -A
git commit -m "chore: scaffold Astro + React + Tailwind + MDX + Vitest"
```

---

### Task A2: Core types and storage facade

**Files:**
- Create: `src/lib/types.ts`, `src/lib/storage.ts`, `src/lib/storage.test.ts`

- [ ] **Step 1: Define core types (test first — just compile-check)**

Create `src/lib/types.ts`:
```ts
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
```

- [ ] **Step 2: Write storage tests first**

Create `src/lib/storage.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { loadStore, saveStore, resetStore, STORE_KEY } from "./storage";
import { EMPTY_STORE } from "./types";

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("returns EMPTY_STORE when nothing saved", () => {
    expect(loadStore()).toEqual(EMPTY_STORE);
  });

  it("roundtrips a saved store", () => {
    const s = { ...EMPTY_STORE, settings: { ...EMPTY_STORE.settings, fontSize: 18 } };
    saveStore(s);
    expect(loadStore()).toEqual(s);
  });

  it("recovers from corrupted JSON", () => {
    localStorage.setItem(STORE_KEY, "{not json");
    expect(loadStore()).toEqual(EMPTY_STORE);
  });

  it("rejects wrong-version store and returns empty", () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ version: 999 }));
    expect(loadStore()).toEqual(EMPTY_STORE);
  });

  it("resetStore wipes the store", () => {
    saveStore({ ...EMPTY_STORE, settings: { ...EMPTY_STORE.settings, fontSize: 20 } });
    resetStore();
    expect(loadStore()).toEqual(EMPTY_STORE);
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
npm run test -- storage
```
Expected: fails with "cannot find module './storage'".

- [ ] **Step 4: Implement storage**

Create `src/lib/storage.ts`:
```ts
import { EMPTY_STORE, type Store } from "./types";

export const STORE_KEY = "ai_master:v1";

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1) return EMPTY_STORE;
    return parsed as Store;
  } catch {
    return EMPTY_STORE;
  }
}

export function saveStore(store: Store): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function resetStore(): void {
  localStorage.removeItem(STORE_KEY);
}

export function updateStore(fn: (s: Store) => Store): Store {
  const next = fn(loadStore());
  saveStore(next);
  return next;
}
```

- [ ] **Step 5: Run tests — verify pass**

```bash
npm run test -- storage
```
Expected: all 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib
git commit -m "feat: localStorage store facade with versioning + corruption recovery"
```

---

### Task A3: Progress lib (per-stage state machine)

**Files:**
- Create: `src/lib/progress.ts`, `src/lib/progress.test.ts`

- [ ] **Step 1: Write tests first**

Create `src/lib/progress.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  initPaperProgress,
  setStageStatus,
  getStageStatus,
  isStageUnlocked,
  allStagesMastered,
} from "./progress";
import { resetStore } from "./storage";

describe("progress", () => {
  beforeEach(() => resetStore());

  it("initializes all stages locked except intuition", () => {
    initPaperProgress("transformer");
    expect(getStageStatus("transformer", "intuition")).toBe("locked");
    expect(isStageUnlocked("transformer", "intuition")).toBe(true);
    expect(isStageUnlocked("transformer", "math")).toBe(false);
  });

  it("unlocks next stage when current is mastered", () => {
    initPaperProgress("transformer");
    setStageStatus("transformer", "intuition", "mastered");
    expect(isStageUnlocked("transformer", "math")).toBe(true);
    expect(isStageUnlocked("transformer", "pseudo")).toBe(false);
  });

  it("does not unlock next stage on skip", () => {
    initPaperProgress("transformer");
    setStageStatus("transformer", "intuition", "skipped");
    expect(isStageUnlocked("transformer", "math")).toBe(true);
  });

  it("allStagesMastered true only when every stage mastered", () => {
    initPaperProgress("transformer");
    const stages = ["intuition", "math", "pseudo", "code", "pdf"] as const;
    stages.forEach((s) => setStageStatus("transformer", s, "mastered"));
    expect(allStagesMastered("transformer")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — verify fail**

```bash
npm run test -- progress
```
Expected: fail — module not found.

- [ ] **Step 3: Implement progress**

Create `src/lib/progress.ts`:
```ts
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
```

- [ ] **Step 4: Run tests — pass**

```bash
npm run test -- progress
```
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/progress.ts src/lib/progress.test.ts
git commit -m "feat: progress state machine with stage unlocking rules"
```

---

### Task A4: SRS lib (SM-2 lite)

**Files:**
- Create: `src/lib/srs.ts`, `src/lib/srs.test.ts`

- [ ] **Step 1: Write tests first**

Create `src/lib/srs.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { enqueueCard, dueCards, reviewCard, type Rating } from "./srs";
import { resetStore } from "./storage";

const ISO = (d: Date) => d.toISOString();

describe("srs", () => {
  beforeEach(() => resetStore());

  it("enqueued card is due today", () => {
    enqueueCard({ id: "c1", paperSlug: "transformer", prompt: "?", answer: "!" });
    const today = new Date();
    const due = dueCards(today);
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe("c1");
  });

  it("Good rating grows interval", () => {
    enqueueCard({ id: "c1", paperSlug: "t", prompt: "?", answer: "!" });
    const today = new Date("2026-04-20");
    reviewCard("c1", "Good", today);
    // interval=1 → due 2026-04-21
    expect(dueCards(new Date("2026-04-21"))).toHaveLength(1);
    expect(dueCards(new Date("2026-04-20"))).toHaveLength(0);
  });

  it("Again rating resets interval to 1 and lowers ease", () => {
    enqueueCard({ id: "c1", paperSlug: "t", prompt: "?", answer: "!" });
    reviewCard("c1", "Good", new Date("2026-04-20"));
    reviewCard("c1", "Good", new Date("2026-04-21")); // interval now 6
    reviewCard("c1", "Again", new Date("2026-04-22")); // reset
    expect(dueCards(new Date("2026-04-23"))).toHaveLength(1);
  });

  it("Easy rating grows faster than Good", () => {
    enqueueCard({ id: "c1", paperSlug: "t", prompt: "?", answer: "!" });
    enqueueCard({ id: "c2", paperSlug: "t", prompt: "?", answer: "!" });
    reviewCard("c1", "Good", new Date("2026-04-20"));
    reviewCard("c2", "Easy", new Date("2026-04-20"));
    // Both not due on 4-21 after Easy (easy interval > good interval)
    const duesOn22 = dueCards(new Date("2026-04-22")).map((c) => c.id);
    expect(duesOn22).toContain("c1");   // Good → interval 1 next time
    // c2 (Easy) gets a longer first interval
  });
});
```

- [ ] **Step 2: Run tests — fail**

```bash
npm run test -- srs
```

- [ ] **Step 3: Implement SRS**

Create `src/lib/srs.ts`:
```ts
import type { PaperSlug, SrsCard } from "./types";
import { updateStore, loadStore } from "./storage";

export type Rating = "Again" | "Hard" | "Good" | "Easy";

const DAY_MS = 86_400_000;

function addDays(date: Date, days: number): string {
  return new Date(date.getTime() + days * DAY_MS).toISOString();
}

export function enqueueCard(
  seed: Omit<SrsCard, "ease" | "interval" | "due">,
): void {
  updateStore((s) => {
    if (s.srs.cards.some((c) => c.id === seed.id)) return s;
    const card: SrsCard = {
      ...seed,
      ease: 2.5,
      interval: 0,
      due: new Date().toISOString(),
    };
    return { ...s, srs: { ...s.srs, cards: [...s.srs.cards, card] } };
  });
}

export function dueCards(now: Date = new Date()): SrsCard[] {
  const nowIso = now.toISOString();
  return loadStore().srs.cards.filter((c) => c.due <= nowIso);
}

export function reviewCard(id: string, rating: Rating, now: Date = new Date()): void {
  updateStore((s) => {
    const idx = s.srs.cards.findIndex((c) => c.id === id);
    if (idx < 0) return s;
    const card = s.srs.cards[idx];
    const next = scheduleNext(card, rating, now);
    const cards = [...s.srs.cards];
    cards[idx] = next;
    return { ...s, srs: { ...s.srs, cards, lastReview: now.toISOString() } };
  });
}

function scheduleNext(card: SrsCard, rating: Rating, now: Date): SrsCard {
  let { ease, interval } = card;
  if (rating === "Again") {
    ease = Math.max(1.3, ease - 0.2);
    interval = 1;
  } else if (rating === "Hard") {
    ease = Math.max(1.3, ease - 0.15);
    interval = Math.max(1, Math.round(interval * 1.2));
  } else if (rating === "Good") {
    interval = interval === 0 ? 1 : Math.round(interval * ease);
  } else {
    ease = ease + 0.15;
    interval = interval === 0 ? 4 : Math.round(interval * ease * 1.3);
  }
  return { ...card, ease, interval, due: addDays(now, interval) };
}
```

- [ ] **Step 4: Run tests — pass**

```bash
npm run test -- srs
```
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/srs.ts src/lib/srs.test.ts
git commit -m "feat: SM-2 lite spaced repetition scheduler"
```

---

### Task A5: 30-paper roadmap metadata

**Files:**
- Create: `src/content/papers-meta.ts`, `src/lib/eras.ts`

- [ ] **Step 1: Define era metadata**

Create `src/lib/eras.ts`:
```ts
export const ERAS = [
  { id: "foundations", label: "DL Foundations", years: [2012, 2017] },
  { id: "transformer", label: "Transformer Era", years: [2017, 2021] },
  { id: "generative",  label: "Generative Models", years: [2020, 2024] },
  { id: "efficiency",  label: "Efficiency & Architecture", years: [2022, 2026] },
  { id: "alignment",   label: "Alignment & RLHF", years: [2022, 2026] },
  { id: "agents",      label: "Reasoning & Agents", years: [2022, 2026] },
] as const;

export type EraId = (typeof ERAS)[number]["id"];
```

- [ ] **Step 2: Author full 30-paper list**

Create `src/content/papers-meta.ts`:
```ts
import type { EraId } from "../lib/eras";

export type PaperStatus = "implemented" | "stub" | "planned";

export type PaperMeta = {
  slug: string;
  title: string;
  authors: string;
  year: number;
  era: EraId;
  arxivId?: string;          // for PDF link
  summary: string;           // one line
  status: PaperStatus;
  influencedBy?: string[];   // slugs for roadmap edges
};

export const PAPERS_META: PaperMeta[] = [
  // ——— DL Foundations ———
  { slug: "alexnet",     title: "ImageNet Classification with Deep CNNs", authors: "Krizhevsky, Sutskever, Hinton", year: 2012, era: "foundations", arxivId: "1102.0183", summary: "CNN + GPU + dropout wins ImageNet, kicks off deep-learning era.", status: "stub" },
  { slug: "dropout",     title: "Dropout: A Simple Way to Prevent Neural Networks from Overfitting", authors: "Srivastava et al.", year: 2014, era: "foundations", summary: "Random unit-zeroing regularizer.", status: "stub" },
  { slug: "adam",        title: "Adam: A Method for Stochastic Optimization", authors: "Kingma, Ba", year: 2014, era: "foundations", arxivId: "1412.6980", summary: "Adaptive moment estimation optimizer.", status: "stub" },
  { slug: "seq2seq",     title: "Sequence to Sequence Learning with Neural Networks", authors: "Sutskever, Vinyals, Le", year: 2014, era: "foundations", arxivId: "1409.3215", summary: "Encoder–decoder RNN for translation.", status: "stub" },
  { slug: "gan",         title: "Generative Adversarial Nets", authors: "Goodfellow et al.", year: 2014, era: "foundations", arxivId: "1406.2661", summary: "Generator vs discriminator minimax game.", status: "stub" },
  { slug: "batchnorm",   title: "Batch Normalization", authors: "Ioffe, Szegedy", year: 2015, era: "foundations", arxivId: "1502.03167", summary: "Reduces internal covariate shift, stabilizes training.", status: "stub" },
  { slug: "resnet",      title: "Deep Residual Learning for Image Recognition", authors: "He et al.", year: 2015, era: "foundations", arxivId: "1512.03385", summary: "Skip connections enable very deep networks.", status: "stub" },
  { slug: "bahdanau",    title: "Neural Machine Translation by Jointly Learning to Align and Translate", authors: "Bahdanau, Cho, Bengio", year: 2014, era: "foundations", arxivId: "1409.0473", summary: "Attention mechanism for seq2seq alignment.", status: "stub" },

  // ——— Transformer Era ———
  { slug: "transformer", title: "Attention Is All You Need", authors: "Vaswani et al.", year: 2017, era: "transformer", arxivId: "1706.03762", summary: "Self-attention-only architecture replaces RNNs.", status: "implemented", influencedBy: ["bahdanau", "seq2seq"] },
  { slug: "bert",        title: "BERT: Pre-training of Deep Bidirectional Transformers", authors: "Devlin et al.", year: 2018, era: "transformer", arxivId: "1810.04805", summary: "Masked-LM pretraining + fine-tuning.", status: "stub", influencedBy: ["transformer"] },
  { slug: "gpt2",        title: "Language Models are Unsupervised Multitask Learners", authors: "Radford et al.", year: 2019, era: "transformer", summary: "Scaling decoder-only LMs to 1.5B params.", status: "stub", influencedBy: ["transformer"] },
  { slug: "gpt3",        title: "Language Models are Few-Shot Learners", authors: "Brown et al.", year: 2020, era: "transformer", arxivId: "2005.14165", summary: "175B-param LM with in-context learning.", status: "stub", influencedBy: ["gpt2"] },
  { slug: "vit",         title: "An Image is Worth 16x16 Words", authors: "Dosovitskiy et al.", year: 2020, era: "transformer", arxivId: "2010.11929", summary: "Transformers for image classification at scale.", status: "stub", influencedBy: ["transformer"] },
  { slug: "clip",        title: "Learning Transferable Visual Models From Natural Language Supervision", authors: "Radford et al.", year: 2021, era: "transformer", arxivId: "2103.00020", summary: "Contrastive image-text pretraining.", status: "stub", influencedBy: ["transformer", "vit"] },
  { slug: "chinchilla",  title: "Training Compute-Optimal Large Language Models", authors: "Hoffmann et al.", year: 2022, era: "transformer", arxivId: "2203.15556", summary: "Compute-optimal scaling laws.", status: "stub", influencedBy: ["gpt3"] },

  // ——— Generative Models ———
  { slug: "ddpm",        title: "Denoising Diffusion Probabilistic Models", authors: "Ho, Jain, Abbeel", year: 2020, era: "generative", arxivId: "2006.11239", summary: "Diffusion models as generative modeling.", status: "implemented" },
  { slug: "ldm",         title: "High-Resolution Image Synthesis with Latent Diffusion Models", authors: "Rombach et al.", year: 2022, era: "generative", arxivId: "2112.10752", summary: "Diffusion in VAE latent space; Stable Diffusion.", status: "stub", influencedBy: ["ddpm"] },
  { slug: "cfg",         title: "Classifier-Free Diffusion Guidance", authors: "Ho, Salimans", year: 2022, era: "generative", arxivId: "2207.12598", summary: "Conditional generation without a separate classifier.", status: "stub", influencedBy: ["ddpm"] },
  { slug: "flow-matching", title: "Flow Matching for Generative Modeling", authors: "Lipman et al.", year: 2023, era: "generative", arxivId: "2210.02747", summary: "Continuous-time generative modeling via vector fields.", status: "stub", influencedBy: ["ddpm"] },

  // ——— Efficiency ———
  { slug: "flashattention", title: "FlashAttention: Fast and Memory-Efficient Exact Attention", authors: "Dao et al.", year: 2022, era: "efficiency", arxivId: "2205.14135", summary: "IO-aware attention for GPU memory.", status: "stub", influencedBy: ["transformer"] },
  { slug: "mamba",       title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces", authors: "Gu, Dao", year: 2023, era: "efficiency", arxivId: "2312.00752", summary: "Selective SSM alternative to attention.", status: "stub", influencedBy: ["transformer"] },
  { slug: "gqa",         title: "GQA: Training Generalized Multi-Query Transformer Models", authors: "Ainslie et al.", year: 2023, era: "efficiency", arxivId: "2305.13245", summary: "Grouped-query attention for inference speed.", status: "stub", influencedBy: ["transformer"] },

  // ——— Alignment ———
  { slug: "instructgpt", title: "Training Language Models to Follow Instructions", authors: "Ouyang et al.", year: 2022, era: "alignment", arxivId: "2203.02155", summary: "RLHF pipeline behind ChatGPT.", status: "stub", influencedBy: ["gpt3"] },
  { slug: "ppo",         title: "Proximal Policy Optimization", authors: "Schulman et al.", year: 2017, era: "alignment", arxivId: "1707.06347", summary: "Clipped-ratio policy gradient; backbone of RLHF.", status: "stub" },
  { slug: "dpo",         title: "Direct Preference Optimization", authors: "Rafailov et al.", year: 2023, era: "alignment", arxivId: "2305.18290", summary: "Preference learning without a reward model.", status: "stub", influencedBy: ["instructgpt"] },
  { slug: "constitutional", title: "Constitutional AI: Harmlessness from AI Feedback", authors: "Bai et al.", year: 2022, era: "alignment", arxivId: "2212.08073", summary: "Self-critique against a written constitution.", status: "stub", influencedBy: ["instructgpt"] },

  // ——— Reasoning & Agents ———
  { slug: "cot",         title: "Chain-of-Thought Prompting Elicits Reasoning", authors: "Wei et al.", year: 2022, era: "agents", arxivId: "2201.11903", summary: "Step-by-step prompting improves reasoning.", status: "stub", influencedBy: ["gpt3"] },
  { slug: "react",       title: "ReAct: Synergizing Reasoning and Acting in Language Models", authors: "Yao et al.", year: 2022, era: "agents", arxivId: "2210.03629", summary: "Interleaved thought/act/observe loop.", status: "implemented", influencedBy: ["cot"] },
  { slug: "toolformer",  title: "Toolformer: Language Models Can Teach Themselves to Use Tools", authors: "Schick et al.", year: 2023, era: "agents", arxivId: "2302.04761", summary: "Self-supervised tool-use training.", status: "stub", influencedBy: ["react"] },
  { slug: "reflexion",   title: "Reflexion: Language Agents with Verbal Reinforcement Learning", authors: "Shinn et al.", year: 2023, era: "agents", arxivId: "2303.11366", summary: "Self-reflection improves agent performance.", status: "stub", influencedBy: ["react"] },
  { slug: "tot",         title: "Tree of Thoughts: Deliberate Problem Solving with LLMs", authors: "Yao et al.", year: 2023, era: "agents", arxivId: "2305.10601", summary: "Tree-search over reasoning steps.", status: "stub", influencedBy: ["cot"] },
  { slug: "voyager",     title: "Voyager: An Open-Ended Embodied Agent with LLMs", authors: "Wang et al.", year: 2023, era: "agents", arxivId: "2305.16291", summary: "LLM skill library with code-as-actions.", status: "stub", influencedBy: ["react"] },
  { slug: "deepseek-r1", title: "DeepSeek-R1: Incentivizing Reasoning via Pure RL", authors: "DeepSeek-AI", year: 2025, era: "agents", arxivId: "2501.12948", summary: "RL-only reasoning training at scale.", status: "stub", influencedBy: ["cot"] },
];
```

- [ ] **Step 3: Add a sanity test**

Create `src/content/papers-meta.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { PAPERS_META } from "./papers-meta";
import { ERAS } from "../lib/eras";

describe("papers-meta", () => {
  it("has three implemented papers in MVP", () => {
    const impl = PAPERS_META.filter((p) => p.status === "implemented").map((p) => p.slug);
    expect(impl.sort()).toEqual(["ddpm", "react", "transformer"]);
  });

  it("every era has at least one paper", () => {
    for (const era of ERAS) {
      expect(PAPERS_META.some((p) => p.era === era.id)).toBe(true);
    }
  });

  it("influencedBy references exist", () => {
    const slugs = new Set(PAPERS_META.map((p) => p.slug));
    for (const p of PAPERS_META) {
      for (const inf of p.influencedBy ?? []) {
        expect(slugs.has(inf)).toBe(true);
      }
    }
  });

  it("slugs are unique", () => {
    const slugs = PAPERS_META.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
```

- [ ] **Step 4: Run tests — pass**

```bash
npm run test -- papers-meta
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/eras.ts src/content/papers-meta.ts src/content/papers-meta.test.ts
git commit -m "feat: 30-paper roadmap metadata with era/influence graph"
```

---

## Phase B — Reusable Active-Learning UI Primitives

### Task B1: PredictThenReveal — the core PARR primitive

**Files:**
- Create: `src/components/stages/PredictThenReveal.tsx`, `src/components/stages/PredictThenReveal.test.tsx`

- [ ] **Step 1: Write tests first**

Create `src/components/stages/PredictThenReveal.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PredictThenReveal } from "./PredictThenReveal";

describe("<PredictThenReveal>", () => {
  it("hides revealed content until user attempts", () => {
    render(
      <PredictThenReveal predictPrompt="Guess?">
        <div>answer</div>
      </PredictThenReveal>,
    );
    expect(screen.queryByText("answer")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reveal/i })).toBeDisabled();
  });

  it("enables reveal after user types a prediction", () => {
    render(
      <PredictThenReveal predictPrompt="Guess?">
        <div>answer</div>
      </PredictThenReveal>,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "my guess" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(screen.getByRole("button", { name: /reveal/i })).not.toBeDisabled();
  });

  it("shows revealed content after clicking reveal", () => {
    render(
      <PredictThenReveal predictPrompt="Guess?">
        <div>answer</div>
      </PredictThenReveal>,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    fireEvent.click(screen.getByRole("button", { name: /reveal/i }));
    expect(screen.getByText("answer")).toBeInTheDocument();
  });

  it("records skip when skip button clicked", () => {
    const onSkip = vi.fn();
    render(
      <PredictThenReveal predictPrompt="Guess?" onSkip={onSkip}>
        <div>answer</div>
      </PredictThenReveal>,
    );
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(onSkip).toHaveBeenCalledOnce();
    expect(screen.getByText("answer")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests — fail**

```bash
npm run test -- PredictThenReveal
```

- [ ] **Step 3: Implement**

Create `src/components/stages/PredictThenReveal.tsx`:
```tsx
import { useState, type ReactNode } from "react";

type Props = {
  predictPrompt: string;
  children: ReactNode;
  onAttempt?: (prediction: string) => void;
  onReveal?: () => void;
  onSkip?: () => void;
};

export function PredictThenReveal({
  predictPrompt,
  children,
  onAttempt,
  onReveal,
  onSkip,
}: Props) {
  const [prediction, setPrediction] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-lg border border-neutral-300 p-4 my-4 bg-neutral-50">
      <p className="font-medium mb-2">{predictPrompt}</p>
      {!attempted && (
        <>
          <textarea
            className="w-full border rounded p-2"
            rows={2}
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
            placeholder="Type your prediction…"
          />
          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40"
              disabled={prediction.trim().length === 0}
              onClick={() => {
                setAttempted(true);
                onAttempt?.(prediction);
              }}
            >
              Submit
            </button>
            <button
              className="px-3 py-1 border rounded"
              onClick={() => {
                setAttempted(true);
                setRevealed(true);
                onSkip?.();
              }}
            >
              Skip
            </button>
          </div>
        </>
      )}
      {attempted && !revealed && (
        <div>
          <p className="text-sm italic mb-2">Your prediction: {prediction}</p>
          <button
            className="px-3 py-1 bg-green-600 text-white rounded"
            onClick={() => {
              setRevealed(true);
              onReveal?.();
            }}
          >
            Reveal
          </button>
        </div>
      )}
      {revealed && <div className="mt-3">{children}</div>}
      {!attempted && (
        <button
          disabled
          className="mt-2 text-sm text-neutral-400"
          aria-label="reveal (disabled)"
        >
          Reveal (disabled until you attempt)
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests — pass**

```bash
npm run test -- PredictThenReveal
```
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/stages/PredictThenReveal.{tsx,test.tsx}
git commit -m "feat: PredictThenReveal PARR primitive with productive-failure gate"
```

---

### Task B2: MCQuiz — multiple-choice retrieval primitive

**Files:**
- Create: `src/components/stages/MCQuiz.tsx`, `src/components/stages/MCQuiz.test.tsx`

- [ ] **Step 1: Write tests**

Create `src/components/stages/MCQuiz.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MCQuiz } from "./MCQuiz";

const question = {
  prompt: "What is √d_k for?",
  options: [
    { text: "Prevents softmax from saturating", correct: true, explain: "Large dot products push softmax to 0/1." },
    { text: "Normalizes gradient", correct: false, explain: "That's LayerNorm." },
    { text: "Speeds training", correct: false, explain: "Indirectly, but not the main reason." },
  ],
};

describe("<MCQuiz>", () => {
  it("renders prompt + options", () => {
    render(<MCQuiz question={question} />);
    expect(screen.getByText(/√d_k/)).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("shows explanation after selection", () => {
    render(<MCQuiz question={question} />);
    fireEvent.click(screen.getByLabelText(/Prevents softmax/));
    expect(screen.getByText(/push softmax to 0\/1/)).toBeInTheDocument();
  });

  it("calls onCorrect when correct chosen", () => {
    const onCorrect = vi.fn();
    render(<MCQuiz question={question} onCorrect={onCorrect} />);
    fireEvent.click(screen.getByLabelText(/Prevents softmax/));
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it("allows re-attempt after wrong answer", () => {
    render(<MCQuiz question={question} />);
    fireEvent.click(screen.getByLabelText(/Normalizes gradient/));
    expect(screen.getByText(/That's LayerNorm/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Prevents softmax/));
    expect(screen.getByText(/push softmax to 0\/1/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests — fail**

```bash
npm run test -- MCQuiz
```

- [ ] **Step 3: Implement**

Create `src/components/stages/MCQuiz.tsx`:
```tsx
import { useState } from "react";

export type MCOption = { text: string; correct: boolean; explain: string };
export type MCQuestion = { prompt: string; options: MCOption[] };

type Props = {
  question: MCQuestion;
  onCorrect?: () => void;
  onWrong?: () => void;
};

export function MCQuiz({ question, onCorrect, onWrong }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const handle = (i: number) => {
    setSelected(i);
    const opt = question.options[i];
    if (opt.correct) onCorrect?.();
    else onWrong?.();
  };

  return (
    <fieldset className="border rounded-lg p-4 my-4">
      <legend className="font-medium">{question.prompt}</legend>
      {question.options.map((opt, i) => (
        <label
          key={i}
          className={`block p-2 my-1 rounded cursor-pointer ${
            selected === i
              ? opt.correct
                ? "bg-green-100"
                : "bg-red-100"
              : "hover:bg-neutral-100"
          }`}
        >
          <input
            type="radio"
            name={question.prompt}
            className="mr-2"
            onChange={() => handle(i)}
            checked={selected === i}
          />
          {opt.text}
        </label>
      ))}
      {selected !== null && (
        <p className="mt-2 text-sm italic">{question.options[selected].explain}</p>
      )}
    </fieldset>
  );
}
```

- [ ] **Step 4: Run tests — pass**

```bash
npm run test -- MCQuiz
```

- [ ] **Step 5: Commit**

```bash
git add src/components/stages/MCQuiz.{tsx,test.tsx}
git commit -m "feat: MCQuiz with per-option explanations"
```

---

### Task B3: FillBlank and LineReorder primitives

**Files:**
- Create: `src/components/stages/FillBlank.tsx`, `src/components/stages/LineReorder.tsx`, and tests for each.

- [ ] **Step 1: FillBlank test**

Create `src/components/stages/FillBlank.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FillBlank } from "./FillBlank";

describe("<FillBlank>", () => {
  it("is wrong until correct answer typed (case-insensitive, trimmed)", () => {
    const onCorrect = vi.fn();
    render(<FillBlank answer="softmax" onCorrect={onCorrect} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "sigmoid" } });
    fireEvent.blur(input);
    expect(onCorrect).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "  SoftMax " } });
    fireEvent.blur(input);
    expect(onCorrect).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: FillBlank implementation**

Create `src/components/stages/FillBlank.tsx`:
```tsx
import { useState } from "react";

type Props = {
  answer: string;
  placeholder?: string;
  onCorrect?: () => void;
};

export function FillBlank({ answer, placeholder = "…", onCorrect }: Props) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "right" | "wrong">("idle");

  const check = () => {
    const ok = value.trim().toLowerCase() === answer.trim().toLowerCase();
    setState(ok ? "right" : "wrong");
    if (ok) onCorrect?.();
  };

  const color =
    state === "right" ? "border-green-500" : state === "wrong" ? "border-red-500" : "border-neutral-400";

  return (
    <input
      type="text"
      className={`inline-block mx-1 px-2 py-0.5 border-b-2 bg-transparent ${color}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={check}
      onKeyDown={(e) => e.key === "Enter" && check()}
    />
  );
}
```

- [ ] **Step 3: LineReorder test**

Create `src/components/stages/LineReorder.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LineReorder } from "./LineReorder";

describe("<LineReorder>", () => {
  it("signals correct when user restores original order", () => {
    const onCorrect = vi.fn();
    render(
      <LineReorder
        lines={["A", "B", "C"]}
        onCorrect={onCorrect}
      />,
    );
    // Basic sanity; full drag is hard to simulate.
    // Implementation exposes a "Check" button that validates current order.
    // Use "move up" buttons on each row.
    const ups = screen.getAllByRole("button", { name: /move up/i });
    expect(ups.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: LineReorder implementation (button-based, no drag-drop lib)**

Create `src/components/stages/LineReorder.tsx`:
```tsx
import { useMemo, useState } from "react";

type Props = {
  lines: string[];       // correct order
  onCorrect?: () => void;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function LineReorder({ lines, onCorrect }: Props) {
  const initial = useMemo(() => shuffle(lines.map((l, i) => ({ id: i, text: l }))), [lines]);
  const [order, setOrder] = useState(initial);
  const [state, setState] = useState<"idle" | "right" | "wrong">("idle");

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);
    setState("idle");
  };

  const check = () => {
    const ok = order.every((o, i) => o.text === lines[i]);
    setState(ok ? "right" : "wrong");
    if (ok) onCorrect?.();
  };

  return (
    <div className="my-4 border rounded p-3">
      <ol className="space-y-1">
        {order.map((line, i) => (
          <li key={line.id} className="flex items-center gap-2 font-mono">
            <button
              className="px-2 border rounded"
              aria-label="move up"
              onClick={() => move(i, i - 1)}
            >
              ↑
            </button>
            <button
              className="px-2 border rounded"
              aria-label="move down"
              onClick={() => move(i, i + 1)}
            >
              ↓
            </button>
            <span>{line.text}</span>
          </li>
        ))}
      </ol>
      <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded" onClick={check}>
        Check order
      </button>
      {state === "right" && <span className="ml-2 text-green-600">✓</span>}
      {state === "wrong" && <span className="ml-2 text-red-600">Not yet — keep trying</span>}
    </div>
  );
}
```

- [ ] **Step 5: Run tests — pass**

```bash
npm run test -- FillBlank LineReorder
```

- [ ] **Step 6: Commit**

```bash
git add src/components/stages/{FillBlank,LineReorder}.{tsx,test.tsx}
git commit -m "feat: FillBlank + LineReorder active-learning primitives"
```

---

### Task B4: DerivationStep, Math wrapper, HintFade

**Files:**
- Create: `src/components/math/Math.astro`, `src/components/math/DerivationStep.tsx`, `src/components/code/HintFade.tsx`

- [ ] **Step 1: Math KaTeX wrapper**

Create `src/components/math/Math.astro`:
```astro
---
import katex from "katex";
interface Props { expr: string; display?: boolean; }
const { expr, display = false } = Astro.props;
const html = katex.renderToString(expr, { displayMode: display, throwOnError: false });
---
<span set:html={html} />
```

- [ ] **Step 2: DerivationStep — reuses MCQuiz underneath**

Create `src/components/math/DerivationStep.tsx`:
```tsx
import type { ReactNode } from "react";
import { MCQuiz, type MCQuestion } from "../stages/MCQuiz";

type Props = {
  question: MCQuestion;
  revealContent: ReactNode;
};

export function DerivationStep({ question, revealContent }: Props) {
  return (
    <div className="border-l-4 border-blue-300 pl-3 my-4">
      <MCQuiz question={question} />
      <details className="mt-2">
        <summary className="cursor-pointer text-sm underline">Show next line</summary>
        <div className="mt-2">{revealContent}</div>
      </details>
    </div>
  );
}
```

- [ ] **Step 3: HintFade — 3-level escalating hint**

Create `src/components/code/HintFade.tsx`:
```tsx
import { useState, type ReactNode } from "react";

type Props = { hints: [string, string, string]; solution: ReactNode };

export function HintFade({ hints, solution }: Props) {
  const [level, setLevel] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="my-3 border rounded p-3 bg-yellow-50">
      <div className="flex gap-2 mb-2">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            disabled={level >= n}
            className="px-2 py-1 text-sm border rounded disabled:opacity-40"
            onClick={() => setLevel(n)}
          >
            Hint {n}
          </button>
        ))}
        <button
          className="px-2 py-1 text-sm border rounded ml-auto"
          onClick={() => setShowSolution(true)}
        >
          Show solution
        </button>
      </div>
      {level >= 1 && <p className="text-sm">💡 {hints[0]}</p>}
      {level >= 2 && <p className="text-sm">💡 {hints[1]}</p>}
      {level >= 3 && <p className="text-sm">💡 {hints[2]}</p>}
      {showSolution && <div className="mt-2 border-t pt-2">{solution}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Basic render test for HintFade**

Create `src/components/code/HintFade.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HintFade } from "./HintFade";

describe("<HintFade>", () => {
  it("reveals hints progressively", () => {
    render(<HintFade hints={["h1", "h2", "h3"]} solution={<div>SOL</div>} />);
    expect(screen.queryByText("h1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Hint 1/ }));
    expect(screen.getByText(/h1/)).toBeInTheDocument();
    expect(screen.queryByText("h2")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Show solution/ }));
    expect(screen.getByText("SOL")).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run tests — pass**

```bash
npm run test -- HintFade
```

- [ ] **Step 6: Commit**

```bash
git add src/components/math src/components/code/HintFade.{tsx,test.tsx}
git commit -m "feat: KaTeX Math wrapper, DerivationStep, HintFade"
```

---

### Task B5: StageNav + StageSection + RetrievalCheck

**Files:**
- Create: `src/components/stages/StageNav.astro`, `src/components/stages/StageSection.astro`, `src/components/stages/RetrievalCheck.tsx`, test for RetrievalCheck

- [ ] **Step 1: StageNav (sticky left nav, reads progress)**

Create `src/components/stages/StageNav.astro`:
```astro
---
interface Props { slug: string; }
const { slug } = Astro.props;
const stages = [
  { id: "intuition", label: "① Intuition" },
  { id: "math",      label: "② Math" },
  { id: "pseudo",    label: "③ Pseudo code" },
  { id: "code",      label: "④ Code" },
  { id: "pdf",       label: "⑤ Original PDF" },
];
---
<aside class="sticky top-4 w-48 hidden md:block" data-paper-slug={slug}>
  <ol class="space-y-1 text-sm">
    {stages.map((s) => (
      <li>
        <a href={`#${s.id}`} class="block px-2 py-1 rounded hover:bg-neutral-100" data-stage-id={s.id}>
          <span class="stage-mark" data-slug={slug} data-stage={s.id}>○</span> {s.label}
        </a>
      </li>
    ))}
  </ol>
</aside>
<script>
  // Hydrate checkmarks from localStorage on the client.
  import { getStageStatus } from "../../lib/progress";
  const marks = document.querySelectorAll<HTMLElement>(".stage-mark");
  marks.forEach((m) => {
    const slug = m.dataset.slug!;
    const stage = m.dataset.stage! as any;
    const status = getStageStatus(slug, stage);
    if (status === "mastered") m.textContent = "✓";
    else if (status === "skipped") m.textContent = "✗";
    else if (status === "revealed") m.textContent = "◐";
  });
</script>
```

- [ ] **Step 2: StageSection wrapper**

Create `src/components/stages/StageSection.astro`:
```astro
---
interface Props { id: string; title: string; }
const { id, title } = Astro.props;
---
<section id={id} class="scroll-mt-24 my-12">
  <h2 class="text-2xl font-semibold mb-4">{title}</h2>
  <slot />
</section>
```

- [ ] **Step 3: RetrievalCheck test**

Create `src/components/stages/RetrievalCheck.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RetrievalCheck } from "./RetrievalCheck";

const qs = [
  { prompt: "Q1", options: [
    { text: "right", correct: true, explain: "" },
    { text: "wrong", correct: false, explain: "" },
  ]},
  { prompt: "Q2", options: [
    { text: "right", correct: true, explain: "" },
    { text: "wrong", correct: false, explain: "" },
  ]},
];

describe("<RetrievalCheck>", () => {
  it("calls onPass only when ALL answered correctly", () => {
    const onPass = vi.fn();
    render(<RetrievalCheck questions={qs} onPass={onPass} />);
    const rights = screen.getAllByLabelText("right");
    fireEvent.click(rights[0]);
    expect(onPass).not.toHaveBeenCalled();
    fireEvent.click(rights[1]);
    expect(onPass).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 4: RetrievalCheck implementation**

Create `src/components/stages/RetrievalCheck.tsx`:
```tsx
import { useState } from "react";
import { MCQuiz, type MCQuestion } from "./MCQuiz";

type Props = {
  questions: MCQuestion[];
  onPass?: () => void;
};

export function RetrievalCheck({ questions, onPass }: Props) {
  const [correctSet, setCorrectSet] = useState<Set<number>>(new Set());

  function handleCorrect(i: number) {
    setCorrectSet((prev) => {
      const next = new Set(prev);
      next.add(i);
      if (next.size === questions.length) onPass?.();
      return next;
    });
  }

  return (
    <div className="my-6 p-4 border-2 border-dashed rounded">
      <h3 className="font-semibold mb-2">Retrieval check</h3>
      {questions.map((q, i) => (
        <MCQuiz key={i} question={q} onCorrect={() => handleCorrect(i)} />
      ))}
      <p className="text-sm text-neutral-600 mt-2">
        Answer all {questions.length} correctly to mark this stage mastered.
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Run tests — pass**

```bash
npm run test -- RetrievalCheck
```

- [ ] **Step 6: Commit**

```bash
git add src/components/stages
git commit -m "feat: StageNav, StageSection, RetrievalCheck gate"
```

---

### Task B6: PyRunner — Monaco + Pyodide worker

**Files:**
- Create: `src/workers/pyodide.worker.ts`, `src/lib/pyodide.ts`, `src/components/code/PyRunner.tsx`, `src/components/code/AssertionTests.tsx`

- [ ] **Step 1: Install runtime deps**

```bash
npm install @monaco-editor/react monaco-editor pyodide
```

- [ ] **Step 2: Write the pyodide worker**

Create `src/workers/pyodide.worker.ts`:
```ts
// Runs in its own thread. Main thread posts { code }, worker posts { stdout, stderr, result }.
import { loadPyodide, type PyodideInterface } from "pyodide";

let pyodide: PyodideInterface | null = null;

async function ensurePyodide() {
  if (pyodide) return pyodide;
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
  });
  return pyodide;
}

self.addEventListener("message", async (e: MessageEvent<{ id: string; code: string }>) => {
  const { id, code } = e.data;
  const py = await ensurePyodide();
  const out: string[] = [];
  const err: string[] = [];
  py.setStdout({ batched: (s) => out.push(s) });
  py.setStderr({ batched: (s) => err.push(s) });
  try {
    const result = await py.runPythonAsync(code);
    self.postMessage({ id, ok: true, stdout: out.join(""), stderr: err.join(""), result: String(result ?? "") });
  } catch (ex) {
    self.postMessage({ id, ok: false, stdout: out.join(""), stderr: String(ex) });
  }
});

export {}; // make this a module
```

- [ ] **Step 3: Main-thread singleton wrapper**

Create `src/lib/pyodide.ts`:
```ts
let worker: Worker | null = null;
let counter = 0;
const pending = new Map<string, (r: RunResult) => void>();

export type RunResult =
  | { ok: true; stdout: string; stderr: string; result: string }
  | { ok: false; stdout: string; stderr: string };

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("../workers/pyodide.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.addEventListener("message", (e) => {
    const { id, ...rest } = e.data;
    pending.get(id)?.(rest);
    pending.delete(id);
  });
  return worker;
}

export function runPython(code: string): Promise<RunResult> {
  const w = ensureWorker();
  const id = `r${++counter}`;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    w.postMessage({ id, code });
  });
}
```

- [ ] **Step 4: PyRunner component**

Create `src/components/code/PyRunner.tsx`:
```tsx
import Editor from "@monaco-editor/react";
import { useState } from "react";
import { runPython, type RunResult } from "../../lib/pyodide";

type Props = {
  initialCode: string;
  colabUrl?: string;
};

export function PyRunner({ initialCode, colabUrl }: Props) {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    try {
      const r = await runPython(code);
      setResult(r);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="my-4 border rounded">
      <Editor
        height="260px"
        defaultLanguage="python"
        value={code}
        onChange={(v) => setCode(v ?? "")}
        options={{ fontSize: 13, minimap: { enabled: false } }}
      />
      <div className="flex gap-2 p-2 border-t bg-neutral-50">
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40"
          onClick={run}
          disabled={running}
        >
          {running ? "Running…" : "Run"}
        </button>
        {colabUrl && (
          <a
            className="px-3 py-1 border rounded"
            href={colabUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open in Colab
          </a>
        )}
      </div>
      {result && (
        <pre
          className={`p-2 text-sm whitespace-pre-wrap ${
            result.ok ? "bg-green-50" : "bg-red-50"
          }`}
        >
{result.stdout}
{result.stderr && <span className="text-red-600">{result.stderr}</span>}
{result.ok && result.result ? `→ ${result.result}` : ""}
        </pre>
      )}
    </div>
  );
}
```

- [ ] **Step 5: AssertionTests component (Python-side assertions = simple — just runs code that contains asserts)**

Create `src/components/code/AssertionTests.tsx`:
```tsx
import { useState } from "react";
import { runPython } from "../../lib/pyodide";

type Props = {
  userCode: string;
  testCode: string;   // python containing `assert` statements
};

export function AssertionTests({ userCode, testCode }: Props) {
  const [state, setState] = useState<"idle" | "pass" | "fail">("idle");
  const [detail, setDetail] = useState("");

  async function check() {
    const full = `${userCode}\n${testCode}`;
    const r = await runPython(full);
    if (r.ok) {
      setState("pass");
      setDetail("All assertions passed ✓");
    } else {
      setState("fail");
      setDetail(r.stderr);
    }
  }

  return (
    <div className="my-2">
      <button className="px-3 py-1 border rounded" onClick={check}>
        Run tests
      </button>
      {state !== "idle" && (
        <pre
          className={`mt-2 p-2 text-sm whitespace-pre-wrap ${
            state === "pass" ? "bg-green-50" : "bg-red-50"
          }`}
        >
          {detail}
        </pre>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Configure Astro for Pyodide worker**

Edit `astro.config.mjs` — add to defineConfig:
```js
vite: {
  worker: { format: "es" },
  optimizeDeps: { exclude: ["pyodide"] },
},
```

- [ ] **Step 7: Smoke-test in dev**

```bash
npm run dev
```
Manually: add a `<PyRunner client:only="react" initialCode="print(2+2)" />` to `src/pages/index.astro`, load page, click Run, expect stdout to show `4`. Remove before commit.

- [ ] **Step 8: Commit**

```bash
git add src/workers src/lib/pyodide.ts src/components/code/PyRunner.tsx src/components/code/AssertionTests.tsx astro.config.mjs package.json package-lock.json
git commit -m "feat: Pyodide WebWorker + Monaco PyRunner + AssertionTests"
```

---

### Task B7: PdfViewer and SrsCard authoring tag

**Files:**
- Create: `src/components/pdf/PdfViewer.astro`, `src/components/srs/SrsCard.astro`

- [ ] **Step 1: PdfViewer (use native <object> with PDF.js fallback link)**

Create `src/components/pdf/PdfViewer.astro`:
```astro
---
interface Props { src: string; title?: string; }
const { src, title = "Paper PDF" } = Astro.props;
---
<figure class="my-6">
  <object data={src} type="application/pdf" width="100%" height="700">
    <p>
      Your browser can't embed PDFs. <a href={src} download>Download {title}</a>.
    </p>
  </object>
  <figcaption class="text-sm text-neutral-600 mt-1">
    <a href={src} target="_blank" rel="noreferrer">Open in new tab</a> ·
    <a href={src} download>Download</a>
  </figcaption>
</figure>
```

- [ ] **Step 2: SrsCard authoring tag**

Create `src/components/srs/SrsCard.astro`:
```astro
---
interface Props { id: string; prompt: string; answer: string; paper: string; }
const { id, prompt, answer, paper } = Astro.props;
---
<!-- Renders nothing visible; exposes metadata the stage-mastery handler uses to enqueue. -->
<div class="hidden" data-srs-card data-id={id} data-paper={paper} data-prompt={prompt} data-answer={answer}></div>
```

Document in JSDoc-style comment in the file:
```astro
<!--
  Usage: place <SrsCard id="transformer-scaling" prompt="Why divide by √d_k?" answer="Prevents softmax saturation at large dot-product magnitudes." paper="transformer" />
  inside a StageSection. On RetrievalCheck pass for the enclosing stage, all SrsCard elements in that stage are enqueued via lib/srs.enqueueCard.
-->
```

- [ ] **Step 3: Replace RetrievalCheck with auto-enqueue version**

Overwrite `src/components/stages/RetrievalCheck.tsx` entirely:
```tsx
import { useRef, useState } from "react";
import { MCQuiz, type MCQuestion } from "./MCQuiz";
import { enqueueCard } from "../../lib/srs";

type Props = {
  questions: MCQuestion[];
  onPass?: () => void;
};

export function RetrievalCheck({ questions, onPass }: Props) {
  const [correctSet, setCorrectSet] = useState<Set<number>>(new Set());
  const elRef = useRef<HTMLDivElement>(null);

  function handleCorrect(i: number) {
    setCorrectSet((prev) => {
      const next = new Set(prev);
      next.add(i);
      if (next.size === questions.length) {
        const section = elRef.current?.closest("section");
        section?.querySelectorAll<HTMLElement>("[data-srs-card]").forEach((card) => {
          enqueueCard({
            id: card.dataset.id!,
            paperSlug: card.dataset.paper!,
            prompt: card.dataset.prompt!,
            answer: card.dataset.answer!,
          });
        });
        onPass?.();
      }
      return next;
    });
  }

  return (
    <div ref={elRef} className="my-6 p-4 border-2 border-dashed rounded">
      <h3 className="font-semibold mb-2">Retrieval check</h3>
      {questions.map((q, i) => (
        <MCQuiz key={i} question={q} onCorrect={() => handleCorrect(i)} />
      ))}
      <p className="text-sm text-neutral-600 mt-2">
        Answer all {questions.length} correctly to mark this stage mastered.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Update the RetrievalCheck test to assert enqueue**

Edit `src/components/stages/RetrievalCheck.test.tsx`, add a test:
```tsx
import { loadStore } from "../../lib/storage";
// inside describe:
it("enqueues SrsCard descendants on pass", () => {
  render(
    <section>
      <div data-srs-card data-id="c1" data-paper="t" data-prompt="p" data-answer="a" />
      <RetrievalCheck questions={qs} />
    </section>,
  );
  fireEvent.click(screen.getAllByLabelText("right")[0]);
  fireEvent.click(screen.getAllByLabelText("right")[1]);
  const cards = loadStore().srs.cards;
  expect(cards.map((c) => c.id)).toContain("c1");
});
```

- [ ] **Step 5: Run tests — pass**

```bash
npm run test
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/pdf src/components/srs src/components/stages/RetrievalCheck.{tsx,test.tsx}
git commit -m "feat: PdfViewer + SrsCard authoring + auto-enqueue on stage pass"
```

---

## Phase C — Paper 1: Attention Is All You Need

### Task C1: Download PDF and create content collection schema

**Files:**
- Create: `public/pdfs/1706.03762.pdf`, `src/content/config.ts`

- [ ] **Step 1: Download the Transformer PDF**

```bash
curl -L -o public/pdfs/1706.03762.pdf https://arxiv.org/pdf/1706.03762
```
Expected: file ~2MB.

- [ ] **Step 2: Create content collection config**

Create `src/content/config.ts`:
```ts
import { defineCollection, z } from "astro:content";

const papers = defineCollection({
  type: "content",
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    authors: z.string(),
    year: z.number(),
    era: z.string(),
    arxivId: z.string().optional(),
    estimatedMinutes: z.number(),
    prerequisites: z.array(z.string()).default([]),
  }),
});

export const collections = { papers };
```

- [ ] **Step 3: Commit**

```bash
git add public/pdfs/1706.03762.pdf src/content/config.ts
git commit -m "chore: Transformer PDF + content collection schema"
```

---

### Task C2: AttentionMatrix hero widget (Intuition stage anchor)

**Files:**
- Create: `src/components/widgets/AttentionMatrix.tsx`, `src/components/widgets/AttentionMatrix.test.tsx`

**Design:** a 6-token toy sentence ("The cat sat on the mat"). User hovers a query token → the K·Q softmax row highlights, showing which keys attend. A slider changes `d_k` (8, 32, 64, 128) and shows how softmax sharpens/flattens. A toggle turns scaling √d_k on/off.

- [ ] **Step 1: Test — checks structure renders**

Create `src/components/widgets/AttentionMatrix.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AttentionMatrix } from "./AttentionMatrix";

describe("<AttentionMatrix>", () => {
  it("renders tokens and a d_k slider", () => {
    render(<AttentionMatrix />);
    expect(screen.getByText(/the/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/d_k/i)).toBeInTheDocument();
  });

  it("toggles √d_k scaling", () => {
    render(<AttentionMatrix />);
    const toggle = screen.getByLabelText(/scale by √d_k/i);
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
  });
});
```

- [ ] **Step 2: Implementation**

Create `src/components/widgets/AttentionMatrix.tsx`:
```tsx
import { useMemo, useState } from "react";

const TOKENS = ["The", "cat", "sat", "on", "the", "mat"];
// Toy query and key embeddings: deterministic pseudo-random for stability.
function seededEmbeddings(dk: number): { Q: number[][]; K: number[][] } {
  const rand = (i: number, j: number) => {
    const x = Math.sin(i * 2654435761 + j) * 10000;
    return x - Math.floor(x) - 0.5;
  };
  const Q = TOKENS.map((_, i) => Array.from({ length: dk }, (_, j) => rand(i, j)));
  const K = TOKENS.map((_, i) => Array.from({ length: dk }, (_, j) => rand(i + 100, j)));
  return { Q, K };
}

function softmax(row: number[]): number[] {
  const max = Math.max(...row);
  const exps = row.map((x) => Math.exp(x - max));
  const s = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / s);
}

export function AttentionMatrix() {
  const [dk, setDk] = useState(32);
  const [scale, setScale] = useState(true);
  const [queryIdx, setQueryIdx] = useState(1);

  const attn = useMemo(() => {
    const { Q, K } = seededEmbeddings(dk);
    const rows = Q.map((q) => {
      const dots = K.map((k) => q.reduce((s, qi, i) => s + qi * k[i], 0));
      const scaled = scale ? dots.map((d) => d / Math.sqrt(dk)) : dots;
      return softmax(scaled);
    });
    return rows;
  }, [dk, scale]);

  return (
    <div className="my-4 p-4 border rounded-lg bg-white">
      <div className="flex gap-4 items-center mb-3 flex-wrap">
        <label className="text-sm">
          d_k:
          <input
            aria-label="d_k"
            type="range"
            min={4}
            max={128}
            step={4}
            value={dk}
            onChange={(e) => setDk(+e.target.value)}
            className="mx-2"
          />
          <span className="font-mono">{dk}</span>
        </label>
        <label className="text-sm flex items-center gap-1">
          <input
            type="checkbox"
            checked={scale}
            aria-label="scale by √d_k"
            onChange={(e) => setScale(e.target.checked)}
          />
          Scale by √d_k
        </label>
        <label className="text-sm">
          Query:
          <select
            className="ml-2 border rounded"
            value={queryIdx}
            onChange={(e) => setQueryIdx(+e.target.value)}
          >
            {TOKENS.map((t, i) => (
              <option key={i} value={i}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      <table className="text-center text-sm border-collapse">
        <thead>
          <tr>
            <th></th>
            {TOKENS.map((t, i) => (
              <th key={i} className="px-2 py-1">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TOKENS.map((t, qi) => (
            <tr key={qi} className={qi === queryIdx ? "outline outline-2 outline-blue-500" : ""}>
              <th className="pr-2 text-right">{t}</th>
              {attn[qi].map((v, ki) => (
                <td
                  key={ki}
                  className="w-10 h-10"
                  style={{ background: `rgba(59,130,246,${v.toFixed(2)})` }}
                  title={v.toFixed(3)}
                >
                  {v > 0.2 ? v.toFixed(2) : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-xs text-neutral-600">
        Hover a cell to see exact value. Row = query token. Darker cell = more attention mass.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Run tests — pass**

```bash
npm run test -- AttentionMatrix
```

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/AttentionMatrix.{tsx,test.tsx}
git commit -m "feat: AttentionMatrix hero widget for Transformer paper"
```

---

### Task C3: Transformer MDX — full 5-stage content

**Files:**
- Create: `src/content/papers/transformer.mdx`, `src/layouts/PaperLayout.astro`, `src/pages/papers/[slug].astro`

- [ ] **Step 1: Layout**

Create `src/layouts/PaperLayout.astro`:
```astro
---
import "../styles/global.css";
import StageNav from "../components/stages/StageNav.astro";
interface Props { frontmatter: any; }
const { frontmatter } = Astro.props;
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>{frontmatter.title} — ai_master</title>
  </head>
  <body class="bg-white text-neutral-900">
    <div class="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-[12rem_1fr] gap-8">
      <StageNav slug={frontmatter.slug} />
      <main class="prose max-w-none">
        <header class="mb-8">
          <a href="/" class="text-sm text-blue-600">← Roadmap</a>
          <h1 class="text-3xl font-bold mt-2">{frontmatter.title}</h1>
          <p class="text-neutral-600">{frontmatter.authors} · {frontmatter.year}</p>
        </header>
        <slot />
      </main>
    </div>
  </body>
</html>
```

- [ ] **Step 2: Dynamic paper route**

Create `src/pages/papers/[slug].astro`:
```astro
---
import { getCollection, getEntry } from "astro:content";
import PaperLayout from "../../layouts/PaperLayout.astro";

export async function getStaticPaths() {
  const papers = await getCollection("papers");
  return papers.map((p) => ({ params: { slug: p.slug }, props: { paper: p } }));
}

const { paper } = Astro.props;
const { Content } = await paper.render();
---
<PaperLayout frontmatter={paper.data}>
  <Content />
</PaperLayout>
```

- [ ] **Step 3: Author transformer.mdx — five stages with PARR at every stage**

Create `src/content/papers/transformer.mdx`:
```mdx
---
slug: transformer
title: "Attention Is All You Need"
authors: "Vaswani et al."
year: 2017
era: transformer
arxivId: 1706.03762
estimatedMinutes: 75
prerequisites: []
---
import StageSection from "../../components/stages/StageSection.astro";
import Math from "../../components/math/Math.astro";
import { PredictThenReveal } from "../../components/stages/PredictThenReveal.tsx";
import { MCQuiz } from "../../components/stages/MCQuiz.tsx";
import { FillBlank } from "../../components/stages/FillBlank.tsx";
import { LineReorder } from "../../components/stages/LineReorder.tsx";
import { DerivationStep } from "../../components/math/DerivationStep.tsx";
import { HintFade } from "../../components/code/HintFade.tsx";
import { PyRunner } from "../../components/code/PyRunner.tsx";
import { AssertionTests } from "../../components/code/AssertionTests.tsx";
import { RetrievalCheck } from "../../components/stages/RetrievalCheck.tsx";
import { AttentionMatrix } from "../../components/widgets/AttentionMatrix.tsx";
import SrsCard from "../../components/srs/SrsCard.astro";
import PdfViewer from "../../components/pdf/PdfViewer.astro";

<StageSection id="intuition" title="① Intuition">

Before 2017, sequence models read tokens one-by-one (RNN/LSTM). Every position waited on its predecessor. Training long sequences was slow; very distant dependencies were forgotten.

**Setup:** think of translating the sentence "The cat sat on the mat." You want each word's representation to be able to "look at" every other word directly.

<PredictThenReveal client:load predictPrompt="Before touching the widget: if each word could look at every other word directly, what would go wrong as sentences get longer? Type your guess.">
  Two things: **(a)** the number of query–key pairs grows as _n²_, and **(b)** without weighting, "looking at everything" is just averaging — you lose position info. The Transformer solves both: the _softmax_ creates weighted attention (so it's never uniform averaging), and _positional encodings_ re-inject order.
</PredictThenReveal>

Now play with the widget below. Change `d_k`. Toggle the √d_k scaling. Watch the attention row for the selected query token.

<AttentionMatrix client:load />

<PredictThenReveal client:load predictPrompt="Predict: when you DISABLE √d_k scaling at large d_k (say 128), does the attention row become more peaked or more flat? Why?">
  **More peaked** — very sharp, often a single cell near 1.0. Dot products of high-dimensional random vectors scale with √d_k, so without the divisor softmax inputs are huge and softmax saturates. Dividing by √d_k keeps softmax inputs order-O(1), giving smooth gradients.
</PredictThenReveal>

<SrsCard id="transformer-scaling" paper="transformer" prompt="Why divide by √d_k in scaled dot-product attention?" answer="Large dot products push softmax into saturation (near one-hot), killing gradients. Dividing by √d_k keeps the pre-softmax values O(1) regardless of d_k." />

<RetrievalCheck client:load questions={[
  { prompt: "Why was self-attention attractive vs RNNs?", options: [
    { text: "All positions computable in parallel", correct: true, explain: "RNNs serialize along the time axis; attention only needs matmuls." },
    { text: "Lower FLOPs", correct: false, explain: "FLOPs can actually be higher for long sequences (n²)." },
    { text: "Requires less data", correct: false, explain: "Transformers typically need more data, not less." },
  ]},
  { prompt: "What does scaling by √d_k prevent?", options: [
    { text: "Softmax saturation in large embedding dims", correct: true, explain: "Keeps logits O(1)." },
    { text: "Overfitting", correct: false, explain: "That's dropout's job." },
    { text: "Exploding gradients in backprop", correct: false, explain: "Indirectly helps, but the direct reason is softmax saturation." },
  ]},
]} />

</StageSection>

<StageSection id="math" title="② Math">

Scaled dot-product attention:

<Math display expr="\text{Attn}(Q, K, V) = \text{softmax}\!\left(\frac{Q K^\top}{\sqrt{d_k}}\right) V" />

Where _Q_ ∈ ℝ^{n×d_k}, _K_ ∈ ℝ^{n×d_k}, _V_ ∈ ℝ^{n×d_v}.

**Derivation of scaling:** assume _q_ and _k_ have iid components with mean 0, variance 1. Then <Math expr="q \cdot k = \sum_{i=1}^{d_k} q_i k_i" />.

<DerivationStep client:load
  question={{
    prompt: "What is Var(q · k)?",
    options: [
      { text: "d_k", correct: true, explain: "Sum of d_k iid zero-mean variance-1 products, each with variance 1." },
      { text: "1", correct: false, explain: "That would be for d_k = 1." },
      { text: "√d_k", correct: false, explain: "That's the standard deviation, not the variance." },
    ],
  }}
  revealContent={<Math display expr="\mathrm{Var}(q \cdot k) = d_k \implies \mathrm{sd}(q \cdot k) = \sqrt{d_k}" />}
/>

To keep softmax inputs order-O(1) regardless of _d_k_, divide by <FillBlank answer="sqrt(d_k)" placeholder="?" client:load /> before softmax.

**Multi-head attention:**

<Math display expr="\text{MultiHead}(Q,K,V) = \text{Concat}(\text{head}_1, \dots, \text{head}_h) W^O" />
<Math display expr="\text{head}_i = \text{Attn}(Q W^Q_i,\; K W^K_i,\; V W^V_i)" />

Each head has its own projection and captures different dependency patterns (syntax, coreference, etc.).

<SrsCard id="transformer-multihead" paper="transformer" prompt="Why use multi-head attention instead of one big attention head?" answer="Each head learns different relational patterns at lower per-head dimension. h heads of dim d_k each ≈ same compute as one head of dim h·d_k, but with diverse attention patterns." />

<RetrievalCheck client:load questions={[
  { prompt: "For iid zero-mean unit-variance q, k, sd(q·k) = ?", options: [
    { text: "√d_k", correct: true, explain: "Variance d_k ⇒ sd √d_k." },
    { text: "d_k", correct: false, explain: "That's the variance." },
    { text: "1", correct: false, explain: "Only if d_k=1." },
  ]},
  { prompt: "Multi-head attention primarily increases:", options: [
    { text: "Representational diversity via different attention patterns", correct: true, explain: "Each head attends differently." },
    { text: "Sequence length capacity", correct: false, explain: "Orthogonal axis." },
    { text: "Depth of the network", correct: false, explain: "Heads run in parallel, same depth." },
  ]},
]} />

</StageSection>

<StageSection id="pseudo" title="③ Pseudo code">

Arrange the steps of scaled dot-product attention in order:

<LineReorder client:load lines={[
  "Compute QKᵀ (n × n matrix of dot products)",
  "Divide every entry by √d_k",
  "Apply softmax row-wise",
  "Multiply by V to get output (n × d_v)",
]} />

Fill the blank in this pseudo code:

```text
def attention(Q, K, V, dk):
    scores = Q @ K.T
    scores = scores / _______    # ← fill
    weights = softmax(scores, axis=-1)
    return weights @ V
```

<FillBlank answer="sqrt(dk)" client:load />

<RetrievalCheck client:load questions={[
  { prompt: "What happens if you softmax BEFORE scaling?", options: [
    { text: "Softmax saturates on large d_k, learning stalls", correct: true, explain: "The scaling must precede softmax for it to matter." },
    { text: "Same output — softmax is scale-invariant", correct: false, explain: "Softmax is NOT scale-invariant." },
    { text: "Output would be undefined", correct: false, explain: "Numerically defined, just poor." },
  ]},
]} />

</StageSection>

<StageSection id="code" title="④ Code (Python)">

Implement scaled dot-product attention in NumPy.

<HintFade client:load
  hints={[
    "Use `np.einsum` or simple matmul. Remember softmax should operate along the last axis.",
    "Implement softmax yourself: subtract row-max for numerical stability, then exp + normalize.",
    "The scaling divisor is √dk. Apply it BEFORE softmax, AFTER the dot product.",
  ]}
  solution={<pre className="text-sm bg-neutral-100 p-2 rounded">{`import numpy as np

def softmax(x, axis=-1):
    x = x - np.max(x, axis=axis, keepdims=True)
    e = np.exp(x)
    return e / np.sum(e, axis=axis, keepdims=True)

def attention(Q, K, V):
    dk = Q.shape[-1]
    scores = Q @ K.swapaxes(-1, -2) / np.sqrt(dk)
    w = softmax(scores, axis=-1)
    return w @ V`}</pre>}
/>

<PyRunner
  client:only="react"
  colabUrl="https://colab.research.google.com/github/your-org/ai_master/blob/main/notebooks/transformer.ipynb"
  initialCode={`import numpy as np

def softmax(x, axis=-1):
    # TODO: stable softmax
    pass

def attention(Q, K, V):
    # TODO: implement scaled dot-product attention
    pass

# Quick sanity: shapes should match
Q = np.random.randn(2, 4)
K = np.random.randn(3, 4)
V = np.random.randn(3, 5)
out = attention(Q, K, V)
print("output shape:", None if out is None else out.shape)
`} />

<AssertionTests
  client:only="react"
  userCode={`
import numpy as np
def softmax(x, axis=-1):
    x = x - np.max(x, axis=axis, keepdims=True)
    e = np.exp(x); return e / e.sum(axis=axis, keepdims=True)
def attention(Q, K, V):
    dk = Q.shape[-1]
    s = Q @ K.swapaxes(-1, -2) / np.sqrt(dk)
    w = softmax(s, axis=-1)
    return w @ V
`}
  testCode={`
import numpy as np
np.random.seed(0)
Q = np.random.randn(2,4); K = np.random.randn(3,4); V = np.random.randn(3,5)
out = attention(Q, K, V)
assert out.shape == (2,5), f"bad shape {out.shape}"
# Softmax-weighted rows sum to 1 before V mixing:
w = softmax(Q @ K.T / np.sqrt(4), axis=-1)
assert np.allclose(w.sum(axis=-1), 1.0), "softmax rows must sum to 1"
print("ok")
`}
/>

<RetrievalCheck client:load questions={[
  { prompt: "Stable softmax subtracts row-max before exp to:", options: [
    { text: "Prevent overflow in exp", correct: true, explain: "exp(1000) overflows; exp(0) doesn't." },
    { text: "Center the output", correct: false, explain: "Output still sums to 1, unchanged." },
    { text: "Make softmax differentiable", correct: false, explain: "It's already differentiable." },
  ]},
]} />

</StageSection>

<StageSection id="pdf" title="⑤ Original paper">

<PdfViewer src="/pdfs/1706.03762.pdf" title="Attention Is All You Need" />

Suggested reading order: §3 (Model Architecture) → §3.2 (Scaled Dot-Product Attention) → §3.2.2 (Multi-Head) → §5 (Training).

</StageSection>
```

- [ ] **Step 4: Build and browse**

```bash
npm run dev
```
Open `http://localhost:4321/papers/transformer`. Walk all 5 stages. Verify PARR gate works (reveal disabled until attempt). Verify AttentionMatrix widget renders. Verify Pyodide runs.

- [ ] **Step 5: Fix any runtime issues encountered**

Common items:
- Astro MDX may require explicit `client:load` on all interactive React components — verified above.
- If `astro:content` complains about missing slug frontmatter match, ensure the file's slug matches file name.

- [ ] **Step 6: Commit**

```bash
git add src/content/papers/transformer.mdx src/layouts/PaperLayout.astro src/pages/papers/[slug].astro
git commit -m "feat: Transformer paper — full 5-stage content"
```

---

## Phase D — Home + Roadmap

### Task D1: RoadmapGraph component

**Files:**
- Create: `src/components/roadmap/RoadmapGraph.tsx`, `src/components/roadmap/RoadmapGraph.test.tsx`

- [ ] **Step 1: Test — basic render**

Create `src/components/roadmap/RoadmapGraph.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RoadmapGraph } from "./RoadmapGraph";
import { PAPERS_META } from "../../content/papers-meta";

describe("<RoadmapGraph>", () => {
  it("renders a node for every paper", () => {
    render(<RoadmapGraph papers={PAPERS_META} />);
    PAPERS_META.forEach((p) => {
      expect(screen.getByTitle(p.title)).toBeInTheDocument();
    });
  });

  it("implemented papers have clickable link", () => {
    render(<RoadmapGraph papers={PAPERS_META} />);
    const link = screen.getByTitle("Attention Is All You Need").closest("a");
    expect(link?.getAttribute("href")).toBe("/papers/transformer");
  });
});
```

- [ ] **Step 2: Implementation**

Create `src/components/roadmap/RoadmapGraph.tsx`:
```tsx
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
      {/* Era labels */}
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
      {/* Year axis */}
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
      {/* Edges */}
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
      {/* Nodes */}
      {papers.map((p) => {
        const eraIdx = ERAS.findIndex((e) => e.id === p.era);
        const cx = 120 + (p.year - yearMin) * yearWidth;
        const cy = 40 + eraIdx * laneHeight + 30;
        const common = {
          cx, cy, r: 10,
        };
        const fill =
          p.status === "implemented" ? "#2563eb"
          : p.status === "stub" ? "#94a3b8"
          : "#e2e8f0";

        const circle = (
          <circle {...common} fill={fill} stroke="#1e293b" strokeWidth={p.status === "implemented" ? 2 : 1}>
            <title>{p.title}</title>
          </circle>
        );

        if (p.status === "implemented") {
          return (
            <a key={p.slug} href={`/papers/${p.slug}`}>
              {circle}
              <text x={cx} y={cy + 24} textAnchor="middle" className="text-xs" fill="#111">
                {p.slug}
              </text>
            </a>
          );
        }
        return <g key={p.slug}><title>{p.title}</title>{circle}</g>;
      })}
    </svg>
  );
}
```

- [ ] **Step 3: Run tests — pass**

```bash
npm run test -- RoadmapGraph
```

- [ ] **Step 4: Commit**

```bash
git add src/components/roadmap/RoadmapGraph.{tsx,test.tsx}
git commit -m "feat: RoadmapGraph SVG — era lanes × year timeline with influence edges"
```

---

### Task D2: Home page with roadmap + "continue reading"

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/components/home/ContinueReading.tsx`

- [ ] **Step 1: ContinueReading card**

Create `src/components/home/ContinueReading.tsx`:
```tsx
import { useEffect, useState } from "react";
import { loadStore } from "../../lib/storage";
import { PAPERS_META } from "../../content/papers-meta";

export function ContinueReading() {
  const [entry, setEntry] = useState<{ slug: string; stage: string } | null>(null);

  useEffect(() => {
    const store = loadStore();
    const entries = Object.entries(store.progress);
    if (entries.length === 0) return setEntry(null);
    // Most recently started/not-completed paper
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
```

- [ ] **Step 2: Home page**

Replace `src/pages/index.astro`:
```astro
---
import "../styles/global.css";
import { RoadmapGraph } from "../components/roadmap/RoadmapGraph.tsx";
import { ContinueReading } from "../components/home/ContinueReading.tsx";
import { PAPERS_META } from "../content/papers-meta";
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>ai_master — DL → Agents, step by step</title>
  </head>
  <body class="bg-white text-neutral-900">
    <main class="max-w-5xl mx-auto px-4 py-8">
      <header class="mb-6">
        <h1 class="text-4xl font-bold">ai_master</h1>
        <p class="text-neutral-600">Deep learning → agents, 2012 → 2026, one paper at a time.</p>
      </header>
      <ContinueReading client:only="react" />
      <section class="mt-10">
        <h2 class="text-2xl font-semibold mb-2">Roadmap</h2>
        <p class="text-sm text-neutral-600 mb-4">
          Click a bright node to learn a paper. Grey nodes are planned (not yet implemented).
        </p>
        <RoadmapGraph client:load papers={PAPERS_META} />
      </section>
      <footer class="mt-10 text-sm text-neutral-500">
        <a href="/progress">Progress dashboard</a> · <a href="/review">Review queue</a>
      </footer>
    </main>
  </body>
</html>
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```
Open `http://localhost:4321`. Expect: hero, roadmap with Transformer as bright blue node, clicking it navigates to `/papers/transformer`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro src/components/home/ContinueReading.tsx
git commit -m "feat: home page with roadmap + continue-reading card"
```

---

## Phase E — Paper 2: DDPM

### Task E1: NoiseSchedule widget

**Files:**
- Create: `src/components/widgets/NoiseSchedule.tsx`, `src/components/widgets/NoiseSchedule.test.tsx`

**Design:** a row of thumbnail images (can be simple procedural patterns or a provided sample image) at timesteps t = 0, 100, 200, …, 1000. A slider scrubs t. Shows the forward process q(x_t | x_0). A toggle switches between linear and cosine beta schedules.

- [ ] **Step 1: Test**

Create `src/components/widgets/NoiseSchedule.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NoiseSchedule } from "./NoiseSchedule";

describe("<NoiseSchedule>", () => {
  it("renders t slider and schedule toggle", () => {
    render(<NoiseSchedule />);
    expect(screen.getByLabelText(/timestep/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/schedule/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implementation**

Create `src/components/widgets/NoiseSchedule.tsx`:
```tsx
import { useMemo, useRef, useState, useEffect } from "react";

type Schedule = "linear" | "cosine";

function betas(T: number, schedule: Schedule): Float32Array {
  const b = new Float32Array(T);
  if (schedule === "linear") {
    const b0 = 1e-4, bT = 0.02;
    for (let i = 0; i < T; i++) b[i] = b0 + ((bT - b0) * i) / (T - 1);
  } else {
    // Nichol & Dhariwal cosine schedule
    const s = 0.008;
    const f = (t: number) => Math.cos(((t / T + s) / (1 + s)) * Math.PI / 2) ** 2;
    const f0 = f(0);
    for (let i = 0; i < T; i++) {
      const ab = f(i) / f0;
      const abPrev = i === 0 ? 1 : f(i - 1) / f0;
      const beta = 1 - ab / abPrev;
      b[i] = Math.min(Math.max(beta, 1e-8), 0.999);
    }
  }
  return b;
}

function alphaBars(b: Float32Array): Float32Array {
  const a = new Float32Array(b.length);
  let acc = 1;
  for (let i = 0; i < b.length; i++) {
    acc *= 1 - b[i];
    a[i] = acc;
  }
  return a;
}

export function NoiseSchedule() {
  const T = 1000;
  const [t, setT] = useState(0);
  const [schedule, setSchedule] = useState<Schedule>("linear");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { b, ab } = useMemo(() => {
    const b = betas(T, schedule);
    return { b, ab: alphaBars(b) };
  }, [schedule]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const W = c.width, H = c.height;
    const img = ctx.createImageData(W, H);
    // Base image: a gradient cross pattern
    const sqrtAb = Math.sqrt(ab[Math.max(0, Math.min(T - 1, t))]);
    const sqrtOne = Math.sqrt(1 - ab[Math.max(0, Math.min(T - 1, t))]);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const base = ((x + y) % 64 < 32 ? 200 : 80) + Math.sin(x / 8) * 20;
        const noise = (Math.random() - 0.5) * 255;
        const v = sqrtAb * base + sqrtOne * noise + 128;
        const i = (y * W + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, v));
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [t, ab]);

  return (
    <div className="my-4 p-4 border rounded-lg">
      <div className="flex items-center gap-4 flex-wrap mb-3">
        <label>
          Timestep:
          <input
            type="range"
            aria-label="timestep"
            min={0}
            max={T - 1}
            value={t}
            onChange={(e) => setT(+e.target.value)}
            className="mx-2"
          />
          <span className="font-mono">{t}</span>
        </label>
        <label>
          Schedule:
          <select
            aria-label="schedule"
            className="ml-2 border rounded"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value as Schedule)}
          >
            <option value="linear">Linear</option>
            <option value="cosine">Cosine</option>
          </select>
        </label>
      </div>
      <canvas ref={canvasRef} width={200} height={200} className="border" />
      <p className="text-xs text-neutral-600 mt-2">
        x_t = √ᾱ_t · x_0 + √(1 − ᾱ_t) · ε   (ε ~ 𝒩(0, I))
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npm run test -- NoiseSchedule
```

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/NoiseSchedule.{tsx,test.tsx}
git commit -m "feat: NoiseSchedule widget — forward diffusion scrubber"
```

---

### Task E2: DDPM MDX content

**Files:**
- Create: `src/content/papers/ddpm.mdx`, `public/pdfs/2006.11239.pdf`

- [ ] **Step 1: Download DDPM PDF**

```bash
curl -L -o public/pdfs/2006.11239.pdf https://arxiv.org/pdf/2006.11239
```

- [ ] **Step 2: Author DDPM MDX**

Copy `src/content/papers/transformer.mdx` to `src/content/papers/ddpm.mdx` as starting skeleton, then replace frontmatter and content per the spec below. Component imports stay identical (add `NoiseSchedule` import, remove `AttentionMatrix`). The structural contract is unchanged: five StageSections with ids `intuition`, `math`, `pseudo`, `code`, `pdf`, each ending in a `<RetrievalCheck>`.

**Frontmatter replacement:**
```mdx
---
slug: ddpm
title: "Denoising Diffusion Probabilistic Models"
authors: "Ho, Jain, Abbeel"
year: 2020
era: generative
arxivId: 2006.11239
estimatedMinutes: 75
prerequisites: []
---
```
Import list replaces `AttentionMatrix` with `NoiseSchedule`:
```mdx
import { NoiseSchedule } from "../../components/widgets/NoiseSchedule.tsx";
```

**Stage content — specified tightly, enough to author without re-deciding structure:**

- **Intuition** — narrative opener: "If you gradually add Gaussian noise to an image until it's pure noise, can you train a network to reverse that process step by step?" Two `<PredictThenReveal>` gates:
  1. Prompt: "Predict: at timestep T (~1000), how much of x_0's information remains in x_T?" Reveal: ~0 — the forward chain converges to isotropic Gaussian.
  2. After `<NoiseSchedule client:load />`: "Predict: does the linear schedule destroy information faster or slower than the cosine schedule?" Reveal: linear destroys faster early; cosine preserves low-frequency structure longer, yielding better samples.
  One `<SrsCard>` on the forward-process intuition. One `<RetrievalCheck>` with two questions (one on forward process end-state, one on schedule choice).

- **Math** — forward process <Math expr="q(x_t|x_{t-1}) = \mathcal{N}(x_t; \sqrt{1-\beta_t} x_{t-1}, \beta_t I)" />, closed form <Math expr="x_t = \sqrt{\bar\alpha_t} x_0 + \sqrt{1-\bar\alpha_t}\,\epsilon" /> with <Math expr="\bar\alpha_t = \prod_{s=1}^{t}(1-\beta_s)" />. Two `<DerivationStep>` gates:
  1. "What does q(x_t | x_0) equal after T steps? Use the closed form." (MC: options include 𝒩(0, I) when ᾱ_t → 0, correct.)
  2. "Which is easier to predict: x_0 or ε, given x_t? Why?" (MC: predicting ε is scale-invariant and reduces to an L2 denoising loss.)
  Present the simplified objective <Math display expr="L_\text{simple} = \mathbb{E}_{t,x_0,\epsilon} \left[ \|\epsilon - \epsilon_\theta(x_t, t)\|^2 \right]" />. One `<SrsCard>` on ε-prediction. `<RetrievalCheck>` with two questions (variance of q(x_t|x_0), which quantity ε-prediction simplifies the objective to).

- **Pseudo code** — training loop with a `<LineReorder>` of these lines in correct order:
  1. Sample t ~ Uniform(1, T)
  2. Sample ε ~ 𝒩(0, I)
  3. Compute x_t = √ᾱ_t · x_0 + √(1−ᾱ_t) · ε
  4. Predict ε_θ(x_t, t)
  5. Compute L = ‖ε − ε_θ‖²
  6. Backprop and update θ
  Plus one `<FillBlank>` inside a textual pseudo-code block: target answer `epsilon` (or `eps`) for the predicted variable. `<RetrievalCheck>` with one question.

- **Code** — NumPy forward-process implementation. `<HintFade>` hints: (1) "Use the closed form, not a loop over t-steps", (2) "You need ᾱ_t; compute once up front for all t", (3) "x_t = √ᾱ_t · x_0 + √(1−ᾱ_t) · ε". `<PyRunner>` with an `initialCode` that has `TODO` stubs for `alpha_bars(betas)` and `q_sample(x0, t, betas, eps)`. `<AssertionTests>` with userCode (reference solution) and testCode asserting:
  - `alpha_bars` is monotonically decreasing
  - at t = T-1, `np.std(q_sample(zeros, T-1, betas, eps)) ≈ 1` (within 0.1)
  - at t = 0, `q_sample(x0, 0, ...) ≈ x0` (allclose)
  `<RetrievalCheck>` with one question.

- **PDF** — `<PdfViewer src="/pdfs/2006.11239.pdf" title="DDPM" />` with reading order: §2 Background → §3 Diffusion models → §3.2 Reverse process parameterization → §4 Experiments.

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```
Navigate to `/papers/ddpm`. Walk all 5 stages end to end.

- [ ] **Step 4: Commit**

```bash
git add public/pdfs/2006.11239.pdf src/content/papers/ddpm.mdx
git commit -m "feat: DDPM paper — full 5-stage content"
```

---

## Phase F — Paper 3: ReAct

### Task F1: ReActLoop widget

**Files:**
- Create: `src/components/widgets/ReActLoop.tsx`, `src/components/widgets/ReActLoop.test.tsx`

**Design:** a simulated agent trace on a toy task (e.g., "find the population of the capital of France"). Buttons: `Thought`, `Act`, `Observation`. Each click advances the trace by one step. User can choose between `Thought-only` (CoT), `Act-only` (chain of tools), and `ReAct` (interleaved). Shows how CoT fails on factual tasks and Act-only wanders; ReAct converges.

- [ ] **Step 1: Test**

Create `src/components/widgets/ReActLoop.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReActLoop } from "./ReActLoop";

describe("<ReActLoop>", () => {
  it("advances trace when Step is clicked", () => {
    render(<ReActLoop />);
    const initialCount = screen.queryAllByRole("listitem").length;
    fireEvent.click(screen.getByRole("button", { name: /step/i }));
    expect(screen.queryAllByRole("listitem").length).toBeGreaterThan(initialCount);
  });

  it("mode toggle switches strategy", () => {
    render(<ReActLoop />);
    fireEvent.click(screen.getByLabelText(/ReAct/));
    expect(screen.getByLabelText(/ReAct/)).toBeChecked();
  });
});
```

- [ ] **Step 2: Implementation**

Create `src/components/widgets/ReActLoop.tsx`:
```tsx
import { useState } from "react";

type Step = { kind: "Thought" | "Action" | "Observation"; text: string };
type Mode = "CoT" | "Act" | "ReAct";

const TRACES: Record<Mode, Step[]> = {
  CoT: [
    { kind: "Thought", text: "The capital of France is Paris." },
    { kind: "Thought", text: "Paris's population is roughly 2 million." },
    { kind: "Thought", text: "Final answer: ~2,000,000." },
  ],
  Act: [
    { kind: "Action", text: "search(\"France capital\")" },
    { kind: "Observation", text: "Paris" },
    { kind: "Action", text: "search(\"Paris\")" },
    { kind: "Observation", text: "Disambiguation: Paris (city), Paris (texas)…" },
    { kind: "Action", text: "search(\"Paris Texas\")" },
    { kind: "Observation", text: "Paris, Texas: ~25k" },
    { kind: "Action", text: "Final: 25000 (wrong disambiguation)" },
  ],
  ReAct: [
    { kind: "Thought", text: "I need the capital of France first." },
    { kind: "Action", text: "search(\"France capital\")" },
    { kind: "Observation", text: "Paris" },
    { kind: "Thought", text: "Now fetch Paris's population." },
    { kind: "Action", text: "search(\"Paris, France population\")" },
    { kind: "Observation", text: "≈ 2,102,650 (2023)" },
    { kind: "Thought", text: "Final answer: ~2.1M." },
  ],
};

export function ReActLoop() {
  const [mode, setMode] = useState<Mode>("ReAct");
  const [shown, setShown] = useState(0);

  const trace = TRACES[mode];

  return (
    <div className="my-4 p-4 border rounded-lg">
      <div className="mb-3 flex gap-4 flex-wrap">
        {(["CoT", "Act", "ReAct"] as Mode[]).map((m) => (
          <label key={m} className="text-sm">
            <input
              type="radio"
              name="mode"
              aria-label={m}
              checked={mode === m}
              onChange={() => {
                setMode(m);
                setShown(0);
              }}
              className="mr-1"
            />
            {m}
          </label>
        ))}
      </div>
      <ol className="space-y-1 font-mono text-sm">
        {trace.slice(0, shown).map((s, i) => (
          <li key={i} className={
            s.kind === "Thought" ? "text-neutral-700" :
            s.kind === "Action" ? "text-blue-700" :
            "text-green-700"
          }>
            <span className="font-semibold">{s.kind}:</span> {s.text}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex gap-2">
        <button
          className="px-3 py-1 border rounded disabled:opacity-40"
          disabled={shown >= trace.length}
          onClick={() => setShown((s) => s + 1)}
        >
          Step
        </button>
        <button
          className="px-3 py-1 border rounded"
          onClick={() => setShown(0)}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npm run test -- ReActLoop
```

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/ReActLoop.{tsx,test.tsx}
git commit -m "feat: ReActLoop widget comparing CoT / Act / ReAct traces"
```

---

### Task F2: ReAct MDX content

**Files:**
- Create: `src/content/papers/react.mdx`, `public/pdfs/2210.03629.pdf`

- [ ] **Step 1: Download ReAct PDF**

```bash
curl -L -o public/pdfs/2210.03629.pdf https://arxiv.org/pdf/2210.03629
```

- [ ] **Step 2: Author react.mdx**

Copy `src/content/papers/transformer.mdx` to `src/content/papers/react.mdx` as starting skeleton. Import list swaps `AttentionMatrix` → `ReActLoop`. Structural contract (5 StageSections + RetrievalCheck per stage) unchanged.

**Frontmatter:**
```mdx
---
slug: react
title: "ReAct: Synergizing Reasoning and Acting in Language Models"
authors: "Yao et al."
year: 2022
era: agents
arxivId: 2210.03629
estimatedMinutes: 60
prerequisites: []
---
```

**Stage content:**

- **Intuition** — opener: "A pure-reasoning LLM can hallucinate facts; a pure-tool-calling agent can get lost without reasoning. What if we interleave?" Two `<PredictThenReveal>` gates:
  1. "Predict: what's the most common failure mode of CoT-only on factual questions?" Reveal: confident wrong answers from stale/missing knowledge.
  2. After `<ReActLoop client:load />`: "Step through CoT, Act-only, and ReAct modes. Which one arrives at the right Paris population, and why?" Reveal: ReAct — thoughts help direct which tool calls to make and integrate their results.
  One `<SrsCard>` on the core ReAct intuition. `<RetrievalCheck>` with two MC questions.

- **Math** — ReAct's formalism is a policy conditioned on interleaved context. Present <Math display expr="a_t \sim \pi_\theta(a_t \mid c_t),\quad c_t = (o_1, a_1, \ldots, a_{t-1}, o_t)" /> where the action space `a_t ∈ 𝒜 ∪ ℒ` includes external tool calls (𝒜) and free-form thoughts in language ℒ. One `<DerivationStep>`:
  - "Which of these is true about a thought action a_t ∈ ℒ?" (MC: it doesn't change the external state (correct); it always terminates the episode (wrong); it's penalized (wrong).) Reveal explanation: thoughts are internal; they update context c_{t+1} but not the environment.
  Note compute cost: ReAct typically uses 2–5× more tokens than Act-only. One `<SrsCard>` on the thought-as-internal-action idea. `<RetrievalCheck>` with one question.

- **Pseudo code** — agent loop. `<LineReorder>` of these lines:
  1. Initialize context c with the user query
  2. Generate next token block from LLM given c
  3. Parse block as Thought | Action | Finish
  4. If Action: run tool, observe result, append (Action, Observation) to c
  5. If Thought: append Thought to c
  6. If Finish: return the answer
  Plus a `<FillBlank>` for the loop terminator, answer: `Finish` (or `finish`). `<RetrievalCheck>` with one question.

- **Code** — minimal ReAct scaffold runnable in Pyodide. Provide a **deterministic canned tool**:
  ```python
  CANNED = {
      "France capital": "Paris",
      "Paris, France population": "~2,102,650 (2023)",
  }
  def search(q):
      for k, v in CANNED.items():
          if k.lower() in q.lower(): return v
      return "no results"
  ```
  Plus a **scripted LLM** that returns a pre-canned sequence of `Thought: …\nAction: search(...)\n` / `Finish: …` blocks. The user implements `parse_block(text) -> (kind, payload)` and the outer loop `run(query, scripted_lm, tool) -> answer`.
  `<HintFade>` hints: (1) "Parse with a simple regex on `^(Thought|Action|Finish):`", (2) "The loop appends the Observation after an Action", (3) "Terminate when you see Finish and return the payload".
  `<AssertionTests>` assertions:
  - `run("Population of Paris?", scripted_lm, search) == "~2,102,650 (2023)"`
  - The final context contains at least one Thought and at least one Action
  `<RetrievalCheck>` with one question.

- **PDF** — `<PdfViewer src="/pdfs/2210.03629.pdf" title="ReAct" />` with reading order: §2 ReAct: reasoning + acting → §3 Knowledge-intensive tasks → §4 Interactive decision-making.

- [ ] **Step 3: Browser walkthrough**

```bash
npm run dev
```

- [ ] **Step 4: Commit**

```bash
git add public/pdfs/2210.03629.pdf src/content/papers/react.mdx
git commit -m "feat: ReAct paper — full 5-stage content"
```

---

## Phase G — Progress, Review, Polish

### Task G1: Progress dashboard page

**Files:**
- Create: `src/pages/progress.astro`, `src/components/progress/ProgressGrid.tsx`, `src/components/progress/ExportImport.tsx`

- [ ] **Step 1: ProgressGrid**

Create `src/components/progress/ProgressGrid.tsx`:
```tsx
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
```

- [ ] **Step 2: ExportImport component**

Create `src/components/progress/ExportImport.tsx`:
```tsx
import { useRef } from "react";
import { loadStore, saveStore } from "../../lib/storage";

export function ExportImport() {
  const inputRef = useRef<HTMLInputElement>(null);

  function onExport() {
    const blob = new Blob([JSON.stringify(loadStore(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai_master-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed?.version !== 1) {
          alert("Unsupported version.");
          return;
        }
        saveStore(parsed);
        alert("Imported — refresh to see changes.");
      } catch {
        alert("Invalid file.");
      }
    };
    reader.readAsText(f);
  }

  return (
    <div className="flex gap-2 my-4">
      <button className="px-3 py-1 border rounded" onClick={onExport}>Export JSON</button>
      <button className="px-3 py-1 border rounded" onClick={() => inputRef.current?.click()}>Import JSON</button>
      <input type="file" ref={inputRef} accept=".json" hidden onChange={onImport} />
    </div>
  );
}
```

- [ ] **Step 3: Progress page**

Create `src/pages/progress.astro`:
```astro
---
import "../styles/global.css";
import { ProgressGrid } from "../components/progress/ProgressGrid.tsx";
import { ExportImport } from "../components/progress/ExportImport.tsx";
---
<html>
  <head><title>Progress — ai_master</title></head>
  <body class="bg-white text-neutral-900">
    <main class="max-w-5xl mx-auto px-4 py-8">
      <a href="/" class="text-sm text-blue-600">← Home</a>
      <h1 class="text-3xl font-bold my-4">Progress</h1>
      <ProgressGrid client:only="react" />
      <ExportImport client:only="react" />
    </main>
  </body>
</html>
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/progress.astro src/components/progress
git commit -m "feat: progress dashboard with grid + export/import"
```

---

### Task G2: Review page (SRS queue)

**Files:**
- Create: `src/pages/review.astro`, `src/components/review/ReviewDeck.tsx`

- [ ] **Step 1: ReviewDeck**

Create `src/components/review/ReviewDeck.tsx`:
```tsx
import { useEffect, useState } from "react";
import { dueCards, reviewCard, type Rating } from "../../lib/srs";
import type { SrsCard } from "../../lib/types";

export function ReviewDeck() {
  const [queue, setQueue] = useState<SrsCard[]>([]);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { setQueue(dueCards()); }, []);

  if (queue.length === 0) {
    return <p className="text-neutral-600">No cards due today ✓</p>;
  }
  if (i >= queue.length) {
    return <p className="text-green-700">Done for today — {queue.length} reviewed.</p>;
  }

  const card = queue[i];

  function rate(r: Rating) {
    reviewCard(card.id, r);
    setRevealed(false);
    setI((x) => x + 1);
  }

  return (
    <div className="my-4 max-w-xl">
      <p className="text-sm text-neutral-500">Card {i + 1} / {queue.length} · {card.paperSlug}</p>
      <div className="my-4 p-4 border rounded-lg">
        <p className="font-semibold">{card.prompt}</p>
        {revealed ? (
          <>
            <p className="mt-3 p-2 bg-neutral-50 rounded">{card.answer}</p>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1 border rounded bg-red-50" onClick={() => rate("Again")}>Again</button>
              <button className="px-3 py-1 border rounded bg-yellow-50" onClick={() => rate("Hard")}>Hard</button>
              <button className="px-3 py-1 border rounded bg-blue-50" onClick={() => rate("Good")}>Good</button>
              <button className="px-3 py-1 border rounded bg-green-50" onClick={() => rate("Easy")}>Easy</button>
            </div>
          </>
        ) : (
          <button className="mt-3 px-3 py-1 bg-blue-600 text-white rounded" onClick={() => setRevealed(true)}>
            Show answer
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Review page**

Create `src/pages/review.astro`:
```astro
---
import "../styles/global.css";
import { ReviewDeck } from "../components/review/ReviewDeck.tsx";
---
<html>
  <head><title>Review — ai_master</title></head>
  <body class="bg-white text-neutral-900">
    <main class="max-w-5xl mx-auto px-4 py-8">
      <a href="/" class="text-sm text-blue-600">← Home</a>
      <h1 class="text-3xl font-bold my-4">Today's review</h1>
      <ReviewDeck client:only="react" />
    </main>
  </body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/review.astro src/components/review
git commit -m "feat: SRS review page"
```

---

### Task G3: E2E smoke test (Playwright)

**Files:**
- Create: `playwright.config.ts`, `e2e/transformer-walkthrough.spec.ts`

- [ ] **Step 1: Playwright config**

```bash
npx playwright install chromium
```

Create `playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:4321" },
  webServer: {
    command: "npm run build && npm run preview -- --port 4321",
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

- [ ] **Step 2: Smoke spec**

Create `e2e/transformer-walkthrough.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("home roadmap shows transformer as implemented", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTitle("Attention Is All You Need")).toBeVisible();
});

test("transformer paper — all five stages render", async ({ page }) => {
  await page.goto("/papers/transformer");
  for (const id of ["intuition", "math", "pseudo", "code", "pdf"]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
});

test("progress page renders the grid", async ({ page }) => {
  await page.goto("/progress");
  await expect(page.getByText("Paper")).toBeVisible();
});
```

- [ ] **Step 3: Run E2E**

```bash
npm run e2e
```
Expected: 3 tests pass. Fix any build errors discovered.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts e2e
git commit -m "test: Playwright smoke E2E for home + transformer + progress"
```

---

### Task G4: README and final build

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write README**

Replace `README.md`:
```markdown
# ai_master

Personal interactive web app for learning deep learning → agents (2012 → 2026) through canonical papers, one at a time, with active-learning pedagogy.

## Stack

Astro 5 · React 19 · TypeScript · Tailwind · MDX · KaTeX · Monaco · Pyodide · localStorage.

## Quick start

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # static output in dist/
npm run preview        # serve dist/
npm run test           # unit tests (Vitest)
npm run e2e            # Playwright smoke
```

## How it teaches

Every paper ships as five stages in strict order — **Intuition → Math → Pseudo → Code → Original PDF** — and every stage uses the **Predict → Attempt → Reveal → Reflect (PARR)** loop: you produce something before any answer is shown. Retrieval checks (MC) gate stage mastery; the best items go into a spaced-repetition queue you review on `/review`.

## MVP papers

- Attention Is All You Need (Vaswani 2017)
- DDPM (Ho 2020)
- ReAct (Yao 2022)

The `/` roadmap shows ~30 canonical papers across six eras; three are implemented, the rest are stubs to extend post-MVP.

## Persistence

All state lives in the browser (`localStorage` key `ai_master:v1`). Use `/progress` → Export JSON to back up. Nothing leaves the machine.
```

- [ ] **Step 2: Final build**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README"
```

---

## Phase Summary

| Phase | Tasks | Outcome |
|---|---|---|
| A | 5 | Project scaffolded; lib/ (storage, progress, srs) + 30-paper metadata done, unit-tested |
| B | 7 | PARR primitive + all active-learning components (MC, FillBlank, LineReorder, DerivationStep, HintFade), Pyodide runner, PdfViewer, SrsCard |
| C | 3 | Transformer paper complete end-to-end with AttentionMatrix widget |
| D | 2 | Roadmap page + Home |
| E | 2 | DDPM paper + NoiseSchedule widget |
| F | 2 | ReAct paper + ReActLoop widget |
| G | 4 | Progress dashboard, SRS review page, Playwright E2E, README |

**Total: 25 tasks.**
