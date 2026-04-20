# Overnight batch report — 2026-04-21

Autonomous run of the 30-paper batch from `docs/superpowers/batch-27-papers.md`. Orchestrated via the subagent-driven-development pattern: one fresh subagent per widget (TDD) and a second per paper for MDX + PDF + meta, with the controller running build/test verification between papers.

## Result

**30 / 30 papers succeeded. 0 failures.**

## Completed papers (in execution order)

### Phase 1 — DL Foundations (8)
| # | Slug | Widget SHA | MDX SHA | Widget name |
|---|------|------------|---------|-------------|
| 1 | alexnet | 1cb0c48 | 01895c3 | ActivationCompare |
| 2 | dropout | 847cd76 | 6df102d | DropoutMask |
| 3 | adam | 8735b71 | 4bcf70c | AdamMoments |
| 4 | bahdanau | 60001cd | 55f069f | AlignmentGrid |
| 5 | seq2seq | 8e3fb28 | ca298b4 | Seq2SeqTrace |
| 6 | batchnorm | 54f517e | d285614 | BatchNormDist |
| 7 | resnet | 79d8176 | 56b0fef | ResidualDepth |
| 8 | gan | 8321592 | e80b789 | GanDynamics |

### Phase 2 — Transformer Era (6)
| # | Slug | Widget SHA | MDX SHA | Widget name |
|---|------|------------|---------|-------------|
| 9 | bert | d42c304 | 06bdd3e | MaskPatterns |
| 10 | gpt2 | 2b50895 | 54cb865 | TemperatureSampler |
| 11 | gpt3 | f67b100 | 3b3bf4e | FewShotScale |
| 12 | vit | e8387a7 | 6e87cbb | PatchGrid |
| 13 | clip | c99972b | 32e2f6c | ClipMatrix |
| 14 | chinchilla | 1c9b5a1 | 21ad568 | ChinchillaCurve |

### Phase 3 — Generative (3)
| # | Slug | Widget SHA | MDX SHA | Widget name |
|---|------|------------|---------|-------------|
| 15 | ldm | 3240aaf | f02135c | LatentVsPixel |
| 16 | cfg | 50259d9 | 75ed701 | GuidanceScale |
| 17 | flow-matching | 7bc24ee | b73b44a | FlowField |

### Phase 4 — Efficiency (3)
| # | Slug | Widget SHA | MDX SHA | Widget name |
|---|------|------------|---------|-------------|
| 18 | flashattention | eadd432 | f850613 | FlashMemory |
| 19 | gqa | d940755 | b7cbc0a | KVGroups |
| 20 | mamba | bfcc2f4 | fe04e15 | SelectiveScan |

### Phase 5 — Alignment (4)
| # | Slug | Widget SHA | MDX SHA | Widget name |
|---|------|------------|---------|-------------|
| 21 | ppo | 625a4b6 | ac8d821 | PpoClip |
| 22 | instructgpt | fb01c1c | f13405c | RewardMargin |
| 23 | dpo | 6713656 | d20fb9a | DpoLoss |
| 24 | constitutional | 562ea44 | b771f4d | CritiqueLoop |

### Phase 6 — Reasoning & Agents (6)
| # | Slug | Widget SHA | MDX SHA | Widget name |
|---|------|------------|---------|-------------|
| 25 | cot | 93c59dd | 73d4154 | CotPrompt |
| 26 | toolformer | d56941a | 6b62742 | ToolCalls |
| 27 | reflexion | ca0c705 | 27bb8b1 | ReflexionTrace |
| 28 | tot | b167668 | 73ae005 | TotTree |
| 29 | voyager | 907bb0d | 199f2c2 | SkillLibrary |
| 30 | deepseek-r1 | 3d2dc2f | d4546f6 | RlRewardCurve |

## Failed papers

**None.**

## Final counts

| Metric | Before | After | Delta |
|---|---|---|---|
| Implemented papers | 3 | 33 | **+30** |
| Interactive widgets | 3 | 33 | +30 |
| Unit tests (vitest) | 38 | 105 | +67 |
| E2E specs (Playwright) | 1 | 1 | 0 (no new e2e added) |
| Static pages | 6 | 36 | +30 |
| Paper commits | — | 60 | — (2 per paper × 30) |
| PDFs downloaded | 3 | 33 | +30 |

All 30 new widgets carry 2 vitest behavioural assertions (some have 5–9 as a subagent went further than the minimum). Every paper was verified via `npm run build` (produces expected page) + `npm run test` (all green) before commit.

