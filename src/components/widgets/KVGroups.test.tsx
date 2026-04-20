import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { KVGroups } from "./KVGroups";

describe("<KVGroups>", () => {
  it("renders query heads slider", () => {
    render(<KVGroups />);
    expect(screen.getByLabelText(/query heads/i)).toBeInTheDocument();
  });

  it("renders kv groups slider", () => {
    render(<KVGroups />);
    expect(screen.getByLabelText(/kv groups/i)).toBeInTheDocument();
  });
});
