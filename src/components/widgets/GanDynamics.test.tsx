import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GanDynamics } from "./GanDynamics";

describe("<GanDynamics>", () => {
  it("renders training step slider", () => {
    render(<GanDynamics />);
    expect(screen.getByLabelText(/training step/i)).toBeInTheDocument();
  });

  it("Converged equilibrium checkbox toggles state", () => {
    render(<GanDynamics />);
    const checkbox = screen.getByLabelText(/converged equilibrium/i);
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