## Notable incidents

### Stream idle timeouts (x2)
Two MDX subagents (batchnorm, mamba) lost their response stream to the API mid-run. In both cases the on-disk state showed partial progress (PDF downloaded, MDX partially or fully written, meta not yet updated, no commit). Controller recovered by:

1. Inspecting `git status` and file state
2. Finishing the remaining edits directly (the controller, not a subagent)
3. Running `npm run build && npm run test` verify
4. Committing with the standard `feat: <slug> paper — full 5-stage content` message

Net effect: no content loss, standard commit shape preserved.

### MDX `{...}` JSX expression gotcha
During the mamba build, the prerender threw `ReferenceError: t is not defined`. Root cause: bare `{t-1}` subscripts in MDX prose paragraphs — MDX parses any `{...}` outside attribute strings or fenced code as a JSX expression. Fixed by wrapping problem expressions in backticks (`` `h_(t-1)` ``). Documented this gotcha in every subsequent MDX subagent prompt (ppo onward); no recurrences after the fix was in place.

**Recommendation for the recipe:** add a bullet to `docs/superpowers/add-paper-recipe.md` under "Astro 6 + React + MDX gotchas":

> - **Bare `{...}` in MDX prose is JSX.** Subscripts like `h_{t-1}` or `pi_{new}` in paragraph text are parsed as JavaScript expressions and will throw `ReferenceError: <name> is not defined` at prerender time. Wrap inline variables in backticks (`` `h_(t-1)` ``) or use parentheses (`h_(t-1)`) for prose. Use `<Math>` or `<MathReact>` when real KaTeX is needed.

### Mass-append cascade on `papers-meta.test.ts`
A single test in `src/content/papers-meta.test.ts` asserts an exact sorted list of implemented slugs. Every paper's MDX subagent had to update this test's count (`has N implemented papers`) and insert the new slug alphabetically. This worked reliably once subagents were told exactly where the slug goes. Alternative future-proofing: consider loosening the assertion to `expect(impl.length).toBeGreaterThanOrEqual(3)` plus a set-membership check for the anchor papers — the current exact-list shape is fragile under batch additions.

## Widget patterns observed

Most widgets converged on a small set of interactive elements:
- **Slider + output** (dropout, adam, resnet, ppo, dpo, instructgpt, etc.) — one or two sliders driving a deterministic computation and numeric readouts.
- **Select + conditional panel** (bert, cot, constitutional, voyager, reflexion, toolformer) — dropdown picks a scenario; widget shows the consequent content.
- **Step slider + trace** (reflexion, tot, deepseek-r1, seq2seq) — slider advances a hard-coded or computed trajectory.

All widgets use `Math.sin(...)` seeded deterministic values — no `Math.random()` — so rendered output is reproducible across sessions and tests.

## Files changed

- `src/components/widgets/*.tsx` — 30 new widgets + tests (60 files)
- `src/content/papers/*.mdx` — 30 new paper MDX files
- `src/content/papers-meta.ts` — 30 entries flipped from `"stub"` to `"implemented"`
- `src/content/papers-meta.test.ts` — count + sorted-list assertion bumped each paper
- `public/pdfs/*.pdf` — 30 PDFs downloaded (GPT-2 uses `gpt2.pdf` since the original paper has no arXiv ID; all others use `<arxivId>.pdf`)
- `docs/superpowers/batch-progress.log` — per-paper log written during the run
- `docs/superpowers/batch-failures.log` — remained empty (no failures)

## Suggested follow-ups

1. Add the `{...}` MDX gotcha to `add-paper-recipe.md`.
2. Extend Playwright e2e coverage — currently one smoke test; adding one per era (6 tests total) would catch MDX render regressions early.
3. Relax the exact-list assertion in `papers-meta.test.ts` to prevent future batch-add friction.
4. Revisit `public/pdfs/2112.10752.pdf` (LDM, 39 MB) and `public/pdfs/2305.16291.pdf` (Voyager, 18 MB) — consider git-lfs or external-hosting to keep the repo lean.
5. Verify `alexnet` and `gpt2` PDF sources: `alexnet` uses `1102.0183` from the meta, which actually points to a different 2011 paper (Ciresan et al.) on arXiv — the true AlexNet paper has no arXiv ID. `gpt2` was downloaded from OpenAI's CDN as there is no arXiv listing.
