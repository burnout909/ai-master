import type { PaperSlug, SrsCard } from "./types";
import { updateStore, loadStore } from "./storage";

export type Rating = "Again" | "Hard" | "Good" | "Easy";

const DAY_MS = 86_400_000;

function addDays(date: Date, days: number): string {
  return new Date(date.getTime() + days * DAY_MS).toISOString();
}

export function enqueueCard(
  seed: Omit<SrsCard, "ease" | "interval" | "due">,
): void {
  updateStore((s) => {
    if (s.srs.cards.some((c) => c.id === seed.id)) return s;
    const card: SrsCard = {
      ...seed,
      ease: 2.5,
      interval: 0,
      due: new Date().toISOString(),
    };
    return { ...s, srs: { ...s.srs, cards: [...s.srs.cards, card] } };
  });
}

export function dueCards(now: Date = new Date()): SrsCard[] {
  const nowIso = now.toISOString();
  return loadStore().srs.cards.filter((c) => c.due <= nowIso);
}

export function reviewCard(id: string, rating: Rating, now: Date = new Date()): void {
  updateStore((s) => {
    const idx = s.srs.cards.findIndex((c) => c.id === id);
    if (idx < 0) return s;
    const card = s.srs.cards[idx];
    const next = scheduleNext(card, rating, now);
    const cards = [...s.srs.cards];
    cards[idx] = next;
    return { ...s, srs: { ...s.srs, cards, lastReview: now.toISOString() } };
  });
}

function scheduleNext(card: SrsCard, rating: Rating, now: Date): SrsCard {
  let { ease, interval } = card;
  if (rating === "Again") {
    ease = Math.max(1.3, ease - 0.2);
    interval = 1;
  } else if (rating === "Hard") {
    ease = Math.max(1.3, ease - 0.15);
    interval = Math.max(1, Math.round(interval * 1.2));
  } else if (rating === "Good") {
    interval = interval === 0 ? 1 : Math.round(interval * ease);
  } else {
    ease = ease + 0.15;
    interval = interval === 0 ? 4 : Math.round(interval * ease * 1.3);
  }
  return { ...card, ease, interval, due: addDays(now, interval) };
}
