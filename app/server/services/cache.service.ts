import { z } from "zod";

import {
  ALIAS_CACHE_TTL_SECONDS,
  NEGATIVE_CACHE_TTL_SECONDS,
  NORMALIZATION_VERSION,
  PERSON_CACHE_TTL_SECONDS,
} from "~/shared/constants";
import type { GuessStatus } from "~/shared/types";

const aliasCacheSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("resolved"),
    qid: z.string(),
    cachedAt: z.string(),
  }),
  z.object({
    type: z.literal("ambiguous"),
    qids: z.array(z.string()),
    cachedAt: z.string(),
  }),
]);

const negativeCacheSchema = z.object({
  status: z.enum([
    "NOT_FOUND",
    "NOT_A_PERSON",
    "NOT_A_WOMAN",
    "FICTIONAL",
    "AMBIGUOUS",
  ]),
  cachedAt: z.string(),
});

const personCacheSchema = z.object({
  qid: z.string(),
  canonicalName: z.string(),
  description: z.string().nullable(),
  wikipediaTitle: z.string().nullable(),
  wikipediaUrl: z.string().nullable(),
  primaryLanguage: z.string().nullable(),
  isHuman: z.boolean(),
  qualifiesAsWoman: z.boolean(),
  hasWikipediaSitelink: z.boolean(),
  isFictional: z.boolean(),
  validationStatus: z.enum(["verified", "rejected", "uncertain", "stale"]),
  lastVerifiedAt: z.string().nullable(),
});

export type CachedPerson = z.infer<typeof personCacheSchema>;

export class CacheService {
  constructor(private readonly kv: KVNamespace) {}

  async getAlias(normalizedInput: string) {
    try {
      const raw = await this.kv.get(aliasKey(normalizedInput));
      if (!raw) {
        return null;
      }
      const parsed = aliasCacheSchema.safeParse(parseJson(raw));
      return parsed.success ? parsed.data : null;
    } catch (error) {
      console.error("Alias cache read failed", error);
      return null;
    }
  }

  async getNegative(normalizedInput: string): Promise<GuessStatus | null> {
    try {
      const raw = await this.kv.get(negativeKey(normalizedInput));
      if (!raw) {
        return null;
      }
      const parsed = negativeCacheSchema.safeParse(parseJson(raw));
      return parsed.success ? parsed.data.status : null;
    } catch (error) {
      console.error("Negative cache read failed", error);
      return null;
    }
  }

  async getPerson(qid: string): Promise<CachedPerson | null> {
    try {
      const raw = await this.kv.get(personKey(qid));
      if (!raw) {
        return null;
      }
      const parsed = personCacheSchema.safeParse(parseJson(raw));
      return parsed.success ? parsed.data : null;
    } catch (error) {
      console.error("Person cache read failed", error);
      return null;
    }
  }

  async putResolvedAlias(normalizedInput: string, qid: string): Promise<void> {
    await this.put(
      aliasKey(normalizedInput),
      {
        type: "resolved",
        qid,
        cachedAt: new Date().toISOString(),
      },
      ALIAS_CACHE_TTL_SECONDS,
    );
  }

  async putAmbiguousAlias(
    normalizedInput: string,
    qids: string[],
  ): Promise<void> {
    await this.put(
      aliasKey(normalizedInput),
      {
        type: "ambiguous",
        qids,
        cachedAt: new Date().toISOString(),
      },
      NEGATIVE_CACHE_TTL_SECONDS,
    );
  }

  async putNegative(
    normalizedInput: string,
    status: GuessStatus,
  ): Promise<void> {
    if (
      ![
        "NOT_FOUND",
        "NOT_A_PERSON",
        "NOT_A_WOMAN",
        "FICTIONAL",
        "AMBIGUOUS",
      ].includes(status)
    ) {
      return;
    }

    await this.put(
      negativeKey(normalizedInput),
      { status, cachedAt: new Date().toISOString() },
      NEGATIVE_CACHE_TTL_SECONDS,
    );
  }

  async putPerson(person: CachedPerson): Promise<void> {
    await this.put(personKey(person.qid), person, PERSON_CACHE_TTL_SECONDS);
  }

  private async put(
    key: string,
    value: unknown,
    expirationTtl: number,
  ): Promise<void> {
    try {
      await this.kv.put(key, JSON.stringify(value), { expirationTtl });
    } catch (error) {
      console.error("Cache write failed", error);
    }
  }
}

function aliasKey(normalizedInput: string): string {
  return `alias:${NORMALIZATION_VERSION}:${normalizedInput}`;
}

function negativeKey(normalizedInput: string): string {
  return `negative:${NORMALIZATION_VERSION}:${normalizedInput}`;
}

function personKey(qid: string): string {
  return `person:${qid}`;
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}
