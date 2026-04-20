import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PpoClip } from "./PpoClip";

describe("<PpoClip>", () => {
  it("renders ratio slider", () => {
    render(<PpoClip />);
    expect(
      screen.getByRole("slider", { name: /ratio/i })
    ).toBeInTheDocument();
  });

  it("renders advantage slider", () => {
    render(<PpoClip />);
    expect(
      screen.getByRole("slider", { name: /advantage/i })
    ).toBeInTheDocument();
  });
});
