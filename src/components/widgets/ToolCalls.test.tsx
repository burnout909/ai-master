import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ToolCalls } from "./ToolCalls";

describe("<ToolCalls>", () => {
  it("renders sentence select", () => {
    render(<ToolCalls />);
    expect(screen.getByRole("combobox", { name: /sentence/i })).toBeTruthy();
  });

  it("renders tool select", () => {
    render(<ToolCalls />);
    expect(screen.getByRole("combobox", { name: /tool/i })).toBeTruthy();
  });
});
