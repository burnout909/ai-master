import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PatchGrid } from "./PatchGrid";

describe("<PatchGrid>", () => {
  it("renders the patch size select with 3 options", () => {
    render(<PatchGrid />);
    const select = screen.getByRole("combobox", { name: /patch size/i });
    expect(select).toBeInTheDocument();
    const options = Array.from((select as HTMLSelectElement).options);
    expect(options.map((o) => o.value)).toEqual(["2", "4", "8"]);
  });

  it("renders the image size select with 3 options", () => {
    render(<PatchGrid />);
    const select = screen.getByRole("combobox", { name: /image size/i });
    expect(select).toBeInTheDocument();
    const options = Array.from((select as HTMLSelectElement).options);
    expect(options.map((o) => o.value)).toEqual(["8", "16", "32"]);
  });
});
