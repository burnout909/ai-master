import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FlowField } from "./FlowField";

describe("<FlowField>", () => {
  it("renders time slider", () => {
    render(<FlowField />);
    expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
  });

  it("renders target mode select", () => {
    render(<FlowField />);
    expect(screen.getByLabelText(/target mode/i)).toBeInTheDocument();
  });
});
