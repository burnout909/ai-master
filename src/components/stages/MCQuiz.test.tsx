import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MCQuiz } from "./MCQuiz";

const question = {
  prompt: "What is √d_k for?",
  options: [
    { text: "Prevents softmax from saturating", correct: true, explain: "Large dot products push softmax to 0/1." },
    { text: "Normalizes gradient", correct: false, explain: "That's LayerNorm." },
    { text: "Speeds training", correct: false, explain: "Indirectly, but not the main reason." },
  ],
};

describe("<MCQuiz>", () => {
  it("renders prompt + options", () => {
    render(<MCQuiz question={question} />);
    expect(screen.getByText(/√d_k/)).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("shows explanation after selection", () => {
    render(<MCQuiz question={question} />);
    fireEvent.click(screen.getByLabelText(/Prevents softmax/));
    expect(screen.getByText(/push softmax to 0\/1/)).toBeInTheDocument();
  });

  it("calls onCorrect when correct chosen", () => {
    const onCorrect = vi.fn();
    render(<MCQuiz question={question} onCorrect={onCorrect} />);
    fireEvent.click(screen.getByLabelText(/Prevents softmax/));
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it("allows re-attempt after wrong answer", () => {
    render(<MCQuiz question={question} />);
    fireEvent.click(screen.getByLabelText(/Normalizes gradient/));
    expect(screen.getByText(/That's LayerNorm/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Prevents softmax/));
    expect(screen.getByText(/push softmax to 0\/1/)).toBeInTheDocument();
  });
});
