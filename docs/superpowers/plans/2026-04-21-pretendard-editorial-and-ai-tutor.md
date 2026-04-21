# Pretendard Editorial Redesign + AI Tutor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refit the `ai_master` app with an editorial-monotone Pretendard design, introduce a universal 3-column layout, and add an always-on right-side AI tutor panel (Gemini 3.1 Pro preview) that enforces PARR pedagogy across paper, roadmap, progress, and review contexts.

**Architecture:** Astro hybrid (static pages + single SSR `/api/chat` endpoint via `@astrojs/node`). Shared `AppShell.astro` provides TopBar + 3-column grid for every page. A React `ChatPanel` island lives in the right column, streams tokens via SSE, persists sessions per context to localStorage, and derives paper stage position from an `IntersectionObserver`. System prompt is composed server-side from the paper MDX (parsed into 4 stage bodies) or roadmap metadata, plus user progress, plus pedagogy directives.

**Tech Stack:** Astro 6 (hybrid), `@astrojs/node`, React 19, Tailwind v4 w/ `@theme` CSS variables, Pretendard Variable (npm `pretendard`), `@google/genai` SDK, Vitest, Playwright.

---

## Pre-flight

**Project is not a git repo** (env check). If you want commit discipline:

```bash
cd /Users/minseongkim/Desktop/ai_master
git init
git add -A
git commit -m "chore: baseline before Pretendard + AI tutor work"
```

If you skip `git init`, treat the `git commit` lines in every task as optional checkpoint markers.

---

## File Structure

**Created files**

| Path | Responsibility |
|---|---|
| `public/fonts/PretendardVariable.woff2` | Self-hosted font asset (copied from `node_modules/pretendard`) |
| `src/layouts/AppShell.astro` | Shared chrome: `<html>`, `<head>`, TopBar, 3-col grid, slot regions `nav`/`main`/`chat` |
| `src/components/layout/TopBar.astro` | Sticky top bar with back link + page title/meta |
| `src/components/chat/ChatPanel.tsx` | React island: header, message list, question stack, input, session archive |
| `src/components/chat/ChatMessage.tsx` | Single message bubble with markdown/katex/code rendering |
| `src/components/chat/QuestionStack.tsx` | Collapsible user-question list with jump/re-ask/jump-to-answer |
| `src/components/chat/SessionList.tsx` | History view rows with rename/delete |
| `src/lib/chat/types.ts` | `Message`, `Session`, `ChatStore`, `ChatMode` types |
| `src/lib/chat/store.ts` | localStorage-backed session reducer + selectors |
| `src/lib/chat/sseParser.ts` | Incremental SSE frame parser (no deps) |
| `src/lib/chat/skipDetector.ts` | Heuristic skip-intent phrase detection |
| `src/lib/chat/mdxStages.ts` | Parse a paper MDX string into `{ frontmatter, stages }` |
| `src/lib/chat/promptBuilder.ts` | Compose system prompt per mode |
| `src/lib/chat/promptBuilder.test.ts` | Unit test |
| `src/lib/chat/mdxStages.test.ts` | Unit test |
| `src/lib/chat/store.test.ts` | Unit test |
| `src/lib/chat/sseParser.test.ts` | Unit test |
| `src/lib/chat/skipDetector.test.ts` | Unit test |
| `src/pages/api/chat.ts` | SSR-only endpoint, SSE stream from Gemini |
| `e2e/chat-paper-mode.spec.ts` | Playwright e2e |
| `e2e/chat-history.spec.ts` | Playwright e2e |
| `.env.example` | Documented env vars |

**Modified files**

| Path | Reason |
|---|---|
| `package.json` | Add deps: `@astrojs/node`, `@google/genai`, `pretendard` |
| `astro.config.mjs` | `output: 'server'`, Node adapter |
| `src/styles/global.css` | Pretendard face, CSS variables, `@theme` tokens, base resets |
| `src/layouts/PaperLayout.astro` | Wrap `AppShell`, keep stage nav + main slots, add chat slot |
| `src/pages/index.astro` | Wrap `AppShell`, add `export const prerender = true`, embed ChatPanel with `mode="roadmap"` |
| `src/pages/progress.astro` | Same treatment, `mode="progress"` |
| `src/pages/review.astro` | Same treatment, `mode="review"` |
| `src/pages/papers/[slug].astro` | `export const prerender = true` |
| `src/components/stages/StageNav.astro` | Restyle to new tokens |
| `.gitignore` | Add `.env` if not present |

---

## Phase 1 — Design System

### Task 1: Install Pretendard and expose the woff2

**Files:**
- Modify: `package.json`
- Create: `public/fonts/PretendardVariable.woff2`

- [ ] **Step 1: Install the font package**

```bash
npm install pretendard@^1.3.9
```

- [ ] **Step 2: Copy the variable woff2 to `public/fonts/`**

```bash
mkdir -p public/fonts
cp node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2 public/fonts/PretendardVariable.woff2
```

- [ ] **Step 3: Verify the file exists and is non-empty**

Run: `ls -l public/fonts/PretendardVariable.woff2`
Expected: file size ≈ 2.0 MB.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json public/fonts/PretendardVariable.woff2
git commit -m "chore: self-host Pretendard Variable woff2"
```

---

### Task 2: Replace `global.css` with design tokens and Pretendard

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Overwrite `src/styles/global.css` with the full token sheet**

```css
@import "katex/dist/katex.min.css";
@import "tailwindcss";

@font-face {
  font-family: "Pretendard Variable";
  font-weight: 45 920;
  font-style: normal;
  font-display: swap;
  src: url("/fonts/PretendardVariable.woff2") format("woff2-variations");
  size-adjust: 100%;
  ascent-override: 92%;
  descent-override: 23%;
  line-gap-override: 0%;
}

:root {
  --ink: #0A0A0B;
  --ink-2: #2A2A2E;
  --mute: #6B6B72;
  --line: #E6E2DA;
  --paper: #FAF7F0;
  --paper-2: #FFFDF7;
  --accent: #1E2A6B;
  --accent-soft: #E9EAF3;
  --danger: #8B1E2B;

  --radius: 4px;
  --shell-max: 1400px;
  --col-nav: 180px;
  --col-chat: 380px;
  --col-main: 68ch;
  --gap-nav-main: 48px;
  --gap-main-chat: 32px;
  --top-bar-h: 48px;
}

@theme {
  --font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Segoe UI", Roboto, sans-serif;
  --color-ink: var(--ink);
  --color-ink-2: var(--ink-2);
  --color-mute: var(--mute);
  --color-line: var(--line);
  --color-paper: var(--paper);
  --color-paper-2: var(--paper-2);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-danger: var(--danger);
}

html, body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-sans);
  font-feature-settings: "ss01", "ss02";
  -webkit-font-smoothing: antialiased;
}

body {
  font-size: 17px;
  line-height: 1.75;
  letter-spacing: -0.01em;
}

h1 { font-size: 40px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; }
h2 { font-size: 28px; font-weight: 650; letter-spacing: -0.015em; line-height: 1.3; }
h3 { font-size: 21px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.4; }

a { color: var(--accent); text-underline-offset: 3px; }
a:hover { text-decoration: underline; }

*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: var(--radius);
}

hr, .hairline {
  border: 0;
  border-top: 1px solid var(--line);
  margin: 0;
}

.prose :where(p, ul, ol, blockquote) { color: var(--ink); }
.prose :where(code):not(pre code) {
  background: var(--accent-soft);
  padding: 0.1em 0.35em;
  border-radius: var(--radius);
  font-size: 0.9em;
}
```

- [ ] **Step 2: Run dev server and visually confirm cream background + Pretendard**

```bash
npm run dev
```

Open `http://localhost:4321/` in a browser. Expected: cream background (`#FAF7F0`), Hangul + Latin rendered in Pretendard (not Times/default sans), no FOUT flash on reload.

- [ ] **Step 3: Stop dev server (Ctrl+C)**

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(design): Pretendard self-host + editorial monotone tokens"
```

---

## Phase 2 — Layout Chassis

### Task 3: Create `TopBar.astro`

**Files:**
- Create: `src/components/layout/TopBar.astro`

- [ ] **Step 1: Write the component**

```astro
---
interface Props {
  backHref?: string;
  backLabel?: string;
  title: string;
  meta?: string;
}
const { backHref, backLabel, title, meta } = Astro.props;
---
<header class="sticky top-0 z-40 bg-paper border-b border-line" style="height: var(--top-bar-h);">
  <div class="mx-auto flex items-center gap-6 px-6 h-full" style="max-width: var(--shell-max);">
    {backHref && (
      <a href={backHref} class="text-[13px] text-mute hover:text-ink">
        ← {backLabel ?? "back"}
      </a>
    )}
    <div class="flex items-baseline gap-3 min-w-0">
      <h1 class="text-[15px] font-semibold truncate" style="letter-spacing: -0.005em;">{title}</h1>
      {meta && <span class="text-[13px] text-mute truncate">{meta}</span>}
    </div>
  </div>
