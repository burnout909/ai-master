import type { ReactNode } from "react";
import { MCQuiz, type MCQuestion } from "../stages/MCQuiz";

type Props = {
  question: MCQuestion;
  revealContent: ReactNode;
};

export function DerivationStep({ question, revealContent }: Props) {
  return (
    <div className="border-l-4 border-blue-300 pl-3 my-4">
      <MCQuiz question={question} />
      <details className="mt-2">
        <summary className="cursor-pointer text-sm underline">Show next line</summary>
        <div className="mt-2">{revealContent}</div>
      </details>
    </div>
  );
}
