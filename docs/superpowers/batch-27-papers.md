# Overnight batch — 27 stub papers

Order chosen so that earlier papers build intuition for later ones (readers can walk the app era-by-era). Low-risk simpler papers first — if the run crashes or gets rate-limited, the highest-leverage early-era content is already done.

## Execution order (27 slugs)

### Phase 1 — DL Foundations (8)
1. alexnet
2. dropout
3. adam
4. bahdanau
5. seq2seq
6. batchnorm
7. resnet
8. gan

### Phase 2 — Transformer Era (6)
9. bert
10. gpt2
11. gpt3
12. vit
13. clip
14. chinchilla

### Phase 3 — Generative (3)
15. ldm
16. cfg
17. flow-matching

### Phase 4 — Efficiency (3)
18. flashattention
19. gqa
20. mamba

### Phase 5 — Alignment (4)
21. ppo
22. instructgpt
23. dpo
24. constitutional

### Phase 6 — Reasoning & Agents (6)
25. cot
26. toolformer
27. reflexion
28. tot
29. voyager
30. deepseek-r1

## Invariants per paper

Follow `docs/superpowers/add-paper-recipe.md` exactly. No shortcuts.

- Two commits per paper (widget, then MDX+meta)
- Every stage gated by PARR
- Tests must still pass after each paper (rollback if they don't)
- `npm run build` must still succeed

## Continue-on-error policy

If one paper fails:
1. `git reset --hard` to the last clean commit (state before that paper's first commit)
2. Log the paper slug + short reason to `docs/superpowers/batch-failures.log`
3. Continue to the next paper — do NOT halt the batch

## Final report

After attempting all 27, produce a summary at the end of the run:

- Completed papers (slug list)
- Failed papers (slug + one-line reason)
- Final counts: commits, unit tests, e2e tests, static pages
- Any degradations discovered (e.g., a pre-existing test started flaking)
