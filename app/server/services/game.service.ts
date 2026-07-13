import { randomId } from "~/shared/crypto";
import { normalizeName } from "~/shared/normalize";
import type {
  GuessResponse,
  GuessStatus,
  SessionSnapshot,
} from "~/shared/types";

import { ExternalApiRepository } from "../repositories/external-api.repository";
import {
  GameRepository,
  isTerminalStatus,
  toSessionSnapshot,
} from "../repositories/game.repository";
import { RateLimitService } from "./rate-limit.service";
import { ValidationService } from "./validation.service";
import { VisitorService } from "./visitor.service";

export interface StartGameResult {
  body: {
    session: SessionSnapshot;
  };
  setCookie: string | null;
}

export class GameService {
  private readonly games: GameRepository;
  private readonly validation: ValidationService;
  private readonly rateLimit: RateLimitService;
  private readonly externalCalls: ExternalApiRepository;
  private readonly visitors: VisitorService;

  constructor(private readonly env: Env) {
    this.games = new GameRepository(env.DB);
    this.validation = new ValidationService(env.DB, env.CACHE);
    this.rateLimit = new RateLimitService(env.CACHE);
    this.externalCalls = new ExternalApiRepository(env.DB);
    this.visitors = new VisitorService(env.DB, env);
  }

  async start(
    request: Request,
    input: {
      landingPath: string;
      referrer?: string | null;
    },
  ): Promise<StartGameResult> {
    const visitor = await this.visitors.resolve(request);
    const now = new Date().toISOString();
    const session = await this.games.createSession({
      id: randomId(),
      anonymousVisitorId: visitor.visitorId,
      countryCode: visitor.countryCode,
      deviceType: visitor.deviceType,
      referrer: input.referrer ?? request.headers.get("referer"),
      landingPath: input.landingPath,
      userAgentFamily: visitor.userAgentFamily,
      ipHash: visitor.ipHash,
      now,
    });

    return {
      body: { session: toSessionSnapshot(session, now) },
      setCookie: visitor.setCookie,
    };
  }

  async guess(
    sessionId: string,
    rawInput: string,
  ): Promise<GuessResponse> {
    const requestStartedAt = Date.now();
    const session = await this.games.getSession(sessionId);

    if (!session) {
      return {
        status: "SESSION_NOT_FOUND",
        message: messageForStatus("SESSION_NOT_FOUND"),
      };
    }

    if (isTerminalStatus(session.status)) {
      return {
        status: "GAME_FINISHED",
        message: messageForStatus("GAME_FINISHED"),
        session: toSessionSnapshot(session),
      };
    }

    const allowed = await this.rateLimit.allow(
      session.ipHash ?? session.id,
      session.id,
    );
    if (!allowed) {
      return {
        status: "RATE_LIMITED",
        message: messageForStatus("RATE_LIMITED"),
        session: toSessionSnapshot(session),
      };
    }

    const normalizedInput = normalizeName(rawInput);
    const guessId = randomId();
    const resolution = await this.validation.validate(
      rawInput,
      normalizedInput,
    );

    let finalStatus = resolution.status;
    let finalReason = resolution.failureReason;

    if (
      finalStatus === "ACCEPTED" &&
      resolution.person &&
      (await this.games.hasAcceptedPerson(session.id, resolution.person.qid))
    ) {
      finalStatus = "DUPLICATE";
      finalReason = "QID_ALREADY_ACCEPTED";
    }

    const record = await this.games.recordGuess({
      guessId,
      session,
      rawInput,
      normalizedInput,
      status: finalStatus,
      failureReason: finalReason,
      personQid: resolution.person?.qid ?? null,
      canonicalName: resolution.person?.canonicalName ?? null,
      description: resolution.person?.description ?? null,
      responseTimeMs: Date.now() - requestStartedAt,
      cacheHit: resolution.cacheHit,
      cacheLayer: resolution.cacheLayer,
      sourceUsed: resolution.sourceUsed,
      overrideId: resolution.overrideId ?? null,
      now: new Date().toISOString(),
    });

    try {
      await this.externalCalls.record(guessId, resolution.telemetry);
    } catch (error) {
      console.error("Failed to persist external API telemetry", error);
    }

    return {
      status: record.status,
      message: messageForStatus(record.status),
      person:
        record.status === "ACCEPTED" || record.status === "DUPLICATE"
          ? resolution.person ?? undefined
          : undefined,
      session: record.session,
      sequenceNumber: record.sequenceNumber,
    };
  }

  async end(
    sessionId: string,
    reason: "gave_up" | "abandoned",
  ): Promise<GuessResponse> {
    const session = await this.games.getSession(sessionId);
    if (!session) {
      return {
        status: "SESSION_NOT_FOUND",
        message: messageForStatus("SESSION_NOT_FOUND"),
      };
    }

    const ended = await this.games.endSession(
      session,
      reason,
      new Date().toISOString(),
    );

    return {
      status: "GAME_FINISHED",
      message:
        reason === "abandoned"
          ? "This game was closed."
          : "Game ended. Your result is ready.",
      session: ended,
    };
  }
}

export function messageForStatus(status: GuessStatus): string {
  const messages: Record<GuessStatus, string> = {
    ACCEPTED: "Accepted.",
    DUPLICATE: "You already named this person.",
    NOT_FOUND: "We could not verify that name. Check the spelling or try a fuller name.",
    NOT_A_PERSON: "That result does not appear to be a real person.",
    NOT_A_WOMAN: "Public data does not identify that person as a woman.",
    FICTIONAL: "Fictional characters do not count in this version.",
    AMBIGUOUS: "That name matches more than one person. Try a full name.",
    TEMPORARY_ERROR: "The verification service is temporarily unavailable. Try again.",
    INVALID_REQUEST: "Enter a valid name.",
    RATE_LIMITED: "Too many requests. Pause briefly and try again.",
    SESSION_NOT_FOUND: "This game session was not found. Start a new game.",
    GAME_FINISHED: "This game has already ended.",
  };

  return messages[status];
}

