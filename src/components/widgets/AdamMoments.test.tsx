import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdamMoments } from "./AdamMoments";

describe("<AdamMoments>", () => {
  it("renders beta 1 slider", () => {
    render(<AdamMoments />);
    expect(
      screen.getByRole("slider", { name: /beta 1/i })
    ).toBeInTheDocument();
  });

  it("bias-correction toggle changes the displayed m-hat value", () => {
    render(<AdamMoments />);
    const toggle = screen.getByLabelText(/bias correction/i);
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
  });
});
