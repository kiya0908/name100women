import type { PersonRow, ValidationOverrideRow } from "../db/schema";
import type {
  GuessStatus,
  PersonSnapshot,
  ValidationResolution,
} from "~/shared/types";

import { normalizeDisplayName } from "~/shared/normalize";

import { WikipediaClient } from "../external/wikipedia-api";
import { WikidataClient, type WikidataPerson } from "../external/wikidata-api";
import {
  PersonRepository,
  type PersistedPerson,
} from "../repositories/person.repository";
import { OverrideRepository } from "../repositories/override.repository";
import { CacheService, type CachedPerson } from "./cache.service";

export class ValidationService {
  private readonly cache: CacheService;
  private readonly people: PersonRepository;
  private readonly overrides: OverrideRepository;
  private readonly wikipedia = new WikipediaClient();
  private readonly wikidata = new WikidataClient();

  constructor(
    database: D1Database,
    kv: KVNamespace,
  ) {
    this.cache = new CacheService(kv);
    this.people = new PersonRepository(database);
    this.overrides = new OverrideRepository(database);
  }

  async validate(
    rawInput: string,
    normalizedInput: string,
  ): Promise<ValidationResolution> {
    const inputOverride = await this.overrides.findByInput(normalizedInput);
    if (inputOverride) {
      return this.resolveInputOverride(inputOverride, rawInput);
    }

    const negative = await this.cache.getNegative(normalizedInput);
    if (negative) {
      return rejected(negative, "NEGATIVE_CACHE", "kv");
    }

    const cachedAlias = await this.cache.getAlias(normalizedInput);
    if (cachedAlias?.type === "ambiguous") {
      return rejected("AMBIGUOUS", "CACHED_AMBIGUOUS", "kv");
    }

    if (cachedAlias?.type === "resolved") {
      const cachedPerson = await this.cache.getPerson(cachedAlias.qid);
      if (cachedPerson) {
        return this.resolveCachedPerson(cachedPerson);
      }

      const d1Person = await this.people.findByQid(cachedAlias.qid);
      if (d1Person) {
        return this.resolveD1Person(d1Person, "kv");
      }
    }

    const localCandidates = await this.people.findByAlias(normalizedInput);
    if (localCandidates.length > 1) {
      await this.cache.putAmbiguousAlias(
        normalizedInput,
        localCandidates.map((person) => person.qid),
      );
      return rejected("AMBIGUOUS", "MULTIPLE_LOCAL_QIDS", "d1");
    }

    if (localCandidates.length === 1) {
      const person = localCandidates[0];
      await this.cache.putResolvedAlias(normalizedInput, person.qid);
      await this.cache.putPerson(toCachedPerson(person));
      return this.resolveD1Person(person, "d1");
    }

    const discovery = await this.wikipedia.discover(rawInput);
    if (discovery.status !== "FOUND" || !discovery.candidate) {
      const status = discovery.status as GuessStatus;
      if (status !== "TEMPORARY_ERROR") {
        await this.cache.putNegative(normalizedInput, status);
      }
      return {
        ...rejected(status, `WIKIPEDIA_${discovery.status}`, null),
        sourceUsed: "wikipedia_wikidata",
        telemetry: discovery.telemetry,
      };
    }

    const qidOverride = await this.overrides.findByQid(
      discovery.candidate.qid,
    );
    const details = await this.wikidata.getPerson(discovery.candidate.qid);
    const telemetry = [...discovery.telemetry, ...details.telemetry];

    if (details.status !== "FOUND" || !details.person) {
      const status =
        details.status === "TEMPORARY_ERROR"
          ? "TEMPORARY_ERROR"
          : "NOT_FOUND";
      if (status !== "TEMPORARY_ERROR") {
        await this.cache.putNegative(normalizedInput, status);
      }
      return {
        ...rejected(status, `WIKIDATA_${details.status}`, null),
        sourceUsed: "wikipedia_wikidata",
        telemetry,
      };
    }

    if (qidOverride) {
      return this.resolveQidOverride(
        qidOverride,
        details.person,
        discovery.candidate,
        normalizedInput,
        telemetry,
      );
    }

    const status = classifyPerson(details.person);
    const now = new Date().toISOString();
    const persisted: PersistedPerson = {
      qid: details.person.qid,
      canonicalName: details.person.canonicalName,
      description:
        details.person.description ?? discovery.candidate.description,
      wikipediaTitle: discovery.candidate.title,
      wikipediaUrl: discovery.candidate.wikipediaUrl,
      primaryLanguage: "en",
      isHuman: details.person.isHuman,
      qualifiesAsWoman: details.person.qualifiesAsWoman,
      hasWikipediaSitelink: details.person.hasWikipediaSitelink,
      isFictional: details.person.isFictional,
      validationStatus: status === "ACCEPTED" ? "verified" : "rejected",
      validationSource: "wikipedia_wikidata",
      firstVerifiedAt: now,
      lastVerifiedAt: now,
    };

    const aliases = uniqueAliases([
      details.person.canonicalName,
      discovery.candidate.title,
      ...discovery.candidate.aliases,
      normalizeDisplayName(rawInput),
    ]);

    await this.people.upsert(
      persisted,
      aliases.map((alias, index) => ({
        alias,
        aliasType: index === 0 ? "canonical" : "alias",
        languageCode: "en",
        source: "wikipedia",
      })),
    );
    await this.cache.putPerson(toCachedPerson(persisted));
    await this.cache.putResolvedAlias(normalizedInput, persisted.qid);

    if (status !== "ACCEPTED") {
      await this.cache.putNegative(normalizedInput, status);
    }

    return {
      status,
      failureReason: status === "ACCEPTED" ? null : status,
      person: toSnapshot(persisted),
      aliases,
      sourceUsed: "wikipedia_wikidata",
      cacheHit: false,
      cacheLayer: null,
      telemetry,
    };
  }

