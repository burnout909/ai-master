import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FewShotScale } from "./FewShotScale";

describe("<FewShotScale>", () => {
  it("renders task select", () => {
    render(<FewShotScale />);
    expect(screen.getByRole("combobox", { name: /task/i })).toBeInTheDocument();
  });

  it("renders shots slider (min=0, max=5)", () => {
    render(<FewShotScale />);
    const slider = screen.getByRole("slider", { name: /shots/i });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "5");
  });
});
