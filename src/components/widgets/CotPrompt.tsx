import { useState } from "react";

type Problem = "apples" | "buses" | "coins";

interface ProblemData {
  text: string;
  direct_answer: string;
  cot_reasoning: string;
}

const PROBLEMS: Record<Problem, ProblemData> = {
  apples: {
    text: "Emma has 3 baskets with 7 apples each. She gives away 5 apples. How many left?",
    direct_answer: "25",
    cot_reasoning: "3 × 7 = 21 apples. Give away 5 → 21 - 5 = 16. Answer: 16",
  },
  buses: {
    text: "A bus holds 42 people. 3 buses are 3/4 full. How many people total?",
    direct_answer: "126",
    cot_reasoning:
      "42 × 3/4 = 31.5 per bus. 31.5 × 3 = 94.5. Round → 94 people.",
  },
  coins: {
    text: "Mia has 12 coins, twice as many dimes as nickels, rest quarters. What is the dollar value?",
    direct_answer: "$1.20",
    cot_reasoning:
      "Let n = nickels; 2n = dimes. Total coins: n + 2n + q = 12, so q = 12 - 3n. Try n=1: 1 nickel + 2 dimes + 9 quarters = 0.05 + 0.20 + 2.25 = $2.50. Try n=2: 2 nickels + 4 dimes + 6 quarters = 0.10 + 0.40 + 1.50 = $2.00. Answer depends on interpretation but shows why reasoning helps: $2.00 for n=2.",
  },
};

const PROBLEM_OPTIONS: Problem[] = ["apples", "buses", "coins"];

export function CotPrompt() {
  const [problem, setProblem] = useState<Problem>("apples");
  const [cot, setCot] = useState(false);

  const data = PROBLEMS[problem];

  return (
    <div className="my-4 p-4 border rounded-lg space-y-4">
      <div className="flex flex-wrap gap-6 items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Problem:</span>
          <select
            aria-label="problem"
            value={problem}
            onChange={(e) => setProblem(e.target.value as Problem)}
            className="border rounded px-2 py-1 text-sm"
          >
            {PROBLEM_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            aria-label="Chain-of-Thought"
            checked={cot}
            onChange={(e) => setCot(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Chain-of-Thought</span>
        </label>
      </div>

      <div className="rounded p-3 bg-gray-100 text-sm text-gray-800">
        {data.text}
      </div>

      {cot ? (
        <div className="rounded p-3 border-2 border-blue-400 bg-blue-50 text-sm text-blue-900">
          <span className="font-semibold">Reasoning: </span>
          {data.cot_reasoning}
        </div>
      ) : (
        <div className="rounded p-3 border-2 border-red-400 bg-red-50 text-sm text-red-900">
          <span className="font-semibold">Direct answer: </span>
          {data.direct_answer}
        </div>
      )}
    </div>
  );
}
