import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AttentionMatrix } from "./AttentionMatrix";

describe("<AttentionMatrix>", () => {
  it("renders tokens and a d_k slider", () => {
    render(<AttentionMatrix />);
    expect(screen.getAllByText(/the/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("slider", { name: /d_k/i })).toBeInTheDocument();
  });

  it("toggles √d_k scaling", () => {
    render(<AttentionMatrix />);
    const toggle = screen.getByLabelText(/scale by √d_k/i);
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
  });
});
