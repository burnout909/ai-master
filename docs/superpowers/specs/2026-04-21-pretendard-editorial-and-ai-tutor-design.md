# Pretendard Editorial Redesign + Context-Aware AI Tutor

**Date:** 2026-04-21
**Scope:** `ai_master` (personal DL→Agents learning app, Astro + React, localStorage-based)
**Status:** Spec — awaiting user review before implementation planning

## 1. Problem

The current UI (`max-w-5xl` + `prose`, default Tailwind sans) feels generic and doesn't support the app's positioning as a serious, hand-crafted study tool. Separately, reading a paper alone — even with PARR widgets — lacks a conversational partner that can probe, redirect, and surface meta-cognitive patterns.

Two changes, shipped together because they share the same layout chassis:

1. **Editorial-monotone design with Pretendard** across all pages.
2. **Always-on right-side AI tutor panel** that understands the current paper/roadmap/progress context, enforces the app's pedagogy (PARR + stage order), and persists conversation history per context.

## 2. Non-goals

- No account system, no cloud sync. Everything stays in `localStorage`.
- No multi-model abstraction. Gemini 3.1 Pro (preview) is the only target, via `GOOGLE_AI_API_KEY`.
- No refactor of PARR widgets, SRS, Pyodide runner, or MDX authoring pipeline beyond style touch-ups.
- No support for < 600px viewports beyond graceful degradation (target is desktop/laptop study).

## 3. Design Language (editorial monotone)

**Palette** — defined as CSS variables in `src/styles/global.css`, surfaced to Tailwind v4 via `@theme`:

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0A0A0B` | Body & headings |
| `--ink-2` | `#2A2A2E` | Secondary text |
| `--mute` | `#6B6B72` | Captions, metadata |
| `--line` | `#E6E2DA` | Hairline separators (1px) |
| `--paper` | `#FAF7F0` | Page background (cream) |
| `--paper-2` | `#FFFDF7` | Cards, panels |
| `--accent` | `#1E2A6B` | Links, CTAs (deep indigo) |
| `--accent-soft` | `#E9EAF3` | Highlight backgrounds, user-message bubbles |
| `--danger` | `#8B1E2B` | PARR wrong-answer, warnings |

**Typography — Pretendard everywhere**

- `font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Segoe UI', Roboto, sans-serif`
- Self-hosted via `public/fonts/PretendardVariable.woff2` + `@font-face` with `font-display: swap` and `size-adjust` tuned against the fallback stack to minimize CLS.
- Scale (px): `11 / 13 / 15 / 17 / 21 / 28 / 40` (modular ≈ 1.25, tuned for Hangul)
- Body: 17 / line-height 1.75 / letter-spacing -0.01em
- Headings: H1 40 / weight 700 · H2 28 / weight 650 · H3 21 / weight 600
- Math (KaTeX) and code (JetBrains Mono) keep their native faces.

**Space & borders**

- Main content column max width: 68ch (narrower than current `max-w-5xl` for reading cadence).
- Section breaks: `border-top: 1px solid var(--line)` + 64px vertical rhythm.
- Border radius: flat `4px` globally.
- **No shadows.** Hierarchy is built with hairlines and whitespace only.
- Focus ring: `outline: 2px solid var(--accent); outline-offset: 2px`.

**Files touched**

- `src/styles/global.css` — variables, `@theme`, `@font-face`, base resets.
- `public/fonts/PretendardVariable.woff2` — self-hosted asset.
- Existing components retain structure; only classNames that reference old colors/type scales are updated.

## 4. Layout

**Universal 3-column grid** — replaces per-page bespoke layouts:

```
┌─ page bg (--paper) ───────────────────────────────────┐
│  TopBar (48px, hairline bottom)                       │
│  ← back   |   section title · meta                    │
├──────────┬──────────────────────────┬────────────────┤
│  Nav     │                          │   AI Chat      │
│  (180px) │   Main (max 68ch)        │   Panel        │
│  sticky  │                          │   (380px)      │
│          │                          │   sticky       │
└──────────┴──────────────────────────┴────────────────┘
```

