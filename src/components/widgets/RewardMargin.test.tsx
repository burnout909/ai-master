import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RewardMargin } from "./RewardMargin";

describe("<RewardMargin>", () => {
  it("renders reward A slider", () => {
    render(<RewardMargin />);
    expect(
      screen.getByRole("slider", { name: /reward a/i })
    ).toBeInTheDocument();
  });

  it("renders temperature slider", () => {
    render(<RewardMargin />);
    expect(
      screen.getByRole("slider", { name: /temperature/i })
    ).toBeInTheDocument();
  });
});