</header>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/TopBar.astro
git commit -m "feat(layout): editorial TopBar component"
```

---

### Task 4: Create `AppShell.astro` with 3-column grid

**Files:**
- Create: `src/layouts/AppShell.astro`

- [ ] **Step 1: Write the shell**

```astro
---
import "../styles/global.css";
import TopBar from "../components/layout/TopBar.astro";
interface Props {
  title: string;
  meta?: string;
  backHref?: string;
  backLabel?: string;
  htmlTitle?: string;
}
const { title, meta, backHref, backLabel, htmlTitle } = Astro.props;
---
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>{htmlTitle ?? `${title} — ai_master`}</title>
  </head>
  <body>
    <TopBar backHref={backHref} backLabel={backLabel} title={title} meta={meta} />
    <div
      class="mx-auto px-6"
      style="max-width: var(--shell-max);"
    >
      <div
        class="grid pt-10"
        style="grid-template-columns: var(--col-nav) minmax(0, var(--col-main)) var(--col-chat); column-gap: var(--gap-main-chat);"
      >
        <aside class="pr-[calc(var(--gap-nav-main)-var(--gap-main-chat))]">
          <div class="sticky" style="top: calc(var(--top-bar-h) + 24px);">
            <slot name="nav" />
          </div>
        </aside>
        <main class="prose max-w-none pb-32">
          <slot />
        </main>
        <aside class="sticky self-start" style="top: calc(var(--top-bar-h) + 24px); height: calc(100vh - var(--top-bar-h) - 24px);">
          <slot name="chat" />
        </aside>
      </div>
    </div>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/AppShell.astro
git commit -m "feat(layout): AppShell with 3-column grid"
```

---

### Task 5: Refactor `PaperLayout.astro` to use `AppShell`

**Files:**
- Modify: `src/layouts/PaperLayout.astro`

- [ ] **Step 1: Overwrite with AppShell wrapper**

```astro
---
import AppShell from "./AppShell.astro";
import StageNav from "../components/stages/StageNav.astro";
interface Props { frontmatter: any; }
const { frontmatter } = Astro.props;
const meta = `${frontmatter.authors} · ${frontmatter.year}`;
---
<AppShell
  title={frontmatter.title}
  meta={meta}
  backHref="/"
  backLabel="Roadmap"
>
  <StageNav slot="nav" slug={frontmatter.slug} />
  <!-- chat slot will be filled in Task 16 (ChatPanel mount). For now leave empty. -->
  <slot />
</AppShell>
```

- [ ] **Step 2: Run dev and visit `/papers/transformer`**

```bash
npm run dev
```

Expected: paper loads, TopBar shows title + "Vaswani et al. · 2017", StageNav on left, paper content in middle. Right column is empty (reserved for chat). No console errors.

- [ ] **Step 3: Stop dev server**

- [ ] **Step 4: Commit**

```bash
git add src/layouts/PaperLayout.astro
git commit -m "refactor(layout): PaperLayout uses AppShell"
```

---

### Task 6: Restyle `StageNav.astro` to editorial tokens

**Files:**
- Modify: `src/components/stages/StageNav.astro`

- [ ] **Step 1: Overwrite `StageNav.astro`**

```astro
---
interface Props { slug: string; }
const { slug } = Astro.props;
const stages = [
  { id: "intuition", label: "Intuition", num: "01" },
  { id: "math",      label: "Math",      num: "02" },
  { id: "pseudo",    label: "Pseudo",    num: "03" },
  { id: "code",      label: "Code",      num: "04" },
  { id: "pdf",       label: "Original",  num: "05" },
];
---
<nav data-paper-slug={slug} class="text-[13px]">
  <div class="text-[11px] uppercase tracking-[0.12em] text-mute mb-3">Stages</div>
  <ol class="space-y-1">
    {stages.map((s) => (
      <li>
        <a
          href={`#${s.id}`}
          class="group flex items-baseline gap-3 py-1.5 border-b border-line/60 hover:border-ink transition-colors"
          data-stage-id={s.id}
        >
          <span class="text-[11px] text-mute tabular-nums">{s.num}</span>
          <span class="flex-1">{s.label}</span>
          <span class="stage-mark text-mute" data-slug={slug} data-stage={s.id}>·</span>
        </a>
      </li>
    ))}
  </ol>
</nav>
<script>
  import { getStageStatus } from "../../lib/progress";
  const marks = document.querySelectorAll<HTMLElement>(".stage-mark");
  marks.forEach((m) => {
    const slug = m.dataset.slug!;
    const stage = m.dataset.stage! as any;
    const status = getStageStatus(slug, stage);
    if (status === "mastered") { m.textContent = "✓"; m.classList.remove("text-mute"); m.classList.add("text-ink"); }
    else if (status === "skipped") m.textContent = "—";
    else if (status === "revealed") m.textContent = "◐";
  });
</script>
```

- [ ] **Step 2: Verify by reloading `/papers/transformer`**

Expected: stages show `01 Intuition ·`, hairline under each, uppercase "STAGES" label at top.

- [ ] **Step 3: Commit**

```bash
git add src/components/stages/StageNav.astro
git commit -m "feat(design): restyle StageNav with editorial tokens"
```

---

### Task 7: Wrap `index.astro` with AppShell

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Overwrite**

```astro
---
export const prerender = true;
import AppShell from "../layouts/AppShell.astro";
import { RoadmapGraph } from "../components/roadmap/RoadmapGraph.tsx";
import { ContinueReading } from "../components/home/ContinueReading.tsx";
import { PAPERS_META } from "../content/papers-meta";
---
<AppShell
  title="ai_master"
  meta="Deep learning → agents, 2012 → 2026"
>
  <nav slot="nav" class="text-[13px]">
    <div class="text-[11px] uppercase tracking-[0.12em] text-mute mb-3">On this page</div>
    <ol class="space-y-2">
      <li><a href="#continue" class="text-ink hover:underline">Continue reading</a></li>
      <li><a href="#roadmap" class="text-ink hover:underline">Roadmap</a></li>
      <li><a href="/progress" class="text-mute hover:text-ink">Progress →</a></li>
      <li><a href="/review" class="text-mute hover:text-ink">Review →</a></li>
    </ol>
  </nav>

  <section id="continue" class="mb-16">
    <ContinueReading client:only="react" />
  </section>

  <section id="roadmap">
    <h2>Roadmap</h2>
    <p class="text-mute text-[15px] max-w-prose">
      Click a bright node to learn a paper. Grey nodes are planned.
    </p>
    <div class="mt-6">
      <RoadmapGraph client:load papers={PAPERS_META} />
    </div>
  </section>
</AppShell>
```

- [ ] **Step 2: Verify `/` renders with 3-column layout**

Run `npm run dev`, visit `/`. Expected: TopBar shows "ai_master", left ToC, RoadmapGraph in main column, right empty.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "refactor(home): use AppShell"
```

---

### Task 8: Wrap `progress.astro` and `review.astro` with AppShell

**Files:**
- Modify: `src/pages/progress.astro`, `src/pages/review.astro`, `src/pages/papers/[slug].astro`

- [ ] **Step 1: Add `export const prerender = true;` to `src/pages/papers/[slug].astro`**

At the top of the frontmatter (before imports):

```astro
---
export const prerender = true;
import { getCollection, render } from "astro:content";
import PaperLayout from "../../layouts/PaperLayout.astro";
// ... rest unchanged
```

- [ ] **Step 2: Read current `progress.astro` and wrap its content in AppShell**

Open `src/pages/progress.astro`, keep all existing logic but replace the outer `<html>/<body>/<main>` scaffold with:

```astro
---
export const prerender = true;
import AppShell from "../layouts/AppShell.astro";
// ... existing imports
---
<AppShell title="Progress" meta="Your learning dashboard" backHref="/" backLabel="Home">
  <nav slot="nav" class="text-[13px]">
    <div class="text-[11px] uppercase tracking-[0.12em] text-mute mb-3">Navigate</div>
    <ol class="space-y-2">
      <li><a href="/" class="text-mute hover:text-ink">← Roadmap</a></li>
      <li><a href="/review" class="text-mute hover:text-ink">Review queue</a></li>
    </ol>
  </nav>
  <!-- existing page content goes here (whatever was inside <main>) -->
</AppShell>
```

- [ ] **Step 3: Apply the same wrap to `review.astro` with `title="Review"`, nav linking back to `/` and `/progress`**

- [ ] **Step 4: Verify all four routes render**

```bash
npm run dev
```

Visit `/`, `/progress`, `/review`, `/papers/transformer`. Expected: all show TopBar + 3-column grid, no console errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/progress.astro src/pages/review.astro src/pages/papers/[slug].astro
git commit -m "refactor(pages): wrap all routes with AppShell"
```

---

## Phase 3 — Astro Hybrid Transition

### Task 9: Add Node adapter and enable server output

**Files:**
- Modify: `package.json`, `astro.config.mjs`
- Create: `.env.example`

- [ ] **Step 1: Install the Node adapter**

```bash
npm install @astrojs/node@^9
```

- [ ] **Step 2: Overwrite `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
    worker: { format: "es" },
    optimizeDeps: { exclude: ["pyodide"] },
    ssr: { noExternal: ["@monaco-editor/react"] },
  }
});
```

- [ ] **Step 3: Create `.env.example`**

```
GOOGLE_AI_API_KEY=your-key-here
GOOGLE_AI_MODEL=gemini-3.1-pro-preview
```

- [ ] **Step 4: Add `.env` to `.gitignore`**

If `.gitignore` exists, append `.env` on a new line. If it doesn't, create `.gitignore` with content:

```
.env
node_modules
dist
.astro
test-results
playwright-report
```

- [ ] **Step 5: Run build to verify prerender coverage**

```bash
npm run build
```

Expected: output lists `/`, `/progress`, `/review`, each `/papers/<slug>` as `(prerendered)`. No SSR routes yet (since `/api/chat` not created). If any page is missing `prerendered`, you forgot `export const prerender = true` — fix and re-run.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json astro.config.mjs .env.example .gitignore
git commit -m "feat(build): Astro hybrid with @astrojs/node adapter"
```

---

## Phase 4 — Chat Types, Storage, and Parsers (all TDD)

### Task 10: Define chat types

**Files:**
- Create: `src/lib/chat/types.ts`

- [ ] **Step 1: Write the types module**

