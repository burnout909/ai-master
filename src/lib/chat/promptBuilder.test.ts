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
