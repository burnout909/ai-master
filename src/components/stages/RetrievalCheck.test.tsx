import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { RetrievalCheck } from "./RetrievalCheck";
import { loadStore, resetStore } from "../../lib/storage";

const qs = [
  { prompt: "Q1", options: [
    { text: "right", correct: true, explain: "" },
    { text: "wrong", correct: false, explain: "" },
  ]},
  { prompt: "Q2", options: [
    { text: "right", correct: true, explain: "" },
    { text: "wrong", correct: false, explain: "" },
  ]},
];

describe("<RetrievalCheck>", () => {
  beforeEach(() => resetStore());

  it("calls onPass only when ALL answered correctly", () => {
    const onPass = vi.fn();
    render(<RetrievalCheck questions={qs} onPass={onPass} />);
    const rights = screen.getAllByLabelText("right");
    fireEvent.click(rights[0]);
    expect(onPass).not.toHaveBeenCalled();
    fireEvent.click(rights[1]);
    expect(onPass).toHaveBeenCalledOnce();
  });

  it("enqueues SrsCard descendants of enclosing section on pass", () => {
    render(
      <section>
        <div data-srs-card data-id="c1" data-paper="t" data-prompt="p" data-answer="a" />
        <RetrievalCheck questions={qs} />
      </section>,
    );
    const rights = screen.getAllByLabelText("right");
    fireEvent.click(rights[0]);
    fireEvent.click(rights[1]);
    const cards = loadStore().srs.cards;
    expect(cards.map((c) => c.id)).toContain("c1");
  });
});