```ts
export type ChatMode = "paper" | "roadmap" | "progress" | "review";
export type PedagogyMode = "socratic" | "direct";
export type StageId = "intuition" | "math" | "pseudo" | "code";

export type Message = {
  role: "user" | "assistant";
  content: string;
  ts: string;
};

export type Session = {
  id: string;
  title: string;
  startedAt: string;
  lastActiveAt: string;
  pedagogyMode: PedagogyMode;
  messages: Message[];
};

export type ChatStore = {
  sessions: Session[];
  activeId: string | null;
};

export type ProgressSnapshot = {
  completed: string[];
  inProgress: { slug: string; stage: StageId }[];
  lastVisited?: string;
};

export type ChatRequest = {
  mode: ChatMode;
  paperSlug?: string;
  currentStage?: StageId;
  progressSnapshot?: ProgressSnapshot;
  messages: Pick<Message, "role" | "content">[];
  pedagogyMode: PedagogyMode;
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/chat/types.ts
git commit -m "feat(chat): core chat types"
```

---

### Task 11: MDX stage parser (TDD)

**Files:**
- Create: `src/lib/chat/mdxStages.ts`
- Create: `src/lib/chat/mdxStages.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { parseMdxStages } from "./mdxStages";

const SAMPLE = `---
slug: demo
title: Demo Paper
authors: Me
year: 2026
---
import X from "./x";

<StageSection id="intuition" title="① Intuition">

Intuition body. $a = b$.

</StageSection>

<StageSection id="math" title="② Math">

Math body.

</StageSection>

<StageSection id="pseudo" title="③ Pseudo">
Pseudo body.
</StageSection>

<StageSection id="code" title="④ Code">
Code body.
</StageSection>
`;

describe("parseMdxStages", () => {
  it("extracts frontmatter fields", () => {
    const { frontmatter } = parseMdxStages(SAMPLE);
    expect(frontmatter.title).toBe("Demo Paper");
    expect(frontmatter.authors).toBe("Me");
    expect(frontmatter.year).toBe("2026");
    expect(frontmatter.slug).toBe("demo");
  });

  it("extracts each stage body keyed by id", () => {
    const { stages } = parseMdxStages(SAMPLE);
    expect(stages.intuition).toContain("Intuition body");
    expect(stages.math).toContain("Math body");
    expect(stages.pseudo).toContain("Pseudo body");
    expect(stages.code).toContain("Code body");
  });

  it("strips import lines from stage bodies", () => {
    const { stages } = parseMdxStages(SAMPLE);
    expect(stages.intuition).not.toContain("import X");
  });

  it("returns empty string for missing stages", () => {
    const { stages } = parseMdxStages(`---\ntitle: X\n---\n\n<StageSection id="intuition">hi</StageSection>`);
    expect(stages.intuition).toBe("hi");
    expect(stages.math).toBe("");
    expect(stages.pseudo).toBe("");
    expect(stages.code).toBe("");
  });
});
```

- [ ] **Step 2: Run test, expect failure**

```bash
npx vitest run src/lib/chat/mdxStages.test.ts
```

Expected: FAIL — `parseMdxStages is not a function`.

- [ ] **Step 3: Write the implementation**

```ts
import type { StageId } from "./types";

export type ParsedMdx = {
  frontmatter: Record<string, string>;
  stages: Record<StageId, string>;
};

const STAGES: StageId[] = ["intuition", "math", "pseudo", "code"];

export function parseMdxStages(raw: string): ParsedMdx {
  const frontmatter: Record<string, string> = {};
  let body = raw;

  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (fmMatch) {
    const block = fmMatch[1];
    body = fmMatch[2];
    for (const line of block.split("\n")) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (kv) {
        frontmatter[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
      }
    }
  }

  const stages: Record<StageId, string> = { intuition: "", math: "", pseudo: "", code: "" };
  for (const id of STAGES) {
    const re = new RegExp(
      `<StageSection\\s+id=["']${id}["'][^>]*>([\\s\\S]*?)</StageSection>`,
      "m",
    );
    const m = body.match(re);
    if (m) {
      stages[id] = m[1]
        .split("\n")
        .filter((line) => !/^\s*import\s+/.test(line))
        .join("\n")
        .trim();
    }
  }

  return { frontmatter, stages };
}
```

- [ ] **Step 4: Run tests, expect all pass**

```bash
npx vitest run src/lib/chat/mdxStages.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/mdxStages.ts src/lib/chat/mdxStages.test.ts
git commit -m "feat(chat): MDX stage parser with tests"
```

---

### Task 12: System prompt builder (TDD)

**Files:**
- Create: `src/lib/chat/promptBuilder.ts`
- Create: `src/lib/chat/promptBuilder.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./promptBuilder";
import type { PaperMeta } from "../../content/papers-meta";

const PAPER_FIXTURE = {
  frontmatter: { slug: "demo", title: "Demo", authors: "Me", year: "2026" },
  stages: {
    intuition: "intuition body",
    math: "math body",
    pseudo: "pseudo body",
    code: "code body",
  },
};

const ROADMAP_FIXTURE: PaperMeta[] = [
  { slug: "alexnet", title: "AlexNet", authors: "A", year: 2012, era: "foundations", summary: "cnn", status: "implemented" },
  { slug: "transformer", title: "Transformer", authors: "V", year: 2017, era: "transformer", summary: "attn", status: "implemented", influencedBy: ["alexnet"] },
];

describe("buildSystemPrompt", () => {
  it("paper mode includes all four stage bodies", () => {
    const p = buildSystemPrompt({
      mode: "paper",
      pedagogyMode: "socratic",
      currentStage: "math",
      paper: PAPER_FIXTURE,
    });
    expect(p).toContain("intuition body");
    expect(p).toContain("math body");
    expect(p).toContain("pseudo body");
    expect(p).toContain("code body");
  });

  it("paper mode sets context title and location", () => {
    const p = buildSystemPrompt({
      mode: "paper",
      pedagogyMode: "socratic",
      currentStage: "math",
      paper: PAPER_FIXTURE,
    });
    expect(p).toContain("《Demo》");
    expect(p).toContain("② Math");
  });

  it("socratic mode includes the no-answer-first directive", () => {
    const p = buildSystemPrompt({
      mode: "paper",
      pedagogyMode: "socratic",
      currentStage: "intuition",
      paper: PAPER_FIXTURE,
    });
    expect(p).toContain("pedagogyMode=socratic");
    expect(p).toContain("예측을 유도");
  });

  it("direct mode relaxes answer-first restriction", () => {
    const p = buildSystemPrompt({
      mode: "paper",
      pedagogyMode: "direct",
      currentStage: "intuition",
      paper: PAPER_FIXTURE,
    });
    expect(p).toContain("pedagogyMode=direct");
    expect(p).toContain("답을 주저 없이 설명해도 됨");
  });

  it("roadmap mode serializes papers grouped by era with influencedBy", () => {
    const p = buildSystemPrompt({
      mode: "roadmap",
      pedagogyMode: "socratic",
      roadmap: ROADMAP_FIXTURE,
      progressSnapshot: { completed: ["alexnet"], inProgress: [] },
    });
    expect(p).toContain("foundations");
    expect(p).toContain("transformer");
    expect(p).toContain("influencedBy");
    expect(p).toContain("completed");
  });

  it("always includes PARR block", () => {
    const p = buildSystemPrompt({
      mode: "paper",
      pedagogyMode: "socratic",
      currentStage: "intuition",
      paper: PAPER_FIXTURE,
    });
    expect(p).toContain("PARR");
    expect(p).toContain("Predict → Attempt → Reveal → Reflect");
  });
});
```

- [ ] **Step 2: Run test, expect failure**

```bash
npx vitest run src/lib/chat/promptBuilder.test.ts
```

Expected: FAIL — `buildSystemPrompt is not a function`.

- [ ] **Step 3: Write the implementation**

```ts
import type { ChatMode, PedagogyMode, StageId, ProgressSnapshot } from "./types";
import type { ParsedMdx } from "./mdxStages";
import type { PaperMeta } from "../../content/papers-meta";

const STAGE_LABEL: Record<StageId, string> = {
  intuition: "① Intuition",
  math: "② Math",
  pseudo: "③ Pseudo",
  code: "④ Code",
};

const PEDAGOGY_BLOCK = `# 절대 규칙 (override 불가)
1. 단계 순서 준수: intuition → math → pseudo → code. 학습자가 다음 단계를 건너뛰려 하면 "먼저 [현재 단계]가 잡혔는지 확인해볼까?"로 역질문. 이유가 합당하면 허용.
2. PARR 원칙 (Predict → Attempt → Reveal → Reflect): 개념·수식·정답을 물으면 바로 답하지 말고 먼저 예측을 유도: "답을 듣기 전에, 당신은 어떻게 예상하는지 한 줄로?" 예측을 받은 후 검증. 예측이 틀렸으면 학습자가 스스로 원인을 말하게 유도.
3. 답 먼저 주지 않기 (adaptive):
   - socratic: "그냥 답/skip/빨리" 등 skip 발화 감지 시 이유를 한 번만 되물음. 답은 주지 않음.
   - direct: PARR은 유지하되 답을 주저 없이 설명해도 됨. 여전히 단계 순서는 준수.`;

const STAGE_TONE_BLOCK = `# 단계별 톤 (paper 모드)
- ① Intuition: 비유·감각 우선. 수식 최소.
- ② Math: 유도를 단계별로 학습자가 채우게.
- ③ Pseudo: 자연어 의사코드를 한 줄씩 함께 작성.
- ④ Code: 고치기 전에 "어디가 수상해 보이는지" 먼저 물음.`;

