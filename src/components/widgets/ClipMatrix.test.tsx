import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ClipMatrix from "./ClipMatrix";

describe("ClipMatrix", () => {
  it("renders temperature slider", () => {
    render(<ClipMatrix />);
    expect(screen.getByRole("slider", { name: /temperature/i })).toBeTruthy();
  });

  it("renders two radio options (image → text, text → image)", () => {
    render(<ClipMatrix />);
    const group = screen.getByRole("radiogroup", { name: /direction/i });
    expect(group).toBeTruthy();
    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/image.*text/i)).toBeTruthy();
    expect(screen.getByText(/text.*image/i)).toBeTruthy();
  });
});
