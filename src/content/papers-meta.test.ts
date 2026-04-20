import { describe, expect, it } from "vitest";
import { PAPERS_META } from "./papers-meta";
import { ERAS } from "../lib/eras";

describe("papers-meta", () => {
  it("has eighteen implemented papers in MVP", () => {
    const impl = PAPERS_META.filter((p) => p.status === "implemented").map((p) => p.slug);
    expect(impl.sort()).toEqual(["adam", "alexnet", "bahdanau", "batchnorm", "bert", "chinchilla", "clip", "ddpm", "dropout", "gan", "gpt2", "gpt3", "ldm", "react", "resnet", "seq2seq", "transformer", "vit"]);
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
