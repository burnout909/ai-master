import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReflexionTrace } from "./ReflexionTrace";

describe("<ReflexionTrace>", () => {
  it("renders show select", () => {
    render(<ReflexionTrace />);
    expect(screen.getByLabelText("show")).toBeInTheDocument();
  });

  it("clicking Next trial advances from trial 1 to trial 2", () => {
    render(<ReflexionTrace />);
    expect(screen.getByText(/Trial 1 of 5/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next trial/i }));
    expect(screen.getByText(/Trial 2 of 5/i)).toBeInTheDocument();
  });
});
