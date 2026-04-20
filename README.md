# ai_master

Personal interactive web app for learning deep learning → agents (2012 → 2026) through canonical papers, one at a time, with active-learning pedagogy.

## Stack

Astro 6 · React 19 · TypeScript · Tailwind v4 · MDX · KaTeX · Monaco · Pyodide · localStorage.

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
