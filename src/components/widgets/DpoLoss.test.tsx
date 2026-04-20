import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DpoLoss } from "./DpoLoss";

describe("DpoLoss", () => {
  it("renders log-ratio winner slider", () => {
    render(<DpoLoss />);
    expect(screen.getByRole("slider", { name: "log-ratio winner" })).toBeTruthy();
  });

  it("renders beta slider", () => {
    render(<DpoLoss />);
    expect(screen.getByRole("slider", { name: "beta" })).toBeTruthy();
  });
});
