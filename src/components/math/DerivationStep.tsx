import type { ReactNode } from "react";
import { MCQuiz, type MCQuestion } from "../stages/MCQuiz";
import { MathReact } from "./MathReact";

type Props = {
  question: MCQuestion;
  revealContent?: ReactNode;
  revealExpr?: string;
};

export function DerivationStep({ question, revealContent, revealExpr }: Props) {
  const reveal = revealExpr
    ? <MathReact display expr={revealExpr} />
    : revealContent;
  return (
    <div className="border-l-4 border-blue-300 pl-3 my-4">
      <MCQuiz question={question} />
      <details className="mt-2">
        <summary className="cursor-pointer text-sm underline">Show next line</summary>
        <div className="mt-2">{reveal}</div>
      </details>
    </div>
  );
}
