# ai_master — Design Spec

**Date:** 2026-04-20
**Status:** Approved (pending user review of this file)
**Owner:** minseongkim (solo use)

## 1. Purpose

A personal interactive web app for learning the canonical arc of deep-learning research from foundations (2012) through modern agents (2026). Each paper is delivered through a fixed four-stage pedagogical flow (**Intuition → Math → Pseudo code → Code**) with an **active-learning** gate at every stage: the user must predict or attempt before any answer is revealed.

The app is a solo-use tool; there is no backend, no auth, no collaboration, no analytics. All learner state persists in the browser.

## 2. Non-Goals

- No multi-user, authentication, or cloud sync
- No server-rendered dynamic content; the production output is static files
- No full-model training in the browser (Colab deep-link for anything large)
- No AI-generated content at runtime (no LLM API calls)
- No mobile-first design (desktop-primary; mobile usable but not optimized)
- Not a replacement for fast.ai / d2l.ai / labml.ai — deliberately narrower, 30 curated papers

## 3. Core Pedagogical Principles (binding)

1. **Four-stage flow, in strict order, per paper:** Intuition → Math → Pseudo code → Code. No stage may be skipped in authoring. User may skip at runtime but the skip is recorded.
2. **PARR loop at every stage:** Predict → Attempt → Reveal → Reflect. No content reveals an answer before the user produces something (prediction, MC answer, fill-in, code attempt).
3. **Interactive main figure during Intuition.** Every paper's hero figure is a manipulable widget (sliders, drag, hover-to-reveal), never a static image.
4. **Retrieval check gates stage completion.** Each stage ends with 2–3 multiple-choice items; stage is marked `mastered` only on pass.
5. **Spaced repetition for key concepts.** MDX authors mark specific prompts with `<SrsCard>` inside stage content; when a user passes that stage's retrieval check, the card is enqueued in `srs.cards` with `ease=2.5`, `interval=1`. The `/review` page drains `due <= today` cards on SM-2 lite (intervals grow on Good/Easy, reset on Again).
6. **Faded scaffolding across papers.** Concepts reappearing in later papers receive fewer hints.
7. **Productive failure.** The "reveal" button is disabled until the user has attempted; explicit "skip" is logged as a red mark in progress.

These principles are enforced by the component library — `StageSection`, `PredictThenReveal`, and `RetrievalCheck` make it structurally awkward to author passive content.

## 4. Scope

### 4.1 MVP (this spec)

- Three papers with full four-stage treatment:
  - **Attention Is All You Need** (Vaswani et al., 2017) — Transformer
  - **Denoising Diffusion Probabilistic Models** (Ho et al., 2020) — DDPM
  - **ReAct: Synergizing Reasoning and Acting in Language Models** (Yao et al., 2022) — agent loop
- **Roadmap page** showing ~30 canonical papers across 6 eras; 3 implemented, 27 stubs with title/year/era only.
- `/progress` dashboard with stage completion grid and JSON export/import.
- `/review` page showing spaced-repetition items due today.
- Static build deployable to Vercel/Netlify/GitHub Pages.

### 4.2 Out of scope for MVP

- Implementations of papers 4–30 (added one at a time post-MVP; each reuses the MVP component templates).
- Accessibility audit beyond reasonable defaults.
- Internationalization (Korean + English content mixed as user prefers, no runtime switch).
- Search across papers.
- Full-text PDF annotation.

## 5. Information Architecture

Three routes:

1. **`/` — Home + Roadmap**
   - Hero tagline
   - Roadmap graph (6 era rows × 2012–2026 timeline)
   - "Continue reading" card surfacing the most recently-touched paper + stage
2. **`/papers/<slug>` — Paper page**
   - Sticky left-side StageNav (① ② ③ ④ ⑤) with per-stage completion marks
   - Scrollytelling body with five stage sections
   - Collapsible right-side drawer: TOC, bookmarks, notes
3. **`/progress` — Dashboard**
   - Matrix: rows = papers, cols = stages, cell = status color
   - Notes list with inline search (client-side filter)
   - Import / Export JSON
4. **`/review` — Spaced-repetition queue**
   - Today's due items as flashcards
   - Rate difficulty (Again / Hard / Good / Easy) → SM-2 lite schedules next interval

## 6. Paper Page Anatomy — The Five Stages

