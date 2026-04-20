import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Seq2SeqTrace } from "./Seq2SeqTrace";

describe("Seq2SeqTrace", () => {
  it("renders source length slider", () => {
    render(<Seq2SeqTrace />);
    expect(screen.getByLabelText("source length")).toBeTruthy();
  });

  it("toggling Reverse source order flips checkbox state", () => {
    render(<Seq2SeqTrace />);
    const checkbox = screen.getByLabelText("Reverse source order") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });
});
