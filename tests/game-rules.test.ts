import { describe, expect, it } from "vitest";

import { calculateAcceptedTransition } from "../app/shared/game-rules";

describe("calculateAcceptedTransition", () => {
  it("starts the timer on the first accepted answer", () => {
    const now = "2026-07-13T10:00:00.000Z";
    expect(
      calculateAcceptedTransition(
        { correctCount: 0, startedAt: null },
        now,
      ),
    ).toEqual({
      nextCount: 1,
      startedAt: now,
      status: "in_progress",
      endedAt: null,
      durationMs: null,
    });
  });

  it("does not reset an existing timer", () => {
    const startedAt = "2026-07-13T10:00:00.000Z";
    const now = "2026-07-13T10:01:00.000Z";
    const transition = calculateAcceptedTransition(
      { correctCount: 10, startedAt },
      now,
    );
    expect(transition.startedAt).toBe(startedAt);
    expect(transition.status).toBe("in_progress");
  });

  it("automatically completes at 100", () => {
    const startedAt = "2026-07-13T10:00:00.000Z";
    const now = "2026-07-13T10:02:03.000Z";
    expect(
      calculateAcceptedTransition(
        { correctCount: 99, startedAt },
        now,
      ),
    ).toEqual({
      nextCount: 100,
      startedAt,
      status: "completed",
      endedAt: now,
      durationMs: 123_000,
    });
  });
});
