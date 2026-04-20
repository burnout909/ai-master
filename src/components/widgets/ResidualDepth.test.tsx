import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ResidualDepth } from "./ResidualDepth";

describe("<ResidualDepth>", () => {
  it("renders depth slider with min=2 and max=50", () => {
    render(<ResidualDepth />);
    const slider = screen.getByRole("slider", { name: /depth/i });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute("min", "2");
    expect(slider).toHaveAttribute("max", "50");
  });

  it("checkbox 'Use skip connection' toggles state", () => {
    render(<ResidualDepth />);
    const checkbox = screen.getByRole("checkbox", { name: /use skip connection/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