  private async resolveInputOverride(
    override: ValidationOverrideRow,
    rawInput: string,
  ): Promise<ValidationResolution> {
    if (override.decision !== "ACCEPT") {
      return {
        ...rejected(
          override.decision === "AMBIGUOUS"
            ? "AMBIGUOUS"
            : overrideReasonStatus(override.reason),
          override.reason ?? "MANUAL_OVERRIDE",
          null,
        ),
        sourceUsed: "override",
        overrideId: override.id,
      };
    }

    if (!override.personQid) {
      return {
        ...rejected("AMBIGUOUS", "ACCEPT_OVERRIDE_WITHOUT_QID", null),
        sourceUsed: "override",
        overrideId: override.id,
      };
    }

    const existing = await this.people.findByQid(override.personQid);
    if (existing) {
      const person = rowToPersisted(existing);
      if (override.canonicalNameOverride) {
        person.canonicalName = override.canonicalNameOverride;
      }
      return {
        status: "ACCEPTED",
        failureReason: null,
        person: toSnapshot(person),
        aliases: [rawInput],
        sourceUsed: "override",
        cacheHit: false,
        cacheLayer: null,
        telemetry: [],
        overrideId: override.id,
      };
    }

    const details = await this.wikidata.getPerson(override.personQid);
    if (details.status !== "FOUND" || !details.person) {
      return {
        ...rejected(
          details.status === "TEMPORARY_ERROR"
            ? "TEMPORARY_ERROR"
            : "NOT_FOUND",
          "OVERRIDE_QID_LOOKUP_FAILED",
          null,
        ),
        sourceUsed: "override",
        telemetry: details.telemetry,
        overrideId: override.id,
      };
    }

    const now = new Date().toISOString();
    const persisted: PersistedPerson = {
      qid: details.person.qid,
      canonicalName:
        override.canonicalNameOverride ?? details.person.canonicalName,
      description: details.person.description,
      wikipediaTitle: null,
      wikipediaUrl: null,
      primaryLanguage: "en",
      isHuman: true,
      qualifiesAsWoman: true,
      hasWikipediaSitelink: details.person.hasWikipediaSitelink,
      isFictional: false,
      validationStatus: "verified",
      validationSource: "manual_override",
      firstVerifiedAt: now,
      lastVerifiedAt: now,
    };

    await this.people.upsert(persisted, [
      {
        alias: rawInput,
        aliasType: "manual",
        languageCode: "en",
        source: "manual",
      },
    ]);

    return {
      status: "ACCEPTED",
      failureReason: null,
      person: toSnapshot(persisted),
      aliases: [rawInput],
      sourceUsed: "override",
      cacheHit: false,
      cacheLayer: null,
      telemetry: details.telemetry,
      overrideId: override.id,
    };
  }