- Wrapper: `max-w-[1400px] mx-auto`
- Grid: `grid-template-columns: 180px minmax(0, 68ch) 380px`
- Gaps: 48px (nav↔main) / 32px (main↔chat)
- Chat panel **open by default**, toggle collapses to 0 width with transform animation; main recenters at 68ch.
- TopBar sticky `top: 0`, StageNav / chat header sticky `top: 64px`.

**Per-page content in the three columns**

| Page | Left nav | Main | Right chat |
|---|---|---|---|
| `/papers/<slug>` | `StageNav` (① Intuition → ④ Code) | Paper MDX | ChatPanel, mode=`paper` |
| `/` (home) | Section ToC (Continue / Roadmap / Footer) | ContinueReading + RoadmapGraph | ChatPanel, mode=`roadmap` |
| `/progress` | empty (or ToC) | Progress dashboard | ChatPanel, mode=`progress` |
| `/review` | empty (or ToC) | Review queue | ChatPanel, mode=`review` |

**Responsive**

- `<1200px`: chat panel becomes a right-edge drawer with overlay; open/close state preserved.
- `<900px`: left nav collapses behind a hamburger; chat becomes a bottom-right FAB that opens a full-screen modal. Single-column main.

**Files touched**

- `src/layouts/PaperLayout.astro` — 3-column refactor.
- New `src/layouts/AppShell.astro` — shared chrome (TopBar + grid) used by all pages so the chat column is consistent everywhere.
- `src/pages/index.astro`, `src/pages/progress.astro`, `src/pages/review.astro` — wrap with `AppShell`.
- New `src/components/layout/TopBar.astro`.
- New `src/components/chat/ChatPanel.tsx` (React island, `client:load`).
- Existing `StageNav.astro` — style pass only.

## 5. AI Chat Panel — UX

### 5.1 Component tree

```
ChatPanel (React)
├─ ChatHeader
│   ├─ context title (paper name / "Roadmap" / ...)
│   ├─ 📚 history button         (toggles list view)
│   └─ ⤫ close
├─ (view A) MessageList
│   ├─ QuestionStack             (collapsible "내 질문 N개")
│   ├─ SystemHint                (first turn only)
│   ├─ UserMessage               (right, --accent-soft bg)
│   └─ AssistantMessage          (left, --paper-2 bg, streaming cursor)
├─ (view B) SessionList
│   ├─ "＋ 새 대화"
│   └─ session rows (title, relative date, ⋯ rename/delete)
├─ StageBadge                    (paper mode only)
└─ ChatInput                     (Enter = send, Shift+Enter = newline)
```

### 5.2 State

- Local (React): `messages`, `streaming`, `currentStage`, `viewMode: "chat" | "history"`, `pedagogyMode: "socratic" | "direct"`.
- Persisted (localStorage) — one key per context mode:

```ts
// Keys: chat:paper:<slug> | chat:roadmap | chat:progress | chat:review
type ChatStore = {
  sessions: Session[];
  activeId: string;
};

type Session = {
  id: string;                    // ISO timestamp, used for sort + display
  title: string;                 // auto-derived from first user message (12 chars + ellipsis)
  startedAt: string;
  lastActiveAt: string;
  pedagogyMode: "socratic" | "direct";
  messages: Message[];           // {role: "user" | "assistant", content, ts}
};
```

- **currentStage** (paper mode only) is derived live from `IntersectionObserver` on `<StageSection id=...>` elements — whichever section has the largest intersecting area wins. Sent to the server with every request, never persisted.

### 5.3 Streaming

- `POST /api/chat` returns `text/event-stream`.
- Client uses `fetch().body.getReader()`, parses `data: {...}\n\n` frames, appends `delta` text to the in-progress assistant message.
- Abort button sends `AbortController.abort()` — server observes `request.signal.aborted` and stops the Gemini stream.
- Network failure → error bubble replaces the partial assistant message with a "재시도" inline button; the user's prior message is preserved in an editable state.
- 429 → friendly message + 30-second local cooldown that disables the send button.

### 5.4 Session archive (`view B`)

