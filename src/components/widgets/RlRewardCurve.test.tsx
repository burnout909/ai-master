import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RlRewardCurve } from "./RlRewardCurve";

describe("<RlRewardCurve>", () => {
  it("renders training step slider", () => {
    render(<RlRewardCurve />);
    expect(
      screen.getByRole("slider", { name: /training step/i })
    ).toBeInTheDocument();
  });

  it("Show supervised baseline checkbox toggles state", () => {
    render(<RlRewardCurve />);
    const checkbox = screen.getByRole("checkbox", {
      name: /show supervised baseline/i,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