  private async resolveQidOverride(
    override: ValidationOverrideRow,
    person: WikidataPerson,
    candidate: {
      title: string;
      description: string | null;
      wikipediaUrl: string;
      aliases: string[];
    },
    normalizedInput: string,
    telemetry: ValidationResolution["telemetry"],
  ): Promise<ValidationResolution> {
    if (override.decision !== "ACCEPT") {
      const status =
        override.decision === "AMBIGUOUS"
          ? "AMBIGUOUS"
          : overrideReasonStatus(override.reason);
      await this.cache.putNegative(normalizedInput, status);
      return {
        ...rejected(status, override.reason ?? "QID_OVERRIDE", null),
        sourceUsed: "override",
        telemetry,
        overrideId: override.id,
      };
    }

    const now = new Date().toISOString();
    const persisted: PersistedPerson = {
      qid: person.qid,
      canonicalName: override.canonicalNameOverride ?? person.canonicalName,
      description: person.description ?? candidate.description,
      wikipediaTitle: candidate.title,
      wikipediaUrl: candidate.wikipediaUrl,
      primaryLanguage: "en",
      isHuman: true,
      qualifiesAsWoman: true,
      hasWikipediaSitelink: true,
      isFictional: false,
      validationStatus: "verified",
      validationSource: "manual_override",
      firstVerifiedAt: now,
      lastVerifiedAt: now,
    };

    await this.people.upsert(
      persisted,
      uniqueAliases([persisted.canonicalName, ...candidate.aliases]).map(
        (alias, index) => ({
          alias,
          aliasType: index === 0 ? "canonical" : "manual",
          languageCode: "en",
          source: "manual",
        }),
      ),
    );
    await this.cache.putResolvedAlias(normalizedInput, persisted.qid);
    await this.cache.putPerson(toCachedPerson(persisted));

    return {
      status: "ACCEPTED",
      failureReason: null,
      person: toSnapshot(persisted),
      aliases: candidate.aliases,
      sourceUsed: "override",
      cacheHit: false,
      cacheLayer: null,
      telemetry,
      overrideId: override.id,
    };
  }

  private resolveCachedPerson(person: CachedPerson): ValidationResolution {
    const status = classifyPerson(person);
    return {
      status,
      failureReason: status === "ACCEPTED" ? null : status,
      person: toSnapshot(person),
      aliases: [],
      sourceUsed: "kv",
      cacheHit: true,
      cacheLayer: "kv",
      telemetry: [],
    };
  }

  private resolveD1Person(
    person: PersonRow,
    discoveredThrough: "kv" | "d1",
  ): ValidationResolution {
    const persisted = rowToPersisted(person);
    const status = classifyPerson(persisted);
    return {
      status,
      failureReason: status === "ACCEPTED" ? null : status,
      person: toSnapshot(persisted),
      aliases: [],
      sourceUsed: "d1",
      cacheHit: true,
      cacheLayer: discoveredThrough,
      telemetry: [],
    };
  }
}

