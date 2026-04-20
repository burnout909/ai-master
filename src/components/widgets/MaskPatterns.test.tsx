import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MaskPatterns } from "./MaskPatterns";

describe("<MaskPatterns>", () => {
  it("renders the mask mode select", () => {
    render(<MaskPatterns />);
    expect(screen.getByRole("combobox", { name: /mask mode/i })).toBeInTheDocument();
  });

  it("renders a query position slider (min=0 max=5)", () => {
    render(<MaskPatterns />);
    const slider = screen.getByRole("slider", { name: /query position/i });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "5");
  });
});