| # | Stage | Active-learning mechanic | Key component |
|---|---|---|---|
| 1 | Intuition | Ask user to predict slider outcome; drag; compare | `<MainFigureWidget />` (per-paper) |
| 2 | Math | Next-line prediction (MC 3-opt) at key derivation steps | `<DerivationStep />` |
| 3 | Pseudo code | Reorder scrambled lines or fill key blanks | `<LineReorder />`, `<FillBlank />` |
| 4 | Code (Python) | Empty function + Pyodide-run assertion tests; 3-level faded hints; "Open in Colab" for large training | `<PyRunner />`, `<AssertionTests />`, `<HintFade />` |
| 5 | Original PDF | Inline PDF.js viewer + download link | `<PdfViewer />` |

Each stage ends with `<RetrievalCheck />` (2–3 MC). A pass marks the stage `mastered`. Any `<SrsCard prompt answer>` tags inside the stage's MDX are enqueued into the SRS queue on pass; these are the authoring primitive by which a retrieval concept becomes a long-term review item.

## 7. Component Architecture

```
src/
├── pages/
│   ├── index.astro              # Home + Roadmap
│   ├── progress.astro           # Dashboard
│   ├── review.astro             # SRS queue
│   └── papers/[slug].astro      # Renders content/papers/<slug>.mdx
├── content/
│   ├── config.ts                # Content Collections schema
│   └── papers/
│       ├── transformer.mdx
│       ├── ddpm.mdx
│       └── react.mdx
├── components/
│   ├── stages/
│   │   ├── StageNav.astro
│   │   ├── StageSection.astro
│   │   ├── PredictThenReveal.tsx
│   │   ├── MCQuiz.tsx
│   │   ├── FillBlank.tsx
│   │   ├── LineReorder.tsx
│   │   └── RetrievalCheck.tsx
│   ├── math/
│   │   ├── Math.astro
│   │   └── DerivationStep.tsx
│   ├── code/
│   │   ├── PyRunner.tsx
│   │   ├── AssertionTests.tsx
│   │   └── HintFade.tsx
│   ├── pdf/
│   │   └── PdfViewer.astro
│   ├── roadmap/
│   │   └── RoadmapGraph.tsx
│   └── widgets/
│       ├── AttentionMatrix.tsx      # Transformer hero widget
│       ├── NoiseSchedule.tsx        # DDPM hero widget
│       └── ReActLoop.tsx            # ReAct hero widget
├── lib/
│   ├── storage.ts               # Facade over localStorage + IndexedDB
│   ├── progress.ts              # Per-paper / per-stage status
│   ├── srs.ts                   # SM-2 lite
│   └── pyodide.ts               # Singleton worker init
├── workers/
│   └── pyodide.worker.ts
└── public/
    └── pdfs/
        ├── 1706.03762.pdf
        ├── 2006.11239.pdf
        └── 2210.03629.pdf
```

**Boundaries:**
- `components/stages/*` are paper-agnostic.
- `components/widgets/*` are paper-specific; the only place per-paper code lives.
- `lib/*` is UI-independent and unit-testable.
- `workers/pyodide.worker.ts` is isolated from the main thread; the UI posts messages and never blocks on Python execution.

## 8. Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | **Astro 5** | Static-first with island hydration — 90% of paper content is prose/math and should ship zero JS; only widgets hydrate |
| UI islands | **React 19** | Largest ecosystem for Monaco, KaTeX, D3 |
| Content | **MDX** via Astro Content Collections | Author prose + widget imports in one file; type-safe frontmatter |
| Math | **KaTeX** | 10× faster than MathJax, SSR-friendly |
| Code editor | **Monaco** (VS Code engine) | Familiar keybindings, Python syntax out of the box |
| Python runtime | **Pyodide** in a dedicated Web Worker | NumPy, SymPy, pure-Python examples work offline; PyTorch-full does not (too heavy) — use Colab for that |
| PDF viewer | **PDF.js** inline | Self-hosted, no external calls |
| Styling | **Tailwind CSS** + **shadcn/ui**-style primitives | Consistency with minimal config |
| Roadmap graph | **D3** or hand-rolled SVG | Small scale (~30 nodes); D3 for force layout if edges get busy |
| Storage | **localStorage** + **IndexedDB** | No backend; small structured state vs larger code snapshots |
| Build / host | Astro static build; Vercel / Netlify / GitHub Pages | All three work identically with static output |

## 9. Data Model

All persistence is browser-local. Root key: `ai_master:v1`.

