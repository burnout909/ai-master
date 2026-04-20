import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RoadmapGraph } from "./RoadmapGraph";
import { PAPERS_META } from "../../content/papers-meta";

describe("<RoadmapGraph>", () => {
  it("renders a node for every paper", () => {
    render(<RoadmapGraph papers={PAPERS_META} />);
    PAPERS_META.forEach((p) => {
      expect(screen.getByTitle(p.title)).toBeInTheDocument();
    });
  });

  it("implemented papers have clickable link", () => {
    render(<RoadmapGraph papers={PAPERS_META} />);
    const link = screen.getByTitle("Attention Is All You Need").closest("a");
    expect(link?.getAttribute("href")).toBe("/papers/transformer");
  });
});
