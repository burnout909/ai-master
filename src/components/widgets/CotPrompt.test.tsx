import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CotPrompt } from "./CotPrompt";

describe("<CotPrompt>", () => {
  it("renders problem select", () => {
    render(<CotPrompt />);
    expect(screen.getByRole("combobox", { name: /problem/i })).toBeInTheDocument();
  });

  it("Chain-of-Thought checkbox toggles state", () => {
    render(<CotPrompt />);
    const checkbox = screen.getByRole("checkbox", { name: /chain-of-thought/i });
    expect(checkbox).not.toBeChecked();
    // Without CoT: direct answer panel visible
    expect(screen.getByText(/direct answer/i)).toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    // With CoT: reasoning panel visible
    expect(screen.getByText(/reasoning/i)).toBeInTheDocument();
  });
});
