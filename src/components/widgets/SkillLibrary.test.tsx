import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SkillLibrary from "./SkillLibrary";

describe("SkillLibrary", () => {
  it("renders episode slider", () => {
    render(<SkillLibrary />);
    const slider = screen.getByRole("slider", { name: /episode/i });
    expect(slider).toBeDefined();
  });

  it("Show dependencies checkbox toggles state", () => {
    render(<SkillLibrary />);
    const checkbox = screen.getByRole("checkbox", { name: /show dependencies/i });
    expect((checkbox as HTMLInputElement).checked).toBe(false);
    fireEvent.click(checkbox);
    expect((checkbox as HTMLInputElement).checked).toBe(true);
    fireEvent.click(checkbox);
    expect((checkbox as HTMLInputElement).checked).toBe(false);
  });
});