```ts
type Store = {
  progress: Record<PaperSlug, {
    stages: Record<StageId, StageStatus>
    retrievalScores: Record<string, number>   // 0.0–1.0 per quiz
    startedAt: string                          // ISO
    completedAt?: string
  }>
  notes: Record<PaperSlug, Record<AnchorId, string>>
  bookmarks: { paperSlug: PaperSlug; anchor: AnchorId; createdAt: string }[]
  srs: {
    cards: SrsCard[]
    lastReview: string
  }
  settings: { theme: "light" | "dark" | "system"; fontSize: number }
}

type StageId = "intuition" | "math" | "pseudo" | "code" | "pdf"
type StageStatus = "locked" | "attempted" | "revealed" | "mastered" | "skipped"
type SrsCard = {
  id: string
  paperSlug: PaperSlug
  prompt: string
  answer: string
  ease: number         // SM-2
  interval: number     // days
  due: string          // ISO
}
```

Separate IndexedDB database `ai_master_code` stores:
- `codeSnapshots` — { id, paperSlug, stageId, code, output, createdAt }

Export / Import merges both stores into a single JSON file.

**Migration:** root key is versioned (`v1`). Schema changes bump to `v2` with an idempotent migration function in `lib/storage.ts`.

## 10. Roadmap Page

**Visualization:**
- X-axis: timeline 2012 → 2026
- Y-axis: 6 era rows — (1) DL foundations, (2) Transformer era, (3) Generative models, (4) Efficiency/architecture, (5) Alignment, (6) Reasoning & agents
- Nodes: ~30 papers, positioned at (year, era)
- Edges: direct influence relationships (e.g., Transformer → BERT → GPT family)
- Node states:
  - `implemented` — bright, clickable → `/papers/<slug>`
  - `stub` — dim, hover reveals title + one-line summary, not clickable
  - `planned` — lightest, title only

**Data sources:**
- Implemented papers come from `content/papers/*.mdx` frontmatter
- Stubs come from `src/content/papers-meta.ts` (single file, hand-maintained)
- Roadmap component merges both for rendering

**Initial 30-paper list:** finalized during implementation (see plan). User's MVP three are: `transformer`, `ddpm`, `react`.

## 11. Build, Dev, Deploy

- `npm run dev` — Astro dev server with HMR
- `npm run build` — static output to `dist/`
- `npm run preview` — serve `dist/` locally
- Host: MVP runs locally; single command (`vercel` / `netlify deploy` / push to `gh-pages`) makes it public later
- No CI required for MVP; if deployed, platform auto-builds from main branch

## 12. Testing Strategy

- **Unit tests (Vitest):** `lib/storage.ts`, `lib/progress.ts`, `lib/srs.ts` — pure logic, no DOM
- **Component tests (Vitest + Testing Library):** `PredictThenReveal`, `MCQuiz`, `LineReorder`, `HintFade` — behavior around the "no-reveal-before-attempt" invariant
- **Integration smoke:** one E2E (Playwright) that loads `/papers/transformer`, clicks through all five stages, verifies localStorage state progresses correctly
- **Pyodide:** mock the worker in unit tests; one real integration test confirms the worker loads and runs a trivial assertion

## 13. Deferred to Implementation Plan

The following are intentionally left to the implementation plan rather than locked in this spec:

- **Final 30-paper roadmap list.** The plan's first task will hand-curate `src/content/papers-meta.ts` with title, authors, year, era, arxivId, one-line summary for each stub paper. Anchor candidates per era are already drafted in conversation; the plan task will pin them.
- **Per-paper assertion scaffolds** for the Code stage (what function signature, what `assert` statements, what reference outputs). One plan task per MVP paper.
- **Roadmap graph visual choice** — start with a simple grid-on-timeline SVG; revisit D3 force-layout only if edge density makes the grid unreadable.
- **Hero widget interaction specifics** for each of Transformer / DDPM / ReAct. The plan devotes one task per widget.

## 14. Success Criteria

- Loading `/` on a cold browser shows the roadmap in under 2 seconds on a typical laptop.
- Opening `/papers/transformer` on a cold browser and completing all five stages at beginner pace takes 45–90 minutes.
- After a week away, the `/review` queue surfaces the concepts most at risk of being forgotten; answering them restores fluency faster than re-reading the paper page would.
- Adding paper #4 (post-MVP) costs primarily the hero widget and content MDX; no changes to `components/stages/*` or `lib/*` should be required.
