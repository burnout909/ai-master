import { useState } from "react";

type Props = {
  answer: string;
  placeholder?: string;
  onCorrect?: () => void;
};

export function FillBlank({ answer, placeholder = "…", onCorrect }: Props) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "right" | "wrong">("idle");

  const check = () => {
    const ok = value.trim().toLowerCase() === answer.trim().toLowerCase();
    setState(ok ? "right" : "wrong");
    if (ok) onCorrect?.();
  };

  const color =
    state === "right" ? "border-green-500" : state === "wrong" ? "border-red-500" : "border-neutral-400";

  return (
    <input
      type="text"
      className={`inline-block mx-1 px-2 py-0.5 border-b-2 bg-transparent ${color}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={check}
      onKeyDown={(e) => e.key === "Enter" && check()}
    />
  );
}