export function classifyPerson(person: {
  isHuman: boolean;
  qualifiesAsWoman: boolean;
  hasWikipediaSitelink: boolean;
  isFictional: boolean;
}): GuessStatus {
  if (person.isFictional) return "FICTIONAL";
  if (!person.isHuman) return "NOT_A_PERSON";
  if (!person.qualifiesAsWoman) return "NOT_A_WOMAN";
  if (!person.hasWikipediaSitelink) return "NOT_FOUND";
  return "ACCEPTED";
}

function rejected(
  status: GuessStatus,
  failureReason: string,
  cacheLayer: "kv" | "d1" | null,
): ValidationResolution {
  return {
    status,
    failureReason,
    person: null,
    aliases: [],
    sourceUsed: cacheLayer === "kv" ? "kv" : cacheLayer === "d1" ? "d1" : "none",
    cacheHit: cacheLayer !== null,
    cacheLayer,
    telemetry: [],
  };
}

function overrideReasonStatus(reason: string | null): GuessStatus {
  const allowed: GuessStatus[] = [
    "NOT_FOUND",
    "NOT_A_PERSON",
    "NOT_A_WOMAN",
    "FICTIONAL",
    "AMBIGUOUS",
  ];
  return allowed.includes(reason as GuessStatus)
    ? (reason as GuessStatus)
    : "NOT_FOUND";
}

function rowToPersisted(person: PersonRow): PersistedPerson {
  return {
    qid: person.qid,
    canonicalName: person.canonicalName,
    description: person.description,
    wikipediaTitle: person.wikipediaTitle,
    wikipediaUrl: person.wikipediaUrl,
    primaryLanguage: person.primaryLanguage,
    isHuman: person.isHuman === 1,
    qualifiesAsWoman: person.qualifiesAsWoman === 1,
    hasWikipediaSitelink: person.hasWikipediaSitelink === 1,
    isFictional: person.isFictional === 1,
    validationStatus: person.validationStatus as PersistedPerson["validationStatus"],
    validationSource: person.validationSource as PersistedPerson["validationSource"],
    firstVerifiedAt: person.firstVerifiedAt,
    lastVerifiedAt: person.lastVerifiedAt,
  };
}

function toCachedPerson(
  person: PersistedPerson | PersonRow,
): CachedPerson {
  if ("isHuman" in person && typeof person.isHuman === "number") {
    const converted = rowToPersisted(person as PersonRow);
    return {
      qid: converted.qid,
      canonicalName: converted.canonicalName,
      description: converted.description,
      wikipediaTitle: converted.wikipediaTitle,
      wikipediaUrl: converted.wikipediaUrl,
      primaryLanguage: converted.primaryLanguage,
      isHuman: converted.isHuman,
      qualifiesAsWoman: converted.qualifiesAsWoman,
      hasWikipediaSitelink: converted.hasWikipediaSitelink,
      isFictional: converted.isFictional,
      validationStatus: converted.validationStatus,
      lastVerifiedAt: converted.lastVerifiedAt,
    };
  }

  const persisted = person as PersistedPerson;
  return {
    qid: persisted.qid,
    canonicalName: persisted.canonicalName,
    description: persisted.description,
    wikipediaTitle: persisted.wikipediaTitle,
    wikipediaUrl: persisted.wikipediaUrl,
    primaryLanguage: persisted.primaryLanguage,
    isHuman: persisted.isHuman,
    qualifiesAsWoman: persisted.qualifiesAsWoman,
    hasWikipediaSitelink: persisted.hasWikipediaSitelink,
    isFictional: persisted.isFictional,
    validationStatus: persisted.validationStatus,
    lastVerifiedAt: persisted.lastVerifiedAt,
  };
}

function toSnapshot(
  person: PersistedPerson | CachedPerson,
): PersonSnapshot {
  return {
    qid: person.qid,
    canonicalName: person.canonicalName,
    description: person.description,
    wikipediaUrl: person.wikipediaUrl,
  };
}

function uniqueAliases(values: string[]): string[] {
  const aliases = new Map<string, string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed) {
      aliases.set(trimmed.toLocaleLowerCase("en-US"), trimmed);
    }
  }
  return [...aliases.values()];
}
