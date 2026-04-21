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
