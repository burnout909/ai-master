import { useState } from "react";
import { MCQuiz, type MCQuestion } from "./MCQuiz";

type Props = {
  questions: MCQuestion[];
  onPass?: () => void;
};

export function RetrievalCheck({ questions, onPass }: Props) {
  const [correctSet, setCorrectSet] = useState<Set<number>>(new Set());

  function handleCorrect(i: number) {
    setCorrectSet((prev) => {
      const next = new Set(prev);
      next.add(i);
      if (next.size === questions.length) onPass?.();
      return next;
    });
  }

  return (
    <div className="my-6 p-4 border-2 border-dashed rounded">
      <h3 className="font-semibold mb-2">Retrieval check</h3>
      {questions.map((q, i) => (
        <MCQuiz key={i} question={q} onCorrect={() => handleCorrect(i)} />
      ))}
      <p className="text-sm text-neutral-600 mt-2">
        Answer all {questions.length} correctly to mark this stage mastered.
      </p>
    </div>
  );
}