- 📚 button swaps the MessageList area for a SessionList — same panel, no modal.
- Sessions sorted by `lastActiveAt` desc; current session is dot-marked and pinned to top.
- Row actions (⋯): **rename** (inline edit of `title`), **delete** (with undo toast for 5s).
- "＋ 새 대화" creates a new session, sets it active, returns to view A. Prior session stays in the list.
- Old single "🔄 reset" button is **removed** (replaced by "새 대화" to avoid accidental loss).

### 5.5 Question stack (within a session)

- Collapsible section at the top of MessageList, labeled `▾ 내 질문 N개` (default collapsed).
- Populated from `messages.filter(m => m.role === "user")` in order.
- Each row shows a 12-char truncation + tooltip with full text, plus actions:
  - `⤢` scroll to that user message in the conversation (with a brief highlight pulse)
  - `↑` populate the input with the same text (user can edit and re-send)
  - `↓` scroll to the assistant's reply to that question
- Header badge (paper mode): `현재 ③ pseudo` derived from `currentStage`.

### 5.6 Adaptive "direct" mode

- Default `pedagogyMode: "socratic"`.
- Client keeps a list of skip-intent phrases (e.g. `그냥 답`, `skip`, `빨리`, `설명만`). When matched in the user's message, the client still sends the request with `socratic`, but the server is instructed (via system prompt) to respond with a single confirmation question rather than an answer.
- When the user's *next* message supplies a reason, the client flips `pedagogyMode` to `direct` for the session and persists it. The server honors `direct` by relaxing the "answer-first" restriction — still stage-aware and PARR-aware, but will answer directly when asked.
- "새 대화" resets `pedagogyMode` back to `socratic`.

## 6. Server — `/api/chat`

### 6.1 Astro hybrid transition

- `astro.config.mjs`:
  - `output: 'server'`
  - Adapter: `@astrojs/node` in `standalone` mode.
  - All existing pages (`index.astro`, `papers/[slug].astro`, `progress.astro`, `review.astro`) set `export const prerender = true` in their frontmatter so they continue to build as static HTML.
- `.env` (gitignored): `GOOGLE_AI_API_KEY=...`, `GOOGLE_AI_MODEL=gemini-3.1-pro-preview`.
- `.env.example` committed with placeholder values.
- Sanity check after migration: `npm run build` output must list every existing route as `prerendered`; only `/api/chat` is SSR.

### 6.2 Endpoint contract

```ts
// src/pages/api/chat.ts
export const prerender = false;

POST /api/chat
Content-Type: application/json
Body: {
  mode: "paper" | "roadmap" | "progress" | "review",
  paperSlug?: string,                        // required when mode=paper
  currentStage?: "intuition" | "math" | "pseudo" | "code",
  progressSnapshot?: {                       // optional; client sends when available
    completed: string[],                     // slugs fully done
    inProgress: { slug: string, stage: string }[],
    lastVisited?: string
  },
  messages: { role: "user" | "assistant", content: string }[],
  pedagogyMode: "socratic" | "direct"
}

Response: text/event-stream
  data: {"delta": "..."} \n\n   (repeated)
  data: [DONE] \n\n
```

- 4xx: JSON body `{ error: "..." }`, status `400 | 401 | 429`.
- Stream errors mid-flight: emit `data: {"error": "..."}` frame, then close.

### 6.3 Paper context loader

- On `mode=paper`, read `src/content/papers/<slug>.mdx` from disk via `fs.promises.readFile` (or Astro content-collection API if it works in SSR context — prefer fs for simplicity and avoiding collection loader startup cost).
- Parse frontmatter via a minimal regex split on the leading `---` block (avoids adding a new dep; frontmatter is tiny and well-formed).
- Extract the four stage bodies by splitting on `<StageSection id="intuition|math|pseudo|code" ...>` opening tags and their closing `</StageSection>`. Strip React component JSX tags for readability (leave prose + markdown + LaTeX + code fences).
- Result: `{ frontmatter, stages: { intuition, math, pseudo, code } }`.

### 6.4 Roadmap/progress context loader

