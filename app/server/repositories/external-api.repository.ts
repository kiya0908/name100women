import type { ExternalCallTelemetry } from "~/shared/types";
import { randomId } from "~/shared/crypto";

import { createDb } from "../db/client";
import { externalApiCalls } from "../db/schema";

export class ExternalApiRepository {
  private readonly db;

  constructor(database: D1Database) {
    this.db = createDb(database);
  }

  async record(guessId: string, calls: ExternalCallTelemetry[]): Promise<void> {
    if (calls.length === 0) {
      return;
    }

    const createdAt = new Date().toISOString();
    await this.db.insert(externalApiCalls).values(
      calls.map((call) => ({
        id: randomId(),
        guessId,
        provider: call.provider,
        operation: call.operation,
        success: call.success ? 1 : 0,
        statusCode: call.statusCode,
        durationMs: call.durationMs,
        errorCode: call.errorCode,
        requestedAt: call.requestedAt,
        createdAt,
      })),
    );
  }
}
