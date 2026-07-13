import { GAME_TARGET } from "./constants";
import type { SessionStatus } from "./types";

export interface AcceptedTransition {
  nextCount: number;
  startedAt: string;
  status: SessionStatus;
  endedAt: string | null;
  durationMs: number | null;
}

export function calculateAcceptedTransition(
  session: {
    correctCount: number;
    startedAt: string | null;
  },
  now: string,
): AcceptedTransition {
  const nextCount = Math.min(GAME_TARGET, session.correctCount + 1);
  const startedAt = session.startedAt ?? now;
  const completed = nextCount >= GAME_TARGET;

  return {
    nextCount,
    startedAt,
    status: completed ? "completed" : "in_progress",
    endedAt: completed ? now : null,
    durationMs: completed
      ? Math.max(0, Date.parse(now) - Date.parse(startedAt))
      : null,
  };
}
