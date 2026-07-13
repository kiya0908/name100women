import { eq } from "drizzle-orm";

import { createDb } from "../db/client";
import { anonymousVisitors } from "../db/schema";

export class VisitorRepository {
  private readonly db;

  constructor(private readonly database: D1Database) {
    this.db = createDb(database);
  }

  async findByTokenHash(tokenHash: string) {
    return (
      await this.db
        .select()
        .from(anonymousVisitors)
        .where(eq(anonymousVisitors.anonymousTokenHash, tokenHash))
        .limit(1)
    )[0] ?? null;
  }

  async create(input: {
    id: string;
    tokenHash: string;
    countryCode: string | null;
    deviceType: string;
    now: string;
  }) {
    await this.db.insert(anonymousVisitors).values({
      id: input.id,
      anonymousTokenHash: input.tokenHash,
      firstSeenAt: input.now,
      lastSeenAt: input.now,
      firstCountryCode: input.countryCode,
      firstDeviceType: input.deviceType,
      createdAt: input.now,
      updatedAt: input.now,
    });

    return this.findByTokenHash(input.tokenHash);
  }

  async touch(id: string, now: string): Promise<void> {
    await this.db
      .update(anonymousVisitors)
      .set({ lastSeenAt: now, updatedAt: now })
      .where(eq(anonymousVisitors.id, id));
  }
}