- Import `PAPERS_META` directly from `src/content/papers-meta.ts`.
- Import `ERAS` (if present) from `src/lib/eras.ts` for human era descriptions.
- Compose a compact JSON payload grouped by era, with each entry: `{ slug, title, year, summary, status, influencedBy }`.
- `progressSnapshot` from client is merged in (completed/inProgress flags per slug).

### 6.5 System prompt (final form)

```
당신은 "ai_master"의 AI 튜터입니다. 지금 학습자와 함께 [CONTEXT-TITLE]을 다루고 있습니다.
학습자의 현재 위치: [CONTEXT-LOCATION].

# 당신이 아는 것
- 아래 [CONTEXT] 섹션의 모든 내용
- 이 세션의 전체 대화 히스토리
- 학습자가 언급한 사전 지식 (대화 중 제시된 것만)

# 절대 규칙 (override 불가)
1. 단계 순서 준수: intuition → math → pseudo → code. 학습자가 다음 단계를 건너뛰려 하면
   "먼저 [현재 단계]가 잡혔는지 확인해볼까?"로 역질문. 이유가 합당하면 허용.
2. PARR 원칙 (Predict → Attempt → Reveal → Reflect):
   - 개념·수식·정답을 물으면 바로 답하지 말고 예측을 유도:
     "답을 듣기 전에, 당신은 어떻게 예상하는지 한 줄로?"
   - 예측을 받은 후 검증. 예측이 틀렸으면 학습자가 스스로 원인을 말하게 유도.
3. 답 먼저 주지 않기 (adaptive):
   - 현재 pedagogyMode=[MODE].
   - socratic: "그냥 답" 등 skip 발화 감지 시 이유를 한 번만 되물음. 답은 주지 않음.
   - direct: PARR은 유지하되 답을 주저 없이 설명해도 됨. 여전히 단계 순서는 준수.

# 질문 스택 활용 (meta-cognition)
- 학습자가 이 세션에서 비슷한 개념을 이미 물었으면, 새 답 전에
  "이전에 Q[번호]에서 물은 것과 지금 질문의 차이를 먼저 말해볼래?"로 연결.
- 3턴 이상 지난 질문도 연결 대상.

# 단계별 톤 (paper 모드)
- ① Intuition: 비유·감각 우선. 수식 최소.
- ② Math: 유도를 단계별로 학습자가 채우게.
- ③ Pseudo: 자연어 의사코드를 한 줄씩 함께 작성.
- ④ Code: 고치기 전에 "어디가 수상해 보이는지" 먼저 물음.

# 로드맵 모드 지침 (mode=roadmap/progress/review)
- "다음에 뭐 볼까" 같은 질문은 influencedBy 그래프 + 사용자 진행률 기반으로 답.
  단, PARR: "어느 era가 궁금해?" "지금까지 뭐가 가장 헷갈렸어?"로 먼저 역질문.
- implemented만 추천. planned/stub은 "아직 교재로는 준비 안 됐다"고 명시.
- 연도·era 순서를 역행하는 건너뛰기는 학습자가 배경 있다고 명시했을 때만 허용.

# 답변 포맷
- 한국어 반말 중립체 (사용자가 존댓말이면 존댓말).
- 기본 3문장 이하. 수식은 $$...$$, 코드는 ```python ... ```.
- 이모지 금지. 에디토리얼 톤 유지.
- 불확실하면 "논문 본문에는 없고 내 추측이야"라고 명시.

# [CONTEXT]
[...mode-specific body: paper frontmatter + 4 stages, OR roadmap JSON + progress...]
```

Placeholders (`[CONTEXT-TITLE]`, `[CONTEXT-LOCATION]`, `[MODE]`, `[CONTEXT]`) are filled by the prompt builder per request.

### 6.6 Gemini call

