import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FillBlank } from "./FillBlank";

describe("<FillBlank>", () => {
  it("is wrong until correct answer typed (case-insensitive, trimmed)", () => {
    const onCorrect = vi.fn();
    render(<FillBlank answer="softmax" onCorrect={onCorrect} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "sigmoid" } });
    fireEvent.blur(input);
    expect(onCorrect).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "  SoftMax " } });
    fireEvent.blur(input);
    expect(onCorrect).toHaveBeenCalledOnce();
  });
});
