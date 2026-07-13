import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const anonymousVisitors = sqliteTable(
  "anonymous_visitors",
  {
    id: text("id").primaryKey(),
    anonymousTokenHash: text("anonymous_token_hash").notNull(),
    firstSeenAt: text("first_seen_at").notNull(),
    lastSeenAt: text("last_seen_at").notNull(),
    firstCountryCode: text("first_country_code"),
    firstDeviceType: text("first_device_type"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_anonymous_token_hash").on(table.anonymousTokenHash),
  ],
);

export const gameSessions = sqliteTable(
  "game_sessions",
  {
    id: text("id").primaryKey(),
    anonymousVisitorId: text("anonymous_visitor_id").references(
      () => anonymousVisitors.id,
      { onDelete: "set null" },
    ),
    status: text("status").notNull().default("not_started"),
    createdAt: text("created_at").notNull(),
    startedAt: text("started_at"),
    endedAt: text("ended_at"),
    durationMs: integer("duration_ms"),
    correctCount: integer("correct_count").notNull().default(0),
    rejectedCount: integer("rejected_count").notNull().default(0),
    duplicateCount: integer("duplicate_count").notNull().default(0),
    temporaryErrorCount: integer("temporary_error_count").notNull().default(0),
    countryCode: text("country_code"),
    deviceType: text("device_type"),
    referrer: text("referrer"),
    landingPath: text("landing_path").notNull().default("/"),
    userAgentFamily: text("user_agent_family"),
    ipHash: text("ip_hash"),
    lastActivityAt: text("last_activity_at").notNull(),
    createdAtDb: text("created_at_db").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_sessions_visitor_created").on(
      table.anonymousVisitorId,
      table.createdAt,
    ),
    index("idx_sessions_status_last_activity").on(
      table.status,
      table.lastActivityAt,
    ),
    index("idx_sessions_created").on(table.createdAt),
    check(
      "ck_sessions_status",
      sql`${table.status} in ('not_started','in_progress','completed','gave_up','abandoned')`,
    ),
    check(
      "ck_sessions_counts",
      sql`${table.correctCount} >= 0 and ${table.correctCount} <= 100 and ${table.rejectedCount} >= 0 and ${table.duplicateCount} >= 0 and ${table.temporaryErrorCount} >= 0`,
    ),
  ],
);

export const persons = sqliteTable(
  "persons",
  {
    qid: text("qid").primaryKey(),
    canonicalName: text("canonical_name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    description: text("description"),
    wikipediaTitle: text("wikipedia_title"),
    wikipediaUrl: text("wikipedia_url"),
    primaryLanguage: text("primary_language"),
    isHuman: integer("is_human").notNull(),
    qualifiesAsWoman: integer("qualifies_as_woman").notNull(),
    hasWikipediaSitelink: integer("has_wikipedia_sitelink").notNull(),
    isFictional: integer("is_fictional").notNull(),
    validationStatus: text("validation_status").notNull(),
    validationSource: text("validation_source").notNull(),
    firstVerifiedAt: text("first_verified_at"),
    lastVerifiedAt: text("last_verified_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_persons_normalized_name").on(table.normalizedName),
    index("idx_persons_validation_status").on(
      table.validationStatus,
      table.lastVerifiedAt,
    ),
  ],
);

export const personAliases = sqliteTable(
  "person_aliases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    personQid: text("person_qid")
      .notNull()
      .references(() => persons.qid, { onDelete: "cascade" }),
    alias: text("alias").notNull(),
    normalizedAlias: text("normalized_alias").notNull(),
    aliasType: text("alias_type").notNull(),
    languageCode: text("language_code"),
    source: text("source").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("uq_alias_person_normalized").on(
      table.personQid,
      table.normalizedAlias,
    ),
    index("idx_alias_normalized").on(table.normalizedAlias),
    index("idx_alias_person").on(table.personQid),
  ],
);

export const validationOverrides = sqliteTable(
  "validation_overrides",
  {
    id: text("id").primaryKey(),
    normalizedInput: text("normalized_input"),
    personQid: text("person_qid").references(() => persons.qid, {
      onDelete: "set null",
    }),
    decision: text("decision").notNull(),
    reason: text("reason"),
    canonicalNameOverride: text("canonical_name_override"),
    matchType: text("match_type").notNull(),
    isActive: integer("is_active").notNull().default(1),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_overrides_input_active").on(
      table.normalizedInput,
      table.isActive,
    ),
    index("idx_overrides_qid_active").on(table.personQid, table.isActive),
  ],
);

export const gameGuesses = sqliteTable(
  "game_guesses",
  {
    id: text("id").primaryKey(),
    gameSessionId: text("game_session_id")
      .notNull()
      .references(() => gameSessions.id, { onDelete: "cascade" }),
    sequenceNumber: integer("sequence_number").notNull(),
    rawInput: text("raw_input").notNull(),
    normalizedInput: text("normalized_input").notNull(),
    status: text("status").notNull(),
    failureReason: text("failure_reason"),
    personQid: text("person_qid").references(() => persons.qid, {
      onDelete: "set null",
    }),
    canonicalNameSnapshot: text("canonical_name_snapshot"),
    descriptionSnapshot: text("description_snapshot"),
    responseTimeMs: integer("response_time_ms").notNull(),
    cacheHit: integer("cache_hit").notNull().default(0),
    cacheLayer: text("cache_layer"),
    sourceUsed: text("source_used").notNull(),
    overrideId: text("override_id").references(() => validationOverrides.id, {
      onDelete: "set null",
    }),
    submittedAt: text("submitted_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_guesses_session_sequence").on(
      table.gameSessionId,
      table.sequenceNumber,
    ),
    index("idx_guesses_normalized_status").on(
      table.normalizedInput,
      table.status,
    ),
    index("idx_guesses_person_status").on(table.personQid, table.status),
    index("idx_guesses_submitted").on(table.submittedAt),
    uniqueIndex("uq_session_accepted_qid")
      .on(table.gameSessionId, table.personQid)
      .where(
        sql`${table.status} = 'ACCEPTED' and ${table.personQid} is not null`,
      ),
  ],
);

export const externalApiCalls = sqliteTable(
  "external_api_calls",
  {
    id: text("id").primaryKey(),
    guessId: text("guess_id")
      .notNull()
      .references(() => gameGuesses.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    operation: text("operation").notNull(),
    success: integer("success").notNull(),
    statusCode: integer("status_code"),
    durationMs: integer("duration_ms").notNull(),
    errorCode: text("error_code"),
    requestedAt: text("requested_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_external_guess_provider").on(table.guessId, table.provider),
    index("idx_external_provider_requested").on(
      table.provider,
      table.requestedAt,
    ),
  ],
);

export type AnonymousVisitorRow = typeof anonymousVisitors.$inferSelect;
export type GameSessionRow = typeof gameSessions.$inferSelect;
export type PersonRow = typeof persons.$inferSelect;
export type ValidationOverrideRow = typeof validationOverrides.$inferSelect;
