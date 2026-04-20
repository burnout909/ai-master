import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CritiqueLoop } from "./CritiqueLoop";

describe("<CritiqueLoop>", () => {
  it("renders prompt select", () => {
    render(<CritiqueLoop />);
    expect(screen.getByLabelText("prompt")).toBeInTheDocument();
  });

  it("renders Advance step button and clicking it changes the step number", () => {
    render(<CritiqueLoop />);
    const btn = screen.getByRole("button", { name: /advance step/i });
    expect(btn).toBeInTheDocument();
    const initialText = btn.textContent;
    fireEvent.click(btn);
    expect(btn.textContent).not.toBe(initialText);
  });
});
