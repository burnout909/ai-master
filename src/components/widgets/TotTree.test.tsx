import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TotTree } from "./TotTree";

describe("<TotTree>", () => {
  it("renders strategy select", () => {
    render(<TotTree />);
    expect(screen.getByRole("combobox", { name: /strategy/i })).toBeInTheDocument();
  });

  it("renders step slider", () => {
    render(<TotTree />);
    expect(screen.getByRole("slider", { name: /step/i })).toBeInTheDocument();
  });
});
