import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FlashMemory } from "./FlashMemory";

describe("<FlashMemory>", () => {
  it("renders sequence length select", () => {
    render(<FlashMemory />);
    expect(screen.getByLabelText(/sequence length/i)).toBeInTheDocument();
  });

  it("renders tile size select", () => {
    render(<FlashMemory />);
    expect(screen.getByLabelText(/tile size/i)).toBeInTheDocument();
  });
});
