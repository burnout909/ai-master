import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NoiseSchedule } from "./NoiseSchedule";

describe("<NoiseSchedule>", () => {
  it("renders t slider and schedule toggle", () => {
    render(<NoiseSchedule />);
    expect(screen.getByLabelText(/timestep/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/schedule/i)).toBeInTheDocument();
  });
});
