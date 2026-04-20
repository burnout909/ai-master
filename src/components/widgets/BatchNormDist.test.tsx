import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BatchNormDist } from "./BatchNormDist";

describe("<BatchNormDist>", () => {
  it("renders the layer depth slider", () => {
    render(<BatchNormDist />);
    expect(
      screen.getByRole("slider", { name: /layer depth/i })
    ).toBeInTheDocument();
  });

  it("renders the batch size slider", () => {
    render(<BatchNormDist />);
    expect(
      screen.getByRole("slider", { name: /batch size/i })
    ).toBeInTheDocument();
  });

  it("renders the Apply BatchNorm checkbox unchecked by default", () => {
    render(<BatchNormDist />);
    const checkbox = screen.getByRole("checkbox", { name: /apply batchnorm/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("Apply BatchNorm checkbox toggles state", () => {
    render(<BatchNormDist />);
    const checkbox = screen.getByRole("checkbox", { name: /apply batchnorm/i });
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("displays mean and variance labels", () => {
    render(<BatchNormDist />);
    expect(screen.getByText(/mean/i)).toBeInTheDocument();
    expect(screen.getByText(/variance/i)).toBeInTheDocument();
  });

  it("layer depth slider has min=1, max=10", () => {
    render(<BatchNormDist />);
    const slider = screen.getByRole("slider", { name: /layer depth/i });
    expect(slider).toHaveAttribute("min", "1");
    expect(slider).toHaveAttribute("max", "10");
  });

  it("batch size slider has min=4, max=64, step=4", () => {
    render(<BatchNormDist />);
    const slider = screen.getByRole("slider", { name: /batch size/i });
    expect(slider).toHaveAttribute("min", "4");
    expect(slider).toHaveAttribute("max", "64");
    expect(slider).toHaveAttribute("step", "4");
  });

  it("changing layer depth slider updates displayed value", () => {
    render(<BatchNormDist />);
    const slider = screen.getByRole("slider", { name: /layer depth/i });
    fireEvent.change(slider, { target: { value: "5" } });
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders 12 histogram bars", () => {
    render(<BatchNormDist />);
    const bars = screen.getAllByRole("presentation");
    expect(bars).toHaveLength(12);
  });
});