- SDK: `@google/genai` (new unified SDK).
- Call: `ai.models.generateContentStream({ model: process.env.GOOGLE_AI_MODEL, contents: geminiHistory, config: { systemInstruction, temperature: 0.3 } })`.
- `contents`: convert internal `messages` to Gemini's `{role: "user" | "model", parts: [{text}]}` format.
- `systemInstruction`: the built system prompt string (Gemini treats it separately from `contents`).
- Safety settings: defaults (educational content shouldn't trip them).
- Abort: `request.signal.addEventListener("abort", () => controller.abort())` on the SDK's controller.

## 7. Testing

**Unit (Vitest)**
- `promptBuilder.test.ts` — asserts that system prompt for each mode contains PARR block, correct `[CONTEXT-LOCATION]`, correct stage body for paper mode, correct progress JSON for roadmap mode, and `pedagogyMode` substitution.
- `mdxStageParser.test.ts` — given a sample MDX, returns 4 stages keyed by id; robust to extra whitespace and embedded JSX components.
- `sessionReducer.test.ts` — actions: `START_SESSION`, `APPEND_MESSAGE`, `RENAME`, `DELETE_WITH_UNDO`, `SWITCH_ACTIVE`; verifies localStorage shape.
- `sseParser.test.ts` — correctly assembles partial chunks split across reader reads; handles `[DONE]` and error frames.

**E2E (Playwright)**
- `chat-paper-mode.spec.ts` — visit `/papers/transformer`, type a question, observe streaming tokens, reload, see message restored.
- `chat-socratic-to-direct.spec.ts` — send skip phrase, see confirmation-question response (mocked), send reason, observe `pedagogyMode=direct` in next request body (intercepted).
- `chat-history.spec.ts` — create 2 sessions, rename one, delete the other (assert undo toast), switch active.
- `chat-roadmap-mode.spec.ts` — visit `/`, ask "transformer 이해하려면 뭐부터", assert request body has `mode: "roadmap"` and `progressSnapshot`.

**Manual**
- Pretendard: no FOUT flash on cold reload, Hangul spacing feels right at body 17px.
- Hairlines stay crisp at 1× and 2× DPI.
- Chat toggle animates smoothly; main column re-centers without layout thrash.

## 8. Implementation order

Each step is a self-contained commit (project is not currently a git repo; if initialized, commit between steps).

1. **Design system** — Pretendard self-host, global.css variables, `@theme`, base resets.
2. **Layout refactor** — `AppShell.astro`, TopBar, 3-col grid applied to all pages; `StageNav` style pass.
3. **Astro hybrid transition** — `@astrojs/node`, `prerender=true` on existing pages, `.env.example`.
4. **`/api/chat` endpoint** — MDX loader, system prompt builder, Gemini SDK, SSE stream, abort wiring.
5. **ChatPanel core** — MessageList, ChatInput, streaming reader, single session in localStorage.
6. **Session archive** — multi-session store, history view, rename/delete/undo.
7. **Question stack** — collapsible stack, jump / re-ask / jump-to-answer actions.
8. **Mode branching** — roadmap/progress/review context loaders, IntersectionObserver for `currentStage`.
9. **Adaptive direct mode** — skip-phrase detection + confirmation flow, `pedagogyMode` persistence.
10. **Polish** — responsive drawer/FAB, keyboard + aria + focus, 429 UX, Playwright e2e.

## 9. Risks

- **Model availability**: `gemini-3.1-pro-preview` may not be callable on the user's API tier. Mitigation: `GOOGLE_AI_MODEL` env var for fast swap; `curl` smoke-test before shipping step 4.
- **Prerender regression**: missing `prerender=true` on any page during hybrid transition would push it to SSR. Mitigation: build output check in step 3; CI assertion if CI ever added.
- **Pretendard FOUT**: variable woff2 is ~2MB. Mitigation: subset to Hangul + Latin + common symbols (~400KB), `font-display: swap`, `size-adjust`/`ascent-override` against the fallback stack to minimize CLS.
- **SSE in Astro node adapter**: need to confirm `ReadableStream` responses stream correctly without buffering. Mitigation: step 4 acceptance test uses a slow-response mock to verify incremental delivery in-browser.
- **Shared panel-slot state**: question stack + history view both live in the chat panel body. Mitigation: single `useReducer` with a discriminated `viewMode`, no external state library.

## 10. Open questions (none blocking)

- Cross-paper "내 질문 모음" view on `/progress` or `/review`: deferred from MVP. Add in a follow-up spec if useful.
- Export/import of sessions as JSON: not in scope.
- Token/cost surface (show running token count per session): not in scope; revisit if usage patterns warrant.
