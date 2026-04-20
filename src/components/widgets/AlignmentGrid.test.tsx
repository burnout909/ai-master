import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AlignmentGrid } from "./AlignmentGrid";

describe("<AlignmentGrid>", () => {
  it("renders the target step select", () => {
    render(<AlignmentGrid />);
    expect(
      screen.getByRole("combobox", { name: /target step/i })
    ).toBeInTheDocument();
  });

  it("toggling Monotonic alignment changes some output text", () => {
    render(<AlignmentGrid />);
    const checkbox = screen.getByLabelText(/monotonic alignment/i);
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
