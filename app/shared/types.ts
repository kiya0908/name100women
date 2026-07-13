export const GUESS_STATUSES = [
  "ACCEPTED",
  "DUPLICATE",
  "NOT_FOUND",
  "NOT_A_PERSON",
  "NOT_A_WOMAN",
  "FICTIONAL",
  "AMBIGUOUS",
  "TEMPORARY_ERROR",
  "INVALID_REQUEST",
  "RATE_LIMITED",
  "SESSION_NOT_FOUND",
  "GAME_FINISHED",
] as const;

export type GuessStatus = (typeof GUESS_STATUSES)[number];

export const SESSION_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "gave_up",
  "abandoned",
] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export interface SessionSnapshot {
  id: string;
  status: SessionStatus;
  correctCount: number;
  rejectedCount: number;
  duplicateCount: number;
  temporaryErrorCount: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  durationMs: number | null;
  serverNow: string;
}

export interface PersonSnapshot {
  qid: string;
  canonicalName: string;
  description: string | null;
  wikipediaUrl: string | null;
}

export interface GuessResponse {
  status: GuessStatus;
  message: string;
  person?: PersonSnapshot;
  session?: SessionSnapshot;
  sequenceNumber?: number;
}

export interface ExternalCallTelemetry {
  provider: "wikipedia" | "wikidata";
  operation: string;
  success: boolean;
  statusCode: number | null;
  durationMs: number;
  errorCode: string | null;
  requestedAt: string;
}

export interface ValidationResolution {
  status: GuessStatus;
  failureReason: string | null;
  person: PersonSnapshot | null;
  aliases: string[];
  sourceUsed: "override" | "kv" | "d1" | "wikipedia_wikidata" | "none";
  cacheHit: boolean;
  cacheLayer: "kv" | "d1" | null;
  telemetry: ExternalCallTelemetry[];
  overrideId?: string | null;
}
