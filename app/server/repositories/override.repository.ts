import { and, eq } from "drizzle-orm";

import { createDb } from "../db/client";
import {
  validationOverrides,
  type ValidationOverrideRow,
} from "../db/schema";

export class OverrideRepository {
  private readonly db;

  constructor(database: D1Database) {
    this.db = createDb(database);
  }

  async findByInput(
    normalizedInput: string,
  ): Promise<ValidationOverrideRow | null> {
    return (
      await this.db
        .select()
        .from(validationOverrides)
        .where(
          and(
            eq(validationOverrides.matchType, "exact_normalized_input"),
            eq(validationOverrides.normalizedInput, normalizedInput),
            eq(validationOverrides.isActive, 1),
          ),
        )
        .limit(1)
    )[0] ?? null;
  }

  async findByQid(qid: string): Promise<ValidationOverrideRow | null> {
    return (
      await this.db
        .select()
        .from(validationOverrides)
        .where(
          and(
            eq(validationOverrides.matchType, "person_qid"),
            eq(validationOverrides.personQid, qid),
            eq(validationOverrides.isActive, 1),
          ),
        )
        .limit(1)
    )[0] ?? null;
  }
}
