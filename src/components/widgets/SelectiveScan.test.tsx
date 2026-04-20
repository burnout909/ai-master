import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SelectiveScan } from "./SelectiveScan";

describe("<SelectiveScan>", () => {
  it("renders the step slider", () => {
    render(<SelectiveScan />);
    expect(screen.getByRole("slider", { name: /step/i })).toBeInTheDocument();
  });

  it("Selective (Mamba) checkbox toggles mode text", () => {
    render(<SelectiveScan />);
    // Initially unchecked → Plain SSM mode
    expect(screen.getByText(/Mode: Plain SSM/i)).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox", { name: /selective.*mamba/i });
    fireEvent.click(checkbox);

    // After checking → Mamba selective mode
    expect(screen.getByText(/Mode: Mamba \(selective\)/i)).toBeInTheDocument();
  });
});