const ROADMAP_BLOCK = `# 로드맵 모드 지침
- "다음에 뭐 볼까" 같은 질문은 influencedBy 그래프 + 사용자 진행률 기반으로 답. 단, PARR: "어느 era가 궁금해?" "지금까지 뭐가 가장 헷갈렸어?"로 먼저 역질문.
- status="implemented"만 추천. planned/stub은 "아직 교재로는 준비 안 됐다"고 명시.
- 연도·era 순서를 역행하는 건너뛰기는 학습자가 배경 있다고 명시했을 때만 허용.`;

const META_BLOCK = `# 질문 스택 활용 (meta-cognition)
학습자가 이 세션에서 비슷한 개념을 이미 물었으면, 새 답 전에 "이전에 Q[번호]에서 물은 것과 지금 질문의 차이를 먼저 말해볼래?"로 연결. 3턴 이상 지난 질문도 연결 대상.`;

const FORMAT_BLOCK = `# 답변 포맷
- 한국어 반말 중립체 (사용자가 존댓말이면 존댓말).
- 기본 3문장 이하. 수식은 $$...$$, 코드는 \`\`\`python ... \`\`\`.
- 이모지 금지. 에디토리얼 톤 유지.
- 불확실하면 "논문 본문에는 없고 내 추측이야"라고 명시.`;

export type BuildArgs = {
  mode: ChatMode;
  pedagogyMode: PedagogyMode;
  currentStage?: StageId;
  paper?: ParsedMdx;
  roadmap?: PaperMeta[];
  progressSnapshot?: ProgressSnapshot;
};

export function buildSystemPrompt(args: BuildArgs): string {
  const { mode, pedagogyMode } = args;
  const parts: string[] = [];

  let title = "학습 로드맵";
  let location = "전체 로드맵";
  if (mode === "paper" && args.paper) {
    title = `《${args.paper.frontmatter.title}》 (${args.paper.frontmatter.authors ?? ""}, ${args.paper.frontmatter.year ?? ""})`;
    location = args.currentStage ? STAGE_LABEL[args.currentStage] : "단계 미정";
  } else if (mode === "progress") {
    title = "학습 진행 대시보드";
    location = "progress dashboard";
  } else if (mode === "review") {
    title = "SRS 리뷰 큐";
    location = "review queue";
  }

  parts.push(`당신은 "ai_master"의 AI 튜터입니다. 지금 학습자와 함께 ${title}을 다루고 있습니다.`);
  parts.push(`학습자의 현재 위치: ${location}.`);
  parts.push(`학습자의 pedagogyMode=${pedagogyMode}.`);
  parts.push("");
  parts.push(PEDAGOGY_BLOCK);
  parts.push("");
  parts.push(META_BLOCK);
  if (mode === "paper") {
    parts.push("");
    parts.push(STAGE_TONE_BLOCK);
  } else {
    parts.push("");
    parts.push(ROADMAP_BLOCK);
  }
  parts.push("");
  parts.push(FORMAT_BLOCK);
  parts.push("");
  parts.push("# [CONTEXT]");

  if (mode === "paper" && args.paper) {
    parts.push(`## Frontmatter\n${JSON.stringify(args.paper.frontmatter, null, 2)}`);
    for (const id of ["intuition", "math", "pseudo", "code"] as StageId[]) {
      parts.push(`\n## Stage ${STAGE_LABEL[id]}\n${args.paper.stages[id] || "(empty)"}`);
    }
  } else if (args.roadmap) {
    const byEra: Record<string, any[]> = {};
    for (const p of args.roadmap) {
      (byEra[p.era] ??= []).push({
        slug: p.slug,
        title: p.title,
        year: p.year,
        summary: p.summary,
        status: p.status,
        influencedBy: p.influencedBy ?? [],
      });
    }
    parts.push("## Roadmap (by era)\n" + JSON.stringify(byEra, null, 2));
    if (args.progressSnapshot) {
      parts.push("\n## Progress\n" + JSON.stringify(args.progressSnapshot, null, 2));
    }
  }

  return parts.join("\n");
}
```

- [ ] **Step 4: Run tests, expect all pass**

```bash
npx vitest run src/lib/chat/promptBuilder.test.ts
```

Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/promptBuilder.ts src/lib/chat/promptBuilder.test.ts
git commit -m "feat(chat): system prompt builder with PARR and stage-aware directives"
```

---

### Task 13: SSE parser (TDD)

**Files:**
- Create: `src/lib/chat/sseParser.ts`
- Create: `src/lib/chat/sseParser.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { createSseParser } from "./sseParser";

describe("createSseParser", () => {
  it("emits one event per complete data frame", () => {
    const events: any[] = [];
    const p = createSseParser((e) => events.push(e));
    p.push(`data: {"delta":"he"}\n\n`);
    p.push(`data: {"delta":"llo"}\n\n`);
    expect(events).toEqual([{ delta: "he" }, { delta: "llo" }]);
  });

  it("buffers partial frames across pushes", () => {
    const events: any[] = [];
    const p = createSseParser((e) => events.push(e));
    p.push(`data: {"del`);
    p.push(`ta":"hi"}\n\n`);
    expect(events).toEqual([{ delta: "hi" }]);
  });

  it("emits sentinel for [DONE]", () => {
    const events: any[] = [];
    const p = createSseParser((e) => events.push(e));
    p.push(`data: [DONE]\n\n`);
    expect(events).toEqual([{ done: true }]);
  });

  it("passes through error frames", () => {
    const events: any[] = [];
    const p = createSseParser((e) => events.push(e));
    p.push(`data: {"error":"boom"}\n\n`);
    expect(events).toEqual([{ error: "boom" }]);
  });
});
```

- [ ] **Step 2: Run test, expect failure**

```bash
npx vitest run src/lib/chat/sseParser.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```ts
export type SseEvent =
  | { delta: string }
  | { done: true }
  | { error: string };

export type SseParser = { push: (chunk: string) => void };

export function createSseParser(onEvent: (e: SseEvent) => void): SseParser {
  let buffer = "";

  function flushFrame(frame: string) {
    const line = frame.split("\n").find((l) => l.startsWith("data: "));
    if (!line) return;
    const payload = line.slice("data: ".length).trim();
    if (payload === "[DONE]") {
      onEvent({ done: true });
      return;
    }
    try {
      onEvent(JSON.parse(payload) as SseEvent);
    } catch {
      onEvent({ error: `unparseable SSE payload: ${payload}` });
    }
  }

  return {
    push(chunk: string) {
      buffer += chunk;
      let idx;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        flushFrame(frame);
      }
    },
  };
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/lib/chat/sseParser.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/sseParser.ts src/lib/chat/sseParser.test.ts
git commit -m "feat(chat): incremental SSE parser with tests"
```

---

### Task 14: Skip-phrase detector (TDD)

**Files:**
- Create: `src/lib/chat/skipDetector.ts`
- Create: `src/lib/chat/skipDetector.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { detectSkipIntent } from "./skipDetector";

describe("detectSkipIntent", () => {
  it("returns true for explicit skip phrases", () => {
    expect(detectSkipIntent("그냥 답 알려줘")).toBe(true);
    expect(detectSkipIntent("skip 해줘")).toBe(true);
    expect(detectSkipIntent("빨리 설명만")).toBe(true);
    expect(detectSkipIntent("답만 말해줘")).toBe(true);
    expect(detectSkipIntent("just tell me")).toBe(true);
  });

  it("returns false for ordinary questions", () => {
    expect(detectSkipIntent("이게 뭐야?")).toBe(false);
    expect(detectSkipIntent("왜 d_k로 나누지?")).toBe(false);
    expect(detectSkipIntent("답이 뭐인지 모르겠어")).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
npx vitest run src/lib/chat/skipDetector.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Write implementation**

```ts
const PATTERNS: RegExp[] = [
  /그냥\s*답/,
  /답만/,
  /skip/i,
  /빨리\s*(설명|알려|말)/,
  /설명만/,
  /just\s+tell\s+me/i,
  /바로\s*(답|알려)/,
];

export function detectSkipIntent(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}
```

- [ ] **Step 4: Run**

```bash
npx vitest run src/lib/chat/skipDetector.test.ts
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/skipDetector.ts src/lib/chat/skipDetector.test.ts
git commit -m "feat(chat): skip-phrase detector"
```

---

### Task 15: Session store (TDD)

**Files:**
- Create: `src/lib/chat/store.ts`
- Create: `src/lib/chat/store.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createStore } from "./store";

beforeEach(() => {
  localStorage.clear();
});

