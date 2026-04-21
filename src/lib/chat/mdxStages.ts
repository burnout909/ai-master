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
