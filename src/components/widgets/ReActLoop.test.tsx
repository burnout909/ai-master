import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReActLoop } from "./ReActLoop";

describe("<ReActLoop>", () => {
  it("advances trace when Step is clicked", () => {
    render(<ReActLoop />);
    const initialCount = screen.queryAllByRole("listitem").length;
    fireEvent.click(screen.getByRole("button", { name: /step/i }));
    expect(screen.queryAllByRole("listitem").length).toBeGreaterThan(initialCount);
  });

  it("mode toggle switches strategy", () => {
    render(<ReActLoop />);
    fireEvent.click(screen.getByLabelText(/ReAct/));
    expect(screen.getByLabelText(/ReAct/)).toBeChecked();
  });
});