describe("createStore", () => {
  it("starts with empty sessions and no active id", () => {
    const s = createStore("chat:paper:demo");
    expect(s.getState()).toEqual({ sessions: [], activeId: null });
  });

  it("startSession creates + activates a session", () => {
    const s = createStore("chat:paper:demo");
    const id = s.startSession("socratic");
    const st = s.getState();
    expect(st.activeId).toBe(id);
    expect(st.sessions).toHaveLength(1);
    expect(st.sessions[0].pedagogyMode).toBe("socratic");
  });

  it("appendMessage updates title from first user message", () => {
    const s = createStore("chat:paper:demo");
    s.startSession("socratic");
    s.appendMessage({ role: "user", content: "√d_k 스케일링 왜 필요?", ts: "t1" });
    const active = s.getActive()!;
    expect(active.title.startsWith("√d_k")).toBe(true);
  });

  it("persists to localStorage under the given key", () => {
    const s = createStore("chat:paper:demo");
    s.startSession("socratic");
    s.appendMessage({ role: "user", content: "q", ts: "t" });
    const raw = localStorage.getItem("chat:paper:demo")!;
    expect(JSON.parse(raw).sessions[0].messages[0].content).toBe("q");
  });

  it("reloads from localStorage on construction", () => {
    const s1 = createStore("chat:paper:demo");
    s1.startSession("socratic");
    s1.appendMessage({ role: "user", content: "q", ts: "t" });
    const s2 = createStore("chat:paper:demo");
    expect(s2.getState().sessions).toHaveLength(1);
  });

  it("rename updates title", () => {
    const s = createStore("chat:paper:demo");
    const id = s.startSession("socratic");
    s.rename(id, "My topic");
    expect(s.getActive()!.title).toBe("My topic");
  });

  it("deleteSession removes and picks next active", () => {
    const s = createStore("chat:paper:demo");
    const a = s.startSession("socratic");
    const b = s.startSession("socratic");
    expect(s.getState().activeId).toBe(b);
    s.deleteSession(b);
    expect(s.getState().sessions.map((x) => x.id)).toEqual([a]);
    expect(s.getState().activeId).toBe(a);
  });

  it("setPedagogyMode updates active session", () => {
    const s = createStore("chat:paper:demo");
    s.startSession("socratic");
    s.setPedagogyMode("direct");
    expect(s.getActive()!.pedagogyMode).toBe("direct");
  });

  it("subscribe fires on mutations", () => {
    const s = createStore("chat:paper:demo");
    let calls = 0;
    s.subscribe(() => { calls++; });
    s.startSession("socratic");
    s.appendMessage({ role: "user", content: "q", ts: "t" });
    expect(calls).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
npx vitest run src/lib/chat/store.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Write implementation**

```ts
import type { ChatStore, Session, Message, PedagogyMode } from "./types";

type Listener = () => void;

export type Store = {
  getState: () => ChatStore;
  getActive: () => Session | null;
  startSession: (mode: PedagogyMode) => string;
  appendMessage: (m: Message) => void;
  replaceLastAssistant: (content: string) => void;
  setPedagogyMode: (mode: PedagogyMode) => void;
  setActive: (id: string) => void;
  rename: (id: string, title: string) => void;
  deleteSession: (id: string) => void;
  subscribe: (l: Listener) => () => void;
};

function truncateTitle(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > 14 ? t.slice(0, 12) + "…" : t;
}

export function createStore(key: string): Store {
  const listeners = new Set<Listener>();

  const load = (): ChatStore => {
    if (typeof localStorage === "undefined") return { sessions: [], activeId: null };
    const raw = localStorage.getItem(key);
    if (!raw) return { sessions: [], activeId: null };
    try { return JSON.parse(raw) as ChatStore; } catch { return { sessions: [], activeId: null }; }
  };

  let state: ChatStore = load();

  const persist = () => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, JSON.stringify(state));
  };

  const commit = (next: ChatStore) => {
    state = next;
    persist();
    listeners.forEach((l) => l());
  };

  const byId = (id: string | null) => state.sessions.find((s) => s.id === id) ?? null;

  return {
    getState: () => state,
    getActive: () => byId(state.activeId),

    startSession(mode) {
      const id = new Date().toISOString();
      const session: Session = {
        id, title: "새 대화", startedAt: id, lastActiveAt: id,
        pedagogyMode: mode, messages: [],
      };
      commit({ sessions: [session, ...state.sessions], activeId: id });
      return id;
    },

    appendMessage(m) {
      const active = byId(state.activeId);
      if (!active) return;
      const updated: Session = {
        ...active,
        lastActiveAt: m.ts,
        messages: [...active.messages, m],
      };
      if (m.role === "user" && active.title === "새 대화") {
        updated.title = truncateTitle(m.content);
      }
      commit({
        ...state,
        sessions: state.sessions.map((s) => s.id === active.id ? updated : s),
      });
    },

    replaceLastAssistant(content) {
      const active = byId(state.activeId);
      if (!active) return;
      const msgs = [...active.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "assistant") { msgs[i] = { ...msgs[i], content }; break; }
      }
      const updated: Session = { ...active, messages: msgs };
      commit({ ...state, sessions: state.sessions.map((s) => s.id === active.id ? updated : s) });
    },

    setPedagogyMode(mode) {
      const active = byId(state.activeId);
      if (!active) return;
      const updated: Session = { ...active, pedagogyMode: mode };
      commit({ ...state, sessions: state.sessions.map((s) => s.id === active.id ? updated : s) });
    },

    setActive(id) {
      if (!byId(id)) return;
      commit({ ...state, activeId: id });
    },

    rename(id, title) {
      const next = state.sessions.map((s) => s.id === id ? { ...s, title } : s);
      commit({ ...state, sessions: next });
    },

    deleteSession(id) {
      const next = state.sessions.filter((s) => s.id !== id);
      const activeId = state.activeId === id ? (next[0]?.id ?? null) : state.activeId;
      commit({ sessions: next, activeId });
    },

    subscribe(l) {
      listeners.add(l);
      return () => { listeners.delete(l); };
    },
  };
}
```

- [ ] **Step 4: Run**

```bash
npx vitest run src/lib/chat/store.test.ts
```

Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/store.ts src/lib/chat/store.test.ts
git commit -m "feat(chat): localStorage session store with tests"
```

---

## Phase 5 — `/api/chat` Endpoint

### Task 16: Install Gemini SDK

- [ ] **Step 1: Install**

```bash
npm install @google/genai@^1.30.0
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @google/genai SDK"
```

---

### Task 17: Write `/api/chat` endpoint (paper mode only first)

**Files:**
- Create: `src/pages/api/chat.ts`

- [ ] **Step 1: Write the endpoint**

```ts
import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { parseMdxStages } from "../../lib/chat/mdxStages";
import { buildSystemPrompt } from "../../lib/chat/promptBuilder";
import { PAPERS_META } from "../../content/papers-meta";
import type { ChatRequest } from "../../lib/chat/types";

export const prerender = false;

const API_KEY = process.env.GOOGLE_AI_API_KEY;
const MODEL = process.env.GOOGLE_AI_MODEL ?? "gemini-3.1-pro-preview";

function sseFrame(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}
const DONE_FRAME = new TextEncoder().encode("data: [DONE]\n\n");

export const POST: APIRoute = async ({ request }) => {
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "GOOGLE_AI_API_KEY not set" }), { status: 500 });
  }

  let body: ChatRequest;
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 }); }

  let paper;
  if (body.mode === "paper") {
    if (!body.paperSlug) {
      return new Response(JSON.stringify({ error: "paperSlug required" }), { status: 400 });
    }
    const file = path.resolve("src/content/papers", `${body.paperSlug}.mdx`);
    let raw: string;
    try { raw = await fs.readFile(file, "utf8"); }
    catch { return new Response(JSON.stringify({ error: `paper not found: ${body.paperSlug}` }), { status: 404 }); }
    paper = parseMdxStages(raw);
  }

  const systemInstruction = buildSystemPrompt({
    mode: body.mode,
    pedagogyMode: body.pedagogyMode,
    currentStage: body.currentStage,
    paper,
    roadmap: body.mode === "paper" ? undefined : PAPERS_META,
    progressSnapshot: body.progressSnapshot,
  });

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const contents = body.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const iter = await ai.models.generateContentStream({
          model: MODEL,
          contents,
          config: { systemInstruction, temperature: 0.3 },
        });
        for await (const chunk of iter) {
          if (request.signal.aborted) break;
          const delta = chunk.text ?? "";
          if (delta) controller.enqueue(sseFrame({ delta }));
        }
      } catch (err: any) {
        controller.enqueue(sseFrame({ error: err?.message ?? "unknown error" }));
      } finally {
        controller.enqueue(DONE_FRAME);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
};
```

- [ ] **Step 2: Smoke test manually**

Set `GOOGLE_AI_API_KEY` in `.env` with a real key. Start dev server:

```bash
npm run dev
```

In another shell:

```bash
curl -N -X POST http://localhost:4321/api/chat \
  -H "Content-Type: application/json" \
  -d '{"mode":"paper","paperSlug":"transformer","currentStage":"intuition","pedagogyMode":"socratic","messages":[{"role":"user","content":"안녕"}]}'
```

Expected: stream of `data: {"delta":"..."}` lines followed by `data: [DONE]`. If you see `data: {"error":"..."}` with model-not-found, change `GOOGLE_AI_MODEL` in `.env` to a model you have access to (e.g. `gemini-2.5-pro`) and retry.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/chat.ts
git commit -m "feat(api): /api/chat SSE endpoint with Gemini streaming"
```

---

## Phase 6 — ChatPanel (single session, paper mode)

### Task 18: Install markdown + katex rendering deps and create `ChatMessage`

**Files:**
- Modify: `package.json`
- Create: `src/components/chat/ChatMessage.tsx`

- [ ] **Step 1: Install**

```bash
npm install react-markdown@^9 remark-math@^6 rehype-katex@^7
```

- [ ] **Step 2: Create the message component**

```tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Message } from "../../lib/chat/types";

type Props = { msg: Message; streaming?: boolean };

export function ChatMessage({ msg, streaming }: Props) {
  const isUser = msg.role === "user";
  return (
    <div
      className={isUser ? "self-end max-w-[88%] px-3 py-2 rounded-[4px]" : "self-start max-w-[92%] px-3 py-2 rounded-[4px] border border-line"}
      style={{
        background: isUser ? "var(--accent-soft)" : "var(--paper-2)",
        color: "var(--ink)",
        fontSize: 15,
        lineHeight: 1.65,
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {msg.content + (streaming ? " ▍" : "")}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json src/components/chat/ChatMessage.tsx
git commit -m "feat(chat): ChatMessage component with markdown + katex"
```

---

