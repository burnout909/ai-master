import { useState, type ReactNode } from "react";

type Props = {
  predictPrompt: string;
  children: ReactNode;
  onAttempt?: (prediction: string) => void;
  onReveal?: () => void;
  onSkip?: () => void;
};

export function PredictThenReveal({
  predictPrompt,
  children,
  onAttempt,
  onReveal,
  onSkip,
}: Props) {
  const [prediction, setPrediction] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-lg border border-neutral-300 p-4 my-4 bg-neutral-50">
      <p className="font-medium mb-2">{predictPrompt}</p>
      {!attempted && (
        <>
          <textarea
            className="w-full border rounded p-2"
            rows={2}
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
            placeholder="Type your prediction…"
          />
          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40"
              disabled={prediction.trim().length === 0}
              onClick={() => {
                setAttempted(true);
                onAttempt?.(prediction);
              }}
            >
              Submit
            </button>
            <button
              className="px-3 py-1 border rounded"
              onClick={() => {
                setAttempted(true);
                setRevealed(true);
                onSkip?.();
              }}
            >
              Skip
            </button>
          </div>
        </>
      )}
      {attempted && !revealed && (
        <div>
          <p className="text-sm italic mb-2">Your prediction: {prediction}</p>
          <button
            className="px-3 py-1 bg-green-600 text-white rounded"
            onClick={() => {
              setRevealed(true);
              onReveal?.();
            }}
          >
            Reveal
          </button>
        </div>
      )}
      {revealed && <div className="mt-3">{children}</div>}
      {!attempted && (
        <button
          disabled
          className="mt-2 text-sm text-neutral-400"
          aria-label="reveal (disabled)"
        >
          Reveal (disabled until you attempt)
        </button>
      )}
    </div>
  );
}
