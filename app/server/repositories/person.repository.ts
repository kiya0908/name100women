import { eq } from "drizzle-orm";

import { normalizeName } from "~/shared/normalize";

import { createDb } from "../db/client";
import { personAliases, persons, type PersonRow } from "../db/schema";

export interface PersistedPerson {
  qid: string;
  canonicalName: string;
  description: string | null;
  wikipediaTitle: string | null;
  wikipediaUrl: string | null;
  primaryLanguage: string | null;
  isHuman: boolean;
  qualifiesAsWoman: boolean;
  hasWikipediaSitelink: boolean;
  isFictional: boolean;
  validationStatus: "verified" | "rejected" | "uncertain" | "stale";
  validationSource: "seed" | "wikipedia_wikidata" | "manual_override" | "import";
  firstVerifiedAt: string | null;
  lastVerifiedAt: string | null;
}

export class PersonRepository {
  private readonly db;

  constructor(database: D1Database) {
    this.db = createDb(database);
  }

  async findByQid(qid: string): Promise<PersonRow | null> {
    return (
      await this.db.select().from(persons).where(eq(persons.qid, qid)).limit(1)
    )[0] ?? null;
  }

  async findByAlias(normalizedAlias: string): Promise<PersonRow[]> {
    const rows = await this.db
      .select({ person: persons })
      .from(personAliases)
      .innerJoin(persons, eq(personAliases.personQid, persons.qid))
      .where(eq(personAliases.normalizedAlias, normalizedAlias));

    const unique = new Map<string, PersonRow>();
    for (const row of rows) {
      unique.set(row.person.qid, row.person);
    }
    return [...unique.values()];
  }

  async upsert(
    person: PersistedPerson,
    aliases: Array<{
      alias: string;
      aliasType: "canonical" | "alias" | "stage_name" | "birth_name" | "redirect" | "transliteration" | "manual";
      languageCode?: string | null;
      source: string;
    }>,
  ): Promise<void> {
    const now = new Date().toISOString();

    await this.db
      .insert(persons)
      .values({
        qid: person.qid,
        canonicalName: person.canonicalName,
        normalizedName: normalizeName(person.canonicalName),
        description: person.description,
        wikipediaTitle: person.wikipediaTitle,
        wikipediaUrl: person.wikipediaUrl,
        primaryLanguage: person.primaryLanguage,
        isHuman: person.isHuman ? 1 : 0,
        qualifiesAsWoman: person.qualifiesAsWoman ? 1 : 0,
        hasWikipediaSitelink: person.hasWikipediaSitelink ? 1 : 0,
        isFictional: person.isFictional ? 1 : 0,
        validationStatus: person.validationStatus,
        validationSource: person.validationSource,
        firstVerifiedAt: person.firstVerifiedAt,
        lastVerifiedAt: person.lastVerifiedAt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: persons.qid,
        set: {
          canonicalName: person.canonicalName,
          normalizedName: normalizeName(person.canonicalName),
          description: person.description,
          wikipediaTitle: person.wikipediaTitle,
          wikipediaUrl: person.wikipediaUrl,
          primaryLanguage: person.primaryLanguage,
          isHuman: person.isHuman ? 1 : 0,
          qualifiesAsWoman: person.qualifiesAsWoman ? 1 : 0,
          hasWikipediaSitelink: person.hasWikipediaSitelink ? 1 : 0,
          isFictional: person.isFictional ? 1 : 0,
          validationStatus: person.validationStatus,
          validationSource: person.validationSource,
          lastVerifiedAt: person.lastVerifiedAt,
          updatedAt: now,
        },
      });

    const values = aliases
      .filter((item) => item.alias.trim().length > 0)
      .map((item) => ({
        personQid: person.qid,
        alias: item.alias,
        normalizedAlias: normalizeName(item.alias),
        aliasType: item.aliasType,
        languageCode: item.languageCode ?? "en",
        source: item.source,
        createdAt: now,
        updatedAt: now,
      }));

    if (values.length > 0) {
      await this.db
        .insert(personAliases)
        .values(values)
        .onConflictDoNothing();
    }
  }
}