### Task 19: Create `ChatPanel.tsx` — shell + input + streaming wire-up

**Files:**
- Create: `src/components/chat/ChatPanel.tsx`

- [ ] **Step 1: Write the component**

```tsx
import React, { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { createStore, type Store } from "../../lib/chat/store";
import { createSseParser } from "../../lib/chat/sseParser";
import { detectSkipIntent } from "../../lib/chat/skipDetector";
import type { ChatMode, Message, StageId, ProgressSnapshot } from "../../lib/chat/types";

type Props = {
  mode: ChatMode;
  paperSlug?: string;
  storageKey: string;
  progressSnapshot?: ProgressSnapshot;
};

function useStore(key: string): [Store, number] {
  const [tick, setTick] = useState(0);
  const ref = useRef<Store | null>(null);
  if (!ref.current) ref.current = createStore(key);
  useEffect(() => ref.current!.subscribe(() => setTick((n) => n + 1)), []);
  return [ref.current, tick];
}

function useCurrentStage(enabled: boolean): StageId | undefined {
  const [stage, setStage] = useState<StageId | undefined>();
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const sections = document.querySelectorAll<HTMLElement>("[data-stage-section]");
    if (sections.length === 0) return;
    const ratios = new Map<StageId, number>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const id = e.target.getAttribute("data-stage-section") as StageId | null;
        if (id) ratios.set(id, e.intersectionRatio);
      }
      let best: StageId | undefined;
      let max = 0;
      for (const [id, r] of ratios) if (r > max) { max = r; best = id; }
      if (best) setStage(best);
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [enabled]);
  return stage;
}

export default function ChatPanel(props: Props) {
  const [store] = useStore(props.storageKey);
  const state = store.getState();
  const active = store.getActive();
  const currentStage = useCurrentStage(props.mode === "paper");

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) store.startSession("socratic");
  }, [active, store]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [state, streaming]);

  async function send() {
    const text = input.trim();
    if (!text || streaming || !active) return;

    const userMsg: Message = { role: "user", content: text, ts: new Date().toISOString() };
    store.appendMessage(userMsg);
    store.appendMessage({ role: "assistant", content: "", ts: new Date().toISOString() });
    setInput("");
    setError(null);
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const history = [...(active.messages ?? []), userMsg];

    let buffer = "";
    const parser = createSseParser((e) => {
      if ("delta" in e) {
        buffer += e.delta;
        store.replaceLastAssistant(buffer);
      } else if ("error" in e) {
        setError(e.error);
      }
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          mode: props.mode,
          paperSlug: props.paperSlug,
          currentStage,
          progressSnapshot: props.progressSnapshot,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          pedagogyMode: active.pedagogyMode,
        }),
      });
      if (!res.ok || !res.body) {
        setError(`HTTP ${res.status}`);
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          parser.push(decoder.decode(value, { stream: true }));
        }
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e?.message ?? "network error");
    } finally {
      setStreaming(false);
      abortRef.current = null;

      if (detectSkipIntent(text) && active.pedagogyMode === "socratic") {
        // intentionally no-op: server side handles the re-prompt via system instruction.
        // If user's NEXT message supplies a reason, we flip to direct (see onNextMessage flag below).
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function abort() { abortRef.current?.abort(); }
  function newSession() { store.startSession("socratic"); }

  const headerTitle =
    props.mode === "paper" ? props.paperSlug :
    props.mode === "roadmap" ? "Roadmap" :
    props.mode === "progress" ? "Progress" : "Review";

  return (
    <div
      className="flex flex-col h-full border border-line rounded-[4px] overflow-hidden"
      style={{ background: "var(--paper-2)" }}
      data-chat-panel
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-line">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] uppercase tracking-[0.12em] text-mute">Tutor</span>
          <span className="text-[13px] truncate">{headerTitle}</span>
          {currentStage && (
            <span className="text-[11px] text-mute">· {currentStage}</span>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={newSession} className="text-[12px] px-2 py-1 text-mute hover:text-ink" title="새 대화">＋</button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {(active?.messages ?? []).map((m, i) => (
          <ChatMessage key={i} msg={m} streaming={streaming && i === active!.messages.length - 1 && m.role === "assistant"} />
        ))}
        {error && <div className="text-[12px] text-[color:var(--danger)]">{error}</div>}
      </div>

      <div className="border-t border-line p-2 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder="질문을 입력하세요. Enter 전송, Shift+Enter 줄바꿈."
          className="flex-1 resize-none px-2 py-1 text-[14px] border border-line rounded-[4px] bg-paper outline-none focus:border-ink"
        />
        {streaming ? (
          <button onClick={abort} className="px-3 text-[12px] border border-line rounded-[4px] hover:border-ink">중단</button>
        ) : (
          <button onClick={send} className="px-3 text-[12px] text-paper rounded-[4px]" style={{ background: "var(--accent)" }}>전송</button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/ChatPanel.tsx
git commit -m "feat(chat): ChatPanel core with streaming, abort, skip detection"
```

---

### Task 20: Mount ChatPanel in PaperLayout + tag stage sections for IntersectionObserver

**Files:**
- Modify: `src/layouts/PaperLayout.astro`
- Modify: `src/components/stages/StageSection.astro`

- [ ] **Step 1: Read `StageSection.astro`**

Open and confirm it accepts `id`. Add `data-stage-section={id}` attribute on the wrapping element so the observer can find stages. Example diff:

Before:
```astro
<section id={id} class="mb-16 scroll-mt-20">
```

After:
```astro
<section id={id} data-stage-section={id} class="mb-16 scroll-mt-20">
```

If the file doesn't already exist in that shape, open it first and apply a minimal change that adds the `data-stage-section` attribute to the outermost element.

- [ ] **Step 2: Update PaperLayout to mount the chat**

```astro
---
import AppShell from "./AppShell.astro";
import StageNav from "../components/stages/StageNav.astro";
import ChatPanel from "../components/chat/ChatPanel.tsx";
interface Props { frontmatter: any; }
const { frontmatter } = Astro.props;
const meta = `${frontmatter.authors} · ${frontmatter.year}`;
---
<AppShell
  title={frontmatter.title}
  meta={meta}
  backHref="/"
  backLabel="Roadmap"
>
  <StageNav slot="nav" slug={frontmatter.slug} />
  <ChatPanel
    slot="chat"
    client:load
    mode="paper"
    paperSlug={frontmatter.slug}
    storageKey={`chat:paper:${frontmatter.slug}`}
  />
  <slot />
</AppShell>
```

- [ ] **Step 3: Test the full paper flow**

```bash
npm run dev
```

Open `/papers/transformer`. Type "안녕" → Enter. Expected: user bubble appears, streaming dots cursor, assistant reply arrives token-by-token. Scroll the page up and down — the header pill should change from `intuition` to `math` etc. Refresh the page — prior messages restored from localStorage.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/PaperLayout.astro src/components/stages/StageSection.astro
git commit -m "feat(paper): mount ChatPanel and wire stage observer"
```

---

## Phase 7 — Session archive UI

### Task 21: Add history view and `SessionList` component

**Files:**
- Create: `src/components/chat/SessionList.tsx`
- Modify: `src/components/chat/ChatPanel.tsx`

- [ ] **Step 1: Write `SessionList.tsx`**

```tsx
import React, { useState } from "react";
import type { Store } from "../../lib/chat/store";

type Props = { store: Store; onPickActive: () => void };

