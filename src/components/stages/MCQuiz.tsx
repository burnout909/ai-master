import { useState } from "react";

export type MCOption = { text: string; correct: boolean; explain: string };
export type MCQuestion = { prompt: string; options: MCOption[] };

type Props = {
  question: MCQuestion;
  onCorrect?: () => void;
  onWrong?: () => void;
};

export function MCQuiz({ question, onCorrect, onWrong }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const handle = (i: number) => {
    setSelected(i);
    const opt = question.options[i];
    if (opt.correct) onCorrect?.();
    else onWrong?.();
  };

  return (
    <fieldset className="border rounded-lg p-4 my-4">
      <legend className="font-medium">{question.prompt}</legend>
      {question.options.map((opt, i) => (
        <label
          key={i}
          className={`block p-2 my-1 rounded cursor-pointer ${
            selected === i
              ? opt.correct
                ? "bg-green-100"
                : "bg-red-100"
              : "hover:bg-neutral-100"
          }`}
        >
          <input
            type="radio"
            name={question.prompt}
            className="mr-2"
            onChange={() => handle(i)}
            checked={selected === i}
          />
          {opt.text}
        </label>
      ))}
      {selected !== null && (
        <p className="mt-2 text-sm italic">{question.options[selected].explain}</p>
      )}
    </fieldset>
  );
}
