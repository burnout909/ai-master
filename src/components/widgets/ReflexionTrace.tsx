import { useState } from "react";

type ShowMode = "action only" | "action + reward" | "action + reward + reflection";

interface Trial {
  action: string;
  reward: string;
  reflection: string;
  success: boolean;
}

const TRIALS: Trial[] = [
  {
    action: "Down, Right, Down, Right, Down, Right",
    reward: "-6 (blocked at (2,2))",
    reflection: "The wall at (2,2) blocked me. Next time I should try going around it.",
    success: false,
  },
  {
    action: "Right, Right, Right, Down, Down, Down",
    reward: "-6 (hits wall at (2,2))",
    reflection: "The wall is at (2,2). I need to go up or around before descending.",
    success: false,
  },
  {
    action: "Right, Right, Down, Down, Right, Down",
    reward: "-6 success (reaches goal)",
    reflection: "Great — going right first avoids the wall.",
    success: true,
  },
  {
    action: "Down, Right, Right, Right, Down, Down",
    reward: "-6 success",
    reflection: "Symmetric path also works.",
    success: true,
  },
  {
    action: "Right, Right, Right, Down, Right, Down, Down",
    reward: "-7 (longer)",
    reflection: "Path length 7 is worse than 6 — prefer shorter paths.",
    success: false,
  },
];

export function ReflexionTrace() {
  const [trialIndex, setTrialIndex] = useState(0);
  const [show, setShow] = useState<ShowMode>("action only");

  const trial = TRIALS[trialIndex];
  const trialNumber = trialIndex + 1;

  const successCount = TRIALS.slice(0, trialNumber).filter((t) => t.success).length;

  function handleNextTrial() {
    setTrialIndex((i) => (i + 1) % TRIALS.length);
  }

  return (
    <div className="my-4 p-4 border rounded-lg space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Show
          <select
            aria-label="show"
            value={show}
            onChange={(e) => setShow(e.target.value as ShowMode)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="action only">action only</option>
            <option value="action + reward">action + reward</option>
            <option value="action + reward + reflection">action + reward + reflection</option>
          </select>
        </label>

        <button
          className="px-4 py-1.5 border rounded text-sm self-end"
          onClick={handleNextTrial}
        >
          Next trial
        </button>
      </div>

      <p className="font-bold text-sm">
        Trial {trialNumber} of {TRIALS.length}
      </p>

      <div className="space-y-2">
        <div className="text-sm">
          <span className="font-semibold">Action: </span>
          {trial.action}
        </div>

        {(show === "action + reward" || show === "action + reward + reflection") && (
          <div className="text-sm">
            <span className="font-semibold">Reward: </span>
            {trial.reward}
          </div>
        )}

        {show === "action + reward + reflection" && (
          <div className="border-l-4 border-blue-400 pl-3 italic text-sm text-blue-700">
            {trial.reflection}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {successCount} of {trialNumber} trial{trialNumber !== 1 ? "s" : ""} reached goal
      </p>
    </div>
  );
}
