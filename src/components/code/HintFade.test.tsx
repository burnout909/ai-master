import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HintFade } from "./HintFade";

describe("<HintFade>", () => {
  it("reveals hints progressively", () => {
    render(<HintFade hints={["h1", "h2", "h3"]} solution={<div>SOL</div>} />);
    expect(screen.queryByText("h1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Hint 1/ }));
    expect(screen.getByText(/h1/)).toBeInTheDocument();
    expect(screen.queryByText("h2")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Show solution/ }));
    expect(screen.getByText("SOL")).toBeInTheDocument();
  });
});
