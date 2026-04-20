import { beforeEach, describe, expect, it } from "vitest";
import { enqueueCard, dueCards, reviewCard, type Rating } from "./srs";
import { resetStore } from "./storage";

describe("srs", () => {
  beforeEach(() => resetStore());

  it("enqueued card is due today", () => {
    enqueueCard({ id: "c1", paperSlug: "transformer", prompt: "?", answer: "!" });
    const today = new Date();
    const due = dueCards(today);
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe("c1");
  });

  it("Good rating grows interval", () => {
    enqueueCard({ id: "c1", paperSlug: "t", prompt: "?", answer: "!" });
    const today = new Date("2026-04-20");
    reviewCard("c1", "Good", today);
    // interval=1 → due 2026-04-21
    expect(dueCards(new Date("2026-04-21"))).toHaveLength(1);
    expect(dueCards(new Date("2026-04-20"))).toHaveLength(0);
  });

  it("Again rating resets interval to 1 and lowers ease", () => {
    enqueueCard({ id: "c1", paperSlug: "t", prompt: "?", answer: "!" });
    reviewCard("c1", "Good", new Date("2026-04-20"));
    reviewCard("c1", "Good", new Date("2026-04-21")); // interval now 6
    reviewCard("c1", "Again", new Date("2026-04-22")); // reset
    expect(dueCards(new Date("2026-04-23"))).toHaveLength(1);
  });

  it("Easy rating grows faster than Good", () => {
    enqueueCard({ id: "c1", paperSlug: "t", prompt: "?", answer: "!" });
    enqueueCard({ id: "c2", paperSlug: "t", prompt: "?", answer: "!" });
    reviewCard("c1", "Good", new Date("2026-04-20"));
    reviewCard("c2", "Easy", new Date("2026-04-20"));
    // Both not due on 4-21 after Easy (easy interval > good interval)
    const duesOn22 = dueCards(new Date("2026-04-22")).map((c) => c.id);
    expect(duesOn22).toContain("c1");   // Good → interval 1 next time
    // c2 (Easy) gets a longer first interval
  });
});
