# Adding a new paper to ai_master

This is the canonical recipe for extending the MVP (Transformer / DDPM / ReAct) with any of the 27 stub papers listed in `src/content/papers-meta.ts`. Each run handles **one paper**.

## Invariants (do not violate)

1. **Five stages in strict order:** `intuition` → `math` → `pseudo` → `code` → `pdf`.
2. **PARR at every stage:** Predict → Attempt → Reveal → Reflect. Never reveal before the user has produced something.
3. **Interactive hero widget** in Intuition — a custom React component per paper, manipulable sliders/toggles/steppers. Not a static image.
4. **Every stage ends with `<RetrievalCheck>`** (2–3 MC questions).
5. **Every stage contains at least one `<SrsCard>`** on a key concept.
6. **Code stage uses Pyodide** (NumPy / SymPy / pure Python only). `<HintFade>` (3 hints) + `<PyRunner>` + `<AssertionTests>`.
7. **TDD for the widget.** Test file first, fail, implement, pass, commit.
8. **Two commits:** one for the widget, one for the MDX + papers-meta update.

## Astro 6 + React + MDX gotchas (learned during MVP)

- `arxivId` frontmatter must be a **quoted string**: `arxivId: "2006.11239"`. Unquoted values get parsed as floats.
- `<DerivationStep>`: use `revealExpr="\\text{...}"` (string prop rendering via `MathReact`). Do **not** pass JSX through `revealContent` from MDX — Astro's JSX runtime and React's disagree about children.
- `<HintFade>`: use `solutionCode={\`...\`}` (string prop rendered as `<pre>`). Same reason as above.
- `<MathReact>` for math inside a React component's props. `<Math>` (Astro) for math in MDX body.
- Every interactive React component gets `client:load` (or `client:only="react"` for PyRunner/AssertionTests, which can't SSR).
- Pyodide runs from jsDelivr CDN via WebWorker. It can't import PyTorch-full; stick to NumPy/SymPy.

## Component APIs (reference)

| Component | Props | Purpose |
|---|---|---|
| `<StageSection id title>` | id, title | Scroll-anchored section wrapper |
| `<PredictThenReveal predictPrompt>` | + children (reveal body) | Typed prediction + gated reveal |
| `<MCQuiz question>` | `{prompt, options: [{text, correct, explain}]}` | Multiple choice w/ per-option explain |
| `<FillBlank answer>` | case/whitespace-insensitive | Inline blank |
| `<LineReorder lines>` | correct order array; internally shuffles | Drag-to-order |
| `<DerivationStep question revealExpr>` | MC + KaTeX reveal string | Math next-line gate |
| `<HintFade hints solutionCode>` | `[h1,h2,h3]` + code string | 3-level hint ladder |
| `<PyRunner initialCode colabUrl>` | Monaco + Pyodide | Student's editor |
| `<AssertionTests userCode testCode>` | both strings | Python-side `assert` runner |
| `<RetrievalCheck questions>` | MCQuestion[] | Gate — onPass enqueues all descendant SrsCards |
| `<SrsCard id prompt answer paper>` | — | Declarative SRS item (Astro comp) |
| `<PdfViewer src title>` | — | Inline PDF embed |
| `<Math expr display>` | KaTeX | MDX-body math |
| `<MathReact expr display>` | KaTeX | React-props math |

## File paths per paper

Given the paper's slug `<slug>`:

- **Widget:** `src/components/widgets/<PascalName>.tsx` + `.test.tsx`
- **Content:** `src/content/papers/<slug>.mdx`
- **PDF:** `public/pdfs/<arxivId>.pdf`
- **Meta update:** `src/content/papers-meta.ts` — change the `status: "stub"` entry to `status: "implemented"`

## Step-by-step execution

### Phase 1 — Widget (TDD)

1. Write `src/components/widgets/<Name>.test.tsx` with ≥2 behavioral assertions (renders expected controls, toggles work).
2. Run `npm run test -- <Name>` — confirm failure.
3. Implement `src/components/widgets/<Name>.tsx`. Keep it self-contained, deterministic, and under 150 lines. No external data — seed with `Math.sin(...)` for reproducible mock values if you need random-looking numbers.
4. Run tests — confirm pass.
5. `git commit -m "feat: <Name> widget for <slug> paper"`

### Phase 2 — MDX + meta

1. Download the PDF:
   ```bash
   curl -L -o public/pdfs/<arxivId>.pdf https://arxiv.org/pdf/<arxivId>
   ```
   Verify file size (>100KB, ideally 1–10MB).

2. Copy `src/content/papers/transformer.mdx` to `src/content/papers/<slug>.mdx`. Replace:
   - Frontmatter (slug/title/authors/year/era/arxivId/estimatedMinutes)
   - Import line: swap `AttentionMatrix` for your new widget
   - All five stage sections — replace content but keep the structure identical

3. Update `src/content/papers-meta.ts`: change the matching paper's `status: "stub"` to `status: "implemented"`.

4. `npm run build` — must produce N+1 pages (where N was the prior count).

5. `npm run test` — all existing tests still pass.

6. Dev smoke: `curl http://localhost:4321/papers/<slug>` returns 200 with the title in HTML.

7. `git commit -m "feat: <slug> paper — full 5-stage content"`

### Phase 3 — Verify on the roadmap

Open `/` — the paper's node should now render as a bright clickable circle instead of dim grey. Click it → the paper page loads. Walk all 5 stages to confirm nothing throws at runtime.

## Stage content templates (use verbatim where possible)

### Intuition

```mdx
<StageSection id="intuition" title="① Intuition">

<!-- 1-2 paragraphs of motivation, contrasting with the prior state of the art -->

<PredictThenReveal client:load predictPrompt="<hook question before the widget>">
  <!-- short explanation of what the reader should have realized -->
</PredictThenReveal>

<<WidgetName> client:load />

<PredictThenReveal client:load predictPrompt="<question about behaviour visible only after playing with widget>">
  <!-- explanation tying the widget behaviour to a principle -->
</PredictThenReveal>

<SrsCard id="<slug>-<concept>" paper="<slug>" prompt="<question>" answer="<answer>" />

<RetrievalCheck client:load questions={[
  { prompt: "<Q1>", options: [
    { text: "<correct>", correct: true, explain: "<why>" },
    { text: "<distractor>", correct: false, explain: "<why wrong>" },
    { text: "<distractor>", correct: false, explain: "<why wrong>" },
  ]},
  { prompt: "<Q2>", options: [ /* same shape */ ]},
]} />

</StageSection>
```

### Math

```mdx
<StageSection id="math" title="② Math">

<Math display expr="<main equation in KaTeX>" />

<!-- 1-2 paragraphs walking through variables and meaning -->

<DerivationStep client:load
  question={{
    prompt: "<derivation-step MC question>",
    options: [
      { text: "<correct>", correct: true, explain: "<why>" },
      { text: "<distractor>", correct: false, explain: "<why wrong>" },
      { text: "<distractor>", correct: false, explain: "<why wrong>" },
    ],
  }}
  revealExpr="<next-line KaTeX>"
/>

<!-- Second DerivationStep for the second key math jump -->

<SrsCard id="<slug>-<math-concept>" paper="<slug>" prompt="<Q>" answer="<A>" />

<RetrievalCheck client:load questions={[ /* 2 MC */ ]} />

</StageSection>
```

### Pseudo code

```mdx
<StageSection id="pseudo" title="③ Pseudo code">

Arrange the algorithm steps in order:

<LineReorder client:load lines={[
  "Step 1 (first)",
  "Step 2",
  "Step 3",
  "Step 4 (last)",
]} />

Fill the blank in this pseudo code:

\`\`\`text
def algorithm(x):
    y = _______    # ← fill
    return y
\`\`\`

<FillBlank answer="<expected>" client:load />

<RetrievalCheck client:load questions={[ /* 1 MC */ ]} />

</StageSection>
```

### Code (Python via Pyodide)

```mdx
<StageSection id="code" title="④ Code (Python)">

Implement <concept> in NumPy.

<HintFade client:load
  hints={[
    "<hint level 1 — general direction>",
    "<hint level 2 — specific API>",
    "<hint level 3 — near-spoiler>",
  ]}
  solutionCode={\`import numpy as np

def solution(...):
    ...
\`}
/>

<PyRunner
  client:only="react"
  initialCode={\`import numpy as np

def function(...):
    # TODO: implement
    pass

# Quick sanity
print(function(...))
\`} />

<AssertionTests
  client:only="react"
  userCode={\`<reference solution as Python string>\`}
  testCode={\`<asserts as Python string>
print("ok")
\`}
/>

<RetrievalCheck client:load questions={[ /* 1 MC */ ]} />

</StageSection>
```

### PDF

```mdx
<StageSection id="pdf" title="⑤ Original paper">

<PdfViewer src="/pdfs/<arxivId>.pdf" title="<short title>" />

Suggested reading order: §X (...) → §Y (...) → §Z (...).

</StageSection>
```
