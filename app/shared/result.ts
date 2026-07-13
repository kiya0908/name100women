import { GAME_TARGET, SITE_URL } from "./constants";
import type { SessionStatus } from "./types";

export function buildShareText(
  status: SessionStatus,
  correctCount: number,
  durationMs: number | null,
): string {
  const result =
    status === "completed"
      ? `I named ${GAME_TARGET} women`
      : `I named ${correctCount} of ${GAME_TARGET} women`;
  const time = durationMs === null ? "" : ` in ${formatDuration(durationMs)}`;

  return `${result}${time}. Can you name 100 women? ${SITE_URL}`;
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
