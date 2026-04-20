import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LatentVsPixel } from "./LatentVsPixel";

describe("<LatentVsPixel>", () => {
  it("renders resolution select", () => {
    render(<LatentVsPixel />);
    expect(screen.getByLabelText(/resolution/i)).toBeInTheDocument();
  });

  it("renders downsample factor slider", () => {
    render(<LatentVsPixel />);
    expect(screen.getByLabelText(/downsample factor/i)).toBeInTheDocument();
  });
});
