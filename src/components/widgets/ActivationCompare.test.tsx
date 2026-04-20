import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ActivationCompare } from "./ActivationCompare";

describe("<ActivationCompare>", () => {
  it("renders an activation-function dropdown with ReLU, Tanh, Sigmoid options", () => {
    render(<ActivationCompare />);
    const select = screen.getByRole("combobox", { name: /activation/i });
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /relu/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /tanh/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /sigmoid/i })).toBeInTheDocument();
  });

  it("toggling the dropdown changes the displayed function name", () => {
    render(<ActivationCompare />);
    const select = screen.getByRole("combobox", { name: /activation/i });
    // Default value is relu
    expect(select).toHaveValue("relu");
    // Switch to Tanh — the SVG aria-label and the label span should update
    fireEvent.change(select, { target: { value: "tanh" } });
    expect(select).toHaveValue("tanh");
    // The highlighted label span now shows "Tanh"
    expect(screen.getByText("Tanh", { selector: "span" })).toBeInTheDocument();
  });
});
