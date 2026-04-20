import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DropoutMask } from "./DropoutMask";

describe("<DropoutMask>", () => {
  it("renders the keep probability slider", () => {
    render(<DropoutMask />);
    expect(
      screen.getByRole("slider", { name: /keep probability/i })
    ).toBeInTheDocument();
  });

  it("renders a Resample button that keeps the component mounted after click", () => {
    render(<DropoutMask />);
    const button = screen.getByRole("button", { name: /resample/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    // Component should still be in the DOM after the click
    expect(
      screen.getByRole("slider", { name: /keep probability/i })
    ).toBeInTheDocument();
  });
});
