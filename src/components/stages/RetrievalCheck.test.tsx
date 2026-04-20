import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RetrievalCheck } from "./RetrievalCheck";

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
  it("calls onPass only when ALL answered correctly", () => {
    const onPass = vi.fn();
    render(<RetrievalCheck questions={qs} onPass={onPass} />);
    const rights = screen.getAllByLabelText("right");
    fireEvent.click(rights[0]);
    expect(onPass).not.toHaveBeenCalled();
    fireEvent.click(rights[1]);
    expect(onPass).toHaveBeenCalledOnce();
  });
});