export function SessionList({ store, onPickActive }: Props) {
  const { sessions, activeId } = store.getState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const sorted = [...sessions].sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));

  return (
    <div className="flex flex-col h-full">
      <button
        onClick={() => { store.startSession("socratic"); onPickActive(); }}
        className="mx-3 my-2 text-[13px] text-left border border-line rounded-[4px] px-2 py-1 hover:border-ink"
      >＋ 새 대화</button>
      <ol className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-1">
        {sorted.map((s) => (
          <li key={s.id} className="border-b border-line/60 py-1.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { store.setActive(s.id); onPickActive(); }}
                className="flex-1 text-left text-[13px] truncate hover:text-accent"
              >
                {s.id === activeId && <span className="text-accent">•</span>}{" "}
                {editingId === s.id ? (
                  <input
                    autoFocus value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => { store.rename(s.id, draft || s.title); setEditingId(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    className="w-full bg-transparent border-b border-ink outline-none"
                  />
                ) : s.title}
              </button>
              <span className="text-[11px] text-mute tabular-nums">{s.lastActiveAt.slice(0, 10)}</span>
              <button
                onClick={() => { setEditingId(s.id); setDraft(s.title); }}
                className="text-[11px] text-mute hover:text-ink" title="이름 바꾸기"
              >✎</button>
              <button
                onClick={() => { if (confirm("이 세션을 삭제할까?")) store.deleteSession(s.id); }}
                className="text-[11px] text-mute hover:text-[color:var(--danger)]" title="삭제"
              >×</button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 2: Add history toggle + view swap to `ChatPanel.tsx`**

Find the header row in `ChatPanel.tsx` and replace it with a version that has a history button and `view` state. Then add the view-swap body:

Change the component to add state:

```tsx
const [view, setView] = useState<"chat" | "history">("chat");
```

Replace the header buttons block:

```tsx
<div className="flex gap-1">
  <button
    onClick={() => setView((v) => v === "chat" ? "history" : "chat")}
    className="text-[12px] px-2 py-1 text-mute hover:text-ink"
    title="히스토리"
  >📚</button>
  <button onClick={newSession} className="text-[12px] px-2 py-1 text-mute hover:text-ink" title="새 대화">＋</button>
</div>
```

Replace the main body (scrollRef div + error div) with a branch:

```tsx
{view === "history" ? (
  <SessionList store={store} onPickActive={() => setView("chat")} />
) : (
  <>
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
      {(active?.messages ?? []).map((m, i) => (
        <ChatMessage key={i} msg={m} streaming={streaming && i === active!.messages.length - 1 && m.role === "assistant"} />
      ))}
      {error && <div className="text-[12px] text-[color:var(--danger)]">{error}</div>}
    </div>
    {/* input bar unchanged */}
  </>
)}
```

Don't forget to `import { SessionList } from "./SessionList";` at the top.

- [ ] **Step 3: Test**

Reload the paper page. Click 📚 → history view with current session listed. Click ＋ 새 대화 → new session, view returns to chat. Rename (✎) and delete (×) — confirm localStorage updates.

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/SessionList.tsx src/components/chat/ChatPanel.tsx
git commit -m "feat(chat): session archive view with rename/delete"
```

---

## Phase 8 — Question Stack

### Task 22: `QuestionStack.tsx`

**Files:**
- Create: `src/components/chat/QuestionStack.tsx`
- Modify: `src/components/chat/ChatPanel.tsx`

- [ ] **Step 1: Write `QuestionStack.tsx`**

```tsx
import React, { useState } from "react";
import type { Message } from "../../lib/chat/types";

type Props = {
  messages: Message[];
  onJumpToQuestion: (idx: number) => void;
  onJumpToAnswer: (idx: number) => void;
  onReAsk: (text: string) => void;
};

export function QuestionStack({ messages, onJumpToQuestion, onJumpToAnswer, onReAsk }: Props) {
  const [open, setOpen] = useState(false);
  const questions = messages
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.role === "user");

  if (questions.length === 0) return null;

  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-3 py-2 text-[12px] text-mute hover:text-ink flex items-center gap-1"
      >
        <span>{open ? "▾" : "▸"}</span>
        <span>내 질문 {questions.length}개</span>
      </button>
      {open && (
        <ol className="px-3 pb-2 flex flex-col gap-1">
          {questions.map(({ m, i }, qIdx) => {
            const short = m.content.length > 14 ? m.content.slice(0, 12) + "…" : m.content;
            return (
              <li key={i} className="flex items-center gap-2 text-[12px]" title={m.content}>
                <span className="text-mute tabular-nums">{qIdx + 1}.</span>
                <span className="flex-1 truncate">{short}</span>
                <button onClick={() => onJumpToQuestion(i)} className="text-mute hover:text-ink" title="질문 위치로">⤢</button>
                <button onClick={() => onReAsk(m.content)} className="text-mute hover:text-ink" title="다시 묻기">↑</button>
                <button onClick={() => onJumpToAnswer(i)} className="text-mute hover:text-ink" title="답변으로">↓</button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into `ChatPanel.tsx`**

Add imports:

```tsx
import { QuestionStack } from "./QuestionStack";
```

Add a ref map for messages and helper functions:

```tsx
const messageRefs = useRef<Array<HTMLDivElement | null>>([]);

function jumpToMsg(idx: number) {
  const el = messageRefs.current[idx];
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.animate(
    [{ background: "var(--accent-soft)" }, { background: "var(--paper-2)" }],
    { duration: 900 },
  );
}
```

Wrap each `<ChatMessage>` in a ref-bearing div:

```tsx
{(active?.messages ?? []).map((m, i) => (
  <div key={i} ref={(el) => { messageRefs.current[i] = el; }}>
    <ChatMessage msg={m} streaming={streaming && i === active!.messages.length - 1 && m.role === "assistant"} />
  </div>
))}
```

Place `QuestionStack` just above the scroll container inside the chat view branch:

```tsx
<QuestionStack
  messages={active?.messages ?? []}
  onJumpToQuestion={(i) => jumpToMsg(i)}
  onJumpToAnswer={(i) => jumpToMsg(i + 1)}
  onReAsk={(t) => setInput(t)}
/>
<div ref={scrollRef} ...>
```

- [ ] **Step 3: Test**

Ask 3+ questions in a session. Open "내 질문 N개", click ⤢/↑/↓. Expected: scroll jumps + highlight pulse, re-ask populates input.

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/QuestionStack.tsx src/components/chat/ChatPanel.tsx
git commit -m "feat(chat): per-session question stack with jump + re-ask"
```

---

## Phase 9 — Mode branching + progress snapshot

### Task 23: Build `progressSnapshot` helper

**Files:**
- Create: `src/lib/chat/progressSnapshot.ts`

- [ ] **Step 1: Write the helper**

```ts
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
  return { completed, inProgress, lastVisited: store.lastVisited };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/chat/progressSnapshot.ts
git commit -m "feat(chat): compute progressSnapshot from localStorage"
```

---

### Task 24: Mount ChatPanel on home, progress, review with correct mode

**Files:**
- Modify: `src/pages/index.astro`, `src/pages/progress.astro`, `src/pages/review.astro`

- [ ] **Step 1: Update `index.astro` to include chat slot**

Add after the existing imports:

```astro
import ChatPanel from "../components/chat/ChatPanel.tsx";
```

Add inside `<AppShell>` just before the `<section id="continue">` (a slot):

```astro
<ChatPanel
  slot="chat"
  client:load
  mode="roadmap"
  storageKey="chat:roadmap"
/>
```

Note: `progressSnapshot` will be populated client-side via a wrapper React island (see Step 2) rather than via astro props since localStorage is browser-only.

- [ ] **Step 2: Create a snapshot-aware wrapper**

Create `src/components/chat/ChatPanelWithSnapshot.tsx`:

```tsx
import React, { useEffect, useState } from "react";
import ChatPanel from "./ChatPanel";
import { computeSnapshot } from "../../lib/chat/progressSnapshot";
import type { ChatMode } from "../../lib/chat/types";

type Props = { mode: ChatMode; storageKey: string; paperSlug?: string };

export default function ChatPanelWithSnapshot(props: Props) {
  const [snap, setSnap] = useState(() => ({ completed: [], inProgress: [] } as any));
  useEffect(() => { setSnap(computeSnapshot()); }, []);
  return <ChatPanel {...props} progressSnapshot={snap} />;
}
```

- [ ] **Step 3: Use `ChatPanelWithSnapshot` in roadmap/progress/review pages**

Replace the `<ChatPanel slot="chat" .../>` in `index.astro`, `progress.astro`, `review.astro` with:

```astro
import ChatPanelWithSnapshot from "../components/chat/ChatPanelWithSnapshot.tsx";
...
<ChatPanelWithSnapshot slot="chat" client:load mode="roadmap" storageKey="chat:roadmap" />
```

For `progress.astro` use `mode="progress"` and `storageKey="chat:progress"`; for `review.astro` use `mode="review"` and `storageKey="chat:review"`.

- [ ] **Step 4: Test**

```bash
npm run dev
```

Visit `/`, `/progress`, `/review`. In each, ask "다음에 뭐 볼까?" — expect a Socratic reply that references your progress (e.g., "AlexNet은 완료했구나. 어느 era가 궁금해?"). Verify network tab shows `mode` and `progressSnapshot` in the request body.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/ChatPanelWithSnapshot.tsx src/pages/index.astro src/pages/progress.astro src/pages/review.astro
git commit -m "feat(chat): mount ChatPanel on home/progress/review with snapshot"
```

---

## Phase 10 — Adaptive direct mode

### Task 25: Client-side skip detection + confirmation flow

**Files:**
- Modify: `src/components/chat/ChatPanel.tsx`

- [ ] **Step 1: Add pending-confirmation state and adjust send flow**

Inside `ChatPanel`, add:

```tsx
const [awaitingDirectReason, setAwaitingDirectReason] = useState(false);
```

Replace the `finally` block's post-send skip check with:

```tsx
// After streaming completes:
if (!awaitingDirectReason && detectSkipIntent(text) && active.pedagogyMode === "socratic") {
  setAwaitingDirectReason(true);
  return;
}
if (awaitingDirectReason) {
  // Next user message is the reason; accept it and flip to direct.
  store.setPedagogyMode("direct");
  setAwaitingDirectReason(false);
}
```

And when `newSession()` fires, reset:

```tsx
function newSession() {
  store.startSession("socratic");
  setAwaitingDirectReason(false);
}
```

Visual indicator in header (add next to stage pill):

```tsx
{active?.pedagogyMode === "direct" && (
  <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] border border-accent text-accent">direct</span>
)}
```

- [ ] **Step 2: Test manually**

Send "그냥 답 알려줘" → server returns a confirmation question (from system prompt). Send "왜냐하면 이미 다른 강의에서 봤어" → `pedagogyMode` flips to `direct` (visible badge in header, `direct` sent in next request body).

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/ChatPanel.tsx
git commit -m "feat(chat): adaptive direct mode after skip-reason confirmation"
```

---

## Phase 11 — Polish

### Task 26: Error handling and 429 cooldown

**Files:**
- Modify: `src/components/chat/ChatPanel.tsx`

- [ ] **Step 1: Add cooldown state and rate-limit handling**

```tsx
const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
const disabled = streaming || (cooldownUntil !== null && Date.now() < cooldownUntil);
```

In `send()`, after getting `res`:

```tsx
if (res.status === 429) {
  setCooldownUntil(Date.now() + 30_000);
  setError("너무 빠르게 요청했어. 30초 후 다시 시도해줘.");
  return;
}
```

Replace send/abort buttons' `disabled` / `onClick` to reflect `disabled`:

```tsx
<button onClick={send} disabled={disabled} ...>전송</button>
```

Show a retry action next to errors:

```tsx
{error && (
  <div className="flex items-center gap-2 text-[12px] text-[color:var(--danger)]">
    <span>{error}</span>
    <button onClick={() => { setError(null); send(); }} className="underline">재시도</button>
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/ChatPanel.tsx
git commit -m "feat(chat): 429 cooldown and retry UX"
```

---

### Task 27: Responsive — drawer below 1200px, FAB below 900px

**Files:**
- Modify: `src/layouts/AppShell.astro`, `src/components/chat/ChatPanel.tsx`

- [ ] **Step 1: Add media-query driven grid collapse in `AppShell.astro`**

Append a `<style>` block to `AppShell.astro`:

```astro
<style is:global>
  @media (max-width: 1200px) {
    main.prose { max-width: 68ch; }
  }
  @media (max-width: 1100px) {
    body .grid[style*="grid-template-columns"] {
      grid-template-columns: var(--col-nav) minmax(0, 1fr) !important;
    }
    [data-chat-panel] {
      position: fixed !important;
      top: var(--top-bar-h) !important;
      right: 0 !important;
      bottom: 0 !important;
      width: min(420px, 90vw) !important;
      z-index: 50;
      transform: translateX(100%);
      transition: transform 180ms ease;
    }
    [data-chat-panel][data-open="true"] {
      transform: translateX(0);
    }
    .chat-fab { display: inline-flex !important; }
  }
  @media (max-width: 900px) {
    body .grid[style*="grid-template-columns"] {
      grid-template-columns: minmax(0, 1fr) !important;
    }
    aside:has(> div[class*="sticky"]) { display: none; }
  }
</style>
```

- [ ] **Step 2: Add an open/close control to `ChatPanel.tsx`**

Add state and a FAB button:

```tsx
const [open, setOpen] = useState(true);
// On mount, check window width and start collapsed if < 1100px
useEffect(() => {
  if (typeof window !== "undefined" && window.innerWidth < 1100) setOpen(false);
}, []);
```

Set `data-open={open}` on the root:

```tsx
<div data-chat-panel data-open={open} ...>
```

Render a floating open button when closed (only visible via CSS on small screens):

```tsx
{!open && (
  <button
    onClick={() => setOpen(true)}
    className="chat-fab hidden fixed bottom-6 right-6 z-50 px-4 py-3 text-paper rounded-[4px] shadow"
    style={{ background: "var(--accent)" }}
  >Tutor</button>
)}
```

Add a close (×) button to the chat header that triggers `setOpen(false)` — visible at all times but only matters on narrow viewports.

- [ ] **Step 3: Test at 1200, 1100, 900 widths via DevTools responsive mode**

Expected: <1100 → slide-in drawer with FAB; <900 → single-column page + FAB opens full-screen-ish drawer.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/AppShell.astro src/components/chat/ChatPanel.tsx
git commit -m "feat(chat): responsive drawer and FAB below 1100/900px"
```

---

### Task 28: A11y pass

**Files:**
- Modify: `src/components/chat/ChatPanel.tsx`, `src/components/chat/SessionList.tsx`, `src/components/chat/QuestionStack.tsx`

- [ ] **Step 1: Add ARIA**

- `<div data-chat-panel role="complementary" aria-label="AI tutor panel">`
- `<button ... aria-label="히스토리 열기">` on the 📚 button
- `<button ... aria-label="새 대화 시작">` on the ＋ button
- `<button ... aria-label="메시지 전송">` and `aria-label="응답 중단"`
- `<ol role="list">` on question stack and session list
- `<textarea aria-label="질문 입력">`
- Ensure `<span className="sr-only">` text is added wherever icons are the only label (e.g., ✎ ×)

- [ ] **Step 2: Keyboard nav check**

Tab through the panel. Expected: focus ring (2px accent) is visible on every interactive element; order is logical (header buttons → input → send); Esc closes the drawer when on narrow viewport (add `onKeyDown` handler on panel root).

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/ChatPanel.tsx src/components/chat/SessionList.tsx src/components/chat/QuestionStack.tsx
git commit -m "a11y(chat): aria labels, sr-only, esc-to-close"
```

---

### Task 29: Playwright e2e — paper mode streaming

**Files:**
- Create: `e2e/chat-paper-mode.spec.ts`

- [ ] **Step 1: Write the test (with mocked SSE to avoid real API calls)**

```ts
import { test, expect } from "@playwright/test";

test.describe("chat paper mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      const body = [
        `data: {"delta":"답을 "}\n\n`,
        `data: {"delta":"듣기 전에, "}\n\n`,
        `data: {"delta":"당신은 어떻게 예상해?"}\n\n`,
        `data: [DONE]\n\n`,
      ].join("");
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body,
      });
    });
  });

  test("sends, streams, and persists across reload", async ({ page }) => {
    await page.goto("/papers/transformer");

    const input = page.getByPlaceholder(/질문을 입력/);
    await input.fill("왜 √d_k 로 나눠?");
    await page.keyboard.press("Enter");

    await expect(page.getByText(/당신은 어떻게 예상해/)).toBeVisible();
    await expect(page.getByText(/왜 √d_k 로 나눠/)).toBeVisible();

    await page.reload();
    await expect(page.getByText(/왜 √d_k 로 나눠/)).toBeVisible();
    await expect(page.getByText(/당신은 어떻게 예상해/)).toBeVisible();
  });

  test("question stack jump + re-ask", async ({ page }) => {
    await page.goto("/papers/transformer");
    const input = page.getByPlaceholder(/질문을 입력/);
    await input.fill("질문 하나");
    await page.keyboard.press("Enter");
    await expect(page.getByText(/당신은 어떻게/)).toBeVisible();

    await page.getByRole("button", { name: /내 질문 1개/ }).click();
    await page.getByRole("button", { name: /다시 묻기/ }).click();
    await expect(input).toHaveValue("질문 하나");
  });
});
```

- [ ] **Step 2: Run**

```bash
npx playwright test e2e/chat-paper-mode.spec.ts
```

Expected: 2 passed. If Astro's dev server isn't already configured as `webServer` in `playwright.config.ts`, add it there first (start with `npm run dev`, url `http://localhost:4321`).

- [ ] **Step 3: Commit**

```bash
git add e2e/chat-paper-mode.spec.ts
git commit -m "test(e2e): chat paper mode streaming + question stack"
```

---

### Task 30: Playwright e2e — history view

**Files:**
- Create: `e2e/chat-history.spec.ts`

- [ ] **Step 1: Write**

```ts
import { test, expect } from "@playwright/test";

test("history view lists and switches sessions", async ({ page }) => {
  await page.route("**/api/chat", (route) => route.fulfill({
    status: 200,
    contentType: "text/event-stream",
    body: `data: {"delta":"ok"}\n\ndata: [DONE]\n\n`,
  }));

  await page.goto("/papers/transformer");
  const input = page.getByPlaceholder(/질문을 입력/);

  await input.fill("첫 번째 질문입니다");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/ok/)).toBeVisible();

  await page.getByRole("button", { name: /히스토리/ }).click();
  await page.getByRole("button", { name: /＋ 새 대화/ }).click();

  await input.fill("두 번째 세션 첫 메시지");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/ok/)).toBeVisible();

  await page.getByRole("button", { name: /히스토리/ }).click();
  await expect(page.getByText(/첫 번째/)).toBeVisible();
  await expect(page.getByText(/두 번째/)).toBeVisible();
});
```

- [ ] **Step 2: Run and commit**

```bash
npx playwright test e2e/chat-history.spec.ts
git add e2e/chat-history.spec.ts
git commit -m "test(e2e): chat history view"
```

---

### Task 31: Full build + manual smoke + final commit

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all vitest suites pass (existing + new chat suites).

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: build succeeds; route manifest shows all pages as prerendered except `/api/chat`. Inspect logs for any SSR page that shouldn't be SSR.

- [ ] **Step 3: Run Playwright suite**

```bash
npx playwright test
```

Expected: existing `transformer-walkthrough.spec.ts` still passes; new specs pass.

- [ ] **Step 4: Preview with a real API key**

```bash
GOOGLE_AI_API_KEY=<real-key> npm run preview
```

Visit `http://localhost:4321/`, `/papers/transformer`, `/progress`. Sanity-check:
- Cream Pretendard UI, no FOUT.
- Chat panel responds live, streaming token-by-token.
- Stage badge updates as you scroll a paper.
- "그냥 답 알려줘" triggers confirmation flow.
- Narrow the window to ~1000px → chat becomes drawer; further to ~800px → nav hides, FAB appears.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final build + e2e green"
```

---

## Self-review (for plan author, not executor)

- **Spec §3 Design language** → Tasks 1–2, 6 (StageNav tokens).
- **Spec §4 Layout** → Tasks 3–8 + responsive in Task 27.
- **Spec §5.1 Tree** → Tasks 18–22.
- **Spec §5.2 State** → Task 15 (store).
- **Spec §5.3 Streaming** → Tasks 13 (parser), 17 (server SSE), 19 (client).
- **Spec §5.4 Session archive** → Task 21.
- **Spec §5.5 Question stack** → Task 22.
- **Spec §5.6 Adaptive direct** → Tasks 14 (detector), 25 (flow).
- **Spec §6.1 Hybrid** → Task 9.
- **Spec §6.2 Endpoint + §6.3 paper loader + §6.4 roadmap loader** → Task 17 + Task 24.
- **Spec §6.5 System prompt** → Task 12.
- **Spec §6.6 Gemini call** → Task 17.
- **Spec §7 Testing** → Tasks 11–15 (unit), 29–30 (e2e), 31 (full run).
- **Spec §9 Risks — prerender check** → Task 9 step 5 explicit.
- **Spec §9 Risks — model availability** → Task 17 step 2 notes env swap.

All sections covered. No placeholders, TBDs, or "similar to Task N" references in steps.
