import { useRef, useState } from "react";
import { MCQuiz, type MCQuestion } from "./MCQuiz";
import { enqueueCard } from "../../lib/srs";

type Props = {
  questions: MCQuestion[];
  onPass?: () => void;
};

export function RetrievalCheck({ questions, onPass }: Props) {
  const [correctSet, setCorrectSet] = useState<Set<number>>(new Set());
  const elRef = useRef<HTMLDivElement>(null);

  function handleCorrect(i: number) {
    setCorrectSet((prev) => {
      const next = new Set(prev);
      next.add(i);
      if (next.size === questions.length) {
        const section = elRef.current?.closest("section");
        section?.querySelectorAll<HTMLElement>("[data-srs-card]").forEach((card) => {
          enqueueCard({
            id: card.dataset.id!,
            paperSlug: card.dataset.paper!,
            prompt: card.dataset.prompt!,
            answer: card.dataset.answer!,
          });
        });
        onPass?.();
      }
      return next;
    });
  }

  return (
    <div ref={elRef} className="my-6 p-4 border-2 border-dashed rounded">
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
