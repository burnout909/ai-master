import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PredictThenReveal } from "./PredictThenReveal";

describe("<PredictThenReveal>", () => {
  it("hides revealed content until user attempts", () => {
    render(
      <PredictThenReveal predictPrompt="Guess?">
        <div>answer</div>
      </PredictThenReveal>,
    );
    expect(screen.queryByText("answer")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reveal/i })).toBeDisabled();
  });

  it("enables reveal after user types a prediction", () => {
    render(
      <PredictThenReveal predictPrompt="Guess?">
        <div>answer</div>
      </PredictThenReveal>,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "my guess" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(screen.getByRole("button", { name: /reveal/i })).not.toBeDisabled();
  });

  it("shows revealed content after clicking reveal", () => {
    render(
      <PredictThenReveal predictPrompt="Guess?">
        <div>answer</div>
      </PredictThenReveal>,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    fireEvent.click(screen.getByRole("button", { name: /reveal/i }));
    expect(screen.getByText("answer")).toBeInTheDocument();
  });

  it("records skip when skip button clicked", () => {
    const onSkip = vi.fn();
    render(
      <PredictThenReveal predictPrompt="Guess?" onSkip={onSkip}>
        <div>answer</div>
      </PredictThenReveal>,
    );
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(onSkip).toHaveBeenCalledOnce();
    expect(screen.getByText("answer")).toBeInTheDocument();
  });
});
