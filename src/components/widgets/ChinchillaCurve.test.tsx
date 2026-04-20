import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChinchillaCurve } from "./ChinchillaCurve";

describe("<ChinchillaCurve>", () => {
  it("renders log10 params slider", () => {
    render(<ChinchillaCurve />);
    expect(screen.getByRole("slider", { name: /log10 params/i })).toBeInTheDocument();
  });

  it("renders log10 tokens slider", () => {
    render(<ChinchillaCurve />);
    expect(screen.getByRole("slider", { name: /log10 tokens/i })).toBeInTheDocument();
  });
});
