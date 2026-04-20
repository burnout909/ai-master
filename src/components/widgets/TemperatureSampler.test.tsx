import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TemperatureSampler } from "./TemperatureSampler";

describe("<TemperatureSampler>", () => {
  it("renders temperature slider", () => {
    render(<TemperatureSampler />);
    expect(screen.getByRole("slider", { name: /temperature/i })).toBeInTheDocument();
  });

  it("renders top k slider", () => {
    render(<TemperatureSampler />);
    expect(screen.getByRole("slider", { name: /top k/i })).toBeInTheDocument();
  });
});
