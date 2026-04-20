import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LineReorder } from "./LineReorder";

describe("<LineReorder>", () => {
  it("renders the lines with move-up buttons", () => {
    render(
      <LineReorder lines={["A", "B", "C"]} />,
    );
    const ups = screen.getAllByRole("button", { name: /move up/i });
    expect(ups.length).toBeGreaterThan(0);
  });
});
