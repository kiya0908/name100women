import { eq } from "drizzle-orm";

import { calculateAcceptedTransition } from "~/shared/game-rules";
import type {
  GuessStatus,
  SessionSnapshot,
  SessionStatus,
} from "~/shared/types";

import { createDb } from "../db/client";
import {
  gameSessions,
  type GameSessionRow,
} from "../db/schema";

export interface CreateSessionInput {
  id: string;
  anonymousVisitorId: string | null;
  countryCode: string | null;
  deviceType: string;
  referrer: string | null;
  landingPath: string;
  userAgentFamily: string;
  ipHash: string | null;
  now: string;
}

export interface RecordGuessInput {
  guessId: string;
  session: GameSessionRow;
  rawInput: string;
  normalizedInput: string;
  status: GuessStatus;
  failureReason: string | null;
  personQid: string | null;
  canonicalName: string | null;
  description: string | null;
  responseTimeMs: number;
  cacheHit: boolean;
  cacheLayer: "kv" | "d1" | null;
  sourceUsed: string;
  overrideId?: string | null;
  now: string;
}

export interface RecordGuessResult {
  sequenceNumber: number;
  session: SessionSnapshot;
  status: GuessStatus;
}

export class GameRepository {
  private readonly db;

  constructor(private readonly database: D1Database) {
    this.db = createDb(database);
  }

  async createSession(input: CreateSessionInput): Promise<GameSessionRow> {
    await this.db.insert(gameSessions).values({
      id: input.id,
      anonymousVisitorId: input.anonymousVisitorId,
      status: "not_started",
      createdAt: input.now,
      startedAt: null,
      endedAt: null,
      durationMs: null,
      correctCount: 0,
      rejectedCount: 0,
      duplicateCount: 0,
      temporaryErrorCount: 0,
      countryCode: input.countryCode,
      deviceType: input.deviceType,
      referrer: input.referrer,
      landingPath: input.landingPath,
      userAgentFamily: input.userAgentFamily,
      ipHash: input.ipHash,
      lastActivityAt: input.now,
      createdAtDb: input.now,
      updatedAt: input.now,
    });

    const created = await this.getSession(input.id);
    if (!created) {
      throw new Error("SESSION_CREATE_FAILED");
    }
    return created;
  }

  async getSession(sessionId: string): Promise<GameSessionRow | null> {
    return (
      await this.db
        .select()
        .from(gameSessions)
        .where(eq(gameSessions.id, sessionId))
        .limit(1)
    )[0] ?? null;
  }

  async hasAcceptedPerson(sessionId: string, qid: string): Promise<boolean> {
    const row = await this.database
      .prepare(
        `SELECT 1 AS found
         FROM game_guesses
         WHERE game_session_id = ?
           AND person_qid = ?
           AND status = 'ACCEPTED'
         LIMIT 1`,
      )
      .bind(sessionId, qid)
      .first<{ found: number }>();

    return row?.found === 1;
  }

  async recordGuess(input: RecordGuessInput): Promise<RecordGuessResult> {
    if (input.status === "ACCEPTED" && input.personQid) {
      try {
        return await this.recordAccepted(input);
      } catch (error) {
        if (isAcceptedDuplicateConstraint(error)) {
          return this.recordNonAccepted({
            ...input,
            status: "DUPLICATE",
            failureReason: "QID_ALREADY_ACCEPTED",
          });
        }
        throw error;
      }
    }

    return this.recordNonAccepted(input);
  }

  async endSession(
    session: GameSessionRow,
    reason: "gave_up" | "abandoned",
    now: string,
  ): Promise<SessionSnapshot> {
    if (isTerminalStatus(session.status)) {
      return toSessionSnapshot(session, now);
    }

    const durationMs = session.startedAt
      ? Math.max(0, Date.parse(now) - Date.parse(session.startedAt))
      : null;

    await this.db
      .update(gameSessions)
      .set({
        status: reason,
        endedAt: now,
        durationMs,
        lastActivityAt: now,
        updatedAt: now,
      })
      .where(eq(gameSessions.id, session.id));

    const updated = await this.getSession(session.id);
    if (!updated) {
      throw new Error("SESSION_END_FAILED");
    }
    return toSessionSnapshot(updated, now);
  }

