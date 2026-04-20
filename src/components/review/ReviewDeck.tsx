import { useEffect, useState } from "react";
import { dueCards, reviewCard, type Rating } from "../../lib/srs";
import type { SrsCard } from "../../lib/types";

export function ReviewDeck() {
  const [queue, setQueue] = useState<SrsCard[]>([]);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { setQueue(dueCards()); }, []);

  if (queue.length === 0) {
    return <p className="text-neutral-600">No cards due today ✓</p>;
  }
  if (i >= queue.length) {
    return <p className="text-green-700">Done for today — {queue.length} reviewed.</p>;
  }

  const card = queue[i];

  function rate(r: Rating) {
    reviewCard(card.id, r);
    setRevealed(false);
    setI((x) => x + 1);
  }

  return (
    <div className="my-4 max-w-xl">
      <p className="text-sm text-neutral-500">Card {i + 1} / {queue.length} · {card.paperSlug}</p>
      <div className="my-4 p-4 border rounded-lg">
        <p className="font-semibold">{card.prompt}</p>
        {revealed ? (
          <>
            <p className="mt-3 p-2 bg-neutral-50 rounded">{card.answer}</p>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1 border rounded bg-red-50" onClick={() => rate("Again")}>Again</button>
              <button className="px-3 py-1 border rounded bg-yellow-50" onClick={() => rate("Hard")}>Hard</button>
              <button className="px-3 py-1 border rounded bg-blue-50" onClick={() => rate("Good")}>Good</button>
              <button className="px-3 py-1 border rounded bg-green-50" onClick={() => rate("Easy")}>Easy</button>
            </div>
          </>
        ) : (
          <button className="mt-3 px-3 py-1 bg-blue-600 text-white rounded" onClick={() => setRevealed(true)}>
            Show answer
          </button>
        )}
      </div>
    </div>
  );
}