  private async recordAccepted(
    input: RecordGuessInput,
  ): Promise<RecordGuessResult> {
    const sequenceNumber = await this.nextSequence(input.session.id);
    const transition = calculateAcceptedTransition(input.session, input.now);
    const {
      nextCount,
      startedAt,
      status,
      endedAt,
      durationMs,
    } = transition;

    await this.database.batch([
      this.database
        .prepare(
          `INSERT INTO game_guesses (
            id, game_session_id, sequence_number, raw_input, normalized_input,
            status, failure_reason, person_qid, canonical_name_snapshot,
            description_snapshot, response_time_ms, cache_hit, cache_layer,
            source_used, override_id, submitted_at, created_at
          ) VALUES (?, ?, ?, ?, ?, 'ACCEPTED', NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          input.guessId,
          input.session.id,
          sequenceNumber,
          input.rawInput,
          input.normalizedInput,
          input.personQid,
          input.canonicalName,
          input.description,
          input.responseTimeMs,
          input.cacheHit ? 1 : 0,
          input.cacheLayer,
          input.sourceUsed,
          input.overrideId ?? null,
          input.now,
          input.now,
        ),
      this.database
        .prepare(
          `UPDATE game_sessions
           SET status = ?,
               started_at = ?,
               ended_at = ?,
               duration_ms = ?,
               correct_count = ?,
               last_activity_at = ?,
               updated_at = ?
           WHERE id = ?
             AND status IN ('not_started', 'in_progress')`,
        )
        .bind(
          status,
          startedAt,
          endedAt,
          durationMs,
          nextCount,
          input.now,
          input.now,
          input.session.id,
        ),
    ]);

    const updated = await this.getSession(input.session.id);
    if (!updated) {
      throw new Error("SESSION_UPDATE_FAILED");
    }

    return {
      sequenceNumber,
      session: toSessionSnapshot(updated, input.now),
      status: "ACCEPTED",
    };
  }

  private async recordNonAccepted(
    input: RecordGuessInput,
  ): Promise<RecordGuessResult> {
    const sequenceNumber = await this.nextSequence(input.session.id);
    const rejectedIncrement =
      input.status === "DUPLICATE" || input.status === "TEMPORARY_ERROR" ? 0 : 1;
    const duplicateIncrement = input.status === "DUPLICATE" ? 1 : 0;
    const temporaryIncrement = input.status === "TEMPORARY_ERROR" ? 1 : 0;

    await this.database.batch([
      this.database
        .prepare(
          `INSERT INTO game_guesses (
            id, game_session_id, sequence_number, raw_input, normalized_input,
            status, failure_reason, person_qid, canonical_name_snapshot,
            description_snapshot, response_time_ms, cache_hit, cache_layer,
            source_used, override_id, submitted_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          input.guessId,
          input.session.id,
          sequenceNumber,
          input.rawInput,
          input.normalizedInput,
          input.status,
          input.failureReason,
          input.personQid,
          input.canonicalName,
          input.description,
          input.responseTimeMs,
          input.cacheHit ? 1 : 0,
          input.cacheLayer,
          input.sourceUsed,
          input.overrideId ?? null,
          input.now,
          input.now,
        ),
      this.database
        .prepare(
          `UPDATE game_sessions
           SET rejected_count = rejected_count + ?,
               duplicate_count = duplicate_count + ?,
               temporary_error_count = temporary_error_count + ?,
               last_activity_at = ?,
               updated_at = ?
           WHERE id = ?`,
        )
        .bind(
          rejectedIncrement,
          duplicateIncrement,
          temporaryIncrement,
          input.now,
          input.now,
          input.session.id,
        ),
    ]);

    const updated = await this.getSession(input.session.id);
    if (!updated) {
      throw new Error("SESSION_UPDATE_FAILED");
    }

    return {
      sequenceNumber,
      session: toSessionSnapshot(updated, input.now),
      status: input.status,
    };
  }

  private async nextSequence(sessionId: string): Promise<number> {
    const row = await this.database
      .prepare(
        `SELECT COALESCE(MAX(sequence_number), 0) + 1 AS next_sequence
         FROM game_guesses
         WHERE game_session_id = ?`,
      )
      .bind(sessionId)
      .first<{ next_sequence: number }>();

    return row?.next_sequence ?? 1;
  }
}

export function toSessionSnapshot(
  session: GameSessionRow,
  serverNow = new Date().toISOString(),
): SessionSnapshot {
  return {
    id: session.id,
    status: session.status as SessionStatus,
    correctCount: session.correctCount,
    rejectedCount: session.rejectedCount,
    duplicateCount: session.duplicateCount,
    temporaryErrorCount: session.temporaryErrorCount,
    createdAt: session.createdAt,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationMs: session.durationMs,
    serverNow,
  };
}

export function isTerminalStatus(status: string): boolean {
  return status === "completed" || status === "gave_up" || status === "abandoned";
}

function isAcceptedDuplicateConstraint(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("uq_session_accepted_qid") ||
      error.message.includes("UNIQUE constraint failed"))
  );
}
